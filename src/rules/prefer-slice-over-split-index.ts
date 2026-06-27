import type {
  CallExpression,
  Expression,
  Literal,
  MemberExpression,
  SpreadElement
} from 'estree';
import type {Rule} from 'eslint';

function stringValue(node: Expression | SpreadElement): string | null {
  if (node.type === 'Literal') {
    return typeof node.value === 'string' ? node.value : null;
  }
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    const cooked = node.quasis[0]?.value.cooked;
    return typeof cooked === 'string' ? cooked : null;
  }
  return null;
}

function isSupportedLimit(
  limit: Expression | SpreadElement | undefined,
  index: 0 | 1
): boolean {
  if (!limit) return true;
  if (limit.type !== 'Literal') return false;
  const {value} = limit as Literal;
  return typeof value === 'number' && Number.isInteger(value) && value > index;
}

function getSplitCall(node: MemberExpression): CallExpression | null {
  const call = node.object;
  if (call.type !== 'CallExpression') return null;
  const callee = call.callee;
  if (callee.type !== 'MemberExpression' || callee.computed) return null;
  if (callee.property.type !== 'Identifier' || callee.property.name !== 'split')
    return null;
  if (call.arguments.length === 0 || call.arguments.length > 2) return null;
  const separator = call.arguments[0];
  if (!separator) return null;
  const value = stringValue(separator);
  if (value === null || value.length === 0) return null;
  return call;
}

export const preferSliceOverSplitIndex: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer indexOf and slice over split()[N] when only the first or second piece is needed',
      recommended: false
    },
    schema: [],
    messages: {
      preferSliceFirst:
        'Prefer indexOf()+slice() over split(separator)[0] for string separators; split allocates an intermediate array. Preserve the missing-separator fallback explicitly.',
      preferSliceSecond:
        'Prefer indexOf()+slice() over split(separator)[1] for string separators; split allocates an intermediate array. Preserve missing and repeated-separator behavior explicitly.'
    }
  },
  create(context) {
    return {
      MemberExpression(node: MemberExpression) {
        if (!node.computed) return;
        if (node.property.type !== 'Literal') return;
        const index = node.property.value;
        if (index !== 0 && index !== 1) return;

        const call = getSplitCall(node);
        if (!call) return;
        if (!isSupportedLimit(call.arguments[1], index)) return;

        context.report({
          node,
          messageId: index === 0 ? 'preferSliceFirst' : 'preferSliceSecond'
        });
      }
    };
  }
};
