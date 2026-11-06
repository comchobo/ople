import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "prototype-hongju.spec.ts",
  reporter: "list",
  use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:3100" },
  webServer: {
    command: `node -e 'require("http").createServer((req,res)=>{try{res.setHeader("Content-Type","text/html; charset=utf-8");res.end(require("fs").readFileSync(process.env.PROTOTYPE_HTML_DIR+"/prototype-hongju.html"))}catch{res.writeHead(404);res.end("Missing prototype")}}).listen(3100)'`,
    port: 3100,
  },
});
