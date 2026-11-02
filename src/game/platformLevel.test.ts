import {describe,it,expect} from "vitest";
import {shouldStartPlatform,PLATFORM_START_PX,PLATFORM_SURFACES,
  PLATFORM_BARRIERS,PLATFORM_PICKUPS,PLATFORM_CHECKPOINTS,
  PLATFORM_JUMP,PLATFORM_WORLD_WIDTH,PLATFORM_EXIT_X,
  initialPlatformState,stepPlatform,platformPickupReached,
  platformCheckpointFor,platformCanExit,type PlatformState
} from "./platformLevel";
describe("platform chapter trigger",()=>{
  const base={distancePx:PLATFORM_START_PX,chaseDone:true,platformDone:false,
    grounded:true,physical:true,nearestHazardPx:180};
  it("enters once, only after chase on safe ground at 1450m",()=>{
    expect(shouldStartPlatform(base)).toBe(true);
    expect(shouldStartPlatform({...base,distancePx:14499})).toBe(false);
    expect(shouldStartPlatform({...base,chaseDone:false})).toBe(false);
    expect(shouldStartPlatform({...base,platformDone:true})).toBe(false);
    expect(shouldStartPlatform({...base,grounded:false})).toBe(false);
    expect(shouldStartPlatform({...base,physical:false})).toBe(false);
    expect(shouldStartPlatform({...base,nearestHazardPx:100})).toBe(false);
  });
});
describe("platform physics",()=>{
  it("supports walking, a finite jump, gravity and landing",()=>{
    let state=initialPlatformState(73);
    for(let i=0;i<25;i++)state=stepPlatform(state,{axis:1,jump:false,phase:false},1/60).state;
    expect(state.x).toBeGreaterThan(140);
    expect(state.feetY).toBe(236);
    const launch=stepPlatform(state,{axis:1,jump:true,phase:false},1/60);
    expect(launch.jumped).toBe(true);
    expect(launch.state.vy).toBeGreaterThan(PLATFORM_JUMP);
    state=launch.state;
    let minY=state.feetY;
    for(let i=0;i<70;i++){
      state=stepPlatform(state,{axis:0,jump:false,phase:false},1/60).state;
      minY=Math.min(minY,state.feetY);
    }
    expect(minY).toBeLessThan(186);
    expect(state.feetY).toBe(236);
    expect(state.grounded).toBe(true);
  });
  it("stairs are within jump height; no impossible height step",()=>{
    for(let i=1;i<PLATFORM_SURFACES.length;i++){
      const a=PLATFORM_SURFACES[i-1],b=PLATFORM_SURFACES[i];
      expect(a.y-b.y).toBeLessThan(57);
      expect(b.x).toBeLessThan(a.x+a.width+32);
    }
    expect(PLATFORM_EXIT_X).toBeLessThan(PLATFORM_WORLD_WIDTH);
  });
  it("both phases land on platforms; physical gate requires phase",()=>{
    let state:PlatformState={...initialPlatformState(),x:901,feetY:194,grounded:true};
    const block=stepPlatform(state,{axis:1,jump:false,phase:false},1/60);
    expect(block.barrier).toBe("stone");
    expect(block.state.x).toBeLessThanOrEqual(903);
    state={...state,phased:true};
    const pass=stepPlatform(state,{axis:1,jump:false,phase:true},1/60);
    expect(pass.barrier).toBe(null);
    expect(pass.state.x).toBeGreaterThan(state.x);
    expect(pass.state.feetY).toBe(194);
  });
  it("spectral ward blocks only intangible state",()=>{
    const state:PlatformState={...initialPlatformState(),x:605,feetY:123};
    const normal=stepPlatform(state,{axis:1,jump:false,phase:false},1/60);
    expect(normal.barrier).toBe(null);
    const phase=stepPlatform({...state,phased:true},{axis:1,jump:false,phase:true},1/60);
    expect(phase.barrier).toBe("ward");
  });
  it("energy drains and recovers, phase-lock requires release",()=>{
    let s={...initialPlatformState(13)};
    s=stepPlatform(s,{axis:0,jump:false,phase:true},1/60).state;
    expect(s.phased).toBe(true);
    for(let i=0;i<35;i++)s=stepPlatform(s,{axis:0,jump:false,phase:true},1/60).state;
    expect(s.phased).toBe(false);
    expect(s.phaseLocked).toBe(true);
    const still=stepPlatform(s,{axis:0,jump:false,phase:true},1/60);
    expect(still.state.phased).toBe(false);
    s=stepPlatform(s,{axis:0,jump:false,phase:false},1/60).state;
    expect(s.phaseLocked).toBe(false);
  });
  it("collectibles cannot be collected while intangible and only respond to proximity",()=>{
    const item=PLATFORM_PICKUPS.find(x=>x.kind==="essence")!;
    const state={...initialPlatformState(),x:item.x,feetY:item.y+15};
    expect(platformPickupReached(state,item)).toBe(true);
    expect(platformPickupReached({...state,phased:true},item)).toBe(false);
    expect(platformPickupReached({...state,x:0},item)).toBe(false);
    const orb=PLATFORM_PICKUPS.find(x=>x.kind==="orb")!;
    expect(platformPickupReached({...state,x:orb.x,feetY:orb.y+15,phased:true},orb)).toBe(true);
  });
  it("checkpoints require standing at their own safe height",()=>{
    const first=PLATFORM_CHECKPOINTS[0];
    const airborne={...initialPlatformState(),x:560,feetY:123,grounded:false};
    expect(platformCheckpointFor(airborne,first)).toBe(first);
    const landed={...airborne,grounded:true};
    expect(platformCheckpointFor(landed,first)).toEqual(PLATFORM_CHECKPOINTS[1]);
  });
  it("requires reaching the door on solid ground",()=>{
    expect(platformCanExit({...initialPlatformState(),x:PLATFORM_EXIT_X})).toBe(true);
    expect(platformCanExit({...initialPlatformState(),x:PLATFORM_EXIT_X,grounded:false})).toBe(false);
    expect(platformCanExit({...initialPlatformState(),x:PLATFORM_EXIT_X-1})).toBe(false);
  });
});
