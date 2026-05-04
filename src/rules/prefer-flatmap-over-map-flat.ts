import type {Rule} from 'eslint';
import type {CallExpression} from 'estree';

function isMemberCall(
  node: CallExpression,
  name: string
): node is CallExpression & {
  callee: CallExpression['callee'] & {type: 'MemberExpression'};
} {
  return (
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === name
  );
}

export const preferFlatMapOverMapFlat: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer Array.prototype.flatMap() over .map(fn).flat() to avoid the intermediate array',
      recommended: false
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferFlatMap:
        'Use `.flatMap(fn)` instead of `.map(fn).flat()` — skips the intermediate array.'
    }
  },
  create(context) {
    const {sourceCode} = context;
    return {
      CallExpression(node: CallExpression) {
        // outer .flat()
        if (!isMemberCall(node, 'flat')) return;

        // .flat() must take no argument or `1` (the default depth)
        if (node.arguments.length > 1) return;
        if (node.arguments.length === 1) {
          const depth = node.arguments[0]!;
          if (
            depth.type !== 'Literal' ||
            typeof depth.value !== 'number' ||
            depth.value !== 1
          )
            return;
        }

        const inner = node.callee.object;
        if (inner.type !== 'CallExpression') return;
        if (!isMemberCall(inner, 'map')) return;
        // .map must have exactly one argument (the mapper)
        if (inner.arguments.length !== 1) return;
        const mapperArg = inner.arguments[0]!;
        if (mapperArg.type === 'SpreadElement') return;

        context.report({
          node,
          messageId: 'preferFlatMap',
          fix(fixer) {
            const mapProperty = inner.callee.property;
            const dotToken = sourceCode.getTokenBefore(node.callee.property);
            if (!dotToken) return null;
            return [
              fixer.replaceText(mapProperty, 'flatMap'),
              fixer.removeRange([dotToken.range![0], node.range![1]])
            ];
          }
        });
      }
    };
  }
};
