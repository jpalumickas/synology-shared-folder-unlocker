import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/server/index.ts'],
  outDir: 'dist/server',
  format: 'esm',
  target: 'node25',
  platform: 'node',
  deps: {
    alwaysBundle: [/^@synology-shared-folder-unlocker\//],
    neverBundle: ['ssh2'],
  },
  // Application bundle, not a published package - no type declarations needed.
  dts: false,
  clean: true,
})
