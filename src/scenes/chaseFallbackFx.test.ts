import {describe,it,expect} from "vitest";
import {ChaseFallbackSparks,COMPAT_SPARK_CAPACITY} from "./chaseFallbackFx";
describe("bounded 2.5D visual feedback",()=>{
  it("reuses a fixed spark pool even during hundreds of collisions",()=>{
    const sparks=new ChaseFallbackSparks();
    for(let i=0;i<100;i++)sparks.emit("hit",240,170,12);
    expect(sparks.activeCount).toBeLessThanOrEqual(COMPAT_SPARK_CAPACITY);
    let circles=0;
    sparks.draw({fillStyle:()=>{},fillCircle:()=>{circles++;}});
    expect(circles).toBe(sparks.activeCount);
    for(let i=0;i<20;i++)sparks.update(.05);
    expect(sparks.activeCount).toBe(0);
  });
  it("draws no trail while paused and updates visible dots without constructing meshes",()=>{
    const sparks=new ChaseFallbackSparks();
    sparks.trail(200,170,true,0);
    expect(sparks.activeCount).toBe(0);
    sparks.trail(200,170,true,.05);
    expect(sparks.activeCount).toBe(3);
    sparks.emit("orb",200,150,3);
    expect(sparks.activeCount).toBe(6);
  });
});
