import {describe,it,expect} from 'vitest';
import {canLand,intersectsThing,overGap} from './collisions';
import type {CourseObject} from './course';
const gap:CourseObject={kind:'gap',x:200,width:46};
describe('floor collisions',()=>{
  it('only loses floor support while the center is over a gap',()=>{
    expect(overGap(199,[gap])).toBe(false);
    expect(overGap(200,[gap])).toBe(true);
    expect(overGap(245,[gap])).toBe(true);
    expect(overGap(246,[gap])).toBe(false);
  });
  it('does not magnetize a character falling below the ground back onto the ledge',()=>{
    expect(canLand(193,198,80,250,[gap])).toBe(false);
    expect(canLand(190,190.25,15,250,[gap])).toBe(true);
    expect(canLand(190,190.25,15,212,[gap])).toBe(false);
  });
});
describe('swept hazard collisions',()=>{
  it('detects crossing a thin ward in one movement step',()=>{
    const ward:CourseObject={kind:'ward',x:210,width:5};
    expect(intersectsThing(ward,{beforeX:190,afterX:225,beforeY:190,afterY:190})).toBe(true);
  });
  it('does not collide with walls during a high enough jump',()=>{
    const wall:CourseObject={kind:'wall',x:210,width:26};
    expect(intersectsThing(wall,{beforeX:190,afterX:220,beforeY:105,afterY:108})).toBe(false);
    expect(intersectsThing(wall,{beforeX:190,afterX:220,beforeY:190,afterY:190})).toBe(true);
  });
  it('never treats gaps as ordinary obstacles',()=>{
    expect(intersectsThing(gap,{beforeX:190,afterX:220,beforeY:190,afterY:190})).toBe(false);
  });
});
