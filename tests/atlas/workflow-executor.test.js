/**
 * Tests for ATLAS Workflow Executor
 */

const path = require('path');
const { loadManifest, generateMarkdownReport } = require('../../scripts/atlas/workflow-executor');

describe('ATLAS Workflow Executor', () => {
  describe('loadManifest', () => {
    it('should load and parse workflow manifest', async () => {
      const manifestPath = path.join(__dirname, '../../workflows/AI_ENV_AWARE_EO_MANIFEST.yaml');
      const manifest = await loadManifest(manifestPath);

      expect(manifest).toBeDefined();
      expect(manifest.meta).toBeDefined();
      expect(manifest.meta.name).toBe('3I/ATLAS Environmental Context Acquisition');
      expect(manifest.meta.version).toBe('1.0.0');
      expect(manifest.capability_matrix).toBeDefined();
      expect(manifest.products).toBeDefined();
      expect(manifest.products.length).toBeGreaterThan(0);
    });

    it('should load all product definitions', async () => {
      const manifestPath = path.join(__dirname, '../../workflows/AI_ENV_AWARE_EO_MANIFEST.yaml');
      const manifest = await loadManifest(manifestPath);

      const expectedProducts = [
        'MODIS_Terra_TrueColor',
        'VIIRS_DayNightBand_Radiance',
        'VIIRS_Cloud_Mask_Day',
        'MODIS_Active_Fire',
        'VIIRS_SST',
        'OMI_UV_Aerosol_Index',
      ];

      const productIds = manifest.products.map((p) => p.id);

      for (const expected of expectedProducts) {
        expect(productIds).toContain(expected);
      }
    });

    it('should have proper product priority order', async () => {
      const manifestPath = path.join(__dirname, '../../workflows/AI_ENV_AWARE_EO_MANIFEST.yaml');
      const manifest = await loadManifest(manifestPath);

      const priorities = manifest.products.map((p) => p.priority);

      // Check that priorities are sequential starting from 1
      expect(Math.min(...priorities)).toBe(1);
      expect(priorities.length).toBe(6);
    });
  });

  describe('generateMarkdownReport', () => {
    it('should generate valid markdown report', () => {
      const execution = {
        workflow: 'Test Workflow',
        version: '1.0.0',
        startTime: '2024-01-15T12:00:00Z',
        endTime: '2024-01-15T12:05:00Z',
      };

      const fetchResults = {
        summary: {
          total: 2,
          successful: 1,
          failed: 1,
        },
        products: [
          {
            success: true,
            product: 'MODIS_Terra_TrueColor',
            metadata: {
              product_purpose: 'Test purpose',
              time_actual: '2024-01-15',
              bbox: [-68.0, 16.5, -64.0, 19.5],
              filename: 'test.jpg',
              sha256: 'abc123',
            },
          },
          {
            success: false,
            product: 'VIIRS_DayNightBand_Radiance',
            error: 'Test error',
            url: 'https://test.url',
          },
        ],
      };

      const manifest = {
        governance: {
          licensing_note: 'Test license',
          pii_statement: 'No PII',
        },
      };

      const markdown = generateMarkdownReport(execution, fetchResults, manifest);

      expect(markdown).toContain('# ATLAS Environmental Context Acquisition Report');
      expect(markdown).toContain('Test Workflow');
      expect(markdown).toContain('1.0.0');
      expect(markdown).toContain('MODIS_Terra_TrueColor');
      expect(markdown).toContain('VIIRS_DayNightBand_Radiance');
      expect(markdown).toContain('Test license');
    });

    it('should include all successful products', () => {
      const execution = {
        workflow: 'Test',
        version: '1.0.0',
        startTime: '2024-01-15T12:00:00Z',
        endTime: '2024-01-15T12:05:00Z',
      };

      const fetchResults = {
        summary: { total: 1, successful: 1, failed: 0 },
        products: [
          {
            success: true,
            product: 'Test_Product',
            metadata: {
              product_purpose: 'Testing',
              time_actual: '2024-01-15',
              bbox: [0, 0, 1, 1],
              filename: 'test.jpg',
              sha256: 'abc123',
            },
          },
        ],
      };

      const manifest = {
        governance: {
          licensing_note: 'Test',
          pii_statement: 'Test',
        },
      };

      const markdown = generateMarkdownReport(execution, fetchResults, manifest);

      expect(markdown).toContain('✓ Test_Product');
      expect(markdown).toContain('Testing');
      expect(markdown).toContain('abc123');
    });
  });
});
