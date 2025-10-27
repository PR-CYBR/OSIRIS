# ATLAS Environmental Context Acquisition Workflow

## Overview

The ATLAS (AI/ATLAS) Environmental Context Acquisition workflow is an AI-executable workflow designed to collect near-real-time Earth observation context layers aligned to satellite overpasses. This workflow supports situational awareness, planning, and analysis by fetching environmental data from NASA's GIBS (Global Imagery Browse Services).

## Features

- **Capability-Aware Execution**: Automatically detects available capabilities (HTTP, filesystem, hashing, etc.) and adapts execution accordingly
- **Multiple Data Products**: Supports 6 different environmental data layers from NASA GIBS
- **Automatic Fallbacks**: Gracefully handles missing capabilities with alternative strategies
- **Integrity Verification**: Computes SHA-256 hashes for all downloaded files
- **Comprehensive Provenance**: Records detailed metadata and provenance information
- **AI-Friendly Design**: Structured for execution by AI agents with deterministic step logic

## Data Products

The workflow can acquire the following environmental context layers:

1. **MODIS Terra True Color** (Priority 1)
   - Daylight optical context for footprints
   - Default opacity: 0.7

2. **VIIRS Day/Night Band Radiance** (Priority 2)
   - Night illumination and power outage detection
   - Default opacity: 0.8

3. **VIIRS Cloud Mask Day** (Priority 3)
   - Imaging window planning and cloud screening

4. **MODIS Active Fire** (Priority 4)
   - Thermal anomaly cueing (wildfires, industrial activity)

5. **VIIRS Sea Surface Temperature** (Priority 5)
   - Maritime context and ocean monitoring

6. **OMI UV Aerosol Index** (Priority 6)
   - Smoke, dust, and aerosol interference detection

## Installation

The workflow is already integrated into the OSIRIS project. No additional installation is required beyond the standard OSIRIS dependencies.

```bash
# Install dependencies (from OSIRIS root)
npm install
```

## Usage

### Command Line Execution

The workflow can be executed directly from the command line:

```bash
# Basic execution with defaults
node scripts/atlas/workflow-executor.js

# With custom bounding box (Caribbean region example)
node scripts/atlas/workflow-executor.js --bbox '[-68.0, 16.5, -64.0, 19.5]'

# With custom time (yesterday's date by default)
node scripts/atlas/workflow-executor.js --time '2024-01-15'

# With custom output directory
node scripts/atlas/workflow-executor.js --output './my-atlas-data'

# Combined options
node scripts/atlas/workflow-executor.js \
  --bbox '[-68.0, 16.5, -64.0, 19.5]' \
  --time '2024-01-15' \
  --output './atlas_ctx'
```

### Programmatic Usage

```javascript
const { executeWorkflow, loadManifest } = require('./scripts/atlas/workflow-executor');

async function runWorkflow() {
  // Load the manifest
  const manifest = await loadManifest('./workflows/AI_ENV_AWARE_EO_MANIFEST.yaml');

  // Define inputs
  const inputs = {
    bbox: [-68.0, 16.5, -64.0, 19.5], // [minx, miny, maxx, maxy]
    time: 'latest', // or ISO date string
    width: 2048,
    height: 2048,
    outputDir: './atlas_ctx',
  };

  // Execute workflow
  const result = await executeWorkflow(manifest, inputs);

  console.log('Workflow completed:', result);
}

runWorkflow();
```

### Capability Probing

You can test system capabilities independently:

```bash
# Run capability probes
node scripts/atlas/capability-probe.js
```

Expected output:

```json
{
  "timestamp": "2024-01-15T12:00:00.000Z",
  "probes": [
    {
      "capability": "can_http",
      "available": true,
      "details": { "statusCode": 200, ... }
    },
    ...
  ],
  "summary": {
    "total": 6,
    "available": 6,
    "unavailable": 0
  }
}
```

## Workflow Steps

The workflow follows a deterministic execution plan:

1. **Assess Capabilities**: Tests for HTTP, filesystem, image rendering, compression, hashing, and human prompting capabilities
2. **Normalize ROI**: Converts GeoJSON or bbox input to normalized bounding box
3. **Resolve Time**: Converts time input to actual available imagery date
4. **Acquisition**: Fetches products by priority from NASA GIBS endpoints
5. **Integrity & Provenance**: Computes SHA-256 hashes and creates provenance records
6. **Storage**: Saves files to structured directory hierarchy
7. **Validation**: Verifies successful acquisition of at least one product
8. **Report**: Generates machine-readable (JSONL) and human-readable (Markdown) summaries

## Output Structure

The workflow creates the following directory structure:

```
atlas_ctx/
├── YYYYMMDD_HHMM/
│   ├── MODIS_Terra_TrueColor/
│   │   ├── MODIS_Terra_TrueColor_YYYY-MM-DD_abc12345.jpg
│   │   ├── metadata.json
│   │   └── provenance.txt
│   ├── VIIRS_DayNightBand_Radiance/
│   │   ├── VIIRS_DayNightBand_Radiance_YYYY-MM-DD_abc12345.jpg
│   │   ├── metadata.json
│   │   └── provenance.txt
│   └── ...
├── summary_YYYYMMDD_HHMM.jsonl
├── summary_YYYYMMDD_HHMM.md
└── execution.json
```

### Metadata Format

Each product includes a `metadata.json` file:

```json
{
  "product_id": "MODIS_Terra_TrueColor",
  "product_purpose": "Daylight optical context for footprints",
  "endpoint_kind": "SNAPSHOT_API",
  "time_requested": "latest",
  "time_actual": "2024-01-15",
  "bbox": [-68.0, 16.5, -64.0, 19.5],
  "projection": "EPSG:4326",
  "urls_used": ["https://..."],
  "http_status": 200,
  "content_type": "image/jpeg",
  "content_length": 524288,
  "sha256": "abc123...",
  "filename": "MODIS_Terra_TrueColor_2024-01-15_abc12345.jpg",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "width": 2048,
  "height": 2048
}
```

## Configuration

The workflow configuration is defined in `workflows/AI_ENV_AWARE_EO_MANIFEST.yaml`. Key configuration sections:

- **meta**: Workflow metadata and intent
- **capability_matrix**: Capability probes and fallback strategies
- **products**: Data product definitions and endpoints
- **inputs**: Default input parameters
- **plan**: Workflow execution steps
- **fallbacks**: Error handling strategies
- **outputs**: Output format specifications
- **governance**: Licensing and compliance information

## Fallback Mechanisms

The workflow includes several fallback mechanisms:

1. **Rate Limiting**: Exponential backoff with configurable retry limits
2. **Endpoint Selection**: Automatic fallback from WMTS to SNAPSHOT_API
3. **Offline Mode**: Generates download URLs if HTTP is unavailable
4. **Human Prompting**: Requests manual intervention when automated acquisition fails

## Data Source

All data is sourced from NASA's Global Imagery Browse Services (GIBS):

- **Base URL**: https://gibs.earthdata.nasa.gov/
- **Snapshot API**: https://wvs.earthdata.nasa.gov/api/v1/snapshot
- **Licensing**: Open for public use; cite NASA/GIBS
- **Documentation**: https://wiki.earthdata.nasa.gov/display/GIBS

## Integration with OSIRIS

This workflow is designed to integrate with OSIRIS's orbital module to provide environmental context for satellite observations:

```javascript
// Example integration
const { executeWorkflow, loadManifest } = require('./scripts/atlas/workflow-executor');

async function getEnvironmentalContext(satellitePass) {
  const manifest = await loadManifest('./workflows/AI_ENV_AWARE_EO_MANIFEST.yaml');

  const inputs = {
    bbox: satellitePass.footprint.bbox,
    time: satellitePass.timestamp,
    outputDir: `./atlas_ctx/pass_${satellitePass.id}`,
  };

  return await executeWorkflow(manifest, inputs);
}
```

## Testing

Run the workflow tests:

```bash
# Run all tests
npm test

# Run specific test file (once created)
npm test -- scripts/atlas/tests/
```

## Troubleshooting

### HTTP Connection Issues

If you encounter HTTP connection errors:

1. Check your internet connection
2. Verify that NASA GIBS endpoints are accessible
3. Review firewall settings

### Missing Capabilities

If capabilities are unavailable:

- The workflow will automatically use fallback mechanisms
- Check the capability probe output for details
- Review the execution log for specific capability issues

### Data Unavailability

If specific dates are unavailable:

- GIBS typically has data from yesterday and earlier
- Some products have different temporal availability
- The workflow will use the nearest available date within tolerance

## Contributing

To add new data products:

1. Add product definition to `workflows/AI_ENV_AWARE_EO_MANIFEST.yaml`
2. Include endpoint URLs (WMTS and/or SNAPSHOT_API)
3. Set priority and default opacity
4. Update documentation

## License

This workflow implementation is part of OSIRIS and is released under the MIT License.

Data retrieved from NASA GIBS is open for public use. Please cite NASA/GIBS when using the data.

## References

- [NASA GIBS Documentation](https://wiki.earthdata.nasa.gov/display/GIBS)
- [GIBS Available Imagery Products](https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+Available+Imagery+Products)
- [Web Map Tile Service (WMTS) Standard](https://www.ogc.org/standards/wmts)
- [EPSG:4326 Projection](https://epsg.io/4326)
