import {describe,it,expect} from "vitest";
import {emptyProgress,normalizeProgress,finishRun} from "../progression/progress";
import {HEROES,ACCESSORIES} from "./catalog";
import {purchase,equip,balance,activeAppearance} from "./economy";
const gain={meters:90,essence:12,jumps:2,phases:1,walls:1,orbs:0,tier:1};
describe("cosmetic shop",()=>{
  it("preserves legacy Essence as spendable and adds default equipment",()=>{
    const p=normalizeProgress({totalEssence:27,bestDistance:50});
    expect(balance(p)).toBe(27);
    expect(activeAppearance(p)).toEqual({hero:"phantom",accessory:"none"});
    expect(p.ownedHeroes).toEqual(["phantom"]);
    expect(p.ownedAccessories).toEqual(["none"]);
  });
  it("disallows duplicate purchases and spends Essence once",()=>{
    const p={...emptyProgress(),totalEssence:20};
    const bought=purchase(p,"hero","spectra");
    expect(bought.ok).toBe(true);
    if(!bought.ok)return;
    expect(balance(bought.progress)).toBe(12);
    expect(bought.progress.equippedHero).toBe("spectra");
    expect(purchase(bought.progress,"hero","spectra")).toMatchObject({
      ok:false,reason:"already_owned"});
    expect(bought.progress.spentEssence).toBe(8);
    expect(p.spentEssence).toBe(0);
  });
  it("cannot buy expensive cosmetics without enough Essence",()=>{
    const p={...emptyProgress(),totalEssence:4};
    expect(purchase(p,"hero","luna")).toMatchObject({
      ok:false,reason:"insufficient_essence"});
    expect(purchase(p,"accessory","crown")).toMatchObject({
      ok:false,reason:"insufficient_essence"});
    expect(balance(p)).toBe(4);
  });
  it("only equips items the player owns",()=>{
    const p={...emptyProgress(),totalEssence:20};
    expect(equip(p,"hero","wisp")).toMatchObject({ok:false,reason:"not_owned"});
    const bought=purchase(p,"accessory","hat");
    expect(bought.ok).toBe(true);
    if(!bought.ok)return;
    expect(activeAppearance(bought.progress).accessory).toBe("hat");
    const reset=equip(bought.progress,"accessory","none");
    expect(reset.ok).toBe(true);
    if(reset.ok)expect(activeAppearance(reset.progress).accessory).toBe("none");
    expect(balance(bought.progress)).toBe(10);
  });
  it("keeps lifetime Essence separate from current wallet balance after earning more",()=>{
    const initial={...emptyProgress(),totalEssence:20};
    const bought=purchase(initial,"hero","spectra");
    expect(bought.ok).toBe(true);
    if(!bought.ok)return;
    const next=finishRun(bought.progress,gain);
    expect(next.progress.totalEssence).toBe(32);
    expect(next.progress.spentEssence).toBe(8);
    expect(balance(next.progress)).toBe(24);
    expect(next.progress.equippedHero).toBe("spectra");
  });
  it("rejects unknown IDs and repairs tampered or invalid persisted equipment",()=>{
    const p={...emptyProgress(),totalEssence:20};
    expect(purchase(p,"hero","unknown")).toMatchObject({ok:false,reason:"not_found"});
    const normalized=normalizeProgress({
      totalEssence:10,spentEssence:10000,
      ownedHeroes:["phantom","phantom","wisp","unknown"],
      ownedAccessories:["none","ribbon","unknown"],
      equippedHero:"luna",equippedAccessory:"hat"
    });
    expect(balance(normalized)).toBe(0);
    expect(normalized.ownedHeroes).toEqual(["phantom","wisp"]);
    expect(normalized.ownedAccessories).toEqual(["none","ribbon"]);
    expect(activeAppearance(normalized)).toEqual({hero:"phantom",accessory:"none"});
  });
  it("keeps all catalog entries unique and free defaults",()=>{
    const allIds=[...HEROES.map(h=>h.id),...ACCESSORIES.map(a=>a.id)];
    expect(allIds.length).toBe(new Set(allIds).size);
    expect(HEROES[0].price).toBe(0);
    expect(ACCESSORIES[0].price).toBe(0);
    expect(HEROES.every(h=>h.price>=0)).toBe(true);
  });
});
