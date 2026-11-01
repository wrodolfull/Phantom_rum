/**
 * Monotonic wall-time for 3D chase. Phaser's scene delta can be accelerated
 * under headless/WebGL and must NOT decide chase duration or distance.
 *
 * The clock is paused/resumed explicitly. Long gaps are capped so switching
 * tabs cannot jump the character into obstacles.
 */
export class ChaseClock {
  private lastAt:number|null=null;
  private active=0;
  constructor(private readonly maxFrameSeconds=.07){}
  reset(now:number):void{
    this.lastAt=now;this.active=0;
  }
  resume(now:number):void{this.lastAt=now;}
  tick(now:number,paused=false):number{
    if(!Number.isFinite(now))return 0;
    if(this.lastAt===null){this.lastAt=now;return 0;}
    const raw=Math.max(0,(now-this.lastAt)/1000);
    this.lastAt=now;
    if(paused)return 0;
    const seconds=Math.min(raw,this.maxFrameSeconds);
    this.active+=seconds;
    return seconds;
  }
  get activeSeconds():number{return this.active;}
}
