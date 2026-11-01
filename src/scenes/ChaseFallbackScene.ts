import Phaser from "phaser";
import {ChaseInput} from "../input/ChaseInput";
import {reportMode,reportChaseSeconds} from "../game/diagnostics";
import {progressStore} from "../progression/progress";
import {retroAudio} from "../audio/RetroAudio";
import {setupVisuals,ensureAppearanceVisuals,appearanceTexture} from "../art/pixelArt";
import {activeAppearance} from "../shop/economy";
import {
  CHASE_END_PX,CHASE_WORLD_SPEED,chaseCompleted,
  mergeRun,asRunStats,chaseCollision,waveAt,
  type ChaseObject,type RunSnapshot
} from "../game/modes";

const W=480,H=270;
type Wave={object:ChaseObject};
type KeySet={
  left:Phaser.Input.Keyboard.Key;right:Phaser.Input.Keyboard.Key;
  a:Phaser.Input.Keyboard.Key;d:Phaser.Input.Keyboard.Key;
  space:Phaser.Input.Keyboard.Key;up:Phaser.Input.Keyboard.Key;
  shift:Phaser.Input.Keyboard.Key;esc:Phaser.Input.Keyboard.Key;
  music:Phaser.Input.Keyboard.Key;effects:Phaser.Input.Keyboard.Key
};

/**
 * Compatibility chase: perspective projection drawn with Phaser Canvas when
 * a second WebGL context is unsupported or Three.js initialization fails.
 * It never silently skips the player's 3D chase section.
 */
export class ChaseFallbackScene extends Phaser.Scene {
  private run!:RunSnapshot;
  private reason="";
  private graphics!:Phaser.GameObjects.Graphics;
  private ghost!:Phaser.GameObjects.Image;
  private hunter!:Phaser.GameObjects.Image;
  private hud!:Phaser.GameObjects.Text;
  private hint!:Phaser.GameObjects.Text;
  private pauseButton!:Phaser.GameObjects.Text;
  private keys!:KeySet;
  private gesture!:ChaseInput;
  private lane:0|1|2=1;
  private playerX=W/2;
  private jumping=0;
  private jumpSpeed=0;
  private intangible=false;
  private heldPhase=false;
  private phaseLocked=false;
  private energy=100;
  private waveIndex=0;
  private waves:Wave[]=[];
  private spawnClock=0;
  private t=0;
  private activeSeconds=0;
  private pressure=.16;
  private paused=false;
  private finished=false;
  private returnClock=0;
  private hintClock=0;
  private coinsSpark=0;
  constructor(){super("chase-fallback");}
  init(data:{run:RunSnapshot;reason?:string}){
    this.run={...data.run,chaseDone:true};
    this.energy=this.run.energy;
    this.reason=data.reason??"";
  }
  create(){
    reportMode("chase-compat",this.reason||"fallback renderer");
    this.lane=1;this.playerX=W/2;this.jumping=0;this.jumpSpeed=0;
    this.intangible=false;this.heldPhase=false;this.phaseLocked=false;
    this.waveIndex=0;this.waves=[];this.spawnClock=0;
    this.t=0;this.activeSeconds=0;this.pressure=.16;
    this.paused=false;this.finished=false;this.returnClock=0;
    this.hintClock=0;this.coinsSpark=0;
    setupVisuals(this);
    const look=activeAppearance(progressStore.load());
    ensureAppearanceVisuals(this,look.hero,look.accessory);
    this.graphics=this.add.graphics().setDepth(1);
    this.hunter=this.add.image(W/2,228,"hunter").setScale(.9).setDepth(5);
    this.ghost=this.add.image(W/2,208,appearanceTexture(look.hero,look.accessory,false,0))
      .setScale(1.7).setDepth(8);
    this.add.graphics().setDepth(14).fillStyle(0x1e1b44,.87)
      .fillRoundedRect(5,5,337,43,5);
    this.hud=this.add.text(12,9,"",{fontFamily:"monospace",fontSize:"11px",
      color:"#ffffff",stroke:"#2b2255",strokeThickness:2}).setDepth(16);
    this.hint=this.add.text(W/2,70,
      "VISÃO 3D COMPATÍVEL — CAÇADOR ATRÁS!",{fontFamily:"monospace",
      fontSize:"9px",color:"#fff5ff",backgroundColor:"#4b396d",
      padding:{x:8,y:5},align:"center"}).setOrigin(.5).setDepth(20);
    this.pauseButton=this.add.text(445,9,"Ⅱ",{fontFamily:"monospace",fontSize:"12px",
      color:"#ffffff",backgroundColor:"#4d3b71",padding:{x:8,y:5}})
      .setInteractive({useHandCursor:true}).setDepth(20);
    this.pauseButton.on("pointerdown",()=>this.togglePause());
    this.keys=this.input.keyboard!.addKeys({
      left:Phaser.Input.Keyboard.KeyCodes.LEFT,right:Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a:Phaser.Input.Keyboard.KeyCodes.A,d:Phaser.Input.Keyboard.KeyCodes.D,
      space:Phaser.Input.Keyboard.KeyCodes.SPACE,up:Phaser.Input.Keyboard.KeyCodes.UP,
      shift:Phaser.Input.Keyboard.KeyCodes.SHIFT,esc:Phaser.Input.Keyboard.KeyCodes.ESC,
      music:Phaser.Input.Keyboard.KeyCodes.M,effects:Phaser.Input.Keyboard.KeyCodes.N
    }) as KeySet;
    this.gesture=new ChaseInput({
      jump:()=>this.jump(),phase:held=>{this.heldPhase=held;},
      lane:dir=>this.changeLane(dir)
    });
    this.input.addPointer(3);
    this.input.on("pointerdown",(p:Phaser.Input.Pointer,over:Phaser.GameObjects.GameObject[])=>{
      if(this.paused||this.finished||p.y<50||over.length)return;
      this.gesture.press(p.id,p.x,p.y,performance.now());
    });
    this.input.on("pointermove",(p:Phaser.Input.Pointer)=>this.gesture.move(p.id,p.x,p.y));
    this.input.on("pointerup",(p:Phaser.Input.Pointer)=>this.gesture.release(p.id,performance.now()));
    this.input.on("pointerupoutside",(p:Phaser.Input.Pointer)=>this.gesture.cancel(p.id));
    window.addEventListener("blur",this.onBackground);
    document.addEventListener("visibilitychange",this.onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.gesture.clear();
      window.removeEventListener("blur",this.onBackground);
      document.removeEventListener("visibilitychange",this.onVisibility);
      retroAudio.stop();
    });
    retroAudio.start();
    this.render();
  }
  private onBackground=()=>{
    if(this.sys.isActive()&&!this.paused&&!this.finished)this.togglePause();
  };
  private onVisibility=()=>{if(document.hidden)this.onBackground();};
  private togglePause(){
    if(this.finished)return;
    this.paused=!this.paused;this.gesture.clear();this.heldPhase=false;
    retroAudio.pause(this.paused);
    this.pauseButton.setText(this.paused?"▶":"Ⅱ");
    this.hint.setText(this.paused?"PAUSADO — TOQUE ▶ PARA CONTINUAR":
      "DESLIZE PARA TROCAR DE FAIXA");
  }
  private jump(){
    if(this.paused||this.finished||this.jumping>0||this.jumpSpeed>0)return;
    this.jumpSpeed=6.6;this.run.jumps++;retroAudio.play("jump");
  }
  private changeLane(dir:-1|1){
    if(this.paused||this.finished)return;
    this.lane=Phaser.Math.Clamp(this.lane+dir,0,2) as 0|1|2;
  }
  update(_time:number,deltaMs:number){
    if(this.paused){this.render();return;}
    const delta=Math.min(.05,deltaMs/1000);
    const k=this.keys;
    if(Phaser.Input.Keyboard.JustDown(k.esc))this.togglePause();
    if(Phaser.Input.Keyboard.JustDown(k.music))retroAudio.toggleMusic();
    if(Phaser.Input.Keyboard.JustDown(k.effects))retroAudio.toggleEffects();
    if(this.paused)return;
    this.gesture.update(performance.now());
    if(Phaser.Input.Keyboard.JustDown(k.left)||Phaser.Input.Keyboard.JustDown(k.a))
      this.changeLane(-1);
    if(Phaser.Input.Keyboard.JustDown(k.right)||Phaser.Input.Keyboard.JustDown(k.d))
      this.changeLane(1);
    if(Phaser.Input.Keyboard.JustDown(k.space)||Phaser.Input.Keyboard.JustDown(k.up))
      this.jump();
    this.t+=delta;
    this.coinsSpark=Math.max(0,this.coinsSpark-delta);
    if(this.finished){
      this.returnClock+=delta;
      if(this.returnClock>.85){
        this.scene.start("game",{resume:mergeRun(this.run,{distancePx:CHASE_END_PX,energy:this.energy})});
        return;
      }
      this.render();return;
    }
    if(this.t>2.1){
      const held=this.heldPhase||k.shift.isDown;
      if(!held)this.phaseLocked=false;
      if(this.intangible){
        this.energy=Math.max(0,this.energy-30*delta);
        if(!held||this.energy===0){
          this.intangible=false;
          if(this.energy===0)this.phaseLocked=true;
          retroAudio.play("phaseOff");
        }
      }else{
        this.energy=Math.min(100,this.energy+12*delta);
        if(held&&!this.phaseLocked&&this.energy>=10){
          this.intangible=true;this.run.phases++;retroAudio.play("phaseOn");
        }
      }
      this.jumpSpeed-=15.5*delta;
      this.jumping=Math.max(0,this.jumping+this.jumpSpeed*delta);
      if(this.jumping===0)this.jumpSpeed=0;
      this.playerX=Phaser.Math.Linear(this.playerX, W/2+(this.lane-1)*90,
        Math.min(1,delta*12));
      this.pressure=Math.max(.11,this.pressure-.017*delta);
      this.activeSeconds+=delta;
      reportChaseSeconds(this.activeSeconds);
      this.run.distancePx+=CHASE_WORLD_SPEED*delta;
      this.spawnClock+=delta;
      if(this.spawnClock>=1.55){
        this.spawnClock-=1.55;
        this.waves.push(...waveAt(this.waveIndex++).map(object=>({object})));
      }
      for(const wave of this.waves){
        const object=wave.object;
        if(object.passed)continue;
        object.z+=24*delta;
        if(object.z>=1.5){
          object.passed=true;
          const effect=chaseCollision(object,this.lane,this.jumping,this.intangible);
          if(effect==="hit"){
            this.pressure=Math.min(1,this.pressure+.36);retroAudio.play("hit");
            this.coinsSpark=.35;
          }else if(effect==="essence"){
            this.run.essence++;retroAudio.play("collect");
          }else if(effect==="orb"){
            this.energy=Math.min(100,this.energy+25);this.run.orbs++;
            retroAudio.play("orb");
          }
        }
      }
      this.waves=this.waves.filter(w=>w.object.z<8);
      if(this.pressure>=1){this.capture();return;}
      if(chaseCompleted(this.run.distancePx,this.activeSeconds)){
        this.finished=true;this.gesture.clear();this.hint.setText("PORTAL — VOLTANDO AO 2D");
      }
    }
    if(this.t>5.5&&!this.finished&&!this.paused)
      this.hint.setText("DESLIZE: FAIXA  •  TOQUE: PULAR  •  SEGURE: FASE");
    this.render();
    retroAudio.update();
  }
  private capture(){
    const stats=asRunStats({...this.run,energy:this.energy});
    const result=progressStore.finish(stats);
    retroAudio.stop();retroAudio.play("hit");
    this.scene.start("results",{stats,progress:result.progress,
      newRecord:result.newRecord,unlocked:result.unlocked,
      forceTutorial:this.run.forceTutorial});
  }
  /** Projects three parallel lanes onto a vanishing point. */
  private project(lane:number,z:number){
    const t=Phaser.Math.Clamp((z+58)/61,0,1.14);
    const perspective=t*t;
    return {
      x:W/2+(lane-1)*(11+90*perspective),
      y:123+102*perspective,
      scale:.15+1.05*perspective,
      t
    };
  }
  private render(){
    const g=this.graphics;g.clear();
    const horizon=123;
    g.fillStyle(0x28264f).fillRect(0,0,W,H);
    g.fillStyle(0x4c456f).fillRect(0,56,W,87);
    g.fillStyle(0xf7d9b2,.83).fillCircle(373,47,21);
    for(let i=0;i<24;i++){
      g.fillStyle(0xbab1db,.55).fillRect((i*67+23)%W,(i*31)%105,2,2);
    }
    const shift=this.t*9;
    for(let i=0;i<9;i++){
      const x=(i*61+Math.floor(shift)%63)%W;
      g.fillStyle(0x292f4b).fillTriangle(x,152,x+24,108+(i%3)*11,x+45,152);
    }
    g.fillStyle(0x2a4652).fillRect(0,horizon,W,H-horizon);
    g.fillStyle(0x554e6b).fillTriangle(217,horizon,263,horizon,410,H);
    g.fillTriangle(217,horizon,410,H,70,H);
    g.lineStyle(1,0xb09cba,.56);
    g.lineBetween(217,horizon,70,H);g.lineBetween(263,horizon,410,H);
    for(const side of [-1,1]){
      for(let i=0;i<12;i++){
        const progress=((i/12+this.t*.32)%1);
        const size=4+progress*12;
        const x=W/2+side*(28+progress*215), y=horizon+progress*140;
        g.fillStyle(i%2?0x56577c:0x777592);
        g.fillRoundedRect(x-size/2,y-size,size,size*.85,size/4);
        if(i%3===0){
          g.fillStyle(0x3f6571);
          g.fillTriangle(x-4,y-size,x,y-size*2.9,x+5,y-size);
        }
      }
    }
    for(let i=0;i<16;i++){
      const z=((i*4+this.t*23)%64)-58;
      const p=this.project(1,z);
      if(p.t<0||p.t>1.04)continue;
      g.fillStyle(0xb0a2c7,.8);
      const stripe=2+5*p.t;
      const width=1+2*p.t;
      g.fillRect(p.x-35*p.t-5,p.y,stripe,width);
      g.fillRect(p.x+35*p.t+5,p.y,stripe,width);
    }
    for(const wave of [...this.waves].sort((a,b)=>a.object.z-b.object.z)){
      const item=wave.object;
      if(item.passed)continue;
      const p=this.project(item.lane,item.z);
      if(p.t<0||p.t>1.05)continue;
      const size=4+32*p.t;
      const color=item.kind==="ward"?0xb474ed:
        item.kind==="orb"?0x6aebff:
        item.kind==="essence"?0xffd17b:0x9695b2;
      g.fillStyle(color,item.kind==="ward"?.75:1);
      if(item.kind==="ward")g.fillRoundedRect(p.x-size*.7,p.y-size*1.8,
        size*1.4,size*1.8,4);
      else if(item.kind==="arch"){
        g.fillRect(p.x-size,p.y-size*1.9,size*.3,size*1.9);
        g.fillRect(p.x+size*.7,p.y-size*1.9,size*.3,size*1.9);
        g.fillRect(p.x-size,p.y-size*1.9,size*2,size*.4);
      }else if(item.kind==="stone")g.fillRoundedRect(p.x-size*.45,p.y-size,
        size*.9,size,Math.max(1,size*.24));
      else g.fillCircle(p.x,p.y-size*.7,Math.max(3,size*.3));
    }
    this.hunter.setPosition(W/2+(this.playerX-W/2)*.3,230)
      .setAlpha(.7+this.pressure*.26).setScale(.8+this.pressure*.6);
    this.ghost.setPosition(this.playerX,209-this.jumping*23+Math.sin(this.t*12)*2)
      .setAlpha(this.intangible?.66:1);
    this.hud.setText(
      "PERSEGUIÇÃO • COMPATIBILIDADE\n"+
      Math.floor(this.run.distancePx/10)+"m  ◆ "+this.run.essence+
      "  EP "+Math.floor(this.energy)+"  CAÇADOR "+Math.floor(this.pressure*100)+"%"
    );
    if(this.coinsSpark>0){
      g.fillStyle(0xf6a4ac,.18).fillRect(0,0,W,H);
    }
    if(this.finished){
      g.fillStyle(0x9f78df,Math.min(.7,this.returnClock/.85)).fillRect(0,0,W,H);
    }
  }
}
