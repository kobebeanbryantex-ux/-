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
    await page.waitForFunction(() => allModelObjects.length > 40 && !!document.querySelector('.twod-procedure-button[data-procedure=eus_ge]'));
    await page.locator('#card-stomach').dragTo(page.locator('#stage-viewport'));
    await page.locator('#card-jejunum').dragTo(page.locator('#stage-viewport'));
    await page.locator('.twod-procedure-button[data-procedure=eus_ge]').click();
    await page.waitForFunction(() => document.querySelector('#two-d-workspace:not(.hidden)'));

    assert.match(await page.locator('#inst-shelf-list [data-tool=echoendoscope] .twod-recommended-step').innerText(), /建议第 1 步/);
    assert.equal(await page.locator('#inst-shelf-list [data-tool=epass]').isVisible(), true);
    assert.equal(await page.locator('#inst-shelf-list [data-tool=dilation_catheter]').isVisible(), false);
    await page.locator('[data-ge-branch=filling]').click();
    assert.equal(await page.locator('#inst-shelf-list [data-tool=epass]').isVisible(), false);
    assert.equal(await page.locator('#inst-shelf-list [data-tool=dilation_catheter]').isVisible(), true);
    assert.match(await page.locator('#inst-shelf-list [data-tool=dilation_catheter] .twod-recommended-step').innerText(), /建议第 2 步/);

    await page.locator('#twod-target-zone').click({ force: true });
    const canvas = page.locator('#twod-canvas');
    const box = await canvas.boundingBox();
    await page.locator('#inst-shelf-list [data-tool=hotaxios]').dragTo(canvas, { targetPosition: { x: box.width * .55, y: box.height * .63 } });
    await page.waitForTimeout(2050);
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /04_hotaxios_puncture_v1\.png$/);
    assert.match(await page.locator('#twod-message').innerText(), /已跳转/);
    await page.screenshot({ path: path.resolve(__dirname, '../scratch_verify/advisory_order_ui.png') });

    await page.locator('#twod-reset').click();
    await page.locator('#card-pancreas').dragTo(page.locator('#stage-viewport'));
    await page.waitForFunction(() => document.querySelector('.twod-procedure-button[data-procedure=eus_pd].is-ready'));
    await page.locator('.twod-procedure-button[data-procedure=eus_pd]').click();
    await page.waitForFunction(() => /eus_pd_00_pathology_v2/.test(document.querySelector('#two-d-anatomy-image').getAttribute('src') || ''));
    assert.match(await page.locator('#twod-pd-instruments [data-tool=pd_stent] .twod-recommended-step').innerText(), /建议第 5 步/);
    await page.locator('#twod-target-zone').click({ force: true });
    const pdCanvas = page.locator('#twod-canvas');
    const pdBox = await pdCanvas.boundingBox();
    await page.locator('#twod-pd-instruments [data-tool=pd_stent]').dragTo(pdCanvas, { targetPosition: { x: pdBox.width * .45, y: pdBox.height * .67 } });
    await page.waitForTimeout(2050);
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_pd_05_stent_drainage_v2\.png$/);
    assert.match(await page.locator('#twod-message').innerText(), /已跳转/);
    assert.deepEqual(errors, []);
    console.log('PASS: branch-specific order chips guide EUS-GE and EUS-PD without blocking direct frame review');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
