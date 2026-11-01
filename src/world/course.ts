/**
 * Phaser-free course planner. Patterns are hand-authored, but their order is
 * seeded and candidates are checked against a conservative safe route.
 *
 * "Safe route" means a player who jumps on gaps, phases ONLY while inside
 * physical threats, exits phase before spectral threats and collects energy pickups.
 * Arbitrarily draining energy can still cause a legitimate game over.
 */
export type ObstacleKind = "wall" | "gap" | "ward" | "orb" | "essence" | "bat" | "hunter" | "wraith" | "spikes";
export interface CourseObject { kind:ObstacleKind; x:number; width:number }
export interface Segment { id:string; length:number; objects:CourseObject[]; tier:number }
type LayoutObject = {kind:ObstacleKind; at:number; width:number};
type Pattern = {id:string; tier:number; length:number; objects:LayoutObject[]};
export interface RouteOptions { fromX:number; energy:number; speed:number }
export type Validation = {valid:boolean; energy:number; reason?:string};

export const BASE_SPEED=160, MAX_SPEED=260, PLAYER_WIDTH=20;
export const GROUND_Y=215, WALL_HEIGHT=66, WARD_HEIGHT=50;
export const ENERGY_MAX=100, ENERGY_DRAIN=30, ENERGY_REGEN=12;
export const GRAVITY=900, JUMP_IMPULSE=-330;
export const MIN_ACTIVATION_ENERGY=10;
const REACTION_SECONDS=.42;
const JUMP_MARGIN_SECONDS=.18;
const WALL_EXTRA_ENERGY=2.5;
const STARTING_GROUND_DISTANCE=340;

export function difficulty(distancePx:number){
  const meters=Math.max(0,distancePx)/10;
  return {
    tier: meters>=3000?4:meters>=1500?3:meters>=500?2:1,
    speed: Math.min(MAX_SPEED, BASE_SPEED+Math.max(0,distancePx)/90)
  };
}
const INTRO:Pattern={id:"introducao",tier:1,length:760,objects:[
  {kind:"wall",at:80,width:26},{kind:"orb",at:300,width:16},
  {kind:"gap",at:520,width:44},{kind:"essence",at:666,width:16}
]};
const PATTERNS:Pattern[]=[
  {id:"muro-e-energia",tier:1,length:570,objects:[
    {kind:"wall",at:135,width:26},{kind:"orb",at:350,width:16},{kind:"essence",at:470,width:16}]},
  {id:"travessia",tier:1,length:590,objects:[
    {kind:"gap",at:150,width:44},{kind:"orb",at:356,width:16},{kind:"essence",at:485,width:16}]},
  {id:"totem",tier:1,length:560,objects:[
    {kind:"ward",at:140,width:18},{kind:"essence",at:385,width:16}]},
  {id:"morcego-rasante",tier:1,length:600,objects:[
    {kind:"bat",at:165,width:28},{kind:"orb",at:415,width:16}]},
  {id:"espinhos-no-caminho",tier:1,length:570,objects:[
    {kind:"spikes",at:150,width:30},{kind:"essence",at:405,width:16}]},
  {id:"alma-perdida",tier:1,length:610,objects:[
    {kind:"wraith",at:160,width:22},{kind:"orb",at:405,width:16}]},
  {id:"cacador-do-cemiterio",tier:1,length:690,objects:[
    {kind:"hunter",at:165,width:26},{kind:"orb",at:465,width:16}]},
  {id:"muro-totem",tier:2,length:760,objects:[
    {kind:"wall",at:140,width:26},{kind:"ward",at:412,width:18},{kind:"orb",at:625,width:16}]},
  {id:"salto-fase",tier:2,length:780,objects:[
    {kind:"gap",at:140,width:46},{kind:"wall",at:430,width:26},{kind:"orb",at:650,width:16}]},
  {id:"morcego-e-alma",tier:2,length:790,objects:[
    {kind:"bat",at:145,width:28},{kind:"wraith",at:435,width:22},{kind:"orb",at:665,width:16}]},
  {id:"espinhos-e-cacador",tier:2,length:830,objects:[
    {kind:"spikes",at:145,width:30},{kind:"hunter",at:460,width:26},{kind:"orb",at:680,width:16}]},
  {id:"fase-salto",tier:3,length:850,objects:[
    {kind:"wall",at:145,width:26},{kind:"gap",at:445,width:48},{kind:"orb",at:695,width:16}]},
  {id:"totem-fase-salto",tier:3,length:970,objects:[
    {kind:"ward",at:140,width:18},{kind:"wall",at:430,width:26},
    {kind:"gap",at:725,width:48},{kind:"orb",at:880,width:16}]},
  {id:"fantasmas-e-cacadores",tier:3,length:990,objects:[
    {kind:"wraith",at:150,width:22},{kind:"hunter",at:440,width:26},
    {kind:"bat",at:745,width:28},{kind:"orb",at:905,width:16}]},
  {id:"ciclo-espectral",tier:4,length:1050,objects:[
    {kind:"wall",at:140,width:26},{kind:"ward",at:422,width:18},
    {kind:"wall",at:722,width:26},{kind:"orb",at:935,width:16}]},
  {id:"dois-abismos",tier:4,length:1000,objects:[
    {kind:"gap",at:145,width:46},{kind:"gap",at:450,width:48},
    {kind:"wall",at:748,width:26},{kind:"orb",at:925,width:16}]},
  {id:"patrulha-sombria",tier:4,length:1120,objects:[
    {kind:"hunter",at:150,width:26},{kind:"wraith",at:460,width:22},
    {kind:"spikes",at:785,width:30},{kind:"orb",at:1010,width:16}]}
];
const REST:Pattern={id:"respiro",tier:1,length:440,objects:[
  {kind:"orb",at:135,width:16},{kind:"essence",at:310,width:16}
]};

function materialize(pattern:Pattern,start:number):Segment{
  return {id:pattern.id,length:pattern.length,tier:pattern.tier,
    objects:pattern.objects.map(t=>({kind:t.kind,x:start+t.at,width:t.width}))};
}
export function requiresIntangible(kind:ObstacleKind):boolean{
  return kind==="wall"||kind==="hunter"||kind==="bat"||kind==="spikes";
}
export function requiresPhysical(kind:ObstacleKind):boolean{
  return kind==="ward"||kind==="wraith";
}
function isThreat(kind:ObstacleKind){
  return kind==="gap"||requiresIntangible(kind)||requiresPhysical(kind);
}

/**
 * Conservative route verification at a constant test speed. Tests must check
 * both the slowest and fastest speeds, to capture energy and reaction margins.
 * The player's hitbox moves forward; entrance/exit include its half-width.
 */
export function validateRoute(objects:ReadonlyArray<CourseObject>,options:RouteOptions):Validation{
  const speed=Math.max(BASE_SPEED,Math.min(MAX_SPEED,options.speed));
  let cursor=options.fromX,energy=Math.max(0,Math.min(ENERGY_MAX,options.energy));
  let lastHazardEnd=-Infinity;
  const ordered=[...objects].sort((a,b)=>a.x-b.x);
  for(const item of ordered){
    if(item.width<=0)return {valid:false,energy,reason:"largura inválida"};
    const enter=item.x-PLAYER_WIDTH/2;
    const exit=item.x+item.width+PLAYER_WIDTH/2;
    if(exit<options.fromX)continue;
    if(enter<cursor-0.01)return {valid:false,energy,reason:"obstáculos sobrepostos"};
    const approach=Math.max(0,(enter-cursor)/speed);
    energy=Math.min(ENERGY_MAX,energy+approach*ENERGY_REGEN);
    if(isThreat(item.kind)){
      if((enter-lastHazardEnd)/MAX_SPEED<REACTION_SECONDS)
        return {valid:false,energy,reason:"janela de reação insuficiente"};
      lastHazardEnd=exit;
    }
    if(requiresIntangible(item.kind)){
      const required=(exit-enter)/speed*ENERGY_DRAIN+WALL_EXTRA_ENERGY;
      if(energy<MIN_ACTIVATION_ENERGY||energy<required)
        return {valid:false,energy,reason:"energia insuficiente antes do muro"};
      energy-=required;
    }else if(item.kind==="gap"){
      const safeFlightSeconds=2*Math.abs(JUMP_IMPULSE)/GRAVITY-JUMP_MARGIN_SECONDS;
      const maximumGap=safeFlightSeconds*BASE_SPEED;
      if(exit-enter>maximumGap)
        return {valid:false,energy,reason:"abismo maior que o salto seguro"};
    }else if(item.kind==="orb")energy=Math.min(ENERGY_MAX,energy+25);
    // The prescribed safe route returns to physical form immediately after walls.
    if(!requiresIntangible(item.kind)){
      energy=Math.min(ENERGY_MAX,energy+(exit-enter)/speed*ENERGY_REGEN);
    }
    cursor=exit;
  }
  return {valid:true,energy};
}
function accepted(objects:ReadonlyArray<CourseObject>,playerX:number,energy:number){
  // Worst energy expenditure occurs at low speed; reaction windows at high speed.
  return validateRoute(objects,{fromX:playerX,energy,speed:BASE_SPEED}).valid &&
    validateRoute(objects,{fromX:playerX,energy,speed:MAX_SPEED}).valid;
}
export interface NextSegmentOptions {
  start:number; distance:number; playerX:number; energy:number;
  upcoming:ReadonlyArray<CourseObject>;
}
/** xorshift32: reproducible layouts for tests, bug reports and playtests. */
export class CoursePlanner {
  private seed:number;
  private first=true;
  private previous="";
  private showcaseIndex=0;
  constructor(seed:number=0x91cafa,skipIntro=false){
    this.seed=(seed|0)||0x91cafa;
    this.first=!skipIntro;
  }
  private rand(){
    let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;
    this.seed=x|0;return (x>>>0)/4294967296;
  }
  next(options:NextSegmentOptions):Segment{
    if(this.first){
      this.first=false;
      const segment=materialize(INTRO,options.start);
      if(accepted([...options.upcoming,...segment.objects],options.playerX,options.energy)){
        this.previous=segment.id;return segment;
      }
    }
    const showcase=["morcego-rasante","alma-perdida","espinhos-no-caminho","cacador-do-cemiterio"];
    if(this.showcaseIndex<showcase.length){
      const id=showcase[this.showcaseIndex];
      const pattern=PATTERNS.find(p=>p.id===id)!;
      const segment=materialize(pattern,options.start);
      if(accepted([...options.upcoming,...segment.objects],options.playerX,options.energy)){
        this.showcaseIndex++;this.previous=segment.id;return segment;
      }
      // A recovery segment is safer than forcing an enemy with depleted energy.
      return materialize(REST,options.start);
    }
    const tier=difficulty(options.distance).tier;
    const candidates=PATTERNS.filter(p=>p.tier<=tier)
      .map(p=>({pattern:p,priority:this.rand()+((p.id===this.previous)?-.65:0)+
        (p.tier===tier?.35:0)}))
      .sort((a,b)=>b.priority-a.priority);
    for(const {pattern} of candidates){
      const segment=materialize(pattern,options.start);
      if(accepted([...options.upcoming,...segment.objects],options.playerX,options.energy)){
        this.previous=segment.id;return segment;
      }
    }
    this.previous=REST.id;
    return materialize(REST,options.start);
  }
}
export const FIRST_SEGMENT_START=STARTING_GROUND_DISTANCE;
