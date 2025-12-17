import {RuleTester} from 'eslint';
import {describe, it, afterAll} from 'vitest';
import {RuleTester as TSRuleTester} from '@typescript-eslint/rule-tester';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

TSRuleTester.afterAll = afterAll;
TSRuleTester.describe = describe;
TSRuleTester.it = it;
TSRuleTester.itOnly = it.only;
