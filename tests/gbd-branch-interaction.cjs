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
    await page.waitForFunction(() => allModelObjects.length > 40 && !!document.querySelector('.twod-procedure-button[data-procedure=eus_gbd]'));
    await page.locator('#card-stomach').dragTo(page.locator('#stage-viewport'));
    await page.locator('#card-biliary').dragTo(page.locator('#stage-viewport'));
    await page.waitForFunction(() => document.querySelectorAll('.twod-point-marker:not(.hidden)').length === 6);
    await page.locator('.twod-procedure-button[data-procedure=eus_gbd]').click();
    await page.waitForFunction(() => document.querySelector('#two-d-workspace:not(.hidden)') && /eus_gbd_00_pathology_v2/.test(document.querySelector('#two-d-anatomy-image').getAttribute('src') || ''));
    assert.match(await page.locator('.twod-mode-pill').innerText(), /经球部/);
    assert.equal(await page.locator('#twod-gbd-instruments .visual-inst-card').count(), 4);
    assert.match(await page.locator('#twod-gbd-branch-selector').innerText(), /十二指肠球部/);

    const canvas = page.locator('#twod-canvas');
    const canvasBox = await canvas.boundingBox();
    const dropAt = async (tool) => {
      const card = page.locator('#twod-gbd-instruments [data-tool="' + tool + '"]');
      await card.scrollIntoViewIfNeeded();
      await card.dragTo(canvas, { targetPosition: { x: canvasBox.width * .49, y: canvasBox.height * .47 } });
      await page.waitForTimeout(2050);
    };

    await page.locator('#twod-target-zone').click({ force: true });
    await page.locator('[data-gbd-branch=direct]').click();
    assert.equal(await page.locator('#twod-gbd-instruments').evaluate(panel => panel.classList.contains('gbd-direct-mode')), true);
    assert.equal(await page.locator('#twod-gbd-instruments [data-tool=gbd_needle]').isVisible(), false);
    await dropAt('gbd_lams');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_gbd_04_direct_ec_lams_v2\.png$/, 'A clinician may directly review the direct EC-LAMS frame');
    assert.match(await page.locator('#twod-message').innerText(), /已跳转/);
    await dropAt('gbd_echoendoscope');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_gbd_01_eus_localization_v2\.png$/);
    await dropAt('gbd_lams');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_gbd_04_direct_ec_lams_v2\.png$/, 'Direct path must use a dedicated EC-LAMS contact frame');
    assert.equal(await page.locator('#twod-effect-layer .twod-effect').count(), 0, 'GBD uses device-in-anatomy frames, not vector pseudo-instruments');
    assert.match(await page.locator('#twod-gbd-path-status').innerText(), /均已查看/);
    await page.screenshot({ path: path.resolve(__dirname, '../scratch_verify/gbd_direct_ec_lams.png') });
    console.log('PASS: direct EC-LAMS keeps its own transduodenal frame with non-blocking sequence guidance');

    await page.locator('#twod-compare-toggle').click();
    const comparisonImages = await page.locator('#twod-compare-view figure img').evaluateAll(images => images.map(image => image.getAttribute('src')));
    assert.match(comparisonImages[0], /eus_gbd_00_pathology_v2\.png$/);
    assert.match(comparisonImages[1], /eus_gbd_05_decompressed_v2\.png$/);
    assert.notEqual(comparisonImages[0], comparisonImages[1]);
    await page.locator('#twod-compare-close').click();
    await page.locator('#twod-reset').click();
    await page.waitForFunction(() => document.querySelectorAll('.twod-point-marker:not(.hidden)').length === 6);
    await page.locator('.twod-procedure-button[data-procedure=eus_gbd]').click();
    await page.waitForFunction(() => /eus_gbd_00_pathology_v2/.test(document.querySelector('#two-d-anatomy-image').getAttribute('src') || ''));
    await page.locator('#twod-target-zone').click({ force: true });
    assert.equal(await page.locator('[data-gbd-branch=wire]').evaluate(button => button.classList.contains('active')), true);
    await dropAt('gbd_lams');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_gbd_04_lams_drainage_v2\.png$/, 'A clinician may directly review the wire-assisted LAMS frame');
    await dropAt('gbd_echoendoscope');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_gbd_01_eus_localization_v2\.png$/);
    await dropAt('gbd_needle');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_gbd_02_needle_confirm_v2\.png$/);
    await dropAt('gbd_guidewire');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_gbd_03_guidewire_v2\.png$/);
    await dropAt('gbd_lams');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_gbd_04_lams_drainage_v2\.png$/, 'Wire-assisted path must use the dedicated LAMS frame');
    assert.equal(await page.locator('#twod-effect-layer .twod-effect').count(), 0);
    assert.match(await page.locator('#twod-gbd-path-status').innerText(), /均已查看/);
    await page.screenshot({ path: path.resolve(__dirname, '../scratch_verify/gbd_wire_assisted_lams.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: wire-assisted GBD keeps a distinct route while every step remains directly reviewable');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
