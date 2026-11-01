import {describe,it,expect} from "vitest";
import {ACHIEVEMENTS,emptyProgress,finishRun,nextDistanceGoal,normalizeProgress} from "./progress";

const run={meters:80,essence:3,jumps:2,phases:1,walls:1,orbs:1,tier:1};
describe("local progression",()=>{
  it("normalizes invalid/corrupt records and migrates old best scores",()=>{
    expect(normalizeProgress(null,42).bestDistance).toBe(42);
    const p=normalizeProgress({bestDistance:-20,achievements:["phase","fake","phase"],tutorialDone:"true"},99);
    expect(p.bestDistance).toBe(99);
    expect(p.achievements).toEqual(["phase"]);
    expect(p.tutorialDone).toBe(false);
  });
  it("tracks best and cumulative stats, awarding achievements exactly once",()=>{
    const first=finishRun(emptyProgress(),run);
    expect(first.newRecord).toBe(true);
    expect(first.progress.bestDistance).toBe(80);
    expect(first.progress.totalRuns).toBe(1);
    expect(first.unlocked).toEqual(["first_run","first_jump","phase","wall"]);
    const again=finishRun(first.progress,{...run,meters:20,jumps:0,phases:0,walls:0});
    expect(again.newRecord).toBe(false);
    expect(again.unlocked).toEqual([]);
    expect(again.progress.bestDistance).toBe(80);
    expect(again.progress.totalMeters).toBe(100);
  });
  it("unlocks long-term achievements without duplicates",()=>{
    let p=emptyProgress();let unlocked:string[]=[];
    for(let i=0;i<10;i++){
      const r=finishRun(p,{...run,meters:101,essence:5});
      p=r.progress;unlocked.push(...r.unlocked);
    }
    expect(p.totalRuns).toBe(10);
    expect(p.totalMeters).toBe(1010);
    expect(unlocked).toContain("veteran");
    expect(unlocked).toContain("traveler");
    expect(unlocked).toContain("collector");
    expect(new Set(unlocked).size).toBe(unlocked.length);
    expect(p.achievements.length).toBe(ACHIEVEMENTS.length);
  });
  it("reports the next personal distance milestone",()=>{
    expect(nextDistanceGoal(0)).toEqual({label:"PRÓXIMA META: 25 m",target:25,ratio:0});
    expect(nextDistanceGoal(60).target).toBe(100);
    expect(nextDistanceGoal(6000).ratio).toBe(1);
  });
});
