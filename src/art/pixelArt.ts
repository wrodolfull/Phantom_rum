import Phaser from 'phaser';
import {heroById,type HeroId,type AccessoryId} from '../shop/catalog';

// Sprites originais em resolução nativa: sem imagens externas ou material licenciado.
const C = {
  ink:'#31305e', deep:'#171633', moon:'#fff1cb', white:'#fcf7ff',
  shade:'#d6dcf2', blue:'#60d8f8', darkblue:'#2189be',
  green:'#90d1a6', gold:'#ffd676', stone:'#9da9c6'
};
type Draw = (ctx:CanvasRenderingContext2D)=>void;
const dot=(c:CanvasRenderingContext2D,color:string,x:number,y:number,w=1,h=1)=>{
  c.fillStyle=color;c.fillRect(x,y,w,h);
};
function make(scene:Phaser.Scene,key:string,w:number,h:number,draw:Draw):void {
  if(scene.textures.exists(key))return;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const c=canvas.getContext('2d');if(!c)return;
  c.imageSmoothingEnabled=false;draw(c);scene.textures.addCanvas(key,canvas);
}
function ghost(c:CanvasRenderingContext2D,phase:boolean,frame:number,
  heroId:HeroId="phantom",accessoryId:AccessoryId="none"):void {
  const palette=heroById(heroId);
  const border=phase?C.darkblue:palette.outline;
  const body=phase?"#8ae7ff":palette.body;
  const bob=[0,-1,0,1,0,-1,-2,0][frame]??0;
  const rows:[[number,number,number],...Array<[number,number,number]>]=[
    [3,13,21],[4,10,24],[5,8,26],[6,7,27],[7,6,28],[8,5,29],
    [9,5,29],[10,5,30],[11,6,30],[12,7,30],[13,6,30],
    [14,4,30],[15,2,30],[16,3,30],[17,5,30],[18,7,30],
    [19,4,30],[20,3,29],[21,4,29],[22,6,28],[23,8,27],
    [24,10,26],[25,8,24],[26,7,15]
  ];
  for(const [y,left,right] of rows){
    const sy=y+bob;
    dot(c,border,left-1,sy,right-left+2);
    dot(c,body,left+1,sy,right-left-1);
  }
  dot(c,phase?'#5ac7ed':palette.shadow,9,21+bob,14,2);
  if(heroId!=="phantom"){
    dot(c,phase?"#b4f6ff":palette.accent,11,23+bob,4,2);
    if(heroId==="wisp")dot(c,"#fffbe6",7,14+bob,2,2);
    if(heroId==="luna")dot(c,"#ffffff",28,10+bob,2,2);
    if(heroId==="boozer")dot(c,"#da8e65",4,23+bob,3,2);
    if(heroId==="spectra")dot(c,"#ef9bc6",13,9+bob,3,2);
  }
  if(frame===7){
    // Comic hit face; no gore.
    dot(c,C.ink,18,13,4,2);dot(c,C.ink,19,12,2,4);
    dot(c,C.ink,25,13,4,2);dot(c,C.ink,26,12,2,4);
    dot(c,'#f3a9c1',23,20,3,4);
  }else if(frame===4){
    dot(c,C.ink,18,16+bob,4,1);dot(c,C.ink,25,16+bob,4,1);
    dot(c,'#f3a9c1',23,20+bob,5,2);
  }else{
    dot(c,C.ink,18,12+bob,3,6);dot(c,C.ink,25,12+bob,3,6);
    dot(c,'#ffffff',18,12+bob,1,2);dot(c,'#ffffff',25,12+bob,1,2);
    dot(c,'#f3a9c1',23,20+bob,5,2);dot(c,'#c5759d',19,20+bob,3,2);
  }
  if(frame===6)dot(c,phase?'#50e4f5':'#d3dbf8',6,24,7,3);
  if(phase){
    const trail=(frame%3)*2;
    dot(c,'#8efbff',0,13+bob,3+trail,2);
    dot(c,'#8efbff',3,27+bob,2+trail,2);
  }
  if(accessoryId==="ribbon"){
    dot(c,"#a64472",21,5+bob,2,6);
    dot(c,"#f4829c",16,5+bob,5,4);dot(c,"#f4829c",23,5+bob,5,4);
    dot(c,"#ffd9e3",21,6+bob,3,3);
  }else if(accessoryId==="hat"){
    dot(c,"#4b387f",8,3+bob,24,4);
    dot(c,"#785bb3",12,0+bob,15,6);
    dot(c,"#ffe1a2",13,3+bob,12,2);
  }else if(accessoryId==="crown"){
    dot(c,"#af6f33",11,4+bob,20,4);
    dot(c,"#ffd775",12,1+bob,3,6);dot(c,"#ffd775",19,0+bob,4,8);
    dot(c,"#ffd775",27,1+bob,3,6);
    dot(c,"#bcecff",21,5+bob,2,2);
  }
}
function wall(c:CanvasRenderingContext2D):void {
  // A tall, physically impassable wall: Phantom must phase through it.
  // It extends beyond the maximum 60px jump arc.
  dot(c,'#536081',0,0,26,66);
  dot(c,C.stone,2,2,22,62);
  for(const y of [11,26,42,57]){
    dot(c,'#495675',0,y,26,2);
    dot(c,'#bdc9df',2,y+2,22,2);
  }
  for(const [x,y,len] of [[10,0,11],[6,13,13],[17,28,14],[11,44,13],[6,59,5]])
    dot(c,'#586786',x,y,2,len);
  dot(c,'#d0d8e8',3,3,19,5);
  dot(c,'#667396',3,32,20,8);
  dot(c,'#303861',0,63,26,3);
}
function grave(c:CanvasRenderingContext2D):void {
  for(let y=0;y<32;y++){
    const start=y<3?9:y<6?6:2;
    if(y<4)continue;
    dot(c,'#5d668c',start,y,24-2*start);
    if(y<29)dot(c,C.stone,start+2,y,20-2*start);
  }
  dot(c,'#e0e2ed',9,8,5,2);
  dot(c,C.ink,10,16,4,11);dot(c,C.ink,7,19,10,3);
  dot(c,'#516080',0,29,24,3);
}
function ward(c:CanvasRenderingContext2D):void {
  dot(c,'#522c8e',3,0,12,50);dot(c,'#bf76ff',2,4,14,42);
  dot(c,'#e3baff',5,7,8,35);dot(c,'#633b9c',7,12,4,27);
  dot(c,'#ffffff',8,18,2,14);dot(c,'#ffffff',5,24,8,2);
  dot(c,'#4f2d85',0,46,18,4);
}
function glow(c:CanvasRenderingContext2D,blue:boolean):void {
  const edge=blue?'#336ba8':'#936d47';
  const main=blue?C.blue:C.gold;
  dot(c,edge,4,0,8,16);dot(c,edge,0,4,16,8);
  dot(c,main,3,3,10,10);dot(c,'#ffffff',5,4,4,4);
}
function ground(c:CanvasRenderingContext2D):void {
  dot(c,'#39355a',0,0,16,16);
  dot(c,C.green,0,0,16,3);
  dot(c,'#57977f',0,3,16,3);
  dot(c,'#695c82',0,6,16,2);
  dot(c,'#52466f',2,9,5,3);dot(c,'#78648e',11,12,4,3);
}
function sky(c:CanvasRenderingContext2D):void {
  ['#181a3a','#202146','#272653','#302a60','#39336d','#48417b','#545084']
    .forEach((color,i)=>dot(c,color,0,i*39,480,39));
  for(let i=0;i<85;i++){
    const x=(i*79+31)%480,y=(i*47+9)%160;
    dot(c,i%6===0?'#fff1d7':'#a7a1d8',x,y,i%8===0?2:1,1);
  }
  for(let i=0;i<9;i++){
    const x=(i*123+36)%480,y=30+(i*37)%87;
    dot(c,'#60558c',x,y,36,5);dot(c,'#60558c',x+7,y-5,22,5);
    dot(c,'#7a69a4',x+12,y-9,12,4);
  }
}
function moon(c:CanvasRenderingContext2D):void {
  for(let y=0;y<52;y++)for(let x=0;x<52;x++){
    const r=Math.hypot(x-26,y-26);
    if(r<24)dot(c,r>22?'#eccbaa':'#fff1cb',x,y);
  }
  dot(c,'#e3cba9',14,16,9,7);dot(c,'#e3cba9',33,32,8,5);
}
function mountains(c:CanvasRenderingContext2D):void {
  for(let x=0;x<512;x+=4){
    const y=62+Math.floor(13*Math.sin(x*.026)+8*Math.sin(x*.057));
    dot(c,'#3a3a71',x,y,4,120-y);
  }
  dot(c,'#282b59',346,44,100,69);dot(c,'#282b59',360,18,20,55);
  dot(c,'#282b59',411,15,17,60);dot(c,'#f7cb87',367,60,6,10);
  dot(c,'#f7cb87',418,61,5,11);dot(c,'#e6ad82',394,80,10,13);
}
function forest(c:CanvasRenderingContext2D):void {
  for(let i=0;i<29;i++){
    const x=i*21-10,h=35+i*17%40;
    dot(c,'#29345a',x+9,118-h,5,h);
    for(let row=0;row<8;row++){
      const width=18-row*2;
      dot(c,row%2?'#344f73':'#3c6280',x+9-width/2,118-h-11+row*3,width,3);
    }
  }
  for(let i=0;i<12;i++){
    const x=i*45+7;
    dot(c,'#374d68',x+5,85,5,33);dot(c,'#477087',x-4,72,25,13);
    dot(c,'#57838f',x,67,16,8);
  }
}
function tree(c:CanvasRenderingContext2D):void {
  dot(c,'#362d5b',25,39,9,49);dot(c,'#504064',27,41,3,46);
  for(const [cx,cy,r] of [[20,35,18],[37,32,18],[29,19,19],[49,41,15]]){
    for(let y=-r;y<=r;y+=3)for(let x=-r;x<=r;x+=3){
      if(x*x+y*y<r*r)dot(c,y<0?'#4f8e95':'#306c80',cx+x,cy+y,3,3);
    }
  }
  dot(c,'#86bda5',12,22,7,3);dot(c,'#86bda5',32,10,6,3);
}
function lamp(c:CanvasRenderingContext2D):void {
  dot(c,'#363154',9,12,3,38);dot(c,'#363154',2,9,17,5);
  dot(c,'#f0ba67',4,14,13,13);dot(c,'#fff2b3',7,17,6,8);
  dot(c,'#383254',2,26,17,4);dot(c,'#383254',3,13,2,13);
  dot(c,'#383254',16,13,2,13);
}
/** Generate only requested combinations. Assets remain 32px pixel-perfect. */
export function appearanceTexture(hero:HeroId,accessory:AccessoryId,
  phase:boolean,frame:number|"jump"|"hurt"):string{
  return `look-${hero}-${accessory}-${phase?"phase":"physical"}-${frame}`;
}
export function ensureAppearanceVisuals(scene:Phaser.Scene,hero:HeroId,accessory:AccessoryId):void{
  for(const phase of [false,true]){
    for(let i=0;i<6;i++){
      const key=appearanceTexture(hero,accessory,phase,i);
      make(scene,key,32,32,c=>ghost(c,phase,i,hero,accessory));
    }
    const key=appearanceTexture(hero,accessory,phase,"jump");
    make(scene,key,32,32,c=>ghost(c,phase,6,hero,accessory));
  }
  make(scene,appearanceTexture(hero,accessory,false,"hurt"),32,32,
    c=>ghost(c,false,7,hero,accessory));
}
export function setupVisuals(scene:Phaser.Scene):void {
  for(let i=0;i<6;i++){
    make(scene,'phantom-'+i,32,32,c=>ghost(c,false,i));
    make(scene,'phantom-phase-'+i,32,32,c=>ghost(c,true,i));
  }
  make(scene,'phantom-jump',32,32,c=>ghost(c,false,6));
  make(scene,'phantom-phase-jump',32,32,c=>ghost(c,true,6));
  make(scene,'phantom-hurt',32,32,c=>ghost(c,false,7));
  make(scene,'grave',24,32,grave);
  make(scene,'wall',26,66,wall);
  make(scene,'ward',18,50,ward);
  make(scene,'orb',16,16,c=>glow(c,true));
  make(scene,'essence',16,16,c=>glow(c,false));
  make(scene,'ground',16,16,ground);
  make(scene,'tree',68,88,tree);
  make(scene,'lamp',20,50,lamp);
  make(scene,'sky',480,270,sky);
  make(scene,'moon',52,52,moon);
  make(scene,'mountains',512,120,mountains);
  make(scene,'forest',512,118,forest);
}
export function addBackdrop(scene:Phaser.Scene,position:number){
  scene.add.image(0,0,'sky').setOrigin(0,0).setDepth(-60);
  scene.add.image(392,46,'moon').setDepth(-55);
  const mountains=scene.add.tileSprite(0,98,480,120,'mountains').setOrigin(0,0).setDepth(-50);
  const forest=scene.add.tileSprite(0,103,480,118,'forest').setOrigin(0,0).setDepth(-40);
  mountains.tilePositionX=position*.08;forest.tilePositionX=position*.23;
  scene.add.image(85,214,'tree').setOrigin(.5,1).setDepth(-20);
  scene.add.image(272,214,'grave').setOrigin(.5,1).setDepth(-20);
  scene.add.image(419,214,'lamp').setOrigin(.5,1).setDepth(-20);
  return {mountains,forest};
}
