import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Linter} from 'eslint';
import globals from 'globals';

test('CAL-01: app event handlers cannot reference undeclared bindings',()=>{
  // App historically disables lint; explicitly check scope so a missing store
  // binding cannot silently pass build and break a user-triggered action.
  const source=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
  const diagnostics=new Linter().verify(source,{
    languageOptions:{ecmaVersion:'latest',sourceType:'module',globals:globals.browser,
      parserOptions:{ecmaFeatures:{jsx:true}}},
    rules:{'no-undef':'error'}
  },{allowInlineConfig:false});
  assert.deepEqual(diagnostics.filter(d=>d.severity===2),[]);
});
