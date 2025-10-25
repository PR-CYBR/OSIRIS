/**
 * Orbital Data Module - Main Entry Point
 *
 * Processes data from space-based sources including satellites,
 * orbital objects, space weather, and RF emissions.
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
        module: 'orbital',
        provider: payload.provider,
        mission: payload.mission
      }
    };
  }

  if (typeof payload.source === 'string') {
    return {
      id: payload.source,
      type: payload.type || 'satellite',
      metadata: {
        module: 'orbital',
        provider: payload.provider,
        mission: payload.mission
      }
    };
  }

  if (payload.satelliteId) {
    return {
      id: payload.satelliteId,
      type: payload.type || 'satellite',
      metadata: {
        module: 'orbital',
        provider: payload.provider,
        mission: payload.mission
      }
    };
  }

  throw new Error('Orbital payload is missing source information');
}

function resolveMeasurements(payload) {
  if (payload.measurements) {
    return payload.measurements;
  }

  if (payload.data) {
    return payload.data;
  }

  if (payload.readings) {
    return payload.readings;
  }

  throw new Error('Orbital payload does not include measurement data');
}

function resolveTimestamp(payload) {
  return payload.timestamp || payload.observedAt || payload.eventTime;
}

function buildMetadata(payload) {
  const metadata = compactObject({
    ...payload.metadata,
    eventType: payload.type,
    orbit: payload.orbit,
    mission: payload.mission,
    classification: payload.classification
  });

  const tags = Array.isArray(payload.tags) ? payload.tags : undefined;

  return { metadata, tags };
}

function buildProvenance(payload, source) {
  return compactObject({
    module: 'modules/orbital',
    receivedFrom: source.id,
    stream: payload.stream,
    ingestId: payload.ingestId
  });
}

/**
 * Process orbital data event
 * @param {Object} event - The incoming data event
 * @returns {Promise<Object>} Processing result
 */
async function processOrbitalData(event) {
  const payloads = parsePayloads(event);

  if (!payloads.length) {
    throw new Error('No orbital payloads were provided');
  }

  const events = payloads.map((payload) => {
    const timestamp = resolveTimestamp(payload);

    if (!timestamp) {
      throw new Error('Orbital payload is missing a timestamp');
    }

    const source = resolveSource(payload);
    const { metadata, tags } = buildMetadata(payload);
    const measurements = resolveMeasurements(payload);
    const provenance = buildProvenance(payload, source);

    return buildEvent({
      domain: 'orbital',
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
    target: 'dynamodb://events/orbital',
    action: 'put',
    item: {
      pk: `${item.domain}#${item.source.id}`,
      sk: item.timestamp,
      data: item
    }
  }));

  return {
    module: 'orbital',
    status: 'processed',
    received: payloads.length,
    successful: events.length,
    events,
    writes
  };
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
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error processing orbital data:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process orbital data',
        message: error.message
      })
    };
  }
};

module.exports = {
  processOrbitalData
};
