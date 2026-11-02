import {test,expect,type Page} from "@playwright/test";

async function startChase(page:Page){
  await page.goto("/?test_chase=1");
  const canvas=page.locator("#game canvas").first();
  await expect(canvas).toBeVisible({timeout:15_000});
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","menu");
  const rect=await canvas.boundingBox();
  if(!rect)throw new Error("Game canvas not available");
  await page.mouse.click(rect.x+rect.width*.5,rect.y+rect.height*(163/270));
  await expect.poll(async()=>page.locator("html").getAttribute("data-phantom-mode"),
    {timeout:15_000}).toMatch(/chase-(three|compat)/);
}

test("fullscreen button toggles on menu and keeps 16:9 game geometry",async({page})=>{
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.setViewportSize({width:920,height:440});
  await page.goto("/");
  const toggle=page.getByRole("button",{name:"Entrar em tela cheia"});
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed","false");
  await toggle.click();
  await expect.poll(async()=>page.locator("html").getAttribute("data-phantom-fullscreen"),
    {timeout:8_000}).toMatch(/native|fallback/);
  const geometry=await page.evaluate(()=>{
    const shell=document.getElementById("game-shell")!.getBoundingClientRect();
    const stage=document.getElementById("game")!.getBoundingClientRect();
    const btn=document.getElementById("fullscreen-toggle")!.getBoundingClientRect();
    return {
      shellWidth:shell.width,shellHeight:shell.height,
      stageWidth:stage.width,stageHeight:stage.height,
      btnWithinShell:btn.left>=shell.left&&btn.right<=shell.right,
      mode:document.documentElement.dataset.phantomFullscreen
    };
  });
  expect(geometry.shellWidth).toBeGreaterThanOrEqual(900);
  expect(geometry.shellHeight).toBeGreaterThanOrEqual(430);
  expect(geometry.stageWidth/geometry.stageHeight).toBeCloseTo(16/9,1);
  expect(geometry.btnWithinShell).toBe(true);
  await page.getByRole("button",{name:"Sair da tela cheia"}).click();
  await expect(page.locator("html")).toHaveAttribute("data-phantom-fullscreen","off");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","menu");
  expect(errors).toEqual([]);
});

test("F shortcut toggles fullscreen without starting or leaving the menu",async({page})=>{
  await page.goto("/");
  await page.keyboard.press("f");
  await expect.poll(async()=>page.locator("html").getAttribute("data-phantom-fullscreen"),
    {timeout:8000}).toMatch(/native|fallback/);
  await page.keyboard.press("f");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-fullscreen","off");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","menu");
});

test("3D chase stays active and its overlay fits the resized full-screen stage",async({page})=>{
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.setViewportSize({width:940,height:440});
  await startChase(page);
  await page.getByRole("button",{name:"Entrar em tela cheia"}).click();
  await expect.poll(async()=>page.locator("html").getAttribute("data-phantom-fullscreen"))
    .toMatch(/native|fallback/);
  const stage=await page.locator("#game").boundingBox();
  const hud=await page.locator("#chase-ui").boundingBox();
  if(!stage||!hud)throw new Error("Chase HUD/stage missing");
  expect(Math.abs(stage.width-hud.width)).toBeLessThan(2);
  expect(Math.abs(stage.x-hud.x)).toBeLessThan(2);
  await page.waitForTimeout(900);
  await expect.poll(async()=>page.locator("html").getAttribute("data-phantom-mode"))
    .toMatch(/chase-(three|compat)/);
  await page.getByRole("button",{name:"Sair da tela cheia"}).click();
  await expect(page.locator("html")).toHaveAttribute("data-phantom-fullscreen","off");
  expect(errors).toEqual([]);
});
