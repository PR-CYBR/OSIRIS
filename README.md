# OSIRIS

[![Spec-Kit Validation](https://github.com/PR-CYBR/OSIRIS/actions/workflows/spec-kit.yml/badge.svg)](https://github.com/PR-CYBR/OSIRIS/actions/workflows/spec-kit.yml)
[![Dev](https://github.com/PR-CYBR/OSIRIS/actions/workflows/dev.yml/badge.svg?branch=dev)](https://github.com/PR-CYBR/OSIRIS/actions/workflows/dev.yml)
[![Test](https://github.com/PR-CYBR/OSIRIS/actions/workflows/test.yml/badge.svg?branch=test)](https://github.com/PR-CYBR/OSIRIS/actions/workflows/test.yml)
[![Stage](https://github.com/PR-CYBR/OSIRIS/actions/workflows/stage.yml/badge.svg?branch=stage)](https://github.com/PR-CYBR/OSIRIS/actions/workflows/stage.yml)
[![Production](https://github.com/PR-CYBR/OSIRIS/actions/workflows/prod.yml/badge.svg?branch=prod)](https://github.com/PR-CYBR/OSIRIS/actions/workflows/prod.yml)

**Orbital, Spatial, and Integrated Reconnaissance Intelligence System**

A self-updating, AI-driven platform for multi-domain anomaly detection, fusing orbital, atmospheric, and terrestrial data sources.

## 📊 System Status

| Component | Status | Last Updated |
|-----------|--------|--------------|
| 🛰️ Orbital Module | 🔄 Initializing | - |
| 🌤️ Atmospheric Module | 🔄 Initializing | - |
| 🌍 Terrestrial Module | 🔄 Initializing | - |
| 🔀 Data Fusion | 🔄 Initializing | - |
| 🎯 Anomaly Detection | 🔄 Initializing | - |
| 📡 API Gateway | 🔄 Initializing | - |

**Legend:** ✅ Operational | ⚠️ Degraded | ❌ Down | 🔄 Initializing | 🚧 In Development

## 🚀 Quick Start

OSIRIS is currently in active development. The platform follows a specification-driven development approach using the [Spec-Kit framework](https://github.com/PR-CYBR/spec-bootstrap).

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Ingestion Layer                      │
├──────────────┬──────────────────┬──────────────────────────┤
│ Orbital      │ Atmospheric      │ Terrestrial              │
│ Data Module  │ Data Module      │ Data Module              │
└──────┬───────┴────────┬─────────┴──────────┬───────────────┘
       │                │                     │
       └────────────────┼─────────────────────┘
                        ▼
            ┌──────────────────────┐
            │  Data Fusion Layer   │
            └──────────┬────────────┘
                       ▼
            ┌──────────────────────┐
            │ Anomaly Detection    │
            └──────────┬────────────┘
                       ▼
            ┌──────────────────────┐
            │ Storage & API Layer  │
            └──────────────────────┘
```

## 📋 Development Roadmap

Track our progress in the [Implementation Plan](.specify/plan.md).

**Current Phase:** Phase 2 - Infrastructure and CI/CD Setup

- [x] Initialize Spec-Kit framework
- [x] Create project documentation
- [x] Set up CI/CD pipelines
- [ ] Create core module structure
- [ ] Implement data ingestion modules
- [ ] Build data fusion engine
- [ ] Deploy anomaly detection models

## 🏗️ Project Structure

```
OSIRIS/
├── .specify/              # Spec-Kit framework
│   ├── constitution.md    # Project principles
│   ├── spec.md           # Technical specifications
│   ├── plan.md           # Implementation plan
│   └── tasks/            # Task tracking
├── .github/
│   └── workflows/        # CI/CD automation
├── modules/              # Core processing modules
│   ├── orbital/         # Space-based data
│   ├── atmospheric/     # Weather & air data
│   ├── terrestrial/     # Ground-based data
│   ├── fusion/          # Data correlation
│   └── detection/       # ML-based anomaly detection
├── api/                 # API endpoints
└── docs/                # Documentation
```

## 🔄 CI/CD Pipeline

OSIRIS uses an automated branch promotion strategy:

```
main → test → stage → prod → pages
```

- **main**: Development integration branch
- **test**: Automated testing and validation
- **stage**: Pre-production validation
- **prod**: Production deployment
- **pages**: Public status page (GitHub Pages)

All branches have automated validation and promotion via GitHub Actions.

## 📚 Documentation

- [Constitution](.specify/constitution.md) - Project principles and governance
- [Technical Specification](.specify/spec.md) - Detailed architecture and requirements
- [Implementation Plan](.specify/plan.md) - Development roadmap and milestones

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+ (serverless/Lambda compatible)
- **ML Framework**: TensorFlow.js
- **Data Storage**: AWS DynamoDB, S3
- **API**: RESTful with JSON
- **CI/CD**: GitHub Actions
- **IaC**: Terraform (planned)

## 🤝 Contributing

OSIRIS follows a specification-driven development approach:

1. All changes start with updating specifications
2. Implementation follows documented specs
3. Tests validate against spec requirements
4. Documentation is updated alongside code

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines (coming soon).

## 📄 License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.

## 🔗 Links

- [GitHub Repository](https://github.com/PR-CYBR/OSIRIS)
- [GitHub Pages Status](https://pr-cybr.github.io/OSIRIS/) (coming soon)
- [Issue Tracker](https://github.com/PR-CYBR/OSIRIS/issues)
- [Spec-Kit Framework](https://github.com/PR-CYBR/spec-bootstrap)

---

**Platform for All-Domain Anomaly Tracking**

## Latest Test Results

Last updated: 2025-10-24 19:19:29 UTC

## Test Results
- **Branch**: main
- **Commit**: 3b929f94bc1d45256a2360e78b791d8c6053d4f4
- **Status**: success
- **Summary**: All tests passed
- **Timestamp**: 2025-10-24 19:19:15 UTC
## Test Results
- **Branch**: main
- **Commit**: d3af5a5efb55390d86f37e7338f4e8df82a3d670
- **Status**: success
- **Summary**: All tests passed
- **Timestamp**: 2025-10-24 18:41:27 UTC
