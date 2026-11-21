const { copyFileSync, mkdirSync } = require('node:fs');
const { dirname, join } = require('node:path');

const publicAssets = join(__dirname, '..', 'public', 'ocr-assets');
const tesseract = dirname(require.resolve('tesseract.js/package.json'));
const core = dirname(require.resolve('tesseract.js-core/package.json'));
mkdirSync(publicAssets, { recursive: true });

const assets = [[join(tesseract, 'dist', 'worker.min.js'), 'worker.min.js']];
for (const name of ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js']) {
    assets.push([join(core, name), name]);
}
for (const language of ['eng', 'jpn']) {
    const model = dirname(require.resolve(`@tesseract.js-data/${language}/package.json`));
    assets.push([join(model, '4.0.0_best_int', `${language}.traineddata.gz`), `${language}.traineddata.gz`]);
}
for (const [source, target] of assets) copyFileSync(source, join(publicAssets, target));
