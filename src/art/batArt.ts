import Phaser from "phaser";
/** Distinct luminous bat replaces the ordinary purple enemy during possession. */
export const BAT_SPECIAL_KEY="bat-special";
export const BAT_POSSESSED_KEY="bat-possessed";
function drawBat(ctx:CanvasRenderingContext2D,possessed:boolean):void{
  ctx.clearRect(0,0,48,36);
  const px=(x:number,y:number,w:number,h:number,color:string)=>{
    ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
  };
  const edge=possessed?"#166982":"#65477f";
  const wing=possessed?"#75dfe8":"#bd9fed";
  const light=possessed?"#d5feff":"#ffda92";
  // Symmetric swept wings; easy to recognize at high running speed.
  for(const side of [-1,1]){
    const x=side<0?1:25;
    px(x,11,22,8,edge);
    px(x+2,8,19,6,wing);
    px(x+5,5,15,5,edge);
    px(x+6,6,13,5,wing);
    px(x+1,18,6,7,edge);px(x+11,17,6,7,edge);
    px(x+17,17,5,6,edge);
  }
  px(17,10,14,18,edge);px(19,12,10,14,wing);
  px(17,7,5,8,edge);px(26,7,5,8,edge);
  px(20,13,8,13,possessed?"#e7fdff":"#f9e4fa");
  px(20,17,3,4,"#222444");px(26,17,3,4,"#222444");
  px(20,17,1,2,"#ffffff");px(26,17,1,2,"#ffffff");
  px(23,23,3,2,"#e48cb2");
  for(const [x,y] of [[7,7],[39,9],[12,25],[36,29]]){
    px(x,y,2,2,light);
  }
  if(possessed){
    px(22,0,4,3,"#d0fbff");
    px(23,3,2,6,"#91eaff");
  }else{
    px(22,3,4,4,"#ffe49a");
    px(23,0,2,3,"#fff4ba");
  }
}
export function ensureBatArt(scene:Phaser.Scene):void{
  for(const [key,possessed] of [
    [BAT_SPECIAL_KEY,false],[BAT_POSSESSED_KEY,true]
  ] as const){
    if(scene.textures.exists(key))continue;
    const canvas=document.createElement("canvas");
    canvas.width=48;canvas.height=36;
    const ctx=canvas.getContext("2d");
    if(!ctx)continue;
    ctx.imageSmoothingEnabled=false;
    drawBat(ctx,possessed);
    scene.textures.addCanvas(key,canvas);
  }
}
