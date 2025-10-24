#!/usr/bin/env node

/**
 * Generate Status Report for OSIRIS Platform
 * 
 * This script generates a status summary of the OSIRIS platform
 * including module health, recent activity, and system metrics.
 */

const fs = require('fs');
const path = require('path');

const MODULES = [
  { name: 'Orbital', path: 'modules/orbital', icon: '🛰️' },
  { name: 'Atmospheric', path: 'modules/atmospheric', icon: '🌤️' },
  { name: 'Terrestrial', path: 'modules/terrestrial', icon: '🌍' },
  { name: 'Fusion', path: 'modules/fusion', icon: '🔀' },
  { name: 'Detection', path: 'modules/detection', icon: '🎯' }
];

const STATUS_ICONS = {
  operational: '✅',
  degraded: '⚠️',
  down: '❌',
  initializing: '🔄',
  development: '🚧'
};

function checkModuleStatus(modulePath) {
  const srcPath = path.join(modulePath, 'src');
  const testsPath = path.join(modulePath, 'tests');
  
  try {
    const hasSrc = fs.existsSync(srcPath) && fs.readdirSync(srcPath).length > 0;
    const hasTests = fs.existsSync(testsPath) && fs.readdirSync(testsPath).length > 0;
    
    if (hasSrc && hasTests) {
      return 'development';
    } else if (hasSrc) {
      return 'initializing';
    } else {
      return 'initializing';
    }
  } catch (error) {
    return 'down';
  }
}

function generateStatusReport() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              OSIRIS Platform Status Report                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('Timestamp:', new Date().toISOString());
  console.log('Environment: Development\n');
  
  console.log('Module Status:');
  console.log('─────────────────────────────────────────────────────────────');
  
  MODULES.forEach(module => {
    const status = checkModuleStatus(module.path);
    const statusIcon = STATUS_ICONS[status];
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    
    console.log(`${module.icon} ${module.name.padEnd(20)} ${statusIcon} ${statusText}`);
  });
  
  console.log('\n');
  console.log('System Information:');
  console.log('─────────────────────────────────────────────────────────────');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`Version:          ${packageJson.version}`);
  console.log(`Node.js:          ${process.version}`);
  console.log(`Platform:         ${process.platform}`);
  console.log(`Architecture:     ${process.arch}`);
  
  console.log('\n');
  console.log('Repository:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('GitHub:           https://github.com/PR-CYBR/OSIRIS');
  console.log('Documentation:    ./docs/');
  console.log('Specifications:   ./.specify/');
  
  console.log('\n');
  console.log('Quick Commands:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('npm test              Run all tests');
  console.log('npm run lint          Run linting checks');
  console.log('npm run build         Build the project');
  console.log('npm run status        Show this status report');
  
  console.log('\n');
  console.log('Legend:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`${STATUS_ICONS.operational} Operational    ${STATUS_ICONS.degraded} Degraded`);
  console.log(`${STATUS_ICONS.down} Down           ${STATUS_ICONS.initializing} Initializing`);
  console.log(`${STATUS_ICONS.development} In Development`);
  console.log('\n');
}

// Run the status report
try {
  generateStatusReport();
} catch (error) {
  console.error('Error generating status report:', error.message);
  process.exit(1);
}
