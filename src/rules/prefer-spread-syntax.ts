import type {Rule} from 'eslint';
import type {CallExpression, Expression} from 'estree';

function isNullOrUndefined(node: Expression): boolean {
  if (node.type === 'Literal' && node.value === null) {
    return true;
  }
  return node.type === 'Identifier' && node.name === 'undefined';
}

export const preferSpreadSyntax: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer spread syntax over Array.concat(), Object.assign({}, ...), and Function.apply()',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferSpreadArray:
        'Use spread syntax [...arr, ...other] instead of arr.concat(other)',
      preferSpreadObject:
        'Use spread syntax {...a, ...b} instead of Object.assign({}, a, b)',
      preferSpreadFunction:
        'Use spread syntax fn(...args) instead of fn.apply(null/undefined, args)'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: CallExpression) {
        if (node.callee.type !== 'MemberExpression') {
          return;
        }

        let messageId: string | undefined;
        let replacement: string | undefined;

        // array.concat()
        if (
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'concat' &&
          node.arguments.length > 0
        ) {
          const arrayText = sourceCode.getText(node.callee.object);
          const argTexts = node.arguments.map((arg) => sourceCode.getText(arg));
          const spreadParts = [arrayText, ...argTexts]
            .map((part) => `...${part}`)
            .join(', ');
          replacement = `[${spreadParts}]`;
          messageId = 'preferSpreadArray';
        }
        // Object.assign({...}, ...)
        else if (
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Object' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'assign' &&
          node.arguments.length >= 2
        ) {
          const firstArg = node.arguments[0]!;
          if (
            firstArg.type !== 'SpreadElement' &&
            firstArg.type === 'ObjectExpression'
          ) {
            const hasUnquotedProto = firstArg.properties.some(
              (prop) =>
                prop.type === 'Property' &&
                !prop.computed &&
                prop.key.type === 'Identifier' &&
                prop.key.name === '__proto__'
            );

            if (!hasUnquotedProto) {
              const spreadArgs = node.arguments
                .slice(1)
                .map((arg) => `...${sourceCode.getText(arg)}`)
                .join(', ');

              if (firstArg.properties.length === 0) {
                replacement = `{${spreadArgs}}`;
              } else {
                const literalText = sourceCode.getText(firstArg);
                const innerContent = literalText.slice(1, -1); // Remove { and }
                replacement = `{${innerContent}, ${spreadArgs}}`;
              }
              messageId = 'preferSpreadObject';
            }
          }
        }
        // function.apply(null/undefined, args)
        else if (
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'apply' &&
          node.arguments.length === 2
        ) {
          const firstArg = node.arguments[0]!;
          if (
            firstArg.type !== 'SpreadElement' &&
            isNullOrUndefined(firstArg)
          ) {
            const fnText = sourceCode.getText(node.callee.object);
            const argsText = sourceCode.getText(node.arguments[1]!);
            replacement = `${fnText}(...${argsText})`;
            messageId = 'preferSpreadFunction';
          }
        }

        if (messageId && replacement) {
          context.report({
            node,
            messageId,
            fix(fixer) {
              return fixer.replaceText(node, replacement);
            }
          });
        }
      }
    };
  }
};
