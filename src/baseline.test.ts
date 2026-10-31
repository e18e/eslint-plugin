import {describe, it, expect} from 'vitest';
import plugin from './main.js';
import baselinePlugin, {config} from './baseline.js';

describe('baseline entry', () => {
  it('adds baseline-target to the main plugin', () => {
    expect(baselinePlugin).toBe(plugin);
    expect(plugin.rules).toHaveProperty('baseline-target');
  });

  it('exports a config that enables baseline-target', () => {
    expect(config.plugins?.e18e).toBe(plugin);
    expect(config.rules).toEqual({'e18e/baseline-target': 'error'});
  });
});
