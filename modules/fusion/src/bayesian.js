/**
 * Compute a Bayesian posterior given an initial prior and evidence weights.
 * Evidence weights are assumed to be likelihood ratios derived from anomaly severity.
 * @param {number} prior - Prior probability between 0 and 1.
 * @param {Array<{ source: string, weight: number }>} evidenceWeights
 * @returns {{ posterior: number, likelihood: number, evidence: Array<{ source: string, weight: number }> }}
 */
function computeBayesianConfidence(prior, evidenceWeights = []) {
  const sanitizedPrior = Math.min(Math.max(prior, 0.0001), 0.9999);
  let odds = sanitizedPrior / (1 - sanitizedPrior);

  evidenceWeights.forEach((item) => {
    const weight = typeof item.weight === 'number' ? item.weight : 1;
    const boundedWeight = Math.min(Math.max(weight, 0.01), 100);
    odds *= boundedWeight;
  });

  const posterior = odds / (1 + odds);
  const likelihood = evidenceWeights.reduce((acc, item) => acc * (item.weight || 1), 1);

  return {
    posterior,
    likelihood,
    evidence: evidenceWeights
  };
}

module.exports = {
  computeBayesianConfidence
};
