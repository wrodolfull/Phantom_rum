import {describe,it,expect,vi} from "vitest";
import {PlatformInput} from "./platformInput";
describe("platformer touch controls",()=>{
  it("drags on the left continuously without jumping",()=>{
    const move=vi.fn(),jump=vi.fn(),phase=vi.fn();
    const input=new PlatformInput({move,jump,phase});
    input.press(1,80,160,0);
    input.move(1,112,160);
    expect(input.axis).toBe(1);
    input.move(1,60,160);
    expect(input.axis).toBe(-1);
    input.release(1,200);
    expect(input.axis).toBe(0);
    expect(jump).not.toHaveBeenCalled();
    expect(phase).not.toHaveBeenCalled();
    expect(move.mock.calls).toEqual([[1],[-1],[0]]);
  });
  it("right side tap jumps and long hold phases, even while moving",()=>{
    const move=vi.fn(),jump=vi.fn(),phase=vi.fn();
    const input=new PlatformInput({move,jump,phase});
    input.press(1,70,200,0);
    input.move(1,112,200);
    input.press(2,350,175,80);input.release(2,155);
    expect(jump).toHaveBeenCalledTimes(1);
    input.press(3,352,168,200);
    input.update(355);
    expect(input.axis).toBe(1);
    expect(input.phasing).toBe(true);
    expect(phase.mock.calls).toEqual([[true]]);
    input.release(3,420);
    expect(input.phasing).toBe(false);
    expect(phase.mock.calls).toEqual([[true],[false]]);
    input.release(1,450);
    expect(input.axis).toBe(0);
  });
  it("finger cancellation and blur cannot leave movement stuck",()=>{
    const move=vi.fn(),phase=vi.fn();
    const input=new PlatformInput({move,jump:vi.fn(),phase});
    input.press(1,100,180,0);input.move(1,50,180);
    input.press(2,370,180,50);input.update(200);
    input.clear();
    expect(input.axis).toBe(0);
    expect(input.phasing).toBe(false);
    expect(move.mock.calls.at(-1)).toEqual([0]);
    expect(phase.mock.calls.at(-1)).toEqual([false]);
  });
  it("a stationary left thumb does not generate an accidental jump",()=>{
    const jump=vi.fn(),move=vi.fn(),phase=vi.fn();
    const input=new PlatformInput({jump,move,phase});
    input.press(1,130,180,0);
    input.update(300);
    input.release(1,330);
    expect(jump).not.toHaveBeenCalled();
    expect(phase).not.toHaveBeenCalled();
  });
});
