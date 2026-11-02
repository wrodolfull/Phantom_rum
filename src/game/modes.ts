/**
 * Persistent, engine-agnostic state shared by the 2D run and 3D chase.
 * 10 horizontal world pixels = 1 game meter (consistent with existing scores).
 */
export const CHASE_START_PX=8000;   // 800 meters
export const CHASE_END_PX=13000;   // 1300 meters
export const CHASE_MIN_PLAY_SECONDS=18;
export const CHASE_WORLD_SPEED=255;
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
/** Distance AND active chase play time must be met, never a loading/fade frame. */
export function chaseCompleted(distancePx:number,activeSeconds:number=Infinity):boolean{
  return distancePx>=CHASE_END_PX && activeSeconds>=CHASE_MIN_PLAY_SECONDS;
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
/**
 * Hazard life cycle in chase mode:
 * 1. Approach player
 * 2. Resolve crossing only once
 * 3. CONTINUE moving behind the player and camera
 * 4. Despawn past camera; never freeze at the collision plane.
 */
export const CHASE_HAZARD_SPEED=24;
export const CHASE_IMPACT_Z=1.5;
export const CHASE_DESPAWN_Z=11;
export function advanceChaseHazard(
  object:ChaseObject,deltaSeconds:number
):{crossed:boolean;despawn:boolean}{
  const before=object.z;
  const elapsed=Number.isFinite(deltaSeconds)?
    Math.max(0,deltaSeconds):0;
  object.z+=CHASE_HAZARD_SPEED*elapsed;
  const crossed=!object.passed&&before<CHASE_IMPACT_Z&&
    object.z>=CHASE_IMPACT_Z;
  if(crossed)object.passed=true;
  return {crossed,despawn:object.z>CHASE_DESPAWN_Z};
}
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
