import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import {spawnSync} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {extname, join} from 'node:path';
import type {DummyRuleMap, OxlintConfig} from 'oxlint';

type FixtureOptions = {
  rules: DummyRuleMap;
  expectedRules: readonly string[];
};

const fixtures: Record<string, FixtureOptions> = {
  'invalid.js': {
    rules: {'e18e/prefer-includes': 'error'},
    expectedRules: ['prefer-includes']
  },
  'prefer-array-to-sorted.js': {
    rules: {'e18e/prefer-array-to-sorted': 'error'},
    expectedRules: ['prefer-array-to-sorted']
  },
  'valid.js': {
    rules: {'e18e/prefer-includes': 'error'},
    expectedRules: []
  }
};

function runOxlint(configPath: string, fixturePath: string) {
  return spawnSync(
    process.execPath,
    [
      join(process.cwd(), 'node_modules/oxlint/bin/oxlint'),
      '-c',
      configPath,
      fixturePath
    ],
    {encoding: 'utf-8', cwd: process.cwd()}
  );
}

function getReportedRuleNames(output: string): string[] {
  const ruleNames = new Set<string>();

  for (const match of output.matchAll(/e18e\(([^)]+)\)/g)) {
    const ruleName = match[1];
    if (ruleName) {
      ruleNames.add(ruleName);
    }
  }

  return [...ruleNames].sort();
}

describe('oxlint integration', () => {
  let tempDir: string;
  let fixtureDirectory: string;
  let baseConfig: OxlintConfig;

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'oxlint-test-'));
    const pluginPath = join(process.cwd(), 'lib', 'main.js');
    baseConfig = {jsPlugins: [pluginPath]};
    fixtureDirectory = join(process.cwd(), 'test/fixtures/oxlint');
  });

  afterAll(async () => {
    try {
      await rm(tempDir, {recursive: true, force: true});
    } catch {
      // Ignore cleanup errors
    }
  });

  it.each(Object.entries(fixtures))(
    'should lint %s with its configured rules',
    async (fixtureName, options) => {
      const fixturePath = join(fixtureDirectory, fixtureName);
      const configPath = join(tempDir, `${fixtureName}.oxlint.config.json`);
      await writeFile(
        configPath,
        JSON.stringify({...baseConfig, rules: options.rules})
      );

      const result = runOxlint(configPath, fixturePath);
      const output = result.stdout + result.stderr;

      expect(result.error).toBeUndefined();
      expect(output).not.toContain('Error running JS plugin');
      expect(getReportedRuleNames(output)).toEqual(options.expectedRules);
      expect(result.status).toBe(options.expectedRules.length === 0 ? 0 : 1);
    }
  );

  it('should configure every source fixture', async () => {
    const fixtureNames = (await readdir(fixtureDirectory))
      .filter((name) => extname(name) === '.js')
      .toSorted();

    expect(fixtureNames).toEqual(Object.keys(fixtures).toSorted());
  });
});
