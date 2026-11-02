import {describe,it,expect} from "vitest";
import * as THREE from "three";
import {ChaseEffects,CHASE_FX_CAPACITY,animateChaseHazard,
  chaseCameraOffset} from "./chaseFx";
import {createChaseHazard} from "./chaseArt";
describe("pooled lightweight 3D VFX",()=>{
  it("uses one Points mesh and stays within a fixed particle budget",()=>{
    const world=new THREE.Scene();
    const fx=new ChaseEffects(THREE,world);
    expect(world.children).toHaveLength(1);
    expect(fx.emit("collect",0,1,0,500)).toBe(CHASE_FX_CAPACITY);
    for(let i=0;i<120;i++)fx.emit("phase",i*.02,.8,2,7);
    expect(fx.activeCount).toBeLessThanOrEqual(CHASE_FX_CAPACITY);
    expect(world.children).toHaveLength(1);
    fx.update(.02);
    fx.destroy();
    expect(world.children).toHaveLength(0);
    expect(fx.emit("jump",0,0,0)).toBe(0);
    fx.destroy();
  });
  it("trail emits fewer points when physical and none during pause",()=>{
    const world=new THREE.Scene(),fx=new ChaseEffects(THREE,world);
    fx.trail(0,0,0,false,.04);
    expect(fx.activeCount).toBe(0);
    fx.trail(0,0,0,false,.06);
    expect(fx.activeCount).toBe(1);
    fx.update(1);
    expect(fx.activeCount).toBe(0);
    fx.trail(0,0,0,true,.05);
    expect(fx.activeCount).toBe(3);
    fx.trail(0,0,0,true,0);
    expect(fx.activeCount).toBe(3);
    fx.destroy();
  });
  it("animates wards and collectibles without moving their gameplay origin",()=>{
    for(const kind of ["ward","orb","essence"] as const){
      const obj=createChaseHazard(THREE,kind);
      obj.position.set(2.4,0,-40);
      const before=obj.position.clone();
      animateChaseHazard(obj,kind,2,.016);
      expect(obj.position.equals(before)).toBe(true);
      expect(obj.children.length).toBeGreaterThan(2);
    }
  });
  it("camera shake is bounded and returns to near-still when hit ends",()=>{
    const hit=chaseCameraOffset(1,2,2,false);
    expect(Math.abs(hit.x)).toBeLessThan(.32);
    expect(Math.abs(hit.y)).toBeLessThan(.12);
    expect(Math.abs(hit.roll)).toBeLessThanOrEqual(.025);
    const normal=chaseCameraOffset(1,0,0,false);
    expect(Math.abs(normal.x)).toBe(0);
    expect(Math.abs(normal.y)).toBeLessThan(.03);
  });
});
