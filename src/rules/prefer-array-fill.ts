import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {tryGetTypedParserServices} from '../utils/typescript.js';

type MessageIds =
  | 'preferFillArrayFrom'
  | 'preferFillSpreadMap'
  | 'replaceWithArrayFromFill'
  | 'replaceWithArrayFill';

const TS_FILE_EXTENSION = /\.(?:[cm]?ts|tsx)$/i;
const VUE_FILE_EXTENSION = /\.vue$/i;
const TS_LANG_ATTR = /^tsx?$/i;
// ts.ScriptKind.TS === 3, ts.ScriptKind.TSX === 4
const TS_SCRIPT_KINDS = new Set([3, 4]);

const PRIMITIVE_TYPE_NAMES = new Set([
  'number',
  'string',
  'boolean',
  'bigint',
  'null',
  'undefined'
]);

const BOOLEAN_BINARY_OPERATORS = new Set([
  '===',
  '!==',
  '==',
  '!=',
  '<',
  '<=',
  '>',
  '>=',
  'in',
  'instanceof'
]);

const NUMERIC_BINARY_OPERATORS = new Set([
  '-',
  '*',
  '/',
  '%',
  '**',
  '<<',
  '>>',
  '>>>',
  '&',
  '^',
  '|'
]);

interface VueAttribute {
  type?: string;
  key?: {name?: string};
  value?: {value?: string};
}

interface VueElement {
  type?: string;
  name?: string;
  startTag?: {attributes?: VueAttribute[]};
}

interface VueDocumentFragment {
  children?: VueElement[];
}

function isVueTypeScriptFile(
  context: Readonly<TSESLint.RuleContext<MessageIds, []>>
): boolean {
  const filename = context.filename ?? '';
  if (!VUE_FILE_EXTENSION.test(filename)) {
    return false;
  }

  const services = context.sourceCode.parserServices as
    {getDocumentFragment?: () => VueDocumentFragment | null} | undefined;
  const fragment = services?.getDocumentFragment?.();
  if (!fragment?.children) {
    return false;
  }

  return fragment.children.some(
    (child) =>
      child.type === 'VElement' &&
      child.name === 'script' &&
      child.startTag?.attributes?.some(
        (attr) =>
          attr.type === 'VAttribute' &&
          attr.key?.name === 'lang' &&
          typeof attr.value?.value === 'string' &&
          TS_LANG_ATTR.test(attr.value.value)
      )
  );
}

function isTypeScriptContext(
  context: Readonly<TSESLint.RuleContext<MessageIds, []>>,
  node: TSESTree.CallExpression,
  extraCalls: TSESTree.CallExpression[] = []
): boolean {
  const filename = context.filename ?? '';
  if (TS_FILE_EXTENSION.test(filename)) {
    return true;
  }

  if (isVueTypeScriptFile(context)) {
    return true;
  }

  if (
    node.typeArguments ||
    extraCalls.some((call) => Boolean(call.typeArguments))
  ) {
    return true;
  }

  const services = tryGetTypedParserServices(context);
  if (services) {
    const tsNode = services.esTreeNodeToTSNodeMap.get(node);
    const sourceFile = tsNode?.getSourceFile() as
      {scriptKind?: number; isDeclarationFile?: boolean} | undefined;
    if (
      sourceFile &&
      (sourceFile.isDeclarationFile ||
        (sourceFile.scriptKind !== undefined &&
          TS_SCRIPT_KINDS.has(sourceFile.scriptKind)))
    ) {
      return true;
    }
  }

  return false;
}

function inferPrimitiveTypeFromAst(node: TSESTree.Expression): string | null {
  switch (node.type) {
    case 'Literal': {
      if ('bigint' in node) return 'bigint';
      if ('regex' in node) return null;
      if (node.value === null) return 'null';
      const valueType = typeof node.value;
      return PRIMITIVE_TYPE_NAMES.has(valueType) ? valueType : null;
    }
    case 'Identifier':
      return node.name === 'undefined' ? 'undefined' : null;
    case 'TemplateLiteral':
      return 'string';
    case 'UnaryExpression':
      if (node.operator === '!') return 'boolean';
      if (node.operator === 'typeof') return 'string';
      if (node.operator === 'void') return 'undefined';
      if (node.operator === '+') return 'number';
      if (node.operator === '-' || node.operator === '~') {
        const argType = inferPrimitiveTypeFromAst(node.argument);
        return argType === 'number' || argType === 'bigint' ? argType : null;
      }
      return null;
    case 'BinaryExpression':
      if (BOOLEAN_BINARY_OPERATORS.has(node.operator)) {
        return 'boolean';
      }
      if (node.operator === '>>>') {
        return 'number';
      }
      if (NUMERIC_BINARY_OPERATORS.has(node.operator)) {
        if (node.left.type === 'PrivateIdentifier') {
          return null;
        }
        const leftType = inferPrimitiveTypeFromAst(node.left);
        const rightType = inferPrimitiveTypeFromAst(node.right);
        if (leftType === 'number' && rightType === 'number') {
          return 'number';
        }
        if (leftType === 'bigint' && rightType === 'bigint') {
          return 'bigint';
        }
        return null;
      }
      return null;
    default:
      return null;
  }
}

function inferPrimitiveTypeName(
  node: TSESTree.Expression,
  context: Readonly<TSESLint.RuleContext<MessageIds, []>>
): string | null {
  const services = tryGetTypedParserServices(context);
  if (services) {
    const type = services.getTypeAtLocation(node);
    if (type) {
      const checker = services.program.getTypeChecker();
      const baseType = checker.getBaseTypeOfLiteralType(type);
      const typeName = checker.typeToString(baseType);
      if (PRIMITIVE_TYPE_NAMES.has(typeName)) {
        return typeName;
      }
    }
  }

  return inferPrimitiveTypeFromAst(node);
}

function isConstantExpression(node: TSESTree.Expression): boolean {
  switch (node.type) {
    case 'Literal':
    case 'Identifier':
      return true;
    case 'CallExpression':
    case 'NewExpression':
    case 'ObjectExpression':
    case 'ArrayExpression':
      return false;
    case 'MemberExpression':
      return (
        node.object.type !== 'Super' &&
        isConstantExpression(node.object) &&
        (!node.computed ||
          isConstantExpression(node.property as TSESTree.Expression))
      );
    case 'UnaryExpression':
      return isConstantExpression(node.argument);
    case 'BinaryExpression':
    case 'LogicalExpression':
      return (
        node.left.type !== 'PrivateIdentifier' &&
        isConstantExpression(node.left) &&
        isConstantExpression(node.right)
      );
    case 'ConditionalExpression':
      return (
        isConstantExpression(node.test) &&
        isConstantExpression(node.consequent) &&
        isConstantExpression(node.alternate)
      );
    case 'TemplateLiteral':
      return node.expressions.every((expr) => isConstantExpression(expr));
    default:
      return false;
  }
}

function getCallbackValueNode(
  func: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
): TSESTree.Expression | undefined {
  if (func.body.type === 'BlockStatement') {
    if (func.body.body.length !== 1) return undefined;
    const returnStmt = func.body.body[0];
    if (returnStmt?.type === 'ReturnStatement' && returnStmt.argument) {
      return returnStmt.argument;
    }
    return undefined;
  }
  return func.body;
}

function isConstantCallback(
  func: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
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

export const preferArrayFill: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.prototype.fill() over Array.from or map with constant values'
    },
    fixable: 'code',
    hasSuggestions: true,
    schema: [],
    messages: {
      preferFillArrayFrom:
        'Use `Array.from({length: n}).fill(value)` instead of `Array.from` with a constant callback',
      preferFillSpreadMap:
        'Use `Array(n).fill(value)` instead of spreading `Array(n)` and mapping',
      replaceWithArrayFromFill: 'Replace with `Array.from(...).fill(...)`',
      replaceWithArrayFill: 'Replace with `Array(...).fill(...)`'
    }
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node: TSESTree.CallExpression) {
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
              const valueNode = getCallbackValueNode(secondArg);
              if (!valueNode) {
                return;
              }
              const valueText = sourceCode.getText(valueNode);

              if (isTypeScriptContext(context, node)) {
                const explicitTypeArg =
                  node.typeArguments?.params.length === 2 &&
                  node.typeArguments.params[1]
                    ? sourceCode.getText(node.typeArguments.params[1])
                    : null;
                const typeArg =
                  explicitTypeArg ?? inferPrimitiveTypeName(valueNode, context);
                const replacement = typeArg
                  ? `Array.from<${typeArg}>({length: ${lengthText}}).fill(${valueText})`
                  : `Array.from({length: ${lengthText}}).fill(${valueText})`;

                context.report({
                  node,
                  messageId: 'preferFillArrayFrom',
                  suggest: [
                    {
                      messageId: 'replaceWithArrayFromFill',
                      fix(fixer) {
                        return fixer.replaceText(node, replacement);
                      }
                    }
                  ]
                });
                return;
              }

              context.report({
                node,
                messageId: 'preferFillArrayFrom',
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
              const valueNode = getCallbackValueNode(callback);
              if (!valueNode) {
                return;
              }
              const valueText = sourceCode.getText(valueNode);

              if (
                isTypeScriptContext(context, node, [spreadElement.argument])
              ) {
                const explicitTypeArg =
                  node.typeArguments?.params.length === 1 &&
                  node.typeArguments.params[0]
                    ? sourceCode.getText(node.typeArguments.params[0])
                    : null;
                const typeArg =
                  explicitTypeArg ?? inferPrimitiveTypeName(valueNode, context);
                const replacement = typeArg
                  ? `Array<${typeArg}>(${lengthText}).fill(${valueText})`
                  : `Array(${lengthText}).fill(${valueText})`;

                context.report({
                  node,
                  messageId: 'preferFillSpreadMap',
                  suggest: [
                    {
                      messageId: 'replaceWithArrayFill',
                      fix(fixer) {
                        return fixer.replaceText(node, replacement);
                      }
                    }
                  ]
                });
                return;
              }

              context.report({
                node,
                messageId: 'preferFillSpreadMap',
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
