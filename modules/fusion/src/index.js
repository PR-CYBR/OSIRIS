const { windowNormalizedEvents } = require('./windowing');
const { correlateWindow } = require('./rules');
const { FUSION_OUTPUT_SCHEMA, validateFusionOutputSchema } = require('./schema');

/**
 * Fuse normalized events and anomaly detections into correlation bundles.
 * @param {Object[]} events - Normalized event objects.
 * @param {Object[]} anomalies - Anomaly records emitted by detection modules.
 * @param {Object} [options]
 * @param {number} [options.windowMinutes=5]
 * @param {number} [options.prior=0.2]
 * @returns {Object[]} Fusion bundles that adhere to {@link FUSION_OUTPUT_SCHEMA}.
 */
function orchestrateFusion(events, anomalies, options = {}) {
  const { windowMinutes = 5, prior = 0.2 } = options;

  const windows = windowNormalizedEvents(events, { windowMinutes });

  return windows.map((window) => {
    const windowAnomalies = anomalies.filter((anomaly) =>
      window.events.some((event) => event.id === anomaly.sourceEventId)
    );

    const correlations = correlateWindow(window.events, windowAnomalies, { prior });
    const bundle = {
      window: {
        start: window.start.toISOString(),
        end: window.end.toISOString(),
        eventCount: window.events.length,
        anomalyCount: windowAnomalies.length
      },
      correlations
    };

    if (!validateFusionOutputSchema(bundle)) {
      throw new Error('Fusion orchestrator produced bundle that does not match schema');
    }

    return bundle;
  });
}

module.exports = {
  orchestrateFusion,
  FUSION_OUTPUT_SCHEMA
};
