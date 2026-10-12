/* Check that every literal runtime media URL resolves in a packaged app. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.argv[2] || '桌面版输出/EUS_Surgery_Explainer/_internal/app_content');
const scripts = [
  'index.html',
  'two_d_workspace.js',
  'stopmotion_optimizer.js',
  'esd_interaction.js',
  'medical_review_registry.js',
];
const mediaPattern = /["'`]((?:media|00_AI自主生成顶级医学照片库|02_手术推演连贯高清图片帧)\/[^"'`<>\s]+?\.(?:png|jpe?g|webp|gif|svg|js|css|glb))(?:\?[^"'`]*)?["'`]/g;
const references = new Set();
for (const script of scripts) {
  const source = fs.readFileSync(path.join(root, script), 'utf8');
  for (const match of source.matchAll(mediaPattern)) {
    if (!match[1].includes('${') && !match[1].endsWith('/xxx.jpg')) references.add(match[1]);
  }
}
const missing = [...references].filter(relative => !fs.existsSync(path.join(root, relative)));
assert.deepEqual(missing, [], `${missing.length} missing media assets:\n${missing.join('\n')}`);
console.log(JSON.stringify({ result: 'PASS', checkedMediaReferences: references.size, missing: 0 }, null, 2));
