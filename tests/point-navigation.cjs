/* Run with Node + Playwright. Uses a fresh, headless browser profile. */
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let playwright;
try { playwright = require('playwright'); }
catch {
  playwright = require(path.join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}

(async () => {
  const browser = await playwright.chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => allModelObjects.some(item => item.name === 'Organ_Appendix') && document.querySelector('#card-appendix') && document.querySelectorAll('.twod-procedure-button').length === 15);
    const dotSelector = '.twod-point-marker:not(.hidden)';
    assert.equal(await page.locator(dotSelector).count(), 0, 'Empty workspace must not show surgical points');
    assert.equal(await page.locator('#twod-procedure-entry-marker').count(), 0, 'No single shared floating entrance');
    await page.locator('#card-stomach').dragTo(page.locator('#stage-viewport'));
    await page.waitForTimeout(650);
    assert.equal(await page.locator(dotSelector).count(), 1, 'Stomach alone unlocks only ESD');
    await page.locator('#card-pancreas').dragTo(page.locator('#stage-viewport'));
    await page.waitForFunction(() => document.querySelectorAll('.twod-point-marker:not(.hidden)').length === 5);
    assert.deepEqual((await page.locator(dotSelector).evaluateAll(dots => dots.map(x => x.dataset.procedure))).sort(), ['esd', 'eus_cpn', 'eus_fnb', 'eus_pd', 'eus_pfc']);
    console.log('PASS: real organ drag, prerequisites, empty entry');

    await page.getByRole('button', { name: '✨ 全部展示', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.twod-point-marker:not(.hidden)').length === 15);
    await page.waitForTimeout(1300);
    const keys = await page.locator('.twod-procedure-button').evaluateAll(rows => rows.map(row => row.dataset.procedure));
    assert.equal(new Set(keys).size, 15);

    async function checkAttachmentAndOrder() {
      const result = await page.evaluate(() => {
        const viewport = document.getElementById('stage-viewport').getBoundingClientRect();
        const canvas = renderer.domElement.getBoundingClientRect();
        return [...document.querySelectorAll('.twod-procedure-button')].map(row => {
          const dot = document.getElementById('twod-point-marker-' + row.dataset.procedure);
          const mesh = rootGroup.getObjectByName(dot.dataset.organMesh);
          mesh.updateWorldMatrix(true, false);
          const point = mesh.localToWorld(new THREE.Vector3().fromArray(JSON.parse(dot.dataset.organAnchor))).project(camera);
          const x = (point.x * .5 + .5) * canvas.width + canvas.left - viewport.left;
          const y = (-point.y * .5 + .5) * canvas.height + canvas.top - viewport.top;
          return { key: row.dataset.procedure, y: parseFloat(dot.style.top), delta: Math.hypot(x - parseFloat(dot.style.left), y - parseFloat(dot.style.top)) };
        });
      });
      assert.ok(result.every(row => row.delta < .1), 'Every point must remain attached to its exact local mesh coordinate');
      assert.ok(result.every((row, index) => !index || row.y >= result[index - 1].y - .01), 'Right names must be ordered by vertical projected point position');
    }
    await checkAttachmentAndOrder();
    const before = parseFloat(await page.locator('#twod-point-marker-eus_ge').evaluate(dot => dot.style.getPropertyValue('--dot-size')));
    await page.locator('[data-anatomy-zoom="in"]').click();
    await page.waitForTimeout(200);
    const after = parseFloat(await page.locator('#twod-point-marker-eus_ge').evaluate(dot => dot.style.getPropertyValue('--dot-size')));
    assert.ok(after > before * 1.15, 'Point diameter must grow with organ zoom');
    await checkAttachmentAndOrder();
    await page.evaluate(() => { rootGroup.rotation.z = .12; rootGroup.position.x = .05; rootGroup.scale.setScalar(1.05); });
    await page.waitForTimeout(150);
    await checkAttachmentAndOrder();
    await page.evaluate(() => { rootGroup.rotation.set(0, 0, 0); rootGroup.position.set(0, 0, 0); rootGroup.scale.setScalar(1); });
    await page.locator('[data-anatomy-fit]').click();
    await page.waitForTimeout(1200);
    console.log('PASS: 15 independent points; mesh attachment, zoom, transform and top-to-bottom order');

    for (const key of keys) {
      const dot = page.locator('#twod-point-marker-' + key);
      const position = await dot.boundingBox();
      await page.mouse.move(position.x + position.width / 2, position.y + position.height / 2);
      await page.waitForTimeout(80);
      assert.equal(await page.locator('.twod-procedure-button.active').getAttribute('data-procedure'), key, `Dot hover must highlight ${key}`);
      await page.mouse.click(position.x + position.width / 2, position.y + position.height / 2);
      await page.waitForFunction(() => document.getElementById('stage-viewport').classList.contains('two-d-active'));
      const shortName = key === 'ercp_eye' ? 'ERCP-DSOC' : key === 'biliary_biopsy' ? 'DSOC-Bx' : key.replace('_', '-').toUpperCase();
      assert.match(await page.locator('.twod-mode-pill').innerText(), new RegExp(shortName));
      assert.equal(await page.locator(dotSelector).count(), 0, '3D points hidden in 2D');
      assert.ok(await page.locator('#sidebar-instruments').evaluate(panel => panel.classList.contains('twod-instrument-mode')));
      await page.locator('#twod-reset').click();
      await page.waitForFunction(() => document.querySelectorAll('.twod-point-marker:not(.hidden)').length === 15);
      await page.waitForTimeout(150);
      const row = page.locator('.twod-procedure-button[data-procedure="' + key + '"]');
      await row.hover();
      assert.equal(await page.locator('.twod-point-marker.active').getAttribute('data-procedure'), key, `Right name hover must highlight ${key}`);
      await row.click();
      assert.match(await page.locator('.twod-mode-pill').innerText(), new RegExp(shortName));
      await page.locator('#twod-reset').click();
      await page.waitForFunction(() => document.querySelectorAll('.twod-point-marker:not(.hidden)').length === 15);
    }
    console.log('PASS: all 15 procedures open via both real dot clicks and right-name clicks; two-way hover');
    await page.locator('#twod-toggle-instrument-sidebar').click();
    await page.waitForTimeout(450);
    assert.equal(await page.locator('#twod-toggle-instrument-sidebar').getAttribute('aria-expanded'), 'false');
    await page.locator('#twod-toggle-instrument-sidebar').click();
    await page.waitForTimeout(450);
    assert.equal(await page.locator('.twod-procedure-button').count(), 15);
    await page.getByRole('button', { name: '🗑️ 清空展台', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.twod-point-marker:not(.hidden)').length === 0);
    assert.deepEqual(errors, [], 'Browser must not have runtime errors');
    console.log('PASS: sidebar collapse/expand, clearing organs, no runtime errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
