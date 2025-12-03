import type {CallExpression} from 'estree';

/**
 * Checks if a CallExpression is a copy operation that creates a shallow copy of an array.
 * Matches: concat(), slice(), slice(0)
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
