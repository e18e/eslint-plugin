import {RuleTester} from 'eslint';
import {rules} from 'eslint-plugin-depend';
import json from '@eslint/json';
import jsoncParser from 'jsonc-eslint-parser';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

const jsonRuleTester = new RuleTester({
  language: 'json/json',
  plugins: {json}
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
    'import {readFile} from "fs/promises"',
    {
      code: `{"dependencies": {"typescript": "^5.3.2"}}`,
      filename: 'package.json',
      languageOptions: {parser: jsoncParser}
    }
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
    },
    {
      code: `{"dependencies": {"moment": "^1.0.0"}}`,
      filename: 'package.json',
      languageOptions: {parser: jsoncParser},
      errors: [{messageId: 'documentedReplacement'}]
    }
  ]
});

jsonRuleTester.run('ban-dependencies (JSON)', banDependencies, {
  valid: [
    {
      filename: 'package.json',
      code: `{"dependencies": {"typescript": "^5.3.2"}}`
    }
  ],
  invalid: [
    {
      filename: 'package.json',
      code: `{"dependencies": {"moment": "^1.0.0"}}`,
      errors: [{messageId: 'documentedReplacement'}]
    }
  ]
});
