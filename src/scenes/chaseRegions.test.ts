import {describe,it,expect} from "vitest";
import {CHASE_REGIONS,chaseRegionIndex,chaseRegionName,chaseRegionBlend} from "./chaseRegions";
describe("chase regions: visual-only progress thresholds",()=>{
  it("starts in cemetery and follows two distinct visual regions",()=>{
    expect(chaseRegionIndex(8000)).toBe(0);
    expect(chaseRegionIndex(9599)).toBe(0);
    expect(chaseRegionIndex(9600)).toBe(1);
    expect(chaseRegionIndex(11299)).toBe(1);
    expect(chaseRegionIndex(11300)).toBe(2);
    expect(chaseRegionIndex(13000)).toBe(2);
  });
  it("uses stable authored region colors and names",()=>{
    expect(CHASE_REGIONS.map(x=>x.id)).toEqual(["cemetery","grove","ruins"]);
    expect(CHASE_REGIONS.every(x=>x.name.length>8)).toBe(true);
    expect(new Set(CHASE_REGIONS.map(x=>x.sky)).size).toBe(3);
    expect(chaseRegionName(1)).toBe("BOSQUE DAS ALMAS");
  });
  it("smoothes region lighting rather than abruptly replacing it",()=>{
    expect(chaseRegionBlend(0,1,.1)).toBeCloseTo(.18);
    expect(chaseRegionBlend(0,1,2)).toBe(1);
    expect(chaseRegionBlend(.5,1,0)).toBe(.5);
    expect(chaseRegionBlend(.6,1,Number.NaN)).toBe(.6);
  });
  it("invalid distance does not switch to a harder/future region",()=>{
    expect(chaseRegionIndex(Number.NaN)).toBe(0);
    expect(chaseRegionIndex(-10)).toBe(0);
  });
});
