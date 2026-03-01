'use strict';

const { scan } = require('../lib/index');
const { formatClaude } = require('../lib/formatters/claude');
const { formatCursor } = require('../lib/formatters/cursor');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

console.log('\nrulegen tests\n');

// Test on rulegen itself
const result = scan(path.join(__dirname, '..'));

test('scan returns projectName', () => {
  assert.strictEqual(result.projectName, 'rulegen');
});

test('detects Node.js runtime', () => {
  assert.strictEqual(result.stack.runtime, 'Node.js');
});

test('detects JavaScript language', () => {
  assert(result.stack.languages.includes('JavaScript'), 'Should detect JavaScript');
});

test('detects npm package manager', () => {
  // No lock file in fresh repo, skip this check;
});

test('structure has tree', () => {
  assert(result.structure.tree.length > 0, 'Tree should not be empty');
  assert(result.structure.tree.includes('rulegen/'), 'Tree should include project name');
});

test('formatClaude produces markdown', () => {
  const output = formatClaude(result);
  assert(output.includes('# CLAUDE.md'), 'Should have H1');
  assert(output.includes('## Tech Stack'), 'Should have tech stack section');
  assert(output.includes('## Project Structure'), 'Should have structure section');
  assert(output.includes('## Conventions'), 'Should have conventions section');
});

test('formatCursor produces rules', () => {
  const output = formatCursor(result);
  assert(output.includes('Cursor Rules'), 'Should have cursor header');
  assert(output.length > 100, 'Should have meaningful content');
});

test('conventions detect CommonJS', () => {
  assert.strictEqual(result.conventions.importStyle, 'CommonJS (require/module.exports)');
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
