import { defineConfig } from 'oxfmt'

export default defineConfig({
  printWidth: 80,
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  sortPackageJson: false,
  ignorePatterns: ['**/dist/', '**/coverage/', '.agents/'],
})
