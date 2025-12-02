import type {Rule} from 'eslint';
import type {CallExpression} from 'estree';

function getObjectPrototypeHasOwnPropertyArgs(
  node: CallExpression
): CallExpression['arguments'] | null {
  if (
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'call'
  ) {
    const hasOwnPropertyExpr = node.callee.object;
    if (
      hasOwnPropertyExpr.type === 'MemberExpression' &&
      hasOwnPropertyExpr.property.type === 'Identifier' &&
      hasOwnPropertyExpr.property.name === 'hasOwnProperty' &&
      hasOwnPropertyExpr.object.type === 'MemberExpression' &&
      hasOwnPropertyExpr.object.property.type === 'Identifier' &&
      hasOwnPropertyExpr.object.property.name === 'prototype' &&
      hasOwnPropertyExpr.object.object.type === 'Identifier' &&
      hasOwnPropertyExpr.object.object.name === 'Object'
    ) {
      return node.arguments;
    }
  }
  return null;
}

export const preferObjectHasOwn: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Object.hasOwn() over Object.prototype.hasOwnProperty.call() and obj.hasOwnProperty()',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferObjectHasOwn: 'Use Object.hasOwn() instead of hasOwnProperty'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: CallExpression) {
        // Check for Object.prototype.hasOwnProperty.call(obj, prop)
        const prototypeArgs = getObjectPrototypeHasOwnPropertyArgs(node);
        if (prototypeArgs && prototypeArgs.length === 2) {
          const [object, property] = prototypeArgs;
          const objectText = sourceCode.getText(object);
          const propertyText = sourceCode.getText(property);

          context.report({
            node,
            messageId: 'preferObjectHasOwn',
            fix(fixer) {
              return fixer.replaceText(
                node,
                `Object.hasOwn(${objectText}, ${propertyText})`
              );
            }
          });
          return;
        }

        // Check for obj.hasOwnProperty(prop)
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'hasOwnProperty' &&
          node.arguments.length === 1
        ) {
          const object = node.callee.object;
          const property = node.arguments[0]!;
          const objectText = sourceCode.getText(object);
          const propertyText = sourceCode.getText(property);

          context.report({
            node,
            messageId: 'preferObjectHasOwn',
            fix(fixer) {
              return fixer.replaceText(
                node,
                `Object.hasOwn(${objectText}, ${propertyText})`
              );
            }
          });
        }
      }
    };
  }
};
