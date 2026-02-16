import type {Rule} from 'eslint';
import type {NewExpression} from 'estree';

function isStaticNewRegExp(node: NewExpression): boolean {
  if (
    node.callee.type !== 'Identifier' ||
    node.callee.name !== 'RegExp' ||
    node.arguments.length === 0 ||
    node.arguments.length > 2
  ) {
    return false;
  }

  return node.arguments.every(
    (arg) => arg.type === 'Literal' && typeof arg.value === 'string'
  );
}

export const preferStaticRegex: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer defining regular expressions at module scope to avoid re-compilation on every function call',
      recommended: true
    },
    schema: [],
    messages: {
      preferStatic:
        'Move this regular expression to module scope to avoid re-compilation on every call.'
    }
  },
  create(context) {
    return {
      ':function Literal[regex]'(node: Rule.Node) {
        context.report({node, messageId: 'preferStatic'});
      },
      ':function NewExpression'(
        node: NewExpression & Rule.NodeParentExtension
      ) {
        if (isStaticNewRegExp(node)) {
          context.report({node, messageId: 'preferStatic'});
        }
      }
    };
  }
};
