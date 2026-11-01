import {test,expect,type Page} from "@playwright/test";
async function pressStart(page:Page) {
  const canvas=page.locator("#game canvas").first();
  await expect(canvas).toBeVisible({timeout:15_000});
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","menu",{timeout:15_000});
  const rect=await canvas.boundingBox();
  if(!rect)throw new Error("Phaser canvas unavailable");
  await page.mouse.click(rect.x+rect.width*.5,rect.y+rect.height*(163/270));
}
test("chase does not return to runner within seconds in Chromium",async({page})=>{
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("console",m=>{if(["error","warning"].includes(m.type()))errors.push(m.text());});
  await page.goto("/?test_chase=1&debug_chase=1");
  await expect(page.locator("#phantom-build")).toContainText("0.9.2");
  await pressStart(page);
  await expect.poll(async()=>await page.locator("html").getAttribute("data-phantom-mode"),
    {timeout:15_000}).toMatch(/chase-(three|compat)/);
  await page.waitForTimeout(6_000);
  const mode=await page.locator("html").getAttribute("data-phantom-mode");
  const seconds=await page.locator("html").getAttribute("data-phantom-chase-seconds");
  const diagnosis=await page.evaluate(()=>({
    diagnostics:document.getElementById("phantom-diagnostics")?.textContent,
    datasets:{...document.documentElement.dataset},
    overlay:document.getElementById("chase-ui")?.textContent?.slice(0,300),
    gameCanvasCount:document.querySelectorAll("#game canvas").length
  }));
  console.log("CHASE_E2E",JSON.stringify({mode,seconds,diagnosis,errors}));
  expect(["chase-three","chase-compat"], JSON.stringify({mode,seconds,diagnosis,errors})).toContain(mode);
  expect(Number(seconds)).toBeGreaterThan(.2);
  await expect(page.locator("#phantom-build")).toBeVisible();
});
test("forced compatibility chase lasts beyond the original one-second bug",async({page})=>{
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/?test_chase=1&force_compat=1&debug_chase=1");
  await pressStart(page);
  await page.waitForTimeout(2_000);
  const firstState=await page.evaluate(()=>({
    datasets:{...document.documentElement.dataset},
    diagnostics:document.getElementById("phantom-diagnostics")?.textContent,
    canvases:document.querySelectorAll("#game canvas").length
  }));
  console.log("FORCED_COMPAT_E2E",JSON.stringify({firstState,errors}));
  await expect(page.locator("html"),JSON.stringify(firstState)).toHaveAttribute(
    "data-phantom-mode","chase-compat",{timeout:4_000});
  await page.waitForTimeout(4_000);
  const mode=await page.locator("html").getAttribute("data-phantom-mode");
  expect(mode,JSON.stringify(errors)).toBe("chase-compat");
  expect(Number(await page.locator("html").getAttribute("data-phantom-chase-seconds")))
    .toBeGreaterThan(.2);
});
