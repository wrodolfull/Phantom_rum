import Phaser from "phaser";
import "./style.css";

const W = 480, H = 270, GROUND = 215, PLAYER_X = 98;
const MAX_EP = 100, DRAIN = 30, REGEN = 12;
const GRAVITY = 900, JUMP = -330;
type Kind = "wall" | "gap" | "ward" | "orb" | "essence";
type Thing = { kind: Kind; x: number; width: number; collected?: boolean };
type Motion = "grounded" | "jumping" | "falling";
type Material = "physical" | "intangible";
const COLORS = { sky: 0x25274f, dark: 0x181832, violet: 0x6c4ba3, cyan: 0x65d6ff, grass: 0x80c29b, gold: 0xffcf65 };
const bestKey = "phantom-run-best-v1";

class MenuScene extends Phaser.Scene {
  constructor() { super("menu"); }
  create() {
    paintBackground(this, 0);
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
  const g=scene.add.graphics().setDepth(-50);
  g.fillStyle(COLORS.sky).fillRect(0,0,W,H);
  g.fillStyle(0x3c376c).fillRect(0,75,W,140);
  g.fillStyle(0xf9e3aa).fillCircle(397,49,24);
  g.fillStyle(0xd2b5c1,.6).fillCircle(389,43,6).fillCircle(405,56,4);
  for(let i=0;i<20;i++){
    const x=((i*47-distance*.07)% (W+60)+(W+60))%(W+60)-30;
    const h=28+(i*19)%50;
    g.fillStyle(i%2?0x26294d:0x302e59).fillTriangle(x,178,x+14,178-h,x+28,178);
    g.fillRect(x+9,178-h*.55,9,h*.55);
  }
  for(let i=0;i<13;i++){
    const x=((i*71-distance*.25)%(W+70)+(W+70))%(W+70)-35;
    g.fillStyle(0x333559).fillRect(x,175,5,35);
    g.fillStyle(0x46446f).fillRoundedRect(x-8,162,21,18,7);
    if(i%3===0){g.fillStyle(0xe6b675).fillRect(x+22,140,4,48).fillRect(x+17,139,14,5);g.fillStyle(0xffd681).fillRect(x+21,145,6,9);}
  }
}

class GameScene extends Phaser.Scene {
  private world!: Phaser.GameObjects.Graphics;
  private phantom!: Phaser.GameObjects.Graphics;
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
    paintBackground(this,0);
    this.world=this.add.graphics().setDepth(3);
    this.phantom=this.add.graphics().setDepth(6);
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
    this.things.push({kind,x:this.spawnAt,width});
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
    this.things=this.things.filter(t=>t.x+t.width>this.distance-60);
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
    const g=this.world;g.clear();
    g.fillStyle(0x654977).fillRect(0,GROUND,W,H-GROUND);
    g.fillStyle(COLORS.grass).fillRect(0,GROUND-5,W,6);
    g.fillStyle(0x483b69);
    for(let i=0;i<30;i++){const x=(i*23-Math.floor(this.distance*.6)%23);g.fillRect(x,GROUND+7+(i%3)*9,12,6);}
    for(const t of this.things){
      if(t.collected)continue;
      const x=Math.floor(t.x-this.distance);
      if(x<-65||x>W+50)continue;
      if(t.kind==="gap"){g.fillStyle(COLORS.dark).fillRect(x,GROUND-5,t.width,H-GROUND+5);g.fillStyle(0x7f78ae).fillRect(x,GROUND-5,3,5).fillRect(x+t.width-3,GROUND-5,3,5);}
      if(t.kind==="wall"){
        g.fillStyle(0x8996bd).fillRect(x,GROUND-39,t.width,39);
        g.lineStyle(2,0x424675).strokeRect(x,GROUND-39,t.width,39);
        g.lineBetween(x,GROUND-19,x+t.width,GROUND-19);
        g.lineBetween(x+11,GROUND-39,x+11,GROUND-19);
      }
      if(t.kind==="ward"){
        g.fillStyle(0xa564ea,.75).fillRoundedRect(x,GROUND-49,t.width,49,4);
        g.lineStyle(3,0xf0adff).strokeRoundedRect(x,GROUND-49,t.width,49,4);
      }
      if(t.kind==="orb"||t.kind==="essence"){
        g.fillStyle(t.kind==="orb"?COLORS.cyan:COLORS.gold).fillCircle(x+8,GROUND-31,8);
        g.lineStyle(2,0xffffff,.8).strokeCircle(x+8,GROUND-31,8);
      }
    }
    const p=this.phantom;p.clear();
    const intangible=this.material==="intangible";
    p.fillStyle(intangible?0x55c9f6:0xf7f5ff,intangible?.68:1);
    p.fillRoundedRect(PLAYER_X-12,this.y+2,26,23,12);
    p.fillTriangle(PLAYER_X-12,this.y+17,PLAYER_X-13,this.y+27,PLAYER_X-2,this.y+21);
    p.fillTriangle(PLAYER_X+2,this.y+22,PLAYER_X+7,this.y+27,PLAYER_X+13,this.y+21);
    p.lineStyle(2,intangible?0x2de0ff:0x435eaa).strokeRoundedRect(PLAYER_X-12,this.y+2,26,23,12);
    p.fillStyle(0x15274d).fillRect(PLAYER_X-3,this.y+11,3,5).fillRect(PLAYER_X+8,this.y+11,3,5);
    p.fillStyle(0xf3a5b8).fillRect(PLAYER_X+2,this.y+19,5,3);
    if(intangible){p.fillStyle(0x74e6ff).fillCircle(PLAYER_X-21,this.y+12,2).fillCircle(PLAYER_X-29,this.y+20,2);}
    this.hud.setText("PHANTOM  "+Math.floor(this.distance/10)+" m  ✦ "+this.score);
    this.energyBar.clear();this.energyBar.fillStyle(0x1c1b40).fillRoundedRect(8,26,120,13,3);
    this.energyBar.fillStyle(this.ep<20?0xf4a16a:COLORS.cyan).fillRect(11,29,Math.floor(114*this.ep/100),7);
    this.energyBar.lineStyle(1,0xd9d6fa).strokeRoundedRect(8,26,120,13,3);
    this.energyBar.fillStyle(0xffffff);
    this.add.text; // Rendering is performed with persistent graphics and text only.
  }
}

new Phaser.Game({
  type:Phaser.AUTO,width:W,height:H,parent:"game",backgroundColor:"#171733",
  render:{pixelArt:true,antialias:false},
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  scene:[MenuScene,GameScene]
});
