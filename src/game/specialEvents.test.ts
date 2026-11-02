import {describe,it,expect} from "vitest";
import {
  newSpecialSchedule,nextSpecialEvent,restoreSpecialSchedule,
  specialEventReady,scheduleSnapshot,chaseEndFor
} from "./specialEvents";

describe("randomized recurring gameplay events",()=>{
  it("begins early enough for meaningful variety and never repeats a mode",()=>{
    let schedule=newSpecialSchedule(123);
    expect(schedule.nextAtPx).toBeGreaterThanOrEqual(2600);
    expect(schedule.nextAtPx).toBeLessThan(3500);
    const seen:string[]=[];
    for(let i=0;i<18;i++){
      const next=nextSpecialEvent(schedule,schedule.nextAtPx);
      if(seen.length)expect(next.mode).not.toBe(seen.at(-1));
      seen.push(next.mode);
      expect(next.schedule.nextAtPx).toBeGreaterThan(schedule.nextAtPx+1700);
      schedule=next.schedule;
    }
    expect(new Set(seen.slice(0,3)).size).toBe(3);
    const counts=schedule.counts;
    expect(Math.max(...counts)-Math.min(...counts)).toBeLessThanOrEqual(1);
  });
  it("is reproducible for seed and survives leaving every special scene",()=>{
    let schedule=newSpecialSchedule(9876);
    const first=nextSpecialEvent(schedule,3500);
    schedule=first.schedule;
    const restored=restoreSpecialSchedule(
      scheduleSnapshot(schedule),schedule.nextAtPx-3000,1
    );
    expect(restored).toEqual(schedule);
    const reset=restoreSpecialSchedule(scheduleSnapshot(schedule),40000);
    expect(reset.nextAtPx).toBeGreaterThanOrEqual(41750);
    const a=nextSpecialEvent(schedule,40000);
    const b=nextSpecialEvent(restored,40000);
    expect(a.mode).toBe(b.mode);
  });
  it("never triggers over a pit, obstacle or during intangibility",()=>{
    expect(specialEventReady(3000,2600,true,true,230)).toBe(true);
    expect(specialEventReady(2500,2600,true,true,230)).toBe(false);
    expect(specialEventReady(3000,2600,false,true,230)).toBe(false);
    expect(specialEventReady(3000,2600,true,false,230)).toBe(false);
    expect(specialEventReady(3000,2600,true,true,100)).toBe(false);
  });
  it("sets dynamic chase end beyond start plus the minimum playable time",()=>{
    expect(chaseEndFor(8000)).toBeGreaterThan(8000+4500);
    expect(chaseEndFor(25000)).toBeGreaterThan(29500);
    expect(chaseEndFor(3000)).toBe(8000);
  });
});
