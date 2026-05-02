import {RuleTester} from 'eslint';
import {preferIncludesOverRegexTest} from './prefer-includes-over-regex-test.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-includes-over-regex-test', preferIncludesOverRegexTest, {
  valid: [
    // already using string methods
    "s.includes('foo');",
    "s.startsWith('foo');",
    "s.endsWith('foo');",

    // regex with special characters
    '/foo.bar/.test(s);',
    '/foo+/.test(s);',
    '/[abc]/.test(s);',
    '/(foo|bar)/.test(s);',
    '/\\d/.test(s);',
    '/foo\\$/.test(s);',

    // regex with flags (semantics differ)
    '/foo/i.test(s);',
    '/foo/g.test(s);',

    // empty regex bodies
    '/^$/.test(s);', // matches empty — could autofix to s==='' but skipped
    '/^/.test(s);',
    '/$/.test(s);',

    // wrong receiver / method
    'regex.test(s);',
    "s.test('foo');",
    '/foo/.exec(s);',

    // .test() with extra args
    '/foo/.test(s, extra);',

    // RegExp constructor (not a literal)
    "new RegExp('foo').test(s);"
  ],

  invalid: [
    // plain — includes
    {
      code: 'if (/foo/.test(s)) {}',
      output: 'if (s.includes("foo")) {}',
      errors: [{messageId: 'preferIncludes'}]
    },

    // start anchor — startsWith
    {
      code: 'if (/^foo/.test(s)) {}',
      output: 'if (s.startsWith("foo")) {}',
      errors: [{messageId: 'preferStartsWith'}]
    },

    // end anchor — endsWith
    {
      code: 'if (/foo$/.test(s)) {}',
      output: 'if (s.endsWith("foo")) {}',
      errors: [{messageId: 'preferEndsWith'}]
    },

    // both anchors — equals
    {
      code: 'if (/^foo$/.test(s)) {}',
      output: 'if (s === "foo") {}',
      errors: [{messageId: 'preferEquals'}]
    },

    // numeric/alphanumeric pattern
    {
      code: '/abc123/.test(s);',
      output: 's.includes("abc123");',
      errors: [{messageId: 'preferIncludes'}]
    },

    // arg is a call expression — no extra parens
    {
      code: '/foo/.test(getStr());',
      output: 'getStr().includes("foo");',
      errors: [{messageId: 'preferIncludes'}]
    },

    // arg is a logical expression — needs parens
    {
      code: '/foo/.test(a || b);',
      output: '(a || b).includes("foo");',
      errors: [{messageId: 'preferIncludes'}]
    },

    // arg is a conditional — needs parens, especially for the equals case
    {
      code: '/^foo$/.test(x ? a : b);',
      output: '(x ? a : b) === "foo";',
      errors: [{messageId: 'preferEquals'}]
    },

    // double-quoted literal in pattern handled fine
    {
      code: '/abc/.test(s);',
      output: 's.includes("abc");',
      errors: [{messageId: 'preferIncludes'}]
    }
  ]
});
