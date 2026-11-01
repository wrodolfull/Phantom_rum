import {describe,it,expect} from "vitest";
import {FrameMonitor} from "./frameMonitor";
describe("performance diagnostics",()=>{
  it("gives a stable approximate fps over the last N frames",()=>{
    const m=new FrameMonitor(3);
    for(const ms of [16.67,16.67,16.67,50])m.record(ms);
    const result=m.snapshot();
    expect(result.samples).toBe(3);
    expect(result.slowPercent).toBe(33);
    expect(result.fps).toBe(36);
  });
  it("ignores background pauses and invalid frame timings",()=>{
    const m=new FrameMonitor();
    for(const value of [0,-4,Infinity,NaN,1000])m.record(value);
    expect(m.snapshot()).toEqual({fps:0,slowPercent:0,samples:0});
    m.record(16.67);
    expect(m.snapshot().fps).toBe(60);
    m.reset();
    expect(m.snapshot().samples).toBe(0);
  });
});
