/** The 2D platform chapter is played once per run after the 3D chase. */
export const PLATFORM_START_PX=14500; // 1,450 meters
export const PLATFORM_DISTANCE_REWARD_PX=700; // one-off +70 meters on escape
export const PLATFORM_WORLD_WIDTH=1480;
export const PLATFORM_FLOOR_Y=236;
export const PLATFORM_EXIT_X=1368;
export const PLATFORM_SPEED=175;
export const PLATFORM_GRAVITY=760;
export const PLATFORM_JUMP=-307;
export const PLATFORM_BODY_HALF_WIDTH=10;
export const PLATFORM_BODY_HEIGHT=27;
export const PLATFORM_EP_DRAIN=30;
export const PLATFORM_EP_REGEN=12;

export interface PlatformGate {
  distancePx:number;
  chaseDone:boolean;
  platformDone:boolean;
  grounded:boolean;
  physical:boolean;
  nearestHazardPx:number;
}
export function shouldStartPlatform(state:PlatformGate):boolean{
  return state.chaseDone&&!state.platformDone&&
    state.distancePx>=PLATFORM_START_PX&&state.grounded&&state.physical&&
    state.nearestHazardPx>=170;
}
export type PlatformSurface={id:string;x:number;width:number;y:number};
export const PLATFORM_SURFACES:readonly PlatformSurface[]=[
  {id:"hall",x:0,width:272,y:236},
  {id:"stairs-1",x:238,width:168,y:197},
  {id:"stairs-2",x:389,width:152,y:160},
  {id:"gallery",x:518,width:165,y:123},
  {id:"landing-1",x:661,width:160,y:158},
  {id:"landing-2",x:805,width:175,y:194},
  {id:"crypt-walk",x:965,width:180,y:214},
  {id:"exit-hall",x:1130,width:350,y:236}
];
export type PlatformBarrierKind="stone"|"ward";
export type PlatformBarrier={x:number;y:number;width:number;height:number;kind:PlatformBarrierKind};
export const PLATFORM_BARRIERS:readonly PlatformBarrier[]=[
  {x:616,y:123,width:18,height:69,kind:"ward"},
  {x:913,y:194,width:22,height:74,kind:"stone"}
];
export type PlatformPickup={id:string;kind:"essence"|"orb";x:number;y:number};
export const PLATFORM_PICKUPS:readonly PlatformPickup[]=[
  {id:"e1",kind:"essence",x:308,y:167},
  {id:"e2",kind:"essence",x:451,y:131},
  {id:"e3",kind:"essence",x:559,y:94},
  {id:"e4",kind:"essence",x:731,y:129},
  {id:"e5",kind:"essence",x:861,y:165},
  {id:"e6",kind:"essence",x:1016,y:184},
  {id:"e7",kind:"essence",x:1194,y:207},
  {id:"e8",kind:"essence",x:1328,y:205},
  {id:"o1",kind:"orb",x:572,y:88},
  {id:"o2",kind:"orb",x:1063,y:184}
];
export type PlatformCheckpoint={x:number;feetY:number;triggerX:number};
export const PLATFORM_CHECKPOINTS:readonly PlatformCheckpoint[]=[
  {x:78,feetY:PLATFORM_FLOOR_Y,triggerX:0},
  {x:547,feetY:123,triggerX:552},
  {x:947,feetY:194,triggerX:941}
];
export interface PlatformState {
  x:number;feetY:number;vy:number;grounded:boolean;
  energy:number;phased:boolean;phaseLocked:boolean;
  coyote:number;jumpBuffer:number;
}
export interface PlatformActions {axis:-1|0|1;jump:boolean;phase:boolean}
export type PlatformStep={
  state:PlatformState;jumped:boolean;phaseChanged:boolean;
  barrier:PlatformBarrierKind|null;fell:boolean;
};
export function initialPlatformState(energy=100):PlatformState{
  return {x:78,feetY:PLATFORM_FLOOR_Y,vy:0,grounded:true,
    energy:Math.min(100,Math.max(0,energy)),phased:false,
    phaseLocked:false,coyote:.1,jumpBuffer:0};
}
export function stepPlatform(
  input:PlatformState,actions:PlatformActions,dt:number,
  surfaces:readonly PlatformSurface[]=PLATFORM_SURFACES,
  barriers:readonly PlatformBarrier[]=PLATFORM_BARRIERS
):PlatformStep {
  const seconds=Number.isFinite(dt)?Math.max(0,Math.min(dt,1/30)):0;
  const state={...input};
  const beforePhase=state.phased;
  if(!actions.phase)state.phaseLocked=false;
  if(state.phased){
    state.energy=Math.max(0,state.energy-PLATFORM_EP_DRAIN*seconds);
    if(!actions.phase||state.energy===0){
      state.phased=false;
      if(state.energy===0)state.phaseLocked=true;
    }
  }else{
    state.energy=Math.min(100,state.energy+PLATFORM_EP_REGEN*seconds);
    if(actions.phase&&!state.phaseLocked&&state.energy>=10)state.phased=true;
  }
  state.jumpBuffer=actions.jump?.13:Math.max(0,state.jumpBuffer-seconds);
  state.coyote=state.grounded?.10:Math.max(0,state.coyote-seconds);
  let jumped=false;
  if(state.jumpBuffer>0&&state.coyote>0){
    state.vy=PLATFORM_JUMP;
    state.grounded=false;
    state.coyote=0;state.jumpBuffer=0;
    jumped=true;
  }
  const proposedX=Math.max(PLATFORM_BODY_HALF_WIDTH+1,Math.min(
    PLATFORM_WORLD_WIDTH-PLATFORM_BODY_HALF_WIDTH-1,
    state.x+actions.axis*PLATFORM_SPEED*seconds
  ));
  let nextX=proposedX;
  let barrier:PlatformBarrierKind|null=null;
  for(const block of barriers){
    const solid=block.kind==="stone"?!state.phased:state.phased;
    if(!solid)continue;
    const touchingY=state.feetY>block.y-block.height&&
      state.feetY-PLATFORM_BODY_HEIGHT<block.y;
    if(!touchingY)continue;
    const overlap=proposedX+PLATFORM_BODY_HALF_WIDTH>block.x&&
      proposedX-PLATFORM_BODY_HALF_WIDTH<block.x+block.width;
    if(!overlap)continue;
    barrier=block.kind;
    if(actions.axis>0&&state.x+PLATFORM_BODY_HALF_WIDTH<=block.x+1)
      nextX=Math.min(nextX,block.x-PLATFORM_BODY_HALF_WIDTH);
    else if(actions.axis<0&&state.x-PLATFORM_BODY_HALF_WIDTH>=block.x+block.width-1)
      nextX=Math.max(nextX,block.x+block.width+PLATFORM_BODY_HALF_WIDTH);
    else nextX=state.x; // stopped directly in a gate: cannot tunnel through
  }
  state.x=nextX;
  // Floors remain solid in both ghost states so holding phase cannot drop
  // through a platform unintentionally.
  const support=surfaces.some(p=>Math.abs(state.feetY-p.y)<.8&&
    state.x+PLATFORM_BODY_HALF_WIDTH>p.x+1&&
    state.x-PLATFORM_BODY_HALF_WIDTH<p.x+p.width-1);
  if(state.grounded&&!jumped&&support){
    state.vy=0;
  }else{
    state.grounded=false;
    const beforeY=state.feetY;
    state.vy+=PLATFORM_GRAVITY*seconds;
    state.feetY+=state.vy*seconds;
    if(state.vy>=0){
      const available=surfaces.filter(p=>
        beforeY<=p.y+.15&&state.feetY>=p.y &&
        state.x+PLATFORM_BODY_HALF_WIDTH>p.x+1&&
        state.x-PLATFORM_BODY_HALF_WIDTH<p.x+p.width-1);
      if(available.length){
        const landing=available.reduce((a,b)=>a.y<b.y?a:b);
        state.feetY=landing.y;state.vy=0;state.grounded=true;
      }
    }
  }
  return {
    state,jumped,phaseChanged:beforePhase!==state.phased,barrier,
    fell:state.feetY>305
  };
}
export function platformPickupReached(
  player:PlatformState,pickup:PlatformPickup
):boolean{
  if(pickup.kind==="essence"&&player.phased)return false;
  return Math.abs(player.x-pickup.x)<=19&&
    Math.abs(player.feetY-15-pickup.y)<=23;
}
export function platformCheckpointFor(
  player:PlatformState,previous:PlatformCheckpoint
):PlatformCheckpoint{
  if(!player.grounded)return previous;
  for(const c of [...PLATFORM_CHECKPOINTS].reverse()){
    if(player.x>=c.triggerX&&c.triggerX>=previous.triggerX&&
      Math.abs(player.feetY-c.feetY)<1)return c;
  }
  return previous;
}
export function platformCanExit(state:PlatformState):boolean{
  return state.x>=PLATFORM_EXIT_X&&state.grounded&&
    Math.abs(state.feetY-PLATFORM_FLOOR_Y)<1;
}
