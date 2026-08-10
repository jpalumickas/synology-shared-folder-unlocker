import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['eslint', 'typescript', 'react', 'import'],
  categories: {
    correctness: 'error',
  },
  rules: {
    'typescript/no-non-null-assertion': 'error',
    curly: 'error',
  },
  ignorePatterns: ['**/dist/', '**/coverage/', '.agents/'],
})
