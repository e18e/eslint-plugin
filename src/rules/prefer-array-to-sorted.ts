import type {Rule} from 'eslint';
import type {CallExpression} from 'estree';
import {isCopyCall} from '../utils/ast.js';

export const preferArrayToSorted: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.prototype.toSorted() over copying and sorting arrays',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferToSorted: 'Use {{array}}.toSorted() instead of copying and sorting'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: CallExpression) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'sort'
        ) {
          return;
        }

        const sortCallee = node.callee.object;

        if (
          sortCallee.type === 'CallExpression' &&
          isCopyCall(sortCallee) &&
          sortCallee.callee.type === 'MemberExpression'
        ) {
          const arrayNode = sortCallee.callee.object;
          const arrayText = sourceCode.getText(arrayNode);
          const sortArgs = node.arguments;
          const argsText =
            sortArgs.length > 0
              ? sortArgs.map((arg) => sourceCode.getText(arg)).join(', ')
              : '';

          context.report({
            node,
            messageId: 'preferToSorted',
            data: {
              array: arrayText
            },
            fix(fixer) {
              return fixer.replaceText(
                node,
                `${arrayText}.toSorted(${argsText})`
              );
            }
          });
          return;
        }

        if (
          sortCallee.type === 'ArrayExpression' &&
          sortCallee.elements.length === 1 &&
          sortCallee.elements[0]?.type === 'SpreadElement'
        ) {
          const spreadArg = sortCallee.elements[0].argument;
          const arrayText = sourceCode.getText(spreadArg);
          const sortArgs = node.arguments;
          const argsText =
            sortArgs.length > 0
              ? sortArgs.map((arg) => sourceCode.getText(arg)).join(', ')
              : '';

          context.report({
            node,
            messageId: 'preferToSorted',
            data: {
              array: arrayText
            },
            fix(fixer) {
              return fixer.replaceText(
                node,
                `${arrayText}.toSorted(${argsText})`
              );
            }
          });
        }
      }
    };
  }
};
