const { build } = require('esbuild');
const { nodeExternals } = require('esbuild-node-externals');

build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outdir: 'dist',
  external: [nodeExternals()],
}).catch(() => process.exit(1));
