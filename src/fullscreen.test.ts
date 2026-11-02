import {describe,it,expect} from "vitest";
import {fullscreenControlLabel,fullscreenMode} from "./fullscreen";

describe("Phantom fullscreen state",()=>{
  const host={classList:{contains:()=>false}} as unknown as HTMLElement;
  it("starts off and presents the enter fullscreen action",()=>{
    const doc={fullscreenElement:null} as Document;
    expect(fullscreenMode(host,doc)).toBe("off");
    expect(fullscreenControlLabel("off")).toBe("Entrar em tela cheia");
  });
  it("recognizes the native Fullscreen API for the game shell",()=>{
    const doc={fullscreenElement:host} as Document;
    expect(fullscreenMode(host,doc)).toBe("native");
    expect(fullscreenControlLabel("native")).toBe("Sair da tela cheia");
  });
  it("supports a CSS fallback on older mobile Safari browsers",()=>{
    const fallback={classList:{contains:(name:string)=>name==="immersive-fallback"}} as unknown as HTMLElement;
    const doc={fullscreenElement:null} as Document;
    expect(fullscreenMode(fallback,doc)).toBe("fallback");
    expect(fullscreenControlLabel("fallback")).toBe("Sair da tela cheia");
  });
  it("does not treat another element in fullscreen as the game",()=>{
    const doc={fullscreenElement:{id:"unrelated"}} as unknown as Document;
    expect(fullscreenMode(host,doc)).toBe("off");
  });
});
