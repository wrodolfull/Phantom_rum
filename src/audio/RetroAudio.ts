/**
 * Original synthesized 8-bit soundscape. No licensed samples, downloads or autoplay.
 * Scheduling uses the AudioContext clock (not timers) and is advanced by the Phaser loop.
 */
export type SoundEffect = 'jump'|'phaseOn'|'phaseOff'|'collect'|'orb'|'hit'|'record';
const PREF_KEY='phantom-run-audio-v1';
type Preferences={music:boolean;effects:boolean};
const melody:[number|null,number][] = [
  [72,0],[79,0],[82,0],[79,0],[75,0],[79,0],[77,0],[null,0],
  [70,0],[75,0],[79,0],[82,0],[84,0],[82,0],[79,0],[null,0],
  [72,0],[79,0],[84,0],[82,0],[79,0],[75,0],[77,0],[79,0],
  [70,0],[74,0],[77,0],[82,0],[79,0],[77,0],[75,0],[null,0]
];
const bass=[48,48,46,46,44,44,43,43];
const midi=(note:number)=>440*Math.pow(2,(note-69)/12);
export class RetroAudio {
  private ctx:AudioContext|null=null;
  private master:GainNode|null=null;
  private nextBeat=0;
  private step=0;
  private active=false;
  private paused=false;
  private settings:Preferences={music:true,effects:true};
  constructor(){
    try{const saved=JSON.parse(localStorage.getItem(PREF_KEY)??'null') as Partial<Preferences>|null;
      if(typeof saved?.music==='boolean')this.settings.music=saved.music;
      if(typeof saved?.effects==='boolean')this.settings.effects=saved.effects;
    }catch{/* Restricted or unavailable storage. */}
  }
  get musicEnabled(){return this.settings.music;}
  get effectsEnabled(){return this.settings.effects;}
  private save(){try{localStorage.setItem(PREF_KEY,JSON.stringify(this.settings));}catch{/* optional */}}
  /** Must run only after a button, key or pointer gesture. */
  unlock(){
    try{
      if(!this.ctx){
        this.ctx=new AudioContext();
        this.master=this.ctx.createGain();
        this.master.gain.value=.34;
        this.master.connect(this.ctx.destination);
      }
      if(this.ctx.state==='suspended')void this.ctx.resume().catch(()=>{});
    }catch{/* A muted game must remain playable. */}
  }
  start(){
    this.active=true;this.paused=false;this.step=0;
    this.unlock();this.nextBeat=(this.ctx?.currentTime??0)+.08;
  }
  stop(){this.active=false;this.step=0;}
  pause(value:boolean){
    if(this.paused===value)return;
    this.paused=value;
    if(!value)this.nextBeat=(this.ctx?.currentTime??0)+.08;
  }
  toggleMusic(){
    this.settings.music=!this.settings.music;this.save();
    if(this.settings.music){this.unlock();this.nextBeat=(this.ctx?.currentTime??0)+.08;}
    return this.settings.music;
  }
  toggleEffects(){
    this.settings.effects=!this.settings.effects;this.save();
    if(this.settings.effects)this.unlock();
    return this.settings.effects;
  }
  private tone(note:number,start:number,duration:number,type:OscillatorType,volume:number,slideTo?:number){
    if(!this.ctx||!this.master)return;
    const osc=this.ctx.createOscillator();
    const envelope=this.ctx.createGain();
    osc.type=type;
    osc.frequency.setValueAtTime(midi(note),start);
    if(slideTo!==undefined)osc.frequency.exponentialRampToValueAtTime(Math.max(28,midi(slideTo)),start+duration);
    envelope.gain.setValueAtTime(.0001,start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+.009);
    envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(envelope);envelope.connect(this.master);
    osc.start(start);osc.stop(start+duration+.016);
    osc.onended=()=>{osc.disconnect();envelope.disconnect();};
  }
  update(){
    if(!this.ctx||!this.active||this.paused||!this.settings.music||this.ctx.state!=='running')return;
    const now=this.ctx.currentTime;
    // Do not schedule a backlog when returning from a hidden or throttled tab.
    if(this.nextBeat<now-.2)this.nextBeat=now+.03;
    let scheduled=0;
    while(this.nextBeat<now+.16 && scheduled++<4){
      const idx=this.step++%melody.length;
      const [note]=melody[idx];
      if(note!==null)this.tone(note,this.nextBeat,.135,'square',.035);
      if(idx%4===0)this.tone(bass[Math.floor(idx/4)%bass.length],this.nextBeat,.26,'triangle',.045);
      if(idx%2===0)this.tone(85,this.nextBeat,.025,'triangle',.008);
      this.nextBeat+=.235;
    }
  }
  play(effect:SoundEffect){
    if(!this.settings.effects)return;
    this.unlock();
    if(!this.ctx||this.ctx.state!=='running')return;
    const t=this.ctx.currentTime+.008;
    switch(effect){
      case 'jump':this.tone(72,t,.10,'square',.075,82);break;
      case 'phaseOn':this.tone(60,t,.20,'sine',.072,88);this.tone(76,t+.04,.13,'triangle',.038,91);break;
      case 'phaseOff':this.tone(83,t,.13,'triangle',.058,59);break;
      case 'collect':this.tone(81,t,.07,'square',.055);this.tone(88,t+.075,.1,'square',.050);break;
      case 'orb':this.tone(67,t,.08,'sine',.065);this.tone(79,t+.08,.12,'sine',.055);break;
      case 'hit':this.tone(49,t,.23,'sawtooth',.065,33);break;
      case 'record':for(let i=0;i<4;i++)this.tone([72,76,79,84][i],t+i*.09,.15,'square',.045);break;
    }
  }
}
export const retroAudio=new RetroAudio();
