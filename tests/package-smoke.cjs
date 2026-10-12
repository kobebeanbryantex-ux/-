/* Run against an extracted trial ZIP: node tests/package-smoke.cjs <folder> */
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(path.join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }

(async () => {
  const unpacked = path.resolve(process.argv[2] || 'scratch_verify/package_smoke_2026-10-07');
  const cdpEndpoint = process.env.EUS_NATIVE_CDP;
  const browser = cdpEndpoint
    ? await playwright.chromium.connectOverCDP(cdpEndpoint)
    : await playwright.chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = cdpEndpoint
      ? browser.contexts()[0].pages()[0]
      : await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.setDefaultTimeout(15000);
    const errors = [];
    const missing = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => {
      if (request.url().startsWith('file:') && /ERR_FILE_NOT_FOUND/.test(request.failure()?.errorText || '')) missing.push(decodeURI(request.url()));
    });
    if (!cdpEndpoint) await page.goto(pathToFileURL(path.join(unpacked, 'index.html')).href);
    else await page.reload();
    await page.waitForFunction(() => window.MedicalReviewRegistry && document.querySelector('#card-appendix') && allModelObjects.some(mesh => mesh.name === 'Organ_Appendix') && document.querySelectorAll('.twod-procedure-button').length === 15);
    assert.equal(await page.locator('.twod-point-marker:not(.hidden)').count(), 0);
    await page.getByRole('button', { name: '✨ 全部展示', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.twod-point-marker:not(.hidden)').length === 15);
    const keys = await page.locator('.twod-procedure-button').evaluateAll(rows => rows.map(row => row.dataset.procedure));
    for (const key of keys) {
      await page.locator(`.twod-procedure-button[data-procedure="${key}"]`).click();
      await page.waitForFunction(() => {
        const img = document.querySelector('#two-d-anatomy-image');
        return document.querySelector('#two-d-workspace:not(.hidden)') && img?.complete && img.naturalWidth > 0;
      });
      const visibleTools = page.locator('#sidebar-instruments .visual-inst-card:visible');
      assert.ok(await visibleTools.count() > 0, `${key}: instrument shelf empty`);
      const cardImages = await visibleTools.locator('img').evaluateAll(images => images.map(img => ({ src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0 })));
      assert.ok(cardImages.every(img => img.loaded), `${key}: instrument image missing: ${JSON.stringify(cardImages.filter(img => !img.loaded))}`);
      const initialImage = await page.locator('#two-d-anatomy-image').getAttribute('src');
      await page.locator('#twod-target-zone').click({ force: true });
      const firstTool = visibleTools.first();
      await firstTool.scrollIntoViewIfNeeded();
      await firstTool.dragTo(page.locator('#twod-target-zone'), { force: true });
      await page.waitForFunction(before => {
        const img = document.querySelector('#two-d-anatomy-image');
        return img?.complete && img.naturalWidth > 0 && img.getAttribute('src') !== before;
      }, initialImage);
      await page.locator('#twod-reset').click();
    }
    for (const [key, tool] of [['eus_ge', 'hotaxios'], ['edat', 'edat_appendicoscope']]) {
      await page.locator(`.twod-procedure-button[data-procedure="${key}"]`).click();
      await page.locator('#twod-target-zone').click({ force: true });
      const card = page.locator(`#sidebar-instruments .visual-inst-card[data-tool="${tool}"]:visible`);
      const canvas = page.locator('#twod-canvas');
      const box = await canvas.boundingBox();
      await card.scrollIntoViewIfNeeded();
      const dropAt = key === 'eus_ge' ? { x: box.width * .55, y: box.height * .63 } : { x: box.width * .43, y: box.height * .44 };
      await card.dragTo(canvas, { targetPosition: dropAt });
      const expected = key === 'eus_ge' ? '04_hotaxios_puncture' : 'edat_03_appendicoscope';
      await page.waitForFunction(expectedName => {
        const img = document.querySelector('#two-d-anatomy-image');
        return img?.complete && img.naturalWidth > 0 && img.getAttribute('src')?.includes(expectedName);
      }, expected);
      assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), new RegExp(expected));
      await page.locator('#twod-reset').click();
    }
    await page.locator('[data-medical-review-ledger]').first().click();
    assert.equal(await page.locator('#twod-review-procedure option').count(), 15);
    assert.deepEqual(errors, [], 'Browser JavaScript errors');
    assert.deepEqual(missing, [], `Missing local resources: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ` (and ${missing.length - 8} more)` : ''}`);
    console.log(JSON.stringify({ result: 'PASS', runtime: cdpEndpoint ? 'native-WebView2' : 'Edge', procedures: keys.length, imageCardsChecked: true, instrumentDrags: keys.length + 2, medicalLedger: true, missingLocalRequests: 0 }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
