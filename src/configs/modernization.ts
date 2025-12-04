import type {Linter, ESLint} from 'eslint';

export const modernization = (plugin: ESLint.Plugin): Linter.Config => ({
  plugins: {
    e18e: plugin
  },
  rules: {
    'e18e/prefer-array-at': 'error',
    'e18e/prefer-array-fill': 'error',
    'e18e/prefer-includes': 'error',
    'e18e/prefer-array-to-reversed': 'error',
    'e18e/prefer-array-to-sorted': 'error',
    'e18e/prefer-array-to-spliced': 'error',
    'e18e/prefer-object-has-own': 'error',
    'e18e/prefer-spread-syntax': 'error',
    'e18e/prefer-url-canparse': 'error'
  }
});
