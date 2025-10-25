const { detectAnomalies } = require('../src/index');
const { syntheticEvents } = require('./fixtures/events');

describe('Detection module integration', () => {
  it('identifies numeric and keyword anomalies from normalized events', () => {
    const anomalies = detectAnomalies(syntheticEvents, {
      numeric: {
        metricKeys: ['signalStrength', 'latencyMs'],
        zScoreThreshold: 1.5
      },
      keyword: {
        keywords: ['jamming', 'interference'],
        surgeFactor: 1.2
      }
    });

    const numericAnomalies = anomalies.filter((anomaly) => anomaly.detector === 'numeric-zscore');
    const textAnomalies = anomalies.filter((anomaly) => anomaly.detector === 'text-keyword-surge');

    expect(numericAnomalies.length).toBeGreaterThanOrEqual(1);
    expect(textAnomalies.length).toBeGreaterThanOrEqual(1);

    numericAnomalies.forEach((anomaly) => {
      expect(anomaly.sourceEventId).toBeDefined();
      expect(['signalStrength', 'latencyMs']).toContain(anomaly.metric);
    });

    const keywordAnomaly = textAnomalies[0];
    expect(keywordAnomaly.rationale).toMatch(/Keyword surge detected/);
    expect(['evt-003', 'evt-005']).toContain(keywordAnomaly.sourceEventId);
  });
});
