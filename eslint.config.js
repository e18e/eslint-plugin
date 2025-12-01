import eslintjs from '@eslint/js';
import tseslint from 'typescript-eslint';
import {defineConfig} from 'eslint/config';

export default defineConfig([
  {
    files: ['src/**/*.ts'],
    plugins: {
      eslint: eslintjs,
      typescript: tseslint
    },
    extends: [
      tseslint.configs.strict,
      eslintjs.configs.recommended
    ]
  },
]);
