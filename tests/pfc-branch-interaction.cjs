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
    await page.waitForFunction(() => allModelObjects.length > 40 && !!document.querySelector('.twod-procedure-button[data-procedure=eus_pfc]'));
    await page.locator('#card-stomach').dragTo(page.locator('#stage-viewport'));
    await page.locator('#card-pancreas').dragTo(page.locator('#stage-viewport'));
    await page.waitForFunction(() => document.querySelectorAll('.twod-point-marker:not(.hidden)').length === 5);
    await page.locator('.twod-procedure-button[data-procedure=eus_pfc]').click();
    await page.waitForFunction(() => document.querySelector('#two-d-workspace:not(.hidden)') && /eus_pfc_00_pathology_v1/.test(document.querySelector('#two-d-anatomy-image').getAttribute('src') || ''));
    assert.equal(await page.locator('#twod-pfc-instruments .visual-inst-card').count(), 4);
    assert.equal(await page.locator('#twod-pfc-branch-selector').isVisible(), true);

    const canvas = page.locator('#twod-canvas');
    const canvasBox = await canvas.boundingBox();
    const dropAt = async (tool) => {
      const card = page.locator('#twod-pfc-instruments [data-tool="' + tool + '"]');
      await card.scrollIntoViewIfNeeded();
      await card.dragTo(canvas, { targetPosition: { x: canvasBox.width * .55, y: canvasBox.height * .60 } });
      await page.waitForTimeout(2050);
    };

    await page.locator('#twod-target-zone').click({ force: true });
    await page.locator('[data-pfc-branch=direct]').click();
    assert.equal(await page.locator('#twod-pfc-instruments').evaluate(panel => panel.classList.contains('pfc-direct-mode')), true);
    assert.equal(await page.locator('#twod-pfc-instruments [data-tool=pfc_needle]').isVisible(), false);
    assert.equal(await page.locator('#twod-pfc-instruments [data-tool=pfc_guidewire]').isVisible(), false);
    await dropAt('pfc_lams');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_pfc_04_direct_ec_lams_v1\.png$/, 'A clinician may directly review the EC-LAMS frame without being interaction-blocked');
    assert.match(await page.locator('#twod-message').innerText(), /已跳转/);
    await dropAt('pfc_echoendoscope');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_pfc_01_eus_localization_v1\.png$/);
    await dropAt('pfc_lams');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_pfc_04_direct_ec_lams_v1\.png$/, 'Direct path must use the dedicated EC-LAMS frame');
    assert.equal(await page.locator('#twod-effect-layer .twod-effect').count(), 0, 'PFC must rely on its medical image frames, not vector pseudo-instruments');
    assert.match(await page.locator('#twod-pfc-branch-status').innerText(), /均已查看/);
    await page.screenshot({ path: path.resolve(__dirname, '../scratch_verify/pfc_direct_ec_lams.png') });
    console.log('PASS: direct EC-LAMS has a distinct selected-path frame and a non-blocking recommended-order hint');

    await page.locator('#twod-reset').click();
    await page.waitForFunction(() => document.querySelectorAll('.twod-point-marker:not(.hidden)').length === 5);
    await page.locator('.twod-procedure-button[data-procedure=eus_pfc]').click();
    await page.waitForFunction(() => /eus_pfc_00_pathology_v1/.test(document.querySelector('#two-d-anatomy-image').getAttribute('src') || ''));
    await page.locator('#twod-target-zone').click({ force: true });
    assert.equal(await page.locator('[data-pfc-branch=wire]').evaluate(button => button.classList.contains('active')), true);
    await dropAt('pfc_lams');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_pfc_04_lams_drainage_v1\.png$/, 'A clinician may directly review the wire-assisted LAMS frame without being interaction-blocked');
    await dropAt('pfc_echoendoscope');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_pfc_01_eus_localization_v1\.png$/);
    await dropAt('pfc_needle');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_pfc_02_needle_puncture_v1\.png$/);
    await dropAt('pfc_guidewire');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_pfc_03_guidewire_v1\.png$/);
    await dropAt('pfc_lams');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /eus_pfc_04_lams_drainage_v1\.png$/, 'Wire-assisted path must use its dedicated guidewire exchange LAMS frame');
    assert.equal(await page.locator('#twod-effect-layer .twod-effect').count(), 0);
    assert.match(await page.locator('#twod-pfc-branch-status').innerText(), /均已查看/);
    await page.screenshot({ path: path.resolve(__dirname, '../scratch_verify/pfc_wire_assisted_lams.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: wire-assisted route keeps its own frames while steps remain directly reviewable');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
