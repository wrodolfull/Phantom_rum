import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
  testDir:"./tests/e2e",
  timeout:35_000,
  expect:{timeout:15_000},
  retries:0,
  use:{
    baseURL:"http://127.0.0.1:4178",
    headless:true,
    trace:"retain-on-failure",
    screenshot:"only-on-failure",
    launchOptions:{
      args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader",
        "--disable-gpu-sandbox","--enable-unsafe-swiftshader"]
    }
  },
  projects:[{name:"chromium",use:{...devices["Desktop Chrome"],
    viewport:{width:1200,height:675}}}],
  webServer:{
    command:"npm run dev -- --host 127.0.0.1 --port 4178 --strictPort",
    url:"http://127.0.0.1:4178",
    reuseExistingServer:!process.env.CI,
    timeout:30_000
  },
  reporter:[["list"]]
});
