import type {Rule} from 'eslint';
import type {
  ArrowFunctionExpression,
  CallExpression,
  Expression,
  FunctionExpression,
  Node
} from 'estree';

type Callback = ArrowFunctionExpression | FunctionExpression;

function getReturnedExpression(fn: Callback): Expression | null {
  if (fn.body.type !== 'BlockStatement') {
    return fn.body;
  }
  // Look at the last statement
  const last = fn.body.body.at(-1);
  if (!last || last.type !== 'ReturnStatement' || !last.argument) return null;
  return last.argument;
}

function getAccumulatorName(fn: Callback): string | null {
  const first = fn.params[0];
  if (!first || first.type !== 'Identifier') return null;
  return first.name;
}

// Spread position doesn't matter for the perf cost — `[x, ...acc]` and
// `[...acc, x]` both copy all N entries each iteration. Scan every
// element/property for a spread of the accumulator identifier.
function spreadsAccumulator(expr: Expression, accName: string): boolean {
  if (expr.type === 'ArrayExpression') {
    return expr.elements.some(
      (el) =>
        el?.type === 'SpreadElement' &&
        el.argument.type === 'Identifier' &&
        el.argument.name === accName
    );
  }
  if (expr.type === 'ObjectExpression') {
    return expr.properties.some(
      (prop) =>
        prop.type === 'SpreadElement' &&
        prop.argument.type === 'Identifier' &&
        prop.argument.name === accName
    );
  }
  return false;
}

function isReduceCall(node: CallExpression): boolean {
  return (
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    node.callee.property.type === 'Identifier' &&
    (node.callee.property.name === 'reduce' ||
      node.callee.property.name === 'reduceRight') &&
    node.arguments.length >= 1
  );
}

export const noSpreadInReduce: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow spreading the accumulator inside a `reduce` callback (O(N²) growth)',
      recommended: false
    },
    schema: [],
    messages: {
      noSpreadInReduce:
        'Spreading the accumulator on every reduce step is O(N²). Mutate the accumulator (push/Object.assign) and return it, or use a different shape (e.g. `flatMap`, `Object.fromEntries`).'
    }
  },
  create(context) {
    return {
      CallExpression(node: CallExpression) {
        if (!isReduceCall(node)) return;
        const callback = node.arguments[0] as Node;
        if (
          callback.type !== 'ArrowFunctionExpression' &&
          callback.type !== 'FunctionExpression'
        )
          return;
        const accName = getAccumulatorName(callback);
        if (!accName) return;
        const ret = getReturnedExpression(callback);
        if (!ret) return;
        if (!spreadsAccumulator(ret, accName)) return;

        context.report({
          node: ret,
          messageId: 'noSpreadInReduce'
        });
      }
    };
  }
};
