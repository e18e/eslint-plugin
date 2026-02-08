import type {CallExpression, Node, Expression} from 'estree';
import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import type {Rule, SourceCode} from 'eslint';

export type AnyNode = Node | TSESTree.Node;

type NodeWithParent = (Node & Rule.NodeParentExtension) | TSESTree.Node;

/**
 * Checks if a node is in a boolean context (where the result is only used as truthy/falsy).
 * e.g. if conditions, while loops, ternary tests, logical operators
 */
export function isInBooleanContext(node: AnyNode): boolean {
  const parent = (node as NodeWithParent).parent;

  if (!parent) {
    return false;
  }

  // if/while/for/do-while test
  if (
    (parent.type === 'IfStatement' && parent.test === node) ||
    (parent.type === 'WhileStatement' && parent.test === node) ||
    (parent.type === 'ForStatement' && parent.test === node) ||
    (parent.type === 'DoWhileStatement' && parent.test === node)
  ) {
    return true;
  }

  // ternaries
  if (parent.type === 'ConditionalExpression' && parent.test === node) {
    return true;
  }

  // check the parent recursively for unary ! and logical operators
  if (
    (parent.type === 'UnaryExpression' && parent.operator === '!') ||
    (parent.type === 'LogicalExpression' &&
      (parent.operator === '&&' || parent.operator === '||'))
  ) {
    return isInBooleanContext(parent);
  }

  return false;
}

/**
 * Checks if a node is undefined, null, or void 0.
 * Returns the type of nullish value or false if not nullish.
 */
export function isNullish(node: Expression): 'undefined' | 'null' | false {
  if (node.type === 'Identifier' && node.name === 'undefined') {
    return 'undefined';
  }
  if (node.type === 'Literal' && node.value === null) {
    return 'null';
  }
  // void 0
  if (
    node.type === 'UnaryExpression' &&
    node.operator === 'void' &&
    node.argument.type === 'Literal' &&
    node.argument.value === 0
  ) {
    return 'undefined';
  }
  return false;
}

/**
 * Checks if a CallExpression is a copy operation that creates a shallow copy of an array.
 * e.g. concat(), slice(), slice(0)
 */
export function isCopyCall(node: CallExpression): boolean {
  if (
    node.callee.type !== 'MemberExpression' ||
    node.callee.property.type !== 'Identifier'
  ) {
    return false;
  }

  const methodName = node.callee.property.name;

  if (
    (methodName === 'concat' || methodName === 'slice') &&
    node.arguments.length === 0
  ) {
    return true;
  }

  if (
    methodName === 'slice' &&
    node.arguments.length === 1 &&
    node.arguments[0]?.type === 'Literal' &&
    node.arguments[0].value === 0
  ) {
    return true;
  }

  return false;
}

/**
 * Extracts the array node from array copy patterns.
 */
export function getArrayFromCopyPattern(
  node: TSESTree.Node
): TSESTree.Node | null;
export function getArrayFromCopyPattern(node: Node): Node | null;
export function getArrayFromCopyPattern(node: AnyNode): AnyNode | null {
  if (
    node.type === 'CallExpression' &&
    isCopyCall(node as CallExpression) &&
    node.callee.type === 'MemberExpression'
  ) {
    return node.callee.object;
  }

  if (
    node.type === 'ArrayExpression' &&
    node.elements.length === 1 &&
    node.elements[0]?.type === 'SpreadElement'
  ) {
    return node.elements[0].argument;
  }

  return null;
}

/**
 * Formats arguments from a CallExpression as a comma-separated string.
 */
export function formatArguments(
  args: TSESTree.CallExpression['arguments'],
  sourceCode: Readonly<TSESLint.SourceCode>
): string;
export function formatArguments(
  args: CallExpression['arguments'],
  sourceCode: SourceCode
): string;
export function formatArguments(
  args: CallExpression['arguments'] | TSESTree.CallExpression['arguments'],
  sourceCode: SourceCode | Readonly<TSESLint.SourceCode>
): string {
  if (args.length === 0) {
    return '';
  }
  return args
    .map((arg) => (sourceCode as SourceCode).getText(arg as Node))
    .join(', ');
}
