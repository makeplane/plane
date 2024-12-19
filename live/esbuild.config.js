import * as esbuild from 'esbuild'

const baseConfig = {
  entryPoints: ['src/start.ts'],
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  sourcemap: true,
  target: 'node18',
  format: 'esm',
  external: ['@plane/editor/lib'],
  loader: {
    '.node': 'file'
  }
}

const args = process.argv.slice(2)
const watch = args.includes('--watch')

if (watch) {
  const ctx = await esbuild.context({
    ...baseConfig,
    sourcemap: true,
  })
  await ctx.watch()
} else {
  await esbuild.build(baseConfig)
}
