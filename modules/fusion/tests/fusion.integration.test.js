const { orchestrateFusion } = require('../src/index');
const { detectAnomalies } = require('../../detection/src/index');
const { syntheticEvents } = require('../../detection/tests/fixtures/events');

describe('Fusion orchestrator integration', () => {
  it('produces correlation bundles with Bayesian scores for detected anomalies', () => {
    const anomalies = detectAnomalies(syntheticEvents, {
      numeric: {
        metricKeys: ['signalStrength', 'latencyMs'],
        zScoreThreshold: 1.5,
        madThreshold: 3.5
      },
      keyword: {
        keywords: ['jamming', 'interference'],
        surgeFactor: 1.2
      }
    });

    const fusionBundles = orchestrateFusion(syntheticEvents, anomalies, {
      windowMinutes: 5,
      prior: 0.25
    });

    expect(Array.isArray(fusionBundles)).toBe(true);
    expect(fusionBundles.length).toBeGreaterThan(0);

    fusionBundles.forEach((bundle) => {
      expect(bundle.window.eventCount).toBeGreaterThan(0);
      expect(Array.isArray(bundle.correlations)).toBe(true);
    });

    const assetAlphaCorrelation = fusionBundles
      .flatMap((bundle) => bundle.correlations)
      .find((correlation) => correlation.involvedEventIds.includes('evt-003'));

    expect(assetAlphaCorrelation).toBeDefined();
    expect(assetAlphaCorrelation.posterior).toBeGreaterThan(0.25);
    expect(assetAlphaCorrelation.rationale).toMatch(/posterior/);
    expect(assetAlphaCorrelation.bayesianEvidence.length).toBeGreaterThan(1);
  });
});
