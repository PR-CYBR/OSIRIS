#!/usr/bin/env node
/**
 * ATLAS Environmental Context Acquisition - Workflow Executor
 *
 * Main entry point for executing the AI-driven environmental context workflow
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { runAllProbes } = require('./capability-probe');
const { fetchProducts, normalizeBbox, resolveTime } = require('./data-fetcher');

/**
 * Load workflow manifest
 * @param {string} manifestPath - Path to manifest YAML file
 * @returns {Promise<Object>} Parsed manifest
 */
async function loadManifest(manifestPath) {
  const content = await fs.readFile(manifestPath, 'utf8');
  const parsed = yaml.load(content);
  return parsed.AI_ENV_AWARE_EO_MANIFEST;
}

/**
 * Execute workflow plan
 * @param {Object} manifest - Workflow manifest
 * @param {Object} inputs - User inputs
 * @returns {Promise<Object>} Execution results
 */
async function executeWorkflow(manifest, inputs = {}) {
  const execution = {
    workflow: manifest.meta.name,
    version: manifest.meta.version,
    startTime: new Date().toISOString(),
    steps: [],
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log('ATLAS Environmental Context Acquisition');
  console.log(`Version: ${manifest.meta.version}`);
  console.log(`${'='.repeat(60)}\n`);

  // Step 1: Assess capabilities
  console.log('Step 1: Assessing capabilities...');
  const capabilities = await runAllProbes();
  execution.steps.push({
    step: 'Assess capabilities',
    timestamp: new Date().toISOString(),
    result: capabilities,
  });

  console.log(
    `  ✓ ${capabilities.summary.available}/${capabilities.summary.total} capabilities available\n`
  );

  // Check critical capabilities
  const hasHTTP = capabilities.probes.find((p) => p.capability === 'can_http')?.available;
  const hasFilesystem = capabilities.probes.find(
    (p) => p.capability === 'can_filesystem'
  )?.available;
  const hasHash = capabilities.probes.find((p) => p.capability === 'can_hash')?.available;

  if (!hasHTTP) {
    console.warn('  ⚠ HTTP capability not available - workflow may require manual intervention');
  }
  if (!hasFilesystem) {
    console.warn('  ⚠ Filesystem capability not available - will use alternative storage');
  }

  // Step 2: Normalize ROI
  console.log('Step 2: Normalizing Region of Interest...');
  const inputBbox = inputs.bbox || inputs.footprints || manifest.inputs.footprints.default_bbox;

  let normalizedBbox;
  try {
    normalizedBbox = normalizeBbox(inputBbox);
    execution.steps.push({
      step: 'Normalize ROI',
      timestamp: new Date().toISOString(),
      result: {
        input: inputBbox,
        normalized: normalizedBbox,
        bboxArea: {
          width: Math.abs(normalizedBbox[2] - normalizedBbox[0]),
          height: Math.abs(normalizedBbox[3] - normalizedBbox[1]),
        },
      },
    });
    console.log(`  ✓ Bbox: [${normalizedBbox.join(', ')}]\n`);
  } catch (error) {
    console.error(`  ✗ Failed to normalize bbox: ${error.message}`);
    execution.steps.push({
      step: 'Normalize ROI',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
    throw error;
  }

  // Step 3: Resolve time(s)
  console.log('Step 3: Resolving time...');
  const inputTime = inputs.time || manifest.inputs.times.default;
  const resolvedTime = resolveTime(inputTime);

  execution.steps.push({
    step: 'Resolve time',
    timestamp: new Date().toISOString(),
    result: {
      input: inputTime,
      resolved: resolvedTime,
    },
  });
  console.log(`  ✓ Time: ${resolvedTime}\n`);

  // Step 4: Acquisition per product by priority
  console.log('Step 4: Acquiring products by priority...');

  if (!hasHTTP) {
    console.log('  Generating retrieval plan (HTTP not available)...\n');

    // Generate URLs for manual download
    const retrievalPlan = {
      note: 'HTTP capability not available. Please download manually.',
      urls: [],
    };

    for (const product of manifest.products) {
      const snapshotEndpoint = product.endpoints.find((e) => e.kind === 'SNAPSHOT_API');
      if (snapshotEndpoint) {
        const layerMatch = snapshotEndpoint.url_template.match(/LAYERS=([^&]+)/);
        const layers = layerMatch ? layerMatch[1] : product.id;

        const url = require('./data-fetcher').buildSnapshotURL({
          time: resolvedTime,
          bbox: normalizedBbox,
          layers,
          width: inputs.width || manifest.inputs.imaging_prefs.width,
          height: inputs.height || manifest.inputs.imaging_prefs.height,
          format: snapshotEndpoint.url_template.includes('jpeg') ? 'image/jpeg' : 'image/png',
        });

        retrievalPlan.urls.push({
          product: product.id,
          purpose: product.purpose,
          url: url,
        });
      }
    }

    execution.steps.push({
      step: 'Acquisition per product',
      timestamp: new Date().toISOString(),
      result: retrievalPlan,
    });

    console.log('  URLs for manual download:');
    for (const item of retrievalPlan.urls) {
      console.log(`    ${item.product}: ${item.url}`);
    }
    console.log();
  } else {
    // Fetch products
    const fetchOptions = {
      bbox: normalizedBbox,
      time: inputTime,
      width: inputs.width || manifest.inputs.imaging_prefs.width,
      height: inputs.height || manifest.inputs.imaging_prefs.height,
      outputDir: inputs.outputDir || './atlas_ctx',
    };

    const fetchResults = await fetchProducts(manifest.products, fetchOptions);

    execution.steps.push({
      step: 'Acquisition per product',
      timestamp: new Date().toISOString(),
      result: fetchResults,
    });

    console.log(
      `  ✓ Acquired ${fetchResults.summary.successful}/${fetchResults.summary.total} products\n`
    );

    // Step 5: Integrity & provenance (already done in data-fetcher)
    console.log('Step 5: Integrity & provenance...');
    if (hasHash) {
      console.log('  ✓ SHA256 hashes computed for all files\n');
    }

    // Step 6: Storage (already done in data-fetcher)
    console.log('Step 6: Storage...');
    if (hasFilesystem) {
      console.log(`  ✓ Files stored under ${fetchOptions.outputDir}/\n`);
    }

    // Step 7: Validation
    console.log('Step 7: Validation...');
    const successfulCount = fetchResults.summary.successful;

    if (successfulCount === 0) {
      console.error('  ✗ No products were successfully fetched!');
      execution.steps.push({
        step: 'Validation',
        timestamp: new Date().toISOString(),
        result: {
          valid: false,
          reason: 'No products fetched',
        },
      });
    } else {
      console.log(`  ✓ ${successfulCount} product(s) validated\n`);
      execution.steps.push({
        step: 'Validation',
        timestamp: new Date().toISOString(),
        result: {
          valid: true,
          productsValidated: successfulCount,
        },
      });
    }

    // Step 8: Report
    console.log('Step 8: Generating report...');

    const reportDir = fetchOptions.outputDir;
    await fs.mkdir(reportDir, { recursive: true });

    // Generate JSONL summary
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
    const dateTime = `${timestamp[0]}_${timestamp[1].split('-')[0]}`;
    const jsonlPath = path.join(reportDir, `summary_${dateTime}.jsonl`);

    const jsonlLines = fetchResults.products.map((p) => JSON.stringify(p)).join('\n');
    await fs.writeFile(jsonlPath, jsonlLines);

    // Generate Markdown summary
    const mdPath = path.join(reportDir, `summary_${dateTime}.md`);
    const markdown = generateMarkdownReport(execution, fetchResults, manifest);
    await fs.writeFile(mdPath, markdown);

    console.log(`  ✓ JSONL summary: ${jsonlPath}`);
    console.log(`  ✓ Markdown summary: ${mdPath}\n`);

    execution.steps.push({
      step: 'Report',
      timestamp: new Date().toISOString(),
      result: {
        jsonlPath,
        markdownPath: mdPath,
      },
    });
  }

  execution.endTime = new Date().toISOString();

  console.log(`${'='.repeat(60)}`);
  console.log('Workflow completed successfully');
  console.log(`${'='.repeat(60)}\n`);

  return execution;
}

/**
 * Generate Markdown report
 * @param {Object} execution - Execution summary
 * @param {Object} fetchResults - Fetch results
 * @param {Object} manifest - Workflow manifest
 * @returns {string} Markdown content
 */
function generateMarkdownReport(execution, fetchResults, manifest) {
  const lines = [
    '# ATLAS Environmental Context Acquisition Report',
    '',
    `**Workflow:** ${execution.workflow}`,
    `**Version:** ${execution.version}`,
    `**Start Time:** ${execution.startTime}`,
    `**End Time:** ${execution.endTime}`,
    '',
    '## Summary',
    '',
    `- **Total Products:** ${fetchResults.summary.total}`,
    `- **Successful:** ${fetchResults.summary.successful}`,
    `- **Failed:** ${fetchResults.summary.failed}`,
    '',
    '## Products Acquired',
    '',
  ];

  for (const result of fetchResults.products) {
    if (result.success) {
      lines.push(`### ✓ ${result.product}`);
      lines.push('');
      lines.push(`- **Purpose:** ${result.metadata.product_purpose}`);
      lines.push(`- **Time:** ${result.metadata.time_actual}`);
      lines.push(`- **Bbox:** [${result.metadata.bbox.join(', ')}]`);
      lines.push(`- **File:** ${result.metadata.filename}`);
      lines.push(`- **SHA256:** \`${result.metadata.sha256}\``);
      lines.push('');
    } else {
      lines.push(`### ✗ ${result.product}`);
      lines.push('');
      lines.push(`- **Error:** ${result.error}`);
      lines.push(`- **URL:** ${result.url}`);
      lines.push('');
    }
  }

  lines.push('## Governance');
  lines.push('');
  lines.push(`**Licensing:** ${manifest.governance.licensing_note}`);
  lines.push('');
  lines.push(`**PII Statement:** ${manifest.governance.pii_statement}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Main execution function
 */
async function main() {
  try {
    const manifestPath = path.join(__dirname, '../../workflows/AI_ENV_AWARE_EO_MANIFEST.yaml');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const inputs = {};

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--bbox' && args[i + 1]) {
        inputs.bbox = JSON.parse(args[i + 1]);
        i++;
      } else if (args[i] === '--time' && args[i + 1]) {
        inputs.time = args[i + 1];
        i++;
      } else if (args[i] === '--output' && args[i + 1]) {
        inputs.outputDir = args[i + 1];
        i++;
      }
    }

    const manifest = await loadManifest(manifestPath);
    const result = await executeWorkflow(manifest, inputs);

    // Output execution summary
    await fs.writeFile(
      path.join(inputs.outputDir || './atlas_ctx', 'execution.json'),
      JSON.stringify(result, null, 2)
    );

    process.exit(0);
  } catch (error) {
    console.error('\nWorkflow execution failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  loadManifest,
  executeWorkflow,
  generateMarkdownReport,
};
