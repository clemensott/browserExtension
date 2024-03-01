const process = require('node:process');
const fs = require('node:fs');

function getBrowserType() {
    return process.argv[2]?.toLowerCase();
}

async function main() {
    const json = await fs.promises.readFile('./manifest.src.json', { encoding: 'utf-8' });
    const manifest = JSON.parse(json);

    const browserType = getBrowserType();
    switch (browserType) {
        case 'chrome':
            delete manifest.background.scripts;
            break;

        case 'firefox':
            delete manifest.background.service_worker;
            delete manifest.background.type;
            break;
            
        default:
            throw new Error(`browser type not supported: ${browserType}`);
    }

    await fs.promises.writeFile('./manifest.json', JSON.stringify(manifest));
}

main();
