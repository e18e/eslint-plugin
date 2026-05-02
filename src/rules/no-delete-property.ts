import type {Rule} from 'eslint';
import type {Expression, Super, UnaryExpression} from 'estree';

// `process.env.X = undefined` sets the env var to the string "undefined" in
// Node, not absent. Suppress the auto-suggestion in that specific case.
function isProcessEnv(node: Expression | Super): boolean {
  return (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.object.type === 'Identifier' &&
    node.object.name === 'process' &&
    node.property.type === 'Identifier' &&
    node.property.name === 'env'
  );
}

export const noDeleteProperty: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow `delete` on properties — V8 deoptimizes the object to dictionary mode',
      recommended: true
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      noDeleteProperty:
        '`delete` forces V8 into a slow dictionary representation. Set the value to `undefined` if absence-vs-undefined does not matter, or use `Map` for a dynamic key-value collection.',
      replaceWithUndefined: 'Replace with assignment to undefined'
    }
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      UnaryExpression(node: UnaryExpression & Rule.NodeParentExtension) {
        if (node.operator !== 'delete') return;
        const member = node.argument;
        if (member.type !== 'MemberExpression') return;
        // Skip `delete super.x` — illegal anyway, but be defensive
        if (member.object.type === 'Super') return;

        // Only flag static key access — `delete obj.prop` and
        // `delete obj['prop']`. Computed access with a dynamic key
        // (`delete obj[k]`, `delete arr[i]`) typically targets map-like
        // objects that are already in dictionary mode, so the hidden-class
        // deopt argument doesn't apply.
        const property = member.property;
        const isStaticKey =
          !member.computed ||
          (property.type === 'Literal' && typeof property.value === 'string');
        if (!isStaticKey) return;

        // Suggestions are only safe when the delete result (boolean) isn't used
        const isStatement = node.parent.type === 'ExpressionStatement';
        const canSuggest = isStatement && !isProcessEnv(member.object);

        const memberText = sourceCode.getText(member);

        context.report({
          node,
          messageId: 'noDeleteProperty',
          suggest: canSuggest
            ? [
                {
                  messageId: 'replaceWithUndefined',
                  fix(fixer) {
                    return fixer.replaceText(node, `${memberText} = undefined`);
                  }
                }
              ]
            : []
        });
      }
    };
  }
};
