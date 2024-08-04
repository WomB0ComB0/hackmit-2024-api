const { build } = require('esbuild');

build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outdir: 'dist',
  external: ["fs/promises", "path", "url"],
}).catch(() => process.exit(1));
