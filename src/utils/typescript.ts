import type {
  TSNode,
  TSToken,
  TSESTree,
  ParserServicesWithTypeInformation
} from '@typescript-eslint/typescript-estree';
import type {TSESLint} from '@typescript-eslint/utils';
import type ts from 'typescript';

export interface ParserServices {
  emitDecoratorMetadata: boolean | undefined;
  experimentalDecorators: boolean | undefined;
  isolatedDeclarations: boolean | undefined;
  esTreeNodeToTSNodeMap: WeakMap<TSESTree.Node, TSNode | TSToken>;
  tsNodeToESTreeNodeMap: WeakMap<TSNode | TSToken, TSESTree.Node>;
  getSymbolAtLocation: (node: TSESTree.Node) => ts.Symbol | undefined;
  getTypeAtLocation: (node: TSESTree.Node) => ts.Type;
  program: ts.Program;
}

export function tryGetTypedParserServices(
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>
): ParserServicesWithTypeInformation | null {
  if (context.sourceCode.parserServices?.program == null) {
    return null;
  }

  return context.sourceCode.parserServices as ParserServicesWithTypeInformation;
}

export function getTypedParserServices(
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>
): ParserServicesWithTypeInformation {
  const services = tryGetTypedParserServices(context);
  if (services === null) {
    throw new Error(
      `You have used a rule which requires type information. Please ensure you have typescript-eslint setup alongside this plugin and configured to enable type-aware linting. See https://typescript-eslint.io/getting-started/typed-linting for more information.`
    );
  }

  return services;
}
