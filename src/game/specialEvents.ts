/** Distance-based variety director. Random but seeded, fair and repeatable. */
export type SpecialEvent="chase"|"platform"|"bat";
export const SPECIAL_MODES:readonly SpecialEvent[]=["chase","platform","bat"];
export const FIRST_EVENT_MIN_PX=2600;
export const FIRST_EVENT_RANGE_PX=900;
export const BETWEEN_EVENT_MIN_PX=1750;
export const BETWEEN_EVENT_RANGE_PX=900;
export const AFTER_EVENT_SAFE_PX=1750;
export interface SpecialSchedule{
  seed:number;
  nextAtPx:number;
  last:SpecialEvent|null;
  counts:[number,number,number];
  events:number;
}
export interface SpecialScheduleSnapshot{
  specialSeed?:number;
  specialNextAtPx?:number;
  specialLast?:SpecialEvent|null;
  specialCounts?:[number,number,number];
  specialEvents?:number;
}
export function rngNext(seed:number):number{
  let x=seed>>>0;
  if(!x)x=0x91d53b;
  x^=x<<13;x^=x>>>17;x^=x<<5;
  return x>>>0;
}
export function newSpecialSchedule(seed=0x11382026):SpecialSchedule{
  const next=rngNext(seed);
  return {seed:next,nextAtPx:FIRST_EVENT_MIN_PX+
    next%FIRST_EVENT_RANGE_PX,last:null,counts:[0,0,0],events:0};
}
export function restoreSpecialSchedule(
  saved:SpecialScheduleSnapshot|undefined,
  distancePx:number,seed=0x11382026
):SpecialSchedule{
  if(!saved||typeof saved.specialSeed!=="number"||
    !Number.isFinite(saved.specialNextAtPx))
    return distancePx>0?{
      ...newSpecialSchedule(seed),
      nextAtPx:distancePx+AFTER_EVENT_SAFE_PX
    }:newSpecialSchedule(seed);
  const count=saved.specialCounts;
  const counts:[number,number,number]=Array.isArray(count)&&count.length===3?
    [0,1,2].map(i=>Math.max(0,Math.floor(Number(count[i])||0))) as [number,number,number]:
    [0,0,0];
  return {
    seed:saved.specialSeed>>>0,
    nextAtPx:Math.max(saved.specialNextAtPx??0,
      distancePx+AFTER_EVENT_SAFE_PX),
    last:SPECIAL_MODES.includes(saved.specialLast as SpecialEvent)?
      saved.specialLast!:null,
    counts,events:Math.max(0,Math.floor(saved.specialEvents??0))
  };
}
export function scheduleSnapshot(s:SpecialSchedule):SpecialScheduleSnapshot{
  return {
    specialSeed:s.seed,specialNextAtPx:s.nextAtPx,
    specialLast:s.last,specialCounts:[...s.counts],
    specialEvents:s.events
  };
}
export function nextSpecialEvent(
  s:SpecialSchedule,atDistancePx:number
):{mode:SpecialEvent;schedule:SpecialSchedule}{
  const seed=rngNext(s.seed);
  // Fairness: prefer a mode not seen as often, never repeat last.
  const options=SPECIAL_MODES.map((mode,i)=>({mode,i}))
    .filter(x=>x.mode!==s.last);
  const least=Math.min(...options.map(x=>s.counts[x.i]));
  const pool=options.filter(x=>s.counts[x.i]===least);
  const choice=pool[seed%pool.length];
  const counts=[...s.counts] as [number,number,number];
  counts[choice.i]++;
  const spacingSeed=rngNext(seed);
  return {
    mode:choice.mode,
    schedule:{
      seed:spacingSeed,
      last:choice.mode,
      counts,
      events:s.events+1,
      nextAtPx:atDistancePx+BETWEEN_EVENT_MIN_PX+
        spacingSeed%BETWEEN_EVENT_RANGE_PX
    }
  };
}
export function specialEventReady(
  distancePx:number,nextAtPx:number,grounded:boolean,
  physical:boolean,nearestHazardPx:number
):boolean{
  return distancePx>=nextAtPx&&grounded&&physical&&nearestHazardPx>=190;
}
/** One chase lasts at least 18 active seconds and never rewinds the run. */
export function chaseEndFor(startPx:number,speed=255,minSeconds=18):number{
  return Math.max(13000,startPx+Math.ceil(speed*minSeconds));
}
