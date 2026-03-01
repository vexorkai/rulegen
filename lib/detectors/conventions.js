'use strict';

const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out',
  '__pycache__', 'target', 'vendor', 'venv', '.venv', 'coverage',
]);

/**
 * Detect coding conventions from the codebase:
 * - File naming style (camelCase, kebab-case, snake_case, PascalCase)
 * - Test patterns (colocated, separate dir, naming conventions)
 * - Import style (ESM vs CJS)
 * - Common patterns
 */
function detectConventions(root) {
  const files = collectFiles(root);
  
  const naming = detectNamingConvention(files);
  const testStyle = detectTestStyle(files);
  const importStyle = detectImportStyle(root, files);
  const codeStyle = detectCodeStyle(root);
  const avoidList = detectAvoid(root);

  return {
    naming,
    testStyle,
    importStyle,
    codeStyle,
    avoidList,
  };
}

function collectFiles(root, maxDepth = 4) {
  const files = [];
  const walk = (dir, depth) => {
    if (depth > maxDepth) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (IGNORE_DIRS.has(e.name) || e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      const rel = path.relative(root, full);
      if (e.isDirectory()) {
        walk(full, depth + 1);
      } else {
        files.push({ name: e.name, rel, full, ext: path.extname(e.name) });
      }
    }
  };
  walk(root, 0);
  return files;
}

function detectNamingConvention(files) {
  const srcFiles = files.filter(f => 
    ['.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go', '.rs'].includes(f.ext) &&
    !f.name.includes('.test.') && !f.name.includes('.spec.') &&
    !f.name.startsWith('index')
  );

  const counts = { camelCase: 0, kebabCase: 0, snakeCase: 0, PascalCase: 0 };
  for (const f of srcFiles) {
    const base = path.basename(f.name, f.ext);
    if (/^[A-Z][a-zA-Z0-9]*$/.test(base)) counts.PascalCase++;
    else if (/^[a-z][a-zA-Z0-9]*[A-Z]/.test(base)) counts.camelCase++;
    else if (base.includes('-')) counts.kebabCase++;
    else if (base.includes('_')) counts.snakeCase++;
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return 'Unable to determine (too few files)';

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [dominant, count] = sorted[0];
  const pct = Math.round((count / total) * 100);

  if (pct < 40) return 'Mixed naming conventions';

  const styleNames = {
    camelCase: 'camelCase (e.g., myComponent.ts)',
    kebabCase: 'kebab-case (e.g., my-component.ts)',
    snakeCase: 'snake_case (e.g., my_component.py)',
    PascalCase: 'PascalCase (e.g., MyComponent.tsx)',
  };
  return styleNames[dominant];
}

function detectTestStyle(files) {
  const testFiles = files.filter(f =>
    f.name.includes('.test.') || f.name.includes('.spec.') ||
    f.rel.includes('/test/') || f.rel.includes('/tests/') ||
    f.rel.includes('/__tests__/') || f.rel.includes('/spec/')
  );

  if (testFiles.length === 0) return 'No test files detected';

  const colocated = testFiles.filter(f =>
    f.name.includes('.test.') || f.name.includes('.spec.')
  ).length;
  const inDir = testFiles.filter(f =>
    f.rel.includes('/test/') || f.rel.includes('/tests/') ||
    f.rel.includes('/__tests__/') || f.rel.includes('/spec/')
  ).length;

  const styles = [];
  if (colocated > 0) styles.push('colocated with source (*.test.* / *.spec.*)');
  if (inDir > 0) styles.push('in dedicated test directory');
  
  return styles.join(' and ') || 'test files present';
}

function detectImportStyle(root, files) {
  const jsFiles = files.filter(f => ['.js', '.ts', '.mjs', '.cjs'].includes(f.ext));
  if (jsFiles.length === 0) return null;

  // Sample up to 10 files
  const sample = jsFiles.slice(0, 10);
  let esm = 0, cjs = 0;
  for (const f of sample) {
    let content;
    try { content = fs.readFileSync(f.full, 'utf8').slice(0, 2000); } catch { continue; }
    if (content.includes('import ') && content.includes(' from ')) esm++;
    if (content.includes('require(') || content.includes('module.exports')) cjs++;
  }

  if (esm > cjs) return 'ES Modules (import/export)';
  if (cjs > esm) return 'CommonJS (require/module.exports)';
  if (esm > 0 && cjs > 0) return 'Mixed (ESM and CJS)';
  return null;
}

function detectCodeStyle(root) {
  const notes = [];
  const has = (f) => fs.existsSync(path.join(root, f));
  const read = (f) => { try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch { return null; } };

  // TypeScript strictness
  const tsconfig = read('tsconfig.json');
  if (tsconfig) {
    try {
      const tc = JSON.parse(tsconfig);
      const co = tc.compilerOptions || {};
      if (co.strict) notes.push('TypeScript strict mode enabled');
      if (co.noUncheckedIndexedAccess) notes.push('noUncheckedIndexedAccess enabled');
    } catch {}
  }

  // ESLint presence
  const eslintFiles = ['.eslintrc', '.eslintrc.js', '.eslintrc.json', '.eslintrc.yaml', 'eslint.config.js', 'eslint.config.ts', 'eslint.config.mjs'];
  if (eslintFiles.some(has)) notes.push('ESLint configured');

  // Prettier
  const prettierFiles = ['.prettierrc', '.prettierrc.js', '.prettierrc.json', '.prettierrc.yaml', 'prettier.config.js'];
  if (prettierFiles.some(has)) notes.push('Prettier configured');

  // Biome
  if (has('biome.json')) notes.push('Biome configured (linter + formatter)');

  // editorconfig
  if (has('.editorconfig')) {
    const ec = read('.editorconfig') || '';
    const indentMatch = ec.match(/indent_size\s*=\s*(\d+)/);
    const tabsMatch = ec.match(/indent_style\s*=\s*(tab|space)/);
    if (indentMatch && tabsMatch) {
      notes.push(`Indentation: ${tabsMatch[1] === 'tab' ? 'tabs' : `${indentMatch[1]} spaces`} (from .editorconfig)`);
    }
  }

  return notes;
}

function detectAvoid(root) {
  const avoid = [];
  const has = (f) => fs.existsSync(path.join(root, f));
  const read = (f) => { try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch { return null; } };

  // gitignore-based avoids
  const gi = read('.gitignore') || '';
  const giLines = gi.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const avoidFromGi = giLines
    .filter(l => !l.startsWith('!'))
    .slice(0, 10)
    .map(l => l.replace(/^\//, '').replace(/\/$/, ''));
  
  if (avoidFromGi.length > 0) {
    avoid.push('Do not commit: ' + avoidFromGi.slice(0, 8).join(', '));
  }

  // Common patterns
  if (has('node_modules')) avoid.push('Never import directly from node_modules');
  if (has('.env') || has('.env.local')) avoid.push('Do not commit .env files with secrets');
  
  const pkg = read('package.json');
  if (pkg) {
    try {
      const p = JSON.parse(pkg);
      if (p.private) avoid.push('Package is private — not meant for npm publishing');
    } catch {}
  }

  return avoid;
}

module.exports = { detectConventions };
