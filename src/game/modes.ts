/**
 * Persistent, engine-agnostic state shared by the 2D run and 3D chase.
 * 10 horizontal world pixels = 1 game meter (consistent with existing scores).
 */
export const CHASE_START_PX=8000;   // 800 meters
export const CHASE_END_PX=11500;   // 1150 meters
export interface RunSnapshot {
  distancePx:number;
  energy:number;
  essence:number;
  jumps:number;
  phases:number;
  walls:number;
  orbs:number;
  forceTutorial:boolean;
  chaseDone:boolean;
}
export interface ChaseGate {
  distancePx:number;
  grounded:boolean;
  physical:boolean;
  chaseDone:boolean;
  /** Distance to the closest existing hazard: signed forward from the player. */
  nearestHazardPx:number;
}
export function shouldStartChase(input:ChaseGate):boolean{
  return !input.chaseDone &&
    input.distancePx>=CHASE_START_PX &&
    input.grounded && input.physical &&
    input.nearestHazardPx>=145;
}
export function chaseCompleted(distancePx:number):boolean{
  return distancePx>=CHASE_END_PX;
}
export function mergeRun(before:RunSnapshot,after:Partial<RunSnapshot>):RunSnapshot {
  return {
    ...before,...after,
    distancePx:Math.max(before.distancePx,after.distancePx??before.distancePx),
    energy:Math.max(0,Math.min(100,after.energy??before.energy)),
    essence:Math.max(0,Math.floor(after.essence??before.essence)),
    chaseDone:true
  };
}
export function asRunStats(state:RunSnapshot) {
  return {
    meters:Math.floor(state.distancePx/10),
    essence:state.essence,
    jumps:state.jumps,
    phases:state.phases,
    walls:state.walls,
    orbs:state.orbs,
    tier:state.distancePx>=30000?4:state.distancePx>=15000?3:
      state.distancePx>=5000?2:1
  };
}
export type ChaseObstacleKind="stone"|"arch"|"ward"|"essence"|"orb";
export interface ChaseObject {lane:0|1|2;kind:ChaseObstacleKind; z:number; passed:boolean}
export function chaseCollision(
  obstacle:ChaseObject, playerLane:0|1|2, playerHeight:number,
  intangible:boolean
):"miss"|"hit"|"essence"|"orb"{
  if(obstacle.lane!==playerLane)return "miss";
  if(obstacle.kind==="essence")return intangible?"miss":"essence";
  if(obstacle.kind==="orb")return "orb";
  if(obstacle.kind==="ward")return intangible?"hit":"miss";
  if(intangible)return "miss";
  if(obstacle.kind==="stone"&&playerHeight>.65)return "miss";
  return "hit";
}
/**
 * Deterministic short 3D obstacle sequence. At most two blocked lanes, so a
 * safe physical lane always exists. Pickups are on the unblocked lane.
 */
export function waveAt(index:number):ChaseObject[]{
  const first=(index*2+1)%3 as 0|1|2;
  const second=(first+1)%3 as 0|1|2;
  const safe=(first+2)%3 as 0|1|2;
  const primary:ChaseObstacleKind=["stone","arch","ward","stone","arch"][index%5] as ChaseObstacleKind;
  const objects:ChaseObject[]=[
    {lane:first,kind:primary,z:-58,passed:false},
    {lane:safe,kind:index%3===0?"orb":"essence",z:-58,passed:false}
  ];
  if(index>=3&&index%2===0)
    objects.push({lane:second,kind:index%4===0?"ward":"stone",z:-58,passed:false});
  return objects;
}
