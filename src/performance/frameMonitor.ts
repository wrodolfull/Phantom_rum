/** Low-overhead diagnostic only; not gameplay or user tracking. */
export interface FrameSnapshot {fps:number;slowPercent:number;samples:number}
export class FrameMonitor {
  private frames:number[]=[];
  private readonly capacity:number;
  constructor(capacity=120){this.capacity=Math.max(2,Math.floor(capacity));}
  record(deltaMs:number):void{
    // Paused/background tabs must not appear as a slow gameplay frame.
    if(!Number.isFinite(deltaMs)||deltaMs<=0||deltaMs>250)return;
    this.frames.push(deltaMs);
    if(this.frames.length>this.capacity)this.frames.shift();
  }
  snapshot():FrameSnapshot{
    if(this.frames.length===0)return {fps:0,slowPercent:0,samples:0};
    const duration=this.frames.reduce((sum,ms)=>sum+ms,0);
    const slow=this.frames.filter(ms=>ms>33.4).length;
    return {
      fps:Math.round(1000*this.frames.length/duration),
      slowPercent:Math.round(slow/this.frames.length*100),
      samples:this.frames.length
    };
  }
  reset(){this.frames=[];}
}
