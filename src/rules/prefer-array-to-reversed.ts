import type {Rule} from 'eslint';
import type {CallExpression} from 'estree';
import {isCopyCall} from '../utils/ast.js';

export const preferArrayToReversed: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.prototype.toReversed() over copying and reversing arrays',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferToReversed:
        'Use {{array}}.toReversed() instead of copying and reversing'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: CallExpression) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'reverse'
        ) {
          return;
        }

        const reverseCallee = node.callee.object;

        if (
          reverseCallee.type === 'CallExpression' &&
          isCopyCall(reverseCallee) &&
          reverseCallee.callee.type === 'MemberExpression'
        ) {
          const arrayText = sourceCode.getText(reverseCallee.callee.object);

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
          return;
        }

        if (
          reverseCallee.type === 'ArrayExpression' &&
          reverseCallee.elements.length === 1 &&
          reverseCallee.elements[0]?.type === 'SpreadElement'
        ) {
          const spreadArg = reverseCallee.elements[0].argument;
          const arrayText = sourceCode.getText(spreadArg);

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
