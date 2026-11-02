/** Possess a rare luminous bat, then collect extra Essence on a short flight. */
export const BAT_TRIGGER_PX=17000; // first appearance at 1700m, after mansion
export const BAT_RETRY_DISTANCE_PX=6500;
export const BAT_SPAWN_AHEAD_PX=380;
export const BAT_CAPTURE_OFFSET_PX=48;
export const BAT_CAPTURE_TOLERANCE_PX=48;
export const BAT_MISS_OFFSET_PX=-24;
export const BAT_PLAYER_X=98;
export const BAT_FLIGHT_SECONDS=10;
export const BAT_FLIGHT_SPEED=195;
export const BAT_FLIGHT_DISTANCE_PX=1350; // +135m, exactly once per successful flight
export const BAT_MAX_ESSENCE=10;
export const BAT_FLIGHT_LANES=[76,126,178] as const;
export type FlightLane=0|1|2;
export interface BatGate {
  distancePx:number;
  platformDone:boolean;
  batDone:boolean;
  grounded:boolean;
  physical:boolean;
  nearestHazardPx:number;
}
/** Opportunity spawns after a safe gap, not while jumping/phase shifting. */
export function shouldSpawnBat(g:BatGate,nextAtPx=BAT_TRIGGER_PX):boolean{
  return g.platformDone&&!g.batDone&&
    g.distancePx>=nextAtPx&&g.grounded&&g.physical&&
    g.nearestHazardPx>=190;
}
export function batRelativeX(distancePx:number,batWorldX:number,playerX=BAT_PLAYER_X):number{
  return batWorldX-distancePx-playerX;
}
export function batCanCapture(relativeX:number):boolean{
  return Number.isFinite(relativeX)&&
    Math.abs(relativeX-BAT_CAPTURE_OFFSET_PX)<=BAT_CAPTURE_TOLERANCE_PX;
}
/** Countdown ring shrinks as bat approaches the precise timing point. */
export function batTargetRadius(relativeX:number):number{
  const error=Math.abs(relativeX-BAT_CAPTURE_OFFSET_PX);
  return Math.max(9,Math.min(37,9+error*.08));
}
export function batAttempt(relativeX:number,alreadyDone:boolean):"success"|"early"|"missed"{
  if(alreadyDone)return "missed";
  if(relativeX<BAT_MISS_OFFSET_PX)return "missed";
  return batCanCapture(relativeX)?"success":"early";
}
export function batHasLeft(relativeX:number):boolean{
  return relativeX<BAT_MISS_OFFSET_PX;
}
export function nextBatDistance(distancePx:number):number{
  return Math.max(BAT_TRIGGER_PX,distancePx+BAT_RETRY_DISTANCE_PX);
}
export type FlightPickup={id:number;startX:number;lane:FlightLane};
export const FLIGHT_PICKUPS:readonly FlightPickup[]=Array.from({length:14},(_,i)=>({
  id:i,startX:BAT_PLAYER_X+175+i*117,
  lane:(Math.floor(i/3)%3) as FlightLane
}));
export function flightPickupX(pickup:FlightPickup,elapsed:number):number{
  return pickup.startX-Math.max(0,elapsed)*BAT_FLIGHT_SPEED;
}
export function flightPickupCrossed(pickup:FlightPickup,prevElapsed:number,
  nextElapsed:number,lane:FlightLane):boolean{
  if(pickup.lane!==lane||nextElapsed<prevElapsed)return false;
  const before=flightPickupX(pickup,prevElapsed);
  const after=flightPickupX(pickup,nextElapsed);
  return before>=BAT_PLAYER_X-15&&after<=BAT_PLAYER_X+15;
}
export function flightEarnedDistance(elapsed:number):number{
  return Math.max(0,Math.min(BAT_FLIGHT_DISTANCE_PX,
    Math.round(Math.max(0,elapsed)/BAT_FLIGHT_SECONDS*BAT_FLIGHT_DISTANCE_PX)));
}
export function flightEssence(earned:number):number{
  return Math.min(BAT_MAX_ESSENCE,Math.max(0,Math.floor(earned)));
}
export function flightComplete(elapsed:number,wallSeconds:number):boolean{
  return elapsed>=BAT_FLIGHT_SECONDS&&wallSeconds>=BAT_FLIGHT_SECONDS;
}
