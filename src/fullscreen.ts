/** One fullscreen switch across the menu, runner, chase, mansion and bat flight.
 *
 * Desktop/Android Chrome use the Fullscreen API. Safari browsers that do not
 * offer element fullscreen get a viewport-filling CSS alternative.
 * Orientation lock is best effort; unsupported phones stay playable.
 */
type FullscreenDocument=Document&{
  webkitFullscreenElement?:Element|null;
  webkitExitFullscreen?:()=>void|Promise<void>;
};
type FullscreenHost=HTMLElement&{
  webkitRequestFullscreen?:()=>void|Promise<void>;
};
type OrientationLock=ScreenOrientation&{lock?:(orientation:"landscape")=>Promise<void>};
export type FullscreenMode="off"|"native"|"fallback";

export function fullscreenMode(
  host:HTMLElement,doc:FullscreenDocument=document
):FullscreenMode{
  if(doc.fullscreenElement===host||doc.webkitFullscreenElement===host)
    return "native";
  if(host.classList.contains("immersive-fallback"))return "fallback";
  return "off";
}

/** Set active-state labels together; screen-reader feedback stays accurate. */
export function fullscreenControlLabel(mode:FullscreenMode):string{
  return mode==="off"?"Entrar em tela cheia":"Sair da tela cheia";
}
export function initFullscreen(onLayoutChanged:()=>void):()=>void{
  const host=document.getElementById("game-shell") as FullscreenHost|null;
  const button=document.getElementById("fullscreen-toggle") as HTMLButtonElement|null;
  if(!host||!button)return ()=>{};
  const doc=document as FullscreenDocument;
  let disposed=false;
  let requestInFlight=false;
  let resizePending=false;
  const refresh=()=>{
    if(disposed||resizePending)return;
    resizePending=true;
    requestAnimationFrame(()=>{
      resizePending=false;
      if(!disposed)onLayoutChanged();
    });
  };
  const sync=()=>{
    if(disposed)return;
    const mode=fullscreenMode(host,doc);
    document.documentElement.dataset.phantomFullscreen=mode;
    document.documentElement.classList.toggle("fullscreen-view",mode!=="off");
    const label=fullscreenControlLabel(mode);
    button.setAttribute("aria-label",label);
    button.setAttribute("title",label+" (F)");
    button.setAttribute("aria-pressed",String(mode!=="off"));
    button.textContent=mode==="off"?"⛶":"✕";
    host.classList.toggle("fullscreen-active",mode!=="off");
    refresh();
  };
  const enter=async()=>{
    if(requestInFlight)return;
    requestInFlight=true;
    try{
      if(typeof host.requestFullscreen==="function"){
        try{
          await host.requestFullscreen({navigationUI:"hide"});
        }catch{
          // iOS Safari and sandboxed previews may reject the native request.
          host.classList.add("immersive-fallback");
        }
      }else if(typeof host.webkitRequestFullscreen==="function"){
        try{await host.webkitRequestFullscreen();}
        catch{host.classList.add("immersive-fallback");}
      }else host.classList.add("immersive-fallback");
      // Screen Orientation API may be disabled by browser/device settings.
      if(fullscreenMode(host,doc)==="native"){
        try{
          const orientation=screen.orientation as OrientationLock;
          if(typeof orientation?.lock==="function")
            await orientation.lock("landscape");
        }catch{/* optional; no blocker for fullscreen */}
      }
    }finally{
      requestInFlight=false;
      sync();
    }
  };
  const leave=async()=>{
    if(requestInFlight)return;
    requestInFlight=true;
    try{
      if(fullscreenMode(host,doc)==="native"){
        try{
          if(typeof doc.exitFullscreen==="function")await doc.exitFullscreen();
          else if(typeof doc.webkitExitFullscreen==="function")
            await doc.webkitExitFullscreen();
        }catch{/* browser can also leave with Escape */}
        try{screen.orientation?.unlock?.();}catch{/* optional */}
      }
      host.classList.remove("immersive-fallback");
    }finally{requestInFlight=false;sync();}
  };
  const toggle=()=>{
    if(fullscreenMode(host,doc)==="off")void enter();
    else void leave();
  };
  const onClick=(e:MouseEvent)=>{
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };
  const onKey=(e:KeyboardEvent)=>{
    if(e.repeat||e.metaKey||e.ctrlKey||e.altKey)return;
    if(e.code==="KeyF"){
      const active=document.activeElement;
      if(active instanceof HTMLInputElement||
        active instanceof HTMLTextAreaElement||
        active instanceof HTMLSelectElement||
        (active instanceof HTMLElement&&active.isContentEditable))return;
      e.preventDefault();toggle();
    }else if(e.code==="Escape"&&
      fullscreenMode(host,doc)==="fallback"){
      // Browser already handles Escape in native fullscreen.
      host.classList.remove("immersive-fallback");
      sync();
    }
  };
  const onFullscreenChange=()=>{
    if(fullscreenMode(host,doc)==="native"){
      host.classList.remove("immersive-fallback");
    }
    sync();
  };
  const onResize=()=>refresh();
  button.addEventListener("click",onClick);
  window.addEventListener("keydown",onKey);
  document.addEventListener("fullscreenchange",onFullscreenChange);
  document.addEventListener("webkitfullscreenchange",onFullscreenChange);
  window.addEventListener("resize",onResize);
  window.addEventListener("orientationchange",onResize);
  sync();
  return ()=>{
    disposed=true;
    button.removeEventListener("click",onClick);
    window.removeEventListener("keydown",onKey);
    document.removeEventListener("fullscreenchange",onFullscreenChange);
    document.removeEventListener("webkitfullscreenchange",onFullscreenChange);
    window.removeEventListener("resize",onResize);
    window.removeEventListener("orientationchange",onResize);
  };
}
