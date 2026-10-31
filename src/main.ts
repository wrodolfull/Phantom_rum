import Phaser from "phaser";
import "./style.css";
import { setupVisuals, addBackdrop } from "./art/pixelArt";

const W = 480, H = 270, GROUND = 215, PLAYER_X = 98;
const MAX_EP = 100, DRAIN = 30, REGEN = 12;
const GRAVITY = 900, JUMP = -330;
type Kind = "wall" | "gap" | "ward" | "orb" | "essence";
type Thing = { kind: Kind; x: number; width: number; collected?: boolean; sprite?: Phaser.GameObjects.Image };
type Motion = "grounded" | "jumping" | "falling";
type Material = "physical" | "intangible";
const COLORS = { sky: 0x25274f, dark: 0x181832, violet: 0x6c4ba3, cyan: 0x65d6ff, grass: 0x80c29b, gold: 0xffcf65 };
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
    start.on("pointerdown",()=>this.scene.start("game"));
    this.input.keyboard?.once("keydown-SPACE",()=>this.scene.start("game"));
    this.input.keyboard?.once("keydown-ENTER",()=>this.scene.start("game"));
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
  private lastTime=0;
  private acc=0;
  private leftHeld=false;
  private rightHeld=false;
  private keys!: {space:Phaser.Input.Keyboard.Key; up:Phaser.Input.Keyboard.Key; shift:Phaser.Input.Keyboard.Key; esc:Phaser.Input.Keyboard.Key};
  constructor(){super("game");}
  create(){
    this.things=[];this.distance=0;this.speed=125;this.ep=100;this.y=GROUND-25;this.vy=0;this.motion="grounded";this.material="physical";this.alive=true;this.paused=false;this.jumpQueued=0;this.coyote=.1;this.holdIntangible=false;this.needsRelease=false;this.score=0;this.spawnAt=410;this.lastTime=0;this.acc=0;this.leftHeld=false;this.rightHeld=false;
    this.backdrop = paintBackground(this,0);
    this.groundTiles=this.add.tileSprite(0, 211, W, H-211, "ground").setOrigin(0,0).setDepth(2);
    this.world=this.add.graphics().setDepth(3);
    this.phantom=this.add.image(PLAYER_X, this.y+16, "phantom-0").setDepth(6);
    this.add.graphics().setDepth(18).fillStyle(0x1c1a40, .93).fillRoundedRect(5, 4, 320, 40, 5)
      .lineStyle(1, 0x6b63a5).strokeRoundedRect(5, 4, 320, 40, 5);
    this.hud=this.add.text(10,8,"",{fontFamily:"monospace",fontSize:"12px",color:"#ffffff",stroke:"#20183c",strokeThickness:3}).setDepth(20);
    this.energyBar=this.add.graphics().setDepth(20);
    this.overlay=this.add.text(W/2,H/2,"",{fontFamily:"monospace",fontSize:"14px",align:"center",color:"#ffffff",backgroundColor:"#332850",padding:{x:14,y:10}}).setOrigin(.5).setDepth(30).setVisible(false);
    this.keys=this.input.keyboard!.addKeys({space:Phaser.Input.Keyboard.KeyCodes.SPACE,up:Phaser.Input.Keyboard.KeyCodes.UP,shift:Phaser.Input.Keyboard.KeyCodes.SHIFT,esc:Phaser.Input.Keyboard.KeyCodes.ESC}) as typeof this.keys;
    this.input.keyboard!.on("keydown-ESC",()=>{if(!this.alive)return;this.paused=!this.paused;this.overlay.setText(this.paused?"PAUSADO\nESC PARA CONTINUAR":"").setVisible(this.paused);});
    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>{if(!this.alive){this.scene.restart();return;}if(p.x < this.scale.width/2){this.leftHeld=true;this.jumpQueued=.1;}else this.rightHeld=true;});
    this.input.on("pointerup",()=>{this.leftHeld=false;this.rightHeld=false;});
    this.input.on("pointerupoutside",()=>{this.leftHeld=false;this.rightHeld=false;});
    this.input.keyboard!.on("keydown-SPACE",()=>{this.jumpQueued=.1;});
    this.input.keyboard!.on("keydown-UP",()=>{this.jumpQueued=.1;});
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
  update(_time:number,delta:number){
    if(!this.alive){if(Phaser.Input.Keyboard.JustDown(this.keys.space)||Phaser.Input.Keyboard.JustDown(this.keys.up))this.scene.restart();return;}
    if(this.paused)return;
    this.acc+=Math.min(delta/1000,.05);
    let steps=0;
    while(this.acc>=1/60&&steps++<4){this.step(1/60);this.acc-=1/60;}
    if(steps>=4)this.acc=0;
    this.draw();
  }
  private step(dt:number){
    this.holdIntangible=this.keys.shift.isDown||this.rightHeld;
    if(!this.holdIntangible)this.needsRelease=false;
    if(this.material==="intangible"){
      this.ep=Math.max(0,this.ep-DRAIN*dt);
      if(!this.holdIntangible||this.ep<=0){this.material="physical";if(this.ep<=0)this.needsRelease=true;}
    }else{
      this.ep=Math.min(MAX_EP,this.ep+REGEN*dt);
      if(this.holdIntangible&&!this.needsRelease&&this.ep>=10)this.material="intangible";
    }
    this.jumpQueued=Math.max(0,this.jumpQueued-dt);
    if(this.motion==="grounded")this.coyote=.1;else this.coyote=Math.max(0,this.coyote-dt);
    if(this.jumpQueued>0&&this.coyote>0){this.vy=JUMP;this.motion="jumping";this.coyote=0;this.jumpQueued=0;}
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
        if(t.kind==="orb"){this.ep=Math.min(100,this.ep+25);t.collected=true;}
        else if(this.material==="physical"){this.score++;t.collected=true;}
      }else if(touching&&t.kind==="wall"&&this.material==="physical"){this.die();return;}
      else if(touching&&t.kind==="ward"&&this.material==="intangible"){this.die();return;}
    }
    this.things=this.things.filter(t=>{
      if(t.x+t.width<=this.distance-60){t.sprite?.destroy();return false;}
      return true;
    });
    while(this.spawnAt<this.distance+W+240)this.generate();
  }
  private die(){
    this.alive=false;this.material="physical";
    const meters=Math.floor(this.distance/10);
    let best=0;
    try{best=Number(localStorage.getItem(bestKey)||"0");if(meters>best)localStorage.setItem(bestKey,String(meters));}catch{}
    this.overlay.setText("GAME OVER\n\nDISTÂNCIA: "+meters+" m\nRECORDE: "+Math.max(best,meters)+" m\nESSÊNCIA: "+this.score+"\n\nESPAÇO OU TOQUE: REINICIAR").setVisible(true);
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
    const frame=Math.floor(this.distance/17)%3;
    const intangible=this.material==="intangible";
    this.phantom.setTexture((intangible?"phantom-phase-":"phantom-")+frame)
      .setPosition(PLAYER_X,Math.round(this.y+16))
      .setAlpha(intangible?.77:1);
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
