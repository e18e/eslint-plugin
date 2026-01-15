import {describe, it, expect} from 'vitest';
import {ESLint, type Linter} from 'eslint';
import jsoncParser from 'jsonc-eslint-parser';
import json from '@eslint/json';
import plugin from './main.js';

describe('main plugin', () => {
  it('should run against JSON files using jsonc-eslint-parser', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ['**/*.json'],
          languageOptions: {
            parser: jsoncParser
          }
        },
        plugin.configs!.recommended as Linter.Config
      ]
    });

    const results = await eslint.lintText(
      JSON.stringify({name: 'test', version: '1.0.0'}, null, 2),
      {filePath: 'package.json'}
    );

    expect(results).toBeDefined();
    expect(results).toHaveLength(1);
    expect(results[0]!.messages).toHaveLength(0);
    expect(results[0]!.filePath).toContain('package.json');
  });

  it('should run against JSON files using @eslint/json', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ['**/*.json'],
          plugins: {
            json
          },
          language: 'json/json'
        },
        plugin.configs!.recommended as Linter.Config
      ]
    });

    const results = await eslint.lintText(
      JSON.stringify({name: 'test', version: '1.0.0'}, null, 2),
      {filePath: 'package.json'}
    );

    expect(results).toBeDefined();
    expect(results).toHaveLength(1);
    expect(results[0]!.messages).toHaveLength(0);
    expect(results[0]!.filePath).toContain('package.json');
  });
});
