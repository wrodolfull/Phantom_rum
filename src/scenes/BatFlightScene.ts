import Phaser from "phaser";
import {setupVisuals,addBackdrop,ensureAppearanceVisuals,appearanceTexture} from "../art/pixelArt";
import {ensureBatArt,BAT_POSSESSED_KEY} from "../art/batArt";
import {retroAudio} from "../audio/RetroAudio";
import {PhantomEffects} from "../effects/PhantomEffects";
import {activeAppearance} from "../shop/economy";
import {progressStore} from "../progression/progress";
import {mergeRun,type RunSnapshot} from "../game/modes";
import {reportMode} from "../game/diagnostics";
import {ChaseClock} from "../game/ChaseClock";
import {
  BAT_FLIGHT_SECONDS,BAT_MAX_ESSENCE,BAT_FLIGHT_LANES,
  BAT_PLAYER_X,BAT_FLIGHT_SPEED,FLIGHT_PICKUPS,
  flightPickupX,flightPickupCrossed,flightEarnedDistance,
  flightEssence,flightComplete,type FlightLane
} from "../game/batFlight";

const W=480,H=270;
type FlightKey="ArrowUp"|"ArrowDown"|"KeyW"|"KeyS"|"Space"|"KeyX";
export class BatFlightScene extends Phaser.Scene{
  private run!:RunSnapshot;
  private clock=new ChaseClock();
  private startedAt=0;
  private activeSeconds=0;
  private elapsed=0;
  private lane:FlightLane=1;
  private y:number=BAT_FLIGHT_LANES[1];
  private earned=0;
  private collected=new Set<number>();
  private flying!:Phaser.GameObjects.Image;
  private phantom!:Phaser.GameObjects.Image;
  private background!:ReturnType<typeof addBackdrop>;
  private wind!:Phaser.GameObjects.Graphics;
  private hud!:Phaser.GameObjects.Text;
  private timeBar!:Phaser.GameObjects.Graphics;
  private notice!:Phaser.GameObjects.Text;
  private pauseButton!:Phaser.GameObjects.Text;
  private pauseOverlay!:Phaser.GameObjects.Text;
  private effects!:PhantomEffects;
  private gems=new Map<number,Phaser.GameObjects.Image>();
  private paused=false;
  private landing=false;
  private landed=false;
  private landingAt=0;
  private landingStartY=0;
  private phaseTime=0;
  private pointerDownId:number|null=null;
  private skin!:ReturnType<typeof activeAppearance>;
  constructor(){super("bat-flight");}
  init(snapshot:RunSnapshot){
    this.run={...snapshot,batDone:true,chaseDone:true};
    reportMode("bat-flight","essence bonus");
  }
  create(){
    this.lane=1;this.y=BAT_FLIGHT_LANES[1];
    this.earned=0;this.collected.clear();this.gems.clear();
    this.paused=false;this.landing=false;this.landed=false;
    this.phaseTime=0;this.elapsed=0;this.activeSeconds=0;
    this.pointerDownId=null;
    this.startedAt=Date.now();this.clock.reset(this.startedAt);
    retroAudio.start();
    setupVisuals(this);ensureBatArt(this);
    this.skin=activeAppearance(progressStore.load());
    ensureAppearanceVisuals(this,this.skin.hero,this.skin.accessory);
    this.background=addBackdrop(this,0);
    this.background.graves.setAlpha(.36);
    this.background.forest.setTint(0x93aadd);
    this.background.mountains.setTint(0x8d83c2);
    this.add.graphics().setDepth(-12).fillStyle(0x241c43,.82)
      .fillRect(0,219,W,H-219);
    this.wind=this.add.graphics().setDepth(-2);
    // Existing 2D canvas stays; flight art uses only existing 16-bit textures.
    this.flying=this.add.image(BAT_PLAYER_X,this.y,BAT_POSSESSED_KEY)
      .setDepth(12).setScale(1.23);
    this.phantom=this.add.image(BAT_PLAYER_X,-55,
      appearanceTexture(this.skin.hero,this.skin.accessory,false,"jump"))
      .setDepth(13).setVisible(false);
    this.effects=new PhantomEffects(this);
    for(const pickup of FLIGHT_PICKUPS){
      this.gems.set(pickup.id,this.add.image(
        pickup.startX,BAT_FLIGHT_LANES[pickup.lane],"essence")
        .setDepth(8).setScale(1.15));
    }
    this.add.graphics().setDepth(27).setScrollFactor(0)
      .fillStyle(0x1d1b40,.9).fillRoundedRect(5,4,292,42,5)
      .lineStyle(1,0x866fc0).strokeRoundedRect(5,4,292,42,5);
    this.hud=this.add.text(11,8,"",{
      fontFamily:"monospace",fontSize:"10px",color:"#f6f3ff",
      stroke:"#171333",strokeThickness:2
    }).setDepth(30).setScrollFactor(0);
    this.timeBar=this.add.graphics().setDepth(30).setScrollFactor(0);
    this.notice=this.add.text(W/2,57,
      "PHANTOM INCORPOROU O MORCEGO!\nDESLIZE ↑ ↓ PARA PEGAR ESSÊNCIAS",{
        fontFamily:"monospace",fontSize:"9px",color:"#fff8df",
        align:"center",backgroundColor:"#54446c",padding:{x:8,y:5}
      }).setOrigin(.5,0).setDepth(34).setScrollFactor(0);
    this.pauseButton=this.add.text(448,8,"Ⅱ",{
      fontFamily:"monospace",fontSize:"14px",color:"#ffffff",
      backgroundColor:"#3b325e",padding:{x:8,y:6}
    }).setDepth(35).setScrollFactor(0).setInteractive({useHandCursor:true});
    this.pauseButton.on("pointerdown",()=>this.togglePause());
    this.pauseOverlay=this.add.text(W/2,H/2,
      "PAUSADO\n\nESC OU ▶ PARA CONTINUAR",{
        fontFamily:"monospace",fontSize:"15px",color:"#ffffff",
        backgroundColor:"#31294d",padding:{x:15,y:12},align:"center"
      }).setOrigin(.5).setDepth(45).setVisible(false).setScrollFactor(0);
    this.input.addPointer(3);
    this.input.on("pointerdown",(p:Phaser.Input.Pointer,over:Phaser.GameObjects.GameObject[])=>{
      if(this.paused||this.landing||p.y<45||over.length>0)return;
      this.pointerDownId=p.id;
      this.chooseLane(p.y);
    });
    this.input.on("pointermove",(p:Phaser.Input.Pointer)=>{
      if(this.pointerDownId===p.id&&!this.paused&&!this.landing)
        this.chooseLane(p.y);
    });
    this.input.on("pointerup",(p:Phaser.Input.Pointer)=>{
      if(this.pointerDownId===p.id)this.pointerDownId=null;
    });
    this.input.on("pointerupoutside",(p:Phaser.Input.Pointer)=>{
      if(this.pointerDownId===p.id)this.pointerDownId=null;
    });
    window.addEventListener("keydown",this.onKeyDown);
    window.addEventListener("blur",this.onBlur);
    document.addEventListener("visibilitychange",this.onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      window.removeEventListener("keydown",this.onKeyDown);
      window.removeEventListener("blur",this.onBlur);
      document.removeEventListener("visibilitychange",this.onVisibility);
      this.pointerDownId=null;
      retroAudio.stop();
    });
    document.documentElement.dataset.phantomFlightEssence="0";
    document.documentElement.dataset.phantomFlightSeconds="0.0";
    this.cameras.main.fadeIn(520,20,16,54);
  }
  private onBlur=()=>{
    if(this.sys.isActive()&&!this.paused&&!this.landing)this.togglePause();
  };
  private onVisibility=()=>{if(document.hidden)this.onBlur();};
  private onKeyDown=(event:KeyboardEvent)=>{
    if(!this.sys.isActive()||event.repeat)return;
    if(event.code==="Escape"){
      event.preventDefault();this.togglePause();return;
    }
    if(this.paused||this.landing)return;
    const code=event.code as FlightKey;
    if(code==="ArrowUp"||code==="KeyW"||code==="Space"){
      event.preventDefault();
      this.lane=Math.max(0,this.lane-1) as FlightLane;
    }else if(code==="ArrowDown"||code==="KeyS"){
      event.preventDefault();
      this.lane=Math.min(2,this.lane+1) as FlightLane;
    }else if(code==="KeyX"){
      const query=new URLSearchParams(location.search);
      if(query.has("test_flight")&&query.has("qa_exit"))this.beginLanding();
    }
  };
  private chooseLane(y:number){
    const distances=BAT_FLIGHT_LANES.map(v=>Math.abs(v-y));
    this.lane=distances.indexOf(Math.min(...distances)) as FlightLane;
  }
  private togglePause(){
    if(this.landing)return;
    this.paused=!this.paused;
    this.pointerDownId=null;
    this.clock.resume(Date.now());
    this.pauseButton.setText(this.paused?"▶":"Ⅱ");
    this.pauseOverlay.setVisible(this.paused);
    retroAudio.pause(this.paused);
  }
  update(_now:number,_deltaMs:number){
    const dt=this.clock.tick(Date.now(),this.paused);
    if(this.paused)return;
    this.phaseTime+=dt;
    if(this.landing){this.animateLanding(dt);return;}
    const before=this.elapsed;
    const wall=Math.max(0,(Date.now()-this.startedAt)/1000);
    this.elapsed=Math.min(BAT_FLIGHT_SECONDS,wall,this.elapsed+dt);
    this.activeSeconds+=dt;
    this.y=Phaser.Math.Linear(this.y,BAT_FLIGHT_LANES[this.lane],
      Math.min(1,dt*12));
    this.flying.setPosition(BAT_PLAYER_X,this.y+Math.sin(this.phaseTime*10)*2.5)
      .setScale(1.23,1.14+.13*Math.sin(this.phaseTime*17));
    this.background.mountains.tilePositionX+=dt*17;
    this.background.forest.tilePositionX+=dt*36;
    this.background.graves.tilePositionX+=dt*63;
    this.wind.clear();
    for(let i=0;i<15;i++){
      const cycle=260+(i*19)%130;
      const x=((i*77-this.elapsed*260)%(W+45)+(W+45))%(W+45);
      const y=52+i*11;
      this.wind.fillStyle(i%3===0?0xc6cbff:0x9b99db,.18)
        .fillRect(x,y,7+(cycle%15),1);
    }
    for(const coin of FLIGHT_PICKUPS){
      const sprite=this.gems.get(coin.id)!;
      const x=flightPickupX(coin,this.elapsed);
      sprite.setPosition(x,BAT_FLIGHT_LANES[coin.lane]+
        Math.sin(this.elapsed*6+coin.id)*2);
      sprite.setVisible(!this.collected.has(coin.id)&&x>-30&&x<520);
      if(this.collected.has(coin.id))continue;
      if(flightPickupCrossed(coin,before,this.elapsed,this.lane)){
        this.collected.add(coin.id);
        if(this.earned<BAT_MAX_ESSENCE){
          this.earned++;
          this.effects.burst("collect",BAT_PLAYER_X,
            BAT_FLIGHT_LANES[coin.lane],12);
          retroAudio.play("collect");
        }
      }
    }
    this.effects.update(dt,BAT_PLAYER_X,this.y,true);
    this.timeBar.clear()
      .fillStyle(0x242141).fillRect(11,35,175,5)
      .fillStyle(0x8de6fa).fillRect(11,35,
        Math.round(175*this.elapsed/BAT_FLIGHT_SECONDS),5);
    this.hud.setText("VOO ESPECTRAL   ◆ +"+this.earned+"/"+BAT_MAX_ESSENCE+
      "\n"+Math.ceil(BAT_FLIGHT_SECONDS-this.elapsed)+
      "s  •  +"+Math.floor(flightEarnedDistance(this.elapsed)/10)+" m");
    this.notice.setVisible(this.elapsed<3);
    document.documentElement.dataset.phantomFlightSeconds=this.elapsed.toFixed(1);
    document.documentElement.dataset.phantomFlightEssence=String(this.earned);
    document.documentElement.dataset.phantomFlightLane=String(this.lane);
    if(flightComplete(this.elapsed,wall))this.beginLanding();
    retroAudio.update();
  }
  private beginLanding(){
    if(this.landing)return;
    this.landing=true;this.landingAt=0;
    this.landingStartY=this.y;
    this.flying.setVisible(false);
    this.phantom.setVisible(true).setPosition(BAT_PLAYER_X,-45);
    this.notice.setText("FIM DA INCORPORAÇÃO\nPHANTOM ESTÁ ATERRISSANDO...")
      .setVisible(true);
    this.cameras.main.flash(180,180,212,255);
    this.effects.burst("phaseOff",BAT_PLAYER_X,this.y,25);
    reportMode("bat-landing","+ "+this.earned+" essence");
  }
  private animateLanding(dt:number){
    this.landingAt+=dt;
    const progress=Math.min(1,this.landingAt/1.15);
    const ease=1-Math.pow(1-progress,3);
    this.phantom.setPosition(BAT_PLAYER_X,
      Phaser.Math.Linear(-48,186,ease)).setAngle(Math.sin(progress*8)*5);
    this.background.graves.tilePositionX+=dt*45;
    this.effects.update(dt,BAT_PLAYER_X,this.phantom.y,false);
    if(progress>=1&&!this.landed){
      this.landed=true;
      this.effects.burst("jump",BAT_PLAYER_X,206,13);
      retroAudio.play("jump");
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,()=>{
        const resume=mergeRun(this.run,{
          distancePx:this.run.distancePx+flightEarnedDistance(this.elapsed),
          essence:this.run.essence+this.earned,
          energy:Math.min(100,this.run.energy+this.activeSeconds*8),
          batDone:true
        });
        this.scene.start("game",{resume});
      });
      this.cameras.main.fadeOut(470,25,19,54);
    }
  }
}
