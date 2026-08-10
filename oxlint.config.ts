import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['eslint', 'typescript', 'react', 'import'],
  categories: {
    correctness: 'error',
    suspicious: 'error',
    perf: 'error',
  },
  rules: {
    'typescript/no-non-null-assertion': 'error',
    curly: 'error',
    // React 19 automatic JSX runtime, no React import needed
    'react/react-in-jsx-scope': 'off',
    // Side-effect imports are how Vite loads global CSS
    'import/no-unassigned-import': 'off',
    // Polling and SSH work is intentionally sequential
    'no-await-in-loop': 'off',
  },
  overrides: [
    {
      // Vendored shadcn components
      files: ['packages/theme/src/components/ui/**'],
      rules: {
        'react/no-array-index-key': 'off',
      },
    },
  ],
  ignorePatterns: ['**/dist/', '**/coverage/', '.agents/'],
})
