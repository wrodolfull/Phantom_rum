import {describe,it,expect} from "vitest";
import {
  advanceChaseHazard,CHASE_HAZARD_SPEED,CHASE_IMPACT_Z,
  CHASE_DESPAWN_Z,waveAt,type ChaseObject
} from "./modes";

describe("3D and 2.5D obstacle lifecycle",()=>{
  it("keeps moving after passing Phantom and despawns behind the camera",()=>{
    for(const kind of ["stone","arch","ward","orb","essence"] as const){
      const object:ChaseObject={lane:1,kind,z:-58,passed:false};
      let crossings=0,removed=false;
      let zAtImpact=NaN;
      for(let frame=0;frame<300;frame++){
        const state=advanceChaseHazard(object,1/60);
        if(state.crossed){
          crossings++;
          zAtImpact=object.z;
          expect(object.passed).toBe(true);
          expect(object.z).toBeGreaterThanOrEqual(CHASE_IMPACT_Z);
        }
        if(object.passed&&frame>0&&object.z>zAtImpact+1){
          expect(object.z).toBeGreaterThan(zAtImpact);
        }
        if(state.despawn){
          removed=true;
          expect(object.z).toBeGreaterThan(CHASE_DESPAWN_Z);
          break;
        }
      }
      expect(crossings,kind+" should collide/collect only once").toBe(1);
      expect(removed,kind+" must leave the scene").toBe(true);
    }
  });

  it("a passed obstacle must NOT freeze or trigger a second collision",()=>{
    const obstacle:ChaseObject={lane:2,kind:"stone",z:CHASE_IMPACT_Z+.1,passed:true};
    const previous=obstacle.z;
    const state=advanceChaseHazard(obstacle,.05);
    expect(state.crossed).toBe(false);
    expect(obstacle.z).toBeCloseTo(previous+CHASE_HAZARD_SPEED*.05,5);
    expect(obstacle.passed).toBe(true);
  });

  it("advances every obstacle from the generated chase wave to eventual cleanup",()=>{
    const objects=Array.from({length:12},(_,i)=>waveAt(i)).flat();
    for(const o of objects){
      let crossings=0;
      let removed=false;
      for(let t=0;t<330;t++){
        const step=advanceChaseHazard(o,1/60);
        if(step.crossed)crossings++;
        if(step.despawn){removed=true;break;}
      }
      expect(crossings).toBe(1);
      expect(removed).toBe(true);
    }
  });

  it("ignores invalid/negative elapsed time without moving backwards",()=>{
    const obj:ChaseObject={lane:0,kind:"arch",z:-10,passed:false};
    advanceChaseHazard(obj,-1);
    advanceChaseHazard(obj,Number.NaN);
    expect(obj.z).toBe(-10);
    expect(obj.passed).toBe(false);
  });
});
