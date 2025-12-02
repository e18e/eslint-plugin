import eslintjs from '@eslint/js';
import tseslint from 'typescript-eslint';
import {defineConfig} from 'eslint/config';
import eslintPlugin from 'eslint-plugin-eslint-plugin';
import e18ePlugin from './lib/main.js';

export default defineConfig([
  {
    files: ['src/**/*.ts'],
    plugins: {
      eslint: eslintjs,
      typescript: tseslint,
      'eslint-plugin': eslintPlugin
    },
    extends: [
      tseslint.configs.strict,
      eslintjs.configs.recommended,
      eslintPlugin.configs.recommended
    ],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  },
  {
    files: ['src/**/*.ts'],
    ...e18ePlugin.configs.recommended
  }
]);
