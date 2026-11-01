import {describe,it,expect} from "vitest";
import {tutorialHint} from "./tutorial";

describe("non-blocking onboarding",()=>{
  it("shows every tutorial step in the order obstacles appear",()=>{
    const positions=[98,245,476,590,790,945];
    const steps=positions.map(x=>tutorialHint(x,true).step);
    expect(steps).toEqual(["welcome","phase","release","orb","jump","done"]);
  });
  it("does not show tutorial after it has been completed",()=>{
    expect(tutorialHint(98,false)).toEqual({step:"done",text:"",completed:true});
  });
  it("never completes before the gap is crossed",()=>{
    expect(tutorialHint(900,true).completed).toBe(false);
    expect(tutorialHint(940,true).completed).toBe(true);
  });
});
