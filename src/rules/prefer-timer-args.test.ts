import {RuleTester} from 'eslint';
import {preferTimerArgs} from './prefer-timer-args.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-timer-args', preferTimerArgs, {
  valid: [
    // Already using timer args correctly
    'setTimeout(doSomething, 100)',
    'setTimeout(doSomething, 100, a, b)',

    // Arrow functions with block bodies (multiple statements or return)
    'setTimeout(() => { doSomething(a, b); }, 100)',
    'setTimeout(() => { console.log("hi"); doSomething(); }, 100)',
    'setTimeout(() => { return doSomething(a); }, 100)',

    // Arrow functions with parameters
    'setTimeout((x) => doSomething(x), 100)',

    // Function expressions
    'setTimeout(function() { doSomething(); }, 100)',

    // Non-timer calls
    'requestAnimationFrame(() => render())',

    // Arrow function body is not a call expression
    'setTimeout(() => a + b, 100)',
    'setTimeout(() => obj.prop, 100)',

    // bind() with non-null/undefined context (skipped, could change behavior)
    'setTimeout(fn.bind(this, a, b), 100)',
    'setTimeout(fn.bind(obj, a, b), 100)',

    // bind() with no arguments
    'setTimeout(fn.bind(), 100)',

    // Non-bind method calls
    'setTimeout(fn.call(null, a, b), 100)',
    'setTimeout(fn.apply(null, args), 100)',

    // Unsafe transformations - arguments contain call expressions
    'setTimeout(() => fn(getData()), 100)',
    'setTimeout(() => fn(obj.method()), 100)',
    'setTimeout(() => fn(a + getData()), 100)',
    'setTimeout(() => fn([getData()]), 100)',
    'setTimeout(() => fn({key: getData()}), 100)',
    'setTimeout(fn.bind(null, getData()), 100)',

    // window.setTimeout examples
    'window.setTimeout(doSomething, 100)',
    'window.setTimeout(() => { doSomething(a); }, 100)',
    'window.setTimeout((x) => doSomething(x), 100)',
    'window.setTimeout(fn.bind(this, a), 100)',

    // globalThis.setTimeout examples
    'globalThis.setTimeout(doSomething, 100, a, b)',
    'globalThis.setTimeout(() => { doSomething(a); }, 100)',
    'globalThis.setTimeout(fn.bind(this, a), 100)',

    // setInterval examples
    'setInterval(doSomething, 100)',
    'setInterval(() => { doSomething(a); }, 100)',
    'setInterval((x) => doSomething(x), 100)',
    'setInterval(fn.bind(this, a), 100)',
    'setInterval(() => fn(getData()), 100)',
    'window.setInterval(() => { fn(a); }, 100)',
    'globalThis.setInterval(fn.bind(obj, a), 100)',

    // Edge cases
    'setTimeout()',
    'setTimeout(() => fn())',
    'notSetTimeout(() => doSomething(a), 100)'
  ],

  invalid: [
    // Basic case
    {
      code: 'setTimeout(() => doSomething(a, b), 100)',
      output: 'setTimeout(doSomething, 100, a, b)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // No arguments to the inner function
    {
      code: 'setTimeout(() => doSomething(), 100)',
      output: 'setTimeout(doSomething, 100)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // Single argument
    {
      code: 'setTimeout(() => fn(x), 1000)',
      output: 'setTimeout(fn, 1000, x)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // Multiple arguments
    {
      code: 'setTimeout(() => process(a, b, c), 0)',
      output: 'setTimeout(process, 0, a, b, c)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // Method calls
    {
      code: 'setTimeout(() => obj.method(arg), 100)',
      output: 'setTimeout(obj.method, 100, arg)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // Nested property access
    {
      code: 'setTimeout(() => this.handler.process(data), 500)',
      output: 'setTimeout(this.handler.process, 500, data)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // Complex expressions as arguments (safe - no calls)
    {
      code: 'setTimeout(() => fn(a + b, c * d), 100)',
      output: 'setTimeout(fn, 100, a + b, c * d)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // Multiple occurrences
    {
      code: `setTimeout(() => fn1(a), 100);
setTimeout(() => fn2(b, c), 200);`,
      output: `setTimeout(fn1, 100, a);
setTimeout(fn2, 200, b, c);`,
      errors: [
        {
          messageId: 'preferArgs'
        },
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // In different contexts
    {
      code: 'const timer = setTimeout(() => cleanup(resource), 5000)',
      output: 'const timer = setTimeout(cleanup, 5000, resource)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // With spread arguments in the inner call
    {
      code: 'setTimeout(() => fn(...args), 100)',
      output: 'setTimeout(fn, 100, ...args)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // Chained method calls
    {
      code: 'setTimeout(() => arr.filter(fn).map(transform), 100)',
      output: 'setTimeout(arr.filter(fn).map, 100, transform)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // bind() with null context
    {
      code: 'setTimeout(fn.bind(null, a, b), 100)',
      output: 'setTimeout(fn, 100, a, b)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // bind() with undefined context
    {
      code: 'setTimeout(fn.bind(undefined, x), 200)',
      output: 'setTimeout(fn, 200, x)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // bind() with null and multiple arguments
    {
      code: 'setTimeout(process.bind(null, arg1, arg2, arg3), 500)',
      output: 'setTimeout(process, 500, arg1, arg2, arg3)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // bind() with undefined and no additional arguments
    {
      code: 'setTimeout(doSomething.bind(undefined), 1000)',
      output: 'setTimeout(doSomething, 1000)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // bind() on method with null context
    {
      code: 'setTimeout(obj.method.bind(null, arg), 100)',
      output: 'setTimeout(obj.method, 100, arg)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // bind() with null in complex expression
    {
      code: 'const timer = setTimeout(handler.bind(null, event, data), 0)',
      output: 'const timer = setTimeout(handler, 0, event, data)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // Multiple occurrences with mixed patterns
    {
      code: `setTimeout(() => fn1(a), 100);
setTimeout(fn2.bind(null, b, c), 200);`,
      output: `setTimeout(fn1, 100, a);
setTimeout(fn2, 200, b, c);`,
      errors: [
        {
          messageId: 'preferArgs'
        },
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // window.setTimeout with arrow function
    {
      code: 'window.setTimeout(() => doSomething(a, b), 100)',
      output: 'window.setTimeout(doSomething, 100, a, b)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // window.setTimeout with no arguments
    {
      code: 'window.setTimeout(() => fn(), 1000)',
      output: 'window.setTimeout(fn, 1000)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // window.setTimeout with bind(null)
    {
      code: 'window.setTimeout(fn.bind(null, arg1, arg2), 500)',
      output: 'window.setTimeout(fn, 500, arg1, arg2)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // window.setTimeout with bind(undefined)
    {
      code: 'window.setTimeout(handler.bind(undefined, data), 0)',
      output: 'window.setTimeout(handler, 0, data)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // globalThis.setTimeout with arrow function
    {
      code: 'globalThis.setTimeout(() => doSomething(a, b), 100)',
      output: 'globalThis.setTimeout(doSomething, 100, a, b)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // globalThis.setTimeout with bind(null)
    {
      code: 'globalThis.setTimeout(fn.bind(null, arg1, arg2), 500)',
      output: 'globalThis.setTimeout(fn, 500, arg1, arg2)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // Multiple matches with different setTimeout variants
    {
      code: `setTimeout(() => fn1(a), 100);
window.setTimeout(fn2.bind(null, b), 200);
globalThis.setTimeout(() => fn3(c), 300);`,
      output: `setTimeout(fn1, 100, a);
window.setTimeout(fn2, 200, b);
globalThis.setTimeout(fn3, 300, c);`,
      errors: [
        {
          messageId: 'preferArgs'
        },
        {
          messageId: 'preferArgs'
        },
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // setInterval with arrow function
    {
      code: 'setInterval(() => doSomething(a, b), 100)',
      output: 'setInterval(doSomething, 100, a, b)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // setInterval with bind(null)
    {
      code: 'setInterval(fn.bind(null, arg1, arg2), 500)',
      output: 'setInterval(fn, 500, arg1, arg2)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // window.setInterval
    {
      code: 'window.setInterval(() => fn(x), 1000)',
      output: 'window.setInterval(fn, 1000, x)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // globalThis.setInterval
    {
      code: 'globalThis.setInterval(() => process(data), 100)',
      output: 'globalThis.setInterval(process, 100, data)',
      errors: [
        {
          messageId: 'preferArgs'
        }
      ]
    },

    // Mixed setTimeout and setInterval
    {
      code: `setTimeout(() => fn1(a), 100);
setInterval(() => fn2(b), 200);`,
      output: `setTimeout(fn1, 100, a);
setInterval(fn2, 200, b);`,
      errors: [
        {
          messageId: 'preferArgs'
        },
        {
          messageId: 'preferArgs'
        }
      ]
    }
  ]
});
