import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import {execSync} from 'child_process';
import {mkdtempSync} from 'fs';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {join} from 'path';
import {tmpdir} from 'os';

describe('oxlint integration', () => {
  let tempDir: string;
  let configPath: string;

  beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'oxlint-test-'));

    const configTemplate = await readFile(
      join(process.cwd(), 'test/fixtures/oxlint/oxlint.config.json'),
      'utf-8'
    );

    const pluginPath = join(process.cwd(), 'lib', 'main.js');
    const config = configTemplate.replace('<PLUGIN_PATH>', pluginPath);

    configPath = join(tempDir, 'oxlint.config.json');
    await writeFile(configPath, config);
  });

  afterAll(async () => {
    try {
      await rm(tempDir, {recursive: true, force: true});
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should detect violations using the plugin', () => {
    const invalidFile = join(process.cwd(), 'test/fixtures/oxlint/invalid.js');

    try {
      execSync(`npx oxlint -c "${configPath}" "${invalidFile}"`, {
        encoding: 'utf-8',
        cwd: process.cwd()
      });

      expect.fail('Expected oxlint to report violations');
    } catch (error) {
      const errorObj = error as {stdout: string; stderr: string};
      const output = errorObj.stdout + errorObj.stderr;
      expect(output).toContain('e18e(prefer-includes)');
      expect(output).toContain('invalid.js');
    }
  });

  it('should pass when code follows the rule', () => {
    const validFile = join(process.cwd(), 'test/fixtures/oxlint/valid.js');

    const output = execSync(`npx oxlint -c "${configPath}" "${validFile}"`, {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    expect(output).not.toContain('e18e/prefer-includes');
  });
});
