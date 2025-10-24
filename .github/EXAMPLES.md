# OSIRIS Workflow Examples

This document provides examples of how the OSIRIS CI/CD workflow operates in different scenarios.

## Example 1: Feature Branch Development

### Scenario
Developer creates a new feature branch and pushes code.

### Steps
```bash
# Create feature branch
git checkout -b feature/anomaly-detection

# Make changes and commit
git add src/anomaly_detector.py
git commit -m "Add anomaly detection module"
git push origin feature/anomaly-detection
```

### Workflow Actions
1. ✅ Workflow triggers on push to `feature/*` branch
2. 🧪 Runs feature-specific test suite
3. 📝 If tests pass: Creates auto-PR to `develop` branch
4. ❌ If tests fail: Creates issue with failure details

### Result
- Pull request created: "Auto-PR: Merge feature/anomaly-detection (Tests Passed)"
- Developer reviews and merges PR

---

## Example 2: Bugfix Branch

### Scenario
Developer fixes a bug on a bugfix branch.

### Steps
```bash
# Create bugfix branch
git checkout -b bugfix/null-pointer-fix

# Fix the bug
git add src/tracker.py
git commit -m "Fix null pointer in tracker"
git push origin bugfix/null-pointer-fix
```

### Workflow Actions
1. ✅ Workflow triggers on push to `bugfix/*` branch
2. 🧪 Runs bugfix validation test suite (includes regression tests)
3. 📝 If tests pass: Creates auto-PR to `develop` branch
4. ❌ If tests fail: Creates issue tagged with `test-failure`

---

## Example 3: Failed Tests

### Scenario
Tests fail on a feature branch.

### Steps
```bash
git push origin feature/broken-feature
```

### Workflow Actions
1. ❌ Tests fail during execution
2. 📋 Issue automatically created with title: "Test Failure on feature/broken-feature"
3. 🏷️ Issue labeled: `test-failure`, `automated`

### Issue Content
```markdown
## Test Failure Report

**Branch**: feature/broken-feature
**Commit**: abc123def456
**Workflow Run**: 42
**Run URL**: [Link to workflow]

### Summary
Integration tests failed with 2 errors

### Action Required
- Review the failed tests in the workflow logs
- Fix the failing tests
- Re-run the workflow or push a new commit
```

---

## Example 4: Develop Branch Merge

### Scenario
Developer merges to develop branch after PR approval.

### Steps
```bash
git checkout develop
git merge feature/anomaly-detection
git push origin develop
```

### Workflow Actions
1. ✅ Workflow triggers on push to `develop`
2. 🧪 Runs development test suite
3. 📄 Updates README "Latest Test Results" section
4. ⚠️ Does NOT create auto-PR (develop doesn't auto-merge to main)

### README Update
```markdown
## Latest Test Results

Last updated: 2025-10-24 16:30:00 UTC

- **Branch**: develop
- **Commit**: def789ghi012
- **Status**: success
- **Summary**: All tests passed
- **Timestamp**: 2025-10-24 16:30:00 UTC
```

---

## Example 5: Main Branch Deployment

### Scenario
Release manager merges develop to main for production release.

### Steps
```bash
# Create PR from develop to main
# After approval, merge via GitHub UI
```

### Workflow Actions
1. ✅ Workflow triggers on push to `main`
2. 🧪 Runs FULL production test suite (all tests)
3. 📄 Updates README with test results
4. 🌐 Deploys test dashboard to GitHub Pages
5. 🎉 Test results available at: `https://pr-cybr.github.io/OSIRIS/`

### GitHub Pages Dashboard Shows
- Current test status with visual badges
- Latest commit information
- Link to workflow run
- Timestamp of last update
- Repository information

---

## Example 6: Manual Workflow Trigger

### Scenario
Developer wants to re-run tests without pushing new commits.

### Steps
1. Go to **Actions** tab on GitHub
2. Select "OSIRIS CI/CD Workflow"
3. Click "Run workflow"
4. Select branch (e.g., `develop`)
5. Click "Run workflow" button

### Workflow Actions
Same as automatic trigger based on selected branch:
- Runs appropriate test suite
- Updates artifacts
- Performs branch-specific actions

---

## Example 7: Pull Request Testing

### Scenario
Developer opens PR manually (not auto-generated).

### Steps
```bash
# Push to branch
git push origin feature/new-feature

# Create PR via GitHub UI
# PR targets: develop
```

### Workflow Actions
1. ✅ Workflow triggers on pull request
2. 🧪 Runs test suite for source branch
3. 📊 Posts test results as PR check
4. ✅ PR shows "All checks have passed" if successful
5. ❌ PR shows "Some checks failed" if tests fail

### PR Status
- **Status Check**: "test / Run Tests on feature/new-feature"
- **Status**: ✅ Success or ❌ Failure
- **Details**: Link to workflow run

---

## Example 8: Handling Test Failure Issue

### Scenario
Developer addresses an auto-generated test failure issue.

### Steps
1. Review issue: "Test Failure on feature/my-feature"
2. Click workflow run link in issue
3. Review failed test logs
4. Fix the code locally
5. Push fix:
   ```bash
   git add fixed-file.py
   git commit -m "Fix failing test"
   git push origin feature/my-feature
   ```

### Workflow Actions
1. ✅ Workflow triggers on new push
2. 🧪 Tests run again
3. ✅ Tests pass this time
4. 📝 Auto-PR created
5. 👤 Developer manually closes the test failure issue (or references it in merge commit)

---

## Key Workflow Features Demonstrated

### Automated Testing
- ✅ Tests run on every push
- ✅ Branch-specific test suites
- ✅ Immediate feedback

### Issue Management
- ✅ Auto-creation on failure
- ✅ Detailed failure information
- ✅ Proper labeling

### PR Automation
- ✅ Auto-PR for successful branches
- ✅ Prevents duplicate PRs
- ✅ Includes test evidence

### Documentation
- ✅ README stays current
- ✅ Timestamped updates
- ✅ Automatic commits

### Visibility
- ✅ GitHub Pages dashboard
- ✅ Public test results
- ✅ Professional presentation

## Testing the Workflow

To test the workflow in your repository:

1. **Create a test branch**:
   ```bash
   git checkout -b feature/test-workflow
   echo "test" > test-file.txt
   git add test-file.txt
   git commit -m "Test workflow"
   git push origin feature/test-workflow
   ```

2. **Watch the Actions tab** to see the workflow execute

3. **Check for auto-PR** in the Pull Requests tab

4. **Verify the workflow** completed all steps successfully

## Troubleshooting Examples

See `.github/SETUP.md` for detailed troubleshooting guidance.
