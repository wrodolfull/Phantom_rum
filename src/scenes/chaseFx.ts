import type * as T from "three";
import type {ChaseObstacleKind} from "../game/modes";

type ThreeApi=typeof import("three");
export type BurstKind="phase"|"collect"|"orb"|"hit"|"jump"|"lane";
export const CHASE_FX_CAPACITY=64;
const PALETTE:Record<BurstKind,number>={
  phase:0x78edff,collect:0xffd46b,orb:0x90f3ff,
  hit:0xff819c,jump:0xe9edff,lane:0xbbaff9
};
const KINDS:Readonly<Record<BurstKind,number>>={
  phase:5,collect:10,orb:11,hit:14,jump:8,lane:5
};
/**
 * Pooled arcade VFX: one Points geometry and one material, fixed 64-particle
 * budget across all events. No meshes, geometry or materials allocated per frame.
 */
export class ChaseEffects {
  readonly points:T.Points;
  private readonly geometry:T.BufferGeometry;
  private readonly material:T.PointsMaterial;
  private readonly positions:Float32Array;
  private readonly colors:Float32Array;
  private readonly velocities:Float32Array;
  private readonly life:Float32Array;
  private readonly ttl:Float32Array;
  private index=0;
  private seed=0x391cafe;
  private trailElapsed=0;
  private disposed=false;
  constructor(private readonly THREE:ThreeApi,private readonly world:T.Scene){
    this.positions=new Float32Array(CHASE_FX_CAPACITY*3);
    this.velocities=new Float32Array(CHASE_FX_CAPACITY*3);
    this.colors=new Float32Array(CHASE_FX_CAPACITY*3);
    this.life=new Float32Array(CHASE_FX_CAPACITY);
    this.ttl=new Float32Array(CHASE_FX_CAPACITY);
    this.geometry=new THREE.BufferGeometry();
    this.geometry.setAttribute("position",new THREE.BufferAttribute(this.positions,3)
      .setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute("color",new THREE.BufferAttribute(this.colors,3)
      .setUsage(THREE.DynamicDrawUsage));
    // Renderer sees all 64 points in the same draw call.
    this.geometry.setDrawRange(0,CHASE_FX_CAPACITY);
    this.material=new THREE.PointsMaterial({
      size:.19,sizeAttenuation:true,transparent:true,opacity:.9,
      vertexColors:true,depthWrite:false,blending:THREE.AdditiveBlending,
      fog:true
    });
    this.points=new THREE.Points(this.geometry,this.material);
    this.points.frustumCulled=false;
    world.add(this.points);
    for(let i=0;i<CHASE_FX_CAPACITY;i++){
      this.positions[i*3+1]=-500;
      this.colors[i*3]=0;this.colors[i*3+1]=0;this.colors[i*3+2]=0;
    }
  }
  private random(){
    this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;
    return this.seed/4294967296;
  }
  emit(kind:BurstKind,x:number,y:number,z:number,count=KINDS[kind]):number{
    if(this.disposed||!Number.isFinite(x+y+z))return 0;
    const n=Math.max(0,Math.min(CHASE_FX_CAPACITY,Math.floor(count)));
    const color=PALETTE[kind];
    const red=((color>>16)&255)/255,green=((color>>8)&255)/255,blue=(color&255)/255;
    for(let j=0;j<n;j++){
      const i=this.index++%CHASE_FX_CAPACITY,o=i*3;
      this.positions[o]=x+(this.random()-.5)*.42;
      this.positions[o+1]=y+(this.random()-.5)*.38;
      this.positions[o+2]=z+(this.random()-.5)*.45;
      this.velocities[o]=(this.random()-.5)*2.3;
      this.velocities[o+1]=kind==="jump"?1.1+this.random()*1.6:
        (this.random()-.22)*2.3;
      this.velocities[o+2]=1.2+this.random()*2.5;
      this.ttl[i]=.24+this.random()*.34;
      this.life[i]=this.ttl[i];
      this.colors[o]=red;this.colors[o+1]=green;this.colors[o+2]=blue;
    }
    this.geometry.attributes.position.needsUpdate=true;
    this.geometry.attributes.color.needsUpdate=true;
    return n;
  }
  trail(x:number,y:number,z:number,phased:boolean,dt:number):void{
    if(this.disposed||dt<=0)return;
    this.trailElapsed+=Math.min(dt,.08);
    const spacing=phased?.045:.09;
    if(this.trailElapsed>=spacing){
      this.trailElapsed=0;
      this.emit("phase",x,y+.34,z+.45,phased?3:1);
    }
  }
  update(dt:number):void{
    if(this.disposed||dt<=0)return;
    const elapsed=Math.min(dt,.08);
    for(let i=0;i<CHASE_FX_CAPACITY;i++){
      if(this.life[i]<=0)continue;
      this.life[i]=Math.max(0,this.life[i]-elapsed);
      const o=i*3;
      if(this.life[i]===0){
        this.positions[o+1]=-500;
        this.colors[o]=0;this.colors[o+1]=0;this.colors[o+2]=0;
      }else{
        this.positions[o]+=this.velocities[o]*elapsed;
        this.positions[o+1]+=this.velocities[o+1]*elapsed;
        this.positions[o+2]+=this.velocities[o+2]*elapsed;
        this.velocities[o+1]-=1.4*elapsed;
        const fade=this.life[i]/this.ttl[i];
        // Fade uniformly without allocating a per-particle material.
        const brightness=Math.max(.1,fade);
        this.colors[o]=Math.min(1,this.colors[o]*Math.min(1,brightness+.07));
        this.colors[o+1]=Math.min(1,this.colors[o+1]*Math.min(1,brightness+.07));
        this.colors[o+2]=Math.min(1,this.colors[o+2]*Math.min(1,brightness+.07));
      }
    }
    this.geometry.attributes.position.needsUpdate=true;
    this.geometry.attributes.color.needsUpdate=true;
  }
  get activeCount():number{
    let count=0;
    for(const ttl of this.life)if(ttl>0)count++;
    return count;
  }
  destroy():void{
    if(this.disposed)return;
    this.disposed=true;
    this.world.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}

/** Cosmetic animation only. Hazard model origin and collision geometry are untouched. */
export function animateChaseHazard(
  model:T.Group,kind:ChaseObstacleKind,time:number,dt:number
):void{
  if(kind==="ward"){
    const field=model.children[0] as T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
    const outer=model.children[1];
    const inner=model.children[2];
    field.material.opacity=.29+.09*Math.sin(time*3);
    const pulse=1+.05*Math.sin(time*4);
    outer.scale.set(pulse,pulse*1.29,1);
    inner.rotation.z+=dt*.72;
  }else if(kind==="orb"||kind==="essence"){
    const core=model.children[0];
    const inner=model.children[1];
    const halo=model.children[2];
    const beat=1+.09*Math.sin(time*5);
    core.rotation.y+=dt*1.6;
    inner.rotation.y-=dt*2.1;
    halo.scale.setScalar(beat);
  }
}

/** Smooth camera response without changing the gameplay lane position. */
export function chaseCameraOffset(
  time:number,impact:number,laneDelta:number,returning:boolean
):{x:number;y:number;roll:number}{
  const hit=Math.max(0,Math.min(1,impact));
  return {
    x:Math.sin(time*23)*.13*hit+laneDelta*.075,
    y:Math.cos(time*19)*.08*hit+Math.sin(time*7)*.022,
    roll:Math.max(-.025,Math.min(.025,laneDelta*.012))*(returning?.2:1)
  };
}
