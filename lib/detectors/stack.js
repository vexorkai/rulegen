'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Detect tech stack from a project root.
 * Returns { languages, frameworks, tools, packageManager, runtime }
 */
function detectStack(root) {
  const result = {
    languages: new Set(),
    frameworks: new Set(),
    tools: new Set(),
    packageManager: null,
    runtime: null,
    scripts: {},
    deps: {},
  };

  const has = (f) => fs.existsSync(path.join(root, f));
  const read = (f) => {
    try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch { return null; }
  };

  // --- Language detection by file extension ---
  const extCounts = countExtensions(root);
  const extLangMap = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
    '.py': 'Python',
    '.rb': 'Ruby',
    '.go': 'Go',
    '.rs': 'Rust',
    '.java': 'Java',
    '.kt': 'Kotlin',
    '.swift': 'Swift',
    '.cs': 'C#',
    '.cpp': 'C++', '.cc': 'C++', '.cxx': 'C++',
    '.c': 'C',
    '.php': 'PHP',
    '.ex': 'Elixir', '.exs': 'Elixir',
    '.hs': 'Haskell',
    '.sh': 'Shell',
    '.lua': 'Lua',
    '.r': 'R', '.R': 'R',
    '.scala': 'Scala',
    '.dart': 'Dart',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
  };
  for (const [ext, lang] of Object.entries(extLangMap)) {
    if (extCounts[ext] && extCounts[ext] > 0) result.languages.add(lang);
  }

  // --- Package manager ---
  if (has('package-lock.json')) result.packageManager = 'npm';
  else if (has('yarn.lock')) result.packageManager = 'yarn';
  else if (has('pnpm-lock.yaml')) result.packageManager = 'pnpm';
  else if (has('bun.lockb') || has('bun.lock')) result.packageManager = 'bun';

  // --- Node/JS ecosystem ---
  if (has('package.json')) {
    result.runtime = 'Node.js';
    try {
      const pkg = JSON.parse(read('package.json'));
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };
      result.deps = allDeps;
      result.scripts = pkg.scripts || {};

      const fwMap = {
        'next': 'Next.js', 'nuxt': 'Nuxt', 'gatsby': 'Gatsby',
        'react': 'React', 'vue': 'Vue', 'svelte': 'Svelte', '@sveltejs/kit': 'SvelteKit',
        'angular': 'Angular', '@angular/core': 'Angular',
        'express': 'Express', 'fastify': 'Fastify', 'koa': 'Koa', 'hapi': 'Hapi',
        'nestjs': 'NestJS', '@nestjs/core': 'NestJS',
        'remix': 'Remix', '@remix-run/react': 'Remix',
        'astro': 'Astro',
        'electron': 'Electron',
        'prisma': 'Prisma', '@prisma/client': 'Prisma',
        'drizzle-orm': 'Drizzle ORM',
        'typeorm': 'TypeORM',
        'mongoose': 'Mongoose',
        'graphql': 'GraphQL', 'apollo-server': 'Apollo',
        'trpc': 'tRPC', '@trpc/server': 'tRPC',
        'jest': 'Jest', 'vitest': 'Vitest', 'mocha': 'Mocha',
        'playwright': 'Playwright', 'cypress': 'Cypress',
        'vite': 'Vite', 'webpack': 'Webpack', 'esbuild': 'esbuild', 'rollup': 'Rollup',
        'tailwindcss': 'Tailwind CSS',
        'eslint': 'ESLint', 'prettier': 'Prettier', 'biome': 'Biome',
        'typescript': 'TypeScript',
        'zod': 'Zod', 'yup': 'Yup',
        'axios': 'Axios', 'ky': 'Ky',
        'commander': 'Commander.js', 'yargs': 'Yargs', 'meow': 'Meow',
        'chalk': 'Chalk', 'ora': 'Ora', 'inquirer': 'Inquirer',
      };
      for (const [dep, fw] of Object.entries(fwMap)) {
        if (allDeps[dep]) result.frameworks.add(fw);
      }
      if (allDeps['eslint']) result.tools.add('ESLint');
      if (allDeps['prettier']) result.tools.add('Prettier');
      if (allDeps['husky']) result.tools.add('Husky');
      if (allDeps['lint-staged']) result.tools.add('lint-staged');
      if (allDeps['turbo'] || has('turbo.json')) result.tools.add('Turborepo');
      if (allDeps['lerna'] || has('lerna.json')) result.tools.add('Lerna');
      if (pkg.workspaces || has('pnpm-workspace.yaml')) result.tools.add('Monorepo');
    } catch {}
  }

  // --- Python ---
  if (has('requirements.txt') || has('pyproject.toml') || has('setup.py') || has('Pipfile')) {
    result.runtime = result.runtime || 'Python';
    const reqs = read('requirements.txt') || '';
    const pyproj = read('pyproject.toml') || '';
    const combined = reqs + pyproj;
    const pyFwMap = {
      'django': 'Django', 'flask': 'Flask', 'fastapi': 'FastAPI',
      'starlette': 'Starlette', 'tornado': 'Tornado', 'aiohttp': 'aiohttp',
      'pytest': 'pytest', 'unittest': 'unittest',
      'sqlalchemy': 'SQLAlchemy', 'alembic': 'Alembic',
      'pydantic': 'Pydantic', 'celery': 'Celery',
      'numpy': 'NumPy', 'pandas': 'pandas', 'scipy': 'SciPy',
      'tensorflow': 'TensorFlow', 'torch': 'PyTorch', 'keras': 'Keras',
      'scikit-learn': 'scikit-learn', 'transformers': 'Hugging Face Transformers',
      'click': 'Click', 'typer': 'Typer', 'rich': 'Rich',
      'httpx': 'httpx', 'requests': 'requests',
      'poetry': 'Poetry',
    };
    for (const [dep, fw] of Object.entries(pyFwMap)) {
      if (combined.toLowerCase().includes(dep.toLowerCase())) result.frameworks.add(fw);
    }
    if (has('poetry.lock') || pyproj.includes('[tool.poetry]')) result.tools.add('Poetry');
    if (has('Pipfile')) result.tools.add('Pipenv');
    if (has('.ruff.toml') || combined.includes('ruff')) result.tools.add('Ruff');
    if (combined.includes('black')) result.tools.add('Black');
    if (combined.includes('mypy')) result.tools.add('mypy');
  }

  // --- Go ---
  if (has('go.mod')) {
    result.runtime = result.runtime || 'Go';
    const gomod = read('go.mod') || '';
    if (gomod.includes('gin-gonic/gin')) result.frameworks.add('Gin');
    if (gomod.includes('labstack/echo')) result.frameworks.add('Echo');
    if (gomod.includes('gofiber/fiber')) result.frameworks.add('Fiber');
    if (gomod.includes('go-chi/chi')) result.frameworks.add('Chi');
    if (gomod.includes('gorilla/mux')) result.frameworks.add('Gorilla Mux');
    if (gomod.includes('testify')) result.tools.add('testify');
    if (gomod.includes('sqlx')) result.tools.add('sqlx');
    if (gomod.includes('gorm.io')) result.frameworks.add('GORM');
  }

  // --- Rust ---
  if (has('Cargo.toml')) {
    result.runtime = result.runtime || 'Rust';
    const cargo = read('Cargo.toml') || '';
    if (cargo.includes('actix-web')) result.frameworks.add('Actix Web');
    if (cargo.includes('axum')) result.frameworks.add('Axum');
    if (cargo.includes('tokio')) result.tools.add('Tokio');
    if (cargo.includes('serde')) result.tools.add('Serde');
    if (cargo.includes('clap')) result.tools.add('Clap');
  }

  // --- Ruby ---
  if (has('Gemfile')) {
    result.runtime = result.runtime || 'Ruby';
    const gem = read('Gemfile') || '';
    if (gem.includes('rails')) result.frameworks.add('Rails');
    if (gem.includes('sinatra')) result.frameworks.add('Sinatra');
    if (gem.includes('rspec')) result.tools.add('RSpec');
  }

  // --- Docker / Infra ---
  if (has('Dockerfile') || has('docker-compose.yml') || has('docker-compose.yaml')) {
    result.tools.add('Docker');
  }
  if (has('.github/workflows')) result.tools.add('GitHub Actions');
  if (has('Makefile')) result.tools.add('Make');
  if (has('.terraform') || has('main.tf')) result.tools.add('Terraform');

  // --- Database signals ---
  const allText = [
    read('package.json') || '',
    read('requirements.txt') || '',
    read('go.mod') || '',
    read('Cargo.toml') || '',
    read('Gemfile') || '',
    read('pyproject.toml') || '',
  ].join('\n').toLowerCase();

  if (allText.includes('postgres') || allText.includes('pg')) result.tools.add('PostgreSQL');
  if (allText.includes('mysql') || allText.includes('mariadb')) result.tools.add('MySQL');
  if (allText.includes('sqlite')) result.tools.add('SQLite');
  if (allText.includes('redis')) result.tools.add('Redis');
  if (allText.includes('mongodb') || allText.includes('mongoose')) result.tools.add('MongoDB');

  return {
    languages: [...result.languages],
    frameworks: [...result.frameworks],
    tools: [...result.tools],
    packageManager: result.packageManager,
    runtime: result.runtime,
    scripts: result.scripts,
  };
}

function countExtensions(root, maxDepth = 4) {
  const counts = {};
  const ignore = new Set([
    'node_modules', '.git', '.next', '.nuxt', 'dist', 'build', 'out',
    '__pycache__', '.pytest_cache', 'target', 'vendor', 'venv', '.venv',
    'coverage', '.nyc_output', 'tmp', 'temp', '.cache',
  ]);

  function walk(dir, depth) {
    if (depth > maxDepth) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (ignore.has(e.name) || e.name.startsWith('.')) continue;
      if (e.isDirectory()) {
        walk(path.join(dir, e.name), depth + 1);
      } else {
        const ext = path.extname(e.name).toLowerCase();
        if (ext) counts[ext] = (counts[ext] || 0) + 1;
      }
    }
  }

  walk(root, 0);
  return counts;
}

module.exports = { detectStack };
