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
    await page.waitForFunction(() => allModelObjects.length > 40 && !!document.querySelector('.twod-procedure-button[data-procedure=poem]'));
    await page.locator('#card-esophagus').dragTo(page.locator('#stage-viewport'));
    await page.locator('#card-stomach').dragTo(page.locator('#stage-viewport'));
    await page.waitForFunction(() => document.querySelector('#twod-point-marker-poem:not(.hidden)'));
    await page.locator('#twod-toggle-instrument-sidebar').click();
    await page.waitForFunction(() => document.getElementById('sidebar-instruments').classList.contains('twod-sidebar-collapsed'));
    await page.locator('#twod-point-marker-poem').click();
    await page.waitForFunction(() => document.querySelector('#two-d-workspace:not(.hidden)') && /poem_00_achalasia_v1/.test(document.querySelector('#two-d-anatomy-image').getAttribute('src') || ''));
    assert.equal(await page.locator('#sidebar-instruments').evaluate(panel => panel.classList.contains('twod-sidebar-collapsed')), false, 'Entering a 2D procedure must automatically reveal the selected tool shelf');
    assert.equal(await page.locator('#twod-poem-instruments .visual-inst-card').count(), 4);
    assert.equal(await page.locator('#twod-ercp-instruments:visible').count(), 0, 'ERCP shelf must not leak into POEM');
    await page.locator('#twod-target-zone').click({ force: true });
    const canvas = page.locator('#twod-canvas');
    const box = await canvas.boundingBox();
    const dropAt = async key => {
      const card = page.locator('#twod-poem-instruments [data-tool="' + key + '"]');
      await card.scrollIntoViewIfNeeded();
      await card.dragTo(canvas, { targetPosition: { x: box.width * .47, y: box.height * .49 } });
      await page.waitForTimeout(2050);
    };
    await dropAt('poem_clip');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /poem_04_entry_closure_v1\.png$/, 'Closure frame is directly reviewable for patient explanation');
    assert.match(await page.locator('#twod-message').innerText(), /已跳转/);
    await dropAt('poem_endoscope');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /poem_01_endoscope_position_v1\.png$/);
    await dropAt('poem_injector');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /poem_02_submucosal_lift_v1\.png$/);
    await dropAt('poem_knife');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /poem_03_tunnel_myotomy_v1\.png$/);
    await dropAt('poem_clip');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /poem_04_entry_closure_v1\.png$/);
    assert.equal(await page.locator('#twod-effect-layer .twod-effect').count(), 0, 'POEM must use dedicated anatomy frames, not vector pseudo-instruments');
    await page.locator('#twod-compare-toggle').click();
    assert.match(await page.locator('.twod-compare-view figure:first-child img').getAttribute('src'), /poem_00_achalasia_v1\.png$/);
    assert.match(await page.locator('.twod-compare-view figure:last-child img').getAttribute('src'), /poem_04_entry_closure_v1\.png$/);
    assert.deepEqual(errors, []);
    console.log('PASS: POEM uses a distinct esophagus–cardia pathway with recommended order labels and independent raster interaction frames');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
