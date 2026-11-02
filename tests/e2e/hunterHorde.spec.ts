import {test,expect,type Page} from "@playwright/test";

async function startRunner(page:Page){
  await page.goto("/?test_hunter=1");
  const canvas=page.locator("#game canvas").first();
  await expect(canvas).toBeVisible({timeout:15_000});
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","menu");
  const box=await canvas.boundingBox();
  if(!box)throw new Error("Phaser canvas missing");
  await page.mouse.click(box.x+box.width/2,box.y+box.height*163/270);
  await expect(page.locator("html")).toHaveAttribute(
    "data-phantom-mode","runner",{timeout:12_000});
  await expect(page.locator("html")).toHaveAttribute(
    "data-phantom-hunter-danger",/\d+/);
}

test("2D hunter is visible; three mistakes do NOT kill, fourth reaches 100",async({page})=>{
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await startRunner(page);
  for(let i=0;i<3;i++){
    await page.keyboard.press("h"); // allowed only by ?test_hunter=1
    await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","runner");
    await expect.poll(async()=>Number(await page.locator("html").getAttribute(
      "data-phantom-hunter-danger"))).toBeGreaterThan(16+i*17);
  }
  const before=Number(await page.locator("html").getAttribute("data-phantom-hunter-danger"));
  expect(before).toBeGreaterThanOrEqual(80);
  expect(before).toBeLessThan(100);
  await page.keyboard.press("h");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-hunter-danger","100");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","results",
    {timeout:6_000});
  expect(errors).toEqual([]);
});

test("rescued souls follow Phantom and can trigger one Spectral Wave for 3 souls",async({page})=>{
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await startRunner(page);
  for(let i=0;i<3;i++)await page.keyboard.press("j");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-soul-companions","3");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","runner");
  await page.keyboard.press("q");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-soul-companions","0");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-wave-active","true");
  await page.keyboard.press("q");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-soul-companions","0");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","runner");
  expect(errors).toEqual([]);
});
