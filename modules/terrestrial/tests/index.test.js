const { processTerrestrialData } = require('../src/index');

describe('Terrestrial Data Module', () => {
  describe('processTerrestrialData', () => {
    it('normalizes seismic payloads into the shared schema', async () => {
      const payload = {
        timestamp: '2024-04-01T00:00:00Z',
        sensorId: 'seis-9',
        type: 'seismic',
        readings: {
          magnitude: { value: 3.4 },
          depth: { value: 12.1, unit: 'km' }
        },
        region: 'US-CA',
        provider: 'USGS',
        ingestId: 'ter-2000'
      };

      const result = await processTerrestrialData(payload);
      const [event] = result.events;

      expect(event.domain).toBe('terrestrial');
      expect(event.source.id).toBe('seis-9');
      expect(event.source.metadata).toMatchObject({ module: 'terrestrial', provider: 'USGS' });
      expect(event.metadata).toMatchObject({ eventType: 'seismic', region: 'US-CA' });
      expect(event.measurements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'magnitude', value: 3.4 }),
          expect.objectContaining({ name: 'depth', value: 12.1, unit: 'km' })
        ])
      );
    });

    it('throws when timestamp is missing', async () => {
      const payload = {
        source: 'sensor-55',
        readings: { vibration: 0.4 }
      };

      await expect(processTerrestrialData(payload)).rejects.toThrow(/timestamp/i);
    });

    it('processes infrastructure telemetry payloads', async () => {
      const payload = {
        timestamp: '2024-04-01T05:00:00Z',
        source: {
          id: 'bridge-22',
          type: 'infrastructure-sensor',
          metadata: { span: 'main' }
        },
        type: 'infrastructure',
        measurements: [
          { name: 'strain', value: 0.0021 },
          { name: 'temperature', value: 18.6, unit: 'C' }
        ],
        infrastructure: 'bridge',
        severity: 'normal',
        tags: ['infrastructure']
      };

      const result = await processTerrestrialData(payload);
      const [event] = result.events;

      expect(event.metadata).toMatchObject({ eventType: 'infrastructure', infrastructure: 'bridge' });
      expect(event.tags).toContain('infrastructure');
      expect(event.measurements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'strain', value: 0.0021 }),
          expect.objectContaining({ name: 'temperature', value: 18.6, unit: 'C' })
        ])
      );
    });
  });
});
