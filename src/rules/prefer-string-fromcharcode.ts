import type {Rule} from 'eslint';
import type {CallExpression, Expression, SpreadElement} from 'estree';

const FROM_CHARCODE_LIMIT = 0x10000;

function isFromCharCodeSafeLiteral(
  node: Expression | SpreadElement
): boolean {
  return (
    node.type === 'Literal' &&
    typeof node.value === 'number' &&
    Number.isInteger(node.value) &&
    node.value >= 0 &&
    node.value < FROM_CHARCODE_LIMIT
  );
}

export const preferStringFromCharCode: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer String.fromCharCode() over String.fromCodePoint() for code points below 0x10000',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferFromCharCode:
        'String.fromCharCode is faster than String.fromCodePoint for code points below 0x10000.'
    }
  },
  create(context) {
    return {
      CallExpression(node: CallExpression) {
        if (node.callee.type !== 'MemberExpression') return;
        if (node.callee.computed) return;
        if (
          node.callee.object.type !== 'Identifier' ||
          node.callee.object.name !== 'String'
        )
          return;
        if (
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'fromCodePoint'
        )
          return;
        if (node.arguments.length === 0) return;
        if (!node.arguments.every(isFromCharCodeSafeLiteral)) return;

        const property = node.callee.property;
        context.report({
          node: property,
          messageId: 'preferFromCharCode',
          fix(fixer) {
            return fixer.replaceText(property, 'fromCharCode');
          }
        });
      }
    };
  }
};
