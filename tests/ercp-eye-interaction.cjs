const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(path.join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }

(async () => {
  const browser = await playwright.chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.setDefaultTimeout(10000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => allModelObjects.length > 40 && !!document.querySelector('.twod-procedure-button[data-procedure=ercp_eye]'));
    await page.locator('#card-stomach').dragTo(page.locator('#stage-viewport'));
    await page.locator('#card-biliary').dragTo(page.locator('#stage-viewport'));
    await page.waitForFunction(() => document.querySelector('#twod-point-marker-ercp_eye:not(.hidden)'));
    await page.locator('.twod-procedure-button[data-procedure=ercp_eye]').click();
    await page.waitForFunction(() => document.querySelector('#two-d-workspace:not(.hidden)') && /ercp_eye_00_stone_obstruction_v1/.test(document.querySelector('#two-d-anatomy-image').getAttribute('src') || ''));
    assert.equal(await page.locator('#twod-ercp-instruments .visual-inst-card').count(), 4);
    await page.locator('#twod-target-zone').click({ force: true });

    const canvas = page.locator('#twod-canvas');
    const box = await canvas.boundingBox();
    const dropAt = async key => {
      const card = page.locator('#twod-ercp-instruments [data-tool="' + key + '"]');
      await card.scrollIntoViewIfNeeded();
      await card.dragTo(canvas, { targetPosition: { x: box.width * .55, y: box.height * .49 } });
      await page.waitForTimeout(2050);
    };

    await dropAt('ercp_basket');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /ercp_eye_04_basket_retrieval_v1\.png$/, 'Basket frame is directly reviewable for patient explanation');
    assert.match(await page.locator('#twod-message').innerText(), /已跳转/);
    await dropAt('ercp_duodenoscope');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /ercp_eye_01_papilla_cannulation_v1\.png$/);
    await dropAt('ercp_cholangioscope');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /ercp_eye_02_cholangioscopy_v1\.png$/);
    await dropAt('ercp_lithotripsy');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /ercp_eye_03_lithotripsy_v1\.png$/);
    await dropAt('ercp_basket');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /ercp_eye_04_basket_retrieval_v1\.png$/);
    assert.equal(await page.locator('#twod-effect-layer .twod-effect').count(), 0, 'ERCP module must use dedicated medical image frames, not vector pseudo-instruments');

    await page.locator('#twod-compare-toggle').click();
    assert.match(await page.locator('.twod-compare-view figure:first-child img').getAttribute('src'), /ercp_eye_00_stone_obstruction_v1\.png$/);
    assert.match(await page.locator('.twod-compare-view figure:last-child img').getAttribute('src'), /ercp_eye_05_patent_duct_v1\.png$/);
    assert.deepEqual(errors, []);
    console.log('PASS: ERCP direct-visualization cards show recommended route → direct view → lithotripsy → basket while every frame remains independently reviewable');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
