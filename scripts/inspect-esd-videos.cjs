const { chromium } = require('C:/Users/wuhaotian/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1050 } });
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  for (const name of ['95ba1c957621f544924ecba55addd1aa', 'c76f701044bda0a0372ac2a1758184d5']) {
    const url = pathToFileURL(path.resolve('EUS_手术解说工具/01_原始资料/ESD/视频', name + '.mp4')).href;
    await page.setContent('<body style="margin:0;background:#fff;font:14px sans-serif"><h3></h3><video muted style="display:none"></video><div id="grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"></div></body>');
    const duration = await page.evaluate(async url => {
      const video = document.querySelector('video');
      await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = reject; video.src = url; });
      const duration = video.duration;
      document.querySelector('h3').textContent = `${duration.toFixed(1)} 秒 · 来源视频分段检查`;
      for (let i = 0; i < 9; i++) {
        const time = Math.min(duration - .1, duration * (i + .5) / 9);
        await new Promise(resolve => { video.onseeked = resolve; video.currentTime = time; });
        const cell = document.createElement('div'), canvas = document.createElement('canvas');
        canvas.width = 408; canvas.height = 272;
        canvas.getContext('2d').drawImage(video, 0, 0, 408, 272);
        cell.append(canvas, `${time.toFixed(1)} 秒`); document.querySelector('#grid').append(cell);
      }
      return duration;
    }, url);
    console.log(name, duration);
    await page.screenshot({ path: `scratch_verify/esd-source-${name}.png` });
  }
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
