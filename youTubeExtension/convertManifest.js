const fs = require('fs');
const path = require('path');
const webpackConfig = require('./webpack.config');


const distPath = path.join(__dirname, process.argv[2]);
const manifestPath = path.join(distPath, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const port = webpackConfig.devServer && webpackConfig.devServer.port || 8080;
const templateEntryScript = fs.readFileSync('./devEntryTemplate.js', 'utf-8');

function createEntryPoint(def, fileName) {
    const script = templateEntryScript.replace('{ /* <def> */ }', JSON.stringify({ ...def, port }));
    const filePath = path.join(distPath, fileName);
    fs.writeFileSync(filePath, script, 'utf-8');
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

fs.writeFileSync(manifestPath, JSON.stringify(manifest));

console.log('created dev version of manifest in:', distPath);
