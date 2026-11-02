import {describe,it,expect} from "vitest";
import {
  initialHunterState,hunterHit,tickHunter,rescueSoul,activateSpectralWave,
  canActivateSpectralWave,hunterScreenX,waveBreaksObstacle,
  MAX_SOUL_COMPANIONS,SOUL_WAVE_COST,SOUL_WAVE_SECONDS,
  soulPickupReached,safeSoulLocation
} from "./hunterHorde";

describe("2D hunter: accumulated pressure instead of one-hit kill",()=>{
  it("needs multiple unprotected mistakes before capture",()=>{
    let state=initialHunterState();
    for(let i=0;i<3;i++){
      const hit=hunterHit(state,"obstacle");
      expect(hit.hit).toBe(true);expect(hit.caught).toBe(false);
      state={...hit.state,invulnerable:0};
    }
    const final=hunterHit(state,"obstacle");
    expect(final.caught).toBe(true);
    expect(final.state.danger).toBe(100);
  });
  it("cooldown prevents one obstacle from multiplying hits every frame",()=>{
    const first=hunterHit(initialHunterState(),"obstacle");
    const repeated=hunterHit(first.state,"obstacle");
    expect(repeated.hit).toBe(false);
    expect(repeated.state.danger).toBe(first.state.danger);
    const later=hunterHit(tickHunter(first.state,1.4),"obstacle");
    expect(later.hit).toBe(false); // frame delta is intentionally capped
    let settled=first.state;
    for(let i=0;i<90;i++)settled=tickHunter(settled,1/60);
    expect(hunterHit(settled,"obstacle").hit).toBe(true);
  });
  it("a fall is survivable and gives the player temporary protection",()=>{
    const hit=hunterHit(initialHunterState(),"pit");
    expect(hit.state.danger).toBe(52);
    expect(hit.caught).toBe(false);
    expect(hit.state.invulnerable).toBeGreaterThan(1);
  });
  it("danger cools down slowly only after a long clean stretch",()=>{
    let state=initialHunterState(67);
    for(let i=0;i<180;i++)state=tickHunter(state,1/60);
    expect(state.danger).toBeCloseTo(67,2);
    for(let i=0;i<200;i++)state=tickHunter(state,1/60);
    expect(state.danger).toBeLessThan(67);
    expect(state.danger).toBeGreaterThan(61);
  });
  it("hunter advances toward Phantom as danger reaches 100",()=>{
    expect(hunterScreenX(0)).toBeLessThan(hunterScreenX(70));
    expect(hunterScreenX(100)).toBeLessThan(98);
  });
});

describe("lost-soul convoy inspired by group-building runners",()=>{
  it("recruits at most five allies and each can absorb a hit",()=>{
    let state=initialHunterState(60);
    for(let i=0;i<20;i++)state=rescueSoul(state);
    expect(state.companions).toBe(MAX_SOUL_COMPANIONS);
    const hit=hunterHit(state,"obstacle");
    expect(hit.hit).toBe(true);
    expect(hit.protectedBySoul).toBe(true);
    expect(hit.amount).toBe(12);
    expect(hit.state.companions).toBe(MAX_SOUL_COMPANIONS-1);
    expect(hit.state.danger).toBeLessThan(72);
  });
  it("three souls may be spent on a short wave, not reused for free",()=>{
    let state=initialHunterState(58);
    for(let i=0;i<SOUL_WAVE_COST;i++)state=rescueSoul(state);
    expect(canActivateSpectralWave(state)).toBe(true);
    state=activateSpectralWave(state);
    expect(state.companions).toBe(0);
    expect(state.waveSeconds).toBe(SOUL_WAVE_SECONDS);
    expect(state.danger).toBeLessThan(45);
    expect(canActivateSpectralWave(state)).toBe(false);
    expect(activateSpectralWave(state)).toEqual(state);
    expect(waveBreaksObstacle("wall")).toBe(true);
    expect(waveBreaksObstacle("spikes")).toBe(true);
    expect(waveBreaksObstacle("gap")).toBe(false);
    expect(waveBreaksObstacle("ward")).toBe(false);
  });
  it("only recruits souls the player actually crosses while physical and grounded",()=>{
    expect(soulPickupReached(90,120,100,true,true)).toBe(true);
    expect(soulPickupReached(90,120,100,false,true)).toBe(false);
    expect(soulPickupReached(90,120,100,true,false)).toBe(false);
    expect(soulPickupReached(200,220,100,true,true)).toBe(false);
  });
  it("places collectible souls outside existing hazard positions",()=>{
    const hazards=[
      {kind:"wall",x:700,width:30},
      {kind:"gap",x:850,width:44},
      {kind:"essence",x:950,width:16}
    ];
    const loc=safeSoulLocation(730,hazards);
    expect(loc).toBeGreaterThan(1000);
    expect(safeSoulLocation(400,hazards)).toBe(400);
  });
});
