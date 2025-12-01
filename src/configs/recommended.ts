import type {Linter, ESLint} from 'eslint';

export const recommended = (plugin: ESLint.Plugin): Linter.Config => ({
  plugins: {
    e18e: plugin
  },
  rules: {
    'e18e/prefer-array-at': 'error'
  }
});
