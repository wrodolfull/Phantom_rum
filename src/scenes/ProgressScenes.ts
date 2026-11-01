import Phaser from "phaser";
import {setupVisuals,addBackdrop} from "../art/pixelArt";
import {retroAudio} from "../audio/RetroAudio";
import {ACHIEVEMENTS,nextDistanceGoal,progressStore,type Progress,type RunStats} from "../progression/progress";
import {balance,activeAppearance} from "../shop/economy";
import {ensureAppearanceVisuals,appearanceTexture} from "../art/pixelArt";

const W=480,H=270;
function sceneBackground(scene:Phaser.Scene){
  setupVisuals(scene);
  addBackdrop(scene,0);
  scene.add.tileSprite(0,211,W,H-211,"ground").setOrigin(0,0).setDepth(-1);
}
export interface ResultsData {
  stats:RunStats;
  progress:Progress;
  newRecord:boolean;
  unlocked:string[];
  forceTutorial:boolean;
}
export class ResultsScene extends Phaser.Scene {
  private result!:ResultsData;
  constructor(){super("results");}
  init(data:ResultsData){this.result=data;}
  create(){
    retroAudio.stop();
    sceneBackground(this);
    const look=activeAppearance(this.result.progress);
    ensureAppearanceVisuals(this,look.hero,look.accessory);
    this.add.image(420,178,appearanceTexture(look.hero,look.accessory,false,"hurt"))
      .setScale(1.8).setAlpha(.5).setDepth(1);
    const panel=this.add.graphics().setDepth(3);
    panel.fillStyle(0x231d42,.97).fillRoundedRect(39,12,402,245,10);
    panel.lineStyle(2,0x8c74c3).strokeRoundedRect(39,12,402,245,10);
    const txt=(x:number,y:number,value:string,size=12,color="#f2edff")=>
      this.add.text(x,y,value,{fontFamily:"monospace",fontSize:size+"px",color}).setDepth(4);
    txt(158,20,"GAME OVER",24);
    if(this.result.newRecord)txt(148,53,"★ NOVO RECORDE! ★",12,"#ffdc83");
    else txt(157,53,"MAIS UMA TENTATIVA!",11,"#bdb6e1");
    txt(62,83,"DISTÂNCIA   "+this.result.stats.meters+" m",13,"#ffffff");
    txt(62,105,"SEU RECORDE "+this.result.progress.bestDistance+" m",11,"#b9edfc");
    txt(62,125,"ESSÊNCIAS +"+this.result.stats.essence+
      "   SALDO ◆ "+balance(this.result.progress),10,"#ffda82");
    const unlockedTitles=this.result.unlocked.map(id=>ACHIEVEMENTS.find(a=>a.id===id)?.title??id);
    if(unlockedTitles.length>0){
      txt(62,146,"NOVA CONQUISTA: "+unlockedTitles[0],10,"#9cf2c9");
      if(unlockedTitles.length>1)txt(62,159,"E MAIS "+(unlockedTitles.length-1)+" DESBLOQUEADA(S)",9,"#9cf2c9");
    }else txt(62,149,"CONQUISTAS: "+this.result.progress.achievements.length+"/"+ACHIEVEMENTS.length,10,"#d6cee8");
    const goal=nextDistanceGoal(this.result.progress.bestDistance);
    txt(62,177,goal.label,10,"#dcd7ff");
    panel.fillStyle(0x4b4469).fillRoundedRect(62,194,356,8,3);
    panel.fillStyle(0x72cce2).fillRoundedRect(62,194,Math.max(1,Math.round(356*goal.ratio)),8,3);
    const btn=(x:number,label:string)=>this.add.text(x,227,label,{
      fontFamily:"monospace",fontSize:"10px",color:"#ffffff",
      backgroundColor:"#6d519b",padding:{x:12,y:7}
    }).setOrigin(.5).setDepth(5).setInteractive({useHandCursor:true});
    const replay=()=>this.scene.start("game",{forceTutorial:this.result.forceTutorial});
    const menu=()=>this.scene.start("menu");
    btn(122,"▶ RECOMEÇAR").on("pointerdown",replay);
    btn(260,"◆ LOJA").on("pointerdown",()=>this.scene.start("shop"));
    btn(373,"⌂ MENU").on("pointerdown",menu);
    this.input.keyboard?.once("keydown-SPACE",replay);
    this.input.keyboard?.once("keydown-ENTER",replay);
    this.input.keyboard?.once("keydown-ESC",menu);
  }
}
export class AchievementsScene extends Phaser.Scene {
  constructor(){super("achievements");}
  create(){
    sceneBackground(this);
    const p=progressStore.load();
    const box=this.add.graphics();
    box.fillStyle(0x201c3d,.96).fillRoundedRect(15,12,450,246,9);
    box.lineStyle(2,0x8779ba).strokeRoundedRect(15,12,450,246,9);
    this.add.text(29,22,"★ CONQUISTAS",{fontFamily:"monospace",fontSize:"19px",color:"#fff7ff"});
    this.add.text(29,46,p.achievements.length+" / "+ACHIEVEMENTS.length+" DESBLOQUEADAS",{fontFamily:"monospace",fontSize:"10px",color:"#97e8f5"});
    for(const [i,a] of ACHIEVEMENTS.entries()){
      const x=27+(i%2)*224,y=67+Math.floor(i/2)*41;
      const done=p.achievements.includes(a.id);
      box.fillStyle(done?0x42466d:0x302b4c,.94).fillRoundedRect(x,y,212,37,4);
      box.lineStyle(1,done?0x79c8d7:0x514b72).strokeRoundedRect(x,y,212,37,4);
      this.add.text(x+6,y+4,(done?"★ ":"□ ")+a.title,{fontFamily:"monospace",
        fontSize:"9px",color:done?"#ffffff":"#9f99b7"});
      this.add.text(x+6,y+20,a.description,{fontFamily:"monospace",
        fontSize:"8px",color:done?"#c9e5e2":"#8e88a7"});
    }
    const back=this.add.text(W/2,248,"◀ VOLTAR",{fontFamily:"monospace",fontSize:"11px",
      color:"#ffffff",backgroundColor:"#5d4c90",padding:{x:12,y:4}})
      .setOrigin(.5).setInteractive({useHandCursor:true});
    back.on("pointerdown",()=>this.scene.start("menu"));
    this.input.keyboard?.once("keydown-ESC",()=>this.scene.start("menu"));
  }
}
