const { randomUUID } = require('crypto');

const REQUIRED_FIELDS = ['domain', 'timestamp', 'source', 'measurements'];

function ensureIsoString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} must be an ISO-8601 string`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO-8601 string`);
  }

  return date.toISOString();
}

function normalizeSource(source, defaults = {}) {
  if (typeof source === 'string') {
    const trimmed = source.trim();

    if (!trimmed) {
      throw new Error('Source identifier must be a non-empty string');
    }

    return {
      id: trimmed,
      type: defaults.type || 'unknown',
      metadata: defaults.metadata || {}
    };
  }

  if (source && typeof source === 'object') {
    const { id, type, metadata, ...rest } = source;
    const identifier = typeof id === 'string' ? id.trim() : '';

    if (!identifier) {
      throw new Error('source.id is required');
    }

    const normalizedMetadata = { ...rest };

    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      Object.assign(normalizedMetadata, metadata);
    }

    return {
      id: identifier,
      type: typeof type === 'string' && type.trim() ? type.trim() : defaults.type || 'unknown',
      metadata: normalizedMetadata
    };
  }

  throw new Error('Source metadata is required');
}

function normalizeMeasurement(name, descriptor) {
  if (!name || typeof name !== 'string') {
    throw new Error('Measurement name must be a string');
  }

  if (descriptor == null) {
    throw new Error(`Measurement "${name}" must have a value`);
  }

  if (typeof descriptor === 'number') {
    if (!Number.isFinite(descriptor)) {
      throw new Error(`Measurement "${name}" must be a finite number`);
    }

    return { name, value: descriptor };
  }

  if (typeof descriptor === 'object') {
    const { value, unit, ...rest } = descriptor;

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`Measurement "${name}" must have a numeric value`);
    }

    const measurement = { name, value };

    if (typeof unit === 'string' && unit.trim()) {
      measurement.unit = unit.trim();
    }

    if (Object.keys(rest).length) {
      measurement.metadata = rest;
    }

    return measurement;
  }

  throw new Error(`Measurement "${name}" must be a number or descriptor object`);
}

function normalizeMeasurements(input) {
  if (input == null) {
    throw new Error('Measurements are required');
  }

  let normalized = [];

  if (Array.isArray(input)) {
    normalized = input.map((measurement, index) => {
      if (measurement == null || typeof measurement !== 'object') {
        throw new Error(`Measurement at index ${index} must be an object`);
      }

      const { name, value, unit, metadata, ...rest } = measurement;

      if (Object.keys(rest).length) {
        throw new Error(`Unknown measurement properties: ${Object.keys(rest).join(', ')}`);
      }

      if (typeof name !== 'string' || !name.trim()) {
        throw new Error(`Measurement at index ${index} must include a name`);
      }

      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Measurement "${name}" must include a numeric value`);
      }

      const normalizedMeasurement = { name: name.trim(), value };

      if (typeof unit === 'string' && unit.trim()) {
        normalizedMeasurement.unit = unit.trim();
      }

      if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
        normalizedMeasurement.metadata = metadata;
      }

      return normalizedMeasurement;
    });
  } else if (typeof input === 'object') {
    normalized = Object.entries(input).map(([name, descriptor]) => normalizeMeasurement(name, descriptor));
  } else {
    throw new Error('Measurements must be an array or object');
  }

  if (!normalized.length) {
    throw new Error('At least one measurement is required');
  }

  return normalized;
}

function validateEvent(event) {
  const errors = [];

  if (!event || typeof event !== 'object') {
    return { isValid: false, errors: ['Event payload must be an object'] };
  }

  REQUIRED_FIELDS.forEach((field) => {
    if (!(field in event)) {
      errors.push(`${field} is required`);
    }
  });

  if (typeof event.domain !== 'string' || !event.domain.trim()) {
    errors.push('domain must be a non-empty string');
  }

  try {
    ensureIsoString(event.timestamp, 'timestamp');
  } catch (error) {
    errors.push(error.message);
  }

  if ('receivedAt' in event) {
    try {
      ensureIsoString(event.receivedAt, 'receivedAt');
    } catch (error) {
      errors.push(error.message);
    }
  }

  try {
    const normalizedSource = normalizeSource(event.source, { type: event.domain });

    if (!normalizedSource.metadata || typeof normalizedSource.metadata !== 'object') {
      errors.push('source.metadata must be an object');
    }
  } catch (error) {
    errors.push(error.message);
  }

  try {
    normalizeMeasurements(event.measurements);
  } catch (error) {
    errors.push(error.message);
  }

  if ('metadata' in event && (event.metadata == null || typeof event.metadata !== 'object' || Array.isArray(event.metadata))) {
    errors.push('metadata must be an object when provided');
  }

  if ('provenance' in event && (event.provenance == null || typeof event.provenance !== 'object' || Array.isArray(event.provenance))) {
    errors.push('provenance must be an object when provided');
  }

  if ('tags' in event) {
    if (!Array.isArray(event.tags) || event.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) {
      errors.push('tags must be an array of non-empty strings');
    }
  }

  return { isValid: errors.length === 0, errors };
}

function assertValidEvent(event) {
  const { isValid, errors } = validateEvent(event);

  if (!isValid) {
    throw new Error(`Invalid event payload: ${errors.join('; ')}`);
  }

  return event;
}

function buildEvent({
  domain,
  timestamp,
  source,
  measurements,
  metadata = {},
  tags,
  provenance = {},
  raw
}) {
  if (typeof domain !== 'string' || !domain.trim()) {
    throw new Error('domain must be provided when building an event');
  }

  const receivedAt = new Date().toISOString();
  const baseProvenance = {
    ingestedAt: receivedAt,
    ...provenance
  };
  const normalizedSource = normalizeSource(source, { type: domain.trim() });
  const normalizedMeasurements = normalizeMeasurements(measurements);
  const normalizedMetadata = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};
  let normalizedTags;

  if (Array.isArray(tags)) {
    normalizedTags = tags.filter((tag) => typeof tag === 'string' && tag.trim()).map((tag) => tag.trim());
  }

  const eventPayload = {
    id: randomUUID(),
    domain: domain.trim(),
    timestamp: ensureIsoString(timestamp, 'timestamp'),
    receivedAt,
    source: normalizedSource,
    measurements: normalizedMeasurements,
    metadata: normalizedMetadata,
    provenance: baseProvenance
  };

  if (normalizedTags && normalizedTags.length) {
    eventPayload.tags = normalizedTags;
  }

  if (raw !== undefined) {
    eventPayload.raw = raw;
  }

  return assertValidEvent(eventPayload);
}

module.exports = {
  REQUIRED_FIELDS,
  ensureIsoString,
  normalizeSource,
  normalizeMeasurements,
  validateEvent,
  assertValidEvent,
  buildEvent
};
