/**
 * Minimal on-device diagnostics for an intermittent scene transition bug.
 * Nothing is sent to a server. Use ?debug_chase=1 to show detailed states.
 */
export const PHANTOM_BUILD="0.9.2-debug-20261101";
export type Mode="menu"|"runner"|"chase-loading"|"chase-three"|"chase-compat"|"results";
const logs:string[]=[];
const enabled=new URLSearchParams(location.search).has("debug_chase");
const timestamp=()=>new Date().toLocaleTimeString("pt-BR",{hour12:false});
function ensureBadge(){
  let badge=document.getElementById("phantom-build");
  if(!badge){
    badge=document.createElement("div");
    badge.id="phantom-build";
    badge.textContent="BUILD "+PHANTOM_BUILD;
    document.getElementById("game-shell")?.appendChild(badge);
  }
  return badge;
}
function render(){
  ensureBadge();
  if(!enabled)return;
  let panel=document.getElementById("phantom-diagnostics");
  if(!panel){
    panel=document.createElement("div");
    panel.id="phantom-diagnostics";
    document.getElementById("game-shell")?.appendChild(panel);
  }
  panel.textContent=logs.slice(-4).join(" | ");
}
export function reportMode(mode:Mode,detail=""){
  document.documentElement.dataset.phantomMode=mode;
  const info=`${timestamp()} ${mode}${detail?" / "+detail:""}`;
  logs.push(info);
  if(logs.length>24)logs.shift();
  render();
}
export function reportChaseError(context:string,error:unknown){
  const value=error instanceof Error?
    `${error.name}: ${error.message}`:String(error);
  const cleaned=value.slice(0,200);
  document.documentElement.dataset.phantomChaseError=cleaned;
  logs.push(`${timestamp()} ERR ${context}: ${cleaned}`);
  if(logs.length>24)logs.shift();
  render();
}
export function reportChaseSeconds(seconds:number){
  document.documentElement.dataset.phantomChaseSeconds=seconds.toFixed(1);
  const panel=document.getElementById("phantom-diagnostics");
  if(enabled&&panel)panel.textContent=
    `${logs.slice(-3).join(" | ")} | ${seconds.toFixed(1)}s`;
}
