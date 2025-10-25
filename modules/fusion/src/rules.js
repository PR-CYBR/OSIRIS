const { computeBayesianConfidence } = require('./bayesian');

/**
 * Evaluate rule-based correlations for a window of events and anomalies.
 * @param {Object[]} events
 * @param {Object[]} anomalies
 * @param {Object} [options]
 * @param {number} [options.prior=0.2]
 * @returns {Object[]} Correlation objects ready for schema serialization.
 */
function correlateWindow(events, anomalies, options = {}) {
  const { prior = 0.2 } = options;
  if (!Array.isArray(events) || events.length === 0 || !Array.isArray(anomalies)) {
    return [];
  }

  const correlations = [];

  const anomaliesByEvent = anomalies.reduce((acc, anomaly) => {
    acc[anomaly.sourceEventId] = acc[anomaly.sourceEventId] || [];
    acc[anomaly.sourceEventId].push(anomaly);
    return acc;
  }, {});

  const eventsByEntity = events.reduce((acc, event) => {
    const entityId = event.entityId || 'unknown';
    acc[entityId] = acc[entityId] || [];
    acc[entityId].push(event);
    return acc;
  }, {});

  Object.entries(eventsByEntity).forEach(([entityId, entityEvents]) => {
    const entityAnomalies = entityEvents
      .flatMap((event) => anomaliesByEvent[event.id] || [])
      .filter(Boolean);

    if (entityAnomalies.length === 0) {
      return;
    }

    const severityEvidence = entityAnomalies.map((anomaly) => ({
      source: `${anomaly.detector}:${anomaly.metric}`,
      weight: 1 + anomaly.severity
    }));

    const hasTextAnomaly = entityAnomalies.some((anomaly) => anomaly.detector === 'text-keyword-surge');
    const hasNumericAnomaly = entityAnomalies.some((anomaly) => anomaly.detector === 'numeric-zscore');

    if (hasNumericAnomaly && hasTextAnomaly) {
      severityEvidence.push({ source: 'rule:multi-modal', weight: 1.5 });
    }

    if (entityAnomalies.length > 2) {
      severityEvidence.push({ source: 'rule:density', weight: 1.3 });
    }

    const bayesResult = computeBayesianConfidence(prior, severityEvidence);

    correlations.push({
      correlationId: `corr-${entityId}-${entityAnomalies[0].sourceEventId}`,
      ruleId: hasNumericAnomaly && hasTextAnomaly ? 'fusion:multi-modal' : 'fusion:single-stream',
      involvedEventIds: entityEvents.map((event) => event.id),
      involvedAnomalyIds: entityAnomalies.map((anomaly) => anomaly.anomalyId),
      hypothesis: `Coordinated anomaly activity detected for entity ${entityId}`,
      prior,
      likelihood: bayesResult.likelihood,
      posterior: bayesResult.posterior,
      rationale: buildRationale(entityId, entityAnomalies, bayesResult.posterior),
      bayesianEvidence: bayesResult.evidence
    });
  });

  return correlations;
}

/**
 * Construct a human-readable rationale string summarizing anomaly contributions.
 * @param {string} entityId
 * @param {Object[]} anomalies
 * @param {number} posterior
 * @returns {string}
 */
function buildRationale(entityId, anomalies, posterior) {
  const details = anomalies
    .map((anomaly) => `${anomaly.detector}(${anomaly.metric}) severity ${anomaly.severity.toFixed(2)}`)
    .join('; ');
  return `Entity ${entityId} shows posterior ${(posterior * 100).toFixed(
    1
  )}% with contributing anomalies: ${details}`;
}

module.exports = {
  correlateWindow
};
