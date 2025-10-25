#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', '..');
const readmePath = path.join(rootDir, 'README.md');

const REQUIRED_ROWS = [
  '🛰️ Orbital Module',
  '🌤️ Atmospheric Module',
  '🌍 Terrestrial Module',
  '🔀 Data Fusion',
  '🎯 Anomaly Detection',
  '📡 API Gateway'
];

try {
  const readme = fs.readFileSync(readmePath, 'utf8');

  if (!readme.includes('## 📊 System Status')) {
    throw new Error('README is missing the System Status dashboard section.');
  }

  const missingRows = REQUIRED_ROWS.filter(row => !readme.includes(row));
  if (missingRows.length > 0) {
    throw new Error(`System Status dashboard is missing rows: ${missingRows.join(', ')}`);
  }

  if (!readme.includes('## Latest Test Results')) {
    throw new Error('README is missing the Latest Test Results section.');
  }

  console.log('✓ Status dashboard smoke check passed.');
} catch (error) {
  console.error(`E2E status verification failed: ${error.message}`);
  process.exit(1);
}

