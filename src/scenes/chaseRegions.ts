/**
 * Cosmetic 3D location shifts within the 800–1300m chase.
 * No change to collision, physics, spawning, currencies or progression.
 */
export const CHASE_REGIONS=[
  {
    id:"cemetery",name:"CEMITÉRIO ESQUECIDO",fromMeters:800,
    sky:0x191933,fog:0x423d70,stone:0x5b607d,accent:0xa9c7ff,
    vegetation:0x385b60,moonlight:0xd7d1ff
  },
  {
    id:"grove",name:"BOSQUE DAS ALMAS",fromMeters:960,
    sky:0x132a35,fog:0x37636d,stone:0x4c6971,accent:0x7ee7d1,
    vegetation:0x386e66,moonlight:0xb8f5e3
  },
  {
    id:"ruins",name:"RUÍNAS LUNARES",fromMeters:1130,
    sky:0x2b203c,fog:0x6a4d7f,stone:0x766584,accent:0xf5c59a,
    vegetation:0x5c4c70,moonlight:0xf6d9ca
  }
] as const;
export type RegionIndex=0|1|2;
export function chaseRegionIndex(distancePx:number):RegionIndex{
  const meters=Number.isFinite(distancePx)?Math.max(0,distancePx)/10:0;
  if(meters>=CHASE_REGIONS[2].fromMeters)return 2;
  if(meters>=CHASE_REGIONS[1].fromMeters)return 1;
  return 0;
}
export function chaseRegionName(index:RegionIndex):string{
  return CHASE_REGIONS[index].name;
}
/** Each region uses existing geometry; changes are cosmetic only. */
export function chaseRegionBlend(current:number,target:number,seconds:number):number{
  const dt=Number.isFinite(seconds)?Math.max(0,seconds):0;
  return current+(target-current)*Math.min(1,dt*1.8);
}
