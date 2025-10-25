/**
 * Atmospheric Data Module - Main Entry Point
 *
 * Monitors and analyzes atmospheric conditions including weather patterns,
 * air quality, flight tracking, and atmospheric composition.
 */

const { buildEvent } = require('../../shared/schemas/event');

function parsePayloads(input) {
  if (input == null) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => parsePayloads(item));
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();

    if (!trimmed) {
      return [];
    }

    try {
      return parsePayloads(JSON.parse(trimmed));
    } catch (error) {
      throw new Error(`Failed to parse payload string: ${error.message}`);
    }
  }

  if (typeof input === 'object') {
    if (Array.isArray(input.Records)) {
      return input.Records.flatMap((record) => parsePayloads(record.body ?? record));
    }

    if (input.body !== undefined) {
      return parsePayloads(input.body);
    }

    if (input.detail !== undefined) {
      return parsePayloads(input.detail);
    }

    return [input];
  }

  return [];
}

function compactObject(payload) {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }

    if (Array.isArray(value) && value.length === 0) {
      return acc;
    }

    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
}

function resolveSource(payload) {
  if (payload.source && typeof payload.source === 'object') {
    const { metadata, ...rest } = payload.source;
    return {
      ...rest,
      metadata: {
        ...(metadata || {}),
        module: 'atmospheric',
        provider: payload.provider,
        region: payload.region,
        network: payload.network
      }
    };
  }

  if (typeof payload.source === 'string') {
    return {
      id: payload.source,
      type: payload.type || 'weather-station',
      metadata: {
        module: 'atmospheric',
        provider: payload.provider,
        region: payload.region,
        network: payload.network
      }
    };
  }

  if (payload.stationId) {
    return {
      id: payload.stationId,
      type: payload.type || 'weather-station',
      metadata: {
        module: 'atmospheric',
        provider: payload.provider,
        region: payload.region,
        network: payload.network
      }
    };
  }

  throw new Error('Atmospheric payload is missing source information');
}

function resolveMeasurements(payload) {
  if (payload.measurements) {
    return payload.measurements;
  }

  if (payload.metrics) {
    return payload.metrics;
  }

  if (payload.data) {
    return payload.data;
  }

  throw new Error('Atmospheric payload does not include measurement data');
}

function resolveTimestamp(payload) {
  return payload.timestamp || payload.observedAt || payload.reportedAt;
}

function buildMetadata(payload) {
  const metadata = compactObject({
    ...payload.metadata,
    eventType: payload.type,
    region: payload.region,
    location: payload.location,
    phenomenon: payload.phenomenon,
    altitude: payload.altitude
  });

  const tags = Array.isArray(payload.tags) ? payload.tags : undefined;

  return { metadata, tags };
}

function buildProvenance(payload, source) {
  return compactObject({
    module: 'modules/atmospheric',
    receivedFrom: source.id,
    feed: payload.feed,
    ingestId: payload.ingestId
  });
}

/**
 * Process atmospheric data event
 * @param {Object} event - The incoming data event
 * @returns {Promise<Object>} Processing result
 */
async function processAtmosphericData(event) {
  const payloads = parsePayloads(event);

  if (!payloads.length) {
    throw new Error('No atmospheric payloads were provided');
  }

  const events = payloads.map((payload) => {
    const timestamp = resolveTimestamp(payload);

    if (!timestamp) {
      throw new Error('Atmospheric payload is missing a timestamp');
    }

    const source = resolveSource(payload);
    const { metadata, tags } = buildMetadata(payload);
    const measurements = resolveMeasurements(payload);
    const provenance = buildProvenance(payload, source);

    return buildEvent({
      domain: 'atmospheric',
      timestamp,
      source,
      measurements,
      metadata,
      tags,
      provenance,
      raw: payload
    });
  });

  const writes = events.map((item) => ({
    target: 'dynamodb://events/atmospheric',
    action: 'put',
    item: {
      pk: `${item.domain}#${item.source.id}`,
      sk: item.timestamp,
      data: item
    }
  }));

  return {
    module: 'atmospheric',
    status: 'processed',
    received: payloads.length,
    successful: events.length,
    events,
    writes
  };
}

/**
 * Lambda handler for atmospheric data ingestion
 * @param {Object} event - AWS Lambda event
 * @returns {Promise<Object>} Response
 */
exports.handler = async (event) => {
  try {
    const result = await processAtmosphericData(event);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error processing atmospheric data:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process atmospheric data',
        message: error.message
      })
    };
  }
};

module.exports = {
  processAtmosphericData
};
