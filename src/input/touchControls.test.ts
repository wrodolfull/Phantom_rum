import {describe,it,expect,vi} from "vitest";
import {GestureInput,HOLD_MS} from "./touchControls";
describe("tap / hold controls",()=>{
  it("a quick tap jumps once, anywhere on the canvas",()=>{
    const jump=vi.fn(),phase=vi.fn(), g=new GestureInput({jump,phase});
    g.press(1,210,130,1000);
    g.update(1070);
    g.release(1,1090);
    expect(jump).toHaveBeenCalledTimes(1);
    expect(phase).not.toHaveBeenCalled();
  });
  it("a hold phases without jumping; releasing immediately returns physical",()=>{
    const jump=vi.fn(),phase=vi.fn(),g=new GestureInput({jump,phase});
    g.press(1,210,130,1000);
    g.update(1000+HOLD_MS);
    expect(phase).toHaveBeenCalledWith(true);
    g.release(1,1000+HOLD_MS+200);
    expect(phase).toHaveBeenLastCalledWith(false);
    expect(jump).not.toHaveBeenCalled();
  });
  it("a second finger may tap to jump while the first holds phase",()=>{
    const jump=vi.fn(),phase=vi.fn(),g=new GestureInput({jump,phase});
    g.press(1,80,130,1000);
    g.update(1200);
    g.press(2,300,150,1201);
    g.release(2,1240);
    expect(jump).toHaveBeenCalledTimes(1);
    expect(g.phasing).toBe(true);
    g.release(1,1300);
    expect(phase.mock.calls).toEqual([[true],[false]]);
  });
  it("multiple held fingers do not flicker phase when released separately",()=>{
    const phase=vi.fn(),g=new GestureInput({jump:vi.fn(),phase});
    g.press(1,10,10,0);g.press(2,20,10,20);
    g.update(170);
    g.release(1,200);
    expect(g.phasing).toBe(true);
    g.release(2,240);
    expect(phase.mock.calls).toEqual([[true],[false]]);
  });
  it("moving/scrolling or cancellation should never accidentally jump",()=>{
    const jump=vi.fn(),phase=vi.fn(),g=new GestureInput({jump,phase});
    g.press(1,10,10,0);g.move(1,50,10);g.release(1,40);
    g.press(2,10,10,100);g.cancel(2);
    g.press(3,10,10,200);g.update(500);g.clear();
    expect(jump).not.toHaveBeenCalled();
    expect(phase.mock.calls).toEqual([[true],[false]]);
  });
  it("slow-frame release after hold threshold must not become a tap",()=>{
    const jump=vi.fn(),phase=vi.fn(),g=new GestureInput({jump,phase});
    g.press(1,10,10,0);g.release(1,HOLD_MS+60);
    expect(jump).not.toHaveBeenCalled();
    expect(phase).not.toHaveBeenCalled();
  });
});
