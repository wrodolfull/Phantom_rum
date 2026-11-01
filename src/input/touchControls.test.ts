import {describe,it,expect} from "vitest";
import {PointerHold} from "./touchControls";
describe("multi-touch state",()=>{
  it("tracks held phase without being cancelled by another finger",()=>{
    const state=new PointerHold();
    expect(state.press(1)).toBe(true);
    expect(state.press(2)).toBe(false);
    expect(state.count).toBe(2);
    expect(state.release(1)).toBe(false);
    expect(state.pressed).toBe(true);
    expect(state.release(2)).toBe(true);
    expect(state.pressed).toBe(false);
  });
  it("clears pointers on blur and ignores stale releases",()=>{
    const state=new PointerHold();
    state.press(8);
    expect(state.clear()).toBe(true);
    expect(state.clear()).toBe(false);
    expect(state.release(8)).toBe(false);
    expect(state.count).toBe(0);
  });
  it("deduplicates repeated pointerdown events",()=>{
    const state=new PointerHold();
    state.press(3);
    expect(state.press(3)).toBe(false);
    expect(state.count).toBe(1);
    expect(state.release(3)).toBe(true);
  });
});
