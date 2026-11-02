import {test,expect,type Page} from "@playwright/test";

async function start(page:Page,url:string){
  await page.goto(url);
  const canvas=page.locator("#game canvas").first();
  await expect(canvas).toBeVisible({timeout:15_000});
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","menu",{timeout:12_000});
  const rect=await canvas.boundingBox();
  if(!rect)throw new Error("Phaser canvas unavailable");
  await page.mouse.click(rect.x+rect.width*.5,rect.y+rect.height*(163/270));
}
test("special bat capture window triggers the flight, not a second runner mode",async({page})=>{
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await start(page,"/?test_bat=1");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","runner");
  await expect.poll(async()=>await page.locator("html").getAttribute("data-phantom-bat-status"),
    {timeout:20_000,intervals:[20,40,80]}).toBe("ready");
  const atCapture=Number(await page.locator("html").getAttribute("data-phantom-bat-relative"));
  console.log("BAT_READY",atCapture);
  await page.keyboard.press("e");
  await expect.poll(async()=>await page.locator("html").getAttribute("data-phantom-mode"),
    {timeout:12_000}).toMatch(/^bat-(captured|flight)$/);
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","bat-flight",
    {timeout:12_000});
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});
test("bat flight changes altitude, scores finite Essence and lands back in runner",async({page})=>{
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await start(page,"/?test_flight=1&qa_exit=1");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","bat-flight",
    {timeout:12_000});
  await page.keyboard.press("ArrowUp");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-flight-lane","0",
    {timeout:5000});
  await page.waitForTimeout(1700);
  const coins=Number(await page.locator("html").getAttribute("data-phantom-flight-essence"));
  expect(coins).toBeGreaterThanOrEqual(0);
  expect(coins).toBeLessThanOrEqual(10);
  await page.keyboard.press("x");
  await expect.poll(async()=>await page.locator("html").getAttribute("data-phantom-mode"),
    {timeout:12_000}).toMatch(/bat-landing|runner/);
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","runner",
    {timeout:12_000});
  await expect(page.locator("html")).toHaveAttribute("data-phantom-bat-done","true");
  const meters=Number(await page.locator("html").getAttribute("data-phantom-runner-meters"));
  expect(meters).toBeGreaterThanOrEqual(1700);
  await page.waitForTimeout(800);
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","runner");
  expect(errors).toEqual([]);
});

test("natural 10-second bat flight automatically lands and resumes runner",async({page})=>{
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await start(page,"/?test_flight=1");
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","bat-flight",
    {timeout:12_000});
  // No QA exit key: real gameplay timer must end the bonus and trigger landing.
  await expect(page.locator("html")).toHaveAttribute("data-phantom-mode","runner",
    {timeout:30_000});
  await expect(page.locator("html")).toHaveAttribute("data-phantom-bat-done","true");
  const meters=Number(await page.locator("html").getAttribute("data-phantom-runner-meters"));
  expect(meters).toBeGreaterThanOrEqual(1835); // 1700m + 135m flight reward
  expect(errors).toEqual([]);
});
