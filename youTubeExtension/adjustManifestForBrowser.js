const process = require('node:process');
const fs = require('node:fs');

function getBrowserType() {
    return process.argv[2]?.toLowerCase();
}

async function main() {
    const json = await fs.promises.readFile('./dist/manifest.json', { encoding: 'utf-8' });
    const manifest = JSON.parse(json);

    const browserType = getBrowserType();
    switch (browserType) {
        case 'chrome':
            delete manifest.background.scripts;
            break;

        case 'firefox':
            delete manifest.background.service_worker;
            break;
            
        default:
            throw new Error(`browser type not supported: ${browserType}`);
    }

    await fs.promises.writeFile('./dist/manifest.json', JSON.stringify(manifest));
}

main();
