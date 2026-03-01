#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { scan } = require('../lib/index');
const { formatClaude } = require('../lib/formatters/claude');
const { formatCursor } = require('../lib/formatters/cursor');

const VERSION = '0.1.0';

const HELP = `
rulegen — auto-generate CLAUDE.md / .cursorrules from codebase analysis

Usage:
  rulegen [path] [options]

Arguments:
  path                  Path to the project root (default: current directory)

Options:
  --output, -o <file>   Output file path (default depends on --format)
  --format, -f <fmt>    Output format: claude | cursor | both (default: claude)
  --stdout              Print to stdout instead of writing a file
  --overwrite           Overwrite existing output file
  --no-tree             Skip directory tree in output
  --version, -v         Show version
  --help, -h            Show this help

Examples:
  rulegen                          # Scan current dir, write CLAUDE.md
  rulegen ./my-project             # Scan specific directory
  rulegen --format cursor          # Write .cursorrules
  rulegen --format both            # Write both CLAUDE.md and .cursorrules
  rulegen --stdout                 # Print to stdout
  rulegen --output docs/AI.md      # Custom output path
`.trim();

function parseArgs(argv) {
  const args = { path: '.', format: 'claude', output: null, stdout: false, overwrite: false, noTree: false };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { console.log(HELP); process.exit(0); }
    if (a === '--version' || a === '-v') { console.log(`rulegen v${VERSION}`); process.exit(0); }
    if (a === '--stdout') { args.stdout = true; i++; continue; }
    if (a === '--overwrite') { args.overwrite = true; i++; continue; }
    if (a === '--no-tree') { args.noTree = true; i++; continue; }
    if ((a === '--output' || a === '-o') && argv[i + 1]) { args.output = argv[++i]; i++; continue; }
    if ((a === '--format' || a === '-f') && argv[i + 1]) {
      const fmt = argv[++i];
      if (!['claude', 'cursor', 'both'].includes(fmt)) {
        console.error(`Error: --format must be claude, cursor, or both`);
        process.exit(1);
      }
      args.format = fmt;
      i++; continue;
    }
    if (!a.startsWith('--')) { args.path = a; }
    i++;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const root = path.resolve(args.path);
  if (!fs.existsSync(root)) {
    console.error(`Error: path not found: ${root}`);
    process.exit(1);
  }

  process.stderr.write(`Scanning ${root}...\n`);

  let result;
  try {
    result = scan(root);
  } catch (err) {
    console.error(`Error scanning: ${err.message}`);
    process.exit(1);
  }

  const outputs = [];

  if (args.format === 'claude' || args.format === 'both') {
    const content = formatClaude(result);
    const filePath = args.stdout ? null : (args.output || path.join(root, 'CLAUDE.md'));
    outputs.push({ content, filePath, label: 'CLAUDE.md' });
  }

  if (args.format === 'cursor' || args.format === 'both') {
    const content = formatCursor(result);
    const filePath = args.stdout ? null : (args.format === 'both'
      ? path.join(root, '.cursorrules')
      : (args.output || path.join(root, '.cursorrules')));
    outputs.push({ content, filePath, label: '.cursorrules' });
  }

  for (const { content, filePath, label } of outputs) {
    if (args.stdout || !filePath) {
      process.stdout.write(content);
    } else {
      if (fs.existsSync(filePath) && !args.overwrite) {
        process.stderr.write(`Skipping ${filePath} (already exists, use --overwrite to replace)\n`);
        continue;
      }
      fs.writeFileSync(filePath, content, 'utf8');
      process.stderr.write(`Written: ${filePath}\n`);
    }
  }

  // Summary to stderr
  if (!args.stdout) {
    const { stack } = result;
    process.stderr.write(`\nDetected:\n`);
    if (stack.languages.length) process.stderr.write(`  Languages: ${stack.languages.join(', ')}\n`);
    if (stack.frameworks.length) process.stderr.write(`  Frameworks: ${stack.frameworks.join(', ')}\n`);
    if (stack.tools.length) process.stderr.write(`  Tools: ${stack.tools.join(', ')}\n`);
    process.stderr.write(`\nDone. Review and customize the output before committing.\n`);
  }
}

main();
