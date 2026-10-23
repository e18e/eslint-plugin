import {describe, it, expect} from 'vitest';
import {getBaselineDetector} from './baseline-detector.js';

describe('getBaselineDetector', () => {
  it('points to the baseline entry when it has not been initialised', () => {
    expect(() => getBaselineDetector()).toThrow('@e18e/eslint-plugin/baseline');
  });
});
