/**
 * Fusion Orchestrator Output Schema
 *
 * Each orchestrated fusion run returns an array of correlation bundles. The bundles
 * contain a `window` descriptor and an array of `correlations`:
 *
 * {
 *   window: {
 *     start: string (ISO timestamp inclusive),
 *     end: string (ISO timestamp exclusive),
 *     eventCount: number,
 *     anomalyCount: number
 *   },
 *   correlations: [
 *     {
 *       correlationId: string,
 *       ruleId: string,
 *       involvedEventIds: string[],
 *       involvedAnomalyIds: string[],
 *       hypothesis: string,
 *       prior: number,
 *       likelihood: number,
 *       posterior: number,
 *       rationale: string,
 *       bayesianEvidence: Array<{ source: string, weight: number }>
 *     }
 *   ]
 * }
 */
const FUSION_OUTPUT_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    required: ['window', 'correlations'],
    properties: {
      window: {
        type: 'object',
        required: ['start', 'end', 'eventCount', 'anomalyCount'],
        properties: {
          start: { type: 'string' },
          end: { type: 'string' },
          eventCount: { type: 'number' },
          anomalyCount: { type: 'number' }
        }
      },
      correlations: {
        type: 'array',
        items: {
          type: 'object',
          required: [
            'correlationId',
            'ruleId',
            'involvedEventIds',
            'involvedAnomalyIds',
            'hypothesis',
            'prior',
            'likelihood',
            'posterior',
            'rationale',
            'bayesianEvidence'
          ]
        }
      }
    }
  }
};

/**
 * Validate that a bundle conforms to the documented schema structure.
 * @param {Object} bundle
 * @returns {boolean}
 */
function validateFusionOutputSchema(bundle) {
  if (!bundle || typeof bundle !== 'object') {
    return false;
  }

  const { window, correlations } = bundle;
  if (
    !window ||
    typeof window.start !== 'string' ||
    typeof window.end !== 'string' ||
    typeof window.eventCount !== 'number' ||
    typeof window.anomalyCount !== 'number'
  ) {
    return false;
  }

  if (!Array.isArray(correlations)) {
    return false;
  }

  return correlations.every((correlation) => {
    return (
      typeof correlation.correlationId === 'string' &&
      typeof correlation.ruleId === 'string' &&
      Array.isArray(correlation.involvedEventIds) &&
      Array.isArray(correlation.involvedAnomalyIds) &&
      typeof correlation.hypothesis === 'string' &&
      typeof correlation.prior === 'number' &&
      typeof correlation.likelihood === 'number' &&
      typeof correlation.posterior === 'number' &&
      typeof correlation.rationale === 'string' &&
      Array.isArray(correlation.bayesianEvidence)
    );
  });
}

module.exports = {
  FUSION_OUTPUT_SCHEMA,
  validateFusionOutputSchema
};
