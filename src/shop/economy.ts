import {HEROES,ACCESSORIES,isHeroId,isAccessoryId,
  type HeroId,type AccessoryId,type ShopCategory} from "./catalog";
import type {Progress} from "../progression/progress";

export type ShopError="not_found"|"already_owned"|"insufficient_essence"|"not_owned";
export type ShopResult={ok:true;progress:Progress}|{ok:false;reason:ShopError;progress:Progress};
export const balance=(p:Progress)=>Math.max(0,p.totalEssence-p.spentEssence);
export function purchase(p:Progress,category:ShopCategory,id:string):ShopResult{
  if(category==="hero"){
    if(!isHeroId(id))return {ok:false,reason:"not_found",progress:p};
    if(p.ownedHeroes.includes(id))return {ok:false,reason:"already_owned",progress:p};
    const item=HEROES.find(h=>h.id===id)!;
    if(balance(p)<item.price)return {ok:false,reason:"insufficient_essence",progress:p};
    return {ok:true,progress:{...p,spentEssence:p.spentEssence+item.price,
      ownedHeroes:[...p.ownedHeroes,id],equippedHero:id}};
  }
  if(!isAccessoryId(id))return {ok:false,reason:"not_found",progress:p};
  if(p.ownedAccessories.includes(id))return {ok:false,reason:"already_owned",progress:p};
  const item=ACCESSORIES.find(a=>a.id===id)!;
  if(balance(p)<item.price)return {ok:false,reason:"insufficient_essence",progress:p};
  return {ok:true,progress:{...p,spentEssence:p.spentEssence+item.price,
    ownedAccessories:[...p.ownedAccessories,id],equippedAccessory:id}};
}
export function equip(p:Progress,category:ShopCategory,id:string):ShopResult{
  if(category==="hero"){
    if(!isHeroId(id))return {ok:false,reason:"not_found",progress:p};
    if(!p.ownedHeroes.includes(id))return {ok:false,reason:"not_owned",progress:p};
    return {ok:true,progress:{...p,equippedHero:id}};
  }
  if(!isAccessoryId(id))return {ok:false,reason:"not_found",progress:p};
  if(!p.ownedAccessories.includes(id))return {ok:false,reason:"not_owned",progress:p};
  return {ok:true,progress:{...p,equippedAccessory:id}};
}
export function activeAppearance(p:Progress):{hero:HeroId;accessory:AccessoryId}{
  return {hero:p.ownedHeroes.includes(p.equippedHero)?p.equippedHero:"phantom",
    accessory:p.ownedAccessories.includes(p.equippedAccessory)?p.equippedAccessory:"none"};
}
