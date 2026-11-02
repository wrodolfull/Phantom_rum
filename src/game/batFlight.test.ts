import {describe,it,expect} from "vitest";
import {
 BAT_TRIGGER_PX,BAT_CAPTURE_OFFSET_PX,BAT_CAPTURE_TOLERANCE_PX,
 BAT_MISS_OFFSET_PX,BAT_MAX_ESSENCE,BAT_FLIGHT_SECONDS,
 FLIGHT_PICKUPS,shouldSpawnBat,batRelativeX,batCanCapture,batAttempt,
 batTargetRadius,batHasLeft,nextBatDistance,flightPickupX,
 flightPickupCrossed,flightEarnedDistance,flightEssence,flightComplete
} from "./batFlight";
describe("special bat opportunity",()=>{
 const gate={distancePx:BAT_TRIGGER_PX,platformDone:true,batDone:false,
   grounded:true,physical:true,nearestHazardPx:270};
 it("spawns only when platform is done and no hazard is close",()=>{
   expect(shouldSpawnBat(gate)).toBe(true);
   for(const key of ["platformDone","grounded","physical"] as const)
     expect(shouldSpawnBat({...gate,[key]:false})).toBe(false);
   expect(shouldSpawnBat({...gate,batDone:true})).toBe(false);
   expect(shouldSpawnBat({...gate,nearestHazardPx:110})).toBe(false);
   expect(shouldSpawnBat({...gate,distancePx:16999})).toBe(false);
 });
 it("ring counts down into a precise capture zone without false positives",()=>{
   expect(batTargetRadius(400)).toBeGreaterThan(batTargetRadius(120));
   expect(batTargetRadius(BAT_CAPTURE_OFFSET_PX)).toBe(9);
   expect(batCanCapture(BAT_CAPTURE_OFFSET_PX)).toBe(true);
   expect(batCanCapture(BAT_CAPTURE_OFFSET_PX+BAT_CAPTURE_TOLERANCE_PX)).toBe(true);
   expect(batCanCapture(BAT_CAPTURE_OFFSET_PX-BAT_CAPTURE_TOLERANCE_PX-1)).toBe(false);
   expect(batAttempt(90,false)).toBe("early");
   expect(batAttempt(BAT_CAPTURE_OFFSET_PX,false)).toBe("success");
   expect(batAttempt(BAT_CAPTURE_OFFSET_PX,true)).toBe("missed");
   expect(batHasLeft(BAT_MISS_OFFSET_PX-1)).toBe(true);
   expect(batRelativeX(1000,1150,98)).toBe(52);
   expect(nextBatDistance(25000)).toBeGreaterThan(25000);
 });
});
describe("bat flight reward and pickups",()=>{
 it("offers 14 coins but caps rewards at 10 Essence and 135m",()=>{
   expect(FLIGHT_PICKUPS).toHaveLength(14);
   expect(flightEssence(14)).toBe(BAT_MAX_ESSENCE);
   expect(flightEssence(10_000)).toBe(BAT_MAX_ESSENCE);
   expect(flightEarnedDistance(100)).toBe(1350);
   expect(flightEarnedDistance(BAT_FLIGHT_SECONDS/2)).toBe(675);
   expect(flightEarnedDistance(0)).toBe(0);
 });
 it("checks coin collection once as swept overlap in correct lane",()=>{
   const pickup=FLIGHT_PICKUPS[0];
   const seconds=(pickup.startX-98)/195;
   expect(flightPickupCrossed(pickup,seconds-.05,seconds+.05,pickup.lane)).toBe(true);
   expect(flightPickupCrossed(pickup,seconds-.05,seconds+.05,((pickup.lane+1)%3) as 0|1|2))
     .toBe(false);
   expect(flightPickupCrossed(pickup,seconds+.05,seconds+.2,pickup.lane)).toBe(false);
   expect(flightPickupX(pickup,0)).toBe(pickup.startX);
 });
 it("requires real-world time to complete, not just game frames",()=>{
   expect(flightComplete(10,.5)).toBe(false);
   expect(flightComplete(9.9,10)).toBe(false);
   expect(flightComplete(10,10)).toBe(true);
 });
});
