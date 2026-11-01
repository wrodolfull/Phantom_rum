import Phaser from "phaser";
import type * as T from "three";
import {retroAudio} from "../audio/RetroAudio";
import {progressStore} from "../progression/progress";
import {activeAppearance} from "../shop/economy";
import {heroById} from "../shop/catalog";
import {ChaseInput} from "../input/ChaseInput";
import {reportMode,reportChaseError,reportChaseSeconds} from "../game/diagnostics";
import {ChaseClock} from "../game/ChaseClock";
import {
  CHASE_END_PX,CHASE_WORLD_SPEED,chaseCompleted,mergeRun,asRunStats,chaseCollision,waveAt,
  type ChaseObject,type ChaseObstacleKind,type RunSnapshot
} from "../game/modes";

const WIDTH=480,HEIGHT=270;
const PLAYER_Z=2.25;
const LANE_X=[-2.4,0,2.4] as const;
type Prop={mesh:T.Object3D;z:number};
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
  private graveProps:Prop[]=[];
  private laneMarks:Prop[]=[];
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
    this.spawnClock=0;this.spawnIndex=0;this.hunterPressure=.16;
    this.activeSeconds=0;this.fallbackStarted=false;
    this.intangible=false;this.heldPhase=false;this.phaseLocked=false;
    this.paused=false;this.returning=false;this.returningTime=0;
    this.ready=false;this.ended=false;this.hudClock=0;this.hitFlash=0;
    this.graveProps=[];this.laneMarks=[];this.hazards=[];
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
      this.clock.reset(performance.now());
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
      run:{...this.run,energy:this.run.energy,chaseDone:true},
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
    retroAudio.play("jump");
  }
  private shiftLane(direction:-1|1){
    if(!this.ready||this.paused||this.returning)return;
    this.lane=Phaser.Math.Clamp(this.lane+direction,0,2) as 0|1|2;
  }
  private togglePause(){
    if(this.returning||this.ended)return;
    this.paused=!this.paused;
    this.clock.resume(performance.now());
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
    world.background=new THREE.Color(0x232348);
    world.fog=new THREE.Fog(0x29264b,17,83);
    const camera=new THREE.PerspectiveCamera(64,WIDTH/HEIGHT,.1,140);
    camera.position.set(9,4.8,2.4);
    camera.lookAt(0,1,-10);
    let renderer:T.WebGLRenderer;
    try{
      renderer=new THREE.WebGLRenderer({alpha:false,antialias:false,powerPreference:"low-power"});
    }catch(error){throw new Error("WebGL 3D renderer unavailable",{cause:error});}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));
    renderer.setSize(WIDTH,HEIGHT,false);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.className="chase-three-canvas";
    renderer.domElement.style.pointerEvents="none";
    renderer.domElement.addEventListener("webglcontextlost",this.onContextLost,false);
    document.getElementById("game")?.appendChild(renderer.domElement);
    this.threeRenderer=renderer;this.world=world;this.camera=camera;
    world.add(new THREE.AmbientLight(0xb1addb,1.6));
    const moonlight=new THREE.DirectionalLight(0xc4dcff,2);
    moonlight.position.set(-8,15,-15);world.add(moonlight);
    const floorMaterial=new THREE.MeshStandardMaterial({color:0x51486c,roughness:1});
    const road=new THREE.Mesh(new THREE.BoxGeometry(7.3,.16,130),floorMaterial);
    road.position.set(0,-.13,-28);
    world.add(road);
    const shoulder=new THREE.Mesh(new THREE.BoxGeometry(17,.08,130),
      new THREE.MeshStandardMaterial({color:0x283c4b,roughness:1}));
    shoulder.position.set(0,-.26,-28);
    world.add(shoulder);
    // Perspective lane separators, with repeated strips moving toward the camera.
    for(const x of [-1.2,1.2]){
      for(let i=0;i<28;i++){
        const mark=new THREE.Mesh(new THREE.BoxGeometry(.055,.02,1),
          new THREE.MeshBasicMaterial({color:0x9a8aaf}));
        mark.position.set(x,-.037,-i*3);
        world.add(mark);
        this.laneMarks.push({mesh:mark,z:mark.position.z});
      }
    }
    for(let side of [-1,1]){
      for(let i=0;i<11;i++){
        const prop=this.makeGraveProp(THREE,i);
        prop.position.set(side*(4.7+(i%3)*1.3),0,-i*10-(side+1)*4);
        world.add(prop);
        this.graveProps.push({mesh:prop,z:prop.position.z});
      }
    }
    const look=activeAppearance(progressStore.load());
    const palette=heroById(look.hero);
    this.heroColor=parseInt(palette.body.substring(1),16);
    this.ghostMaterial=new THREE.MeshStandardMaterial({
      color:new THREE.Color(palette.body),roughness:.63,transparent:true,opacity:1
    });
    this.ghost=this.makeGhost(THREE,look.accessory);
    this.ghost.position.set(0,0,PLAYER_Z);
    world.add(this.ghost);
    this.hunter=this.makeHunter(THREE);
    this.hunter.position.set(-.9,0,7);
    world.add(this.hunter);
  }
  private makeGraveProp(THREE:ThreeApi,index:number):T.Group{
    const group=new THREE.Group();
    const stone=new THREE.MeshStandardMaterial({color:index%2?0x59587c:0x6b6987,roughness:1});
    const wood=new THREE.MeshStandardMaterial({color:0x383f58,roughness:1});
    if(index%4===0){
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.24,2.5,5),wood);
      trunk.position.y=1.2;group.add(trunk);
      const crown=new THREE.Mesh(new THREE.ConeGeometry(1.3,3.4,5),
        new THREE.MeshStandardMaterial({color:0x365c66,flatShading:true}));
      crown.position.y=3.4;group.add(crown);
    }else{
      const tomb=new THREE.Mesh(new THREE.BoxGeometry(1,.95,.35),stone);
      tomb.position.y=.47;group.add(tomb);
      const top=new THREE.Mesh(new THREE.SphereGeometry(.5,7,4),stone);
      top.scale.set(1,.45,.4);top.position.y=.96;group.add(top);
      if(index%3===0){
        const cross=new THREE.Mesh(new THREE.BoxGeometry(.15,.65,.17),stone);
        cross.position.y=1.45;group.add(cross);
        const beam=new THREE.Mesh(new THREE.BoxGeometry(.53,.14,.17),stone);
        beam.position.y=1.57;group.add(beam);
      }
    }
    return group;
  }
  private makeGhost(THREE:ThreeApi,accessory:string):T.Group{
    const g=new THREE.Group(),skin=this.ghostMaterial!;
    const head=new THREE.Mesh(new THREE.SphereGeometry(.54,12,9),skin);
    head.position.y=1.13;g.add(head);
    const tail=new THREE.Mesh(new THREE.ConeGeometry(.48,.72,9),skin);
    tail.rotation.z=Math.PI;tail.position.y=.56;g.add(tail);
    const blur=new THREE.Mesh(new THREE.TorusGeometry(.6,.065,4,14),
      new THREE.MeshBasicMaterial({color:0x78dcf5,transparent:true,opacity:.55}));
    blur.rotation.x=Math.PI/2;blur.position.y=.12;g.add(blur);
    const accent=new THREE.Mesh(new THREE.BoxGeometry(.38,.1,.09),
      new THREE.MeshBasicMaterial({color:0x98d6ec}));
    accent.position.set(0,1.15,.5);g.add(accent);
    if(accessory==="hat"){
      const hat=new THREE.Mesh(new THREE.CylinderGeometry(.28,.37,.48,7),
        new THREE.MeshStandardMaterial({color:0x7752ae}));
      hat.position.y=1.78;g.add(hat);
    }else if(accessory==="crown"){
      const crown=new THREE.Mesh(new THREE.CylinderGeometry(.33,.37,.25,7),
        new THREE.MeshStandardMaterial({color:0xffd274,metalness:.16}));
      crown.position.y=1.69;g.add(crown);
    }else if(accessory==="ribbon"){
      const ribbon=new THREE.Mesh(new THREE.BoxGeometry(.48,.16,.12),
        new THREE.MeshStandardMaterial({color:0xf582a1}));
      ribbon.position.set(.32,1.54,.15);g.add(ribbon);
    }
    return g;
  }
  private makeHunter(THREE:ThreeApi):T.Group{
    const g=new THREE.Group();
    const cloth=new THREE.MeshStandardMaterial({color:0x423950,roughness:1});
    const face=new THREE.MeshStandardMaterial({color:0xc2a58f});
    const coat=new THREE.Mesh(new THREE.CylinderGeometry(.37,.52,1.25,6),cloth);
    coat.position.y=.9;g.add(coat);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.31,8,6),face);
    head.position.y=1.72;g.add(head);
    const hat=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.16,7),cloth);
    hat.position.y=2.04;g.add(hat);
    const brim=new THREE.Mesh(new THREE.CylinderGeometry(.59,.59,.07,8),cloth);
    brim.position.y=1.98;g.add(brim);
    for(const x of [-.21,.21]){
      const foot=new THREE.Mesh(new THREE.BoxGeometry(.2,.62,.2),cloth);
      foot.position.set(x,.17,.05);g.add(foot);
    }
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.17,8,6),
      new THREE.MeshBasicMaterial({color:0xffdf9d}));
    lamp.position.set(-.68,.92,-.38);g.add(lamp);
    const light=new THREE.PointLight(0xffd89b,3.2,8);
    light.position.copy(lamp.position);g.add(light);
    g.scale.setScalar(.76);
    return g;
  }
  private hazardModel(THREE:ThreeApi,kind:ChaseObstacleKind):T.Group{
    const g=new THREE.Group();
    const stone=new THREE.MeshStandardMaterial({color:0x7b819d,roughness:1});
    const magic=new THREE.MeshBasicMaterial({color:0xb77bfa,transparent:true,opacity:.7});
    if(kind==="stone"){
      const grave=new THREE.Mesh(new THREE.BoxGeometry(1.05,1.15,.38),stone);
      grave.position.y=.57;g.add(grave);
      const crest=new THREE.Mesh(new THREE.SphereGeometry(.54,9,5),stone);
      crest.position.y=1.15;crest.scale.y=.35;g.add(crest);
    }else if(kind==="arch"){
      for(const x of [-.74,.74]){
        const column=new THREE.Mesh(new THREE.BoxGeometry(.4,2.9,.5),stone);
        column.position.set(x,1.42,0);g.add(column);
      }
      const top=new THREE.Mesh(new THREE.BoxGeometry(2.1,.48,.53),stone);
      top.position.y=2.9;g.add(top);
      const gate=new THREE.Mesh(new THREE.BoxGeometry(1.25,2.5,.1),
        new THREE.MeshBasicMaterial({color:0x8b7ca8,transparent:true,opacity:.73}));
      gate.position.y=1.2;g.add(gate);
    }else if(kind==="ward"){
      const screen=new THREE.Mesh(new THREE.BoxGeometry(1.8,2.5,.14),magic);
      screen.position.y=1.4;g.add(screen);
      const rim=new THREE.Mesh(new THREE.TorusGeometry(.88,.08,6,12),magic);
      rim.scale.y=1.38;rim.position.y=1.45;g.add(rim);
    }else{
      const orb=new THREE.Mesh(new THREE.OctahedronGeometry(.38,0),
        new THREE.MeshBasicMaterial({color:kind==="orb"?0x71e8ff:0xffd87e}));
      orb.position.y=1.25;g.add(orb);
      const glow=new THREE.Mesh(new THREE.OctahedronGeometry(.53,0),
        new THREE.MeshBasicMaterial({color:kind==="orb"?0x71e8ff:0xffd87e,
          transparent:true,opacity:.16,depthWrite:false}));
      glow.position.y=1.25;g.add(glow);
    }
    return g;
  }
  private spawnWave(){
    if(!this.three||!this.world)return;
    for(const data of waveAt(this.spawnIndex++)){
      const model=this.hazardModel(this.three,data.kind);
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
    const dt=this.clock.tick(performance.now(),this.paused);
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
    camera.position.set(9*(1-ease),4.8+ease*.2,2.4+(12.6-2.4)*ease);
    camera.lookAt(0,1,-7);
    if(this.timeAlive>2.3&&!this.returning){
      const held=this.heldPhase||this.keys!.shift.isDown;
      if(!held)this.phaseLocked=false;
      if(this.intangible){
        this.run.energy=Math.max(0,this.run.energy-30*dt);
        if(!held||this.run.energy<=0){
          this.intangible=false;
          if(this.run.energy<=0)this.phaseLocked=true;
          retroAudio.play("phaseOff");
        }
      }else{
        this.run.energy=Math.min(100,this.run.energy+12*dt);
        if(held&&!this.phaseLocked&&this.run.energy>=10){
          this.intangible=true;this.run.phases++;retroAudio.play("phaseOn");
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
      this.hunter!.position.x=Phaser.Math.Linear(this.hunter!.position.x,
        this.ghost!.position.x-.8,Math.min(1,dt*2.1));
      this.hunter!.position.z=7-this.hunterPressure*3.8;
      this.hunter!.rotation.z=Math.sin(this.timeAlive*11)*.035;
      this.hunterPressure=Math.max(.11,this.hunterPressure-.017*dt);
      this.activeSeconds+=dt;
      reportChaseSeconds(this.activeSeconds);
      this.run.distancePx+=CHASE_WORLD_SPEED*dt;
      this.spawnClock+=dt;
      if(this.spawnClock>=1.55){
        this.spawnClock-=1.55;this.spawnWave();
      }
      for(const hazard of this.hazards){
        if(hazard.obstacle.passed)continue;
        hazard.obstacle.z+=24*dt;
        hazard.model.position.z=hazard.obstacle.z;
        if(hazard.obstacle.kind==="ward"||hazard.obstacle.kind==="essence"||hazard.obstacle.kind==="orb")
          hazard.model.rotation.y+=dt*1.7;
        if(hazard.obstacle.z>=PLAYER_Z-.75){
          hazard.obstacle.passed=true;
          const laneNear=Math.abs(hazard.model.position.x-this.ghost!.position.x)<1;
          const verdict=laneNear?chaseCollision(hazard.obstacle,this.lane,
            this.jumpHeight,this.intangible):"miss";
          if(verdict==="hit"){
            this.hunterPressure=Math.min(1,this.hunterPressure+.36);
            this.hitFlash=.4;retroAudio.play("hit");
          }else if(verdict==="orb"){
            this.run.energy=Math.min(100,this.run.energy+25);
            this.run.orbs++;retroAudio.play("orb");
          }else if(verdict==="essence"){
            this.run.essence++;retroAudio.play("collect");
          }
        }
      }
      this.hazards=this.hazards.filter(h=>{
        if(h.obstacle.z<=11)return true;
        this.world!.remove(h.model);this.disposeObject(h.model);return false;
      });
      if(this.hunterPressure>=1){this.captured();return;}
      if(chaseCompleted(this.run.distancePx,this.activeSeconds))this.beginReturn();
    }else{
      this.returningTime+=dt;
      if(this.returningTime>.72){
        this.ended=true;
        this.scene.start("game",{resume:mergeRun(this.run,{distancePx:CHASE_END_PX})});
        return;
      }
      if(this.overlay)this.overlay.style.opacity=String(1-this.returningTime/.72);
    }
    for(const mark of this.laneMarks){
      mark.mesh.position.z+=24*dt;
      if(mark.mesh.position.z>10)mark.mesh.position.z-=84;
    }
    for(const prop of this.graveProps){
      prop.mesh.position.z+=24*dt;
      if(prop.mesh.position.z>13)prop.mesh.position.z-=110;
    }
    if(this.hintElement){
      if(this.returning)this.hintElement.textContent="PORTAL ABERTO — VOLTANDO AO CEMITÉRIO 2D";
      else if(this.hitFlash>0)this.hintElement.textContent="O CAÇADOR SE APROXIMA! DESVIE!";
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
    reportMode("chase-three","normal completion at "+Math.floor(this.run.distancePx/10)+"m");
    this.returning=true;this.gesture.clear();this.heldPhase=false;
    this.run.distancePx=Math.max(this.run.distancePx,CHASE_END_PX);
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
    if(this.world){
      this.disposeObject(this.world);
      this.world.clear();this.world=undefined;
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
