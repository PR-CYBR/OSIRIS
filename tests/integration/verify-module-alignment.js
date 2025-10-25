#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', '..');
const specPath = path.join(rootDir, '.specify', 'spec.md');

const MODULES = [
  { name: 'orbital', title: '1. Orbital Data Module' },
  { name: 'atmospheric', title: '2. Atmospheric Data Module' },
  { name: 'terrestrial', title: '3. Terrestrial Data Module' },
  { name: 'fusion', title: '4. Data Fusion Module' },
  { name: 'detection', title: '5. Anomaly Detection Module' }
];

function ensureFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${description} not found at ${filePath}`);
  }
}

function requireSection(content, heading, description) {
  const normalized = content.replace(/\r\n/g, '\n');
  const headingRegex = new RegExp(`^###\\s+${heading.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}`, 'm');
  if (!headingRegex.test(normalized)) {
    throw new Error(`${description} heading "${heading}" is missing.`);
  }
}

function verifyModule(module) {
  const moduleDir = path.join(rootDir, 'modules', module.name);
  const readmePath = path.join(moduleDir, 'README.md');

  ensureFileExists(moduleDir, `${module.name} module directory`);
  ensureFileExists(readmePath, `${module.name} module README`);

  const readme = fs.readFileSync(readmePath, 'utf8');
  const requiredSections = ['## Overview', '## Status', '## Features (Planned)'];
  requiredSections.forEach(section => {
    if (!readme.includes(section)) {
      throw new Error(`${module.name} module README is missing the section: ${section}`);
    }
  });

  console.log(`✓ Module documentation verified for ${module.name}`);
}

function verifySpecAlignment(specContent) {
  MODULES.forEach(module => {
    requireSection(
      specContent,
      module.title,
      '.specify/spec.md'
    );
  });
  console.log('✓ Specification alignment confirmed for all modules');
}

function main() {
  ensureFileExists(specPath, 'Technical specification');
  const specContent = fs.readFileSync(specPath, 'utf8');

  verifySpecAlignment(specContent);
  MODULES.forEach(verifyModule);

  console.log('\nIntegration verification complete.');
}

try {
  main();
} catch (error) {
  console.error(`Integration verification failed: ${error.message}`);
  process.exit(1);
}

