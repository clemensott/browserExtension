const start = Date.now();
require('esbuild').build({
    entryPoints: [
        'src/content.js',
        'src/insite.js',
    ],
    outdir: 'dist',
    bundle: true,
    minify: true,
})
    .then(() => console.log(`⚡ Build in ${((Date.now() - start) / 1000).toFixed(2)} seconds`))
    .catch(() => process.exit(1));
