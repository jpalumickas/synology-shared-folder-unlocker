import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server/index.ts'],
  outDir: 'dist/server',
  format: 'esm',
  target: 'node25',
  platform: 'node',
  noExternal: [/^@synology-shared-folder-unlocker\//],
  external: ['ssh2'],
  outExtension: () => ({ js: '.mjs' }),
  clean: true,
})
