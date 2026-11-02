import {describe,it,expect} from "vitest";
import * as THREE from "three";
import {SPOOKY,createChaseEnvironment,createChaseGhost,
  createChaseHunter,createChaseHazard,updateChaseEnvironment} from "./chaseArt";

describe("Spooky Arcade low-poly art kit",()=>{
  it("builds a complete, bounded night scene without WebGL or textures",()=>{
    const scene=new THREE.Scene();
    const env=createChaseEnvironment(THREE,scene);
    expect(scene.fog).toBeInstanceOf(THREE.FogExp2);
    expect(scene.background).toBeInstanceOf(THREE.Color);
    expect(env.scenery.length).toBe(26);
    expect(env.paving.length).toBe(57);
    expect(env.laneMarks.length).toBe(56);
    expect(scene.children.length).toBeLessThan(180);
    expect(env.moon.children.length).toBeGreaterThanOrEqual(2);
  });
  it("paving and foreground scenery recycle as the player advances",()=>{
    const scene=new THREE.Scene();
    const env=createChaseEnvironment(THREE,scene);
    const paving=env.paving[0];
    const start=paving.mesh.position.z;
    updateChaseEnvironment(env,.02);
    expect(paving.mesh.position.z).toBeCloseTo(start+.48,3);
    paving.mesh.position.z=12;
    updateChaseEnvironment(env,.02);
    expect(paving.mesh.position.z).toBeLessThan(0);
  });
  it("keeps every player cosmetic option in the 3D ghost",()=>{
    for(const hero of ["phantom","spectra","wisp","boozer","luna"] as const){
      for(const accessory of ["none","ribbon","hat","crown"] as const){
        const look=createChaseGhost(THREE,hero,accessory);
        expect(look.model.children.length).toBeGreaterThanOrEqual(11);
        expect(look.bodyMaterial.transparent).toBe(true);
        expect(look.color).toBeGreaterThan(0);
        const bounds=new THREE.Box3().setFromObject(look.model);
        expect(bounds.max.y).toBeGreaterThan(1.6);
        expect(bounds.min.y).toBeGreaterThanOrEqual(.1);
      }
    }
  });
  it("hunter silhouette and all hazard silhouettes are present and distinct",()=>{
    const hunter=createChaseHunter(THREE);
    expect(hunter.children.length).toBeGreaterThan(7);
    const widths:number[]=[];
    const heights:number[]=[];
    for(const kind of ["stone","arch","ward","essence","orb"] as const){
      const object=createChaseHazard(THREE,kind);
      const box=new THREE.Box3().setFromObject(object);
      widths.push(box.max.x-box.min.x);
      heights.push(box.max.y-box.min.y);
      expect(object.children.length).toBeGreaterThan(1);
      expect(box.max.y).toBeGreaterThan(.7);
    }
    expect(heights[1]).toBeGreaterThan(heights[0]);
    expect(heights[2]).toBeGreaterThan(heights[0]);
    expect(widths[1]).toBeGreaterThan(widths[0]);
  });
  it("uses contrasting palettes for collectibles versus physical threats",()=>{
    expect(SPOOKY.essence).not.toBe(SPOOKY.stone);
    expect(SPOOKY.glow).not.toBe(SPOOKY.rune);
    expect(SPOOKY.night).not.toBe(SPOOKY.road);
  });
});
