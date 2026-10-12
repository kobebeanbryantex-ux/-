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
    await page.waitForFunction(() => allModelObjects.length > 40 && !!document.querySelector('.twod-procedure-button[data-procedure=esd]'));
    await page.locator('#card-stomach').dragTo(page.locator('#stage-viewport'));
    await page.waitForFunction(() => document.querySelectorAll('.twod-point-marker:not(.hidden)').length === 1);
    await page.locator('.twod-procedure-button[data-procedure=esd]').click();
    await page.waitForFunction(() => document.querySelector('#two-d-workspace:not(.hidden)') && document.querySelector('#two-d-anatomy-image').getAttribute('src'));

    assert.equal(await page.locator('#esd-workspace').count(), 0, 'ESD must use the shared 2D workspace, not a bespoke operation panel');
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /esd_00_gastric_section_v2\.png$/);
    assert.equal(await page.locator('#twod-target-zone').isVisible(), true);
    assert.equal(await page.locator('#twod-esd-instruments .visual-inst-card').count(), 4);
    const assets = await page.locator('#twod-esd-instruments .visual-inst-img').evaluateAll(images => images.map(image => image.getAttribute('src')));
    assert.equal(new Set(assets).size, 4, 'Four ESD instrument cards need distinct assets');
    console.log('PASS: ESD enters through the same point → shared 2D workspace → right tool shelf flow');

    await page.locator('#twod-target-zone').click({ force: true });
    const canvas = page.locator('#twod-canvas');
    const canvasBox = await canvas.boundingBox();
    const dropAt = async (tool, xPercent, yPercent) => {
      await page.locator('#twod-esd-instruments [data-tool="' + tool + '"]').scrollIntoViewIfNeeded();
      await page.locator('#twod-esd-instruments [data-tool="' + tool + '"]').dragTo(canvas, { targetPosition: { x: canvasBox.width * xPercent / 100, y: canvasBox.height * yPercent / 100 } });
      await page.waitForTimeout(2100);
    };
    await dropAt('esd_knife', 50, 44);
    assert.equal(await page.locator('.twod-effect-esd-knife').count(), 1);
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /esd_02_knife_contact_v3\.png$/, 'knife contact must use its dedicated medical illustration frame');
    await page.screenshot({ path: path.resolve(__dirname, '../scratch_verify/esd_knife_contact.png') });
    await dropAt('esd_injector', 50, 44);
    assert.equal(await page.locator('.twod-effect-esd-injector').count(), 1);
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /esd_03_injector_contact_v3\.png$/, 'injector contact must use its dedicated medical illustration frame');
    await page.screenshot({ path: path.resolve(__dirname, '../scratch_verify/esd_injector_contact.png') });
    await dropAt('esd_hemostasis', 50, 44);
    assert.equal(await page.locator('.twod-effect-esd-hemostasis').count(), 1);
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /esd_04_hemostasis_contact_v3\.png$/, 'forceps contact must use its dedicated medical illustration frame');
    await page.screenshot({ path: path.resolve(__dirname, '../scratch_verify/esd_hemostasis_contact.png') });
    await dropAt('esd_retrieval', 50, 44);
    assert.equal(await page.locator('.twod-effect-esd-retrieval').count(), 1);
    assert.match(await page.locator('#two-d-anatomy-image').getAttribute('src'), /esd_05_retrieval_contact_v3\.png$/, 'retrieval contact must use its dedicated medical illustration frame');
    await page.screenshot({ path: path.resolve(__dirname, '../scratch_verify/esd_retrieval_contact.png') });
    console.log('PASS: each ESD device produces its own local visual response in the shared canvas');

    await page.locator('#twod-compare-toggle').click();
    assert.equal(await page.locator('#twod-compare-view').isVisible(), true);
    const comparisonImages = await page.locator('#twod-compare-view figure img').evaluateAll(images => images.map(image => image.getAttribute('src')));
    assert.match(comparisonImages[0], /esd_00_gastric_section_v2\.png$/);
    assert.match(comparisonImages[1], /esd_01_gastric_resection_bed_v2\.png$/);
    assert.notEqual(comparisonImages[0], comparisonImages[1]);
    await page.screenshot({ path: path.resolve(__dirname, '../scratch_verify/esd_shared_flow.png') });
    await page.locator('#twod-compare-close').click();
    await page.locator('#twod-reset').click();
    await page.waitForFunction(() => document.querySelectorAll('.twod-point-marker:not(.hidden)').length === 1);
    assert.deepEqual(errors, []);
    console.log('PASS: distinct comparison images, return to 3D, no runtime errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
