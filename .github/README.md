# OSIRIS CI/CD Documentation

Welcome to the OSIRIS CI/CD workflow documentation directory. This folder contains all the documentation, specifications, and examples for the GitHub Action workflow.

## 📚 Quick Navigation

### Getting Started
Start here if this is your first time setting up the workflow:
- **[SETUP.md](SETUP.md)** - Complete setup guide with step-by-step instructions

### Understanding the Workflow
Learn how the workflow operates in different scenarios:
- **[EXAMPLES.md](EXAMPLES.md)** - 8 real-world usage examples
- **[WORKFLOW-VISUALIZATION.md](WORKFLOW-VISUALIZATION.md)** - Architecture diagrams and visual flow charts

### Technical Details
For developers and maintainers:
- **[IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)** - Complete technical implementation details
- **[spec/ci-cd-spec.md](spec/ci-cd-spec.md)** - Spec-Kit compliant specification

### Workflow File
The actual GitHub Action workflow:
- **[workflows/osiris-ci.yml](workflows/osiris-ci.yml)** - Main CI/CD workflow definition

## 🎯 What Does This Workflow Do?

The OSIRIS CI/CD workflow automates:

1. **✅ Testing** - Runs branch-specific test suites automatically
2. **🐛 Issue Creation** - Creates tickets for failed tests
3. **🔄 Auto-PRs** - Opens pull requests for successful branches
4. **📝 Documentation** - Updates README with test results
5. **🌐 Publishing** - Deploys test dashboard to GitHub Pages

## 📖 Documentation Guide

### For First-Time Users
```
1. Read: SETUP.md (setup instructions)
2. Read: EXAMPLES.md (see it in action)
3. Try: Create a feature branch and push code
```

### For Understanding the Architecture
```
1. Read: WORKFLOW-VISUALIZATION.md (visual overview)
2. Read: workflows/osiris-ci.yml (actual workflow)
3. Read: spec/ci-cd-spec.md (technical specification)
```

### For Troubleshooting
```
1. Check: SETUP.md → Troubleshooting section
2. Review: Workflow logs in GitHub Actions tab
3. Read: EXAMPLES.md → Find your scenario
```

### For Customization
```
1. Read: IMPLEMENTATION-SUMMARY.md → Customization section
2. Read: spec/ci-cd-spec.md → Component descriptions
3. Modify: workflows/osiris-ci.yml
4. Test: Use workflow_dispatch to test changes
```

## 📋 Document Overview

| Document | Purpose | Audience | Length |
|----------|---------|----------|--------|
| **SETUP.md** | Setup & configuration guide | All users | ~270 lines |
| **EXAMPLES.md** | Real-world usage scenarios | All users | ~274 lines |
| **WORKFLOW-VISUALIZATION.md** | Architecture diagrams | Developers | ~400 lines |
| **IMPLEMENTATION-SUMMARY.md** | Technical details | Developers | ~325 lines |
| **spec/ci-cd-spec.md** | Formal specification | Maintainers | ~130 lines |
| **workflows/osiris-ci.yml** | Workflow definition | Developers | ~395 lines |

## 🔍 Common Tasks

### Enable the Workflow
👉 See: [SETUP.md](SETUP.md) → Setup Instructions

### Test the Workflow
👉 See: [EXAMPLES.md](EXAMPLES.md) → Example 6: Manual Workflow Trigger

### Fix Failed Tests
👉 See: [EXAMPLES.md](EXAMPLES.md) → Example 8: Handling Test Failure Issue

### Customize Test Suites
👉 See: [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md) → Customization

### Understand Job Flow
👉 See: [WORKFLOW-VISUALIZATION.md](WORKFLOW-VISUALIZATION.md) → Workflow Architecture

### Deploy to GitHub Pages
👉 See: [SETUP.md](SETUP.md) → Enable GitHub Pages

## 🏗️ Workflow Structure

```
.github/
├── workflows/
│   └── osiris-ci.yml          # Main workflow file (5 jobs)
├── spec/
│   └── ci-cd-spec.md          # Technical specification
├── SETUP.md                   # Setup guide
├── EXAMPLES.md                # Usage examples
├── WORKFLOW-VISUALIZATION.md  # Architecture diagrams
├── IMPLEMENTATION-SUMMARY.md  # Technical summary
└── README.md                  # This file
```

## 🎯 Quick Links

- **GitHub Actions**: [View Workflow Runs](../../actions)
- **Test Dashboard**: Will be at `https://pr-cybr.github.io/OSIRIS/` after Pages setup
- **Repository**: [OSIRIS Main](../../)

## ⚡ Quick Reference

### Workflow Jobs
1. `test` - Run tests
2. `create-issue-on-failure` - Create issue if tests fail
3. `create-auto-pr` - Create PR if tests pass (feature/bugfix only)
4. `update-readme` - Update README (main/develop only)
5. `deploy-pages` - Deploy to Pages (main only)

### Branch Behavior
- `main` → Full tests + README + Pages
- `develop` → Dev tests + README
- `feature/*` → Feature tests + Auto-PR
- `bugfix/*` → Bugfix tests + Auto-PR

### Required Permissions
- `contents: write`
- `issues: write`
- `pull-requests: write`
- `pages: write`
- `id-token: write`

## 📞 Support

Need help? Check these resources in order:

1. **SETUP.md** - Most common issues covered in troubleshooting section
2. **EXAMPLES.md** - Find a similar scenario to yours
3. **Workflow Logs** - Check Actions tab for detailed logs
4. **GitHub Issues** - Search or create an issue in the repository

## ✨ Features

- ✅ Branch-specific test execution
- ✅ Automatic issue creation for failures
- ✅ Auto-PR for successful branches
- ✅ Self-updating documentation
- ✅ Public test dashboard
- ✅ Spec-Kit compliant
- ✅ Production-ready

## 🔐 Security

All workflows have been:
- ✅ Scanned with CodeQL (0 vulnerabilities)
- ✅ Reviewed for security best practices
- ✅ Configured with minimal permissions
- ✅ Validated for token security

## 📜 License

Part of the OSIRIS project. See repository license for details.

---

**Documentation Version**: 1.0.0  
**Last Updated**: 2025-10-24  
**Status**: Production-Ready ✅

For more information about OSIRIS, see the [main README](../README.md).
