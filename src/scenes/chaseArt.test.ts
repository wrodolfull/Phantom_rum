import {describe,it,expect} from "vitest";
import * as THREE from "three";
import {CHASE_REGIONS} from "./chaseRegions";
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
  it("builds all three roadside styles without creating new meshes during movement",()=>{
    const scene=new THREE.Scene();
    const env=createChaseEnvironment(THREE,scene);
    expect(env.scenery.length).toBe(26);
    for(const prop of env.scenery){
      expect(prop.styles).toHaveLength(3);
      expect(prop.styles?.map(g=>g.visible)).toEqual([true,false,false]);
    }
    const children=scene.children.length;
    const first=env.scenery[0];
    const oldMesh=first.mesh;
    first.mesh.position.z=12;
    const region=updateChaseEnvironment(env,.02,24,9600);
    expect(region).toBe(1);
    expect(first.mesh).toBe(oldMesh);
    expect(first.styles?.map(g=>g.visible)).toEqual([false,true,false]);
    expect(scene.children.length).toBe(children);
  });
  it("shifts lights and paving toward each region palette with smooth tinting",()=>{
    const scene=new THREE.Scene();
    const env=createChaseEnvironment(THREE,scene);
    expect(env.region).toBe(0);
    const before=env.sky.getHex();
    updateChaseEnvironment(env,.12,24,9600);
    expect(env.sky.getHex()).not.toBe(before);
    expect(env.sky.getHex()).not.toBe(CHASE_REGIONS[1].sky);
    updateChaseEnvironment(env,1,24,11300);
    expect(env.region).toBe(2);
    expect(env.sky.getHex()).toBe(CHASE_REGIONS[2].sky);
    expect(env.fogColor.getHex()).toBe(CHASE_REGIONS[2].fog);
    expect(env.moonLight.color.getHex()).toBe(CHASE_REGIONS[2].moonlight);
    expect(env.tileMaterials).toHaveLength(4);
  });
  it("keeps unseen regional props hidden until a recycled roadside slot returns",()=>{
    const scene=new THREE.Scene();
    const env=createChaseEnvironment(THREE,scene);
    const first=env.scenery[0];
    const initial=first.mesh.position.z;
    updateChaseEnvironment(env,.016,24,11300);
    expect(first.mesh.position.z).toBeGreaterThan(initial);
    expect(first.styles?.map(g=>g.visible)).toEqual([true,false,false]);
    first.mesh.position.z=12;
    updateChaseEnvironment(env,.03,24,11300);
    expect(first.styles?.map(g=>g.visible)).toEqual([false,false,true]);
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
