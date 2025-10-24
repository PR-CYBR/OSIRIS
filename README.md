# OSIRIS
Platform for All-Domain Anomaly Tracking

[![CI/CD Status](https://github.com/PR-CYBR/OSIRIS/workflows/OSIRIS%20CI%2FCD%20Workflow/badge.svg)](https://github.com/PR-CYBR/OSIRIS/actions)

## Overview

OSIRIS is a comprehensive platform designed for all-domain anomaly tracking, featuring automated testing, continuous integration, and deployment capabilities.

## Features

- 🔍 **All-Domain Anomaly Tracking**: Comprehensive monitoring across multiple domains
- 🧪 **Automated Testing**: Branch-specific test execution with detailed reporting
- 🔄 **Continuous Integration**: Automated workflow for testing and deployment
- 📊 **Test Dashboard**: Live test results available via GitHub Pages
- 🤖 **Auto-PR Creation**: Automatic pull requests for successful test runs
- 📝 **Issue Tracking**: Automated issue creation for test failures

## CI/CD Workflow

The OSIRIS workflow includes:

1. **Branch-Specific Testing**: Different test suites run based on branch type
   - `main`: Full production test suite
   - `develop`: Development test suite
   - `feature/*`: Feature-specific tests
   - `bugfix/*`: Bugfix validation tests

2. **Automated Issue Creation**: Failed tests automatically generate GitHub issues

3. **Auto-PR Creation**: Successful branches automatically create merge PRs

4. **Documentation Updates**: README is updated with latest test results

5. **GitHub Pages Deployment**: Test results published to GitHub Pages

## Getting Started

### Running Tests Locally

Execute the test suite for your branch:

```bash
./tests/run-tests.sh
```

The test runner automatically detects your branch and runs the appropriate test suite.

### First-Time Setup

To enable all workflow features (GitHub Pages, auto-PRs, etc.):

1. Follow the setup guide: [`.github/SETUP.md`](.github/SETUP.md)
2. Enable GitHub Pages in repository settings
3. Configure workflow permissions

### Workflow Examples

See practical examples of the workflow in action: [`.github/EXAMPLES.md`](.github/EXAMPLES.md)

## Documentation

- 📘 [Setup Guide](.github/SETUP.md) - Configure the workflow in your repository
- 📖 [Usage Examples](.github/EXAMPLES.md) - Real-world workflow scenarios
- 📋 [Specification](.github/spec/ci-cd-spec.md) - Technical specification (Spec-Kit compliant)

## Latest Test Results

*Test results will be automatically updated by the CI/CD workflow*
