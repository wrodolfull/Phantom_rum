import Phaser from "phaser";
import type * as T from "three";
import {retroAudio} from "../audio/RetroAudio";
import {progressStore} from "../progression/progress";
import {activeAppearance} from "../shop/economy";
import {createChaseEnvironment,createChaseGhost,createChaseHunter,createChaseHazard,
  updateChaseEnvironment,type ChaseEnvironment} from "./chaseArt";
import {chaseRegionName,type RegionIndex} from "./chaseRegions";
import {ChaseEffects,animateChaseHazard,chaseCameraOffset} from "./chaseFx";
import {ChaseInput} from "../input/ChaseInput";
import {reportMode,reportChaseError,reportChaseSeconds} from "../game/diagnostics";
import {ChaseClock} from "../game/ChaseClock";
import {
  CHASE_END_PX,CHASE_WORLD_SPEED,chaseCompleted,mergeRun,asRunStats,chaseCollision,waveAt,
  advanceChaseHazard,CHASE_DESPAWN_Z,
  type ChaseObject,type RunSnapshot
} from "../game/modes";

const WIDTH=480,HEIGHT=270;
const PLAYER_Z=2.25;
const LANE_X=[-2.4,0,2.4] as const;
type Hazard={obstacle:ChaseObject;model:T.Group};
type ThreeApi=typeof import("three");

export class ChaseScene extends Phaser.Scene {
  private run!:RunSnapshot;
  private three?:ThreeApi;
  private world?:T.Scene;
  private camera?:T.PerspectiveCamera;
  private threeRenderer?:T.WebGLRenderer;
  private ghost?:T.Group;
  private hunter?:T.Group;
  private ghostMaterial?:T.MeshStandardMaterial;
  private heroColor=0xffffff;
  private environment?:ChaseEnvironment;
  private ghostHalo?:T.Object3D;
  private chaseFx?:ChaseEffects;
  private laneImpulse=0;
  private lastRegion:RegionIndex=0;
  private regionNoticeUntil=0;
  private hazards:Hazard[]=[];
  private gesture!:ChaseInput;
  private overlay?:HTMLDivElement;
  private statsElement?:HTMLElement;
  private energyElement?:HTMLElement;
  private chaseElement?:HTMLElement;
  private hintElement?:HTMLElement;
  private pauseButton?:HTMLButtonElement;
  private lane:0|1|2=1;
  private jumpHeight=0;
  private jumpVelocity=0;
  private clock=new ChaseClock();
  private timeAlive=0;
  private activeSeconds=0;
  private initialDistance=0;
  private readyAtWall=0;
  private validFinish=false;
  private blockedPrematureReturn=false;
  private fallbackStarted=false;
  private spawnClock=0;
  private spawnIndex=0;
  private hunterPressure=.16;
  private intangible=false;
  private heldPhase=false;
  private phaseLocked=false;
  private paused=false;
  private returning=false;
  private returningTime=0;
  private ready=false;
  private ended=false;
  private hudClock=0;
  private hitFlash=0;
  private keys?:{
    left:Phaser.Input.Keyboard.Key;right:Phaser.Input.Keyboard.Key;
    a:Phaser.Input.Keyboard.Key;d:Phaser.Input.Keyboard.Key;
    space:Phaser.Input.Keyboard.Key;up:Phaser.Input.Keyboard.Key;
    shift:Phaser.Input.Keyboard.Key;esc:Phaser.Input.Keyboard.Key;
    music:Phaser.Input.Keyboard.Key;effects:Phaser.Input.Keyboard.Key
  };

  constructor(){super("chase");}
  init(data:RunSnapshot){this.run={...data,chaseDone:true};}
  async create(){
    this.lane=1;this.jumpHeight=0;this.jumpVelocity=0;this.timeAlive=0;
    this.spawnClock=0;this.spawnIndex=0;
    this.hunterPressure=Math.max(.11,Math.min(.95,(this.run.hunterDanger??16)/100));
    this.activeSeconds=0;this.fallbackStarted=false;
    this.initialDistance=this.run.distancePx;
    this.readyAtWall=0;this.validFinish=false;
    this.blockedPrematureReturn=false;
    this.intangible=false;this.heldPhase=false;this.phaseLocked=false;
    this.paused=false;this.returning=false;this.returningTime=0;
    this.ready=false;this.ended=false;this.hudClock=0;this.hitFlash=0;
    this.environment=undefined;this.ghostHalo=undefined;this.hazards=[];
    this.chaseFx=undefined;this.laneImpulse=0;
    this.lastRegion=0;this.regionNoticeUntil=0;
    this.clock.reset(performance.now());
    reportMode("chase-loading","Three.js import pending");
    retroAudio.start();
    this.createHud();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.cleanup());
    this.installControls();

    try{
      if(new URLSearchParams(location.search).has("force_compat")){
        // Defer the handoff until Phaser completes its create() lifecycle.
        await Promise.resolve();
        this.useCompatibilityMode(new Error("QA requested compatible renderer"));
        return;
      }
      // On-demand module: Phaser-only sessions do not load Three.js.
      const THREE=await import("three");
      if(!this.sys.isActive())return;
      this.three=THREE;
      this.createWorld(THREE);
      this.ready=true;
      this.readyAtWall=Date.now();
      this.clock.reset(Date.now());
      reportMode("chase-three","WebGL initialized");
    }catch(error){
      this.useCompatibilityMode(error);
    }
  }
  /** Never skip the 3D segment merely because a GPU/driver rejected WebGL. */
  private useCompatibilityMode(error:unknown){
    if(this.fallbackStarted||!this.sys.isActive())return;
    this.fallbackStarted=true;
    reportChaseError("Three.js start/render",error);
    reportMode("chase-loading","switch to compatible perspective");
    console.warn("[Phantom Run] 3D renderer unavailable; using playable 2.5D chase",error);
    this.ready=false;
    this.gesture?.clear();
    this.scene.start("chase-fallback",{
      run:{...this.run,energy:this.run.energy,chaseDone:true,
        hunterDanger:Math.round(this.hunterPressure*100)},
      reason:error instanceof Error?error.message:String(error)
    });
  }
  private onContextLost=(event:Event)=>{
    event.preventDefault();
    this.useCompatibilityMode("WebGL context lost during chase");
  };
  private createHud(){
    const ui=document.createElement("div");
    ui.id="chase-ui";
    ui.innerHTML=`
      <div class="chase-hud">
        <div class="chase-left">
          <div class="chase-label">PERSEGUIÇÃO 3D</div>
          <div class="chase-score" id="chase-score">800 m　◆ 0</div>
          <div class="chase-ep"><div id="chase-energy"></div></div>
        </div>
        <div class="chase-right">
          <span class="chase-danger">CAÇADOR <span id="chase-danger">16%</span></span>
          <button id="chase-pause" type="button" aria-label="Pausar perseguição">Ⅱ</button>
        </div>
      </div>
      <div id="chase-message" class="chase-message">A CÂMERA ESTÁ VIRANDO... PREPARE-SE!</div>
      <div class="chase-help">DESLIZE ← → PARA DESVIAR　•　TOQUE: PULA　•　SEGURE: INTANGÍVEL</div>
    `;
    document.getElementById("game-shell")?.appendChild(ui);
    this.overlay=ui;
    this.statsElement=ui.querySelector("#chase-score")??undefined;
    this.energyElement=ui.querySelector("#chase-energy")??undefined;
    this.chaseElement=ui.querySelector("#chase-danger")??undefined;
    this.hintElement=ui.querySelector("#chase-message")??undefined;
    this.pauseButton=ui.querySelector<HTMLButtonElement>("#chase-pause")??undefined;
    this.pauseButton?.addEventListener("click",this.onPauseClick);
    this.updateHud();
  }
  private onPauseClick=()=>this.togglePause();
  private onBackground=()=>{if(this.sys.isActive()&&!this.paused)this.togglePause();};
  private onVisibility=()=>{if(document.hidden)this.onBackground();};
  private installControls(){
    this.gesture=new ChaseInput({
      jump:()=>this.jump(),
      phase:(held)=>{this.heldPhase=held;},
      lane:(direction)=>this.shiftLane(direction)
    });
    this.keys=this.input.keyboard!.addKeys({
      left:Phaser.Input.Keyboard.KeyCodes.LEFT,
      right:Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a:Phaser.Input.Keyboard.KeyCodes.A,d:Phaser.Input.Keyboard.KeyCodes.D,
      space:Phaser.Input.Keyboard.KeyCodes.SPACE,
      up:Phaser.Input.Keyboard.KeyCodes.UP,
      shift:Phaser.Input.Keyboard.KeyCodes.SHIFT,
      esc:Phaser.Input.Keyboard.KeyCodes.ESC,
      music:Phaser.Input.Keyboard.KeyCodes.M,
      effects:Phaser.Input.Keyboard.KeyCodes.N
    }) as typeof this.keys;
    this.input.addPointer(3);
    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>{
      if(!this.ready||this.paused||this.returning||p.y<38)return;
      this.gesture.press(p.id,p.x,p.y,performance.now());
    });
    this.input.on("pointermove",(p:Phaser.Input.Pointer)=>this.gesture.move(p.id,p.x,p.y));
    this.input.on("pointerup",(p:Phaser.Input.Pointer)=>this.gesture.release(p.id,performance.now()));
    this.input.on("pointerupoutside",(p:Phaser.Input.Pointer)=>this.gesture.cancel(p.id));
    window.addEventListener("blur",this.onBackground);
    document.addEventListener("visibilitychange",this.onVisibility);
  }
  private jump(){
    if(!this.ready||this.paused||this.returning||this.jumpHeight>.03||this.jumpVelocity>.03)return;
    this.jumpVelocity=6.6;
    this.run.jumps++;
    this.chaseFx?.emit("jump",this.ghost?.position.x??0,.2,PLAYER_Z,8);
    retroAudio.play("jump");
  }
  private shiftLane(direction:-1|1){
    if(!this.ready||this.paused||this.returning)return;
    const next=Phaser.Math.Clamp(this.lane+direction,0,2) as 0|1|2;
    if(next===this.lane)return;
    this.lane=next;
    this.laneImpulse=direction;
    this.chaseFx?.emit("lane",this.ghost?.position.x??0,.9,PLAYER_Z,5);
  }
  private togglePause(){
    if(this.returning||this.ended)return;
    this.paused=!this.paused;
    this.clock.resume(Date.now());
    retroAudio.pause(this.paused);
    this.gesture.clear();this.heldPhase=false;
    if(this.pauseButton){
      this.pauseButton.textContent=this.paused?"▶":"Ⅱ";
      this.pauseButton.setAttribute("aria-label",this.paused?"Continuar perseguição":"Pausar perseguição");
    }
    if(this.hintElement){
      this.hintElement.textContent=this.paused?"PAUSADO — TOQUE ▶ PARA CONTINUAR":
        "DESLIZE PARA MUDAR DE FAIXA";
    }
  }
  private createWorld(THREE:ThreeApi){
    const world=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(63,WIDTH/HEIGHT,.1,140);
    camera.position.set(8.2,4.8,2.4);
    camera.lookAt(0,1,-8);
    let renderer:T.WebGLRenderer;
    try{
      renderer=new THREE.WebGLRenderer({
        alpha:false,antialias:false,powerPreference:"low-power"
      });
    }catch(error){throw new Error("WebGL 3D renderer unavailable",{cause:error});}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.3));
    renderer.setSize(WIDTH,HEIGHT,false);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    // Filmic highlights preserve the moon/lantern glow without a costly bloom pass.
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.18;
    renderer.domElement.className="chase-three-canvas";
    renderer.domElement.style.pointerEvents="none";
    renderer.domElement.addEventListener("webglcontextlost",this.onContextLost,false);
    document.getElementById("game")?.appendChild(renderer.domElement);
    this.threeRenderer=renderer;this.world=world;this.camera=camera;

    this.environment=createChaseEnvironment(THREE,world);
    const look=activeAppearance(progressStore.load());
    const ghost=createChaseGhost(THREE,look.hero,look.accessory);
    this.heroColor=ghost.color;
    this.ghostMaterial=ghost.bodyMaterial;
    this.ghostHalo=ghost.halo;
    this.ghost=ghost.model;
    this.ghost.position.set(0,0,PLAYER_Z);
    world.add(this.ghost);
    this.hunter=createChaseHunter(THREE);
    this.hunter.position.set(-.9,0,7);
    world.add(this.hunter);
    // Visual effects can be disabled for mobile A/B profiling via ?no_fx=1.
    if(!new URLSearchParams(location.search).has("no_fx")){
      this.chaseFx=new ChaseEffects(THREE,world);
    }
  }
  private spawnWave(){
    if(!this.three||!this.world)return;
    for(const data of waveAt(this.spawnIndex++)){
      const model=createChaseHazard(this.three,data.kind);
      model.position.set(LANE_X[data.lane],0,data.z);
      this.world.add(model);this.hazards.push({obstacle:data,model});
    }
  }
  update(_time:number,_deltaMs:number){
    if(!this.ready||!this.threeRenderer||!this.world||!this.camera||!this.ghost||!this.hunter)return;
    const k=this.keys!;
    if(Phaser.Input.Keyboard.JustDown(k.esc))this.togglePause();
    if(Phaser.Input.Keyboard.JustDown(k.music))retroAudio.toggleMusic();
    if(Phaser.Input.Keyboard.JustDown(k.effects))retroAudio.toggleEffects();
    const dt=this.clock.tick(Date.now(),this.paused);
    if(this.paused){
      this.threeRenderer.render(this.world,this.camera);return;
    }
    this.gesture.update(performance.now());
    if(!this.returning){
      if(Phaser.Input.Keyboard.JustDown(k.left)||Phaser.Input.Keyboard.JustDown(k.a))
        this.shiftLane(-1);
      if(Phaser.Input.Keyboard.JustDown(k.right)||Phaser.Input.Keyboard.JustDown(k.d))
        this.shiftLane(1);
      if(Phaser.Input.Keyboard.JustDown(k.space)||Phaser.Input.Keyboard.JustDown(k.up))
        this.jump();
    }
    this.tick(dt);
    // A scene switch can synchronously dispose the Three renderer.
    if(this.ready&&this.threeRenderer&&this.world&&this.camera){
      try{this.threeRenderer.render(this.world,this.camera);}
      catch(error){this.useCompatibilityMode(error);}
    }
  }
  private tick(dt:number){
    this.timeAlive+=dt;
    this.hitFlash=Math.max(0,this.hitFlash-dt);
    const intro=Math.min(1,this.timeAlive/1.8);
    const ease=intro*intro*(3-2*intro);
    const camera=this.camera!;
    const cameraFx=chaseCameraOffset(
      this.timeAlive,this.hitFlash/.4,this.laneImpulse,this.returning);
    camera.position.set(
      8.2*(1-ease)+cameraFx.x,
      4.8-.3*ease+cameraFx.y,
      2.4+8.2*ease
    );
    camera.lookAt(0,1,-7.8);
    camera.rotation.z=cameraFx.roll*ease;
    this.laneImpulse*=Math.max(0,1-dt*8);
    if(this.timeAlive>2.3&&!this.returning){
      const held=this.heldPhase||this.keys!.shift.isDown;
      if(!held)this.phaseLocked=false;
      if(this.intangible){
        this.run.energy=Math.max(0,this.run.energy-30*dt);
        if(!held||this.run.energy<=0){
          this.intangible=false;
          this.chaseFx?.emit("phase",
            this.ghost?.position.x??0,this.ghost?.position.y??1,PLAYER_Z,7);
          if(this.run.energy<=0)this.phaseLocked=true;
          retroAudio.play("phaseOff");
        }
      }else{
        this.run.energy=Math.min(100,this.run.energy+12*dt);
        if(held&&!this.phaseLocked&&this.run.energy>=10){
          this.intangible=true;this.run.phases++;
          this.chaseFx?.emit("phase",
            this.ghost?.position.x??0,this.ghost?.position.y??1,PLAYER_Z,13);
          retroAudio.play("phaseOn");
        }
      }
      if(this.ghostMaterial){
        this.ghostMaterial.opacity=Phaser.Math.Linear(this.ghostMaterial.opacity,
          this.intangible?.51:1,Math.min(1,dt*12));
        this.ghostMaterial.color.setHex(this.intangible?0x74d9f8:this.heroColor);
      }
      this.jumpVelocity-=15.5*dt;
      this.jumpHeight=Math.max(0,this.jumpHeight+this.jumpVelocity*dt);
      if(this.jumpHeight===0)this.jumpVelocity=0;
      this.ghost!.position.x=Phaser.Math.Linear(this.ghost!.position.x,
        LANE_X[this.lane],Math.min(1,dt*13));
      this.ghost!.position.y=this.jumpHeight+Math.sin(this.timeAlive*11)*.045;
      this.ghost!.rotation.z=-.08*(LANE_X[this.lane]-this.ghost!.position.x);
      this.chaseFx?.trail(
        this.ghost!.position.x,this.ghost!.position.y+.83,PLAYER_Z,
        this.intangible,dt
      );
      this.hunter!.position.x=Phaser.Math.Linear(this.hunter!.position.x,
        this.ghost!.position.x-.8,Math.min(1,dt*2.1));
      this.hunter!.position.z=7-this.hunterPressure*3.8;
      this.hunter!.rotation.z=Math.sin(this.timeAlive*11)*.035;
      this.hunter!.position.y=Math.sin(this.timeAlive*11)*.055;
      this.hunterPressure=Math.max(.11,this.hunterPressure-.017*dt);
      // Never allow Phaser's update frequency or WebGL clock to accelerate
      // real-world pursuit time. Distance derives from played seconds.
      const wallSeconds=Math.max(0,(Date.now()-this.readyAtWall)/1000);
      this.activeSeconds=Math.min(this.activeSeconds+dt,wallSeconds);
      reportChaseSeconds(this.activeSeconds);
      this.run.distancePx=this.initialDistance+CHASE_WORLD_SPEED*this.activeSeconds;
      this.spawnClock+=dt;
      if(this.spawnClock>=1.55){
        this.spawnClock-=1.55;this.spawnWave();
      }
      for(const hazard of this.hazards){
        // All obstacles continue travelling past the player, even after hit
        // detection. "passed" only gates interaction; it never freezes motion.
        const step=advanceChaseHazard(hazard.obstacle,dt);
        hazard.model.position.z=hazard.obstacle.z;
        animateChaseHazard(
          hazard.model,hazard.obstacle.kind,this.timeAlive,dt);
        if(step.crossed){
          const laneNear=Math.abs(hazard.model.position.x-this.ghost!.position.x)<1;
          const verdict=laneNear?chaseCollision(hazard.obstacle,this.lane,
            this.jumpHeight,this.intangible):"miss";
          if(verdict==="hit"){
            this.hunterPressure=Math.min(1,this.hunterPressure+.36);
            this.hitFlash=.4;
            this.chaseFx?.emit("hit",this.ghost!.position.x,
              this.ghost!.position.y+.9,PLAYER_Z,14);
            retroAudio.play("hit");
          }else if(verdict==="orb"){
            this.run.energy=Math.min(100,this.run.energy+25);
            this.run.orbs++;
            this.chaseFx?.emit("orb",
              hazard.model.position.x,1.2,PLAYER_Z,11);
            retroAudio.play("orb");
          }else if(verdict==="essence"){
            this.run.essence++;
            this.chaseFx?.emit("collect",
              hazard.model.position.x,1.2,PLAYER_Z,10);
            retroAudio.play("collect");
          }
        }
      }
      this.hazards=this.hazards.filter(h=>{
        if(h.obstacle.z<=CHASE_DESPAWN_Z)return true;
        this.world!.remove(h.model);
        this.disposeObject(h.model);
        return false;
      });
      if(this.hunterPressure>=1){this.captured();return;}
      if(chaseCompleted(this.run.distancePx,this.activeSeconds,
        this.run.specialChaseEndPx??CHASE_END_PX))this.beginReturn();
    }else{
      // Safety latch: a scene is never allowed to leave without a verified
      // completed chase, even if a stale callback flips returning.
      if(!this.validFinish){
        this.returning=false;this.returningTime=0;
        if(!this.blockedPrematureReturn){
          this.blockedPrematureReturn=true;
          reportChaseError("blocked unexpected 3D return",
            "active="+this.activeSeconds.toFixed(2)+
            "m="+Math.floor(this.run.distancePx/10));
        }
        return;
      }
      this.returningTime+=dt;
      if(this.returningTime>.72){
        this.ended=true;
        reportMode("chase-three","exit after "+
          this.activeSeconds.toFixed(1)+"s at "+
          Math.floor(this.run.distancePx/10)+"m");
        this.scene.start("game",{resume:mergeRun(this.run,{distancePx:this.run.specialChaseEndPx??CHASE_END_PX,
          hunterDanger:Math.round(this.hunterPressure*100)})});
        return;
      }
      if(this.overlay)this.overlay.style.opacity=String(1-this.returningTime/.72);
    }
    if(this.environment){
      const region=updateChaseEnvironment(
        this.environment,dt,24,8000+(this.run.distancePx-this.initialDistance));
      if(region!==this.lastRegion){
        this.lastRegion=region;
        this.regionNoticeUntil=this.timeAlive+2.8;
      }
    }
    if(this.ghostHalo){
      this.ghostHalo.rotation.z+=dt*.5;
      this.ghostHalo.scale.setScalar(this.intangible?1.22:1);
    }
    this.chaseFx?.update(dt);
    if(this.hintElement){
      if(this.returning)this.hintElement.textContent="PORTAL ABERTO — VOLTANDO AO CEMITÉRIO 2D";
      else if(this.hitFlash>0)this.hintElement.textContent="O CAÇADOR SE APROXIMA! DESVIE!";
      else if(this.timeAlive<this.regionNoticeUntil)
        this.hintElement.textContent="NOVA REGIÃO: "+chaseRegionName(this.lastRegion);
      else if(this.timeAlive>5)this.hintElement.textContent="DESLIZE PARA TROCAR DE FAIXA";
      else if(this.timeAlive>2)this.hintElement.textContent="CUIDADO! O CAÇADOR ESTÁ ATRÁS!";
    }
    this.hudClock+=dt;
    if(this.hudClock>.12){this.hudClock=0;this.updateHud();}
    retroAudio.update();
  }
  private updateHud(){
    if(this.statsElement)this.statsElement.textContent=
      `${Math.floor(this.run.distancePx/10)} m　◆ ${this.run.essence}`;
    if(this.energyElement)this.energyElement.style.width=`${this.run.energy}%`;
    if(this.chaseElement)this.chaseElement.textContent=
      `${Math.floor(this.hunterPressure*100)}%`;
    if(this.overlay)this.overlay.classList.toggle("chase-hit",this.hitFlash>0);
  }
  private beginReturn(){
    if(this.returning||this.ended)return;
    const wallSeconds=(Date.now()-this.readyAtWall)/1000;
    if(!chaseCompleted(this.run.distancePx,this.activeSeconds,
        this.run.specialChaseEndPx??CHASE_END_PX) ||
       wallSeconds<18){
      reportChaseError("premature completion rejected",
        "active="+this.activeSeconds.toFixed(2)+
        " wall="+wallSeconds.toFixed(2)+
        " distance="+this.run.distancePx.toFixed(0));
      return;
    }
    this.validFinish=true;
    reportMode("chase-three","normal completion "+
      this.activeSeconds.toFixed(1)+"s at "+
      Math.floor(this.run.distancePx/10)+"m");
    this.returning=true;this.gesture.clear();this.heldPhase=false;
    this.chaseFx?.emit("phase",
      this.ghost?.position.x??0,this.ghost?.position.y??1,PLAYER_Z,22);
    this.run.distancePx=Math.max(this.run.distancePx,this.run.specialChaseEndPx??CHASE_END_PX);
    retroAudio.play("phaseOff");
  }
  private captured(){
    if(this.ended)return;
    this.ended=true;this.gesture.clear();
    retroAudio.stop();retroAudio.play("hit");
    const stats=asRunStats(this.run);
    const result=progressStore.finish(stats);
    if(result.newRecord&&result.previousBest>0)retroAudio.play("record");
    this.scene.start("results",{stats,progress:result.progress,
      newRecord:result.newRecord,unlocked:result.unlocked,
      forceTutorial:this.run.forceTutorial});
  }
  private disposeObject(root:T.Object3D){
    if(!this.three)return;
    root.traverse(obj=>{
      if(obj instanceof this.three!.Mesh){
        obj.geometry.dispose();
        const materials=Array.isArray(obj.material)?obj.material:[obj.material];
        for(const mat of materials)mat.dispose();
      }
    });
  }
  private cleanup(){
    this.ready=false;this.gesture?.clear();
    this.pauseButton?.removeEventListener("click",this.onPauseClick);
    window.removeEventListener("blur",this.onBackground);
    document.removeEventListener("visibilitychange",this.onVisibility);
    this.overlay?.remove();this.overlay=undefined;
    this.chaseFx?.destroy();this.chaseFx=undefined;
    if(this.world){
      this.disposeObject(this.world);
      this.world.clear();this.world=undefined;
      this.environment=undefined;this.ghostHalo=undefined;
    }
    if(this.threeRenderer){
      this.threeRenderer.domElement.removeEventListener("webglcontextlost",this.onContextLost);
      this.threeRenderer.domElement.remove();
      this.threeRenderer.dispose();this.threeRenderer.forceContextLoss();
      this.threeRenderer=undefined;
    }
    retroAudio.stop();
  }
}
