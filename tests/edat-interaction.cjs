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
    await page.waitForFunction(() => document.querySelector('#card-appendix') && allModelObjects.some(item => item.name === 'Organ_Appendix') && !!document.querySelector('.twod-procedure-button[data-procedure=edat]'));
    assert.equal(await page.locator('.twod-point-marker:not(.hidden)').count(), 0, 'No procedure point is shown before its organ is staged');
    await page.locator('#card-appendix').dragTo(page.locator('#stage-viewport'));
    await page.waitForFunction(() => document.querySelector('#twod-point-marker-edat:not(.hidden)'));
    await page.locator('.twod-procedure-button[data-procedure=edat]').click();
    await page.waitForFunction(() => document.querySelector('#two-d-workspace:not(.hidden)') && /edat_00_appendicolith_v1/.test(document.querySelector('#two-d-anatomy-image').getAttribute('src') || ''));
    assert.equal(await page.locator('#twod-edat-instruments .visual-inst-card').count(), 5, 'All EDAT teaching instruments, including the optional drainage branch, must show in the right shelf');
    assert.match(await page.locator('#twod-edat-instruments [data-tool=edat_stent]').innerText(), /按需/);
    const geometry = await page.locator('#twod-edat-instruments').evaluate(panel => {
      const card = panel.querySelector('.visual-inst-card');
      const a = panel.getBoundingClientRect(), b = card.getBoundingClientRect();
      return { panelWidth: a.width, cardWidth: b.width, direction: getComputedStyle(panel).flexDirection };
    });
    assert.equal(geometry.direction, 'column');
    assert.ok(geometry.cardWidth > geometry.panelWidth * .7, 'EDAT tool cards must retain usable full width');
    await page.locator('#twod-target-zone').click({ force: true });
    const canvas = page.locator('#twod-canvas');
    const box = await canvas.boundingBox();
    const dropAt = async key => {
      const card = page.locator('#twod-edat-instruments [data-tool="' + key + '"]');
      await card.scrollIntoViewIfNeeded();
      await card.dragTo(canvas, { targetPosition: { x: box.width * .43, y: box.height * .44 } });
      await page.waitForTimeout(2050);
    };
    await dropAt('edat_stent');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /edat_05_drainage_stent_v1\.png$/, 'The optional drainage frame remains directly reviewable');
    assert.match(await page.locator('#twod-message').innerText(), /已跳转/);
    await dropAt('edat_colonoscope');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /edat_01_colonoscope_orifice_v1\.png$/);
    await dropAt('edat_guidewire');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /edat_02_guidewire_v1\.png$/);
    await dropAt('edat_appendicoscope');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /edat_03_appendicoscope_v1\.png$/);
    await dropAt('edat_basket');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /edat_04_basket_retrieval_v1\.png$/);
    await dropAt('edat_stent');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /edat_05_drainage_stent_v1\.png$/);
    assert.equal(await page.locator('#twod-effect-layer .twod-effect').count(), 0, 'EDAT must use its own anatomy frames rather than vector pseudo-instruments');
    await page.screenshot({ path: path.resolve(__dirname, '../scratch_verify/edat_completed_pathway.png') });
    await page.locator('#twod-compare-toggle').click();
    assert.match(await page.locator('.twod-compare-view figure:first-child img').getAttribute('src'), /edat_00_appendicolith_v1\.png$/);
    assert.match(await page.locator('.twod-compare-view figure:last-child img').getAttribute('src'), /edat_05_drainage_stent_v1\.png$/);
    assert.notEqual(await page.locator('.twod-compare-view figure:first-child img').getAttribute('src'), await page.locator('.twod-compare-view figure:last-child img').getAttribute('src'));
    assert.deepEqual(errors, []);
    console.log('PASS: EDAT labels the drainage support as optional and keeps every frame directly reviewable');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
