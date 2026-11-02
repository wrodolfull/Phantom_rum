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
  await page.waitForTimeout(650);
  await page.keyboard.up("ArrowRight");
  const moved=Number(await page.locator("html").getAttribute("data-phantom-platform-x"));
  expect(moved).toBeGreaterThan(start+40);
  await page.keyboard.press("Space");
  await page.waitForTimeout(180);
  const airborne=Number(await page.locator("html").getAttribute("data-phantom-platform-feet"));
  expect(airborne).toBeLessThan(236);
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
  await page.keyboard.press("x");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","runner",
    {timeout:12_000});
  await expect(page.locator("html")).toHaveAttribute("data-phantom-platform-done","true");
  await page.waitForTimeout(1200);
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","runner");
  expect(errors).toEqual([]);
});
