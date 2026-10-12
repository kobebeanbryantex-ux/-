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
    await page.waitForFunction(() => allModelObjects.length > 40 && !!document.querySelector('.twod-procedure-button[data-procedure=biliary_biopsy]'));
    await page.locator('#card-stomach').dragTo(page.locator('#stage-viewport'));
    await page.locator('#card-biliary').dragTo(page.locator('#stage-viewport'));
    await page.waitForFunction(() => document.querySelector('#twod-point-marker-biliary_biopsy:not(.hidden)'));
    await page.locator('.twod-procedure-button[data-procedure=biliary_biopsy]').click();
    await page.waitForFunction(() => document.querySelector('#two-d-workspace:not(.hidden)') && /biliary_biopsy_00_stricture_v1/.test(document.querySelector('#two-d-anatomy-image').getAttribute('src') || ''));
    assert.equal(await page.locator('#twod-biliary-biopsy-instruments .visual-inst-card').count(), 3, 'All dedicated biliary-biopsy tools must show in the right shelf');
    const geometry = await page.locator('#twod-biliary-biopsy-instruments').evaluate(panel => {
      const card = panel.querySelector('.visual-inst-card');
      const a = panel.getBoundingClientRect(), b = card.getBoundingClientRect();
      return { panelWidth: a.width, cardWidth: b.width, direction: getComputedStyle(panel).flexDirection };
    });
    assert.equal(geometry.direction, 'column');
    assert.ok(geometry.cardWidth > geometry.panelWidth * .7, 'Biliary tool cards must not collapse into a narrow column');
    await page.locator('#twod-target-zone').click({ force: true });

    const canvas = page.locator('#twod-canvas');
    const box = await canvas.boundingBox();
    const dropAt = async key => {
      const card = page.locator('#twod-biliary-biopsy-instruments [data-tool="' + key + '"]');
      await card.scrollIntoViewIfNeeded();
      await card.dragTo(canvas, { targetPosition: { x: box.width * .54, y: box.height * .45 } });
      await page.waitForTimeout(2050);
    };
    await dropAt('bds_biopsy_forceps');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /biliary_biopsy_03_targeted_forceps_v1\.png$/, 'Targeted forceps frame is directly reviewable for patient explanation');
    assert.match(await page.locator('#twod-message').innerText(), /已跳转/);
    await dropAt('bds_duodenoscope');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /biliary_biopsy_01_ercp_access_v1\.png$/);
    await dropAt('bds_cholangioscope');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /biliary_biopsy_02_direct_visualization_v1\.png$/);
    await dropAt('bds_biopsy_forceps');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /biliary_biopsy_03_targeted_forceps_v1\.png$/);
    assert.equal(await page.locator('#twod-effect-layer .twod-effect').count(), 0, 'Dedicated clinical raster frames must replace vector pseudo-instruments');
    await page.locator('#twod-compare-toggle').click();
    assert.match(await page.locator('.twod-compare-view figure:first-child img').getAttribute('src'), /biliary_biopsy_00_stricture_v1\.png$/);
    assert.match(await page.locator('.twod-compare-view figure:last-child img').getAttribute('src'), /biliary_biopsy_04_sampled_v1\.png$/);
    assert.notEqual(await page.locator('.twod-compare-view figure:first-child img').getAttribute('src'), await page.locator('.twod-compare-view figure:last-child img').getAttribute('src'));
    assert.deepEqual(errors, []);
    console.log('PASS: biliary stricture cards recommend ERCP access → direct visualization → targeted biopsy and keep direct frame review usable');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
