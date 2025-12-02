import {RuleTester} from 'eslint';
import {rules} from 'eslint-plugin-depend';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

// TODO (jg): one day the ban-dependencies rule will live in this repo, so
// we should move all the tests from the depend repo to here.

const banDependencies = rules['ban-dependencies']!;

ruleTester.run('ban-dependencies', banDependencies, {
  valid: [
    // Allowed dependencies
    'import {onMount} from "svelte"',
    'import App from "./App.svelte"',
    'const fs = require("fs")',

    // Built-in modules are allowed
    'import path from "path"',
    'import {readFile} from "fs/promises"'
  ],
  invalid: [
    {
      code: 'import moment from "moment"',
      errors: [{messageId: 'documentedReplacement'}]
    },
    {
      code: 'const moment = require("moment")',
      errors: [{messageId: 'documentedReplacement'}]
    },
    {
      code: 'import _ from "lodash"',
      errors: [{messageId: 'documentedReplacement'}]
    }
  ]
});
