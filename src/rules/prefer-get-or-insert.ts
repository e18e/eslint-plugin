import type {Rule, SourceCode} from 'eslint';
import type {
  CallExpression,
  Expression,
  Identifier,
  MemberExpression,
  Node
} from 'estree';

function isMemberCall(
  node: Node,
  name: string
): node is CallExpression & {
  callee: MemberExpression & {object: Expression; property: Identifier};
} {
  return (
    node.type === 'CallExpression' &&
    !node.optional &&
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    !node.callee.optional &&
    node.callee.object.type !== 'Super' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === name
  );
}

function isMapGet(node: Node): node is CallExpression & {
  callee: MemberExpression & {object: Expression; property: Identifier};
  arguments: [Expression];
} {
  if (!isMemberCall(node, 'get')) return false;
  if (node.arguments.length !== 1) return false;
  const key = node.arguments[0]!;
  if (key.type === 'SpreadElement') return false;
  return true;
}

function extractDefaultPattern(node: Expression, sourceCode: SourceCode) {
  if (node.type === 'LogicalExpression' && node.operator === '??') {
    if (!isMapGet(node.left)) return null;
    return {
      object: node.left.callee.object,
      key: node.left.arguments[0],
      fallback: node.right
    };
  }

  if (node.type === 'ConditionalExpression') {
    if (!isMemberCall(node.test, 'has')) return null;
    if (node.test.arguments.length !== 1) return null;
    const hasKey = node.test.arguments[0]!;
    if (hasKey.type === 'SpreadElement') return null;
    const hasObject = node.test.callee.object;

    if (!isMapGet(node.consequent)) return null;

    const getObject = node.consequent.callee.object;
    const getKey = node.consequent.arguments[0];

    if (
      sourceCode.getText(hasObject) !== sourceCode.getText(getObject) ||
      sourceCode.getText(hasKey) !== sourceCode.getText(getKey)
    ) {
      return null;
    }

    return {
      object: node.consequent.callee.object,
      key: node.consequent.arguments[0],
      fallback: node.alternate
    };
  }

  return null;
}

function buildReplacement(
  pattern: {object: Expression; key: Expression; fallback: Expression},
  sourceCode: SourceCode
) {
  const object = sourceCode.getText(pattern.object);
  const key = sourceCode.getText(pattern.key);
  const fallback = sourceCode.getText(pattern.fallback);
  return `${object}.getOrInsert(${key}, ${fallback})`;
}

function getStatementList(node: Rule.Node): Node[] | null {
  switch (node.type) {
    case 'Program':
    case 'BlockStatement':
    case 'StaticBlock':
      return node.body;
    case 'SwitchCase':
      return node.consequent;
    default:
      return null;
  }
}

function visitAssignment(
  context: Rule.RuleContext,
  valueNode: Expression,
  variableName: string,
  statement: Rule.Node
) {
  if (!statement.parent) return;

  const {sourceCode} = context;
  const pattern = extractDefaultPattern(valueNode, sourceCode);
  if (!pattern) return;

  const body = getStatementList(statement.parent);
  if (!body) return;

  const index = body.indexOf(statement);
  if (index === -1) return;

  const objectText = sourceCode.getText(pattern.object);
  const keyText = sourceCode.getText(pattern.key);

  let setStatement: Node | null = null;
  for (let i = index + 1; i < body.length; i++) {
    const stmt = body[i];
    if (stmt?.type !== 'ExpressionStatement') continue;
    const expr = stmt.expression;
    if (!isMemberCall(expr, 'set')) continue;
    if (expr.arguments.length !== 2) continue;
    const [setKey, setValue] = expr.arguments;
    if (
      !setKey ||
      !setValue ||
      setValue.type !== 'Identifier' ||
      setValue.name !== variableName ||
      setKey.type === 'SpreadElement'
    ) {
      continue;
    }
    if (
      sourceCode.getText(expr.callee.object) !== objectText ||
      sourceCode.getText(setKey) !== keyText
    ) {
      continue;
    }
    setStatement = stmt;
    break;
  }

  if (!setStatement) return;

  context.report({
    node: valueNode,
    messageId: 'preferGetOrInsert',
    fix(fixer) {
      const fixes = [
        fixer.replaceText(valueNode, buildReplacement(pattern, sourceCode))
      ];
      const tokenBefore = sourceCode.getTokenBefore(setStatement!);
      if (tokenBefore) {
        fixes.push(
          fixer.removeRange([tokenBefore.range![1], setStatement!.range![1]])
        );
      } else {
        fixes.push(fixer.remove(setStatement!));
      }
      return fixes;
    }
  });
}

function visitIfStatement(context: Rule.RuleContext, node: Rule.Node) {
  if (node.type !== 'IfStatement' || node.alternate) return;

  const body = getStatementList(node.parent);
  if (!body) return;
  const prev = body[body.indexOf(node) - 1];
  if (!prev || prev.type !== 'VariableDeclaration') return;
  if (prev.declarations.length !== 1) return;

  const declarator = prev.declarations[0];
  if (
    declarator === undefined ||
    declarator.id.type !== 'Identifier' ||
    !declarator.init ||
    !isMapGet(declarator.init)
  ) {
    return;
  }

  const name = declarator.id.name;
  const get = declarator.init;

  if (
    node.test.type !== 'UnaryExpression' ||
    node.test.operator !== '!' ||
    node.test.argument.type !== 'Identifier' ||
    node.test.argument.name !== name ||
    node.consequent.type !== 'BlockStatement' ||
    node.consequent.body.length !== 2
  ) {
    return;
  }

  const [assignStmt, setStmt] = node.consequent.body;
  if (
    assignStmt === undefined ||
    assignStmt.type !== 'ExpressionStatement' ||
    assignStmt.expression.type !== 'AssignmentExpression' ||
    assignStmt.expression.operator !== '=' ||
    assignStmt.expression.left.type !== 'Identifier' ||
    assignStmt.expression.left.name !== name
  ) {
    return;
  }
  const assign = assignStmt.expression;

  if (setStmt === undefined || setStmt.type !== 'ExpressionStatement') return;
  const set = setStmt.expression;
  if (!isMemberCall(set, 'set') || set.arguments.length !== 2) return;
  const [setKey, setValue] = set.arguments;
  if (
    setKey === undefined ||
    setValue === undefined ||
    setValue.type !== 'Identifier' ||
    setValue.name !== name
  ) {
    return;
  }

  const {sourceCode} = context;
  if (
    sourceCode.getText(set.callee.object) !==
      sourceCode.getText(get.callee.object) ||
    sourceCode.getText(setKey) !== sourceCode.getText(get.arguments[0])
  ) {
    return;
  }

  const pattern = {
    object: get.callee.object,
    key: get.arguments[0],
    fallback: assign.right
  };

  context.report({
    node,
    messageId: 'preferGetOrInsert',
    fix(fixer) {
      const tokenBefore = sourceCode.getTokenBefore(node);
      return [
        fixer.replaceText(get, buildReplacement(pattern, sourceCode)),
        tokenBefore
          ? fixer.removeRange([tokenBefore.range![1], node.range![1]])
          : fixer.remove(node)
      ];
    }
  });
}

export const preferGetOrInsert: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer `Map.prototype.getOrInsert()` over reading an entry with a default and writing it back',
      recommended: false
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferGetOrInsert:
        'Use `map.getOrInsert(key, default)` instead of reading the entry with a default and setting it back.'
    }
  },
  create(context) {
    const {sourceCode} = context;

    return {
      // map.set(k, map.get(k) ?? default)
      // map.set(k, map.has(k) ? map.get(k) : default)
      CallExpression(node: CallExpression) {
        if (!isMemberCall(node, 'set')) return;
        if (node.arguments.length !== 2) return;
        const [key, value] = node.arguments;
        if (
          key === undefined ||
          value === undefined ||
          key.type === 'SpreadElement' ||
          value.type === 'SpreadElement'
        ) {
          return;
        }

        const pattern = extractDefaultPattern(value, sourceCode);
        if (!pattern) return;

        if (
          sourceCode.getText(pattern.object) !==
            sourceCode.getText(node.callee.object) ||
          sourceCode.getText(pattern.key) !== sourceCode.getText(key)
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'preferGetOrInsert',
          fix(fixer) {
            return fixer.replaceText(
              node,
              buildReplacement(pattern, sourceCode)
            );
          }
        });
      },

      // const v = map.get(k) ?? default; ...; map.set(k, v)
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || !node.init) return;
        visitAssignment(context, node.init, node.id.name, node.parent);
      },

      // v = map.get(k) ?? default; ...; map.set(k, v)
      AssignmentExpression(node) {
        if (node.operator !== '=' || node.left.type !== 'Identifier') return;
        const statement = node.parent;
        if (statement.type !== 'ExpressionStatement') return;
        visitAssignment(context, node.right, node.left.name, statement);
      },

      // let v = map.get(k); if (!v) { v = default; map.set(k, v); }
      IfStatement(node) {
        visitIfStatement(context, node);
      }
    };
  }
};
