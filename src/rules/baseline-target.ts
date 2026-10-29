import {createRequire} from 'node:module';
import path from 'node:path';
import type {TSESLint} from '@typescript-eslint/utils';
import {
  baselineStatusOf,
  detectFeaturesForSource,
  yearOf
} from 'baseline-detector';
import {tryGetTypedParserServices} from '../utils/typescript.js';

type MessageIds = 'notBaseline' | 'notWidelyAvailable' | 'exceedsYear';

type BaselineTarget =
  | {kind: 'widely available'}
  | {kind: 'newly available'}
  | {kind: 'year'; year: number};

interface Violation {
  messageId: MessageIds;
  data: Record<string, string | number>;
}

function property(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null
    ? Reflect.get(value, key)
    : undefined;
}

function parseTarget(value: unknown): BaselineTarget {
  if (value === undefined || value === 'widely available') {
    return {kind: 'widely available'};
  }
  if (value === 'newly available') {
    return {kind: 'newly available'};
  }
  if (typeof value === 'number' && Number.isInteger(value)) {
    return {kind: 'year', year: value};
  }
  throw new Error(
    `Invalid settings.e18e.baseline.target ${JSON.stringify(value)}. Expected "widely available", "newly available" or a year such as 2023.`
  );
}

function checkFeature(
  featureId: string,
  target: BaselineTarget
): Violation | null {
  const status = baselineStatusOf(featureId);
  if (status === null) {
    return null;
  }
  if (status === false) {
    return {messageId: 'notBaseline', data: {feature: featureId}};
  }

  switch (target.kind) {
    case 'newly available':
      return null;
    case 'widely available':
      return status === 'high'
        ? null
        : {messageId: 'notWidelyAvailable', data: {feature: featureId}};
    case 'year': {
      const year = yearOf(featureId);
      return year !== null && year > target.year
        ? {
            messageId: 'exceedsYear',
            data: {feature: featureId, year, floor: target.year}
          }
        : null;
    }
  }
}

export const baselineTarget: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'problem',
    languages: ['js/js', 'css/css'],
    docs: {
      description: 'Disallow features newer than the configured Baseline target'
    },
    schema: [],
    messages: {
      notBaseline: '`{{feature}}` is not Baseline yet',
      notWidelyAvailable: '`{{feature}}` is not widely available yet',
      exceedsYear:
        '`{{feature}}` is Baseline {{year}}, above the {{floor}} floor'
    }
  },
  defaultOptions: [],
  create(context) {
    const target = parseTarget(
      property(
        property(property(context.settings, 'e18e'), 'baseline'),
        'target'
      )
    );
    const services = tryGetTypedParserServices(context);

    const check = (): void => {
      const features = detectFeaturesForSource(context.sourceCode.text, {
        fileName: context.filename,
        ...(services && {
          typescriptContext: {
            ts: createRequire(path.join(context.cwd, 'package.json'))(
              'typescript'
            ),
            program: services.program,
            checker: services.program.getTypeChecker()
          }
        })
      });

      for (const feature of features.get(context.filename) ?? []) {
        const violation = checkFeature(feature.id, target);
        if (!violation) {
          continue;
        }

        for (const [start, end] of feature.ranges) {
          context.report({
            loc: {
              start: context.sourceCode.getLocFromIndex(start),
              end: context.sourceCode.getLocFromIndex(end)
            },
            ...violation
          });
        }
      }
    };

    return {
      Program: check,
      StyleSheet: check
    };
  }
};
