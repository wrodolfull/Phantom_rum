import {GestureInput} from "./touchControls";
export type ChaseActions={jump:()=>void;phase:(held:boolean)=>void;lane:(direction:-1|1)=>void};
type Contact={x:number;y:number;swiped:boolean};
export class ChaseInput {
  private readonly gestures:GestureInput;
  private contacts=new Map<number,Contact>();
  constructor(private readonly actions:ChaseActions){
    this.gestures=new GestureInput({jump:actions.jump,phase:actions.phase});
  }
  press(id:number,x:number,y:number,t:number){
    this.contacts.set(id,{x,y,swiped:false});
    this.gestures.press(id,x,y,t);
  }
  move(id:number,x:number,y:number){
    const c=this.contacts.get(id);
    if(!c||c.swiped)return;
    const dx=x-c.x,dy=y-c.y;
    if(Math.abs(dx)>=42&&Math.abs(dx)>Math.abs(dy)*1.15){
      c.swiped=true;
      this.gestures.cancel(id);
      this.actions.lane(dx>0?1:-1);
    }else this.gestures.move(id,x,y);
  }
  update(now:number){this.gestures.update(now);}
  release(id:number,now:number){
    this.contacts.delete(id);
    this.gestures.release(id,now);
  }
  cancel(id:number){this.contacts.delete(id);this.gestures.cancel(id);}
  clear(){this.contacts.clear();this.gestures.clear();}
  get phasing(){return this.gestures.phasing;}
}
