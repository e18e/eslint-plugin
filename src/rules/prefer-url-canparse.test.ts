import {RuleTester} from 'eslint';
import {preferUrlCanParse} from './prefer-url-canparse.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-url-canparse', preferUrlCanParse, {
  valid: [
    // Normal URL construction without try-catch
    {
      code: `
        function normalFunction() {
          const url = new URL('https://example.com');
          return url.href;
        }
      `
    },
    // Try-catch without URL pattern
    {
      code: `
        try {
          riskyOperation();
        } catch {
          console.error('Error');
        }
      `
    },
    // Try-catch with URL but not as first statement
    {
      code: `
        function test() {
          try {
            doSomething();
            new URL(u);
            return true;
          } catch {
            return false;
          }
        }
      `
    },
    // Try without catch
    {
      code: `
        try {
          new URL(u);
        } finally {
          cleanup();
        }
      `
    }
  ],
  invalid: [
    // Simple boolean return pattern
    {
      code: `
        function isValidUrl(u) {
          try {
            new URL(u);
            return true;
          } catch {
            return false;
          }
        }
      `,
      errors: [
        {
          messageId: 'preferCanParse',
          line: 3,
          column: 11,
          suggestions: [
            {
              messageId: 'replaceWithCanParse',
              output: `
        function isValidUrl(u) {
          return URL.canParse(u)
        }
      `
            }
          ]
        }
      ]
    },
    // Try-catch with body and catch body
    {
      code: `
        function processUrl(u) {
          try {
            new URL(u);
            console.log('Valid URL');
            doSomething(u);
          } catch {
            console.error('Invalid URL');
          }
        }
      `,
      errors: [
        {
          messageId: 'preferCanParse',
          line: 3,
          column: 11,
          suggestions: [
            {
              messageId: 'replaceWithCanParse',
              output: `
        function processUrl(u) {
          if (URL.canParse(u)) {
console.log('Valid URL');
            doSomething(u);
} else {
console.error('Invalid URL');
}
        }
      `
            }
          ]
        }
      ]
    },
    // Try-catch with only try body (no catch body)
    {
      code: `
        function processUrl(u) {
          try {
            new URL(u);
            console.log('Valid URL');
          } catch {
          }
        }
      `,
      errors: [
        {
          messageId: 'preferCanParse',
          line: 3,
          column: 11,
          suggestions: [
            {
              messageId: 'replaceWithCanParse',
              output: `
        function processUrl(u) {
          if (URL.canParse(u)) {
console.log('Valid URL');
}
        }
      `
            }
          ]
        }
      ]
    },
    // With second URL argument (base)
    {
      code: `
        function test() {
          try {
            new URL(path, base);
            return true;
          } catch {
            return false;
          }
        }
      `,
      errors: [
        {
          messageId: 'preferCanParse',
          line: 3,
          column: 11,
          suggestions: [
            {
              messageId: 'replaceWithCanParse',
              output: `
        function test() {
          return URL.canParse(path, base)
        }
      `
            }
          ]
        }
      ]
    }
  ]
});
