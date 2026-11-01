import Phaser from "phaser";
import "./style.css";
import {setupVisuals,addBackdrop,ensureAppearanceVisuals,appearanceTexture} from "./art/pixelArt";
import { retroAudio } from "./audio/RetroAudio";
import { PhantomEffects } from "./effects/PhantomEffects";
import { CoursePlanner, FIRST_SEGMENT_START, GROUND_Y, difficulty, type ObstacleKind } from "./world/course";
import { canLand, intersectsThing } from "./world/collisions";
import {progressStore,type RunStats} from "./progression/progress";
import {tutorialHint} from "./tutorial/tutorial";
import {ResultsScene,AchievementsScene} from "./scenes/ProgressScenes";
import {ShopScene} from "./scenes/ShopScene";
import {activeAppearance} from "./shop/economy";
import type {HeroId,AccessoryId} from "./shop/catalog";
import {mountTouchControls,type TouchBinding} from "./input/touchControls";
import {FrameMonitor} from "./performance/frameMonitor";

// The orientation reminder is dismissible without blocking portrait fallback.
try{
  if(sessionStorage.getItem("phantom-run-portrait-allowed")==="yes")
    document.documentElement.classList.add("portrait-allowed");
}catch{/* private mode */}
document.getElementById("play-portrait")?.addEventListener("click",()=>{
  document.documentElement.classList.add("portrait-allowed");
  try{sessionStorage.setItem("phantom-run-portrait-allowed","yes");}catch{/* optional */}
});
const showDebug=new URLSearchParams(location.search).get("debug")==="1";

const W = 480, H = 270, GROUND = GROUND_Y, PLAYER_X = 98;
const MAX_EP = 100, DRAIN = 30, REGEN = 12;
const GRAVITY = 900, JUMP = -330;
type Thing = { kind: ObstacleKind; x: number; width: number; collected?: boolean; counted?: boolean; sprite?: Phaser.GameObjects.Image };
type Motion = "grounded" | "jumping" | "falling";
type Material = "physical" | "intangible";

class MenuScene extends Phaser.Scene {
  constructor() { super("menu"); }
  create() {
    paintBackground(this, 0);
    this.add.tileSprite(0, 211, W, H - 211, "ground").setOrigin(0, 0).setDepth(-1);
    const look=activeAppearance(progressStore.load());
    ensureAppearanceVisuals(this,look.hero,look.accessory);
    const hero=this.add.image(W/2,145,appearanceTexture(look.hero,look.accessory,false,0))
      .setScale(1.35).setDepth(4);
    this.tweens.add({targets: hero, y: 139, duration: 800, yoyo: true, repeat: -1});
    const title = this.add.text(W / 2, 69, "PHANTOM RUN", {fontFamily:"monospace",fontSize:"34px",color:"#f6f0ff",stroke:"#423575",strokeThickness:7}).setOrigin(.5);
    this.tweens.add({targets:title,y:65,duration:1100,yoyo:true,repeat:-1});
    this.add.text(W/2,117,"ATRAVESSE O IMPOSSÍVEL", {fontFamily:"monospace",fontSize:"11px",color:"#8deaff"}).setOrigin(.5);
    const best=progressStore.load().bestDistance;
    this.add.text(W/2,98,best>0?"RECORDE: "+best+" m":"SUA AVENTURA COMEÇA AQUI",
      {fontFamily:"monospace",fontSize:"9px",color:"#ffdf9b"}).setOrigin(.5);
    const button=(x:number,y:number,label:string,fontSize=11)=>
      this.add.text(x,y,label,{fontFamily:"monospace",fontSize:fontSize+"px",
        backgroundColor:"#514477",color:"#ffffff",padding:{x:9,y:6}})
        .setOrigin(.5).setDepth(12).setInteractive({useHandCursor:true});
    const launch=(forceTutorial=false)=>{retroAudio.start();this.scene.start("game",{forceTutorial});};
    button(W/2,163,"▶ JOGAR",20).on("pointerdown",()=>launch());
    this.input.keyboard?.once("keydown-SPACE",()=>launch());
    this.input.keyboard?.once("keydown-ENTER",()=>launch());
    button(93,202,"? COMO JOGAR",9).on("pointerdown",()=>launch(true));
    button(240,202,"◆ LOJA",11).on("pointerdown",()=>this.scene.start("shop"));
    button(385,202,"★ CONQUISTAS",9).on("pointerdown",()=>this.scene.start("achievements"));
    const music=button(143,237,""),sound=button(330,237,"");
    const refresh=()=>{music.setText("MÚSICA: "+(retroAudio.musicEnabled?"ON":"OFF"));
      sound.setText("EFEITOS: "+(retroAudio.effectsEnabled?"ON":"OFF"));};
    music.on("pointerdown",()=>{retroAudio.toggleMusic();refresh();});
    sound.on("pointerdown",()=>{retroAudio.toggleEffects();refresh();});
    refresh();
    const isTouch=window.matchMedia?.("(pointer: coarse)").matches??false;
    this.add.text(W/2,261,isTouch
      ?"TOQUE PULAR OU SEGURE ATRAVESSAR"
      :"ESPAÇO: PULAR    SHIFT: ATRAVESSAR",
      {fontFamily:"monospace",fontSize:"8px",color:"#bcb6e3"}).setOrigin(.5);
  }
}

function paintBackground(scene: Phaser.Scene, distance: number) {
  setupVisuals(scene);
  return addBackdrop(scene, distance);
}

class GameScene extends Phaser.Scene {
  private world!: Phaser.GameObjects.Graphics;
  private phantom!: Phaser.GameObjects.Image;
  private heroId!:HeroId;
  private accessoryId!:AccessoryId;
  private backdrop!: ReturnType<typeof addBackdrop>;
  private groundTiles!: Phaser.GameObjects.TileSprite;
  private hud!: Phaser.GameObjects.Text;
  private energyBar!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Text;
  private particles!: PhantomEffects;
  private pauseButton!: Phaser.GameObjects.Text;
  private musicButton!: Phaser.GameObjects.Text;
  private effectsButton!: Phaser.GameObjects.Text;
  private touch!: TouchBinding;
  private htmlPhaseHeld=false;
  private performance=new FrameMonitor();
  private performanceText?:Phaser.GameObjects.Text;
  private performanceUpdate=0;
  private lastHud="";
  private lastTier=-1;
  private elapsed=0;
  private things: Thing[]=[];
  private distance=0;
  private speed=125;
  private ep=100;
  private y=GROUND-25;
  private vy=0;
  private motion: Motion="grounded";
  private material: Material="physical";
  private alive=true;
  private paused=false;
  private jumpQueued=0;
  private coyote=0;
  private holdIntangible=false;
  private needsRelease=false;
  private score=0;
  private spawnAt=FIRST_SEGMENT_START;
  private planner!: CoursePlanner;
  private rightPointers=new Set<number>();
  private tierLabel!: Phaser.GameObjects.Text;
  private tutorialBanner!: Phaser.GameObjects.Text;
  private tutorialEnabled=false;
  private forceTutorial=false;
  private tutorialEndTime=0;
  private jumps=0;
  private phases=0;
  private walls=0;
  private orbs=0;
  private acc=0;
  private rightHeld=false;
  private keys!: {space:Phaser.Input.Keyboard.Key; up:Phaser.Input.Keyboard.Key; shift:Phaser.Input.Keyboard.Key; esc:Phaser.Input.Keyboard.Key; music:Phaser.Input.Keyboard.Key; effects:Phaser.Input.Keyboard.Key};
  constructor(){super("game");}
  init(data?:{forceTutorial?:boolean}){this.forceTutorial=data?.forceTutorial===true;}
  create(){
    this.things=[];this.distance=0;this.speed=125;this.ep=100;this.y=GROUND-25;this.vy=0;this.motion="grounded";this.material="physical";this.alive=true;this.paused=false;this.jumpQueued=0;this.coyote=.1;this.holdIntangible=false;this.needsRelease=false;this.score=0;this.spawnAt=FIRST_SEGMENT_START;this.acc=0;this.rightHeld=false;this.rightPointers.clear();this.planner=new CoursePlanner(Date.now());this.elapsed=0;this.htmlPhaseHeld=false;
    this.performance.reset();this.performanceUpdate=0;this.lastHud="";this.lastTier=-1;
    this.jumps=0;this.phases=0;this.walls=0;this.orbs=0;this.tutorialEndTime=0;
    this.tutorialEnabled=this.forceTutorial||!progressStore.load().tutorialDone;
    retroAudio.start();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>retroAudio.stop());
    this.backdrop = paintBackground(this,0);
    const look=activeAppearance(progressStore.load());
    this.heroId=look.hero;this.accessoryId=look.accessory;
    ensureAppearanceVisuals(this,this.heroId,this.accessoryId);
    this.groundTiles=this.add.tileSprite(0, 211, W, H-211, "ground").setOrigin(0,0).setDepth(2);
    this.world=this.add.graphics().setDepth(3);
    this.phantom=this.add.image(PLAYER_X,this.y+16,
      appearanceTexture(this.heroId,this.accessoryId,false,0)).setDepth(6);
    this.particles=new PhantomEffects(this);
    this.add.graphics().setDepth(18).fillStyle(0x1c1a40, .93).fillRoundedRect(5, 4, 320, 40, 5)
      .lineStyle(1, 0x6b63a5).strokeRoundedRect(5, 4, 320, 40, 5);
    this.hud=this.add.text(10,8,"",{fontFamily:"monospace",fontSize:"12px",color:"#ffffff",stroke:"#20183c",strokeThickness:3}).setDepth(20);
    this.energyBar=this.add.graphics().setDepth(20);
    this.tierLabel=this.add.text(W-8,48,"", {fontFamily:"monospace",fontSize:"9px",color:"#dbd2ff",stroke:"#1d1a43",strokeThickness:2}).setOrigin(1,0).setDepth(20);
    this.tutorialBanner=this.add.text(W/2,61,"",{fontFamily:"monospace",fontSize:"9px",color:"#fcf8ff",backgroundColor:"#45406f",padding:{x:9,y:6},align:"center"}).setOrigin(.5,0).setDepth(23).setVisible(this.tutorialEnabled);
    this.updateTutorial(PLAYER_X);
    this.overlay=this.add.text(W/2,H/2,"",{fontFamily:"monospace",fontSize:"14px",align:"center",color:"#ffffff",backgroundColor:"#332850",padding:{x:14,y:10}}).setOrigin(.5).setDepth(30).setVisible(false);
    this.keys=this.input.keyboard!.addKeys({
      space:Phaser.Input.Keyboard.KeyCodes.SPACE,up:Phaser.Input.Keyboard.KeyCodes.UP,
      shift:Phaser.Input.Keyboard.KeyCodes.SHIFT,esc:Phaser.Input.Keyboard.KeyCodes.ESC,
      music:Phaser.Input.Keyboard.KeyCodes.M,effects:Phaser.Input.Keyboard.KeyCodes.N
    }) as typeof this.keys;
    const uiStyle={fontFamily:"monospace",fontSize:"10px",color:"#f2f1ff",backgroundColor:"#34305c",padding:{x:5,y:5}};
    this.musicButton=this.add.text(348,9,"",uiStyle).setDepth(25).setInteractive({useHandCursor:true});
    this.effectsButton=this.add.text(393,9,"",uiStyle).setDepth(25).setInteractive({useHandCursor:true});
    this.pauseButton=this.add.text(453,9,"Ⅱ",uiStyle).setDepth(25).setInteractive({useHandCursor:true});
    this.musicButton.on("pointerdown",()=>{retroAudio.toggleMusic();this.refreshControls();});
    this.effectsButton.on("pointerdown",()=>{retroAudio.toggleEffects();this.refreshControls();});
    this.pauseButton.on("pointerdown",()=>this.togglePause());
    this.refreshControls();
    // Larger native buttons for coarse pointers, separate from Phaser's canvas input.
    this.touch=mountTouchControls({
      jump:()=>{if(this.alive&&!this.paused)this.jumpQueued=.1;},
      phase:(pressed)=>{this.htmlPhaseHeld=pressed;},
      pause:()=>this.togglePause()
    });
    this.touch.setPaused(false);
    const pauseForBackground=()=>{
      if(this.alive&&!this.paused)this.togglePause();
    };
    const onVisibility=()=>{if(document.hidden)pauseForBackground();};
    document.addEventListener("visibilitychange",onVisibility);
    window.addEventListener("blur",pauseForBackground);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.touch.destroy();
      document.removeEventListener("visibilitychange",onVisibility);
      window.removeEventListener("blur",pauseForBackground);
    });
    if(showDebug){
      this.performanceText=this.add.text(W/2,H-6,"",{
        fontFamily:"monospace",fontSize:"9px",color:"#aaffd9",
        backgroundColor:"#1a1a35",padding:{x:4,y:2}
      }).setOrigin(.5,1).setDepth(26);
    }
    this.input.addPointer(2);
    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>{
      // HUD buttons are separate interactive targets and must not also jump/restart.
      if(p.y<46)return;
      if(!this.alive){this.scene.restart();return;}
      if(this.paused)return;
      if(p.x < W/2){this.jumpQueued=.1;}
      else {this.rightPointers.add(p.id);this.rightHeld=true;}
    });
    const release=(p:Phaser.Input.Pointer)=>{
      this.rightPointers.delete(p.id);
      this.rightHeld=this.rightPointers.size>0;
    };
    this.input.on("pointerup",release);
    this.input.on("pointerupoutside",release);
    // Preload only the segment(s) actually needed ahead of the player.
    while(this.spawnAt<W+240)this.generate();
  }
  private updateTutorial(px:number){
    if(!this.tutorialEnabled)return;
    const hint=tutorialHint(px,true);
    if(hint.completed){
      this.tutorialEnabled=false;
      this.tutorialEndTime=this.elapsed+2.5;
      this.tutorialBanner.setText(hint.text).setVisible(true);
      progressStore.markTutorial();
    }else this.tutorialBanner.setText(hint.text).setVisible(true);
  }
  private generate(){
    const segment=this.planner.next({
      start:this.spawnAt,
      distance:this.distance,
      playerX:this.distance+PLAYER_X,
      energy:this.ep,
      upcoming:this.things
        .filter(t=>!t.collected && t.x+t.width>this.distance+PLAYER_X-10)
        .map(t=>({kind:t.kind,x:t.x,width:t.width}))
    });
    this.spawnAt+=segment.length;
    for(const item of segment.objects){
      const thing:Thing={...item};
      if(item.kind!=="gap"){
        const key=item.kind==="wall"?"wall":item.kind==="ward"?"ward":
          item.kind==="orb"?"orb":"essence";
        const y=(item.kind==="orb"||item.kind==="essence")?GROUND-22:GROUND;
        thing.sprite=this.add.image(item.x+item.width/2,y,key)
          .setOrigin(.5,(item.kind==="orb"||item.kind==="essence")?.5:1)
          .setDepth(5);
      }
      this.things.push(thing);
    }
  }
  private refreshControls(){
    this.musicButton.setText(retroAudio.musicEnabled?"♫ ON":"♫ OFF");
    this.effectsButton.setText(retroAudio.effectsEnabled?"♪ ON":"♪ OFF");
  }
  private togglePause(){
    if(!this.alive)return;
    this.paused=!this.paused;
    retroAudio.pause(this.paused);
    this.pauseButton.setText(this.paused?"▶":"Ⅱ");
    this.overlay.setText(this.paused?"PAUSADO\n\nESC OU ▶ PARA CONTINUAR":"").setVisible(this.paused);
    this.touch?.setPaused(this.paused);
  }
  update(_time:number,delta:number){
    const jump=Phaser.Input.Keyboard.JustDown(this.keys.space)||Phaser.Input.Keyboard.JustDown(this.keys.up);
    if(!this.alive){
      if(jump)this.scene.restart({forceTutorial:this.forceTutorial});
      else this.particles.update(Math.min(delta/1000,.05),PLAYER_X,this.y+16,false);
      return;
    }
    if(Phaser.Input.Keyboard.JustDown(this.keys.esc))this.togglePause();
    if(Phaser.Input.Keyboard.JustDown(this.keys.music)){retroAudio.toggleMusic();this.refreshControls();}
    if(Phaser.Input.Keyboard.JustDown(this.keys.effects)){retroAudio.toggleEffects();this.refreshControls();}
    if(this.paused)return;
    if(jump)this.jumpQueued=.1;
    if(showDebug){
      this.performance.record(delta);
      this.performanceUpdate+=Math.min(delta,100);
      if(this.performanceText&&this.performanceUpdate>=600){
        this.performanceUpdate=0;
        const metrics=this.performance.snapshot();
        this.performanceText.setText("FPS "+metrics.fps+"   QUADROS LENTOS "+metrics.slowPercent+"%");
      }
    }
    retroAudio.update();
    this.acc+=Math.min(delta/1000,.05);
    let steps=0;
    while(this.acc>=1/60&&steps++<4&&this.alive){this.step(1/60);this.acc-=1/60;}
    if(steps>=4)this.acc=0;
    this.draw();
  }
  private step(dt:number){
    this.elapsed+=dt;
    const previousMaterial=this.material;
    this.holdIntangible=this.keys.shift.isDown||this.rightHeld||this.htmlPhaseHeld;
    if(!this.holdIntangible)this.needsRelease=false;
    if(this.material==="intangible"){
      this.ep=Math.max(0,this.ep-DRAIN*dt);
      if(!this.holdIntangible||this.ep<=0){this.material="physical";if(this.ep<=0)this.needsRelease=true;}
    }else{
      this.ep=Math.min(MAX_EP,this.ep+REGEN*dt);
      if(this.holdIntangible&&!this.needsRelease&&this.ep>=10)this.material="intangible";
    }
    if(previousMaterial!==this.material){
      const effect=this.material==="intangible"?"phaseOn":"phaseOff";
      if(this.material==="intangible")this.phases++;
      this.particles.burst(effect,PLAYER_X,this.y+15);
      retroAudio.play(effect);
      this.cameras.main.flash(85,this.material==="intangible"?100:240,205,255);
    }
    this.jumpQueued=Math.max(0,this.jumpQueued-dt);
    if(this.motion==="grounded")this.coyote=.1;else this.coyote=Math.max(0,this.coyote-dt);
    if(this.jumpQueued>0&&this.coyote>0){
      this.jumps++;
      this.particles.burst("jump",PLAYER_X,this.y+25,7);
      retroAudio.play("jump");
      this.vy=JUMP;this.motion="jumping";this.coyote=0;this.jumpQueued=0;
    }
    const prevY=this.y;
    const prevX=this.distance+PLAYER_X;
    this.vy+=GRAVITY*dt;
    this.y+=this.vy*dt;
    this.speed=difficulty(this.distance).speed;
    const dx=this.speed*dt;
    this.distance+=dx;
    const px=this.distance+PLAYER_X;
    // Floor support depends on the player's CENTER. Overlapping a ledge with
    // one foot cannot magically prevent a fall into an actual pit.
    if(canLand(prevY,this.y,this.vy,px,this.things)){
      this.y=GROUND-25;this.vy=0;this.motion="grounded";
    }else this.motion=this.vy<0?"jumping":"falling";
    if(this.y>H+30){this.die();return;}
    // Continuous hitbox sweep with shared rules covered by unit tests.
    const swept={beforeX:prevX,afterX:px,beforeY:prevY,afterY:this.y};
    for(const t of this.things){
      if(t.collected||t.kind==="gap")continue;
      const touching=intersectsThing(t,swept);
      if((t.kind==="essence"||t.kind==="orb")&&touching){
        if(t.kind==="orb"){
          this.ep=Math.min(100,this.ep+25);t.collected=true;this.orbs++;
          this.particles.burst("orb",PLAYER_X+8,this.y+10,13);retroAudio.play("orb");
        } else if(this.material==="physical"){
          this.score++;t.collected=true;
          this.particles.burst("collect",PLAYER_X+8,this.y+10,10);retroAudio.play("collect");
        }
      }else if(touching&&t.kind==="wall"&&this.material==="physical"){this.die();return;}
      else if(touching&&t.kind==="ward"&&this.material==="intangible"){this.die();return;}
    }
    for(const t of this.things){
      if(t.kind==="wall"&&!t.counted&&px-10>t.x+t.width){t.counted=true;this.walls++;}
    }
    this.updateTutorial(px);
    this.things=this.things.filter(t=>{
      if(t.x+t.width<=this.distance-60){t.sprite?.destroy();return false;}
      return true;
    });
    while(this.spawnAt<this.distance+W+240)this.generate();
    this.particles.update(dt,PLAYER_X,this.y+15,this.material==="intangible");
  }
  private die(){
    if(!this.alive)return;
    this.alive=false;
    this.material="physical";
    this.particles.burst("hit",PLAYER_X,this.y+15,24);
    retroAudio.stop();
    retroAudio.play("hit");
    const stats:RunStats={
      meters:Math.floor(this.distance/10),essence:this.score,
      jumps:this.jumps,phases:this.phases,walls:this.walls,orbs:this.orbs,
      tier:difficulty(this.distance).tier
    };
    const result=progressStore.finish(stats);
    if(result.newRecord&&result.previousBest>0)retroAudio.play("record");
    this.scene.start("results",{stats,progress:result.progress,
      newRecord:result.newRecord,unlocked:result.unlocked,
      forceTutorial:this.forceTutorial});
  }
  private draw(){
    this.backdrop.mountains.tilePositionX=this.distance*.08;
    this.backdrop.forest.tilePositionX=this.distance*.23;
    this.groundTiles.tilePositionX=this.distance;
    const g=this.world;
    g.clear();
    for(const t of this.things){
      const x=Math.floor(t.x-this.distance);
      if(x<-65||x>W+50)continue;
      if(t.kind==="gap"){
        g.fillStyle(0x171633).fillRect(x,211,t.width,H-211);
        g.fillStyle(0x77699d).fillRect(x-2,211,2,5).fillRect(x+t.width,211,2,5);
      }else if(t.sprite){
        t.sprite.setX(Math.round(x+t.width/2)).setVisible(!t.collected);
        if(t.kind==="orb"||t.kind==="essence")
          t.sprite.setY(GROUND-29+Math.round(Math.sin(this.distance/30+t.x)*2));
      }
    }
    const frame=Math.floor(this.elapsed*9)%6;
    const intangible=this.material==="intangible";
    const airborne=this.motion!=="grounded";
    const texture=appearanceTexture(this.heroId,this.accessoryId,intangible,
      airborne?"jump":frame);
    if(this.alive){
      this.phantom.setTexture(texture)
        .setPosition(PLAYER_X,Math.round(this.y+16))
        .setAlpha(intangible?.78+.09*Math.sin(this.elapsed*16):1)
        .setScale(intangible?1+.025*Math.sin(this.elapsed*12):1);
    }else this.phantom.setTexture(
      appearanceTexture(this.heroId,this.accessoryId,false,"hurt")).setAlpha(1).setScale(1);
    const hudText="PHANTOM   "+Math.floor(this.distance/10)+" m   ◆ "+this.score;
    if(hudText!==this.lastHud){this.hud.setText(hudText);this.lastHud=hudText;}
    const currentTier=difficulty(this.distance).tier;
    if(currentTier!==this.lastTier){
      this.tierLabel.setText("NÍVEL "+currentTier);
      this.lastTier=currentTier;
    }
    if(this.tutorialEndTime>0&&this.elapsed>this.tutorialEndTime){
      this.tutorialBanner.setVisible(false);this.tutorialEndTime=0;
    }
    this.energyBar.clear();
    this.energyBar.fillStyle(0x11122f).fillRoundedRect(8,27,122,12,2);
    this.energyBar.fillStyle(this.ep<20?0xf49c86:0x60d8f8)
      .fillRect(11,30,Math.floor(116*this.ep/100),6);
    this.energyBar.lineStyle(1,0xc9c5ff).strokeRoundedRect(8,27,122,12,2);
  }

}

new Phaser.Game({
  type:Phaser.AUTO,width:W,height:H,parent:"game",backgroundColor:"#171733",
  render:{pixelArt:true,antialias:false},
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  scene:[MenuScene,GameScene,ResultsScene,AchievementsScene,ShopScene]
});
