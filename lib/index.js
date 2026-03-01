'use strict';

const path = require('path');
const { detectStack } = require('./detectors/stack');
const { analyzeStructure } = require('./detectors/structure');
const { detectConventions } = require('./detectors/conventions');

function scan(root) {
  const absRoot = path.resolve(root);
  const projectName = path.basename(absRoot);

  const stack = detectStack(absRoot);
  const structure = analyzeStructure(absRoot);
  const conventions = detectConventions(absRoot);

  return { projectName, root: absRoot, stack, structure, conventions };
}

module.exports = { scan };
