import Phaser from "phaser";
import {setupVisuals,addBackdrop,ensureAppearanceVisuals,appearanceTexture} from "../art/pixelArt";
import {retroAudio} from "../audio/RetroAudio";
import {progressStore} from "../progression/progress";
import {HEROES,ACCESSORIES,type ShopCategory} from "../shop/catalog";
import {balance} from "../shop/economy";
const W=480,H=270;
type PageData={tab?:ShopCategory;page?:number;notice?:string};
/** Purchases are local cosmetic-only changes; no backend or real money. */
export class ShopScene extends Phaser.Scene{
  private tab:ShopCategory="hero";
  private page=0;
  private notice="";
  constructor(){super("shop");}
  init(data?:PageData){
    this.tab=data?.tab==="accessory"?"accessory":"hero";
    this.page=Math.max(0,Math.floor(data?.page??0));
    this.notice=data?.notice??"";
  }
  private button(x:number,y:number,label:string,action:()=>void,size=10){
    const b=this.add.text(x,y,label,{
      fontFamily:"monospace",fontSize:size+"px",
      backgroundColor:"#594780",color:"#ffffff",padding:{x:7,y:5}
    }).setDepth(20).setOrigin(.5).setInteractive({useHandCursor:true});
    b.on("pointerdown",action);
    return b;
  }
  create(){
    retroAudio.stop();
    setupVisuals(this);addBackdrop(this,0);
    this.add.tileSprite(0,211,W,H-211,"ground").setOrigin(0,0).setDepth(-1);
    const panel=this.add.graphics().setDepth(2);
    panel.fillStyle(0x201c3d,.96).fillRoundedRect(12,7,456,256,9);
    panel.lineStyle(2,0x8d73b5).strokeRoundedRect(12,7,456,256,9);
    const p=progressStore.load();
    this.add.text(26,17,"LOJA ESPECTRAL",{
      fontFamily:"monospace",fontSize:"19px",color:"#f9f5ff"
    }).setDepth(10);
    this.add.text(464,24,"◆ "+balance(p),{
      fontFamily:"monospace",fontSize:"13px",color:"#ffdd91"
    }).setOrigin(1,.5).setDepth(10);
    this.button(162,59,this.tab==="hero"?"● FANTASMAS":"FANTASMAS",
      ()=>this.scene.restart({tab:"hero",page:0}),10);
    this.button(330,59,this.tab==="accessory"?"● ACESSÓRIOS":"ACESSÓRIOS",
      ()=>this.scene.restart({tab:"accessory",page:0}),10);
    const list=this.tab==="hero"?HEROES:ACCESSORIES;
    const maxPage=Math.max(0,Math.ceil(list.length/3)-1);
    this.page=Math.min(this.page,maxPage);
    const current=list.slice(this.page*3,this.page*3+3);
    current.forEach((item,index)=>{
      const cx=93+index*147;
      panel.fillStyle(0x373155,.95).fillRoundedRect(cx-68,80,136,145,7);
      panel.lineStyle(1,0x8d81b6).strokeRoundedRect(cx-68,80,136,145,7);
      const hero=this.tab==="hero"?item.id as typeof p.equippedHero:p.equippedHero;
      const accessory=this.tab==="accessory"?item.id as typeof p.equippedAccessory:p.equippedAccessory;
      ensureAppearanceVisuals(this,hero,accessory);
      const preview=this.add.image(cx,121,appearanceTexture(hero,accessory,false,0))
        .setScale(1.7).setDepth(10);
      this.tweens.add({targets:preview,y:118,duration:700,yoyo:true,repeat:-1});
      this.add.text(cx,154,item.name,{fontFamily:"monospace",fontSize:"11px",
        color:"#ffffff"}).setOrigin(.5).setDepth(10);
      this.add.text(cx,171,item.description,{fontFamily:"monospace",fontSize:"8px",
        color:"#cfc2ee"}).setOrigin(.5).setDepth(10);
      const owned=this.tab==="hero"?p.ownedHeroes.includes(item.id as typeof p.equippedHero):
        p.ownedAccessories.includes(item.id as typeof p.equippedAccessory);
      const equipped=this.tab==="hero"?p.equippedHero===item.id:p.equippedAccessory===item.id;
      const label=equipped?"EQUIPADO":owned?"EQUIPAR":"◆ "+item.price+" COMPRAR";
      const tile=this.button(cx,205,label,()=>{
        if(equipped)return;
        const outcome=owned?progressStore.equip(this.tab,item.id):progressStore.buy(this.tab,item.id);
        let message="ITEM EQUIPADO";
        if(!outcome.ok)message=outcome.reason==="insufficient_essence"?
          "ESSÊNCIA INSUFICIENTE":"NÃO FOI POSSÍVEL COMPRAR";
        else if(!owned)message=item.name+" DESBLOQUEADO!";
        this.scene.restart({tab:this.tab,page:this.page,notice:message});
      },9);
      if(equipped)tile.setAlpha(.65);
    });
    if(this.page>0)this.button(17,149,"◀",()=>this.scene.restart({tab:this.tab,page:this.page-1}),13);
    if(this.page<maxPage)this.button(464,149,"▶",()=>this.scene.restart({tab:this.tab,page:this.page+1}),13);
    this.add.text(W/2,234,this.notice||"APENAS VISUAIS • TODOS TÊM AS MESMAS HABILIDADES",{
      fontFamily:"monospace",fontSize:"9px",color:this.notice?"#9effd6":"#bdb5d8"
    }).setOrigin(.5).setDepth(11);
    this.button(240,253,"◀ VOLTAR AO MENU",()=>this.scene.start("menu"),9);
    this.input.keyboard?.once("keydown-ESC",()=>this.scene.start("menu"));
  }
}
