import type {Rule, SourceCode} from 'eslint';
import type {
  CallExpression,
  ArrowFunctionExpression,
  FunctionExpression,
  Expression
} from 'estree';

function isConstantExpression(node: Expression): boolean {
  switch (node.type) {
    case 'CallExpression':
    case 'NewExpression':
      return false;
    case 'Literal':
    case 'Identifier':
      return true;
    case 'MemberExpression':
      return (
        isConstantExpression(node.object as Expression) &&
        (!node.computed || isConstantExpression(node.property as Expression))
      );
    case 'UnaryExpression':
      return isConstantExpression(node.argument);
    case 'BinaryExpression':
      return (
        isConstantExpression(node.left as Expression) &&
        isConstantExpression(node.right)
      );
    case 'ArrayExpression':
      return node.elements.every(
        (el) =>
          el === null ||
          (el.type !== 'SpreadElement' && isConstantExpression(el))
      );
    case 'ObjectExpression':
      return node.properties.every(
        (prop) =>
          prop.type === 'Property' &&
          isConstantExpression(prop.value as Expression)
      );
    case 'TemplateLiteral':
      return node.expressions.every((expr) =>
        isConstantExpression(expr as Expression)
      );
    default:
      return false;
  }
}

function getCallbackValueNode(
  func: ArrowFunctionExpression | FunctionExpression
): Expression | undefined {
  if (func.body.type === 'BlockStatement') {
    if (func.body.body.length !== 1) return undefined;
    const returnStmt = func.body.body[0];
    if (returnStmt?.type === 'ReturnStatement' && returnStmt.argument) {
      return returnStmt.argument;
    }
    return undefined;
  }
  return func.body as Expression;
}

function isConstantCallback(
  func: ArrowFunctionExpression | FunctionExpression
): boolean {
  if (func.params.length !== 0) {
    return false;
  }
  const valueNode = getCallbackValueNode(func);
  if (!valueNode) {
    return false;
  }
  return isConstantExpression(valueNode);
}

function getCallbackValueText(
  func: ArrowFunctionExpression | FunctionExpression,
  sourceCode: SourceCode
): string | undefined {
  const valueNode = getCallbackValueNode(func);
  return valueNode ? sourceCode.getText(valueNode) : undefined;
}

export const preferArrayFill: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.prototype.fill() over Array.from or map with constant values',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferFillArrayFrom:
        'Use Array.from({length: {{length}}}).fill({{value}}) instead of Array.from with a constant callback',
      preferFillSpreadMap:
        'Use Array({{length}}).fill({{value}}) instead of spread Array with map'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: CallExpression) {
        // Check for Array.from({length: n}, () => value)
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Array' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'from' &&
          node.arguments.length === 2
        ) {
          const firstArg = node.arguments[0];
          const secondArg = node.arguments[1];

          // Check if first arg is {length: n}
          if (
            firstArg?.type === 'ObjectExpression' &&
            firstArg.properties.length === 1 &&
            firstArg.properties[0]?.type === 'Property' &&
            firstArg.properties[0].key.type === 'Identifier' &&
            firstArg.properties[0].key.name === 'length'
          ) {
            // Check if second arg is a constant callback
            if (
              secondArg &&
              (secondArg.type === 'ArrowFunctionExpression' ||
                secondArg.type === 'FunctionExpression') &&
              isConstantCallback(secondArg)
            ) {
              const lengthValue = firstArg.properties[0].value;
              const lengthText = sourceCode.getText(lengthValue);

              const valueText = getCallbackValueText(secondArg, sourceCode);
              if (!valueText) {
                return;
              }

              context.report({
                node,
                messageId: 'preferFillArrayFrom',
                data: {
                  length: lengthText,
                  value: valueText
                },
                fix(fixer) {
                  return fixer.replaceText(
                    node,
                    `Array.from({length: ${lengthText}}).fill(${valueText})`
                  );
                }
              });
            }
          }
        }

        // Check for [...Array(n)].map(() => value)
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'map' &&
          node.callee.object.type === 'ArrayExpression' &&
          node.callee.object.elements.length === 1 &&
          node.arguments.length === 1
        ) {
          const spreadElement = node.callee.object.elements[0];
          const callback = node.arguments[0];

          if (
            spreadElement?.type === 'SpreadElement' &&
            spreadElement.argument.type === 'CallExpression' &&
            spreadElement.argument.callee.type === 'Identifier' &&
            spreadElement.argument.callee.name === 'Array' &&
            spreadElement.argument.arguments.length === 1
          ) {
            const arrayArg = spreadElement.argument.arguments[0];

            // Check if callback is a constant function
            if (
              callback &&
              (callback.type === 'ArrowFunctionExpression' ||
                callback.type === 'FunctionExpression') &&
              isConstantCallback(callback)
            ) {
              if (!arrayArg) {
                return;
              }
              const lengthText = sourceCode.getText(arrayArg);

              const valueText = getCallbackValueText(callback, sourceCode);
              if (!valueText) {
                return;
              }

              context.report({
                node,
                messageId: 'preferFillSpreadMap',
                data: {
                  length: lengthText,
                  value: valueText
                },
                fix(fixer) {
                  return fixer.replaceText(
                    node,
                    `Array(${lengthText}).fill(${valueText})`
                  );
                }
              });
            }
          }
        }
      }
    };
  }
};
