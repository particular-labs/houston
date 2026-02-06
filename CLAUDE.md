# Houston - Project Context

## Build & Release

- **Package manager**: pnpm 10.14 (specified in `packageManager` field in package.json)
- **Tauri CLI**: Does NOT support `--no-notarization-wait` flag. Available build flags: `--target`, `--debug`, `--no-sign`, `--skip-stapling`, `--ci`, `--config`, `--features`, `--bundles`
- **Release workflow** (`release.yml`): Builds are triggered by `v*` tags or `workflow_dispatch`. Builds for both `aarch64-apple-darwin` (Apple Silicon) and `x86_64-apple-darwin` (Intel)
- **Signing**: Apple code signing uses Developer ID certificate imported from `APPLE_CERTIFICATE` secret. Notarization is handled in a separate step (not by Tauri) using `xcrun notarytool` with retry loop
- **Updater key**: Tauri updater signing key (`TAURI_SIGNING_PRIVATE_KEY`) requires `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` to be set explicitly — even empty passwords need the env var. Both stored in `prod` GitHub environment. Public key lives in `src-tauri/tauri.conf.json` under `plugins.updater.pubkey`
- **Tauri notarization behavior**: Tauri only attempts notarization when `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID` env vars are all set. Omitting them skips notarization (sign only)

## Apple Notarization (Jan-Feb 2026)

- Apple's notarization service has been unreliable since January 2, 2026 — HTTP 500 "UNEXPECTED_ERROR", submissions stuck "In Progress" for days
- System Status page shows "Operational" despite outages
- `xcrun altool` is dead (since 2023) — must use `xcrun notarytool`
- No alternative endpoints or self-hosted options exist
- Current strategy: retry loop (3 attempts, 10-min timeout each, 10-min delay between)
- Without stapled notarization ticket, macOS Gatekeeper blocks the app as "damaged" — `xattr -cr` does NOT reliably bypass this on recent macOS versions

## GitHub Pages

- Landing page served from `docs/` directory via GitHub Pages
- Deployed by `.github/workflows/pages.yml` on push to main
- Static HTML/CSS, no build step

## Design System

- **Background**: #1a1a27 (dark navy)
- **Primary accent**: #5b7cff (bright blue)
- **Foreground**: #f2f2f5 (near white)
- **Fonts**: Inter (sans), JetBrains Mono (mono)
- **Colors defined in**: `src/styles/globals.css` using OKLCH color space

## Release Process

### Version Locations (must all match)

| File | Field | Example |
|------|-------|---------|
| `package.json` | `"version"` | `"0.7.0"` |
| `src-tauri/tauri.conf.json` | `"version"` | `"0.7.0"` |
| `src-tauri/Cargo.toml` | `version` | `version = "0.7.0"` |

### Release Checklist

When releasing a new version (e.g., `0.7.0`):

#### 1. Add Changelog Entry

Edit `src/lib/changelogs.ts` and add a new entry **at the TOP** of the `changelogs` array:

```typescript
{
  version: "0.7.0",
  date: "YYYY-MM-DD",  // Today's date
  title: "Short Release Title",
  summary: "One sentence describing the main theme of this release.",
  highlights: [
    "First major feature or change",
    "Second notable improvement",
    "Third item users should know about",
  ],
  sections: [
    {
      title: "New Features",
      items: ["Feature 1", "Feature 2"],
    },
    {
      title: "Improvements",
      items: ["Improvement 1", "Improvement 2"],
    },
    {
      title: "Bug Fixes",
      items: ["Fixed X", "Fixed Y"],
    },
  ],
},
```

#### 2. Bump Version in All Files

Update version in all three locations:

```bash
# package.json - line 4
# src-tauri/tauri.conf.json - line 4
# src-tauri/Cargo.toml - line 3
```

#### 3. Update Cargo.lock

```bash
cd src-tauri && cargo check
```

#### 4. Commit Changes

```bash
git add -A
git commit -m "chore: bump version to 0.7.0"
```

#### 5. Create and Push Tag

```bash
git tag v0.7.0
git push origin main
git push origin v0.7.0
```

The GitHub Actions workflow (`release.yml`) will automatically:
- Build for Apple Silicon and Intel Macs
- Sign with Developer ID certificate
- Notarize with Apple (with retry loop)
- Create GitHub Release with assets
- Update the `latest.json` for auto-updater

### Post-Release

- Verify the GitHub Release was created with all assets
- Test auto-update from a previous version
- Update landing page (`docs/`) if needed with new screenshots
