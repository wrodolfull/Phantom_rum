import type {CourseObject} from './course';
import {GROUND_Y, WALL_HEIGHT, WARD_HEIGHT} from './course';

export interface BodySweep {beforeX:number;afterX:number;beforeY:number;afterY:number}
const HALF_WIDTH=10;
/** The floor vanishes only while the CENTER of the ghost is within an abyss. */
export function overGap(centerX:number,items:ReadonlyArray<CourseObject>):boolean{
  return items.some(t=>t.kind==='gap'&&centerX>=t.x&&centerX<t.x+t.width);
}
/** Prevents midair snapping to the floor when a player exits a pit below ground. */
export function canLand(beforeY:number,afterY:number,velocityY:number,centerX:number,
  items:ReadonlyArray<CourseObject>):boolean {
  return velocityY>=0 && beforeY+25<=GROUND_Y+1 && afterY+25>=GROUND_Y &&
    !overGap(centerX,items);
}
/**
 * Swept AABB against the fixed world. The character's collision shape is
 * 20px wide by 21px tall, 3px inset from the sprite's top.
 * Always call this on fixed-size simulation steps, not variable frame dt.
 */
export function intersectsThing(thing:CourseObject,sweep:BodySweep,verticalOffset=0):boolean {
  if(thing.kind==='gap')return false;
  const left=Math.min(sweep.beforeX,sweep.afterX)-HALF_WIDTH;
  const right=Math.max(sweep.beforeX,sweep.afterX)+HALF_WIDTH;
  if(right<=thing.x||left>=thing.x+thing.width)return false;
  const top=Math.min(sweep.beforeY,sweep.afterY)+3;
  const bottom=Math.max(sweep.beforeY,sweep.afterY)+24;
  // New enemies have visibly different silhouettes and collision heights.
  const h:Record<Exclude<CourseObject["kind"],"gap">,[number,number]>={
    wall:[WALL_HEIGHT,0],ward:[WARD_HEIGHT,0],
    bat:[38,14],hunter:[58,0],wraith:[48,0],
    spikes:[17,0],orb:[30,14],essence:[30,14]
  };
  const [height,bottomInset]=h[thing.kind];
  const thingTop=GROUND_Y-height+verticalOffset;
  const thingBottom=GROUND_Y-bottomInset+verticalOffset;
  return bottom>thingTop&&top<thingBottom;
}
