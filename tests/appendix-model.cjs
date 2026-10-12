/* Geometry regression checks and real Three.js screenshots of the native asset. */
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
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => document.querySelector('#card-appendix') && rootGroup.getObjectByName('Organ_Mesoappendix'));
    const dimensions = await page.evaluate(() => {
      const c = new THREE.Box3().setFromObject(rootGroup.getObjectByName('Organ_Cecum'));
      const a = new THREE.Box3().setFromObject(rootGroup.getObjectByName('Organ_Appendix'));
      const s = new THREE.Box3().setFromObject(rootGroup.getObjectByName('Organ_Stomach_Full'));
      const bowel = new THREE.Box3().setFromObject(rootGroup.getObjectByName('Organ_Jejunum'));
      const mesh = rootGroup.getObjectByName('Organ_Appendix');
      const anchor = new THREE.Vector3().fromArray(mesh.userData.procedureAnchor);
      const vertices = mesh.geometry.attributes.position;
      let closest = Infinity;
      for (let i = 0; i < vertices.count; i++) closest = Math.min(closest, new THREE.Vector3().fromBufferAttribute(vertices, i).distanceTo(anchor));
      return { cecum: c.getSize(new THREE.Vector3()).toArray(), stomach: s.getSize(new THREE.Vector3()).toArray(),
        rightLower: c.max.y < s.min.y && c.getCenter(new THREE.Vector3()).x < bowel.getCenter(new THREE.Vector3()).x,
        connected: c.distanceToPoint(new THREE.Vector3().fromArray(mesh.userData.procedureAnchor)) < .025,
        anchorSurfaceDistance: closest, native: mesh.userData.source, belowStomach: a.max.y < s.min.y };
    });
    assert.ok(dimensions.rightLower && dimensions.belowStomach, 'Cecum and appendix must be in the right lower abdomen, not over the upper organs');
    assert.ok(dimensions.cecum[1] < dimensions.stomach[1], 'The cecal pouch must be smaller than the stomach');
    assert.ok(dimensions.connected, 'Appendiceal root must remain next to the cecal wall');
    assert.ok(dimensions.anchorSurfaceDistance < 1e-5, 'EDAT anchor must lie on an actual appendix surface vertex');
    assert.match(dimensions.native, /Vermiform appendix/);
    assert.equal(await page.locator('.twod-point-marker:not(.hidden)').count(), 0);

    // Render the actual imported 3D meshes, not a separate illustration.
    await page.evaluate(() => {
      const scene = new THREE.Scene(); scene.background = new THREE.Color(0xfffaf5);
      const model = rootGroup.getObjectByName('Organ_Cecum_Appendix_Group').clone(true);
      model.traverse(o => { o.visible = true; }); scene.add(model);
      const box = new THREE.Box3().setFromObject(model), center = box.getCenter(new THREE.Vector3());
      const cam = new THREE.PerspectiveCamera(32, 4/3, .001, 100);
      cam.position.copy(center).add(new THREE.Vector3(.13, .08, .94)); cam.lookAt(center);
      scene.add(new THREE.HemisphereLight(0xfff7ed, 0x69564c, .9));
      const key = new THREE.DirectionalLight(0xfff2e2, 1.6); key.position.set(-2,3,4); scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, .6); fill.position.set(2,0,1); scene.add(fill);
      const preview = new THREE.WebGLRenderer({ antialias:true, preserveDrawingBuffer:true });
      preview.setSize(640,480); preview.outputEncoding = THREE.sRGBEncoding;
      preview.toneMapping = THREE.ACESFilmicToneMapping; preview.toneMappingExposure = 1;
      preview.domElement.id = 'native-appendix-preview';
      Object.assign(preview.domElement.style, { position:'fixed',left:'0',top:'0',zIndex:'999999' });
      document.body.appendChild(preview.domElement); preview.render(scene,cam);
      window.__appendixPreviewRenderer = preview;
    });
    await page.locator('#native-appendix-preview').screenshot({ path:path.resolve(__dirname, '../media/models/cecum_appendix/preview.png') });
    await page.evaluate(() => { document.getElementById('native-appendix-preview').remove(); window.__appendixPreviewRenderer.dispose(); });
    await page.locator('#card-appendix img').evaluate(async img => {
      img.src = img.src.split('?')[0] + '?verified=' + Date.now();
      await img.decode();
    });
    await page.locator('#card-appendix').dragTo(page.locator('#stage-viewport'));
    await page.waitForFunction(() => document.querySelector('#twod-point-marker-edat:not(.hidden)'));
    await page.waitForTimeout(1500);
    await page.screenshot({ path:path.resolve(__dirname, '../scratch_verify/appendix_native_isolated.png') });
    await page.getByRole('button', { name:'✨ 全部展示', exact:true }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path:path.resolve(__dirname, '../scratch_verify/appendix_native_all_organs.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: native meshes, lower-right placement, proportional size, connected surface anchor, drag entry; screenshots captured.');
    console.log(JSON.stringify(dimensions));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
