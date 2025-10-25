/**
 * Terrestrial Data Module - Main Entry Point
 *
 * Processes ground-based sensor and network data including seismic activity,
 * infrastructure monitoring, and network patterns.
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
        module: 'terrestrial',
        provider: payload.provider,
        region: payload.region,
        network: payload.network
      }
    };
  }

  if (typeof payload.source === 'string') {
    return {
      id: payload.source,
      type: payload.type || 'ground-sensor',
      metadata: {
        module: 'terrestrial',
        provider: payload.provider,
        region: payload.region,
        network: payload.network
      }
    };
  }

  if (payload.sensorId) {
    return {
      id: payload.sensorId,
      type: payload.type || 'ground-sensor',
      metadata: {
        module: 'terrestrial',
        provider: payload.provider,
        region: payload.region,
        network: payload.network
      }
    };
  }

  throw new Error('Terrestrial payload is missing source information');
}

function resolveMeasurements(payload) {
  if (payload.measurements) {
    return payload.measurements;
  }

  if (payload.readings) {
    return payload.readings;
  }

  if (payload.data) {
    return payload.data;
  }

  throw new Error('Terrestrial payload does not include measurement data');
}

function resolveTimestamp(payload) {
  return payload.timestamp || payload.observedAt || payload.collectedAt;
}

function buildMetadata(payload) {
  const metadata = compactObject({
    ...payload.metadata,
    eventType: payload.type,
    region: payload.region,
    location: payload.location,
    infrastructure: payload.infrastructure,
    severity: payload.severity
  });

  const tags = Array.isArray(payload.tags) ? payload.tags : undefined;

  return { metadata, tags };
}

function buildProvenance(payload, source) {
  return compactObject({
    module: 'modules/terrestrial',
    receivedFrom: source.id,
    channel: payload.channel,
    ingestId: payload.ingestId
  });
}

/**
 * Process terrestrial data event
 * @param {Object} event - The incoming data event
 * @returns {Promise<Object>} Processing result
 */
async function processTerrestrialData(event) {
  const payloads = parsePayloads(event);

  if (!payloads.length) {
    throw new Error('No terrestrial payloads were provided');
  }

  const events = payloads.map((payload) => {
    const timestamp = resolveTimestamp(payload);

    if (!timestamp) {
      throw new Error('Terrestrial payload is missing a timestamp');
    }

    const source = resolveSource(payload);
    const { metadata, tags } = buildMetadata(payload);
    const measurements = resolveMeasurements(payload);
    const provenance = buildProvenance(payload, source);

    return buildEvent({
      domain: 'terrestrial',
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
    target: 'dynamodb://events/terrestrial',
    action: 'put',
    item: {
      pk: `${item.domain}#${item.source.id}`,
      sk: item.timestamp,
      data: item
    }
  }));

  return {
    module: 'terrestrial',
    status: 'processed',
    received: payloads.length,
    successful: events.length,
    events,
    writes
  };
}

/**
 * Lambda handler for terrestrial data ingestion
 * @param {Object} event - AWS Lambda event
 * @returns {Promise<Object>} Response
 */
exports.handler = async (event) => {
  try {
    const result = await processTerrestrialData(event);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error processing terrestrial data:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process terrestrial data',
        message: error.message
      })
    };
  }
};

module.exports = {
  processTerrestrialData
};
