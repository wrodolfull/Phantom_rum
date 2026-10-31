import Phaser from 'phaser';
type Particle={x:number;y:number;vx:number;vy:number;life:number;max:number;color:number;size:number};
type Burst='phaseOn'|'phaseOff'|'jump'|'collect'|'orb'|'hit';
const colors:Record<Burst,number[]> = {
  phaseOn:[0x55dafa,0xaff9ff,0x6288fd],phaseOff:[0xe3f5ff,0x97bde0],
  jump:[0xb5c78f,0x7772aa],collect:[0xffdb74,0xfff2bd],
  orb:[0x64eaff,0xffffff],hit:[0xf1a8d0,0x9772bf]
};
/** Reuses one Graphics object: no per-particle display objects or tweens. */
export class PhantomEffects{
  private graphics:Phaser.GameObjects.Graphics;
  private items:Particle[]=[];
  private emissionClock=0;
  constructor(scene:Phaser.Scene){this.graphics=scene.add.graphics().setDepth(9);}
  burst(type:Burst,x:number,y:number,count?:number){
    const amount=count??(type==='phaseOn'?16: type==='hit'?24:10);
    for(let i=0;i<amount&&this.items.length<110;i++){
      const angle=Math.random()*Math.PI*2;
      const force=24+Math.random()*85;
      this.items.push({x,y,vx:Math.cos(angle)*force,vy:Math.sin(angle)*force-18,
        life:.28+Math.random()*.30,max:.58,color:Phaser.Utils.Array.GetRandom(colors[type]),size:Math.random()>.5?2:1});
    }
  }
  update(dt:number,x:number,y:number,phase:boolean){
    this.emissionClock+=dt;
    if(phase&&this.emissionClock>.075){
      this.emissionClock=0;
      if(this.items.length<100)this.items.push({x:x-16,y:y+Math.random()*20-10,vx:-22-Math.random()*22,
        vy:(Math.random()-.5)*12,life:.36,max:.36,color:0x8beaff,size:2});
    }
    this.graphics.clear();
    for(let i=this.items.length-1;i>=0;i--){
      const p=this.items[i];p.life-=dt;
      if(p.life<=0){this.items.splice(i,1);continue;}
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=70*dt;
      this.graphics.fillStyle(p.color,Math.min(1,p.life/p.max));
      this.graphics.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size);
    }
  }
  clear(){this.items=[];this.graphics.clear();}
}
