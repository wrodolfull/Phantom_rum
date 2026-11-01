/** All purchasable items are cosmetic. No pay-to-win attributes. */
export const HEROES=[
  {id:"phantom",name:"PHANTOM",description:"O fantasma original",price:0,body:"#fcf7ff",outline:"#4658a2",shadow:"#d6dcf2",accent:"#f3a9c1"},
  {id:"spectra",name:"SPECTRA",description:"Uma alma cor-de-rosa",price:8,body:"#ffd6ee",outline:"#9c5596",shadow:"#efafd5",accent:"#fa80b9"},
  {id:"wisp",name:"WISP",description:"Brilho da floresta",price:16,body:"#bcffe6",outline:"#2e8f89",shadow:"#91dcc3",accent:"#5bcdb3"},
  {id:"boozer",name:"BOOZER",description:"Susto bem-humorado",price:28,body:"#ffdb9e",outline:"#a76b4a",shadow:"#f7b875",accent:"#f28c63"},
  {id:"luna",name:"LUNA",description:"Brilho de luar",price:45,body:"#e0d5ff",outline:"#7265b4",shadow:"#bfb3ef",accent:"#9d84e7"}
] as const;
export const ACCESSORIES=[
  {id:"none",name:"SEM ACESSÓRIO",description:"Visual clássico",price:0},
  {id:"ribbon",name:"LAÇO RUBI",description:"Um laço vermelho",price:5},
  {id:"hat",name:"CHAPÉU MÍSTICO",description:"Um chapéu roxo",price:10},
  {id:"crown",name:"COROA LUNAR",description:"Uma pequena coroa",price:18}
] as const;
export type HeroId=typeof HEROES[number]["id"];
export type AccessoryId=typeof ACCESSORIES[number]["id"];
export type ShopCategory="hero"|"accessory";
export type ShopItemId=HeroId|AccessoryId;
export function isHeroId(v:unknown):v is HeroId{
  return typeof v==="string"&&HEROES.some(h=>h.id===v);
}
export function isAccessoryId(v:unknown):v is AccessoryId{
  return typeof v==="string"&&ACCESSORIES.some(a=>a.id===v);
}
export const heroById=(id:HeroId)=>HEROES.find(h=>h.id===id)!;
export const accessoryById=(id:AccessoryId)=>ACCESSORIES.find(a=>a.id===id)!;
