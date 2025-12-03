import type {CallExpression, Node} from 'estree';
import type {SourceCode} from 'eslint';

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
export function getArrayFromCopyPattern(node: Node): Node | null {
  if (
    node.type === 'CallExpression' &&
    isCopyCall(node) &&
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
  args: CallExpression['arguments'],
  sourceCode: SourceCode
): string {
  if (args.length === 0) {
    return '';
  }
  return args.map((arg) => sourceCode.getText(arg)).join(', ');
}
