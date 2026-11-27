import {RuleTester} from 'eslint';
import {RuleTester as TSRuleTester} from '@typescript-eslint/rule-tester';
import {parseForESLint} from '@typescript-eslint/parser';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import {preferArrayFill} from './prefer-array-fill.js';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

const tsSyntaxRuleTester = new TSRuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  }
});

const typedRuleTester = new TSRuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts'],
        defaultProject: './tsconfig.json'
      },
      tsconfigRootDir: rootDir
    }
  }
});

ruleTester.run('prefer-array-fill', preferArrayFill as never, {
  valid: [
    // Already using .fill()
    'const arr = Array.from({length: 5}).fill(0)',
    'const arr = Array(5).fill(0)',

    // Array.from with index parameter (not constant)
    'const arr = Array.from({length: 5}, (_, i) => i)',
    'const arr = Array.from({length: 5}, (v, i) => i)',

    // Spread Array with map using index parameter (not constant)
    'const arr = [...Array(5)].map((_, i) => i)',
    'const arr = [...Array(5)].map((v, i) => i * 2)',

    // Regular array creation
    'const arr = [1, 2, 3]',
    'const arr = []',

    // Array.from with different arguments
    'const arr = Array.from("hello")',
    'const arr = Array.from({length: 5})',

    // Map without spread Array
    'const arr = someArray.map(() => 0)',

    // Different patterns
    'const arr = new Array(5)',
    'const arr = Array(5)',

    // Non-constant callback - function call that could return different values each time
    'const arr = Array.from({length: 5}, () => faker.lorem.sentences(3))',
    'const arr = Array.from({length: 5}, () => Math.random())',
    'const arr = Array.from({length: 3}, function() { return faker.lorem.sentences(3) })',
    'const arr = Array.from({length: 5}, () => new Date())',
    'const arr = Array.from({length: 5}, () => [])',
    'const arr = [...Array(5)].map(() => faker.lorem.sentences(3))',
    'const arr = [...Array(5)].map(() => Math.random())',
    'const arr = [...Array(3)].map(function() { return Math.random() })',
    'const arr = [...Array(5)].map(() => new Foo())',

    // Non-constant callback - object/array literal creates new value each time
    'const arr = Array.from({length: 5}, () => ({}))',
    'const arr = [...Array(5)].map(() => [])',

    // Non-constant callback - logical/conditional containing a call
    'const arr = Array.from({length: 5}, () => a || getVal())',
    'const arr = [...Array(5)].map(() => a ? getVal() : b)'
  ],

  invalid: [
    // Array.from with arrow function returning constant
    {
      code: 'const arr = Array.from({length: 5}, () => 0)',
      output: 'const arr = Array.from({length: 5}).fill(0)',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Array.from with string value
    {
      code: 'const arr = Array.from({length: 3}, () => "test")',
      output: 'const arr = Array.from({length: 3}).fill("test")',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Array.from with expression in length
    {
      code: 'const arr = Array.from({length: 2 + 3}, () => 0)',
      output: 'const arr = Array.from({length: 2 + 3}).fill(0)',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Array.from with regular function expression
    {
      code: 'const arr = Array.from({length: 5}, function() { return 0 })',
      output: 'const arr = Array.from({length: 5}).fill(0)',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Spread Array with map and arrow function
    {
      code: 'const arr = [...Array(5)].map(() => 0)',
      output: 'const arr = Array(5).fill(0)',
      errors: [{messageId: 'preferFillSpreadMap'}]
    },

    // Spread Array with map and string value
    {
      code: 'const arr = [...Array(3)].map(() => "test")',
      output: 'const arr = Array(3).fill("test")',
      errors: [{messageId: 'preferFillSpreadMap'}]
    },

    // Spread Array with map and function expression
    {
      code: 'const arr = [...Array(5)].map(function() { return 1 })',
      output: 'const arr = Array(5).fill(1)',
      errors: [{messageId: 'preferFillSpreadMap'}]
    },

    // Multiple occurrences
    {
      code: `const arr1 = Array.from({length: 5}, () => 0);
const arr2 = [...Array(3)].map(() => "test");`,
      output: `const arr1 = Array.from({length: 5}).fill(0);
const arr2 = Array(3).fill("test");`,
      errors: [
        {messageId: 'preferFillArrayFrom'},
        {messageId: 'preferFillSpreadMap'}
      ]
    },

    // Used in expressions
    {
      code: 'console.log(Array.from({length: 5}, () => 0))',
      output: 'console.log(Array.from({length: 5}).fill(0))',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Used in return statements
    {
      code: 'function getArray() { return [...Array(5)].map(() => 0) }',
      output: 'function getArray() { return Array(5).fill(0) }',
      errors: [{messageId: 'preferFillSpreadMap'}]
    },

    // Variable length
    {
      code: 'const arr = Array.from({length: n}, () => 0)',
      output: 'const arr = Array.from({length: n}).fill(0)',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Complex expressions in value
    {
      code: 'const arr = [...Array(5)].map(() => 1 + 2)',
      output: 'const arr = Array(5).fill(1 + 2)',
      errors: [{messageId: 'preferFillSpreadMap'}]
    },

    // Logical expression with all-constant operands
    {
      code: 'const arr = Array.from({length: 5}, () => a ?? b)',
      output: 'const arr = Array.from({length: 5}).fill(a ?? b)',
      errors: [{messageId: 'preferFillArrayFrom'}]
    },

    // Conditional expression with all-constant branches
    {
      code: 'const arr = [...Array(5)].map(() => a ? b : c)',
      output: 'const arr = Array(5).fill(a ? b : c)',
      errors: [{messageId: 'preferFillSpreadMap'}]
    }
  ]
});

tsSyntaxRuleTester.run(
  'prefer-array-fill (typescript syntax)',
  preferArrayFill,
  {
    valid: [
      'const arr = Array.from<number>({length: 5}).fill(0)',
      'const arr = Array<number>(5).fill(0)',
      'const arr = Array.from({length: 5}, (_, i) => i)'
    ],
    invalid: [
      // .ts default filename: do not autofix; suggest typed form for literal
      {
        code: 'const a = Array.from({length: n}, () => 0)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output: 'const a = Array.from<number>({length: n}).fill(0)'
              }
            ]
          }
        ]
      },
      {
        code: 'const b = [...Array(n)].map(() => 0)',
        output: null,
        errors: [
          {
            messageId: 'preferFillSpreadMap',
            suggestions: [
              {
                messageId: 'replaceWithArrayFill',
                output: 'const b = Array<number>(n).fill(0)'
              }
            ]
          }
        ]
      },
      // Various TS file extensions: .tsx, .mts, .cts, and virtual Vue TS block
      {
        filename: 'Component.tsx',
        code: 'const arr = Array.from({length: 3}, () => "test")',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output:
                  'const arr = Array.from<string>({length: 3}).fill("test")'
              }
            ]
          }
        ]
      },
      {
        filename: 'utils.mts',
        code: 'const arr = [...Array(3)].map(() => true)',
        output: null,
        errors: [
          {
            messageId: 'preferFillSpreadMap',
            suggestions: [
              {
                messageId: 'replaceWithArrayFill',
                output: 'const arr = Array<boolean>(3).fill(true)'
              }
            ]
          }
        ]
      },
      {
        filename: 'utils.cts',
        code: 'const arr = Array.from({length: n}, () => null)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output: 'const arr = Array.from<null>({length: n}).fill(null)'
              }
            ]
          }
        ]
      },
      {
        filename: 'Component.vue/0_script.ts',
        code: 'const arr = Array.from({length: n}, () => 0)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output: 'const arr = Array.from<number>({length: n}).fill(0)'
              }
            ]
          }
        ]
      },
      // Non-literal identifier without type info: suggest untyped fill without autofixing
      {
        code: 'const arr = Array.from({length: n}, () => defaultValue)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output: 'const arr = Array.from({length: n}).fill(defaultValue)'
              }
            ]
          }
        ]
      },
      // Preserves explicit return type argument on Array.from<T, U>
      {
        code: 'const arr = Array.from<unknown, MyType>({length: n}, () => initial)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output:
                  'const arr = Array.from<MyType>({length: n}).fill(initial)'
              }
            ]
          }
        ]
      },
      // Preserves explicit return type argument on [...Array(n)].map<U>
      {
        code: 'const arr = [...Array(n)].map<0 | 1>(() => 0)',
        output: null,
        errors: [
          {
            messageId: 'preferFillSpreadMap',
            suggestions: [
              {
                messageId: 'replaceWithArrayFill',
                output: 'const arr = Array<0 | 1>(n).fill(0)'
              }
            ]
          }
        ]
      },
      {
        code: 'const arr = [...Array(n)].map<MyType>(() => initial)',
        output: null,
        errors: [
          {
            messageId: 'preferFillSpreadMap',
            suggestions: [
              {
                messageId: 'replaceWithArrayFill',
                output: 'const arr = Array<MyType>(n).fill(initial)'
              }
            ]
          }
        ]
      },
      // Detects TypeScript via Array<T>(n) type argument even with non-.ts filename
      {
        filename: '<input>',
        code: 'const arr = [...Array<unknown>(n)].map(() => 0)',
        output: null,
        errors: [
          {
            messageId: 'preferFillSpreadMap',
            suggestions: [
              {
                messageId: 'replaceWithArrayFill',
                output: 'const arr = Array<number>(n).fill(0)'
              }
            ]
          }
        ]
      },
      // Unary/binary expressions: only infer number/bigint when operands are known
      {
        code: 'const arr = Array.from({length: n}, () => -1)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output: 'const arr = Array.from<number>({length: n}).fill(-1)'
              }
            ]
          }
        ]
      },
      {
        code: 'const arr = Array.from({length: n}, () => -1n)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output: 'const arr = Array.from<bigint>({length: n}).fill(-1n)'
              }
            ]
          }
        ]
      },
      {
        code: 'const arr = Array.from({length: n}, () => -unknownVar)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output: 'const arr = Array.from({length: n}).fill(-unknownVar)'
              }
            ]
          }
        ]
      },
      {
        code: 'const arr = Array.from({length: n}, () => x * y)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output: 'const arr = Array.from({length: n}).fill(x * y)'
              }
            ]
          }
        ]
      },
      {
        code: 'const arr = Array.from({length: n}, () => +x)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output: 'const arr = Array.from<number>({length: n}).fill(+x)'
              }
            ]
          }
        ]
      },
      {
        code: 'const arr = Array.from({length: n}, () => x >>> 1)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output:
                  'const arr = Array.from<number>({length: n}).fill(x >>> 1)'
              }
            ]
          }
        ]
      },
      {
        code: 'const arr = Array.from({length: n}, () => 2n * 3n)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output:
                  'const arr = Array.from<bigint>({length: n}).fill(2n * 3n)'
              }
            ]
          }
        ]
      },
      // Narrow contextual type (e.g. union literal): no unsafe autofix
      {
        code: 'type Bit = 0 | 1; const bits: Bit[] = Array.from({length: n}, () => 0)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output:
                  'type Bit = 0 | 1; const bits: Bit[] = Array.from<number>({length: n}).fill(0)'
              }
            ]
          }
        ]
      },
      // Plain .js file parsed with @typescript-eslint/parser still autofixes
      {
        filename: 'plain.js',
        code: 'const arr = Array.from({length: n}, () => 0)',
        output: 'const arr = Array.from({length: n}).fill(0)',
        errors: [{messageId: 'preferFillArrayFrom'}]
      }
    ]
  }
);

// Verify Vue SFC `<script lang="ts">` detection via vue-eslint-parser's getDocumentFragment()
function createMockVueParser(lang?: string) {
  return {
    parseForESLint(code: string, options: Record<string, unknown>) {
      const result = parseForESLint(code, options);
      const attributes = lang
        ? [{type: 'VAttribute', key: {name: 'lang'}, value: {value: lang}}]
        : [];
      return {
        ...result,
        services: {
          ...result.services,
          getDocumentFragment: () => ({
            children: [
              {
                type: 'VElement',
                name: 'script',
                startTag: {attributes}
              }
            ]
          })
        }
      };
    }
  };
}

const vueTsRuleTester = new RuleTester({
  languageOptions: {
    parser: createMockVueParser('ts') as never,
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

vueTsRuleTester.run(
  'prefer-array-fill (vue lang="ts")',
  preferArrayFill as never,
  {
    valid: [],
    invalid: [
      {
        filename: 'Component.vue',
        code: 'const arr = Array.from({length: n}, () => 0)',
        output: null,
        errors: [
          {
            messageId: 'preferFillArrayFrom',
            suggestions: [
              {
                messageId: 'replaceWithArrayFromFill',
                output: 'const arr = Array.from<number>({length: n}).fill(0)'
              }
            ]
          }
        ]
      }
    ]
  }
);

const vueJsRuleTester = new RuleTester({
  languageOptions: {
    parser: createMockVueParser() as never,
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

vueJsRuleTester.run('prefer-array-fill (vue js)', preferArrayFill as never, {
  valid: [],
  invalid: [
    {
      filename: 'Component.vue',
      code: 'const arr = Array.from({length: n}, () => 0)',
      output: 'const arr = Array.from({length: n}).fill(0)',
      errors: [{messageId: 'preferFillArrayFrom'}]
    }
  ]
});

typedRuleTester.run('prefer-array-fill (typed)', preferArrayFill, {
  valid: [
    'const arr = Array.from<number>({length: 5}).fill(0);',
    'const arr = Array<number>(5).fill(0);'
  ],
  invalid: [
    // Issue #179 repro: inferred number[] must not be autofixed to unknown[] or any[]
    {
      code: `
        const n = 3;
        const a = Array.from({length: n}, () => 0);
      `,
      output: null,
      errors: [
        {
          messageId: 'preferFillArrayFrom',
          suggestions: [
            {
              messageId: 'replaceWithArrayFromFill',
              output: `
        const n = 3;
        const a = Array.from<number>({length: n}).fill(0);
      `
            }
          ]
        }
      ]
    },
    {
      code: `
        const n = 3;
        const b = [...Array(n)].map(() => 0);
      `,
      output: null,
      errors: [
        {
          messageId: 'preferFillSpreadMap',
          suggestions: [
            {
              messageId: 'replaceWithArrayFill',
              output: `
        const n = 3;
        const b = Array<number>(n).fill(0);
      `
            }
          ]
        }
      ]
    },
    // Typed variable value infers primitive type argument for suggestion
    {
      code: `
        declare const label: string;
        const arr = Array.from({length: 3}, () => label);
      `,
      output: null,
      errors: [
        {
          messageId: 'preferFillArrayFrom',
          suggestions: [
            {
              messageId: 'replaceWithArrayFromFill',
              output: `
        declare const label: string;
        const arr = Array.from<string>({length: 3}).fill(label);
      `
            }
          ]
        }
      ]
    },
    // Complex object reference does not emit unimportable type text
    {
      code: `
        interface Item { id: number }
        declare const item: Item;
        const arr = [...Array(3)].map(() => item);
      `,
      output: null,
      errors: [
        {
          messageId: 'preferFillSpreadMap',
          suggestions: [
            {
              messageId: 'replaceWithArrayFill',
              output: `
        interface Item { id: number }
        declare const item: Item;
        const arr = Array(3).fill(item);
      `
            }
          ]
        }
      ]
    }
  ]
});
