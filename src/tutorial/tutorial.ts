import {FIRST_SEGMENT_START} from "../world/course";

/** Non-blocking first-run hints tied to the actual handcrafted introduction. */
export type TutorialStep="welcome"|"phase"|"release"|"orb"|"jump"|"done";
export interface Hint {step:TutorialStep; text:string; completed:boolean}
const WALL=FIRST_SEGMENT_START+80;
const ORB=FIRST_SEGMENT_START+300;
const GAP=FIRST_SEGMENT_START+520;
export function tutorialHint(playerX:number,enabled:boolean):Hint{
  if(!enabled)return {step:"done",text:"",completed:true};
  if(playerX<WALL-190)
    return {step:"welcome",text:"PHANTOM CORRE SOZINHO. PREPARE-SE!",completed:false};
  if(playerX<WALL+26+12)
    return {step:"phase",text:"SEGURE SHIFT OU O LADO DIREITO PARA ATRAVESSAR!",completed:false};
  if(playerX<ORB-120)
    return {step:"release",text:"SOLTE O BOTÃO PARA RECUPERAR ENERGIA.",completed:false};
  if(playerX<ORB+18)
    return {step:"orb",text:"ORBES AZUIS RECARREGAM SUA ENERGIA.",completed:false};
  if(playerX<GAP+44+22)
    return {step:"jump",text:"ESPAÇO OU TOQUE À ESQUERDA PARA PULAR!",completed:false};
  return {step:"done",text:"TUTORIAL CONCLUÍDO! BOA CORRIDA.",completed:true};
}
