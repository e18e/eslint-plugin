import type {Rule} from 'eslint';
import type {
  ArrowFunctionExpression,
  CallExpression,
  Expression,
  FunctionExpression,
  Node,
  Pattern
} from 'estree';

type Callback = ArrowFunctionExpression | FunctionExpression;

function collectPatternNames(pattern: Pattern, out: Set<string>): void {
  if (pattern.type === 'Identifier') {
    out.add(pattern.name);
  } else if (pattern.type === 'ObjectPattern') {
    for (const prop of pattern.properties) {
      if (prop.type === 'Property')
        collectPatternNames(prop.value as Pattern, out);
      else collectPatternNames(prop.argument, out);
    }
  } else if (pattern.type === 'ArrayPattern') {
    for (const el of pattern.elements) if (el) collectPatternNames(el, out);
  } else if (pattern.type === 'AssignmentPattern') {
    collectPatternNames(pattern.left, out);
  } else if (pattern.type === 'RestElement') {
    collectPatternNames(pattern.argument, out);
  }
}

// Names bound by the accumulator parameter — including destructured fields:
// `({list}, x)` exposes `list`; `({list: items}, x)` exposes `items`.
// Skip the rest-param shape `(...args)` since `args[0]` is the real
// accumulator and `[...args, x]` would have fixed-size cost, not O(N²).
function getAccumulatorNames(fn: Callback): Set<string> {
  const names = new Set<string>();
  const first = fn.params[0];
  if (
    !first ||
    (first.type !== 'Identifier' &&
      first.type !== 'ObjectPattern' &&
      first.type !== 'ArrayPattern' &&
      first.type !== 'AssignmentPattern')
  )
    return names;
  collectPatternNames(first, names);
  return names;
}

// Hoist names that alias or destructure the accumulator at the top of the
// body: `const a = acc` adds `a`; `const {list} = acc` adds `list`.
function collectAliases(fn: Callback, accNames: Set<string>): void {
  if (fn.body.type !== 'BlockStatement') return;
  for (const stmt of fn.body.body) {
    if (stmt.type !== 'VariableDeclaration') continue;
    for (const decl of stmt.declarations) {
      if (decl.init?.type === 'Identifier' && accNames.has(decl.init.name)) {
        collectPatternNames(decl.id, accNames);
      }
    }
  }
}

// All expressions returned from the callback (skipping nested functions —
// their returns belong to themselves). Covers conditional branches:
// `if (cond) return [...acc, x]; return acc;` examines both arms.
function getReturnedExpressions(
  fn: Callback,
  visitorKeys: Record<string, readonly string[] | undefined>
): Expression[] {
  if (fn.body.type !== 'BlockStatement') return [fn.body];
  const out: Expression[] = [];
  function walk(node: Node): void {
    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    )
      return;
    if (node.type === 'ReturnStatement' && node.argument) {
      out.push(node.argument);
      return;
    }
    const keys = visitorKeys[node.type];
    if (!keys) return;
    for (const key of keys) {
      const value = (node as unknown as Record<string, unknown>)[key];
      if (!value) continue;
      if (Array.isArray(value)) {
        for (const child of value) if (child) walk(child as Node);
      } else {
        walk(value as Node);
      }
    }
  }
  walk(fn.body);
  return out;
}

// Find the first SpreadElement whose argument is an accumulator-bound
// identifier, anywhere inside the returned expression (skipping nested
// functions). Position within an array/object literal doesn't matter for
// the perf cost — `[x, ...acc]` and `[...acc, x]` both copy all N entries
// each iteration. Walking past the top level also catches the destructure
// pattern `({list: [...list, x]})`, where the spread sits inside a
// rebuilt accumulator shape.
function findAccumulatorSpread(
  expr: Expression,
  accNames: Set<string>,
  visitorKeys: Record<string, readonly string[] | undefined>
): Node | null {
  let found: Node | null = null;
  function walk(node: Node): void {
    if (found) return;
    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    )
      return;
    if (
      node.type === 'SpreadElement' &&
      node.argument.type === 'Identifier' &&
      accNames.has(node.argument.name)
    ) {
      found = node;
      return;
    }
    const keys = visitorKeys[node.type];
    if (!keys) return;
    for (const key of keys) {
      const value = (node as unknown as Record<string, unknown>)[key];
      if (!value) continue;
      if (Array.isArray(value)) {
        for (const child of value) if (child) walk(child as Node);
      } else {
        walk(value as Node);
      }
    }
  }
  walk(expr);
  return found;
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
    const visitorKeys = context.sourceCode.visitorKeys as Record<
      string,
      readonly string[] | undefined
    >;
    return {
      CallExpression(node: CallExpression) {
        if (!isReduceCall(node)) return;
        const callback = node.arguments[0] as Node;
        if (
          callback.type !== 'ArrowFunctionExpression' &&
          callback.type !== 'FunctionExpression'
        )
          return;
        const accNames = getAccumulatorNames(callback);
        if (accNames.size === 0) return;
        collectAliases(callback, accNames);
        for (const ret of getReturnedExpressions(callback, visitorKeys)) {
          const spread = findAccumulatorSpread(ret, accNames, visitorKeys);
          if (spread) {
            context.report({
              node: spread,
              messageId: 'noSpreadInReduce'
            });
          }
        }
      }
    };
  }
};
