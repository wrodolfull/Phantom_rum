/** Progress stored on this device only; deterministic rules are unit-testable. */
export const SAVE_KEY = "phantom-run-progress-v1";
export const LEGACY_BEST_KEY = "phantom-run-best-v1";

export interface RunStats {
  meters:number;
  essence:number;
  jumps:number;
  phases:number;
  walls:number;
  orbs:number;
  tier:number;
}
export interface Progress {
  version:1;
  tutorialDone:boolean;
  bestDistance:number;
  bestEssence:number;
  totalEssence:number;
  totalMeters:number;
  totalRuns:number;
  achievements:string[];
}
export interface Achievement {
  id:string; title:string; description:string;
  achieved:(run:RunStats,progress:Progress)=>boolean;
}
export const ACHIEVEMENTS:readonly Achievement[]=[
  {id:"first_run",title:"PRIMEIROS PASSOS",description:"Termine sua primeira partida",achieved:(_r,p)=>p.totalRuns>=1},
  {id:"first_jump",title:"PULO DO GATO",description:"Execute um salto",achieved:(r)=>r.jumps>=1},
  {id:"phase",title:"ENTRE MUNDOS",description:"Use a intangibilidade",achieved:(r)=>r.phases>=1},
  {id:"wall",title:"ATRAVESSADOR",description:"Atravesse uma parede",achieved:(r)=>r.walls>=1},
  {id:"collector",title:"CAÇA-ESSÊNCIAS",description:"Colete 5 essências numa partida",achieved:(r)=>r.essence>=5},
  {id:"century",title:"CEM METROS",description:"Alcance 100 m em uma partida",achieved:(r)=>r.meters>=100},
  {id:"veteran",title:"INSISTENTE",description:"Jogue 10 partidas",achieved:(_r,p)=>p.totalRuns>=10},
  {id:"traveler",title:"SEM DESCANSO",description:"Percorra 1.000 m no total",achieved:(_r,p)=>p.totalMeters>=1000}
];
const integer=(value:unknown)=>typeof value==='number' && Number.isFinite(value)
  ?Math.max(0,Math.min(1_000_000_000,Math.floor(value))):0;
export function emptyProgress():Progress {
  return {version:1,tutorialDone:false,bestDistance:0,bestEssence:0,
    totalEssence:0,totalMeters:0,totalRuns:0,achievements:[]};
}
export function normalizeProgress(value:unknown,legacyBest:unknown=0):Progress {
  const old=typeof value==='object'&&value!==null?value as Record<string,unknown>:{};
  const known=new Set(ACHIEVEMENTS.map(a=>a.id));
  return {
    version:1,
    tutorialDone:old.tutorialDone===true,
    bestDistance:Math.max(integer(old.bestDistance),integer(legacyBest)),
    bestEssence:integer(old.bestEssence),
    totalEssence:integer(old.totalEssence),
    totalMeters:integer(old.totalMeters),
    totalRuns:integer(old.totalRuns),
    achievements:Array.isArray(old.achievements)?
      [...new Set(old.achievements.filter((s:unknown):s is string=>typeof s==='string'&&known.has(s)))]:[]
  };
}
export function finishRun(before:Progress,stats:RunStats){
  const run={
    meters:integer(stats.meters),essence:integer(stats.essence),jumps:integer(stats.jumps),
    phases:integer(stats.phases),walls:integer(stats.walls),
    orbs:integer(stats.orbs),tier:integer(stats.tier)
  };
  const p:Progress={
    ...before,
    bestDistance:Math.max(before.bestDistance,run.meters),
    bestEssence:Math.max(before.bestEssence,run.essence),
    totalEssence:Math.min(1_000_000_000,before.totalEssence+run.essence),
    totalMeters:Math.min(1_000_000_000,before.totalMeters+run.meters),
    totalRuns:Math.min(1_000_000_000,before.totalRuns+1),
    achievements:[...before.achievements]
  };
  const unlocked=ACHIEVEMENTS.filter(a=>!p.achievements.includes(a.id)&&a.achieved(run,p))
    .map(a=>a.id);
  p.achievements.push(...unlocked);
  return {progress:p,unlocked,newRecord:run.meters>before.bestDistance,
    previousBest:before.bestDistance};
}
export function nextDistanceGoal(bestMeters:number){
  const next=[25,50,100,250,500,1000,2500,5000].find(n=>bestMeters<n);
  if(!next)return {label:"LENDA DO CEMITÉRIO",target:bestMeters,ratio:1};
  const previous=[0,25,50,100,250,500,1000,2500].findLast(n=>n<next)??0;
  return {label:`PRÓXIMA META: ${next} m`,target:next,
    ratio:Math.max(0,Math.min(1,(bestMeters-previous)/(next-previous)))};
}
export class ProgressStore {
  load():Progress {
    let saved:unknown=null,legacy:unknown=0;
    try {
      const raw=localStorage.getItem(SAVE_KEY);
      if(raw!==null)saved=JSON.parse(raw);
      const old=localStorage.getItem(LEGACY_BEST_KEY);
      if(old!==null)legacy=Number(old);
    }catch{/* browser storage may be disabled or corrupt */}
    return normalizeProgress(saved,legacy);
  }
  save(value:Progress):void {
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(value));}catch{/* optional */}
  }
  markTutorial():Progress {
    const progress=this.load();
    if(!progress.tutorialDone){progress.tutorialDone=true;this.save(progress);}
    return progress;
  }
  finish(stats:RunStats){
    const result=finishRun(this.load(),stats);
    this.save(result.progress);
    return result;
  }
}
export const progressStore=new ProgressStore();
