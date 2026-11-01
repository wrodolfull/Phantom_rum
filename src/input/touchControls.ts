/** Independent pointer identifiers allow jump + phase with two fingers. */
export class PointerHold {
  private active=new Set<number>();
  press(id:number):boolean { const was=this.active.size>0;this.active.add(id);return !was; }
  release(id:number):boolean {const was=this.active.size>0;this.active.delete(id);return was&&this.active.size===0;}
  clear():boolean {const was=this.active.size>0;this.active.clear();return was;}
  get pressed(){return this.active.size>0;}
  get count(){return this.active.size;}
}
export interface TouchActions {
  jump:()=>void;
  phase:(held:boolean)=>void;
  pause:()=>void;
}
export interface TouchBinding {
  setPaused:(paused:boolean)=>void;
  destroy:()=>void;
}
export function mountTouchControls(actions:TouchActions):TouchBinding {
  const jump=document.getElementById("touch-jump");
  const phase=document.getElementById("touch-phase");
  const pause=document.getElementById("touch-pause");
  const container=document.getElementById("touch-controls");
  document.documentElement.dataset.playing="true";
  const hold=new PointerHold();
  const cleanup:Array<()=>void>=[];
  function listen(target:EventTarget|null,name:string,callback:EventListener){
    if(!target)return;
    target.addEventListener(name,callback,{passive:false});
    cleanup.push(()=>target.removeEventListener(name,callback));
  }
  const jumpStart:EventListener=(event)=>{
    const e=event as PointerEvent;
    if(e.button!==0&&e.pointerType==="mouse")return;
    e.preventDefault();
    actions.jump();
  };
  listen(jump,"pointerdown",jumpStart);
  const phaseStart:EventListener=(event)=>{
    const e=event as PointerEvent;
    if(e.button!==0&&e.pointerType==="mouse")return;
    e.preventDefault();
    try{(phase as HTMLElement|null)?.setPointerCapture(e.pointerId);}catch{/* capture optional */}
    if(hold.press(e.pointerId)) {
      phase?.classList.add("pressed");
      actions.phase(true);
    }
  };
  const phaseEnd:EventListener=(event)=>{
    const e=event as PointerEvent;
    e.preventDefault();
    if(hold.release(e.pointerId)){
      phase?.classList.remove("pressed");
      actions.phase(false);
    }
  };
  listen(phase,"pointerdown",phaseStart);
  for(const event of ["pointerup","pointercancel","lostpointercapture"])
    listen(phase,event,phaseEnd);
  const pauseClick:EventListener=(event)=>{
    event.preventDefault();actions.pause();
  };
  listen(pause,"click",pauseClick);
  const releaseAll=()=>{
    if(hold.clear())actions.phase(false);
    phase?.classList.remove("pressed");
  };
  const blur:EventListener=()=>releaseAll();
  const visibility:EventListener=()=>{if(document.hidden)releaseAll();};
  listen(window,"blur",blur);
  listen(document,"visibilitychange",visibility);
  if(container)container.setAttribute("aria-hidden","false");
  return {
    setPaused(paused:boolean){
      if(pause) {
        pause.textContent=paused?"▶ CONTINUAR":"Ⅱ PAUSAR";
        pause.setAttribute("aria-label",paused?"Continuar partida":"Pausar partida");
      }
    },
    destroy(){
      releaseAll();
      for(const off of cleanup)off();
      if(container)container.setAttribute("aria-hidden","true");
      delete document.documentElement.dataset.playing;
    }
  };
}
