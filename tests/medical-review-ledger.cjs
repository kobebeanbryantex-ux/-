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
    await page.waitForFunction(() => window.MedicalReviewRegistry && Object.keys(window.MedicalReviewRegistry.modules || {}).length === 15 && !!document.querySelector('[data-medical-review-ledger]'));

    assert.equal(await page.evaluate(() => window.MedicalReviewRegistry.evidenceVersion), '2026-09-29');
    await page.locator('[data-medical-review-ledger]').first().click();
    await page.locator('#twod-medical-review-ledger:not(.hidden)').waitFor();
    assert.match(await page.locator('.twod-review-dialog').innerText(), /医学依据\s*\/\s*审核台账/);
    assert.match(await page.locator('.twod-review-sources').innerText(), /ASGE|ESGE/);
    await page.screenshot({ path: path.resolve(__dirname, '../scratch_verify/medical_review_ledger.png') });

    await page.locator('#twod-review-procedure').selectOption('edat');
    await page.waitForFunction(() => document.querySelector('#twod-review-procedure').value === 'edat');
    assert.match(await page.locator('.twod-review-sources').innerText(), /41278158/);
    await page.locator('#twod-review-status').selectOption('in_review');
    await page.locator('#twod-review-reviewer').fill('测试审核人');
    await page.locator('#twod-review-role').fill('结直肠内镜专科');
    await page.locator('#twod-review-date').fill('2026-09-29');
    await page.locator('#twod-review-note').fill('需在正式上线前核对患者选择与术后随访措辞。');
    await page.locator('#twod-save-review-record').click();
    await page.waitForFunction(() => document.querySelector('#twod-review-reviewer').value === '测试审核人');
    assert.match(await page.locator('[data-medical-review-progress]').first().innerText(), /1\s*\/\s*15/);

    await page.locator('#twod-medical-review-close').click();
    await page.locator('[data-medical-review-ledger]').first().click();
    await page.locator('#twod-review-procedure').selectOption('edat');
    assert.equal(await page.locator('#twod-review-reviewer').inputValue(), '测试审核人');
    assert.equal(await page.locator('#twod-review-date').inputValue(), '2026-09-29');
    assert.equal(await page.locator('#twod-export-review-ledger').isVisible(), true);
    assert.deepEqual(errors, []);
    console.log('PASS: 15-module evidence register, local reviewer/date record and persistent review ledger UI');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
