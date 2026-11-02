import Phaser from "phaser";
import {retroAudio} from "../audio/RetroAudio";
import {PhantomEffects} from "../effects/PhantomEffects";
import {setupVisuals,ensureAppearanceVisuals,appearanceTexture} from "../art/pixelArt";
import {activeAppearance} from "../shop/economy";
import {progressStore} from "../progression/progress";
import {PlatformInput} from "../input/platformInput";
import {mergeRun,type RunSnapshot} from "../game/modes";
import {reportMode} from "../game/diagnostics";
import {
  PLATFORM_WORLD_WIDTH,PLATFORM_FLOOR_Y,PLATFORM_SURFACES,
  PLATFORM_BARRIERS,PLATFORM_PICKUPS,PLATFORM_CHECKPOINTS,
  PLATFORM_EXIT_X,PLATFORM_DISTANCE_REWARD_PX,
  initialPlatformState,stepPlatform,platformPickupReached,
  platformCheckpointFor,platformCanExit,
  type PlatformState,type PlatformCheckpoint,type PlatformBarrierKind
} from "../game/platformLevel";

const W=480,H=270,DT=1/60;
type Keys={
  left:Phaser.Input.Keyboard.Key;right:Phaser.Input.Keyboard.Key;
  a:Phaser.Input.Keyboard.Key;d:Phaser.Input.Keyboard.Key;
  space:Phaser.Input.Keyboard.Key;up:Phaser.Input.Keyboard.Key;
  shift:Phaser.Input.Keyboard.Key;esc:Phaser.Input.Keyboard.Key;
  music:Phaser.Input.Keyboard.Key;effects:Phaser.Input.Keyboard.Key;
  qaExit:Phaser.Input.Keyboard.Key
};
/** Hand-authored 2D platform chapter sharing the same Phantom run. */
export class PlatformScene extends Phaser.Scene{
  private run!:RunSnapshot;
  private state!:PlatformState;
  private checkpoint:PlatformCheckpoint=PLATFORM_CHECKPOINTS[0];
  private collected=new Set<string>();
  private items=new Map<string,Phaser.GameObjects.Image>();
  private driver!:PlatformInput;
  private keys!:Keys;
  private thumb:-1|0|1=0;
  private touchPhase=false;
  private jumpRequested=false;
  private paused=false;
  private exiting=false;
  private acc=0;
  private elapsed=0;
  private warningTimer=0;
  private tutorialTimer=0;
  private lastWarning:PlatformBarrierKind|null=null;
  private phantom!:Phaser.GameObjects.Image;
  private wall!:Phaser.GameObjects.Graphics;
  private animated!:Phaser.GameObjects.Graphics;
  private hud!:Phaser.GameObjects.Text;
  private bar!:Phaser.GameObjects.Graphics;
  private hint!:Phaser.GameObjects.Text;
  private pauseButton!:Phaser.GameObjects.Text;
  private pauseOverlay!:Phaser.GameObjects.Text;
  private effects!:PhantomEffects;
  private appearance!:ReturnType<typeof activeAppearance>;
  constructor(){super("platform");}
  init(run:RunSnapshot){
    this.run={...run,chaseDone:true,platformDone:false};
    reportMode("platform","entered at "+Math.floor(this.run.distancePx/10)+"m");
  }
  create(){
    this.state=initialPlatformState(this.run.energy);
    this.checkpoint=PLATFORM_CHECKPOINTS[0];
    this.collected.clear();this.items.clear();
    this.thumb=0;this.touchPhase=false;this.jumpRequested=false;
    this.paused=false;this.exiting=false;this.acc=0;this.elapsed=0;
    this.warningTimer=0;this.tutorialTimer=4.6;this.lastWarning=null;
    retroAudio.start();
    setupVisuals(this);
    this.appearance=activeAppearance(progressStore.load());
    ensureAppearanceVisuals(this,this.appearance.hero,this.appearance.accessory);
    this.cameras.main.setBounds(0,0,PLATFORM_WORLD_WIDTH,H);
    this.cameras.main.setScroll(0,0);
    this.drawInterior();
    this.wall=this.add.graphics().setDepth(3);
    this.drawSurfaces();
    this.animated=this.add.graphics().setDepth(6);
    this.effects=new PhantomEffects(this);
    this.phantom=this.add.image(this.state.x,this.state.feetY-15,
      appearanceTexture(this.appearance.hero,this.appearance.accessory,false,0))
      .setDepth(10);
    for(const item of PLATFORM_PICKUPS){
      const image=this.add.image(item.x,item.y,item.kind)
        .setDepth(8).setScale(item.kind==="essence"?.92:1);
      this.items.set(item.id,image);
    }
    const panel=this.add.graphics().setScrollFactor(0).setDepth(28);
    panel.fillStyle(0x1c1a40,.91).fillRoundedRect(5,4,316,40,5);
    panel.lineStyle(1,0x827bc0,.8).strokeRoundedRect(5,4,316,40,5);
    this.hud=this.add.text(12,8,"",{
      fontFamily:"monospace",fontSize:"11px",color:"#ffffff",
      stroke:"#1b193d",strokeThickness:3
    }).setScrollFactor(0).setDepth(30);
    this.bar=this.add.graphics().setScrollFactor(0).setDepth(30);
    this.pauseButton=this.add.text(452,9,"Ⅱ",{
      fontFamily:"monospace",fontSize:"12px",color:"#ffffff",
      backgroundColor:"#403760",padding:{x:8,y:6}
    }).setScrollFactor(0).setDepth(32).setInteractive({useHandCursor:true});
    this.pauseButton.on("pointerdown",()=>this.togglePause());
    this.hint=this.add.text(W/2,58,
      "MANSÃO DAS ALMAS\nSUBA, ATRAVESSE E ENCONTRE A SAÍDA",{
        fontFamily:"monospace",fontSize:"9px",color:"#f7f4ff",
        backgroundColor:"#474071",padding:{x:8,y:5},align:"center"
      }).setOrigin(.5,0).setScrollFactor(0).setDepth(35);
    this.add.text(W/2,257,
      "ESQ: ARRASTE P/ MOVER     DIR: TOQUE PULA / SEGURE FASE",{
        fontFamily:"monospace",fontSize:"8px",color:"#cbe2ff",
        stroke:"#1c1738",strokeThickness:3
      }).setOrigin(.5).setScrollFactor(0).setDepth(33);
    this.pauseOverlay=this.add.text(W/2,H/2,
      "PAUSADO\n\nESC OU ▶ PARA CONTINUAR",{
        fontFamily:"monospace",fontSize:"16px",color:"#ffffff",
        align:"center",backgroundColor:"#30274d",padding:{x:18,y:12}
      }).setOrigin(.5).setScrollFactor(0).setDepth(50).setVisible(false);
    this.keys=this.input.keyboard!.addKeys({
      left:Phaser.Input.Keyboard.KeyCodes.LEFT,
      right:Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a:Phaser.Input.Keyboard.KeyCodes.A,d:Phaser.Input.Keyboard.KeyCodes.D,
      space:Phaser.Input.Keyboard.KeyCodes.SPACE,
      up:Phaser.Input.Keyboard.KeyCodes.UP,
      shift:Phaser.Input.Keyboard.KeyCodes.SHIFT,
      esc:Phaser.Input.Keyboard.KeyCodes.ESC,
      music:Phaser.Input.Keyboard.KeyCodes.M,
      effects:Phaser.Input.Keyboard.KeyCodes.N,
      qaExit:Phaser.Input.Keyboard.KeyCodes.X
    }) as Keys;
    this.driver=new PlatformInput({
      move:dir=>{this.thumb=dir;},
      jump:()=>{if(!this.paused&&!this.exiting)this.jumpRequested=true;},
      phase:held=>{this.touchPhase=held;}
    });
    this.input.addPointer(3);
    this.input.on("pointerdown",(p:Phaser.Input.Pointer,over:Phaser.GameObjects.GameObject[])=>{
      if(this.paused||this.exiting||p.y<47||over.length>0)return;
      this.driver.press(p.id,p.x,p.y,performance.now());
    });
    this.input.on("pointermove",(p:Phaser.Input.Pointer)=>
      this.driver.move(p.id,p.x,p.y));
    this.input.on("pointerup",(p:Phaser.Input.Pointer)=>
      this.driver.release(p.id,performance.now()));
    this.input.on("pointerupoutside",(p:Phaser.Input.Pointer)=>
      this.driver.cancel(p.id));
    window.addEventListener("blur",this.onBlur);
    document.addEventListener("visibilitychange",this.onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.driver.clear();
      window.removeEventListener("blur",this.onBlur);
      document.removeEventListener("visibilitychange",this.onVisibility);
      retroAudio.stop();
    });
    this.refreshHud();
    this.cameras.main.fadeIn(490,22,17,51);
  }
  private onBlur=()=>{
    if(this.sys.isActive()&&!this.paused&&!this.exiting)this.togglePause();
  };
  private onVisibility=()=>{if(document.hidden)this.onBlur();};
  private togglePause(){
    if(this.exiting)return;
    this.paused=!this.paused;
    this.driver.clear();
    this.jumpRequested=false;this.touchPhase=false;
    this.acc=0;
    this.pauseButton.setText(this.paused?"▶":"Ⅱ");
    this.pauseOverlay.setVisible(this.paused);
    retroAudio.pause(this.paused);
  }
  private drawInterior(){
    const sky=this.add.graphics().setScrollFactor(0).setDepth(-20);
    sky.fillGradientStyle(0x19172f,0x19172f,0x34345b,0x34345b,1)
      .fillRect(0,0,W,H);
    sky.fillStyle(0x7870a1,.13).fillCircle(402,41,52);
    sky.fillStyle(0xf1e8c8,.83).fillCircle(402,41,26);
    const wall=this.add.graphics().setDepth(-10);
    wall.fillStyle(0x383552).fillRect(0,45,PLATFORM_WORLD_WIDTH,200);
    for(let x=0;x<PLATFORM_WORLD_WIDTH;x+=56){
      wall.lineStyle(1,0x5b536e,.3).lineBetween(x,46,x,245);
      for(let y=52;y<236;y+=24){
        wall.fillStyle(0x514767,.31).fillRect(x+2,y,50,1);
      }
    }
    for(let x=160;x<PLATFORM_WORLD_WIDTH;x+=253){
      wall.fillStyle(0x201d3e).fillRoundedRect(x,61,39,91,15);
      wall.fillStyle(x%2===0?0x5b79a1:0x806caa,.66)
        .fillRoundedRect(x+5,67,29,78,11);
      wall.lineStyle(2,0x9a8db7,.75).strokeRoundedRect(x,61,39,91,15);
      wall.fillStyle(0xc1b8dc,.38).fillRect(x+18,66,3,79);
    }
    const arches=this.add.graphics().setDepth(-4);
    for(let x=40;x<PLATFORM_WORLD_WIDTH;x+=300){
      arches.fillStyle(0x26243f,.4).fillRect(x,25,18,215);
      arches.fillStyle(0x76718e,.52).fillRect(x+2,25,3,215);
      arches.fillStyle(0x62607d,.55).fillRect(x,25,18,7);
      arches.fillStyle(0x26243f,.35).fillRect(x+216,25,18,215);
    }
    const deco=this.add.graphics().setDepth(2);
    for(let x=110;x<PLATFORM_WORLD_WIDTH;x+=215){
      deco.fillStyle(0x9b89c0,.67).fillRect(x,34,2,33);
      deco.fillStyle(0xf4d9a5,.85).fillCircle(x+1,70,4);
      deco.fillStyle(0xf4d9a5,.1).fillCircle(x+1,70,16);
    }
  }
  private drawSurfaces(){
    const g=this.wall;
    for(const p of PLATFORM_SURFACES){
      g.fillStyle(0x251f3c,.9).fillRect(p.x+3,p.y+5,p.width,14);
      g.fillStyle(0x5c587d).fillRoundedRect(p.x,p.y,p.width,13,3);
      g.fillStyle(0x9c97b7,.9).fillRect(p.x,p.y,p.width,3);
      g.fillStyle(0x373454,.9).fillRect(p.x+2,p.y+10,p.width-4,4);
      for(let x=p.x+12;x<p.x+p.width-10;x+=34){
        g.fillStyle(0x4a466a,.85).fillRect(x,p.y+5,2,6);
        g.fillStyle(0x837c9e,.6).fillRect(x+12,p.y+7,11,1);
      }
    }
    for(const b of PLATFORM_BARRIERS){
      if(b.kind!=="stone")continue;
      g.fillStyle(0x25223b,.95).fillRect(b.x-3,b.y-b.height-5,b.width+6,b.height+6);
      g.fillStyle(0x6c688f).fillRect(b.x,b.y-b.height,b.width,b.height);
      g.fillStyle(0xaaa1c4,.94).fillRect(b.x,b.y-b.height,b.width,6);
      for(let y=b.y-b.height+13;y<b.y-8;y+=17){
        g.fillStyle(0x4a486e).fillRect(b.x,y,b.width,2);
        g.fillStyle(0x8f8aaa).fillRect(b.x+5,y+5,3,8);
      }
    }
    for(const c of PLATFORM_CHECKPOINTS.slice(1)){
      g.fillStyle(0x53506f,.9).fillRoundedRect(c.x-7,c.feetY-28,14,27,3);
      g.fillStyle(0x87e4e6,.8).fillCircle(c.x,c.feetY-25,4);
      g.fillStyle(0xb2e3dc,.7).fillRect(c.x-2,c.feetY-17,4,12);
    }
  }
  private drawAnimations(){
    const g=this.animated;g.clear();
    for(const b of PLATFORM_BARRIERS){
      if(b.kind!=="ward")continue;
      const pulse=.60+.15*Math.sin(this.elapsed*4.8);
      g.fillStyle(0xa576ed,pulse*.42)
        .fillRoundedRect(b.x,b.y-b.height,b.width,b.height,3);
      g.lineStyle(2,0xd09dff,pulse)
        .strokeRoundedRect(b.x,b.y-b.height,b.width,b.height,3);
      g.lineStyle(1,0xe7c7ff,.72).strokeCircle(
        b.x+b.width/2,b.y-b.height*.54,
        5+Math.sin(this.elapsed*2.6)*1.2);
    }
    const x=PLATFORM_EXIT_X+1,y=PLATFORM_FLOOR_Y;
    const alpha=.60+.13*Math.sin(this.elapsed*4.1);
    g.fillStyle(0x7b51b2,alpha*.52).fillRoundedRect(x-24,y-76,51,76,14);
    g.lineStyle(4,0xaeeaf2,alpha).strokeRoundedRect(x-24,y-76,51,76,14);
    g.lineStyle(2,0xffdcad,alpha).strokeRoundedRect(x-17,y-67,37,67,9);
    g.fillStyle(0xd9d6ff,.24+Math.sin(this.elapsed*3)*.12)
      .fillEllipse(x+2,y-35,23,48);
    for(const [i,item] of PLATFORM_PICKUPS.entries()){
      if(this.collected.has(item.id))continue;
      const sprite=this.items.get(item.id);
      if(sprite)sprite.y=item.y+Math.sin(this.elapsed*4+i*.7)*3;
    }
  }
  private refreshHud(){
    this.hud.setText("MANSÃO DAS ALMAS  "+Math.floor(this.run.distancePx/10)+
      " m  ◆ "+this.run.essence+"\nEP "+Math.ceil(this.state.energy)+
      "   SAÍDA "+Math.max(0,Math.floor((PLATFORM_EXIT_X-this.state.x)/10))+" m");
    this.bar.clear();
    this.bar.fillStyle(0x222142).fillRect(74,31,113,7);
    this.bar.fillStyle(this.state.energy<25?0xff9b8f:0x75e5f4)
      .fillRect(76,33,Math.floor(109*this.state.energy/100),3);
  }
  update(_time:number,deltaMs:number){
    if(Phaser.Input.Keyboard.JustDown(this.keys.esc))this.togglePause();
    if(Phaser.Input.Keyboard.JustDown(this.keys.music))retroAudio.toggleMusic();
    if(Phaser.Input.Keyboard.JustDown(this.keys.effects))retroAudio.toggleEffects();
    if(this.paused||this.exiting)return;
    if(Phaser.Input.Keyboard.JustDown(this.keys.space)||
      Phaser.Input.Keyboard.JustDown(this.keys.up))this.jumpRequested=true;
    const qa=new URLSearchParams(location.search);
    if(qa.has("test_platform")&&qa.has("qa_exit")&&
      Phaser.Input.Keyboard.JustDown(this.keys.qaExit)){
      this.complete();return;
    }
    this.driver.update(performance.now());
    this.acc+=Math.min(deltaMs/1000,.05);
    let steps=0;
    while(this.acc>=DT&&steps++<4&&!this.exiting){
      this.physicsStep(DT);this.acc-=DT;
    }
    if(steps>=4)this.acc=0;
    this.elapsed+=Math.min(deltaMs/1000,.05);
    if(this.warningTimer>0)this.warningTimer=Math.max(0,this.warningTimer-deltaMs/1000);
    if(this.tutorialTimer>0)this.tutorialTimer=Math.max(0,this.tutorialTimer-deltaMs/1000);
    if(this.warningTimer===0){
      this.hint.setText(this.tutorialTimer>0?
        "MANSÃO DAS ALMAS\nESQUERDA: ARRASTE   DIREITA: TOQUE / SEGURE":"");
      this.hint.setVisible(this.tutorialTimer>0);
    }
    this.drawAnimations();
    this.effects.update(Math.min(deltaMs/1000,.05),this.state.x,
      this.state.feetY-16,this.state.phased);
    const frame=Math.floor(this.elapsed*9)%6;
    this.phantom.setTexture(appearanceTexture(this.appearance.hero,
      this.appearance.accessory,this.state.phased,
      this.state.grounded?frame:"jump"))
      .setPosition(this.state.x,Math.round(this.state.feetY-15))
      .setFlipX(this.thumb<0||this.keys.left.isDown||this.keys.a.isDown)
      .setAlpha(this.state.phased?.72+.11*Math.sin(this.elapsed*15):1);
    const target=Math.max(0,Math.min(PLATFORM_WORLD_WIDTH-W,this.state.x-166));
    this.cameras.main.setScroll(Phaser.Math.Linear(
      this.cameras.main.scrollX,target,.16),0);
    this.refreshHud();
    retroAudio.update();
  }
  private physicsStep(dt:number){
    const left=this.keys.left.isDown||this.keys.a.isDown;
    const right=this.keys.right.isDown||this.keys.d.isDown;
    const axis:-1|0|1=left===right?this.thumb:left?-1:1;
    const phase=this.keys.shift.isDown||this.touchPhase;
    const result=stepPlatform(this.state,{axis,jump:this.jumpRequested,phase},dt);
    this.jumpRequested=false;
    this.state=result.state;this.run.energy=this.state.energy;
    if(result.jumped){
      this.run.jumps++;
      this.effects.burst("jump",this.state.x,this.state.feetY,10);
      retroAudio.play("jump");
    }
    if(result.phaseChanged){
      const kind=this.state.phased?"phaseOn":"phaseOff";
      if(this.state.phased)this.run.phases++;
      this.effects.burst(kind,this.state.x,this.state.feetY-16,12);
      retroAudio.play(kind);
    }
    if(result.barrier&&axis!==0&&result.barrier!==this.lastWarning){
      this.lastWarning=result.barrier;this.warningTimer=1.4;
      this.hint.setText(result.barrier==="stone"?
        "SEGURE PARA FICAR INTANGÍVEL!":
        "SOLTE A FASE PARA ATRAVESSAR A RUNA!");
      this.hint.setVisible(true);
    }else if(!result.barrier)this.lastWarning=null;
    for(const item of PLATFORM_PICKUPS){
      if(this.collected.has(item.id)||!platformPickupReached(this.state,item))continue;
      this.collected.add(item.id);
      this.items.get(item.id)?.setVisible(false);
      if(item.kind==="essence"){
        this.run.essence++;
        this.effects.burst("collect",item.x,item.y,11);
        retroAudio.play("collect");
      }else{
        this.state.energy=Math.min(100,this.state.energy+25);
        this.run.energy=this.state.energy;this.run.orbs++;
        this.effects.burst("orb",item.x,item.y,13);
        retroAudio.play("orb");
      }
    }
    this.checkpoint=platformCheckpointFor(this.state,this.checkpoint);
    if(result.fell){this.respawn();return;}
    if(platformCanExit(this.state))this.complete();
  }
  private respawn(){
    this.effects.burst("hit",this.state.x,260,18);
    retroAudio.play("hit");
    this.state={...initialPlatformState(Math.max(25,this.state.energy-8)),
      x:this.checkpoint.x,feetY:this.checkpoint.feetY};
    this.run.energy=this.state.energy;
    this.jumpRequested=false;this.driver.clear();
    this.cameras.main.flash(150,170,100,155);
    this.hint.setText("QUEDA! RETORNO AO ÚLTIMO PONTO SEGURO")
      .setVisible(true);this.warningTimer=1.5;
  }
  private complete(){
    if(this.exiting)return;
    this.exiting=true;this.driver.clear();this.jumpRequested=false;
    this.state.phased=false;this.run.energy=this.state.energy;
    this.hint.setText("PORTAL ENCONTRADO! VOLTANDO À CORRIDA...")
      .setVisible(true);
    this.effects.burst("phaseOn",this.state.x,this.state.feetY-20,24);
    retroAudio.play("phaseOn");
    reportMode("platform","completed at "+Math.floor(this.run.distancePx/10)+"m");
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,()=>{
      const resume=mergeRun(this.run,{
        distancePx:this.run.distancePx+PLATFORM_DISTANCE_REWARD_PX,
        energy:this.state.energy,platformDone:true
      });
      this.scene.start("game",{resume});
    });
    this.cameras.main.fadeOut(600,58,39,94);
  }
}
