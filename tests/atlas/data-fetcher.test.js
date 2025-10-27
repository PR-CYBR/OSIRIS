/**
 * Tests for ATLAS Data Fetcher
 */

const {
  computeHash,
  buildSnapshotURL,
  normalizeBbox,
  resolveTime,
} = require('../../scripts/atlas/data-fetcher');

describe('ATLAS Data Fetcher', () => {
  describe('computeHash', () => {
    it('should compute SHA256 hash correctly', () => {
      const buffer = Buffer.from('Hello, World!');
      const hash = computeHash(buffer);

      expect(hash).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
    });

    it('should compute different hashes for different data', () => {
      const buffer1 = Buffer.from('test1');
      const buffer2 = Buffer.from('test2');

      const hash1 = computeHash(buffer1);
      const hash2 = computeHash(buffer2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('buildSnapshotURL', () => {
    it('should build valid snapshot URL', () => {
      const params = {
        time: '2024-01-15',
        bbox: [-68.0, 16.5, -64.0, 19.5],
        layers: 'MODIS_Terra_CorrectedReflectance_TrueColor',
        width: 2048,
        height: 2048,
        format: 'image/jpeg',
      };

      const url = buildSnapshotURL(params);

      expect(url).toContain('wvs.earthdata.nasa.gov');
      expect(url).toContain('REQUEST=GetSnapshot');
      expect(url).toContain('TIME=2024-01-15');
      expect(url).toContain('BBOX=16.5,-68,19.5,-64');
      expect(url).toContain('LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor');
      expect(url).toContain('WIDTH=2048');
      expect(url).toContain('HEIGHT=2048');
    });

    it('should handle custom dimensions', () => {
      const params = {
        time: '2024-01-15',
        bbox: [-68.0, 16.5, -64.0, 19.5],
        layers: 'Test_Layer',
        width: 1024,
        height: 512,
        format: 'image/png',
      };

      const url = buildSnapshotURL(params);

      expect(url).toContain('WIDTH=1024');
      expect(url).toContain('HEIGHT=512');
    });
  });

  describe('normalizeBbox', () => {
    it('should normalize array bbox', () => {
      const input = [-68.0, 16.5, -64.0, 19.5];
      const result = normalizeBbox(input);

      expect(result).toEqual([-68.0, 16.5, -64.0, 19.5]);
    });

    it('should throw error for invalid array length', () => {
      const input = [-68.0, 16.5, -64.0];

      expect(() => normalizeBbox(input)).toThrow('Invalid bbox array length');
    });

    it('should normalize GeoJSON FeatureCollection', () => {
      const input = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-66.0, 18.0],
            },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-67.0, 17.0],
            },
          },
        ],
      };

      const result = normalizeBbox(input);

      expect(result).toEqual([-67.0, 17.0, -66.0, 18.0]);
    });

    it('should throw error for invalid input', () => {
      const input = { invalid: 'data' };

      expect(() => normalizeBbox(input)).toThrow('Invalid bbox or GeoJSON input');
    });
  });

  describe('resolveTime', () => {
    it('should resolve "latest" to yesterday\'s date', () => {
      const result = resolveTime('latest');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const expected = yesterday.toISOString().split('T')[0];

      expect(result).toBe(expected);
    });

    it('should parse ISO date string', () => {
      const result = resolveTime('2024-01-15T12:00:00Z');

      expect(result).toBe('2024-01-15');
    });

    it('should handle date-only input', () => {
      const result = resolveTime('2024-01-15');

      expect(result).toBe('2024-01-15');
    });

    it('should default to yesterday when input is undefined', () => {
      const result = resolveTime();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const expected = yesterday.toISOString().split('T')[0];

      expect(result).toBe(expected);
    });
  });
});
