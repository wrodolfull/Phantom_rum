import {test,expect,type Page} from "@playwright/test";

async function startPlatform(page:Page){
  await page.goto("/?test_platform=1&debug_chase=1");
  const canvas=page.locator("#game canvas").first();
  await expect(canvas).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","menu");
  const rect=await canvas.boundingBox();
  if(!rect)throw new Error("Phaser canvas unavailable");
  await page.mouse.click(rect.x+rect.width*.5,rect.y+rect.height*(163/270));
  await expect(page.locator("html")).toHaveAttribute(
    "data-phantom-mode","platform",{timeout:12_000});
  await expect.poll(async()=>Number(
    await page.locator("html").getAttribute("data-phantom-platform-x")
  )).toBeGreaterThan(70);
}
test("platform level is playable with keyboard movement and jumping",async({page})=>{
  const pageErrors:string[]=[];
  page.on("pageerror",err=>pageErrors.push(err.message));
  await startPlatform(page);
  const start=Number(await page.locator("html").getAttribute("data-phantom-platform-x"));
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(420);
  await page.keyboard.up("ArrowRight");
  const moved=Number(await page.locator("html").getAttribute("data-phantom-platform-x"));
  const feet=Number(await page.locator("html").getAttribute("data-phantom-platform-feet"));
  console.log("PLATFORM_MOVED",JSON.stringify({start,moved,feet}));
  expect(moved).toBeGreaterThan(start+25);
  expect(feet).toBe(236);
  await page.keyboard.down("Space");
  await expect.poll(async()=>Number(
    await page.locator("html").getAttribute("data-phantom-platform-feet")
  ),{timeout:5000,intervals:[100,150,200]}).toBeLessThan(230);
  await page.keyboard.up("Space");
  console.log("PLATFORM_JUMP",JSON.stringify({
    x:await page.locator("html").getAttribute("data-phantom-platform-x"),
    feet:await page.locator("html").getAttribute("data-phantom-platform-feet"),
    key:await page.locator("html").getAttribute("data-phantom-platform-key")
  }));
  await page.waitForTimeout(1_300);
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","platform");
  expect(pageErrors).toEqual([]);
});
test("escape from mansion preserves run and cannot retrigger chapter",async({page})=>{
  const errors:string[]=[];
  page.on("pageerror",err=>errors.push(err.message));
  await page.goto("/?test_platform=1&qa_exit=1");
  const canvas=page.locator("#game canvas").first();
  await expect(canvas).toBeVisible();
  const rect=await canvas.boundingBox();
  if(!rect)throw new Error("Phaser canvas unavailable");
  await page.mouse.click(rect.x+rect.width*.5,rect.y+rect.height*(163/270));
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","platform",
    {timeout:12_000});
  await page.waitForTimeout(350);
  await page.keyboard.down("x");
  await page.waitForTimeout(230);
  await page.keyboard.up("x");
  console.log("PLATFORM_EXIT_KEY",JSON.stringify({
    mode:await page.locator("html").getAttribute("data-phantom-mode"),
    lastKey:await page.locator("html").getAttribute("data-phantom-platform-key")
  }));
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","runner",
    {timeout:12_000});
  await expect(page.locator("html")).toHaveAttribute("data-phantom-platform-done","true");
  await page.waitForTimeout(1200);
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","runner");
  expect(errors).toEqual([]);
});
