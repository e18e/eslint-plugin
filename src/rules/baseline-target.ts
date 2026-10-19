import {createRequire} from 'node:module';
import path from 'node:path';
import type {TSESLint} from '@typescript-eslint/utils';
import {
  baselineStatusOf,
  detectFeaturesForSource,
  yearOf
} from 'baseline-detector';
import {tryGetTypedParserServices} from '../utils/typescript.js';

type MessageIds = 'notBaseline' | 'exceedsYear';

const BASELINE_YEAR = 2023;

export const baselineTarget: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'problem',
    languages: ['js/js', 'css/css'],
    docs: {
      description: `Disallow features newer than Baseline ${BASELINE_YEAR}`
    },
    schema: [],
    messages: {
      notBaseline: '`{{feature}}` is not Baseline yet',
      exceedsYear:
        '`{{feature}}` is Baseline {{year}}, above the {{floor}} floor'
    }
  },
  defaultOptions: [],
  create(context) {
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
        const status = baselineStatusOf(feature.id);
        const year = yearOf(feature.id);

        for (const [start, end] of feature.ranges) {
          const loc = {
            start: context.sourceCode.getLocFromIndex(start),
            end: context.sourceCode.getLocFromIndex(end)
          };

          if (status === false) {
            context.report({
              loc,
              messageId: 'notBaseline',
              data: {feature: feature.id}
            });
          } else if (year !== null && year > BASELINE_YEAR) {
            context.report({
              loc,
              messageId: 'exceedsYear',
              data: {feature: feature.id, year, floor: BASELINE_YEAR}
            });
          }
        }
      }
    };

    return {
      Program: check,
      StyleSheet: check
    };
  }
};
