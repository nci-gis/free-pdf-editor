# Release Guide

This guide explains how to create a new release for the Free PDF Editor.

## Prerequisites

- Commit access to the repository
- All changes merged to `main` branch
- Tests passing (if any)
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) format for changelog generation

## Release Process

### 1. Prepare the Release

```bash
# Make sure you're on the latest main branch
git checkout main
git pull origin main
```

### 2. Update Version

Edit `package.json` and update the version number:

```json
{
  "version": "1.0.0"  // Update this
}
```

### 3. Commit Version Bump

```bash
git add package.json
git commit -m "chore: bump version to v1.0.0"
git push origin main
```

### 4. Create and Push Tag

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release v1.0.0"

# Push tag to GitHub
git push origin v1.0.0
```

### 5. Wait for Automation

The release workflow will automatically:

1. ✅ Trigger on the new tag
2. ✅ Install dependencies and build the project
3. ✅ Create a ZIP file: `free-pdf-editor-v1.0.0.zip`
4. ✅ Generate changelog with **git-cliff** from conventional commits
5. ✅ Update `CHANGELOG.md` and commit back to main
6. ✅ Create release notes combining instructions + changelog
7. ✅ Publish GitHub Release with ZIP and CHANGELOG attached

Check the [Actions tab](../../actions) to monitor progress.

### 6. Verify Release

Once the workflow completes:

1. Go to the [Releases page](../../releases)
2. Verify the new release appears
3. Download the ZIP file
4. Test by extracting and opening `index.html`

## Versioning Convention

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (v2.0.0): Breaking changes
- **MINOR** (v1.1.0): New features, backward compatible
- **PATCH** (v1.0.1): Bug fixes, backward compatible

## Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) for automatic changelog generation:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Common Types

- `feat:` - New feature (→ "Features" in changelog)
- `fix:` - Bug fix (→ "Bug Fixes" in changelog)
- `docs:` - Documentation changes (→ "Documentation")
- `style:` - Code style/formatting (→ "Styling")
- `refactor:` - Code refactoring (→ "Refactor")
- `perf:` - Performance improvements (→ "Performance")
- `test:` - Test changes (→ "Testing")
- `chore:` - Maintenance tasks (→ "Miscellaneous Tasks")
- `ci:` - CI/CD changes (→ "Miscellaneous Tasks")

### Examples

```text
feat: add dark mode toggle
fix: resolve PDF rendering issue on Safari
docs: update installation instructions
perf: optimize text extraction algorithm
```

### Breaking Changes

Add `BREAKING CHANGE:` in footer or `!` after type:

```text
feat!: redesign annotation API

BREAKING CHANGE: The annotation API has been completely redesigned.
Old annotations will need to be migrated.
```

## Testing a Release Workflow

To test the release workflow without creating a public release:

1. Create a test tag locally:

   ```bash
   git tag v0.0.1-test
   git push origin v0.0.1-test
   ```

2. Monitor the workflow in the Actions tab
3. Delete the test release and tag after verification:

   ```bash
   # Delete remote tag
   git push --delete origin v0.0.1-test

   # Delete local tag
   git tag -d v0.0.1-test
   ```

## Troubleshooting

### Release Failed

1. Check the [Actions tab](../../actions) for error logs
2. Common issues:
   - Build failures: Check `pnpm build` locally
   - Permission errors: Ensure workflow has `contents: write` permission
   - Missing dependencies: Verify `pnpm-lock.yaml` is up to date

### Need to Fix a Release

1. Delete the bad release on GitHub (UI)
2. Delete the tag:

   ```bash
   git tag -d v1.0.0
   git push --delete origin v1.0.0
   ```

3. Fix the issues
4. Create the tag again (same version)

## Manual Release (Fallback)

If the automated workflow fails, create a release manually:

```bash
# Build locally
pnpm install
pnpm build

# Create ZIP
cd public
zip -r ../free-pdf-editor-v1.0.0.zip .
cd ..

# Upload to GitHub Releases manually via UI
```

---

**Need help?** Open an issue or check the [workflow file](workflows/release.yml).
