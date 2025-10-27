/**
 * Tests for ATLAS Capability Probe
 */

const {
  probeHTTP,
  probeFilesystem,
  probeImageRendering,
  probeUnzip,
  probeHash,
  probeHumanPrompt,
  runAllProbes,
} = require('../../scripts/atlas/capability-probe');

describe('ATLAS Capability Probe', () => {
  describe('probeHTTP', () => {
    it('should probe HTTP capability', async () => {
      const result = await probeHTTP();

      expect(result).toBeDefined();
      expect(result.capability).toBe('can_http');
      expect(typeof result.available).toBe('boolean');
      expect(result.details).toBeDefined();
    });
  });

  describe('probeFilesystem', () => {
    it('should probe filesystem capability', async () => {
      const result = await probeFilesystem();

      expect(result).toBeDefined();
      expect(result.capability).toBe('can_filesystem');
      expect(typeof result.available).toBe('boolean');
      expect(result.details).toBeDefined();
    });
  });

  describe('probeImageRendering', () => {
    it('should probe image rendering capability', async () => {
      const result = await probeImageRendering();

      expect(result).toBeDefined();
      expect(result.capability).toBe('can_render_image');
      expect(typeof result.available).toBe('boolean');
      expect(result.details).toBeDefined();
    });
  });

  describe('probeUnzip', () => {
    it('should probe unzip capability', async () => {
      const result = await probeUnzip();

      expect(result).toBeDefined();
      expect(result.capability).toBe('can_unzip');
      expect(typeof result.available).toBe('boolean');
      expect(result.details).toBeDefined();
    });
  });

  describe('probeHash', () => {
    it('should probe hash capability', async () => {
      const result = await probeHash();

      expect(result).toBeDefined();
      expect(result.capability).toBe('can_hash');
      expect(result.available).toBe(true); // Should always be true in Node.js
      expect(result.details.testPassed).toBe(true);
    });
  });

  describe('probeHumanPrompt', () => {
    it('should indicate human prompting is available', () => {
      const result = probeHumanPrompt();

      expect(result).toBeDefined();
      expect(result.capability).toBe('can_prompt_human');
      expect(result.available).toBe(true);
    });
  });

  describe('runAllProbes', () => {
    it('should run all capability probes', async () => {
      const results = await runAllProbes();

      expect(results).toBeDefined();
      expect(results.timestamp).toBeDefined();
      expect(results.probes).toBeDefined();
      expect(results.probes.length).toBe(6);
      expect(results.summary).toBeDefined();
      expect(results.summary.total).toBe(6);
    });

    it('should include all expected capabilities', async () => {
      const results = await runAllProbes();
      const capabilities = results.probes.map((p) => p.capability);

      expect(capabilities).toContain('can_http');
      expect(capabilities).toContain('can_filesystem');
      expect(capabilities).toContain('can_render_image');
      expect(capabilities).toContain('can_unzip');
      expect(capabilities).toContain('can_hash');
      expect(capabilities).toContain('can_prompt_human');
    });
  });
});
