/**
 * ATLAS Environmental Context Acquisition - Data Fetcher
 *
 * Fetches Earth observation data from NASA GIBS endpoints
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const crypto = require('crypto');

/**
 * Download data from URL
 * @param {string} url - URL to download from
 * @param {Object} options - Download options
 * @returns {Promise<Object>} Download result with buffer and metadata
 */
async function downloadData(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const chunks = [];
    let totalSize = 0;

    const req = https.get(url, (res) => {
      const { statusCode, headers } = res;

      if (statusCode !== 200) {
        res.resume(); // Consume response data to free up memory
        reject(new Error(`Request failed with status code: ${statusCode}`));
        return;
      }

      res.on('data', (chunk) => {
        chunks.push(chunk);
        totalSize += chunk.length;
      });

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const duration = Date.now() - startTime;

        resolve({
          buffer,
          metadata: {
            url,
            statusCode,
            contentType: headers['content-type'],
            contentLength: parseInt(headers['content-length'] || totalSize),
            downloadedSize: totalSize,
            durationMs: duration,
            timestamp: new Date().toISOString(),
          },
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.timeout) {
      req.setTimeout(options.timeout, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    }
  });
}

/**
 * Compute hash of buffer
 * @param {Buffer} buffer - Data to hash
 * @param {string} algorithm - Hash algorithm (default: sha256)
 * @returns {string} Hex-encoded hash
 */
function computeHash(buffer, algorithm = 'sha256') {
  const hash = crypto.createHash(algorithm);
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * Build SNAPSHOT_API URL
 * @param {Object} params - URL parameters
 * @returns {string} Constructed URL
 */
function buildSnapshotURL(params) {
  const {
    time,
    bbox, // [minx, miny, maxx, maxy]
    layers,
    width = 2048,
    height = 2048,
    format = 'image/jpeg',
  } = params;

  const [minx, miny, maxx, maxy] = bbox;

  const url =
    'https://wvs.earthdata.nasa.gov/api/v1/snapshot' +
    '?REQUEST=GetSnapshot' +
    `&TIME=${time}` +
    `&BBOX=${miny},${minx},${maxy},${maxx}` +
    '&CRS=EPSG:4326' +
    `&LAYERS=${layers}` +
    `&FORMAT=${format}` +
    `&WIDTH=${width}` +
    `&HEIGHT=${height}`;

  return url;
}

/**
 * Normalize bounding box input
 * @param {*} input - Bbox or GeoJSON
 * @returns {Array} Normalized bbox [minx, miny, maxx, maxy]
 */
function normalizeBbox(input) {
  // If it's already an array, assume it's a bbox
  if (Array.isArray(input)) {
    if (input.length === 4) {
      return input;
    }
    throw new Error('Invalid bbox array length');
  }

  // If it's GeoJSON, extract bbox
  if (input && typeof input === 'object') {
    if (input.type === 'FeatureCollection' && input.features) {
      // Compute union bbox of all features
      let minx = Infinity,
        miny = Infinity;
      let maxx = -Infinity,
        maxy = -Infinity;

      for (const feature of input.features) {
        if (feature.geometry && feature.geometry.coordinates) {
          // Simple bbox extraction (works for Point, LineString, Polygon)
          const coords = flattenCoordinates(feature.geometry.coordinates);
          for (const [x, y] of coords) {
            minx = Math.min(minx, x);
            miny = Math.min(miny, y);
            maxx = Math.max(maxx, x);
            maxy = Math.max(maxy, y);
          }
        }
      }

      if (isFinite(minx)) {
        return [minx, miny, maxx, maxy];
      }
    }
  }

  throw new Error('Invalid bbox or GeoJSON input');
}

/**
 * Flatten nested coordinate arrays
 * @param {Array} coords - Nested coordinates
 * @returns {Array} Flattened coordinate pairs
 */
function flattenCoordinates(coords) {
  if (typeof coords[0] === 'number') {
    return [coords];
  }
  return coords.flatMap((c) => flattenCoordinates(c));
}

/**
 * Resolve time to actual available time
 * @param {string} timeInput - Time string or 'latest'
 * @returns {string} ISO 8601 date string (YYYY-MM-DD)
 */
function resolveTime(timeInput) {
  if (timeInput === 'latest' || !timeInput) {
    // Get yesterday's date (GIBS typically has yesterday's data)
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }

  // Parse ISO 8601 and return just the date part
  const date = new Date(timeInput);
  return date.toISOString().split('T')[0];
}

/**
 * Fetch product data
 * @param {Object} product - Product configuration from manifest
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Fetch result
 */
async function fetchProduct(product, options = {}) {
  const {
    bbox = [-68.0, 16.5, -64.0, 19.5],
    time = 'latest',
    width = 2048,
    height = 2048,
    outputDir = './atlas_ctx',
  } = options;

  const normalizedBbox = normalizeBbox(bbox);
  const resolvedTime = resolveTime(time);

  // Prefer SNAPSHOT_API for simplicity
  const snapshotEndpoint = product.endpoints.find((e) => e.kind === 'SNAPSHOT_API');

  if (!snapshotEndpoint) {
    throw new Error(`No SNAPSHOT_API endpoint found for product ${product.id}`);
  }

  // Extract layer name from template
  const layerMatch = snapshotEndpoint.url_template.match(/LAYERS=([^&]+)/);
  const layers = layerMatch ? layerMatch[1] : product.id;

  // Determine format
  const isJpeg = snapshotEndpoint.url_template.includes('jpeg');
  const format = isJpeg ? 'image/jpeg' : 'image/png';
  const extension = isJpeg ? 'jpg' : 'png';

  // Build URL
  const url = buildSnapshotURL({
    time: resolvedTime,
    bbox: normalizedBbox,
    layers,
    width,
    height,
    format,
  });

  console.log(`Fetching ${product.id} from ${url}...`);

  try {
    // Download data
    const result = await downloadData(url, { timeout: 30000 });

    // Compute hash
    const sha256 = computeHash(result.buffer);

    // Create bbox hash for filename
    const bboxHash = crypto
      .createHash('md5')
      .update(normalizedBbox.join(','))
      .digest('hex')
      .substring(0, 8);

    // Prepare output
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
    const dateTime = `${timestamp[0]}_${timestamp[1].split('-')[0]}`;
    const productDir = path.join(outputDir, dateTime, product.id);

    // Create directory
    await fs.mkdir(productDir, { recursive: true });

    // Save image file
    const filename = `${product.id}_${resolvedTime}_${bboxHash}.${extension}`;
    const filepath = path.join(productDir, filename);
    await fs.writeFile(filepath, result.buffer);

    // Create metadata
    const metadata = {
      product_id: product.id,
      product_purpose: product.purpose,
      endpoint_kind: 'SNAPSHOT_API',
      time_requested: time,
      time_actual: resolvedTime,
      bbox: normalizedBbox,
      projection: 'EPSG:4326',
      urls_used: [url],
      http_status: result.metadata.statusCode,
      content_type: result.metadata.contentType,
      content_length: result.metadata.contentLength,
      downloaded_size: result.metadata.downloadedSize,
      sha256: sha256,
      filename: filename,
      timestamp: result.metadata.timestamp,
      width: width,
      height: height,
    };

    // Save metadata
    const metadataPath = path.join(productDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    // Create provenance file
    const provenance = [
      `Product: ${product.id}`,
      `Purpose: ${product.purpose}`,
      'Source: NASA GIBS',
      `Endpoint: ${url}`,
      `Time: ${resolvedTime}`,
      `Bbox: ${normalizedBbox.join(', ')}`,
      `SHA256: ${sha256}`,
      `Timestamp: ${result.metadata.timestamp}`,
      '',
      'Licensing: NASA GIBS browse imagery is open for public use; cite NASA/GIBS.',
      '',
      'This data was automatically acquired by the ATLAS Environmental Context Acquisition workflow.',
    ].join('\n');

    const provenancePath = path.join(productDir, 'provenance.txt');
    await fs.writeFile(provenancePath, provenance);

    console.log(`✓ Saved ${product.id} to ${filepath}`);

    return {
      success: true,
      product: product.id,
      filepath,
      metadata,
      provenance: provenancePath,
    };
  } catch (error) {
    console.error(`✗ Failed to fetch ${product.id}: ${error.message}`);

    return {
      success: false,
      product: product.id,
      error: error.message,
      url,
    };
  }
}

/**
 * Fetch multiple products by priority
 * @param {Array} products - Product configurations
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Fetch results
 */
async function fetchProducts(products, options = {}) {
  // Sort by priority
  const sorted = [...products].sort((a, b) => a.priority - b.priority);

  const results = {
    timestamp: new Date().toISOString(),
    options: {
      bbox: options.bbox || [-68.0, 16.5, -64.0, 19.5],
      time: options.time || 'latest',
      width: options.width || 2048,
      height: options.height || 2048,
    },
    products: [],
    summary: {
      total: sorted.length,
      successful: 0,
      failed: 0,
    },
  };

  // Fetch each product
  for (const product of sorted) {
    const result = await fetchProduct(product, options);
    results.products.push(result);

    if (result.success) {
      results.summary.successful++;
    } else {
      results.summary.failed++;
    }

    // Small delay between requests to be polite to the server
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

module.exports = {
  downloadData,
  computeHash,
  buildSnapshotURL,
  normalizeBbox,
  resolveTime,
  fetchProduct,
  fetchProducts,
};
