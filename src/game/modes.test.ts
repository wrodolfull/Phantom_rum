import {describe,it,expect} from "vitest";
import {CHASE_START_PX,CHASE_END_PX,CHASE_MIN_PLAY_SECONDS,CHASE_WORLD_SPEED,shouldStartChase,chaseCompleted,mergeRun,asRunStats,
  chaseCollision,waveAt,type RunSnapshot} from "./modes";
const base:RunSnapshot={distancePx:8000,energy:84,essence:7,jumps:10,phases:3,walls:2,
  orbs:1,forceTutorial:false,chaseDone:false};
describe("2D ↔ 3D transition director",()=>{
  it("starts at 800m only on a safe, grounded physical stretch",()=>{
    const gate={distancePx:CHASE_START_PX,grounded:true,physical:true,
      chaseDone:false,nearestHazardPx:180};
    expect(shouldStartChase(gate)).toBe(true);
    expect(shouldStartChase({...gate,distancePx:7999})).toBe(false);
    expect(shouldStartChase({...gate,grounded:false})).toBe(false);
    expect(shouldStartChase({...gate,physical:false})).toBe(false);
    expect(shouldStartChase({...gate,nearestHazardPx:120})).toBe(false);
    expect(shouldStartChase({...gate,chaseDone:true})).toBe(false);
  });
  it("returns only after 1300m and at least 18 seconds, preserving resources",()=>{
    expect(chaseCompleted(CHASE_END_PX-1,CHASE_MIN_PLAY_SECONDS+5)).toBe(false);
    expect(chaseCompleted(CHASE_END_PX,.9)).toBe(false);
    expect(chaseCompleted(CHASE_END_PX,CHASE_MIN_PLAY_SECONDS-0.01)).toBe(false);
    expect(chaseCompleted(CHASE_END_PX,CHASE_MIN_PLAY_SECONDS)).toBe(true);
    expect((CHASE_END_PX-CHASE_START_PX)/CHASE_WORLD_SPEED).toBeGreaterThan(19);
    const resumed=mergeRun(base,{distancePx:CHASE_END_PX,essence:12,energy:47,jumps:14});
    expect(resumed.distancePx).toBe(13000);
    expect(resumed.essence).toBe(12);
    expect(resumed.energy).toBe(47);
    expect(resumed.phases).toBe(3);
    expect(resumed.chaseDone).toBe(true);
    expect(asRunStats(resumed).meters).toBe(1300);
    expect(shouldStartChase({distancePx:12500,grounded:true,physical:true,
      chaseDone:resumed.chaseDone,nearestHazardPx:200})).toBe(false);
  });
});
describe("3D chase",()=>{
  it("keeps at least one lane safe in every authored wave",()=>{
    for(let i=0;i<60;i++){
      const w=waveAt(i);
      const hazardous=new Set(w.filter(t=>!["essence","orb"].includes(t.kind)).map(t=>t.lane));
      expect(hazardous.size).toBeLessThanOrEqual(2);
      expect(new Set(w.map(t=>t.lane)).size).toBe(w.length);
      expect(w.every(t=>t.z===-58)).toBe(true);
    }
  });
  it("physical rocks can be jumped or phased; magic wards punish phasing",()=>{
    const obj={lane:1 as const,z:2,passed:false};
    expect(chaseCollision({...obj,kind:"stone"},1,0,false)).toBe("hit");
    expect(chaseCollision({...obj,kind:"stone"},1,1.1,false)).toBe("miss");
    expect(chaseCollision({...obj,kind:"stone"},1,0,true)).toBe("miss");
    expect(chaseCollision({...obj,kind:"arch"},1,1.1,false)).toBe("hit");
    expect(chaseCollision({...obj,kind:"ward"},1,0,false)).toBe("miss");
    expect(chaseCollision({...obj,kind:"ward"},1,0,true)).toBe("hit");
    expect(chaseCollision({...obj,kind:"orb"},1,0,true)).toBe("orb");
    expect(chaseCollision({...obj,kind:"essence"},1,0,true)).toBe("miss");
    expect(chaseCollision({...obj,kind:"essence"},0,0,false)).toBe("miss");
  });
});
