# Houston - Release & Signing Setup

Everything below requires an active **Apple Developer Program** membership ($99/year).
Enrollment: https://developer.apple.com/programs/enroll/

---

## What's already done

- [x] Updater signing keypair generated (`~/.tauri/houston.key` + `.pub`)
- [x] `tauri-plugin-updater` and `tauri-plugin-process` installed
- [x] `tauri.conf.json` configured with public key and GitHub Releases endpoint
- [x] Update check UI added to Settings page
- [x] GitHub Actions release workflow created (`.github/workflows/release.yml`)
- [x] Capabilities configured (`updater:default`, `process:allow-restart`)

---

## What you need to do once your developer account is approved

### 1. Create a Developer ID Application certificate

1. Open **Xcode** > Settings > Accounts > sign in with your Apple ID
2. Go to **Manage Certificates** > click **+** > **Developer ID Application**
3. Verify it installed in Keychain:
   ```bash
   security find-identity -v -p codesigning
   ```
   You'll see: `"Developer ID Application: Lennick Velez (XXXXXXXXXX)"`

4. Note the full identity string -- you'll need it for the `APPLE_SIGNING_IDENTITY` secret.

### 2. Find your Team ID

1. Go to https://developer.apple.com/account/#/membership
2. Copy the **Team ID** (10-character string)

### 3. Create an app-specific password

1. Go to https://appleid.apple.com > Sign-In and Security > App-Specific Passwords
2. Generate one, label it `Houston Notarization`
3. Save the password (`xxxx-xxxx-xxxx-xxxx`)

### 4. Export certificate as .p12 for CI

1. Open **Keychain Access**
2. Find your "Developer ID Application" certificate
3. Right-click > **Export** > save as `.p12` with a strong password
4. Base64-encode it:
   ```bash
   base64 -i ~/Desktop/certificate.p12 | pbcopy
   ```
   This copies the encoded string to your clipboard.

### 5. Back up your updater private key

The updater private key at `~/.tauri/houston.key` is critical. If lost, existing installs
can never receive updates. Back it up:

```bash
# Copy the key content (you'll also need this for GitHub Secrets)
cat ~/.tauri/houston.key
```

Store a backup in a password manager or secure vault.

### 6. Add GitHub Secrets

Go to https://github.com/vehler/houston/settings/secrets/actions and add these secrets:

| Secret | Value |
|--------|-------|
| `APPLE_SIGNING_IDENTITY` | `Developer ID Application: Lennick Velez (TEAM_ID)` |
| `APPLE_CERTIFICATE` | Base64-encoded `.p12` from step 4 |
| `APPLE_CERTIFICATE_PASSWORD` | Password you set when exporting the `.p12` |
| `APPLE_ID` | Your Apple ID email |
| `APPLE_PASSWORD` | App-specific password from step 3 |
| `APPLE_TEAM_ID` | 10-character Team ID from step 2 |
| `TAURI_SIGNING_PRIVATE_KEY` | Contents of `~/.tauri/houston.key` |

### 7. Enable GitHub Actions permissions

1. Go to https://github.com/vehler/houston/settings/actions
2. Under **Workflow permissions**, select **Read and write permissions**
3. Save

### 8. Set local environment variables (optional, for local signed builds)

Add to `~/.zshrc`:

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Lennick Velez (TEAM_ID)"
export APPLE_ID="your.email@example.com"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"
export TAURI_SIGNING_PRIVATE_KEY_PATH="$HOME/.tauri/houston.key"
```

Then `source ~/.zshrc`.

---

## How to release a new version

1. Bump version in `src-tauri/tauri.conf.json`:
   ```json
   "version": "0.2.0"
   ```

2. Commit and tag:
   ```bash
   git add -A && git commit -m "Release v0.2.0"
   git tag v0.2.0
   git push && git push --tags
   ```

3. The GitHub Action triggers automatically on the tag push. It will:
   - Build for both Apple Silicon and Intel
   - Code sign with your Developer ID certificate
   - Notarize with Apple
   - Generate `latest.json` for the updater
   - Create a **draft** GitHub Release

4. Go to https://github.com/vehler/houston/releases
5. Review the draft, edit release notes if needed
6. Click **Publish release**

7. Existing installs will see the update in Settings > Check for Updates.

---

## iOS (later)

The same Apple Developer account covers iOS. When ready:

```bash
# Add iOS Rust targets
rustup target add aarch64-apple-ios aarch64-apple-ios-sim

# Initialize iOS project
pnpm tauri ios init

# Run on simulator
pnpm tauri ios dev

# Build for device
pnpm tauri ios build
```

Xcode handles provisioning automatically with your developer account.
TestFlight can be used for beta distribution to testers.
