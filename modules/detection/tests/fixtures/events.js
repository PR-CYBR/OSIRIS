const syntheticEvents = [
  {
    id: 'evt-001',
    timestamp: '2024-03-10T00:00:00.000Z',
    entityId: 'asset-alpha',
    source: 'orbital',
    metrics: {
      signalStrength: 18,
      latencyMs: 120
    },
    text: 'Telemetry nominal and routine maintenance scheduled.'
  },
  {
    id: 'evt-002',
    timestamp: '2024-03-10T00:02:30.000Z',
    entityId: 'asset-alpha',
    source: 'orbital',
    metrics: {
      signalStrength: 21,
      latencyMs: 110
    },
    text: 'Telemetry nominal and calibration signal observed.'
  },
  {
    id: 'evt-003',
    timestamp: '2024-03-10T00:04:30.000Z',
    entityId: 'asset-alpha',
    source: 'orbital',
    metrics: {
      signalStrength: 55,
      latencyMs: 520
    },
    text: 'Critical: potential jamming detected with sustained interference.'
  },
  {
    id: 'evt-004',
    timestamp: '2024-03-10T00:06:30.000Z',
    entityId: 'asset-beta',
    source: 'terrestrial',
    metrics: {
      signalStrength: 17,
      latencyMs: 130
    },
    text: 'Field report indicates nominal conditions.'
  },
  {
    id: 'evt-005',
    timestamp: '2024-03-10T00:08:30.000Z',
    entityId: 'asset-beta',
    source: 'terrestrial',
    metrics: {
      signalStrength: 72,
      latencyMs: 650
    },
    text: 'Field unit reports interference and repeated jamming attempts.'
  }
];

module.exports = {
  syntheticEvents
};
