import Phaser from "phaser";

export const PURSUER_TEXTURES=["hunter-pursuit-0","hunter-pursuit-1"] as const;
export const SOUL_PICKUP_TEXTURE="lost-soul-glow";
export const SOUL_FOLLOWER_TEXTURE="soul-follower";
function rect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string){
  ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
}
function drawHunter(ctx:CanvasRenderingContext2D,frame:number){
  ctx.clearRect(0,0,37,52);
  const coat="#3d344e",shadow="#24253d",trim="#90789e",skin="#d8ae98";
  // Wide silhouette, large hat, gold lantern and alternating running feet.
  rect(ctx,10,4,20,3,shadow);rect(ctx,7,7,26,4,coat);
  rect(ctx,13,0,16,8,coat);rect(ctx,15,7,12,2,trim);
  rect(ctx,14,12,15,12,skin);rect(ctx,15,16,14,4,"#b48b82");
  rect(ctx,24,16,4,3,"#20223d");rect(ctx,29,17,3,2,"#20223d");
  rect(ctx,12,24,22,17,coat);rect(ctx,12,24,4,15,trim);
  rect(ctx,27,24,3,16,trim);
  rect(ctx,16,39,7,7,shadow);rect(ctx,26,39,6,7,shadow);
  // Running animation remains recognizable even at 480×270.
  if(frame===0){
    rect(ctx,12,43,9,6,shadow);rect(ctx,24,43,7,5,shadow);
    rect(ctx,8,47,12,4,shadow);rect(ctx,28,46,8,4,shadow);
  }else{
    rect(ctx,17,44,8,6,shadow);rect(ctx,29,42,5,5,shadow);
    rect(ctx,20,47,10,4,shadow);rect(ctx,27,46,9,3,shadow);
  }
  rect(ctx,7,28,6,13,coat);
  // The lantern is between hunter and Phantom (facing right).
  rect(ctx,32,28,3,13,shadow);rect(ctx,30,35,7,11,trim);
  rect(ctx,31,37,5,7,"#f0b66d");
  rect(ctx,32,37,3,5,"#ffe6a2");
}
function drawSoul(ctx:CanvasRenderingContext2D,follower:boolean){
  ctx.clearRect(0,0,28,28);
  rect(ctx,8,3,12,4,follower?"#c8f8f8":"#ffffcf");
  rect(ctx,5,7,18,11,follower?"#78d6ea":"#f3deb1");
  rect(ctx,4,11,20,9,follower?"#88e4f2":"#ffe4a7");
  rect(ctx,7,20,14,4,follower?"#87ddef":"#fff1c6");
  rect(ctx,8,23,3,3,follower?"#8de6f8":"#fff8e1");
  rect(ctx,16,23,4,3,follower?"#8de6f8":"#fff8e1");
  rect(ctx,9,12,3,4,"#2a314c");
  rect(ctx,17,12,3,4,"#2a314c");
  rect(ctx,13,18,2,2,"#384862");
  rect(ctx,3,8,2,2,follower?"#76dcef":"#fff2a3");
  rect(ctx,22,5,2,2,follower?"#76dcef":"#fff2a3");
  rect(ctx,1,20,2,2,follower?"#76dcef":"#fff2a3");
}
export function ensureHunterHordeArt(scene:Phaser.Scene):void{
  for(const [key,draw,w,h] of [
    [PURSUER_TEXTURES[0],(ctx:CanvasRenderingContext2D)=>drawHunter(ctx,0),37,52],
    [PURSUER_TEXTURES[1],(ctx:CanvasRenderingContext2D)=>drawHunter(ctx,1),37,52],
    [SOUL_PICKUP_TEXTURE,(ctx:CanvasRenderingContext2D)=>drawSoul(ctx,false),28,28],
    [SOUL_FOLLOWER_TEXTURE,(ctx:CanvasRenderingContext2D)=>drawSoul(ctx,true),28,28]
  ] as const){
    if(scene.textures.exists(key))continue;
    const canvas=document.createElement("canvas");
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext("2d");
    if(!ctx)continue;
    ctx.imageSmoothingEnabled=false;
    draw(ctx);
    scene.textures.addCanvas(key,canvas);
  }
}
