const { randomUUID } = require('crypto');

/**
 * Compute the mean of numeric values.
 * @param {number[]} values
 * @returns {number}
 */
function mean(values) {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

/**
 * Compute the standard deviation of numeric values.
 * @param {number[]} values
 * @returns {number}
 */
function stdDeviation(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

/**
 * Compute the median of numeric values.
 * @param {number[]} values
 * @returns {number}
 */
function median(values) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Compute the median absolute deviation.
 * @param {number[]} values
 * @returns {number}
 */
function mad(values) {
  if (!values.length) {
    return 0;
  }
  const med = median(values);
  const deviations = values.map((value) => Math.abs(value - med));
  return median(deviations);
}

/**
 * Normalize severity into the range [0, 1].
 * @param {number} score
 * @param {number} threshold
 * @returns {number}
 */
function normalizeSeverity(score, threshold) {
  const normalized = score / (threshold === 0 ? 1 : threshold);
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Detect numeric anomalies using z-score and MAD-based thresholds.
 * @param {Array<Object>} events - Array of normalized events with numeric metrics.
 * @param {Object} [options]
 * @param {number} [options.zScoreThreshold=2.5]
 * @param {number} [options.madThreshold=3.5]
 * @param {string[]} [options.metricKeys]
 * @returns {Array<Object>} Array of anomaly records.
 */
function detectNumericAnomalies(events, options = {}) {
  const {
    zScoreThreshold = 2.5,
    madThreshold = 3.5,
    metricKeys
  } = options;

  if (!Array.isArray(events) || events.length === 0) {
    return [];
  }

  const numericAnomalies = [];
  const metricsToEvaluate =
    metricKeys ||
    Array.from(
      new Set(
        events.flatMap((event) =>
          Object.keys(typeof event.metrics === 'object' && event.metrics ? event.metrics : {})
        )
      )
    );

  const eventsByEntity = events.reduce((acc, event) => {
    const entityKey = event.entityId || 'global';
    if (!acc[entityKey]) {
      acc[entityKey] = [];
    }
    acc[entityKey].push(event);
    return acc;
  }, {});

  Object.values(eventsByEntity).forEach((entityEvents) => {
    metricsToEvaluate.forEach((metricKey) => {
      const metricValues = entityEvents
        .map((event) => event?.metrics?.[metricKey])
        .filter((value) => typeof value === 'number');

      if (metricValues.length === 0) {
        return;
      }

      const metricMean = mean(metricValues);
      const metricStd = stdDeviation(metricValues);
      const metricMad = mad(metricValues);

      entityEvents.forEach((event, index) => {
        const value = event?.metrics?.[metricKey];
        if (typeof value !== 'number') {
          return;
        }

        const zScore = metricStd > 0 ? Math.abs((value - metricMean) / metricStd) : 0;
        const madScore =
          metricMad > 0 ? Math.abs(value - metricMean) / (metricMad * 1.4826) : 0;
        const score = Math.max(zScore, madScore);

        let rationale = '';
        if (score === zScore) {
          rationale = `Z-score ${score.toFixed(2)} for metric ${metricKey} (mean ${metricMean.toFixed(
            2
          )}, std ${metricStd.toFixed(2)})`;
        } else {
          rationale = `MAD-based score ${score.toFixed(2)} for metric ${metricKey} (mean ${metricMean.toFixed(
            2
          )}, MAD ${metricMad.toFixed(2)})`;
        }

        const threshold = score === zScore ? zScoreThreshold : madThreshold;

        if (score > threshold) {
          numericAnomalies.push({
            anomalyId: `anom-${randomUUID()}`,
            sourceEventId: event.id,
            detector: 'numeric-zscore',
            metric: metricKey,
            score,
            severity: normalizeSeverity(score, threshold * 2),
            timestamp: event.timestamp,
            rationale,
            metadata: {
              baselineMean: metricMean,
              baselineStdDev: metricStd,
              baselineMad: metricMad,
              rank: index
            }
          });
        }
      });
    });
  });

  return numericAnomalies;
}

/**
 * Detect keyword surges in text payloads.
 * @param {Array<Object>} events - Array of normalized events with text field.
 * @param {Object} [options]
 * @param {string[]} [options.keywords=[]]
 * @param {number} [options.surgeFactor=2]
 * @returns {Array<Object>}
 */
function detectKeywordSurge(events, options = {}) {
  const { keywords = [], surgeFactor = 2 } = options;

  if (!Array.isArray(events) || events.length === 0 || keywords.length === 0) {
    return [];
  }

  const keywordCounts = events.map((event) => {
    const text = (event.text || '').toLowerCase();
    return keywords.reduce((acc, keyword) => {
      const occurrences = text.split(keyword.toLowerCase()).length - 1;
      return acc + Math.max(occurrences, 0);
    }, 0);
  });

  const baseline = mean(keywordCounts);
  const surgeThreshold = baseline * surgeFactor;

  return events
    .map((event, index) => {
      const count = keywordCounts[index];
      if (count <= surgeThreshold) {
        return null;
      }

      const severity = normalizeSeverity(count - baseline, surgeThreshold || 1);
      return {
        anomalyId: `anom-${randomUUID()}`,
        sourceEventId: event.id,
        detector: 'text-keyword-surge',
        metric: 'text',
        score: count,
        severity,
        timestamp: event.timestamp,
        rationale: `Keyword surge detected (${count} > baseline ${baseline.toFixed(2)} * factor ${surgeFactor})`,
        metadata: {
          keywordCount: count,
          baseline,
          surgeFactor
        }
      };
    })
    .filter(Boolean);
}

/**
 * Run all anomaly detectors against normalized events.
 * @param {Array<Object>} events
 * @param {Object} [options]
 * @param {Object} [options.numeric]
 * @param {Object} [options.keyword]
 * @returns {Array<Object>} Combined anomaly results.
 */
function detectAnomalies(events, options = {}) {
  const numeric = detectNumericAnomalies(events, options.numeric);
  const keyword = detectKeywordSurge(events, options.keyword);

  return [...numeric, ...keyword].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

module.exports = {
  detectAnomalies,
  detectKeywordSurge,
  detectNumericAnomalies,
  mean,
  stdDeviation,
  median,
  mad
};
