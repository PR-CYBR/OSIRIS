/**
 * Test suite for Orbital Data Module
 */

const { processOrbitalData } = require('../src/index');

describe('Orbital Data Module', () => {
  describe('processOrbitalData', () => {
    it('normalizes space weather payloads into the shared schema', async () => {
      const payload = {
        timestamp: '2024-01-01T00:00:00Z',
        source: {
          id: 'satellite-xyz',
          type: 'satellite',
          metadata: { orbitClass: 'LEO' }
        },
        type: 'spaceweather',
        data: {
          kpIndex: 4,
          solarWindSpeed: { value: 355, unit: 'km/s' }
        },
        metadata: {
          missionPhase: 'operational'
        },
        provider: 'NOAA',
        mission: 'Aurora Watch',
        tags: ['spaceweather'],
        ingestId: 'ingest-1234'
      };

      const result = await processOrbitalData({ body: JSON.stringify(payload) });

      expect(result.status).toBe('processed');
      expect(result.module).toBe('orbital');
      expect(result.events).toHaveLength(1);
      expect(result.writes).toHaveLength(1);

      const [event] = result.events;

      expect(event.domain).toBe('orbital');
      expect(event.source).toMatchObject({ id: 'satellite-xyz', type: 'satellite' });
      expect(event.source.metadata).toMatchObject({ module: 'orbital', provider: 'NOAA' });
      expect(event.metadata).toMatchObject({ eventType: 'spaceweather', mission: 'Aurora Watch' });
      expect(event.tags).toContain('spaceweather');
      expect(event.measurements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'kpIndex', value: 4 }),
          expect.objectContaining({ name: 'solarWindSpeed', value: 355, unit: 'km/s' })
        ])
      );
      expect(result.writes[0].item.data).toEqual(event);
    });

    it('throws when required fields are missing', async () => {
      const payload = {
        source: { id: 'satellite-xyz', type: 'satellite' },
        data: { flux: 7.2 }
      };

      await expect(processOrbitalData({ body: JSON.stringify(payload) })).rejects.toThrow(
        /timestamp/i
      );
    });

    it('supports TLE measurement payloads', async () => {
      const payload = {
        timestamp: '2024-02-01T12:00:00Z',
        source: 'tle-feed-123',
        type: 'tle',
        measurements: [
          { name: 'inclination', value: 98.7, unit: 'deg' },
          { name: 'eccentricity', value: 0.0012 }
        ],
        orbit: 'sun-synchronous',
        tags: ['tle']
      };

      const result = await processOrbitalData(payload);
      const [event] = result.events;

      expect(event.metadata).toMatchObject({ eventType: 'tle', orbit: 'sun-synchronous' });
      expect(event.tags).toContain('tle');
      expect(event.measurements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'inclination', value: 98.7, unit: 'deg' }),
          expect.objectContaining({ name: 'eccentricity', value: 0.0012 })
        ])
      );
    });
  });
});
