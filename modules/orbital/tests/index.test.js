/**
 * Test suite for Orbital Data Module
 */

const { processOrbitalData, parseTLE, analyzeImage } = require('../src/index');

describe('Orbital Data Module', () => {
  describe('parseTLE', () => {
    it('should parse valid TLE data correctly', () => {
      const tleData = `1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537`;

      const result = parseTLE(tleData);

      expect(result.noradId).toBe('25544');
      expect(result.meanMotion).toBeCloseTo(15.72125391, 5);
      expect(result.orbitalPeriod).toBe('91.60 min');
      expect(result.inclination).toBeCloseTo(51.6416, 4);
      expect(result.eccentricity).toBeCloseTo(0.0006703, 7);
    });

    it('should throw error for invalid TLE data', () => {
      expect(() => parseTLE('')).toThrow('Invalid TLE data');
      expect(() => parseTLE(null)).toThrow('Invalid TLE data');
      expect(() => parseTLE('single line')).toThrow('Invalid TLE data: requires at least 2 lines');
    });
  });

  describe('analyzeImage', () => {
    it('should return analysis results for valid image data', () => {
      const result = analyzeImage('/path/to/image.jpg');

      expect(result).toBeDefined();
      expect(result.anomaliesDetected).toBe(0);
      expect(result.processed).toBe(true);
      expect(result.imageType).toBe('base64/path');
    });

    it('should handle missing image data', () => {
      const result = analyzeImage(null);

      expect(result).toBeDefined();
      expect(result.anomaliesDetected).toBe(0);
      expect(result.message).toBe('No image data provided');
    });
  });

  describe('processOrbitalData', () => {
    it('should process TLE data successfully', async () => {
      const event = {
        timestamp: '2024-01-01T00:00:00Z',
        source: 'test-satellite',
        type: 'tle',
        data: {
          tle: `1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537`
        },
      };

      const result = await processOrbitalData(event);

      expect(result).toBeDefined();
      expect(result.status).toBe('processed');
      expect(result.module).toBe('orbital');
      expect(result.timestamp).toBe('2024-01-01T00:00:00Z');
      expect(result.source).toBe('test-satellite');
      expect(result.analysis.type).toBe('tle');
      expect(result.analysis.satelliteId).toBe('25544');
      expect(result.analysis.orbitalPeriod).toBe('91.60 min');
      expect(result.message).toContain('Processed TLE for satellite 25544');
    });

    it('should process imagery data successfully', async () => {
      const event = {
        timestamp: '2024-01-01T00:00:00Z',
        source: 'test-camera',
        type: 'imagery',
        data: {
          image: 'base64encodedimagedata'
        },
      };

      const result = await processOrbitalData(event);

      expect(result).toBeDefined();
      expect(result.status).toBe('processed');
      expect(result.module).toBe('orbital');
      expect(result.analysis.type).toBe('imagery');
      expect(result.analysis.anomaliesDetected).toBe(0);
      expect(result.message).toContain('Analyzed image');
    });

    it('should handle missing TLE data', async () => {
      const event = {
        timestamp: '2024-01-01T00:00:00Z',
        source: 'test-satellite',
        type: 'tle',
        data: {},
      };

      const result = await processOrbitalData(event);

      expect(result).toBeDefined();
      expect(result.status).toBe('error');
      expect(result.message).toContain('TLE data missing');
    });

    it('should handle missing image data', async () => {
      const event = {
        timestamp: '2024-01-01T00:00:00Z',
        source: 'test-camera',
        type: 'imagery',
        data: {},
      };

      const result = await processOrbitalData(event);

      expect(result).toBeDefined();
      expect(result.status).toBe('error');
      expect(result.message).toContain('Image data missing');
    });

    it('should handle unsupported data types', async () => {
      const event = {
        timestamp: '2024-01-01T00:00:00Z',
        source: 'test-source',
        type: 'spaceweather',
        data: {},
      };

      const result = await processOrbitalData(event);

      expect(result).toBeDefined();
      expect(result.status).toBe('unsupported');
      expect(result.message).toContain('not yet supported');
      expect(result.analysis.supported).toBe(false);
    });

    it('should handle RF data type as unsupported', async () => {
      const event = {
        timestamp: '2024-01-01T00:00:00Z',
        source: 'test-source',
        type: 'rf',
        data: {},
      };

      const result = await processOrbitalData(event);

      expect(result).toBeDefined();
      expect(result.status).toBe('unsupported');
      expect(result.message).toContain('not yet supported');
    });

    it('should handle invalid event object', async () => {
      const result = await processOrbitalData(null);

      expect(result).toBeDefined();
      expect(result.status).toBe('error');
      expect(result.message).toContain('Processing failed');
    });

    it('should handle errors during TLE parsing', async () => {
      const event = {
        timestamp: '2024-01-01T00:00:00Z',
        source: 'test-satellite',
        type: 'tle',
        data: {
          tle: 'invalid tle data'
        },
      };

      const result = await processOrbitalData(event);

      expect(result).toBeDefined();
      expect(result.status).toBe('error');
      expect(result.message).toContain('Processing failed');
    });

    it('should use current timestamp if not provided', async () => {
      const event = {
        source: 'test-source',
        type: 'spaceweather',
        data: {},
      };

      const result = await processOrbitalData(event);

      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should use unknown source if not provided', async () => {
      const event = {
        timestamp: '2024-01-01T00:00:00Z',
        type: 'spaceweather',
        data: {},
      };

      const result = await processOrbitalData(event);

      expect(result).toBeDefined();
      expect(result.source).toBe('unknown');
    });
  });
});
