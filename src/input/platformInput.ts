import {GestureInput} from "./touchControls";
/**
 * No oversized buttons over Phantom. Left 44% of the game canvas acts as
 * a drag joystick. On the right: tap = jump, hold = intangibility.
 * Multiple fingers work independently (move and jump/phase simultaneously).
 */
export type PlatformInputActions={
  move:(dir:-1|0|1)=>void;
  jump:()=>void;
  phase:(held:boolean)=>void;
};
type DriveContact={startX:number;lastX:number;dir:-1|0|1;order:number};
export const PLATFORM_DRIVE_ZONE=.44;
export const PLATFORM_DRIVE_SLOP=17;
export class PlatformInput{
  private readonly gesture:GestureInput;
  private readonly drives=new Map<number,DriveContact>();
  private current:-1|0|1=0;
  private order=0;
  constructor(private readonly actions:PlatformInputActions,private readonly width=480){
    this.gesture=new GestureInput({jump:actions.jump,phase:actions.phase});
  }
  press(id:number,x:number,y:number,now:number):void{
    this.cancel(id);
    if(x<this.width*PLATFORM_DRIVE_ZONE){
      this.drives.set(id,{startX:x,lastX:x,dir:0,order:++this.order});
      this.recompute();
    }else this.gesture.press(id,x,y,now);
  }
  move(id:number,x:number,y:number):void{
    const c=this.drives.get(id);
    if(c){
      c.lastX=x;
      const offset=x-c.startX;
      c.dir=Math.abs(offset)<PLATFORM_DRIVE_SLOP?0:offset>0?1:-1;
      this.recompute();
    }else this.gesture.move(id,x,y);
  }
  release(id:number,now:number):void{
    if(this.drives.delete(id))this.recompute();
    else this.gesture.release(id,now);
  }
  cancel(id:number):void{
    if(this.drives.delete(id))this.recompute();
    this.gesture.cancel(id);
  }
  update(now:number):void{this.gesture.update(now);}
  clear():void{
    this.drives.clear();
    this.gesture.clear();
    if(this.current!==0){this.current=0;this.actions.move(0);}
  }
  private recompute():void{
    let selected:DriveContact|undefined;
    for(const c of this.drives.values())
      if(!selected||c.order>selected.order)selected=c;
    const next=selected?.dir??0;
    if(next!==this.current){
      this.current=next;this.actions.move(next);
    }
  }
  get axis(){return this.current;}
  get phasing(){return this.gesture.phasing;}
}
