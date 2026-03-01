'use strict';

const fs = require('fs');
const path = require('path');

const ALWAYS_IGNORE = new Set([
  'node_modules', '.git', '.next', '.nuxt', 'dist', 'build', 'out',
  '__pycache__', '.pytest_cache', 'target', 'vendor', 'venv', '.venv',
  'coverage', '.nyc_output', 'tmp', 'temp', '.cache', '.turbo',
]);

/**
 * Build a directory tree string (like `tree` command).
 * Also return key files detected.
 */
function analyzeStructure(root) {
  const gitignored = loadGitignore(root);
  const lines = [];
  const keyFiles = [];

  const KEY_FILE_PATTERNS = [
    { pattern: /^(package\.json|pyproject\.toml|Cargo\.toml|go\.mod|Gemfile|pom\.xml|build\.gradle)$/, label: 'Project manifest' },
    { pattern: /^(\.env\.example|\.env\.sample|\.env\.template)$/, label: 'Env template' },
    { pattern: /^(CLAUDE\.md|\.cursorrules|\.cursor\/rules)$/, label: 'AI context' },
    { pattern: /^(docker-compose\.yml|docker-compose\.yaml|Dockerfile)$/, label: 'Container config' },
    { pattern: /^(Makefile|justfile|taskfile\.yml|Taskfile\.yml)$/, label: 'Task runner' },
    { pattern: /^(\.github\/workflows)$/, label: 'CI/CD' },
    { pattern: /^(vite\.config\.[jt]s|webpack\.config\.[jt]s|rollup\.config\.[jt]s|next\.config\.[jm]?[jt]s)$/, label: 'Build config' },
    { pattern: /^(jest\.config\.[jt]s|vitest\.config\.[jt]s|playwright\.config\.[jt]s)$/, label: 'Test config' },
    { pattern: /^(tsconfig\.json|jsconfig\.json)$/, label: 'TS config' },
    { pattern: /^(\.eslintrc.*|eslint\.config\.[jt]s|\.prettierrc.*)$/, label: 'Linter/formatter' },
    { pattern: /^(CONTRIBUTING\.md|ARCHITECTURE\.md|DEVELOPMENT\.md|docs\/)$/, label: 'Developer docs' },
    { pattern: /^(prisma\/schema\.prisma|schema\.prisma)$/, label: 'DB schema' },
    { pattern: /^(migrations\/|db\/migrate\/)$/, label: 'DB migrations' },
  ];

  function shouldIgnore(name) {
    if (ALWAYS_IGNORE.has(name)) return true;
    if (gitignored.has(name)) return true;
    return false;
  }

  function walkTree(dir, prefix, depth, relDir) {
    if (depth > 3) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    
    // Dirs first, then files; skip ignored
    const filtered = entries.filter(e => !shouldIgnore(e.name));
    filtered.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (let i = 0; i < filtered.length; i++) {
      const e = filtered[i];
      const isLast = i === filtered.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';
      const relPath = relDir ? `${relDir}/${e.name}` : e.name;

      lines.push(prefix + connector + e.name + (e.isDirectory() ? '/' : ''));

      // Check if key file
      for (const { pattern, label } of KEY_FILE_PATTERNS) {
        if (pattern.test(relPath) || pattern.test(e.name)) {
          keyFiles.push({ path: relPath, label });
          break;
        }
      }

      if (e.isDirectory()) {
        walkTree(path.join(dir, e.name), prefix + childPrefix, depth + 1, relPath);
      }
    }
  }

  const rootName = path.basename(root);
  lines.push(rootName + '/');
  walkTree(root, '', 0, '');

  // Detect project type from structure
  const structureNotes = detectStructurePatterns(root);

  return {
    tree: lines.join('\n'),
    keyFiles,
    notes: structureNotes,
  };
}

function detectStructurePatterns(root) {
  const notes = [];
  const has = (f) => fs.existsSync(path.join(root, f));

  // Monorepo patterns
  if (has('packages') || has('apps')) {
    notes.push('Monorepo structure detected (packages/ or apps/ directory)');
  }
  // Src layout
  if (has('src')) notes.push('Source code in src/');
  // Test patterns
  if (has('test') || has('tests') || has('__tests__') || has('spec')) {
    notes.push('Tests in dedicated test directory');
  } else {
    // Check for colocated tests
    notes.push('Tests likely colocated with source (check for *.test.* or *.spec.* files)');
  }
  // Docs
  if (has('docs') || has('documentation')) notes.push('Documentation in docs/');
  // Scripts
  if (has('scripts')) notes.push('Helper scripts in scripts/');

  return notes;
}

function loadGitignore(root) {
  const ignored = new Set();
  const giPath = path.join(root, '.gitignore');
  if (!fs.existsSync(giPath)) return ignored;
  const lines = fs.readFileSync(giPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    // Only handle simple top-level patterns (not globs)
    const base = trimmed.replace(/^\//, '').replace(/\/$/, '').split('/')[0];
    if (base && !base.includes('*')) ignored.add(base);
  }
  return ignored;
}

module.exports = { analyzeStructure };
