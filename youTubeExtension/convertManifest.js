const fs = require('fs');
const path = require('path');
const webpackConfig = require('./webpack.config');


const distPath = (
    webpackConfig.devServer &&
    webpackConfig.devServer.static &&
    webpackConfig.devServer.static.directory
) || path.join(__dirname, 'devDist');
const manifestPath = path.join(distPath, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const port = webpackConfig.devServer && webpackConfig.devServer.port || 8080;
const templateEntryScript = fs.readFileSync('./devEntryTemplate.js', 'utf-8');

function createEntryPoint(def, fileName) {
    const script = templateEntryScript.replace('{ /* <def> */ }', JSON.stringify({ ...def, port }));
    const filePath = path.join(distPath, fileName);
    fs.writeFileSync(filePath, script, 'utf-8');
}

function handleOptionsPage() {
    const openOptionsScriptFileName = 'openOptions.js';
    const originalOptionsPagePath = path.join(distPath, manifest.options_page);
    const optionsFileName = path.basename(originalOptionsPagePath);
    const modifiedOptionsPathPath = path.join(path.dirname(originalOptionsPagePath), `modified_${optionsFileName}`);
    const scriptPath = path.join(distPath, openOptionsScriptFileName);

    const originalOptionsPageHTML = fs.readFileSync(originalOptionsPagePath, 'utf-8');
    const modifiedOptionsPageHTML = originalOptionsPageHTML + `<script src="/${openOptionsScriptFileName}"></script>`;
    const script = `window.location.href = 'http://localhost:${port}/${manifest.options_page}';`;

    fs.writeFileSync(scriptPath, script, 'utf-8');
    fs.writeFileSync(modifiedOptionsPathPath, modifiedOptionsPageHTML, 'utf-8');

    manifest.options_page = modifiedOptionsPathPath.substring(distPath.length + 1);
}

manifest.name = 'DEV: ' + manifest.name;

if (manifest.content_scripts) {
    manifest.content_scripts.forEach((cs, i) => {
        const jsFileName = `index${i}.js`;
        createEntryPoint(cs, jsFileName);

        cs.js = [
            jsFileName,
        ];
        delete cs.css;
    });
}

if (manifest.options_page) {
    handleOptionsPage();
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest));

console.log('created dev version of manifest in:', distPath);
