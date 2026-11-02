import {describe,it,expect} from "vitest";
import {waveRadius,waveMayBreak,waveRingAlpha,soulFormationPosition,
  WAVE_MAX_REACH,WAVE_SWEEP_SECONDS} from "./spectralWave";

describe("visible expanding Spectral Wave",()=>{
  it("starts at Phantom and visibly sweeps the full corridor",()=>{
    expect(waveRadius(0)).toBe(24);
    expect(waveRadius(.3)).toBeGreaterThan(160);
    expect(waveRadius(.75)).toBeGreaterThan(290);
    expect(waveRadius(WAVE_SWEEP_SECONDS)).toBe(WAVE_MAX_REACH);
    expect(waveRadius(WAVE_SWEEP_SECONDS+10)).toBe(WAVE_MAX_REACH);
  });
  it("breaks physical obstacles as the ring reaches them, not all on activation",()=>{
    expect(waveMayBreak("wall",240,0,false)).toBe(false);
    expect(waveMayBreak("wall",240,.6,false)).toBe(true);
    expect(waveMayBreak("spikes",250,.8,false)).toBe(true);
    expect(waveMayBreak("bat",200,1,false)).toBe(true);
    expect(waveMayBreak("wall",240,.6,true)).toBe(false);
    expect(waveMayBreak("ward",100,1,false)).toBe(false);
    expect(waveMayBreak("wraith",100,1,false)).toBe(false);
    expect(waveMayBreak("gap",100,1,false)).toBe(false);
    expect(waveMayBreak("orb",100,1,false)).toBe(false);
  });
  it("fades completely after effect ends",()=>{
    expect(waveRingAlpha(1,0)).toBe(0);
    expect(waveRingAlpha(.2,2)).toBeGreaterThan(0);
    expect(waveRingAlpha(.5,.1)).toBeLessThan(waveRingAlpha(.5,1));
  });
});
describe("soul convoy layout",()=>{
  it("spaces all five followers with two rows instead of hiding behind hunter",()=>{
    const pts=Array.from({length:5},(_,i)=>soulFormationPosition(i,98,196,0));
    expect(pts.map(p=>p.x)).toEqual([84,71,58,79,66]);
    expect(new Set(pts.map(p=>p.x+","+Math.round(p.y))).size).toBe(5);
    expect(pts.every(p=>p.x>50&&p.x<100)).toBe(true);
  });
});
