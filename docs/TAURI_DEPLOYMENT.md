# Tauri Deployment Guide

Comprehensive guide for building, packaging, code signing, and distributing the Bootleg MSN Messenger desktop application across Windows, macOS, and Linux platforms.

## Table of Contents

- [Build Process](#build-process)
- [Platform-Specific Builds](#platform-specific-builds)
- [Code Signing](#code-signing)
- [Auto-Updater Setup](#auto-updater-setup)
- [Distribution](#distribution)
- [CI/CD Integration](#cicd-integration)

## Build Process

### Development Build

```bash
# Build for current platform
pnpm build:tauri

# With debug information
TAURI_DEBUG=true pnpm build:tauri
```

### Production Build

```bash
# Clean build for production
pnpm build          # Build frontend
pnpm build:tauri    # Build Tauri app
```

**Build Output Locations:**
- **Windows**: `src-tauri/target/release/bundle/msi/`
- **macOS**: `src-tauri/target/release/bundle/dmg/`
- **Linux**: `src-tauri/target/release/bundle/deb/` or `/appimage/`

### Build Configuration

The build process is configured in `src-tauri/tauri.conf.json`:

```json
{
  "build": {
    "beforeDevCommand": "pnpm dev:frontend",
    "beforeBuildCommand": "pnpm build",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "resources": [],
    "externalBin": [],
    "copyright": "© 2025 Puzzles",
    "category": "SocialNetworking",
    "shortDescription": "Modern recreation of MSN Messenger",
    "longDescription": "Bootleg MSN Messenger is a modern recreation of the classic MSN Messenger experience, built with cutting-edge web technologies."
  }
}
```

## Platform-Specific Builds

### Windows

#### Prerequisites
- **Visual Studio Build Tools** or **Visual Studio Community**
- **Windows SDK**
- **WiX Toolset** (for MSI installer)

#### Build Commands
```bash
# Build for Windows (from any platform with cross-compilation)
pnpm tauri build --target x86_64-pc-windows-msvc

# Build for Windows ARM64
pnpm tauri build --target aarch64-pc-windows-msvc
```

#### Windows Configuration
```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "",
      "tsp": false,
      "wix": {
        "language": "en-US",
        "template": "main.wxs"
      }
    }
  }
}
```

#### Output Files
- `*.msi` - Windows Installer package
- `*.exe` - Standalone executable

### macOS

#### Prerequisites
- **Xcode Command Line Tools**
- **Apple Developer Account** (for code signing and notarization)
- **macOS 10.13+** minimum target

#### Build Commands
```bash
# Build for macOS Intel
pnpm tauri build --target x86_64-apple-darwin

# Build for macOS Apple Silicon
pnpm tauri build --target aarch64-apple-darwin

# Universal binary (both architectures)
pnpm tauri build --target universal-apple-darwin
```

#### macOS Configuration
```json
{
  "bundle": {
    "macOS": {
      "frameworks": [],
      "minimumSystemVersion": "10.13",
      "exceptionDomain": "",
      "signingIdentity": null,
      "providerShortName": null,
      "entitlements": "entitlements.plist"
    }
  }
}
```

#### Output Files
- `*.dmg` - Disk image for distribution
- `*.app` - Application bundle

### Linux

#### Prerequisites
```bash
# Ubuntu/Debian
sudo apt install build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora
sudo dnf install @development-tools openssl-devel gtk3-devel libappindicator-gtk3-devel librsvg2-devel

# Arch Linux
sudo pacman -S base-devel openssl gtk3 libappindicator-gtk3 librsvg
```

#### Build Commands
```bash
# Build for Linux x86_64
pnpm tauri build --target x86_64-unknown-linux-gnu

# Build for Linux ARM64
pnpm tauri build --target aarch64-unknown-linux-gnu
```

#### Linux Configuration
```json
{
  "bundle": {
    "linux": {
      "deb": {
        "depends": [
          "libwebkit2gtk-4.0-37",
          "libgtk-3-0",
          "libayatana-appindicator3-1"
        ]
      }
    }
  }
}
```

#### Output Files
- `*.deb` - Debian package
- `*.AppImage` - Portable application
- `*.rpm` - Red Hat package (if configured)

## Code Signing

### Windows Code Signing

#### Certificate Setup
```bash
# Using a PFX certificate
$env:TAURI_PRIVATE_KEY = "path/to/certificate.pfx"
$env:TAURI_KEY_PASSWORD = "certificate_password"

# Using Windows Certificate Store
$env:WINDOWS_CERTIFICATE_THUMBPRINT = "certificate_thumbprint"
```

#### Configuration
```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERTIFICATE_THUMBPRINT",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

### macOS Code Signing and Notarization

#### Certificate Setup
```bash
# Set signing identity
export APPLE_CERTIFICATE = "Developer ID Application: Your Name (TEAM_ID)"
export APPLE_CERTIFICATE_PASSWORD = "certificate_password"

# Notarization credentials
export APPLE_ID = "your-apple-id@example.com"
export APPLE_PASSWORD = "app-specific-password"
export APPLE_TEAM_ID = "YOUR_TEAM_ID"
```

#### Configuration
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
      "providerShortName": "YOUR_TEAM_ID",
      "entitlements": "entitlements.plist"
    }
  }
}
```

#### Entitlements (`src-tauri/entitlements.plist`)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.personal-information.notifications</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
</dict>
</plist>
```

## Auto-Updater Setup

### Configuration

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://your-update-server.com/{{target}}/{{arch}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

### Update Server Setup

#### Update Manifest Format
```json
{
  "version": "0.3.2",
  "notes": "Bug fixes and performance improvements",
  "pub_date": "2025-01-19T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "signature_here",
      "url": "https://releases.example.com/app-0.3.2-x64.msi"
    },
    "darwin-x86_64": {
      "signature": "signature_here", 
      "url": "https://releases.example.com/app-0.3.2-x64.dmg"
    },
    "linux-x86_64": {
      "signature": "signature_here",
      "url": "https://releases.example.com/app-0.3.2-amd64.AppImage"
    }
  }
}
```

### Signing Updates

```bash
# Generate key pair
tauri signer generate -w ~/.tauri/myapp.key

# Sign update file
tauri signer sign -k ~/.tauri/myapp.key /path/to/app.tar.gz
```

## Distribution

### Windows Distribution

#### Microsoft Store
1. **Package for Store**: Use MSIX packaging
2. **Store Submission**: Upload through Partner Center
3. **Certification**: Microsoft certification process

#### Direct Distribution
- **Website Download**: Host MSI files
- **Package Managers**: Chocolatey, Scoop, winget

### macOS Distribution

#### Mac App Store
1. **App Store Connect**: Upload signed app
2. **Review Process**: Apple review and approval
3. **Distribution**: Automatic through App Store

#### Direct Distribution
- **Website Download**: Host DMG files
- **Package Managers**: Homebrew Cask

### Linux Distribution

#### Package Repositories
```bash
# Add to Ubuntu PPA
sudo add-apt-repository ppa:your-ppa/bootleg-msn
sudo apt update
sudo apt install bootleg-msn-messenger

# Flatpak distribution
flatpak install flathub com.msnmessenger.bootleg

# Snap distribution
sudo snap install bootleg-msn-messenger
```

#### Direct Distribution
- **Website Download**: Host AppImage, DEB, RPM files
- **Package Managers**: AUR (Arch), various distro repos

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-20.04, windows-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        
      - name: Install dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-20.04'
        run: |
          sudo apt update
          sudo apt install -y libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev
          
      - name: Install frontend dependencies
        run: pnpm install
        
      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: app-v__VERSION__
          releaseName: 'App v__VERSION__'
          releaseBody: 'See the assets to download this version and install.'
          releaseDraft: true
          prerelease: false
```

### Environment Variables for CI

```bash
# Code signing
APPLE_CERTIFICATE
APPLE_CERTIFICATE_PASSWORD
APPLE_ID
APPLE_PASSWORD
APPLE_TEAM_ID
WINDOWS_CERTIFICATE_THUMBPRINT

# Update server
TAURI_PRIVATE_KEY
TAURI_KEY_PASSWORD
UPDATE_SERVER_URL
```

## Version Management

### Automated Version Bumping

The project includes automatic version management:

```bash
# Manual version bumps
pnpm version:patch  # 0.3.1 -> 0.3.2
pnpm version:minor  # 0.3.1 -> 0.4.0
pnpm version:major  # 0.3.1 -> 1.0.0
```

### Sync Versions

Ensure versions are synchronized across:
- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

## Security Considerations

### Build Security
- **Reproducible Builds**: Use locked dependency versions
- **Supply Chain**: Verify all dependencies
- **Code Signing**: Always sign production releases
- **Update Security**: Use signed updates with public key verification

### Distribution Security
- **HTTPS Only**: Serve all downloads over HTTPS
- **Checksums**: Provide SHA256 checksums for verification
- **GPG Signatures**: Additional signature verification

## Troubleshooting

### Common Build Issues

1. **Missing Dependencies**: Install platform-specific build tools
2. **Code Signing Failures**: Verify certificate configuration
3. **Cross-compilation Issues**: Use appropriate Rust targets
4. **Bundle Size**: Optimize assets and dependencies

### Debug Build Issues

```bash
# Enable verbose logging
RUST_LOG=debug pnpm build:tauri

# Check build configuration
pnpm tauri info

# Validate bundle
pnpm tauri build --debug
```

## Next Steps

- See [TAURI_SETUP.md](./TAURI_SETUP.md) for development setup
- See [TAURI_ARCHITECTURE.md](./TAURI_ARCHITECTURE.md) for system architecture
- See [TAURI_API_REFERENCE.md](./TAURI_API_REFERENCE.md) for API documentation
- See [TAURI_TROUBLESHOOTING.md](./TAURI_TROUBLESHOOTING.md) for debugging help
