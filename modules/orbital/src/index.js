/**
 * Orbital Data Module - Main Entry Point
 *
 * Processes data from space-based sources including satellites,
 * orbital objects, space weather, and RF emissions.
 */

/**
 * Parse TLE (Two-Line Element) data and extract orbital parameters
 * @param {string} tleData - TLE string with two lines
 * @returns {Object} Parsed orbital parameters
 */
function parseTLE(tleData) {
  if (!tleData || typeof tleData !== 'string') {
    throw new Error('Invalid TLE data: must be a non-empty string');
  }

  const lines = tleData.trim().split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('Invalid TLE data: requires at least 2 lines');
  }

  // Extract NORAD ID from line 1 (columns 3-7)
  const line1 = lines[0].trim();
  const noradId = line1.substring(2, 7).trim();

  // Extract mean motion from line 2 (columns 53-63) - revolutions per day
  const line2 = lines[1].trim();
  const meanMotion = parseFloat(line2.substring(52, 63).trim());

  // Calculate orbital period in minutes
  // Period = 1440 minutes / mean motion (revs/day)
  const orbitalPeriod = meanMotion > 0 ? `${(1440 / meanMotion).toFixed(2)} min` : 'unknown';

  // Extract inclination from line 2 (columns 9-16)
  const inclination = parseFloat(line2.substring(8, 16).trim());

  // Extract eccentricity from line 2 (columns 27-33)
  // Note: decimal point is assumed before the value
  const eccentricityStr = line2.substring(26, 33).trim();
  const eccentricity = parseFloat('0.' + eccentricityStr);

  return {
    noradId,
    orbitalPeriod,
    meanMotion,
    inclination,
    eccentricity
  };
}

/**
 * Analyze imagery data (stub for future implementation)
 * @param {string|Object} imageData - Image file path or Base64 string
 * @returns {Object} Analysis results
 */
function analyzeImage(imageData) {
  // Placeholder implementation - real image analysis would use ML/CV libraries
  console.log('Processing image data...');
  
  if (!imageData) {
    return {
      anomaliesDetected: 0,
      message: 'No image data provided'
    };
  }

  // Simulate basic image analysis
  return {
    anomaliesDetected: 0,
    processed: true,
    imageType: typeof imageData === 'string' ? 'base64/path' : 'object'
  };
}

/**
 * Process orbital data event
 * @param {Object} _event - The incoming data event
 * @returns {Promise<Object>} Processing result
 */
async function processOrbitalData(_event) {
  try {
    // Validate input event
    if (!_event || typeof _event !== 'object') {
      throw new Error('Invalid event: must be an object');
    }

    const { timestamp, source, type, data } = _event;

    // Create base result object
    const result = {
      status: 'processed',
      timestamp: timestamp || new Date().toISOString(),
      source: source || 'unknown',
      module: 'orbital',
      analysis: {},
      message: ''
    };

    console.log(`Processing orbital data of type: ${type}`);

    // Handle different data types
    switch (type) {
    case 'tle': {
      // Process TLE data
      if (!data || !data.tle) {
        result.status = 'error';
        result.message = 'TLE data missing in event.data.tle';
        console.warn(result.message);
        return result;
      }

      const tleParams = parseTLE(data.tle);
      result.analysis = {
        type: 'tle',
        satelliteId: tleParams.noradId,
        orbitalPeriod: tleParams.orbitalPeriod,
        meanMotion: tleParams.meanMotion,
        inclination: tleParams.inclination,
        eccentricity: tleParams.eccentricity
      };
      result.message = `Processed TLE for satellite ${tleParams.noradId}, estimated orbital period ${tleParams.orbitalPeriod}`;
      console.log(result.message);
      break;
    }

    case 'imagery': {
      // Process imagery data
      if (!data || !data.image) {
        result.status = 'error';
        result.message = 'Image data missing in event.data.image';
        console.warn(result.message);
        return result;
      }

      const imageAnalysis = analyzeImage(data.image);
      result.analysis = {
        type: 'imagery',
        ...imageAnalysis
      };
      result.message = `Analyzed image, ${imageAnalysis.anomaliesDetected} anomalies detected`;
      console.log(result.message);
      break;
    }

    case 'spaceweather':
    case 'rf':
    default: {
      // Handle unsupported types
      result.status = 'unsupported';
      result.message = `Data type "${type}" is not yet supported`;
      console.warn(result.message);
      result.analysis = {
        type: type || 'unknown',
        supported: false
      };
      break;
    }
    }

    return result;

  } catch (error) {
    console.error('Error processing orbital data:', error);
    return {
      status: 'error',
      timestamp: _event?.timestamp || new Date().toISOString(),
      source: _event?.source || 'unknown',
      module: 'orbital',
      message: `Processing failed: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Lambda handler for orbital data ingestion
 * @param {Object} event - AWS Lambda event
 * @returns {Promise<Object>} Response
 */
exports.handler = async (event) => {
  try {
    const result = await processOrbitalData(event);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error processing orbital data:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process orbital data',
        message: error.message,
      }),
    };
  }
};

module.exports = {
  processOrbitalData,
  parseTLE,
  analyzeImage
};
