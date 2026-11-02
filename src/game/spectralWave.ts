import {waveBreaksObstacle} from "./hunterHorde";

/** The Spectral Wave sweeps the playfield instead of clearing it instantly.
 * Pure values allow reliable tests independent from frame rate/Phaser.
 */
export const WAVE_SWEEP_SECONDS=1.05;
export const WAVE_MAX_REACH=350;
export const WAVE_INITIAL_REACH=24;
export const WAVE_MIN_AHEAD=-22;
export const WAVE_MAX_EFFECTS=12;

export function waveRadius(activeElapsed:number):number{
  if(!Number.isFinite(activeElapsed))return WAVE_INITIAL_REACH;
  const progress=Math.max(0,Math.min(1,activeElapsed/WAVE_SWEEP_SECONDS));
  // Fast in the first half, slowing near the edge so the attack reads clearly.
  return WAVE_INITIAL_REACH+
    (WAVE_MAX_REACH-WAVE_INITIAL_REACH)*(1-(1-progress)**2);
}
export function waveMayBreak(
  kind:string,aheadPx:number,elapsed:number,alreadyDestroyed:boolean
):boolean{
  if(alreadyDestroyed||!waveBreaksObstacle(kind)||
    !Number.isFinite(aheadPx))return false;
  return aheadPx>=WAVE_MIN_AHEAD&&aheadPx<=waveRadius(elapsed);
}
export function waveRingAlpha(elapsed:number,activeSeconds:number):number{
  if(activeSeconds<=0)return 0;
  const fade=Math.max(0,Math.min(1,activeSeconds/.42));
  return fade*(.65+.20*Math.sin(Math.max(0,elapsed)*12));
}
export function soulFormationPosition(index:number,playerX:number,
  playerY:number,seconds:number):{x:number;y:number}{
  const rank=Math.max(0,Math.min(4,Math.floor(index)));
  const row=Math.floor(rank/3);
  const column=rank%3;
  return {
    x:playerX-14-column*13-row*5,
    y:playerY-9-row*18-column*3+
      Math.sin(seconds*5+rank*.85)*3
  };
}
