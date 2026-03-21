import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {getArrayFromCopyPattern} from '../utils/ast.js';
import {isArrayType} from '../utils/typescript.js';

type MessageIds = 'preferToReversed';

export const preferArrayToReversed: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.prototype.toReversed() over copying and reversing arrays'
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferToReversed:
        'Use {{array}}.toReversed() instead of copying and reversing'
    }
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'reverse'
        ) {
          return;
        }

        const reverseCallee = node.callee.object;
        const arrayNode = getArrayFromCopyPattern(reverseCallee);

        if (arrayNode) {
          if (!isArrayType(arrayNode, context)) {
            return;
          }

          const arrayText = sourceCode.getText(arrayNode);

          context.report({
            node,
            messageId: 'preferToReversed',
            data: {
              array: arrayText
            },
            fix(fixer) {
              return fixer.replaceText(node, `${arrayText}.toReversed()`);
            }
          });
        }
      }
    };
  }
};
