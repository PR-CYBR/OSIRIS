# OSIRIS CI/CD Workflow Visualization

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OSIRIS CI/CD WORKFLOW                                │
│                      (osiris-ci.yml - 5 Jobs Total)                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TRIGGER EVENTS                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Push to: main, develop, feature/**, bugfix/**                             │
│ • Pull Request targeting: main, develop                                     │
│ • Manual: workflow_dispatch                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ JOB 1: test                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ✓ Checkout repository                                                       │
│ ✓ Setup test environment                                                    │
│ ✓ Run branch-specific tests                                                 │
│   ├─ main      → Full production suite                                      │
│   ├─ develop   → Development suite                                          │
│   ├─ feature/* → Feature-specific tests                                     │
│   └─ bugfix/*  → Bugfix validation tests                                    │
│ ✓ Upload test results as artifacts                                          │
│                                                                              │
│ OUTPUTS: test-result, test-summary                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                  │
                    │ (on failure)                     │ (on success)
                    ▼                                  ▼
┌──────────────────────────────────┐  ┌──────────────────────────────────────┐
│ JOB 2: create-issue-on-failure   │  │ JOB 3: create-auto-pr                │
├──────────────────────────────────┤  ├──────────────────────────────────────┤
│ CONDITIONS:                      │  │ CONDITIONS:                          │
│ • if: failure()                  │  │ • if: success()                      │
│ • needs: test                    │  │ • needs: test                        │
│                                  │  │ • not main/develop branches          │
│ ACTIONS:                         │  │ • event: push                        │
│ ✓ Create GitHub Issue            │  │                                      │
│ ✓ Add labels: test-failure,      │  │ ACTIONS:                             │
│   automated                      │  │ ✓ Check if PR exists                 │
│ ✓ Include failure details        │  │ ✓ Create PR to develop               │
│ ✓ Link to workflow run           │  │ ✓ Include test results               │
└──────────────────────────────────┘  └──────────────────────────────────────┘

                    (on main/develop, success)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ JOB 4: update-readme                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ CONDITIONS:                                                                  │
│ • if: success()                                                              │
│ • needs: test                                                                │
│ • branch: main OR develop                                                    │
│                                                                              │
│ ACTIONS:                                                                     │
│ ✓ Download test results                                                     │
│ ✓ Update README "Latest Test Results" section                               │
│ ✓ Commit changes with [skip ci]                                             │
│ ✓ Push to repository                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              │ (on main branch only)
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ JOB 5: deploy-pages                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ CONDITIONS:                                                                  │
│ • if: success()                                                              │
│ • needs: test, update-readme                                                 │
│ • branch: main                                                               │
│                                                                              │
│ ACTIONS:                                                                     │
│ ✓ Create HTML dashboard                                                     │
│ ✓ Setup GitHub Pages                                                        │
│ ✓ Upload Pages artifact                                                     │
│ ✓ Deploy to GitHub Pages                                                    │
│                                                                              │
│ OUTPUT: https://pr-cybr.github.io/OSIRIS/                                   │
└─────────────────────────────────────────────────────────────────────────────┘

```

## Branch Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           BRANCH WORKFLOWS                                  │
└────────────────────────────────────────────────────────────────────────────┘

FEATURE BRANCH (feature/new-feature)
════════════════════════════════════
Push → Test → ✓ Pass → Auto-PR → Review → Merge to develop
         ↓
         ✗ Fail → Issue Created


BUGFIX BRANCH (bugfix/fix-error)
═══════════════════════════════
Push → Test → ✓ Pass → Auto-PR → Review → Merge to develop
         ↓
         ✗ Fail → Issue Created


DEVELOP BRANCH
═══════════════
Push → Test → ✓ Pass → Update README
         ↓
         ✗ Fail → Issue Created


MAIN BRANCH (Production)
═════════════════════════
Push → Test → ✓ Pass → Update README → Deploy to GitHub Pages
         ↓
         ✗ Fail → Issue Created


PULL REQUEST
═════════════
Open PR → Test → ✓/✗ Status Check → Review → Merge

```

## Test Suite Matrix

```
┌──────────────┬─────────────────────────────────────────────────────────┐
│   BRANCH     │                    TEST SUITES                          │
├──────────────┼─────────────────────────────────────────────────────────┤
│ main         │ ✓ Unit Tests                                            │
│              │ ✓ Integration Tests                                     │
│              │ ✓ End-to-End Tests                                      │
│              │ ✓ Performance Tests                                     │
│              │ ✓ Security Tests                                        │
├──────────────┼─────────────────────────────────────────────────────────┤
│ develop      │ ✓ Unit Tests                                            │
│              │ ✓ Integration Tests                                     │
│              │ ✓ API Tests                                             │
├──────────────┼─────────────────────────────────────────────────────────┤
│ feature/*    │ ✓ Unit Tests                                            │
│              │ ✓ Feature Tests                                         │
├──────────────┼─────────────────────────────────────────────────────────┤
│ bugfix/*     │ ✓ Unit Tests                                            │
│              │ ✓ Regression Tests                                      │
└──────────────┴─────────────────────────────────────────────────────────┘
```

## Job Dependencies

```
                    test (Job 1)
                        │
        ┌───────────────┼───────────────┬─────────────┐
        │               │               │             │
        ▼               ▼               ▼             ▼
create-issue-    create-auto-pr   update-readme  (continue)
on-failure       (Job 3)          (Job 4)
(Job 2)                                │
                                       │ (if main)
                                       ▼
                                  deploy-pages
                                  (Job 5)
```

## Permissions Required

```
┌────────────────────┬──────────────────────────────────────────────────┐
│   PERMISSION       │               PURPOSE                            │
├────────────────────┼──────────────────────────────────────────────────┤
│ contents: write    │ Commit README updates, checkout code            │
│ issues: write      │ Create issues for test failures                 │
│ pull-requests:     │ Create auto-PRs for successful branches         │
│   write            │                                                  │
│ pages: write       │ Deploy to GitHub Pages                          │
│ id-token: write    │ Authenticate for Pages deployment              │
└────────────────────┴──────────────────────────────────────────────────┘
```

## Artifact Flow

```
Test Results Artifact
─────────────────────
         │
         ├─→ Uploaded by: test (Job 1)
         │
         ├─→ Downloaded by: update-readme (Job 4)
         │
         └─→ Downloaded by: deploy-pages (Job 5)

Artifact Name: test-results-{branch}-{run-number}
Location: Workflow run artifacts section
Retention: Per repository settings
```

## Success Paths

```
HAPPY PATH (Feature Branch)
═══════════════════════════
Push code
  ↓
Tests pass ✓
  ↓
Auto-PR created
  ↓
Code review
  ↓
Merge to develop
  ↓
Tests pass on develop ✓
  ↓
README updated
  ↓
(Manual) Create PR to main
  ↓
Merge to main
  ↓
Full test suite passes ✓
  ↓
README updated
  ↓
GitHub Pages deployed
  ↓
✨ Feature live!


FAILURE PATH
════════════
Push code
  ↓
Tests fail ✗
  ↓
Issue created automatically
  ↓
Developer notified
  ↓
Fix code
  ↓
Push again
  ↓
Tests pass ✓
  ↓
(Continues on happy path...)
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  GitHub Actions → GitHub API → GitHub Issues (issue creation)       │
│                                                                      │
│  GitHub Actions → GitHub API → Pull Requests (PR creation)          │
│                                                                      │
│  GitHub Actions → GitHub API → Repository (README commits)          │
│                                                                      │
│  GitHub Actions → GitHub Pages → Public Dashboard                   │
│                                                                      │
│  GitHub Actions → Artifacts → Test Results Storage                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## File Interaction Map

```
Workflow reads/writes:
├── .github/workflows/osiris-ci.yml (reads: itself)
├── tests/run-tests.sh (executes: test runner)
├── test-results/ (creates: test outputs)
├── README.md (updates: test summary section)
├── docs/ (creates/updates: GitHub Pages content)
│   ├── index.html (generated)
│   ├── test-results/ (copied artifacts)
│   └── _config.yml (reads: Pages config)
└── .github/spec/ci-cd-spec.md (reference: specification)
```

---

**Visualization Version**: 1.0.0  
**Last Updated**: 2025-10-24  
**Status**: Production-Ready ✅
