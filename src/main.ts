import Phaser from "phaser";
import "./style.css";
import { setupVisuals, addBackdrop } from "./art/pixelArt";
import { retroAudio } from "./audio/RetroAudio";
import { PhantomEffects } from "./effects/PhantomEffects";

const W = 480, H = 270, GROUND = 215, PLAYER_X = 98;
const MAX_EP = 100, DRAIN = 30, REGEN = 12;
const GRAVITY = 900, JUMP = -330;
type Kind = "wall" | "gap" | "ward" | "orb" | "essence";
type Thing = { kind: Kind; x: number; width: number; collected?: boolean; sprite?: Phaser.GameObjects.Image };
type Motion = "grounded" | "jumping" | "falling";
type Material = "physical" | "intangible";
const bestKey = "phantom-run-best-v1";

class MenuScene extends Phaser.Scene {
  constructor() { super("menu"); }
  create() {
    paintBackground(this, 0);
    this.add.tileSprite(0, 211, W, H - 211, "ground").setOrigin(0, 0).setDepth(-1);
    const hero = this.add.image(W / 2, 145, "phantom-0").setScale(1.35).setDepth(4);
    this.tweens.add({targets: hero, y: 139, duration: 800, yoyo: true, repeat: -1});
    const title = this.add.text(W / 2, 69, "PHANTOM RUN", {fontFamily:"monospace",fontSize:"34px",color:"#f6f0ff",stroke:"#423575",strokeThickness:7}).setOrigin(.5);
    this.tweens.add({targets:title,y:65,duration:1100,yoyo:true,repeat:-1});
    this.add.text(W/2,117,"ATRAVESSE O IMPOSSÍVEL", {fontFamily:"monospace",fontSize:"11px",color:"#8deaff"}).setOrigin(.5);
    const start = this.add.text(W/2,171,"▶ JOGAR", {fontFamily:"monospace",fontSize:"22px",backgroundColor:"#8053bb",padding:{x:18,y:8},color:"#ffffff"}).setOrigin(.5).setInteractive({useHandCursor:true});
    const launch=()=>{retroAudio.start();this.scene.start("game");};
    start.on("pointerdown",launch);
    this.input.keyboard?.once("keydown-SPACE",launch);
    this.input.keyboard?.once("keydown-ENTER",launch);
    const buttonStyle={fontFamily:"monospace",fontSize:"10px",color:"#f6f0ff",backgroundColor:"#494078",padding:{x:7,y:4}};
    const music=this.add.text(155,206,"",buttonStyle).setOrigin(.5).setInteractive({useHandCursor:true});
    const sound=this.add.text(326,206,"",buttonStyle).setOrigin(.5).setInteractive({useHandCursor:true});
    const refresh=()=>{music.setText("MÚSICA: "+(retroAudio.musicEnabled?"ON":"OFF"));sound.setText("EFEITOS: "+(retroAudio.effectsEnabled?"ON":"OFF"));};
    music.on("pointerdown",()=>{retroAudio.toggleMusic();refresh();});
    sound.on("pointerdown",()=>{retroAudio.toggleEffects();refresh();});
    refresh();
    this.add.text(W/2,232,"ESPAÇO: PULAR  |  SHIFT: INTANGÍVEL", {fontFamily:"monospace",fontSize:"10px",color:"#c9c6ed"}).setOrigin(.5);
    this.add.text(W/2,251,"CELULAR: ESQUERDA PULA · DIREITA ATRAVESSA",{fontFamily:"monospace",fontSize:"8px",color:"#a9a8cd"}).setOrigin(.5);
  }
}

function paintBackground(scene: Phaser.Scene, distance: number) {
  setupVisuals(scene);
  return addBackdrop(scene, distance);
}

class GameScene extends Phaser.Scene {
  private world!: Phaser.GameObjects.Graphics;
  private phantom!: Phaser.GameObjects.Image;
  private backdrop!: ReturnType<typeof addBackdrop>;
  private groundTiles!: Phaser.GameObjects.TileSprite;
  private hud!: Phaser.GameObjects.Text;
  private energyBar!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Text;
  private particles!: PhantomEffects;
  private pauseButton!: Phaser.GameObjects.Text;
  private musicButton!: Phaser.GameObjects.Text;
  private effectsButton!: Phaser.GameObjects.Text;
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
  private spawnAt=450;
  private acc=0;
  private leftHeld=false;
  private rightHeld=false;
  private keys!: {space:Phaser.Input.Keyboard.Key; up:Phaser.Input.Keyboard.Key; shift:Phaser.Input.Keyboard.Key; esc:Phaser.Input.Keyboard.Key; music:Phaser.Input.Keyboard.Key; effects:Phaser.Input.Keyboard.Key};
  constructor(){super("game");}
  create(){
    this.things=[];this.distance=0;this.speed=125;this.ep=100;this.y=GROUND-25;this.vy=0;this.motion="grounded";this.material="physical";this.alive=true;this.paused=false;this.jumpQueued=0;this.coyote=.1;this.holdIntangible=false;this.needsRelease=false;this.score=0;this.spawnAt=410;this.acc=0;this.leftHeld=false;this.rightHeld=false;this.elapsed=0;
    retroAudio.start();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>retroAudio.stop());
    this.backdrop = paintBackground(this,0);
    this.groundTiles=this.add.tileSprite(0, 211, W, H-211, "ground").setOrigin(0,0).setDepth(2);
    this.world=this.add.graphics().setDepth(3);
    this.phantom=this.add.image(PLAYER_X, this.y+16, "phantom-0").setDepth(6);
    this.particles=new PhantomEffects(this);
    this.add.graphics().setDepth(18).fillStyle(0x1c1a40, .93).fillRoundedRect(5, 4, 320, 40, 5)
      .lineStyle(1, 0x6b63a5).strokeRoundedRect(5, 4, 320, 40, 5);
    this.hud=this.add.text(10,8,"",{fontFamily:"monospace",fontSize:"12px",color:"#ffffff",stroke:"#20183c",strokeThickness:3}).setDepth(20);
    this.energyBar=this.add.graphics().setDepth(20);
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
    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>{
      // HUD buttons are separate interactive targets and must not also jump/restart.
      if(p.y<46)return;
      if(!this.alive){this.scene.restart();return;}
      if(this.paused)return;
      if(p.x < W/2){this.leftHeld=true;this.jumpQueued=.1;}else this.rightHeld=true;
    });
    this.input.on("pointerup",()=>{this.leftHeld=false;this.rightHeld=false;});
    this.input.on("pointerupoutside",()=>{this.leftHeld=false;this.rightHeld=false;});
    for(let i=0;i<4;i++)this.generate();
  }
  private generate(){
    const progression=Math.min(1,this.distance/3500);
    const n=this.things.filter(t=>t.x>this.spawnAt-450).length;
    const which=(Math.floor(this.spawnAt/130)*7+n*3)%10;
    let kind:Kind=which<4?"wall":which<6?"gap":which<8?"orb":which===8&&progression>.2?"ward":"essence";
    if(this.spawnAt<700)kind=this.spawnAt<550?"wall":"orb";
    const width=kind==="gap"?45:kind==="wall"?23:kind==="ward"?13:15;
    const thing:Thing={kind,x:this.spawnAt,width};
    if(kind!=="gap"){
      const key = kind==="wall"?"wall":kind==="ward"?"ward":kind==="orb"?"orb":"essence";
      const y = (kind==="orb"||kind==="essence") ? GROUND-29 : GROUND;
      thing.sprite=this.add.image(this.spawnAt+width/2, y, key)
        .setOrigin(.5, (kind==="orb"||kind==="essence")?.5:1).setDepth(5);
    }
    this.things.push(thing);
    // All mandatory intangible obstacles are isolated by >= 150px; at max speed, this leaves >= 0.65s.
    const gap=kind==="wall"?190:kind==="gap"?175:kind==="ward"?190:125;
    this.spawnAt+=gap+Math.round(progression*20);
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
  }
  update(_time:number,delta:number){
    const jump=Phaser.Input.Keyboard.JustDown(this.keys.space)||Phaser.Input.Keyboard.JustDown(this.keys.up);
    if(!this.alive){
      if(jump)this.scene.restart();
      else this.particles.update(Math.min(delta/1000,.05),PLAYER_X,this.y+16,false);
      return;
    }
    if(Phaser.Input.Keyboard.JustDown(this.keys.esc))this.togglePause();
    if(Phaser.Input.Keyboard.JustDown(this.keys.music)){retroAudio.toggleMusic();this.refreshControls();}
    if(Phaser.Input.Keyboard.JustDown(this.keys.effects)){retroAudio.toggleEffects();this.refreshControls();}
    if(this.paused)return;
    if(jump)this.jumpQueued=.1;
    retroAudio.update();
    this.acc+=Math.min(delta/1000,.05);
    let steps=0;
    while(this.acc>=1/60&&steps++<4){this.step(1/60);this.acc-=1/60;}
    if(steps>=4)this.acc=0;
    this.draw();
  }
  private step(dt:number){
    this.elapsed+=dt;
    const previousMaterial=this.material;
    this.holdIntangible=this.keys.shift.isDown||this.rightHeld;
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
      this.particles.burst(effect,PLAYER_X,this.y+15);
      retroAudio.play(effect);
      this.cameras.main.flash(85,this.material==="intangible"?100:240,205,255);
    }
    this.jumpQueued=Math.max(0,this.jumpQueued-dt);
    if(this.motion==="grounded")this.coyote=.1;else this.coyote=Math.max(0,this.coyote-dt);
    if(this.jumpQueued>0&&this.coyote>0){
      this.particles.burst("jump",PLAYER_X,this.y+25,7);
      retroAudio.play("jump");
      this.vy=JUMP;this.motion="jumping";this.coyote=0;this.jumpQueued=0;
    }
    const prevY=this.y;
    this.vy+=GRAVITY*dt;
    this.y+=this.vy*dt;
    this.speed=Math.min(230,125+3*Math.floor(this.distance/1250));
    const dx=this.speed*dt;
    this.distance+=dx;
    // World coordinates: player is fixed horizontally at PLAYER_X.
    const px=this.distance+PLAYER_X;
    const feet=this.y+25;
    const overGap=this.things.some(t=>t.kind==="gap"&&px+9>t.x&&px-9<t.x+t.width);
    if(this.vy>=0&&feet>=GROUND&&!overGap&&prevY+25<=GROUND+12){this.y=GROUND-25;this.vy=0;this.motion="grounded";}
    else if(this.motion!=="grounded"||overGap)this.motion=this.vy<0?"jumping":"falling";
    if(this.y>H+30){this.die();return;}
    for(const t of this.things){
      if(t.collected)continue;
      const inX=px+10>t.x&&px-10<t.x+t.width;
      const touching=inX&&this.y+22>GROUND-(t.kind==="wall"?39:t.kind==="ward"?49:30)&&this.y<GROUND;
      if((t.kind==="essence"||t.kind==="orb")&&touching){
        if(t.kind==="orb"){
          this.ep=Math.min(100,this.ep+25);t.collected=true;
          this.particles.burst("orb",PLAYER_X+8,this.y+10,13);retroAudio.play("orb");
        } else if(this.material==="physical"){
          this.score++;t.collected=true;
          this.particles.burst("collect",PLAYER_X+8,this.y+10,10);retroAudio.play("collect");
        }
      }else if(touching&&t.kind==="wall"&&this.material==="physical"){this.die();return;}
      else if(touching&&t.kind==="ward"&&this.material==="intangible"){this.die();return;}
    }
    this.things=this.things.filter(t=>{
      if(t.x+t.width<=this.distance-60){t.sprite?.destroy();return false;}
      return true;
    });
    while(this.spawnAt<this.distance+W+240)this.generate();
    this.particles.update(dt,PLAYER_X,this.y+15,this.material==="intangible");
  }
  private die(){
    this.alive=false;this.material="physical";
    this.particles.burst("hit",PLAYER_X,this.y+15,24);
    this.phantom.setTexture("phantom-hurt").setAlpha(1).setScale(1);
    this.cameras.main.shake(140,.006);
    retroAudio.stop();
    retroAudio.play("hit");
    const meters=Math.floor(this.distance/10);
    let best=0;
    try{best=Number(localStorage.getItem(bestKey)||"0");if(meters>best)localStorage.setItem(bestKey,String(meters));}catch{}
    if(meters>best&&best>0)retroAudio.play("record");
    this.overlay.setText("GAME OVER\n\nDISTÂNCIA: "+meters+" m\nRECORDE: "+Math.max(best,meters)+" m\nESSÊNCIA: "+this.score+"\n\nESPAÇO OU TOQUE: REINICIAR").setVisible(true);
    this.pauseButton.setVisible(false);
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
    const texture=airborne?(intangible?"phantom-phase-jump":"phantom-jump"):
      (intangible?"phantom-phase-":"phantom-")+frame;
    this.phantom.setTexture(texture)
      .setPosition(PLAYER_X,Math.round(this.y+16))
      .setAlpha(intangible?.78+.09*Math.sin(this.elapsed*16):1)
      .setScale(intangible?1+.025*Math.sin(this.elapsed*12):1);
    this.hud.setText("PHANTOM   "+Math.floor(this.distance/10)+" m   ◆ "+this.score);
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
  scene:[MenuScene,GameScene]
});
