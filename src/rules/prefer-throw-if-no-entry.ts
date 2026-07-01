import type {Rule, SourceCode} from 'eslint';
import type {CallExpression, Node} from 'estree';

const STAT_SYNC_NAMES = new Set(['statSync', 'lstatSync']);

function isStatSyncCallee(node: CallExpression): boolean {
  const callee = node.callee;

  if (callee.type === 'Identifier') {
    return STAT_SYNC_NAMES.has(callee.name);
  }

  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    STAT_SYNC_NAMES.has(callee.property.name)
  );
}

function hasThrowIfNoEntryOption(node: CallExpression): boolean {
  const options = node.arguments[1];
  if (options?.type !== 'ObjectExpression') {
    return false;
  }

  return options.properties.some((property) => {
    if (property.type !== 'Property') {
      return false;
    }
    if (property.key.type === 'Identifier') {
      return !property.computed && property.key.name === 'throwIfNoEntry';
    }
    return (
      property.key.type === 'Literal' && property.key.value === 'throwIfNoEntry'
    );
  });
}

function isFunctionLike(node: Node): boolean {
  return (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  );
}

function isInTryBlockWithCatch(node: Rule.Node): boolean {
  let child: Rule.Node = node;
  let parent = node.parent;

  while (parent) {
    if (isFunctionLike(parent)) {
      return false;
    }
    if (parent.type === 'TryStatement') {
      if (child === parent.handler || child === parent.finalizer) {
        return false;
      }
      if (child === parent.block && parent.handler) {
        return true;
      }
    }
    child = parent;
    parent = parent.parent;
  }

  return false;
}

function buildSuggestions(
  node: CallExpression,
  sourceCode: SourceCode
): Rule.SuggestionReportDescriptor[] {
  if (node.arguments.some((arg) => arg.type === 'SpreadElement')) {
    return [];
  }

  if (node.arguments.length === 1) {
    const closeParen = sourceCode.getLastToken(node);
    if (!closeParen) {
      return [];
    }
    return [
      {
        messageId: 'addThrowIfNoEntryOption',
        fix: (fixer) =>
          fixer.insertTextBefore(closeParen, ', {throwIfNoEntry: false}')
      }
    ];
  }

  if (node.arguments.length === 2) {
    const options = node.arguments[1];
    if (options?.type !== 'ObjectExpression') {
      return [];
    }
    if (options.properties.length === 0) {
      return [
        {
          messageId: 'addThrowIfNoEntryOption',
          fix: (fixer) => fixer.replaceText(options, '{throwIfNoEntry: false}')
        }
      ];
    }
    const lastProperty = options.properties.at(-1)!;
    return [
      {
        messageId: 'addThrowIfNoEntryOption',
        fix: (fixer) =>
          fixer.insertTextAfter(lastProperty, ', throwIfNoEntry: false')
      }
    ];
  }

  return [];
}

export const preferThrowIfNoEntry: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer `{throwIfNoEntry: false}` over relying on a thrown error for missing fs entries from sync stat calls',
      recommended: false
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      preferThrowIfNoEntry:
        'Pass { throwIfNoEntry: false } and check the return value for missing entries, keeping the try/catch for real errors like EACCES. Throwing on the common not-found path builds an expensive Error stack trace.',
      addThrowIfNoEntryOption:
        'Pass { throwIfNoEntry: false } so the call returns undefined instead of throwing.'
    }
  },
  create(context) {
    const {sourceCode} = context;

    return {
      CallExpression(node: CallExpression & Rule.NodeParentExtension) {
        if (
          !isStatSyncCallee(node) ||
          hasThrowIfNoEntryOption(node) ||
          !isInTryBlockWithCatch(node)
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'preferThrowIfNoEntry',
          suggest: buildSuggestions(node, sourceCode)
        });
      }
    };
  }
};
