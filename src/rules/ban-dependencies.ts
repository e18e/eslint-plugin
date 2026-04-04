import type {Rule} from 'eslint';
import {
  microUtilsReplacements,
  preferredReplacements,
  nativeReplacements,
  type ModuleReplacement,
  type ManifestModule,
  type ModuleReplacementMapping,
  resolveDocUrl
} from 'module-replacements';
import type {TSESTree} from '@typescript-eslint/typescript-estree';
import {closestPackageSatisfiesNodeVersion} from '../utils/package-json.js';
import type {MemberNode} from '@humanwhocodes/momoa';
import type {AST as JsonESTree} from 'jsonc-eslint-parser';

interface BanDependenciesOptions {
  presets?: string[];
  modules?: string[];
  allowed?: string[];
}

const availablePresets: Record<string, ManifestModule> = {
  microutilities: microUtilsReplacements,
  native: nativeReplacements,
  preferred: preferredReplacements
};

const defaultPresets = ['microutilities', 'native', 'preferred'];
const packageJsonLikePath = /(^|[/\\])package.json$/;
const dependencyKeys = ['dependencies', 'devDependencies'];

type ImportListenerCallback = (
  context: Rule.RuleContext,
  node: Rule.Node,
  source: string
) => void;

/**
 * Creates a rule listener which listens for import/require calls and
 * calls a callback when one is found
 */
export function createImportListener(
  context: Rule.RuleContext,
  callback: ImportListenerCallback
): Rule.RuleListener {
  return {
    ImportDeclaration: (node) => {
      if (
        node.source.type !== 'Literal' ||
        typeof node.source.value !== 'string'
      ) {
        return;
      }

      callback(context, node, node.source.value);
    },
    ImportExpression: (node) => {
      if (
        node.source.type !== 'Literal' ||
        typeof node.source.value !== 'string'
      ) {
        return;
      }

      callback(context, node, node.source.value);
    },
    TSImportEqualsDeclaration: (astNode: Rule.Node) => {
      const node = astNode as unknown as TSESTree.TSImportEqualsDeclaration;
      const moduleRef = node.moduleReference;
      if (
        moduleRef.type !== 'TSExternalModuleReference' ||
        moduleRef.expression.type !== 'Literal' ||
        typeof moduleRef.expression.value !== 'string'
      ) {
        return;
      }

      callback(context, astNode, moduleRef.expression.value);
    },
    CallExpression: (node) => {
      const [arg0] = node.arguments;
      if (
        arg0 === undefined ||
        node.callee.type !== 'Identifier' ||
        node.callee.name !== 'require' ||
        arg0.type !== 'Literal' ||
        typeof arg0.value !== 'string'
      ) {
        return;
      }

      callback(context, node, arg0.value);
    }
  };
}

function hasMatchingEngine(
  replacement: ModuleReplacement,
  context: Rule.RuleContext
): boolean {
  if (!replacement.engines) {
    return true;
  }

  // TODO: support more than just Node eventually
  const engineKey = 'nodejs';
  const engineRange = replacement.engines.find(
    (eng) => eng.engine === engineKey
  )?.minVersion;

  if (!engineRange) {
    return true;
  }

  return closestPackageSatisfiesNodeVersion(context, engineRange);
}

/**
 * Callback used for the replacement listener
 */
function replacementListenerCallback(
  context: Rule.RuleContext,
  manifests: ManifestModule[],
  allowedNames: Set<string>,
  node: Rule.Node,
  source: string
): void {
  for (const allowedName of allowedNames) {
    if (source === allowedName || source.startsWith(`${allowedName}/`)) {
      return;
    }
  }

  const replacements: ModuleReplacement[] = [];
  let currentMapping: ModuleReplacementMapping | undefined;

  for (const manifest of manifests) {
    for (const [moduleName, mapping] of Object.entries(manifest.mappings)) {
      if (moduleName === source || source.startsWith(`${moduleName}/`)) {
        currentMapping = mapping;
        for (const replacementId of mapping.replacements) {
          const replacement = manifest.replacements[replacementId];
          if (replacement) {
            replacements.push(replacement);
          }
        }
        break;
      }
    }
  }

  if (replacements.length === 0 || !currentMapping) {
    return;
  }

  const replacement = replacements.find((rep) =>
    hasMatchingEngine(rep, context)
  );

  if (!replacement) {
    return;
  }

  if (replacement.type === 'native') {
    context.report({
      node,
      messageId: 'nativeReplacement',
      data: {
        name: currentMapping.moduleName,
        replacement: replacement.id,
        url: resolveDocUrl(replacement.url)
      }
    });
  } else if (replacement.type === 'documented') {
    context.report({
      node,
      messageId: 'documentedReplacement',
      data: {
        name: currentMapping.moduleName,
        replacement: replacement.replacementModule,
        url: resolveDocUrl(replacement.url)
      }
    });
  } else if (replacement.type === 'simple') {
    context.report({
      node,
      messageId: 'simpleReplacement',
      data: {
        name: currentMapping.moduleName,
        description: replacement.description
      }
    });
  } else if (replacement.type === 'removal') {
    context.report({
      node,
      messageId: 'removalReplacement',
      data: {
        name: currentMapping.moduleName,
        description: replacement.description
      }
    });
  }
}

/**
 * Creates a rule listener for detecting dependencies in a `package.json`
 * file
 */
export function createPackageJsonListener(
  context: Rule.RuleContext,
  callback: ImportListenerCallback
): Rule.RuleListener {
  return {
    // Support for `@eslint/json`
    'Document > Object > Member': (node: unknown) => {
      const memberNode = node as MemberNode;
      if (
        memberNode.name.type === 'String' &&
        dependencyKeys.includes(memberNode.name.value) &&
        memberNode.value.type === 'Object'
      ) {
        for (const member of memberNode.value.members) {
          if (member.name.type === 'String') {
            callback(
              context,
              member as unknown as Rule.Node,
              member.name.value
            );
          }
        }
      }
    },
    // Support for `jsonc-eslint-parser`
    'Program > JSONExpressionStatement > JSONObjectExpression > JSONProperty': (
      astNode: Rule.Node
    ) => {
      const node = astNode as unknown as JsonESTree.JSONProperty;

      if (
        node.key.type === 'JSONLiteral' &&
        typeof node.key.value === 'string' &&
        dependencyKeys.includes(node.key.value) &&
        node.value.type === 'JSONObjectExpression'
      ) {
        for (const prop of node.value.properties) {
          if (
            prop.key.type === 'JSONLiteral' &&
            typeof prop.key.value === 'string'
          ) {
            callback(context, prop as unknown as Rule.Node, prop.key.value);
          }
        }
      }
    }
  };
}

export const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Bans a list of dependencies from being used'
    },
    defaultOptions: [{}],
    schema: [
      {
        type: 'object',
        properties: {
          presets: {
            description: 'Preset groups of modules to ban',
            type: 'array',
            items: {
              type: 'string'
            }
          },
          modules: {
            description: 'Additional module names to ban',
            type: 'array',
            items: {
              type: 'string'
            }
          },
          allowed: {
            description: 'Module names to allow even if matched by a preset',
            type: 'array',
            items: {
              type: 'string'
            }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      nativeReplacement:
        '"{{name}}" should be replaced with native functionality. ' +
        'You can instead use {{replacement}}. Read more here: {{url}}',
      documentedReplacement:
        '"{{name}}" should be replaced with an alternative package. In your ' +
        'project, we recommend {{replacement}}. Read more here: {{url}}',
      simpleReplacement:
        '"{{name}}" should be replaced with inline/local logic.' +
        '{{description}}',
      removalReplacement:
        '"{{name}}" is flagged as no longer needed. {{description}}'
    }
  },
  create: (context) => {
    const options = context.options[0] as BanDependenciesOptions | undefined;
    const manifests: ManifestModule[] = [];
    const presets = options?.presets ?? defaultPresets;
    const modules = options?.modules;
    const allowed = new Set(options?.allowed ?? []);

    for (const preset of presets) {
      const presetReplacements = availablePresets[preset];
      if (presetReplacements) {
        manifests.push(presetReplacements);
      }
    }

    if (modules) {
      const customManifest: ManifestModule = {
        mappings: Object.fromEntries(
          modules.map((mod) => [
            mod,
            {
              replacements: ['__ban-dependencies__disallowed'],
              moduleName: mod,
              type: 'module'
            }
          ])
        ),
        replacements: {
          '__ban-dependencies__disallowed': {
            id: '__ban-dependencies__disallowed',
            type: 'removal',
            description:
              'This module is disallowed and should be replaced with an alternative.'
          }
        }
      };
      manifests.push(customManifest);
    }

    if (packageJsonLikePath.test(context.filename)) {
      return createPackageJsonListener(context, (context, node, name) =>
        replacementListenerCallback(context, manifests, allowed, node, name)
      );
    }

    return createImportListener(context, (context, node, source) =>
      replacementListenerCallback(context, manifests, allowed, node, source)
    );
  }
};
