import type {Rule} from 'eslint';
import type {CallExpression} from 'estree';

export const preferExponentiationOperator: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer the exponentiation operator ** over Math.pow()',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferExponentiation: 'Use the ** operator instead of Math.pow()'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: CallExpression) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.object.type !== 'Identifier' ||
          node.callee.object.name !== 'Math' ||
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'pow'
        ) {
          return;
        }

        const base = node.arguments[0];
        const exponent = node.arguments[1];

        if (!base || !exponent || node.arguments.length !== 2) {
          return;
        }

        context.report({
          node,
          messageId: 'preferExponentiation',
          fix(fixer) {
            const baseText = sourceCode.getText(base);
            const exponentText = sourceCode.getText(exponent);

            return fixer.replaceText(
              node,
              `(${baseText}) ** (${exponentText})`
            );
          }
        });
      }
    };
  }
};
