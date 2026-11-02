/**
 * The hunter follows Phantom in the 2D runner. Mistakes build pursuit pressure
 * instead of ending the run instantly. Lost souls form a small, visible convoy:
 * each takes a hit for Phantom, and 3 can be spent on a Spectral Wave.
 *
 * Pure rules shared with tests; never tied to frame rate or Phaser objects.
 */
export const MAX_HUNTER_DANGER=100;
export const HUNTER_INITIAL_DANGER=16;
export const HUNTER_HIT_COOLDOWN=1.35;
export const HUNTER_DANGER_RECOVERY_DELAY=3.5;
export const HUNTER_DANGER_RECOVERY_PER_SECOND=1.4;
export const MAX_SOUL_COMPANIONS=5;
export const SOUL_FIRST_AT_PX=760;
export const SOUL_SPAWN_SPACING_PX=1190;
export const SOUL_WAVE_COST=3;
export const SOUL_WAVE_SECONDS=2.7;
export const SOUL_WAVE_PRESSURE_RELIEF=18;
export const SOUL_PICKUP_RADIUS_PX=24;
export type HunterHitKind="obstacle"|"pit";
export type HunterState={
  danger:number;
  companions:number;
  invulnerable:number;
  quietSeconds:number;
  waveSeconds:number;
};
const between=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export function initialHunterState(
  danger=HUNTER_INITIAL_DANGER,companions=0
):HunterState {
  return {
    danger:between(Number.isFinite(danger)?danger:HUNTER_INITIAL_DANGER,0,100),
    companions:between(Number.isFinite(companions)?Math.floor(companions):0,0,MAX_SOUL_COMPANIONS),
    invulnerable:0,quietSeconds:0,waveSeconds:0
  };
}
export function tickHunter(state:HunterState,dt:number):HunterState{
  const seconds=Number.isFinite(dt)?between(dt,0,.08):0;
  const quiet=state.quietSeconds+seconds;
  const decay=quiet>=HUNTER_DANGER_RECOVERY_DELAY?
    HUNTER_DANGER_RECOVERY_PER_SECOND*seconds:0;
  return {
    ...state,
    danger:Math.max(0,state.danger-decay),
    invulnerable:Math.max(0,state.invulnerable-seconds),
    quietSeconds:quiet,
    waveSeconds:Math.max(0,state.waveSeconds-seconds)
  };
}
export type HunterHitResult={
  state:HunterState;hit:boolean;caught:boolean;protectedBySoul:boolean;amount:number;
};
export function hunterHit(state:HunterState,kind:HunterHitKind):HunterHitResult{
  if(state.invulnerable>0||state.danger>=100)
    return {state,hit:false,caught:state.danger>=100,protectedBySoul:false,amount:0};
  const protectedBySoul=state.companions>0;
  const amount=protectedBySoul?(kind==="pit"?17:12):(kind==="pit"?36:25);
  const danger=Math.min(MAX_HUNTER_DANGER,state.danger+amount);
  return {
    state:{...state,danger,companions:state.companions-(protectedBySoul?1:0),
      quietSeconds:0,invulnerable:HUNTER_HIT_COOLDOWN,waveSeconds:0},
    hit:true,caught:danger>=MAX_HUNTER_DANGER,protectedBySoul,amount
  };
}
export function rescueSoul(state:HunterState):HunterState{
  return {...state,
    companions:Math.min(MAX_SOUL_COMPANIONS,state.companions+1),
    danger:Math.max(0,state.danger-5)};
}
export function canActivateSpectralWave(state:HunterState):boolean{
  return state.companions>=SOUL_WAVE_COST&&state.waveSeconds<=0&&state.danger<100;
}
export function activateSpectralWave(state:HunterState):HunterState{
  if(!canActivateSpectralWave(state))return state;
  return {...state,companions:state.companions-SOUL_WAVE_COST,
    danger:Math.max(0,state.danger-SOUL_WAVE_PRESSURE_RELIEF),
    waveSeconds:SOUL_WAVE_SECONDS};
}
/** A wave does not prevent a fall or invalidate the spectral-ward puzzle. */
export function waveBreaksObstacle(kind:string):boolean{
  return kind==="wall"||kind==="hunter"||kind==="bat"||kind==="spikes";
}
/** Pursuer is always visible behind Phantom, drawing closer with mistakes. */
export function hunterScreenX(danger:number,playerX=98):number{
  return playerX-84+between(danger,0,100)*.73;
}
export function soulPickupReached(
  beforeX:number,afterX:number,soulWorldX:number,grounded:boolean,physical:boolean
):boolean{
  if(!physical)return false;
  return afterX>=soulWorldX-SOUL_PICKUP_RADIUS_PX&&
    beforeX<=soulWorldX+SOUL_PICKUP_RADIUS_PX&&grounded;
}
/** Avoid spawning collectible souls on top of dangerous surfaces. */
export function safeSoulLocation(
  requested:number,
  hazards:readonly {kind:string;x:number;width:number}[]
):number{
  let x=requested;
  for(let attempt=0;attempt<12;attempt++){
    const blocked=hazards.some(h=>
      h.kind!=="essence"&&h.kind!=="orb"&&h.kind!=="soul"&&
      x>=h.x-105&&x<=h.x+h.width+105);
    if(!blocked)return x;
    x+=95;
  }
  return x;
}
