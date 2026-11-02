import Phaser from "phaser";
import "./style.css";
import {setupVisuals,addBackdrop,ensureAppearanceVisuals,appearanceTexture} from "./art/pixelArt";
import { retroAudio } from "./audio/RetroAudio";
import { PhantomEffects } from "./effects/PhantomEffects";
import {CoursePlanner,FIRST_SEGMENT_START,GROUND_Y,difficulty,
  requiresIntangible,requiresPhysical,type ObstacleKind} from "./world/course";
import { canLand, intersectsThing } from "./world/collisions";
import {progressStore,type RunStats} from "./progression/progress";
import {tutorialHint} from "./tutorial/tutorial";
import {ResultsScene,AchievementsScene} from "./scenes/ProgressScenes";
import {ShopScene} from "./scenes/ShopScene";
import {ChaseScene} from "./scenes/ChaseScene";
import {ChaseFallbackScene} from "./scenes/ChaseFallbackScene";
import {PlatformScene} from "./scenes/PlatformScene";
import {BatFlightScene} from "./scenes/BatFlightScene";
import {ensureBatArt,BAT_SPECIAL_KEY} from "./art/batArt";
import {
  BAT_TRIGGER_PX,BAT_SPAWN_AHEAD_PX,BAT_PLAYER_X,
  batRelativeX,batTargetRadius,batCanCapture,batAttempt,batHasLeft,
  shouldSpawnBat,nextBatDistance
} from "./game/batFlight";
import {PLATFORM_START_PX,shouldStartPlatform} from "./game/platformLevel";
import {CHASE_START_PX,shouldStartChase,type RunSnapshot} from "./game/modes";
import {reportMode} from "./game/diagnostics";
import {activeAppearance} from "./shop/economy";
import type {HeroId,AccessoryId} from "./shop/catalog";
import {GestureInput} from "./input/touchControls";
import {FrameMonitor} from "./performance/frameMonitor";
import {initFullscreen} from "./fullscreen";
import {ensureHunterHordeArt,PURSUER_TEXTURES,SOUL_PICKUP_TEXTURE,SOUL_FOLLOWER_TEXTURE}
  from "./art/hunterHordeArt";
import {
  initialHunterState,tickHunter,hunterHit,rescueSoul,activateSpectralWave,
  canActivateSpectralWave,hunterScreenX,waveBreaksObstacle,
  SOUL_FIRST_AT_PX,SOUL_SPAWN_SPACING_PX,MAX_SOUL_COMPANIONS,
  SOUL_WAVE_COST,soulPickupReached,safeSoulLocation,
  type HunterState,type HunterHitKind
} from "./game/hunterHorde";

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
type Thing = { kind: ObstacleKind; x: number; width: number; collected?: boolean; counted?: boolean; hit?:boolean; sprite?: Phaser.GameObjects.Image };
type SoulOnCourse={x:number;collected:boolean;sprite:Phaser.GameObjects.Image};
type Motion = "grounded" | "jumping" | "falling";
type Material = "physical" | "intangible";

class MenuScene extends Phaser.Scene {
  constructor() { super("menu"); }
  create() {
    reportMode("menu");
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
    const launch=(forceTutorial=false)=>{
      retroAudio.start();
      if(new URLSearchParams(location.search).has("test_flight")){
        this.scene.start("bat-flight",{
          distancePx:BAT_TRIGGER_PX,energy:100,
          essence:0,jumps:0,phases:0,walls:0,orbs:0,
          forceTutorial:false,chaseDone:true,platformDone:true,batDone:true
        } satisfies RunSnapshot);
      }else if(new URLSearchParams(location.search).has("test_bat")){
        this.scene.start("game",{resume:{
          distancePx:BAT_TRIGGER_PX,energy:100,
          essence:0,jumps:0,phases:0,walls:0,orbs:0,
          forceTutorial:false,chaseDone:true,platformDone:true,batDone:false
        } satisfies RunSnapshot});
      }else if(new URLSearchParams(location.search).has("test_platform")){
        // Direct QA access to the new platform chapter; normal gameplay
        // still requires completing the 3D chase first.
        this.scene.start("platform",{
          distancePx:PLATFORM_START_PX,energy:100,
          essence:0,jumps:0,phases:0,walls:0,orbs:0,
          forceTutorial:false,chaseDone:true,platformDone:false
        } satisfies RunSnapshot);
      }else if(new URLSearchParams(location.search).has("test_chase")){
        // Local QA shortcut; real runs always trigger at 800m.
        this.scene.start("chase",{distancePx:CHASE_START_PX,energy:100,
          essence:0,jumps:0,phases:0,walls:0,orbs:0,
          forceTutorial:false,chaseDone:true} satisfies RunSnapshot);
      }else this.scene.start("game",{forceTutorial});
    };
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
      ?"TOQUE = PULA    SEGURAR = INTANGÍVEL"
      :"CLIQUE = PULA   SEGURAR = INTANGÍVEL",
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
  private hunterState:HunterState=initialHunterState();
  private hunterSprite!:Phaser.GameObjects.Image;
  private soulFollowers:Phaser.GameObjects.Image[]=[];
  private soulPickups:SoulOnCourse[]=[];
  private nextSoulAt=SOUL_FIRST_AT_PX;
  private hunterHud!:Phaser.GameObjects.Text;
  private hunterBar!:Phaser.GameObjects.Graphics;
  private waveButton!:Phaser.GameObjects.Text;
  private hunterNotice!:Phaser.GameObjects.Text;
  private hunterNoticeTime=0;
  private waveGraphics!:Phaser.GameObjects.Graphics;
  private capturing=false;
  private pauseButton!: Phaser.GameObjects.Text;
  private musicButton!: Phaser.GameObjects.Text;
  private effectsButton!: Phaser.GameObjects.Text;
  private gesture!:GestureInput;
  private gesturePhaseHeld=false;
  private speedLines!:Phaser.GameObjects.Graphics;
  private lastRegion=-1;
  private performance=new FrameMonitor();
  private performanceText?:Phaser.GameObjects.Text;
  private performanceUpdate=0;
  private lastHud="";
  private lastTier=-1;
  private elapsed=0;
  private things: Thing[]=[];
  private distance=0;
  private speed=160;
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
  private resumeData?:RunSnapshot;
  private chaseDone=false;
  private platformDone=false;
  private batDone=false;
  private batNextAtPx=BAT_TRIGGER_PX;
  private batWorldX:number|null=null;
  private batArt?:Phaser.GameObjects.Image;
  private batRing?:Phaser.GameObjects.Graphics;
  private batPrompt?:Phaser.GameObjects.Text;
  private batMessageTime=0;
  private transitioning=false;
  private spawnAt=FIRST_SEGMENT_START;
  private planner!: CoursePlanner;
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
  private keys!: {space:Phaser.Input.Keyboard.Key; up:Phaser.Input.Keyboard.Key; shift:Phaser.Input.Keyboard.Key; esc:Phaser.Input.Keyboard.Key; music:Phaser.Input.Keyboard.Key; effects:Phaser.Input.Keyboard.Key; wave:Phaser.Input.Keyboard.Key};
  constructor(){super("game");}
  init(data?:{forceTutorial?:boolean;resume?:RunSnapshot}){
    this.resumeData=data?.resume;
    this.forceTutorial=data?.resume?.forceTutorial??(data?.forceTutorial===true);
    document.documentElement.dataset.phantomPlatformDone=String(
      data?.resume?.platformDone===true);
    document.documentElement.dataset.phantomBatDone=String(
      data?.resume?.batDone===true);
    reportMode("runner",data?.resume
      ?"returned at "+Math.floor(data.resume.distancePx/10)+"m":"fresh run");
  }
  create(){
    this.things=[];this.distance=0;this.speed=160;this.ep=100;this.y=GROUND-25;this.vy=0;this.motion="grounded";this.material="physical";this.alive=true;this.paused=false;this.jumpQueued=0;this.coyote=.1;this.holdIntangible=false;this.needsRelease=false;this.score=0;this.spawnAt=FIRST_SEGMENT_START;this.acc=0;this.planner=new CoursePlanner(Date.now());
    this.elapsed=0;this.gesturePhaseHeld=false;this.lastRegion=-1;
    this.chaseDone=false;this.platformDone=false;this.batDone=false;
    this.batWorldX=null;this.batNextAtPx=BAT_TRIGGER_PX;
    this.batMessageTime=0;this.transitioning=false;
    this.capturing=false;this.hunterState=initialHunterState();
    this.nextSoulAt=SOUL_FIRST_AT_PX;this.soulPickups=[];
    this.soulFollowers=[];this.hunterNoticeTime=0;
    this.performance.reset();this.performanceUpdate=0;this.lastHud="";this.lastTier=-1;
    this.jumps=0;this.phases=0;this.walls=0;this.orbs=0;this.tutorialEndTime=0;
    this.tutorialEnabled=this.forceTutorial||!progressStore.load().tutorialDone;
    if(this.resumeData){
      const run=this.resumeData;
      this.distance=run.distancePx;
      this.ep=run.energy;this.score=run.essence;
      this.jumps=run.jumps;this.phases=run.phases;
      this.walls=run.walls;this.orbs=run.orbs;
      this.chaseDone=run.chaseDone;
      this.platformDone=run.platformDone===true;
      this.batDone=run.batDone===true;
      this.hunterState=initialHunterState(run.hunterDanger,run.soulCompanions);
      this.nextSoulAt=this.distance+SOUL_FIRST_AT_PX;
      // A safe gap before the first obstacle on returning from the chase.
      this.spawnAt=this.distance+360;
      this.planner=new CoursePlanner(Date.now(),true);
      this.tutorialEnabled=false;
    }
    retroAudio.start();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>retroAudio.stop());
    this.backdrop = paintBackground(this,0);
    const look=activeAppearance(progressStore.load());
    this.heroId=look.hero;this.accessoryId=look.accessory;
    ensureAppearanceVisuals(this,this.heroId,this.accessoryId);
    ensureBatArt(this);
    ensureHunterHordeArt(this);
    this.groundTiles=this.add.tileSprite(0, 211, W, H-211, "ground").setOrigin(0,0).setDepth(2);
    this.world=this.add.graphics().setDepth(3);
    this.speedLines=this.add.graphics().setDepth(1);
    this.phantom=this.add.image(PLAYER_X,this.y+16,
      appearanceTexture(this.heroId,this.accessoryId,false,0)).setDepth(6);
    this.hunterSprite=this.add.image(hunterScreenX(this.hunterState.danger),
      GROUND,PURSUER_TEXTURES[0]).setOrigin(.5,1).setDepth(5);
    this.soulFollowers=Array.from({length:MAX_SOUL_COMPANIONS},()=>
      this.add.image(-20,GROUND-12,SOUL_FOLLOWER_TEXTURE)
        .setScale(.64).setDepth(5).setVisible(false));
    this.waveGraphics=this.add.graphics().setDepth(5);
    this.particles=new PhantomEffects(this);
    this.batRing=this.add.graphics().setDepth(10);
    this.batArt=this.add.image(0,GROUND-87,BAT_SPECIAL_KEY)
      .setDepth(11).setVisible(false);
    this.batPrompt=this.add.text(W/2,80,"",{
      fontFamily:"monospace",fontSize:"10px",color:"#fff4cb",
      backgroundColor:"#3a2c5b",padding:{x:7,y:4},
      stroke:"#171633",strokeThickness:2
    }).setOrigin(.5,0).setDepth(26).setVisible(false);
    this.add.graphics().setDepth(18).fillStyle(0x1c1a40, .93).fillRoundedRect(5, 4, 320, 40, 5)
      .lineStyle(1, 0x6b63a5).strokeRoundedRect(5, 4, 320, 40, 5);
    this.hud=this.add.text(10,8,"",{fontFamily:"monospace",fontSize:"12px",color:"#ffffff",stroke:"#20183c",strokeThickness:3}).setDepth(20);
    this.energyBar=this.add.graphics().setDepth(20);
    this.add.graphics().setDepth(18).fillStyle(0x201939,.9)
      .fillRoundedRect(5,46,182,30,4);
    this.hunterHud=this.add.text(10,48,"",{
      fontFamily:"monospace",fontSize:"9px",color:"#fff0ee",
      stroke:"#1d142b",strokeThickness:2
    }).setDepth(21);
    this.hunterBar=this.add.graphics().setDepth(21);
    this.hunterNotice=this.add.text(W/2,82,"",{
      fontFamily:"monospace",fontSize:"10px",color:"#f9efff",
      backgroundColor:"#4e375e",padding:{x:6,y:4},align:"center"
    }).setOrigin(.5,0).setDepth(26).setVisible(false);
    this.waveButton=this.add.text(424,206,"ONDA [Q]",{
      fontFamily:"monospace",fontSize:"9px",color:"#e5ffff",
      backgroundColor:"#33506d",padding:{x:5,y:5}
    }).setOrigin(.5).setDepth(27).setInteractive({useHandCursor:true});
    this.waveButton.on("pointerdown",()=>this.triggerSpectralWave());
    this.waveButton.setVisible(false);
    this.tierLabel=this.add.text(W-8,48,"", {fontFamily:"monospace",fontSize:"9px",color:"#dbd2ff",stroke:"#1d1a43",strokeThickness:2}).setOrigin(1,0).setDepth(20);
    this.tutorialBanner=this.add.text(W/2,109,"",{fontFamily:"monospace",fontSize:"9px",color:"#fcf8ff",backgroundColor:"#45406f",padding:{x:9,y:6},align:"center"}).setOrigin(.5,0).setDepth(23).setVisible(this.tutorialEnabled);
    this.updateTutorial(PLAYER_X);
    this.overlay=this.add.text(W/2,H/2,"",{fontFamily:"monospace",fontSize:"14px",align:"center",color:"#ffffff",backgroundColor:"#332850",padding:{x:14,y:10}}).setOrigin(.5).setDepth(30).setVisible(false);
    this.keys=this.input.keyboard!.addKeys({
      space:Phaser.Input.Keyboard.KeyCodes.SPACE,up:Phaser.Input.Keyboard.KeyCodes.UP,
      shift:Phaser.Input.Keyboard.KeyCodes.SHIFT,esc:Phaser.Input.Keyboard.KeyCodes.ESC,
      music:Phaser.Input.Keyboard.KeyCodes.M,effects:Phaser.Input.Keyboard.KeyCodes.N,
      wave:Phaser.Input.Keyboard.KeyCodes.Q
    }) as typeof this.keys;
    const uiStyle={fontFamily:"monospace",fontSize:"10px",color:"#f2f1ff",backgroundColor:"#34305c",padding:{x:5,y:5}};
    this.musicButton=this.add.text(348,9,"",uiStyle).setDepth(25).setInteractive({useHandCursor:true});
    this.effectsButton=this.add.text(393,9,"",uiStyle).setDepth(25).setInteractive({useHandCursor:true});
    this.pauseButton=this.add.text(453,9,"Ⅱ",uiStyle).setDepth(25).setInteractive({useHandCursor:true});
    this.musicButton.on("pointerdown",()=>{retroAudio.toggleMusic();this.refreshControls();});
    this.effectsButton.on("pointerdown",()=>{retroAudio.toggleEffects();this.refreshControls();});
    this.pauseButton.on("pointerdown",()=>this.togglePause());
    this.refreshControls();
    // Canvas-wide input: tap to jump, hold to phase. No on-screen action buttons.
    this.gesture=new GestureInput({
      jump:()=>{if(this.alive&&!this.paused)this.jumpQueued=.12;},
      phase:(held)=>{this.gesturePhaseHeld=held;}
    });
    const pauseForBackground=()=>{if(this.alive&&!this.paused)this.togglePause();};
    const onVisibility=()=>{if(document.hidden)pauseForBackground();};
    document.addEventListener("visibilitychange",onVisibility);
    window.addEventListener("blur",pauseForBackground);
    window.addEventListener("keydown",this.onBatKeyDown);
    window.addEventListener("keydown",this.onHunterQADown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.gesture.clear();
      window.removeEventListener("keydown",this.onBatKeyDown);
      window.removeEventListener("keydown",this.onHunterQADown);
      document.removeEventListener("visibilitychange",onVisibility);
      window.removeEventListener("blur",pauseForBackground);
    });
    if(showDebug){
      this.performanceText=this.add.text(W/2,H-6,"",{
        fontFamily:"monospace",fontSize:"9px",color:"#aaffd9",
        backgroundColor:"#1a1a35",padding:{x:4,y:2}
      }).setOrigin(.5,1).setDepth(26);
    }
    this.input.addPointer(3);
    this.input.on("pointerdown",(p:Phaser.Input.Pointer,over:Phaser.GameObjects.GameObject[])=>{
      // HUD actions and the small top region are not jump/phase gestures.
      if(!this.alive||this.paused||this.transitioning||
        p.y<44||over.length>0)return;
      if(this.batWorldX!==null){
        const bx=this.batWorldX-this.distance;
        const by=GROUND-87+Math.sin(this.elapsed*8)*3;
        if(Math.hypot(p.x-bx,p.y-by)<=43){
          this.tryCaptureBat();
          return; // tapping the special bat never triggers an accidental jump
        }
      }
      this.gesture.press(p.id,p.x,p.y,performance.now());
    });
    this.input.on("pointermove",(p:Phaser.Input.Pointer)=>{
      this.gesture.move(p.id,p.x,p.y);
    });
    this.input.on("pointerup",(p:Phaser.Input.Pointer)=>{
      this.gesture.release(p.id,performance.now());
    });
    this.input.on("pointerupoutside",(p:Phaser.Input.Pointer)=>{
      this.gesture.cancel(p.id);
    });
    // Preload only the segment(s) actually needed ahead of the player.
    while(this.spawnAt<this.distance+W+240)this.generate();
    this.maybeSpawnSoul();
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
  private checkChaseTransition(){
    if(this.transitioning||this.chaseDone||this.distance<CHASE_START_PX)return;
    const center=this.distance+PLAYER_X;
    let nearest=Infinity;
    for(const t of this.things){
      if(t.kind==="essence"||t.kind==="orb")continue;
      const distance=t.x-center;
      if(t.x+t.width>=center-45)nearest=Math.min(nearest,distance);
    }
    if(!shouldStartChase({
      distancePx:this.distance,
      grounded:this.motion==="grounded",
      physical:this.material==="physical",
      chaseDone:this.chaseDone,
      nearestHazardPx:nearest
    }))return;
    reportMode("chase-loading","trigger "+Math.floor(this.distance/10)+"m");
    this.transitioning=true;
    this.chaseDone=true;
    this.gesture.clear();
    const run:RunSnapshot={
      distancePx:this.distance,energy:this.ep,essence:this.score,
      jumps:this.jumps,phases:this.phases,walls:this.walls,orbs:this.orbs,
      forceTutorial:this.forceTutorial,chaseDone:true,
      platformDone:this.platformDone,batDone:this.batDone
    };
    this.tutorialBanner.setVisible(true).setText("PORTAL ABERTO! A CÂMERA ESTÁ VIRANDO...");
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,()=>{
      this.scene.start("chase",run);
    });
    this.cameras.main.fadeOut(550,30,26,65);
  }
  private checkPlatformTransition(){
    if(this.transitioning||this.platformDone||!this.chaseDone||
      this.distance<PLATFORM_START_PX)return;
    const center=this.distance+PLAYER_X;
    let nearest=Infinity;
    for(const t of this.things){
      if(t.kind==="essence"||t.kind==="orb")continue;
      if(t.x+t.width>=center-45)
        nearest=Math.min(nearest,t.x-center);
    }
    if(!shouldStartPlatform({
      distancePx:this.distance,
      chaseDone:this.chaseDone,
      platformDone:this.platformDone,
      grounded:this.motion==="grounded",
      physical:this.material==="physical",
      nearestHazardPx:nearest
    }))return;
    this.transitioning=true;
    this.gesture.clear();
    const run:RunSnapshot={
      distancePx:this.distance,energy:this.ep,essence:this.score,
      jumps:this.jumps,phases:this.phases,walls:this.walls,orbs:this.orbs,
      forceTutorial:this.forceTutorial,chaseDone:true,platformDone:false,
      batDone:this.batDone
    };
    this.tutorialBanner.setVisible(true)
      .setText("UMA MANSÃO! O CAMINHO SEGUE POR DENTRO...");
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,()=>{
      this.scene.start("platform",run);
    });
    this.cameras.main.fadeOut(550,27,20,56);
  }
  private onBatKeyDown=(event:KeyboardEvent)=>{
    if(event.code==="KeyE"&&!event.repeat&&this.sys.isActive()&&
      this.alive&&!this.paused&&!this.transitioning){
      if(this.tryCaptureBat())event.preventDefault();
    }
  };
  private batRelative():number{
    return this.batWorldX===null?Infinity:
      batRelativeX(this.distance,this.batWorldX,PLAYER_X);
  }
  private tryCaptureBat():boolean{
    if(this.batWorldX===null||this.batDone)return false;
    const relative=this.batRelative();
    if(batAttempt(relative,this.batDone)!=="success")return false;
    this.batDone=true;
    this.transitioning=true;
    this.batWorldX=null;
    this.batArt?.setVisible(false);
    this.batRing?.clear();
    this.gesture.clear();
    this.gesturePhaseHeld=false;
    this.particles.burst("phaseOn",PLAYER_X,GROUND-48,26);
    retroAudio.play("phaseOn");
    this.batPrompt?.setText("INCORPORAÇÃO PERFEITA!").setVisible(true);
    const run:RunSnapshot={
      distancePx:this.distance,energy:this.ep,essence:this.score,
      jumps:this.jumps,phases:this.phases,walls:this.walls,orbs:this.orbs,
      forceTutorial:this.forceTutorial,chaseDone:true,
      platformDone:this.platformDone,batDone:true
    };
    reportMode("bat-captured","at "+Math.floor(this.distance/10)+"m");
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,()=>{
      this.scene.start("bat-flight",run);
    });
    this.cameras.main.fadeOut(460,98,76,133);
    return true;
  }
  private updateBatOpportunity(dt:number){
    if(this.transitioning||this.batDone)return;
    if(this.batMessageTime>0)this.batMessageTime=Math.max(0,this.batMessageTime-dt);
    if(this.batWorldX!==null){
      if(batHasLeft(this.batRelative())){
        this.batWorldX=null;this.batArt?.setVisible(false);
        this.batRing?.clear();
        this.batMessageTime=1.7;
        this.batPrompt?.setText("MORCEGO ESCAPOU! OUTRA CHANCE MAIS ADIANTE.")
          .setVisible(true);
        this.batNextAtPx=nextBatDistance(this.distance);
        document.documentElement.dataset.phantomBatStatus="missed";
      }
      return;
    }
    if(this.distance<this.batNextAtPx)return;
    const center=this.distance+PLAYER_X;
    let nearest=Infinity;
    for(const t of this.things){
      if(t.collected||t.kind==="orb"||t.kind==="essence")continue;
      if(t.x+t.width>=center-45)nearest=Math.min(nearest,t.x-center);
    }
    if(!shouldSpawnBat({
      distancePx:this.distance,platformDone:this.platformDone,
      batDone:this.batDone,grounded:this.motion==="grounded",
      physical:this.material==="physical",nearestHazardPx:nearest
    },this.batNextAtPx))return;
    // Cinematic safe pocket: remove future physical hazards from the brief
    // capture corridor; collectibles remain and the course resumes after it.
    this.things=this.things.filter(t=>{
      if(t.kind==="essence"||t.kind==="orb")return true;
      const x=t.x-center;
      if(x>=65&&x<=BAT_SPAWN_AHEAD_PX+85){
        t.sprite?.destroy();return false;
      }
      return true;
    });
    this.batWorldX=center+BAT_SPAWN_AHEAD_PX;
    this.batMessageTime=0;
    document.documentElement.dataset.phantomBatStatus="approaching";
    this.batArt?.setVisible(true);
    this.batPrompt?.setText("MORCEGO RARO! CÍRCULO MENOR = HORA DE TOCAR")
      .setVisible(true);
  }
  private drawBat(){
    this.batRing?.clear();
    if(this.batWorldX===null){
      if(!this.transitioning&&this.batMessageTime<=0)this.batPrompt?.setVisible(false);
      return;
    }
    const relative=this.batRelative(),x=this.batWorldX-this.distance;
    const y=GROUND-87+Math.sin(this.elapsed*8)*3;
    const ready=batCanCapture(relative);
    document.documentElement.dataset.phantomBatStatus=ready?"ready":"approaching";
    document.documentElement.dataset.phantomBatRelative=relative.toFixed(1);
    this.batArt?.setVisible(true).setPosition(x,y)
      .setScale(1.03,1+.1*Math.sin(this.elapsed*16));
    const radius=batTargetRadius(relative);
    const color=ready?0x7dffd8:0xffdb8f;
    const alpha=.72+.18*Math.sin(this.elapsed*13);
    this.batRing?.lineStyle(2,color,alpha).strokeCircle(x,y,radius);
    this.batRing?.lineStyle(1,0xe9faff,.4).strokeCircle(x,y,radius+5);
    this.batPrompt?.setVisible(relative<310)
      .setText(ready?"AGORA! TOQUE NO MORCEGO OU APERTE E":
        "MORCEGO RARO! O CÍRCULO ESTÁ DIMINUINDO...");
  }
  private showHunterNotice(message:string,seconds=1.5){
    this.hunterNotice.setText(message).setVisible(true);
    this.hunterNoticeTime=seconds;
  }
  private sufferHunterHit(kind:HunterHitKind):void{
    const result=hunterHit(this.hunterState,kind);
    if(!result.hit)return;
    this.hunterState=result.state;
    this.particles.burst("hit",PLAYER_X,this.y+15,18);
    retroAudio.play("hit");
    this.cameras.main.shake(100,.006);
    if(result.protectedBySoul)
      this.showHunterNotice("UMA ALMA PROTEGEU PHANTOM! +"+result.amount+" PERIGO");
    else this.showHunterNotice("O CAÇADOR SE APROXIMA! +"+result.amount+" PERIGO");
    if(result.caught)this.die();
  }
  private rescueFromPit():void{
    // Falling is another mistake, NOT a one-hit kill. Recover on safe ground
    // beyond the pit and award the same brief protection as a normal impact.
    const center=this.distance+PLAYER_X;
    const pit=this.things.find(t=>t.kind==="gap"&&
      t.x<=center+65&&t.x+t.width>=center-90);
    const safeCenter=pit?pit.x+pit.width+48:center+140;
    this.distance=Math.max(this.distance,safeCenter-PLAYER_X);
    this.y=GROUND-25;this.vy=0;this.motion="grounded";
    this.material="physical";this.gesture.clear();this.gesturePhaseHeld=false;
    this.jumpQueued=0;this.coyote=.12;
    this.sufferHunterHit("pit");
  }
  private maybeSpawnSoul():void{
    // Spawn only inside the currently planned path; use the same safe-space
    // check as the segment generator to keep pickups away from hazards.
    let attempts=0;
    while(this.nextSoulAt<this.distance+W+350&&
      this.nextSoulAt<this.spawnAt-100&&attempts++<3){
      const at=safeSoulLocation(this.nextSoulAt,this.things);
      this.nextSoulAt=at+SOUL_SPAWN_SPACING_PX;
      const sprite=this.add.image(at,GROUND-20,SOUL_PICKUP_TEXTURE)
        .setDepth(5).setScale(.85);
      this.soulPickups.push({x:at,collected:false,sprite});
    }
  }
  private collectNearbySouls(previousX:number,currentX:number):void{
    for(const soul of this.soulPickups){
      if(soul.collected)continue;
      if(!soulPickupReached(previousX,currentX,soul.x,
        this.motion==="grounded",this.material==="physical"))continue;
      soul.collected=true;
      soul.sprite.setVisible(false);
      const wasFull=this.hunterState.companions>=MAX_SOUL_COMPANIONS;
      this.hunterState=rescueSoul(this.hunterState);
      this.particles.burst("collect",PLAYER_X+8,GROUND-20,12);
      retroAudio.play("collect");
      this.showHunterNotice(wasFull?"ALMA RESGATADA! PERIGO -5":
        "ALMA RESGATADA! ELA SEGUE VOCÊ!");
    }
    this.soulPickups=this.soulPickups.filter(soul=>{
      if(soul.collected||soul.x<this.distance-70){
        soul.sprite.destroy();return false;
      }
      return true;
    });
  }
  private triggerSpectralWave():void{
    if(!this.alive||this.paused||this.transitioning||
      !canActivateSpectralWave(this.hunterState))return;
    this.hunterState=activateSpectralWave(this.hunterState);
    this.showHunterNotice("ONDA ESPECTRAL! ABRINDO CAMINHO",2);
    this.particles.burst("phaseOn",PLAYER_X,GROUND-34,25);
    retroAudio.play("phaseOn");
    // The wave clears physical threats within sight but never pits,
    // spectral wards, collectibles or the progression transition.
    for(const t of this.things){
      const ahead=t.x-this.distance-PLAYER_X;
      if(!t.collected&&waveBreaksObstacle(t.kind)&&ahead>=-22&&ahead<340){
        t.collected=true;t.sprite?.setVisible(false);
      }
    }
  }
  private drawHunterAndSouls():void{
    this.hunterSprite.setTexture(PURSUER_TEXTURES[Math.floor(this.elapsed*7)%2])
      .setPosition(hunterScreenX(this.hunterState.danger),
        GROUND+Math.sin(this.elapsed*12)*1.4)
      .setTint(this.hunterState.danger>=80?0xff9eaf:0xffffff);
    for(let i=0;i<this.soulFollowers.length;i++){
      const sprite=this.soulFollowers[i];
      const visible=i<this.hunterState.companions;
      sprite.setVisible(visible);
      if(!visible)continue;
      const targetX=PLAYER_X-20-i*12;
      const targetY=this.y+15-9-(i%2)*12;
      sprite.setPosition(targetX,
        targetY+Math.sin(this.elapsed*6+i*.8)*2);
      sprite.setAlpha(this.hunterState.waveSeconds>0?.9:1);
    }
    for(const soul of this.soulPickups){
      if(soul.collected)continue;
      const x=soul.x-this.distance;
      soul.sprite.setPosition(Math.round(x),
        GROUND-22+Math.sin(this.elapsed*4+soul.x*.01)*3);
      soul.sprite.setVisible(x>-30&&x<W+30);
    }
    this.waveGraphics.clear();
    if(this.hunterState.waveSeconds>0){
      const phase=this.elapsed*6;
      const radius=22+Math.sin(phase)*4;
      this.waveGraphics.lineStyle(2,0x8dedff,.78)
        .strokeCircle(PLAYER_X,this.y+16,radius);
      this.waveGraphics.lineStyle(1,0xc7afff,.43)
        .strokeCircle(PLAYER_X,this.y+16,radius+10);
    }
    this.hunterHud.setText("CAÇADOR "+Math.ceil(this.hunterState.danger)+
      "/100   ALMAS "+this.hunterState.companions);
    this.hunterBar.clear()
      .fillStyle(0x26213f).fillRect(10,64,170,7)
      .fillStyle(this.hunterState.danger>=75?0xff7d8d:
        this.hunterState.danger>=45?0xffc277:0x8bd8f3)
      .fillRect(12,66,Math.round(166*this.hunterState.danger/100),3);
    this.waveButton.setVisible(canActivateSpectralWave(this.hunterState));
    if(this.hunterNoticeTime<=0)this.hunterNotice.setVisible(false);
    document.documentElement.dataset.phantomHunterDanger=
      String(Math.ceil(this.hunterState.danger));
    document.documentElement.dataset.phantomSoulCompanions=
      String(this.hunterState.companions);
    document.documentElement.dataset.phantomWaveActive=
      String(this.hunterState.waveSeconds>0);
  }
  private onHunterQADown=(event:KeyboardEvent)=>{
    if(!new URLSearchParams(location.search).has("test_hunter")||
      !this.sys.isActive()||event.repeat||!this.alive||this.paused)return;
    if(event.code==="KeyH"){
      event.preventDefault();
      // QA only: simulate separated collisions without waiting for i-frames.
      this.hunterState={...this.hunterState,invulnerable:0};
      this.sufferHunterHit("obstacle");
    }else if(event.code==="KeyJ"){
      event.preventDefault();
      this.hunterState=rescueSoul(this.hunterState);
      this.showHunterNotice("ALMA RESGATADA (TESTE)");
    }
  };
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
        const key=item.kind;
        const collectible=item.kind==="orb"||item.kind==="essence";
        const y=collectible?GROUND-22:item.kind==="bat"?GROUND-14:GROUND;
        thing.sprite=this.add.image(item.x+item.width/2,y,key)
          .setOrigin(.5,collectible?.5:1)
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
    this.gesture?.clear();
  }
  update(_time:number,delta:number){
    const jump=Phaser.Input.Keyboard.JustDown(this.keys.space)||Phaser.Input.Keyboard.JustDown(this.keys.up);
    if(!this.alive){
      if(jump&&!this.capturing)this.scene.restart({forceTutorial:this.forceTutorial});
      else this.particles.update(Math.min(delta/1000,.05),PLAYER_X,this.y+16,false);
      return;
    }
    if(Phaser.Input.Keyboard.JustDown(this.keys.esc))this.togglePause();
    if(Phaser.Input.Keyboard.JustDown(this.keys.music)){retroAudio.toggleMusic();this.refreshControls();}
    if(Phaser.Input.Keyboard.JustDown(this.keys.effects)){retroAudio.toggleEffects();this.refreshControls();}
    if(Phaser.Input.Keyboard.JustDown(this.keys.wave))this.triggerSpectralWave();
    if(this.paused||this.transitioning)return;
    this.gesture.update(performance.now());
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
    this.hunterState=tickHunter(this.hunterState,dt);
    if(this.hunterNoticeTime>0)
      this.hunterNoticeTime=Math.max(0,this.hunterNoticeTime-dt);
    const previousMaterial=this.material;
    this.holdIntangible=this.keys.shift.isDown||this.gesturePhaseHeld;
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
    // Brief cinematic slowdown makes the precise capture window fair
    // on a touchscreen without changing hitboxes or chase/platform timing.
    this.speed=difficulty(this.distance).speed*
      (this.batWorldX===null?1:.76);
    const dx=this.speed*dt;
    this.distance+=dx;
    const px=this.distance+PLAYER_X;
    // Floor support depends on the player's CENTER. Overlapping a ledge with
    // one foot cannot magically prevent a fall into an actual pit.
    if(canLand(prevY,this.y,this.vy,px,this.things)){
      this.y=GROUND-25;this.vy=0;this.motion="grounded";
    }else this.motion=this.vy<0?"jumping":"falling";
    if(this.y>H+30){this.rescueFromPit();return;}
    // Continuous hitbox sweep with shared rules covered by unit tests.
    const swept={beforeX:prevX,afterX:px,beforeY:prevY,afterY:this.y};
    for(const t of this.things){
      if(t.collected||t.kind==="gap")continue;
      const bob=t.kind==="bat"?Math.round(-5+8*Math.sin(this.elapsed*4+t.x*.014)):0;
      const touching=intersectsThing(t,swept,bob);
      if((t.kind==="essence"||t.kind==="orb")&&touching){
        if(t.kind==="orb"){
          this.ep=Math.min(100,this.ep+25);t.collected=true;this.orbs++;
          this.particles.burst("orb",PLAYER_X+8,this.y+10,13);retroAudio.play("orb");
        } else if(this.material==="physical"){
          this.score++;t.collected=true;
          this.particles.burst("collect",PLAYER_X+8,this.y+10,10);retroAudio.play("collect");
        }
      }else if(touching&&requiresIntangible(t.kind)&&this.material==="physical"){
        if(this.hunterState.waveSeconds>0&&waveBreaksObstacle(t.kind)){
          t.collected=true;t.sprite?.setVisible(false);
          this.particles.burst("phaseOn",PLAYER_X,this.y+10,8);
        }else if(!t.hit){
          t.hit=true;this.sufferHunterHit("obstacle");
          if(!this.alive)return;
        }
      }else if(touching&&requiresPhysical(t.kind)&&this.material==="intangible"){
        if(!t.hit){
          t.hit=true;this.sufferHunterHit("obstacle");
          if(!this.alive)return;
        }
      }
    }
    this.collectNearbySouls(prevX,px);
    for(const t of this.things){
      if(t.kind==="wall"&&!t.counted&&px-10>t.x+t.width){t.counted=true;this.walls++;}
    }
    this.updateTutorial(px);
    this.things=this.things.filter(t=>{
      if(t.x+t.width<=this.distance-60){t.sprite?.destroy();return false;}
      return true;
    });
    while(this.spawnAt<this.distance+W+240)this.generate();
    this.maybeSpawnSoul();
    this.particles.update(dt,PLAYER_X,this.y+15,this.material==="intangible");
    this.checkChaseTransition();
    this.checkPlatformTransition();
    this.updateBatOpportunity(dt);
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
    // Parallax depth and moving near-camera details communicate increasing pace.
    this.backdrop.mountains.tilePositionX=this.distance*.16;
    this.backdrop.forest.tilePositionX=this.distance*.37;
    this.backdrop.graves.tilePositionX=this.distance*.78;
    this.backdrop.debris.tilePositionX=this.distance*1.3;
    const region=Math.floor(this.distance/2200)%3;
    if(region!==this.lastRegion){
      const palettes=[0xffffff,0xceb4f5,0xa2ced6];
      this.backdrop.forest.setTint(palettes[region]);
      this.backdrop.graves.setTint(palettes[region]);
      this.lastRegion=region;
    }
    this.groundTiles.tilePositionX=this.distance;
    this.speedLines.clear();
    for(let i=0;i<12;i++){
      const track=W+45;
      const x=((i*71-this.distance*1.42)%track+track)%track;
      const y=169+(i*23)%43;
      this.speedLines.fillStyle(0xbee1ee,.13+(this.speed-160)/950);
      this.speedLines.fillRect(Math.floor(x),y,Math.floor(8+this.speed/12),1);
    }
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
        else if(t.kind==="bat")
          t.sprite.setY(GROUND-14+Math.round(-5+8*Math.sin(this.elapsed*4+t.x*.014)));
      }
    }
    this.drawBat();
    this.drawHunterAndSouls();
    const frame=Math.floor(this.elapsed*9)%6;
    const intangible=this.material==="intangible";
    const airborne=this.motion!=="grounded";
    const texture=appearanceTexture(this.heroId,this.accessoryId,intangible,
      airborne?"jump":frame);
    if(this.alive){
      this.phantom.setTexture(texture)
        .setPosition(PLAYER_X,Math.round(this.y+16))
        .setAlpha(this.hunterState.invulnerable>0?
          .55+.28*Math.sin(this.elapsed*22):
          intangible?.78+.09*Math.sin(this.elapsed*16):1)
        .setScale(intangible?1+.025*Math.sin(this.elapsed*12):1);
    }else this.phantom.setTexture(
      appearanceTexture(this.heroId,this.accessoryId,false,"hurt")).setAlpha(1).setScale(1);
    document.documentElement.dataset.phantomRunnerMeters=String(Math.floor(this.distance/10));
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

const game=new Phaser.Game({
  // Phaser's 2D uses Canvas to leave the only WebGL context available for Three.js.
  // Prevents competing WebGL canvases on resource-constrained mobile browsers.
  type:Phaser.CANVAS,width:W,height:H,parent:"game",backgroundColor:"#171733",
  render:{pixelArt:true,antialias:false},
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  scene:[MenuScene,GameScene,ResultsScene,AchievementsScene,ShopScene,ChaseScene,ChaseFallbackScene,PlatformScene,BatFlightScene]
});

// A single fullscreen controller is independent of scene transitions. Phaser
// recalculates FIT scaling after changing the host size or device orientation.
initFullscreen(()=>game.scale.refresh());
