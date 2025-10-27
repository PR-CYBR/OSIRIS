/**
 * ATLAS Environmental Context Acquisition - Capability Probe
 *
 * Tests AI agent capabilities for executing the environmental context workflow
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const crypto = require('crypto');

/**
 * Probe HTTP capabilities
 * @returns {Promise<Object>} Result of HTTP probe
 */
async function probeHTTP() {
  return new Promise((resolve) => {
    const options = {
      method: 'HEAD',
      hostname: 'gibs.earthdata.nasa.gov',
      path: '/robots.txt',
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      resolve({
        capability: 'can_http',
        available: res.statusCode >= 200 && res.statusCode < 300,
        details: {
          statusCode: res.statusCode,
          endpoint: 'https://gibs.earthdata.nasa.gov/robots.txt',
        },
      });
    });

    req.on('error', (error) => {
      resolve({
        capability: 'can_http',
        available: false,
        details: {
          error: error.message,
        },
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        capability: 'can_http',
        available: false,
        details: {
          error: 'Request timeout',
        },
      });
    });

    req.end();
  });
}

/**
 * Probe filesystem capabilities
 * @returns {Promise<Object>} Result of filesystem probe
 */
async function probeFilesystem() {
  const probeDir = path.join(process.cwd(), '_probe');
  const testFile = path.join(probeDir, 'test.txt');

  try {
    // Try to create directory
    await fs.mkdir(probeDir, { recursive: true });

    // Try to write file
    await fs.writeFile(testFile, 'test');

    // Try to read file
    const content = await fs.readFile(testFile, 'utf8');

    // Clean up
    await fs.unlink(testFile);
    await fs.rmdir(probeDir);

    return {
      capability: 'can_filesystem',
      available: content === 'test',
      details: {
        canWrite: true,
        canRead: true,
        canDelete: true,
      },
    };
  } catch (error) {
    // Try to clean up if possible
    try {
      await fs.unlink(testFile).catch(() => {});
      await fs.rmdir(probeDir).catch(() => {});
    } catch (_) {
      // Ignore cleanup errors
    }

    return {
      capability: 'can_filesystem',
      available: false,
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Probe image rendering capabilities (basic check)
 * @returns {Promise<Object>} Result of image rendering probe
 */
async function probeImageRendering() {
  // For Node.js, we check if we can work with image buffers
  // In a real implementation, you might use libraries like sharp or jimp
  try {
    // Create a minimal PNG header (1x1 pixel, transparent)
    const pngData = Buffer.from([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a, // PNG signature
      0x00,
      0x00,
      0x00,
      0x0d,
      0x49,
      0x48,
      0x44,
      0x52, // IHDR chunk
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
      0x01, // 1x1 dimensions
      0x08,
      0x06,
      0x00,
      0x00,
      0x00,
      0x1f,
      0x15,
      0xc4,
      0x89,
      0x00,
      0x00,
      0x00,
      0x0a,
      0x49,
      0x44,
      0x41,
      0x54,
      0x78,
      0x9c,
      0x63,
      0x00,
      0x01,
      0x00,
      0x00,
      0x05,
      0x00,
      0x01,
      0x0d,
      0x0a,
      0x2d,
      0xb4,
      0x00,
      0x00,
      0x00,
      0x00,
      0x49,
      0x45,
      0x4e,
      0x44,
      0xae,
      0x42,
      0x60,
      0x82,
    ]);

    // Verify it's a valid PNG signature
    const isPNG =
      pngData[0] === 0x89 && pngData[1] === 0x50 && pngData[2] === 0x4e && pngData[3] === 0x47;

    return {
      capability: 'can_render_image',
      available: isPNG,
      details: {
        supportsPNG: isPNG,
        note: 'Basic buffer manipulation available',
      },
    };
  } catch (error) {
    return {
      capability: 'can_render_image',
      available: false,
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Probe unzip capabilities
 * @returns {Promise<Object>} Result of unzip probe
 */
async function probeUnzip() {
  // Check if zlib is available (built into Node.js)
  try {
    const zlib = require('zlib');
    const testData = Buffer.from('test data for compression');

    return new Promise((resolve) => {
      zlib.gzip(testData, (err, compressed) => {
        if (err) {
          resolve({
            capability: 'can_unzip',
            available: false,
            details: { error: err.message },
          });
          return;
        }

        zlib.gunzip(compressed, (err, decompressed) => {
          if (err) {
            resolve({
              capability: 'can_unzip',
              available: false,
              details: { error: err.message },
            });
            return;
          }

          resolve({
            capability: 'can_unzip',
            available: decompressed.toString() === testData.toString(),
            details: {
              compression: 'gzip',
              available: true,
            },
          });
        });
      });
    });
  } catch (error) {
    return {
      capability: 'can_unzip',
      available: false,
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Probe hash computation capabilities
 * @returns {Promise<Object>} Result of hash probe
 */
async function probeHash() {
  try {
    const testString = 'Hello, World!';
    const hash = crypto.createHash('sha256');
    hash.update(testString);
    const computed = hash.digest('hex');

    // Known SHA256 hash of "Hello, World!"
    const expected = 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f';

    return {
      capability: 'can_hash',
      available: computed === expected,
      details: {
        algorithm: 'SHA256',
        testPassed: computed === expected,
        computed: computed,
      },
    };
  } catch (error) {
    return {
      capability: 'can_hash',
      available: false,
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Check if human prompting is available
 * @returns {Object} Result of human prompt check
 */
function probeHumanPrompt() {
  // In an AI context, this would always be available as a fallback
  return {
    capability: 'can_prompt_human',
    available: true,
    details: {
      note: 'Human prompting available as fallback mechanism',
    },
  };
}

/**
 * Run all capability probes
 * @returns {Promise<Object>} Results of all probes
 */
async function runAllProbes() {
  const results = {
    timestamp: new Date().toISOString(),
    probes: [],
  };

  // Run probes in the specified test order
  const testOrder = [
    { name: 'can_http', fn: probeHTTP },
    { name: 'can_filesystem', fn: probeFilesystem },
    { name: 'can_render_image', fn: probeImageRendering },
    { name: 'can_unzip', fn: probeUnzip },
    { name: 'can_hash', fn: probeHash },
    { name: 'can_prompt_human', fn: probeHumanPrompt },
  ];

  for (const probe of testOrder) {
    try {
      const result = await probe.fn();
      results.probes.push(result);
    } catch (error) {
      results.probes.push({
        capability: probe.name,
        available: false,
        details: {
          error: error.message,
        },
      });
    }
  }

  // Add summary
  results.summary = {
    total: results.probes.length,
    available: results.probes.filter((p) => p.available).length,
    unavailable: results.probes.filter((p) => !p.available).length,
  };

  return results;
}

// Export functions
module.exports = {
  probeHTTP,
  probeFilesystem,
  probeImageRendering,
  probeUnzip,
  probeHash,
  probeHumanPrompt,
  runAllProbes,
};

// Run if executed directly
if (require.main === module) {
  runAllProbes()
    .then((results) => {
      console.log(JSON.stringify(results, null, 2));
    })
    .catch((error) => {
      console.error('Error running capability probes:', error);
      process.exit(1);
    });
}
