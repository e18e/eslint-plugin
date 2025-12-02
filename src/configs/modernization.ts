import type {Linter, ESLint} from 'eslint';

export const modernization = (plugin: ESLint.Plugin): Linter.Config => ({
  plugins: {
    e18e: plugin
  },
  rules: {
    'e18e/prefer-array-at': 'error',
    'e18e/prefer-array-fill': 'error',
    'e18e/prefer-array-includes': 'error'
  }
});
