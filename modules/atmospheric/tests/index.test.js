const { processAtmosphericData } = require('../src/index');

describe('Atmospheric Data Module', () => {
  describe('processAtmosphericData', () => {
    it('normalizes weather station payloads delivered via queue records', async () => {
      const payload = {
        timestamp: '2024-03-10T10:00:00Z',
        stationId: 'wx-101',
        type: 'weather',
        metrics: {
          temperature: { value: 21.5, unit: 'C' },
          humidity: 55
        },
        provider: 'OpenWeather',
        region: 'US-NW',
        location: { lat: 40.1, lon: -120.2 },
        ingestId: 'atm-1000'
      };

      const result = await processAtmosphericData({
        Records: [
          {
            body: JSON.stringify(payload)
          }
        ]
      });

      expect(result.status).toBe('processed');
      expect(result.module).toBe('atmospheric');
      expect(result.events).toHaveLength(1);

      const [event] = result.events;

      expect(event.domain).toBe('atmospheric');
      expect(event.source.id).toBe('wx-101');
      expect(event.source.metadata).toMatchObject({ module: 'atmospheric', provider: 'OpenWeather' });
      expect(event.metadata).toMatchObject({ eventType: 'weather', region: 'US-NW' });
      expect(event.measurements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'temperature', value: 21.5, unit: 'C' }),
          expect.objectContaining({ name: 'humidity', value: 55 })
        ])
      );
    });

    it('throws when measurements are missing', async () => {
      const payload = {
        timestamp: '2024-03-10T10:00:00Z',
        source: 'wx-202'
      };

      await expect(processAtmosphericData(payload)).rejects.toThrow(/measurement/i);
    });

    it('processes flight tracking payloads', async () => {
      const payload = {
        timestamp: '2024-03-10T12:00:00Z',
        source: {
          id: 'adsb-feed-1',
          type: 'flight-feed',
          metadata: { operator: 'FAA' }
        },
        type: 'flight',
        measurements: [
          { name: 'altitude', value: 32000, unit: 'ft' },
          { name: 'heading', value: 147 }
        ],
        phenomenon: 'deviation',
        tags: ['flight']
      };

      const result = await processAtmosphericData(payload);
      const [event] = result.events;

      expect(event.metadata).toMatchObject({ eventType: 'flight', phenomenon: 'deviation' });
      expect(event.tags).toContain('flight');
      expect(event.measurements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'altitude', value: 32000, unit: 'ft' }),
          expect.objectContaining({ name: 'heading', value: 147 })
        ])
      );
    });
  });
});
