import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {
  isArrayType,
  isSetType,
  tryGetTypedParserServices
} from '../utils/typescript.js';

type MessageIds = 'preferEquality';

/**
 * Checks if a node is safe to repeat (i.e. no side effects)
 */
function isSafeToRepeat(node: TSESTree.Node): boolean {
  if (node.type === 'Identifier') {
    return true;
  }
  if (node.type === 'Literal') {
    return true;
  }
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return true;
  }
  if (node.type === 'MemberExpression' && !node.computed) {
    return isSafeToRepeat(node.object);
  }
  return false;
}

/**
 * Checks if a node is NaN
 */
function isNaN(node: TSESTree.Node): boolean {
  return node.type === 'Identifier' && node.name === 'NaN';
}

/**
 * Checks if an array element is an identifier or literal
 */
function isSimpleElement(node: TSESTree.Node): boolean {
  if (isNaN(node)) {
    return false;
  }
  return node.type === 'Identifier' || node.type === 'Literal';
}

/**
 * Checks if the node is negated
 */
function isNegated(node: TSESTree.Node): boolean {
  return (
    node.parent !== undefined &&
    node.parent.type === 'UnaryExpression' &&
    node.parent.operator === '!'
  );
}

/**
 * Checks if the replacement expression needs to be wrapped in parentheses
 * based on the parent node context
 */
function needsParentheses(node: TSESTree.Node): boolean {
  if (!node.parent) {
    return false;
  }

  switch (node.parent.type) {
    case 'CallExpression':
    case 'NewExpression':
    case 'MemberExpression':
    case 'ConditionalExpression':
    case 'BinaryExpression':
    case 'LogicalExpression':
    case 'UnaryExpression':
    case 'TaggedTemplateExpression':
    case 'SpreadElement':
    case 'AwaitExpression':
      return true;
    default:
      return false;
  }
}

function checkArrayIncludes(
  node: TSESTree.CallExpression,
  context: TSESLint.RuleContext<MessageIds, []>
): void {
  const {callee} = node;

  if (callee.type !== 'MemberExpression') {
    return;
  }

  const property = callee.property;

  if (
    property.type !== 'Identifier' ||
    property.name !== 'includes' ||
    callee.computed
  ) {
    return;
  }

  if (node.arguments.length !== 1) {
    return;
  }

  const arrayNode = callee.object;

  if (arrayNode.type !== 'ArrayExpression') {
    return;
  }

  const elements = arrayNode.elements;

  if (elements.length === 0 || elements.length > 6) {
    return;
  }

  const val = node.arguments[0]!;

  if (!isSafeToRepeat(val)) {
    return;
  }

  const hasTypes = tryGetTypedParserServices(context) !== null;

  for (const element of elements) {
    if (element === null) {
      return;
    }

    if (element.type === 'SpreadElement') {
      const arg = element.argument;
      if (!isSafeToRepeat(arg)) {
        return;
      }
      if (
        !hasTypes ||
        (!isArrayType(arg, context) && !isSetType(arg, context))
      ) {
        return;
      }
    } else if (!isSimpleElement(element)) {
      return;
    }
  }

  const sourceCode = context.sourceCode;
  const negated = isNegated(node);

  const operator = negated ? '!==' : '===';
  const joiner = negated ? ' && ' : ' || ';

  const parts: string[] = [];

  for (const element of elements) {
    if (element === null) {
      return;
    }

    if (element.type === 'SpreadElement') {
      const argText = sourceCode.getText(element.argument);
      const valText = sourceCode.getText(val);
      const method = isSetType(element.argument, context) ? 'has' : 'includes';
      if (negated) {
        parts.push(`!${argText}.${method}(${valText})`);
      } else {
        parts.push(`${argText}.${method}(${valText})`);
      }
    } else {
      const elemText = sourceCode.getText(element);
      const valText = sourceCode.getText(val);
      parts.push(`${elemText} ${operator} ${valText}`);
    }
  }

  const replacement = parts.join(joiner);

  const reportNode = negated ? node.parent : node;

  const needsParens = needsParentheses(reportNode);
  const fixText = needsParens ? `(${replacement})` : replacement;

  context.report({
    node: reportNode,
    messageId: 'preferEquality',
    fix(fixer) {
      return fixer.replaceText(reportNode, fixText);
    }
  });
}

export const preferInlineEquality: TSESLint.RuleModule<MessageIds, []> = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer inline equality checks over temporary object creation for simple comparisons'
    },
    fixable: 'code',
    messages: {
      preferEquality:
        'Avoid creating a temporary array just to call `.includes()`. Use equality checks instead.'
    },
    schema: []
  },
  defaultOptions: [],

  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        checkArrayIncludes(node, context);
      }
    };
  }
};
