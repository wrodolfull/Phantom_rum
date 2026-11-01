import {describe,it,expect} from "vitest";
import {ChaseClock} from "./ChaseClock";
describe("real-time chase clock",()=>{
  it("cannot speed up when the game loop updates 1,000 times per real second",()=>{
    const clock=new ChaseClock();clock.reset(1000);
    for(let i=1;i<=1000;i++)clock.tick(1000+i);
    expect(clock.activeSeconds).toBeCloseTo(1,5);
  });
  it("advances with actual elapsed time, not Phaser's reported delta",()=>{
    const clock=new ChaseClock();clock.reset(0);
    for(let i=1;i<=60;i++)clock.tick(i*1000/60);
    expect(clock.activeSeconds).toBeCloseTo(1,5);
  });
  it("does not count paused time or huge background-tab gaps",()=>{
    const clock=new ChaseClock();clock.reset(0);
    clock.tick(20);clock.tick(10_020,true);
    expect(clock.activeSeconds).toBeCloseTo(.02,4);
    clock.resume(10_020);clock.tick(10_040);
    expect(clock.activeSeconds).toBeCloseTo(.04,4);
    clock.tick(100_000);
    expect(clock.activeSeconds).toBeCloseTo(.11,4);
  });
  it("treats backwards or invalid timestamps safely",()=>{
    const clock=new ChaseClock();clock.reset(1000);
    expect(clock.tick(999)).toBe(0);
    expect(clock.tick(Number.NaN)).toBe(0);
    expect(clock.activeSeconds).toBe(0);
  });
});
