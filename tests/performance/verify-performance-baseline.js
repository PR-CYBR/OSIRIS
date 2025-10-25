#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', '..');
const constitutionPath = path.join(rootDir, '.specify', 'constitution.md');

const REQUIRED_METRICS = [
  'Processing Latency',
  'Detection Accuracy',
  'False Positive Rate',
  'Mean Time to Recovery'
];

try {
  const constitution = fs.readFileSync(constitutionPath, 'utf8');

  if (!constitution.includes('### Testing')) {
    throw new Error('Constitution is missing the Testing standards section.');
  }

  const missingMetrics = REQUIRED_METRICS.filter(metric => !constitution.includes(metric));
  if (missingMetrics.length > 0) {
    throw new Error(`Constitution is missing performance metric definitions: ${missingMetrics.join(', ')}`);
  }

  console.log('✓ Performance baseline metrics verified.');
} catch (error) {
  console.error(`Performance baseline verification failed: ${error.message}`);
  process.exit(1);
}

