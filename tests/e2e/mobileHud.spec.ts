import {test,expect} from "@playwright/test";
test.use({hasTouch:true,viewport:{width:844,height:390}});

test("mobile 2D hunter is visible and the Wave button shows progress from 0/3",async({page})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/?test_hunter=1");
  const canvas=page.locator("#game canvas").first();
  await expect(canvas).toBeVisible();
  const b=await canvas.boundingBox();
  if(!b)throw Error("canvas missing");
  await page.touchscreen.tap(b.x+b.width*.5,b.y+b.height*163/270);
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","runner");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-wave-state","0/3");
  const hunterX=Number(await page.locator("html").getAttribute("data-phantom-hunter-x"));
  expect(hunterX).toBeGreaterThan(20);
  expect(hunterX).toBeLessThan(90);
  for(let i=0;i<3;i++)await page.keyboard.press("j");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-wave-state","ready");
  await page.touchscreen.tap(b.x+b.width*413/480,b.y+b.height*194/270);
  await expect(page.locator("html")).toHaveAttribute("data-phantom-wave-state","active");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-soul-companions","0");
  expect(errors).toEqual([]);
});


test("Spectral Wave expands visibly across mobile stage and fades",async({page})=>{
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/?test_hunter=1");
  const canvas=page.locator("#game canvas").first();
  await expect(canvas).toBeVisible();
  const box=await canvas.boundingBox();
  if(!box)throw Error("missing canvas");
  await page.touchscreen.tap(box.x+box.width/2,
    box.y+box.height*163/270);
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","runner");
  const firstCountdown=Number(await page.locator("html")
    .getAttribute("data-phantom-next-special-meters"));
  expect(firstCountdown).toBeGreaterThan(200);
  for(let i=0;i<3;i++)await page.keyboard.press("j");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-wave-state","ready");
  await page.touchscreen.tap(box.x+box.width*413/480,
    box.y+box.height*194/270);
  await expect(page.locator("html")).toHaveAttribute("data-phantom-wave-state","active");
  await expect.poll(async()=>Number(await page.locator("html")
    .getAttribute("data-phantom-wave-radius")),
    {timeout:2500}).toBeGreaterThan(175);
  const radiusA=Number(await page.locator("html")
    .getAttribute("data-phantom-wave-radius"));
  await expect.poll(async()=>Number(await page.locator("html")
    .getAttribute("data-phantom-wave-radius")),
    {timeout:2500}).toBeGreaterThan(340);
  const radiusB=Number(await page.locator("html")
    .getAttribute("data-phantom-wave-radius"));
  expect(radiusB).toBeGreaterThan(radiusA);
  await expect(page.locator("html")).toHaveAttribute("data-phantom-wave-active","false",
    {timeout:7000});
  await expect(page.locator("html")).toHaveAttribute("data-phantom-wave-radius","0");
  expect(errors).toEqual([]);
});
