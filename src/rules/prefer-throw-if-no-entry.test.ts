import {RuleTester} from 'eslint';
import {preferThrowIfNoEntry} from './prefer-throw-if-no-entry.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('prefer-throw-if-no-entry', preferThrowIfNoEntry, {
  valid: [
    'try { statSync(p, {throwIfNoEntry: false}); } catch {}',
    'try { fs.statSync(p, {throwIfNoEntry: false}); } catch {}',
    'try { lstatSync(p, {bigint: true, throwIfNoEntry: false}); } catch {}',
    "try { statSync(p, {'throwIfNoEntry': false}); } catch {}",
    "try { statSync(p, {['throwIfNoEntry']: false}); } catch {}",
    'try { statSync(p, {throwIfNoEntry: true}); } catch {}',
    'statSync(p);',
    'fs.statSync(p);',
    'const s = statSync(p);',
    'try { JSON.parse(s); } catch {}',
    'try { otherFn(); } catch {}',
    'try { otherFn(); } catch { statSync(p); }',
    'try { try { x(); } catch { statSync(p); } } catch {}',
    'try { fs.statSync(p); } finally { cleanup(); }',
    'try { x(); } catch {} finally { statSync(p); }',
    'try { fstatSync(fd); } catch {}',
    'try { setTimeout(() => statSync(p), 0); } catch {}',
    'try { const fn = () => statSync(p); fn(); } catch {}',
    'try { items.map(item => statSync(item)); } catch {}'
  ],

  invalid: [
    {
      code: 'function isDir(p) { try { return statSync(p)?.isDirectory() ?? false; } catch { return false; } }',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output:
                'function isDir(p) { try { return statSync(p, {throwIfNoEntry: false})?.isDirectory() ?? false; } catch { return false; } }'
            }
          ]
        }
      ]
    },
    {
      code: 'try { statSync(p); } catch {}',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output: 'try { statSync(p, {throwIfNoEntry: false}); } catch {}'
            }
          ]
        }
      ]
    },
    {
      code: 'try { fs.statSync(p); } catch {}',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output:
                'try { fs.statSync(p, {throwIfNoEntry: false}); } catch {}'
            }
          ]
        }
      ]
    },
    {
      code: 'try { lstatSync(p); } catch {}',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output: 'try { lstatSync(p, {throwIfNoEntry: false}); } catch {}'
            }
          ]
        }
      ]
    },
    {
      code: 'try { const s = statSync(p); use(s); } catch {}',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output:
                'try { const s = statSync(p, {throwIfNoEntry: false}); use(s); } catch {}'
            }
          ]
        }
      ]
    },
    {
      code: 'function f(p) { try { return statSync(p); } catch {} }',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output:
                'function f(p) { try { return statSync(p, {throwIfNoEntry: false}); } catch {} }'
            }
          ]
        }
      ]
    },
    {
      code: 'function f(p) { try { return statSync(p).isDirectory(); } catch {} }',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output:
                'function f(p) { try { return statSync(p, {throwIfNoEntry: false}).isDirectory(); } catch {} }'
            }
          ]
        }
      ]
    },
    {
      code: 'try { statSync((p)); } catch {}',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output: 'try { statSync((p), {throwIfNoEntry: false}); } catch {}'
            }
          ]
        }
      ]
    },
    {
      code: 'try { statSync(p, {}); } catch {}',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output: 'try { statSync(p, {throwIfNoEntry: false}); } catch {}'
            }
          ]
        }
      ]
    },
    {
      code: 'try { statSync(p, {bigint: true}); } catch {}',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output:
                'try { statSync(p, {bigint: true, throwIfNoEntry: false}); } catch {}'
            }
          ]
        }
      ]
    },
    {
      code: 'try { statSync(p, options); } catch {}',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: []
        }
      ]
    },
    {
      code: 'try { statSync(...args); } catch {}',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: []
        }
      ]
    },
    {
      code: 'try { if (statSync(p)) doStuff(); } catch {}',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output:
                'try { if (statSync(p, {throwIfNoEntry: false})) doStuff(); } catch {}'
            }
          ]
        }
      ]
    },
    {
      code: 'try { try { statSync(p); } catch {} } catch {}',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output:
                'try { try { statSync(p, {throwIfNoEntry: false}); } catch {} } catch {}'
            }
          ]
        }
      ]
    },
    {
      code: 'try { statSync(a); lstatSync(b); } catch {}',
      output: null,
      errors: [
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output:
                'try { statSync(a, {throwIfNoEntry: false}); lstatSync(b); } catch {}'
            }
          ]
        },
        {
          messageId: 'preferThrowIfNoEntry',
          suggestions: [
            {
              messageId: 'addThrowIfNoEntryOption',
              output:
                'try { statSync(a); lstatSync(b, {throwIfNoEntry: false}); } catch {}'
            }
          ]
        }
      ]
    }
  ]
});
