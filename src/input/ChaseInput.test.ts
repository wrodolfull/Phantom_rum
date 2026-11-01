import {describe,it,expect,vi} from "vitest";
import {ChaseInput} from "./ChaseInput";
describe("chase gestures",()=>{
  it("swipe changes lane once without jumping",()=>{
    const jump=vi.fn(),lane=vi.fn(),phase=vi.fn(),input=new ChaseInput({jump,lane,phase});
    input.press(1,100,100,1000);
    input.move(1,151,103);input.move(1,195,103);input.release(1,1080);
    expect(lane.mock.calls).toEqual([[1]]);
    expect(jump).not.toHaveBeenCalled();
    expect(phase).not.toHaveBeenCalled();
  });
  it("left swipe and quick tap remain distinct",()=>{
    const jump=vi.fn(),lane=vi.fn(),phase=vi.fn(),input=new ChaseInput({jump,lane,phase});
    input.press(1,200,100,0);input.move(1,150,102);input.release(1,80);
    input.press(2,150,100,100);input.release(2,185);
    expect(lane.mock.calls).toEqual([[-1]]);
    expect(jump).toHaveBeenCalledTimes(1);
  });
  it("one finger can hold phase while another finger changes lane",()=>{
    const jump=vi.fn(),lane=vi.fn(),phase=vi.fn(),input=new ChaseInput({jump,lane,phase});
    input.press(1,100,100,0);input.update(160);
    input.press(2,220,110,180);input.move(2,270,110);input.release(2,230);
    expect(input.phasing).toBe(true);
    input.release(1,250);
    expect(phase.mock.calls).toEqual([[true],[false]]);
    expect(lane.mock.calls).toEqual([[1]]);
    expect(jump).not.toHaveBeenCalled();
  });
  it("cancelling all pointers releases phase",()=>{
    const phase=vi.fn(),input=new ChaseInput({jump:vi.fn(),lane:vi.fn(),phase});
    input.press(1,1,1,0);input.update(150);input.clear();
    expect(input.phasing).toBe(false);
    expect(phase.mock.calls).toEqual([[true],[false]]);
  });
});
