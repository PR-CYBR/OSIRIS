# OSIRIS CI/CD Setup Guide

## Overview

This guide explains how to configure and use the OSIRIS CI/CD workflow in your repository.

## Prerequisites

- GitHub repository with admin access
- GitHub Actions enabled
- GitHub Pages available (included in all public repos)

## Setup Instructions

### 1. Enable GitHub Actions

GitHub Actions should be enabled by default. To verify:

1. Go to your repository settings
2. Navigate to "Actions" → "General"
3. Ensure "Allow all actions and reusable workflows" is selected

### 2. Enable GitHub Pages

To enable the test results dashboard:

1. Go to repository **Settings**
2. Navigate to **Pages** in the left sidebar
3. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
4. Save the settings

The workflow will automatically deploy to GitHub Pages when tests pass on the `main` branch.

### 3. Workflow Permissions

The workflow requires certain permissions. To configure:

1. Go to repository **Settings**
2. Navigate to **Actions** → **General**
3. Scroll to "Workflow permissions"
4. Select **"Read and write permissions"**
5. Check **"Allow GitHub Actions to create and approve pull requests"**
6. Save the settings

### 4. Branch Protection (Optional but Recommended)

To ensure quality:

1. Go to repository **Settings** → **Branches**
2. Add a branch protection rule for `main`:
   - Require pull request reviews before merging
   - Require status checks to pass (select "test" job)
   - Require branches to be up to date before merging

## Using the Workflow

### Automatic Triggers

The workflow automatically runs on:

- **Push** to: `main`, `develop`, `feature/*`, `bugfix/*`
- **Pull requests** targeting: `main`, `develop`
- **Manual dispatch** (see below)

### Manual Trigger

To manually run the workflow:

1. Go to **Actions** tab
2. Select "OSIRIS CI/CD Workflow"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

### Branch-Specific Behavior

#### Main Branch

- Runs full production test suite
- Updates README with test results
- Deploys to GitHub Pages
- Does NOT create auto-PRs

#### Develop Branch

- Runs development test suite
- Updates README with test results
- Does NOT create auto-PRs

#### Feature Branches (`feature/*`)

- Runs feature-specific tests
- Creates auto-PR to `develop` if tests pass
- Creates issue if tests fail

#### Bugfix Branches (`bugfix/*`)

- Runs bugfix validation tests
- Creates auto-PR to `develop` if tests pass
- Creates issue if tests fail

## Workflow Jobs

### 1. Test

Runs branch-appropriate test suite and generates results.

### 2. Create Issue on Failure

If tests fail, automatically creates a GitHub issue with:

- Failure details
- Link to workflow run
- Branch and commit information
- Auto-labels: `test-failure`, `automated`

### 3. Create Auto-PR

For successful feature/bugfix branches:

- Creates PR to `develop`
- Includes test results
- Skips if PR already exists

### 4. Update README

On `main` and `develop`:

- Updates "Latest Test Results" section
- Includes timestamp and status
- Auto-commits with `[skip ci]`

### 5. Deploy to GitHub Pages

On `main` branch only:

- Creates test results dashboard
- Deploys to GitHub Pages
- Accessible at: `https://<username>.github.io/<repository>/`

## Customization

### Adding Your Tests

Replace the test simulation in `.github/workflows/osiris-ci.yml` with actual test commands:

```yaml
- name: Run branch-specific tests
  id: run-tests
  run: |
    # Replace with your actual test commands
    npm test           # For Node.js
    pytest             # For Python
    go test ./...      # For Go
    dotnet test        # For .NET
```

### Modifying Test Runner

Edit `tests/run-tests.sh` to customize branch-specific test suites:

```bash
case "$BRANCH_NAME" in
    main)
        # Add your production test commands
        npm run test:prod
        ;;
    develop)
        # Add your dev test commands
        npm run test:dev
        ;;
esac
```

### Adjusting Branch Patterns

Modify workflow triggers in `.github/workflows/osiris-ci.yml`:

```yaml
on:
  push:
    branches:
      - main
      - develop
      - 'feature/**' # Your custom pattern
      - 'release/**' # Add new patterns
```

## Monitoring

### View Workflow Runs

1. Go to **Actions** tab
2. Select "OSIRIS CI/CD Workflow"
3. View run history and details

### View Test Results

- **README**: Updated automatically with latest results
- **GitHub Pages**: View dashboard at your Pages URL
- **Artifacts**: Download from workflow run page

### View Created Issues

Issues created by workflow have labels:

- `test-failure`
- `automated`

Filter issues by these labels to find automated failure reports.

### View Auto-PRs

Pull requests created by workflow have title format:

- `Auto-PR: Merge <branch> (Tests Passed)`

## Troubleshooting

### Workflow Not Running

- Check that Actions are enabled
- Verify branch name matches trigger patterns
- Check workflow permissions

### GitHub Pages Not Deploying

- Enable GitHub Pages with "GitHub Actions" source
- Check workflow permissions include `pages: write`
- Verify job completed successfully in Actions tab

### Auto-PRs Not Creating

- Verify workflow permissions allow PR creation
- Check that branch is not `main` or `develop`
- Confirm tests passed successfully

### README Not Updating

- Check workflow permissions include `contents: write`
- Verify you're on `main` or `develop` branch
- Review commit history for `[skip ci]` commits

## Best Practices

1. **Always test locally** before pushing
2. **Review auto-generated PRs** before merging
3. **Close or address** auto-generated issues promptly
4. **Keep test suites fast** (under 10 minutes if possible)
5. **Use descriptive branch names** that match patterns

## Support

For issues or questions:

- Check workflow logs in Actions tab
- Review specification: `.github/spec/ci-cd-spec.md`
- Open an issue in the repository

## Spec-Kit Compliance

This workflow follows Spec-Kit conventions:

- ✅ Specification-driven development
- ✅ Clear naming conventions
- ✅ Explicit documentation
- ✅ Traceable changes
- ✅ Automated validation

See `.github/spec/ci-cd-spec.md` for full specification details.
