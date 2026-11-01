/**
 * Tap anywhere to jump; hold the same pointer to phase.
 * Uses monotonic timestamps supplied by the host so behavior is not tied to FPS.
 * Supports simultaneous pointers: hold to phase + tap with another finger to jump.
 */
export interface GestureActions { jump:()=>void; phase:(held:boolean)=>void }
type Contact={start:number;x:number;y:number;active:boolean;cancelled:boolean};
export const HOLD_MS=145;
export const MOVE_SLOP_PX=18;
export class GestureInput {
  private contacts=new Map<number,Contact>();
  private holds=0;
  constructor(private readonly actions:GestureActions){}
  press(id:number,x:number,y:number,now:number):void{
    if(this.contacts.has(id))this.cancel(id);
    this.contacts.set(id,{start:now,x,y,active:false,cancelled:false});
  }
  move(id:number,x:number,y:number):void{
    const c=this.contacts.get(id);
    if(!c||c.active)return;
    if(Math.hypot(x-c.x,y-c.y)>MOVE_SLOP_PX)c.cancelled=true;
  }
  update(now:number):void{
    for(const c of this.contacts.values()){
      if(c.active||c.cancelled||now-c.start<HOLD_MS)continue;
      c.active=true;
      this.holds++;
      if(this.holds===1)this.actions.phase(true);
    }
  }
  release(id:number,now:number):void{
    const c=this.contacts.get(id);
    if(!c)return;
    this.contacts.delete(id);
    if(c.active){
      this.holds=Math.max(0,this.holds-1);
      if(this.holds===0)this.actions.phase(false);
    }else if(!c.cancelled && now-c.start<HOLD_MS){
      this.actions.jump();
    }
  }
  cancel(id:number):void{
    const c=this.contacts.get(id);
    if(!c)return;
    this.contacts.delete(id);
    if(c.active){
      this.holds=Math.max(0,this.holds-1);
      if(this.holds===0)this.actions.phase(false);
    }
  }
  clear():void{
    const hadHold=this.holds>0;
    this.contacts.clear();this.holds=0;
    if(hadHold)this.actions.phase(false);
  }
  get phasing():boolean{return this.holds>0;}
  get pointerCount():number{return this.contacts.size;}
}
