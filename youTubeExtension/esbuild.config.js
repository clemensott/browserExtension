const start = Date.now();
require('esbuild').build({
    entryPoints: [
        'src/content.js',
        'src/fast.js',
        'src/fastInsite.js',
        'src/insite.js',
        'src/options.js',
    ],
    outdir: 'dist',
    bundle: true,
    minify: true,
    alias: {
        '@mui/styled-engine': '@mui/styled-engine-sc',
    },
})
    .then(() => console.log(`⚡ Build in ${((Date.now() - start) / 1000).toFixed(2)} seconds`))
    .catch(() => process.exit(1));
