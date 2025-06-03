# Release Guide

This document outlines how to release new versions of `svg-toolbelt` to NPM.

## Prerequisites

1. **NPM Account**: Make sure you have publish access to the `svg-toolbelt` package on NPM
2. **GitHub Secrets**: The following secret must be configured in your GitHub repository:
   - `NPM_TOKEN`: Your NPM access token with publish permissions

### Setting up NPM_TOKEN

1. Go to [npmjs.com](https://www.npmjs.com/) and sign in
2. Click on your profile → "Access Tokens"
3. Generate a new token with "Automation" type (granular access token recommended)
4. Copy the token
5. In your GitHub repository, go to Settings → Secrets and variables → Actions
6. Add a new repository secret named `NPM_TOKEN` with your token value

## Release Process

### Option 1: Automated Release (Recommended)

1. **Update version and create git tag:**
   ```bash
   # For patch releases (0.1.2 → 0.1.3)
   npm run release:patch

   # For minor releases (0.1.2 → 0.2.0)
   npm run release:minor

   # For major releases (0.1.2 → 1.0.0)
   npm run release:major
   ```

2. **Create GitHub Release:**
   - Go to your repository on GitHub
   - Click "Releases" → "Create a new release"
   - Select the tag you just created
   - Add release title and description
   - Click "Publish release"

3. **Automatic Publishing:**
   - The GitHub Action will automatically:
     - Run tests and build
     - Verify version matches the release tag
     - Publish to NPM
     - Update the demo site
     - Add a comment to the release with NPM details

### Option 2: Manual Release

If you prefer manual control:

1. **Update version in package.json manually**
2. **Commit and tag:**
   ```bash
   git add package.json
   git commit -m "chore: bump version to v0.1.3"
   git tag v0.1.3
   git push origin main --tags
   ```
3. **Create GitHub Release** (as above)

## Release Checklist

Before creating a release, ensure:

- [ ] All tests pass: `npm test -- --run`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] CHANGELOG.md is updated (if you maintain one)
- [ ] Version number follows [Semantic Versioning](https://semver.org/)

## Version Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **PATCH** (0.1.2 → 0.1.3): Bug fixes, no breaking changes
- **MINOR** (0.1.2 → 0.2.0): New features, no breaking changes
- **MAJOR** (0.1.2 → 1.0.0): Breaking changes

## What Happens During Release

1. **CI Pipeline runs:**
   - Installs dependencies
   - Runs linter, type check, and tests
   - Builds the package
   - Verifies version consistency

2. **NPM Publishing:**
   - Publishes to NPM with public access
   - Uses the built artifacts from CI

3. **Demo Site Update:**
   - Automatically updates `docs/index.html` to use the new version
   - Commits the change back to the repository

4. **GitHub Integration:**
   - Adds a comment to the release with NPM details
   - Links to the published package

## Troubleshooting

### Version Mismatch Error
If you see a version mismatch error, ensure:
- The git tag matches the version in `package.json`
- Use `v` prefix for tags (e.g., `v0.1.3`)

### NPM Publish Failed
- Check that `NPM_TOKEN` is correctly set in GitHub secrets
- Verify you have publish permissions for the package
- Ensure the version doesn't already exist on NPM

### Demo Site Not Updated
- Check that the repository name matches in the workflow condition
- Verify GitHub token has write permissions to the repository

## Manual Hotfix Process

For urgent fixes that need to bypass the normal workflow:

```bash
# Make your fix
git add .
git commit -m "fix: urgent security fix"

# Increment patch version
npm version patch

# Build and test
npm run build
npm test -- --run

# Publish directly
npm publish

# Push changes and tags
git push origin main --tags
```

## Monitoring

After release:
- Check [NPM package page](https://www.npmjs.com/package/svg-toolbelt)
- Verify the demo site at https://zakariaf.github.io/svg-toolbelt
- Monitor for any issues in the GitHub repository
