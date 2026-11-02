/** Same feedback as Three.js for the no-WebGL perspective, with 40 reusable dots. */
export const COMPAT_SPARK_CAPACITY=40;
type Spark={x:number;y:number;vx:number;vy:number;life:number;max:number;color:number};
export type SparkKind="jump"|"phase"|"collect"|"orb"|"hit"|"lane";
const COLORS:Record<SparkKind,number>={
  jump:0xeaf4ff,phase:0x78dfff,collect:0xffd46b,
  orb:0x7cf1ff,hit:0xff849e,lane:0xc9b1ff
};
export interface SparkPainter {
  fillStyle:(color:number,alpha?:number)=>unknown;
  fillCircle:(x:number,y:number,radius:number)=>unknown;
}
export class ChaseFallbackSparks {
  private particles:Spark[]=Array.from({length:COMPAT_SPARK_CAPACITY},()=>({
    x:0,y:-999,vx:0,vy:0,life:0,max:0,color:0xffffff
  }));
  private cursor=0;
  private seed=0x13579b;
  private trailTimer=0;
  private random(){
    this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;
    return this.seed/4294967296;
  }
  emit(kind:SparkKind,x:number,y:number,count=7):number{
    const n=Math.min(COMPAT_SPARK_CAPACITY,Math.max(0,Math.floor(count)));
    for(let i=0;i<n;i++){
      const p=this.particles[this.cursor++%COMPAT_SPARK_CAPACITY];
      p.x=x+(this.random()-.5)*16;
      p.y=y+(this.random()-.5)*10;
      p.vx=(this.random()-.5)*70;
      p.vy=-22-this.random()*42;
      p.max=.25+this.random()*.3;
      p.life=p.max;p.color=COLORS[kind];
    }
    return n;
  }
  trail(x:number,y:number,phased:boolean,dt:number):void{
    if(dt<=0)return;
    this.trailTimer+=dt;
    if(this.trailTimer>=(phased?.05:.11)){
      this.trailTimer=0;
      this.emit("phase",x,y,phased?3:1);
    }
  }
  update(dt:number):void{
    const seconds=Math.max(0,Math.min(dt,.08));
    for(const p of this.particles){
      if(p.life<=0)continue;
      p.life=Math.max(0,p.life-seconds);
      p.x+=p.vx*seconds;p.y+=p.vy*seconds;
      p.vy+=45*seconds;
    }
  }
  draw(painter:SparkPainter):void{
    for(const p of this.particles){
      if(p.life<=0)continue;
      painter.fillStyle(p.color,Math.min(.92,p.life/p.max));
      painter.fillCircle(p.x,p.y,Math.max(.8,(p.life/p.max)*2.5));
    }
  }
  get activeCount(){return this.particles.filter(p=>p.life>0).length;}
}
