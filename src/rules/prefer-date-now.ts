import type {Rule} from 'eslint';
import type {CallExpression, UnaryExpression, NewExpression} from 'estree';

function getDateNowReplacement(node: NewExpression): string | null {
  if (node.type !== 'NewExpression' || node.arguments.length !== 0) {
    return null;
  }

  if (node.callee.type === 'Identifier' && node.callee.name === 'Date') {
    return 'Date.now()';
  }

  if (
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    (node.callee.object.name === 'window' ||
      node.callee.object.name === 'globalThis') &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'Date' &&
    !node.callee.computed
  ) {
    return `${node.callee.object.name}.Date.now()`;
  }

  return null;
}

export const preferDateNow: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Date.now() over new Date().getTime() and +new Date()',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferDateNow: 'Use Date.now() to avoid allocating a new Date object.'
    }
  },
  create(context) {
    return {
      // new Date().getTime()
      CallExpression(node: CallExpression) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'NewExpression' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'getTime' &&
          !node.callee.computed &&
          node.arguments.length === 0
        ) {
          const replacement = getDateNowReplacement(node.callee.object);
          if (replacement) {
            context.report({
              node,
              messageId: 'preferDateNow',
              fix(fixer) {
                return fixer.replaceText(node, replacement);
              }
            });
          }
        }
      },

      // +new Date()
      UnaryExpression(node: UnaryExpression) {
        if (node.operator === '+' && node.argument.type === 'NewExpression') {
          const replacement = getDateNowReplacement(node.argument);
          if (replacement) {
            context.report({
              node,
              messageId: 'preferDateNow',
              fix(fixer) {
                return fixer.replaceText(node, replacement);
              }
            });
          }
        }
      }
    };
  }
};
