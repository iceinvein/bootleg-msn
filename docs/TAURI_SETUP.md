# Tauri Desktop Application Setup Guide

This guide covers setting up the Tauri desktop application for Bootleg MSN Messenger, including development environment setup, building, and platform-specific requirements.

## Overview

The Tauri desktop application provides native functionality including:

- **Native Performance**: Rust-powered backend with WebView frontend
- **System Integration**: Notifications, system tray, file associations
- **Cross-Platform**: Windows, macOS, and Linux support
- **Security**: Sandboxed execution with capability-based permissions
- **Auto-Updates**: Seamless version management (desktop platforms only)

## Prerequisites

### Core Requirements

- **Rust** (latest stable version)
- **Node.js** (v18 or higher)
- **pnpm** (v10.14+ recommended) or npm
- **Tauri CLI** (installed automatically via npm scripts)

### Platform-Specific Dependencies

#### Windows
- **Microsoft C++ Build Tools** or Visual Studio with C++ support
- **WebView2** (usually pre-installed on Windows 10/11)

#### macOS
- **Xcode Command Line Tools**:
  ```bash
  xcode-select --install
  ```
- **macOS 10.13** or higher (as specified in tauri.conf.json)

#### Linux
- **Essential build tools**:
  ```bash
  # Ubuntu/Debian
  sudo apt update
  sudo apt install build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

  # Fedora
  sudo dnf install @development-tools openssl-devel gtk3-devel libappindicator-gtk3-devel librsvg2-devel

  # Arch Linux
  sudo pacman -S base-devel openssl gtk3 libappindicator-gtk3 librsvg
  ```

## Installation

### 1. Install Rust

```bash
# Install Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Verify installation
rustc --version
cargo --version
```

### 2. Clone and Setup Project

```bash
# Clone the repository
git clone <your-repo-url>
cd bootleg-msn

# Install Node.js dependencies
pnpm install

# Install Tauri CLI (if not already installed)
pnpm add -D @tauri-apps/cli
```

### 3. Verify Tauri Setup

```bash
# Check Tauri installation
pnpm tauri info

# This should show:
# - Rust version and toolchain
# - Node.js and package manager versions
# - Tauri CLI version
# - Platform-specific dependencies
```

## Development

### Starting Development Server

```bash
# Start Tauri development server (recommended)
pnpm dev:tauri

# This will:
# 1. Start the frontend dev server (Vite)
# 2. Start the Convex backend
# 3. Launch the Tauri desktop app
```

### Alternative Development Commands

```bash
# Start only frontend (for web development)
pnpm dev:frontend

# Start only backend
pnpm dev:backend

# Start web + backend (no Tauri)
pnpm dev
```

### Development Features

- **Hot Reload**: Frontend changes reload automatically
- **Rust Compilation**: Backend changes trigger Rust recompilation
- **DevTools**: Access browser DevTools in the desktop app
- **Console Logging**: Rust logs appear in terminal, frontend logs in DevTools

## Configuration

### Tauri Configuration (`src-tauri/tauri.conf.json`)

Key configuration sections:

```json
{
  "productName": "Bootleg MSN Messenger",
  "version": "0.3.1",
  "identifier": "com.msnmessenger.bootleg",
  "build": {
    "beforeDevCommand": "pnpm dev:frontend",
    "beforeBuildCommand": "pnpm build",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [{
      "title": "Bootleg MSN Messenger",
      "width": 1200,
      "height": 800,
      "minWidth": 800,
      "minHeight": 600,
      "resizable": true,
      "center": true
    }],
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; ...",
      "capabilities": ["main-capability"]
    }
  }
}
```

### Rust Dependencies (`src-tauri/Cargo.toml`)

```toml
[dependencies]
tauri = { version = "2.0", features = ["tray-icon", "image-png"] }
tauri-plugin-store = "2.0"
tauri-plugin-notification = "2.0"
tauri-plugin-fs = "2.0"
tauri-plugin-shell = "2.0"
tauri-plugin-opener = "2.0"
tauri-plugin-dialog = "2.0"
tauri-plugin-deep-link = "2.0"
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }
```

### Security Capabilities (`src-tauri/capabilities/main-capability.json`)

Defines permissions for the application:

```json
{
  "identifier": "main-capability",
  "permissions": [
    "core:default",
    "core:window:allow-create",
    "store:default",
    "notification:default",
    "fs:allow-read-text-file",
    "shell:allow-open",
    "dialog:allow-open",
    "updater:default"
  ]
}
```

## Environment Variables

Create `.env.local` in the project root:

```bash
# Convex Configuration
CONVEX_DEPLOYMENT=dev:your-deployment-name
VITE_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# Email Service (Optional)
CONVEX_RESEND_API_KEY=your-resend-api-key
CONVEX_SITE_URL=http://localhost:5173
```

## Building

### Development Build

```bash
# Build for current platform
pnpm build:tauri

# Output locations:
# - Windows: src-tauri/target/release/bundle/msi/
# - macOS: src-tauri/target/release/bundle/dmg/
# - Linux: src-tauri/target/release/bundle/deb/ or /appimage/
```

### Cross-Platform Building

```bash
# Windows (from any platform with cross-compilation setup)
pnpm tauri build --target x86_64-pc-windows-msvc

# macOS Intel
pnpm tauri build --target x86_64-apple-darwin

# macOS Apple Silicon
pnpm tauri build --target aarch64-apple-darwin

# Linux
pnpm tauri build --target x86_64-unknown-linux-gnu
```

## Troubleshooting

### Common Issues

1. **Rust not found**: Ensure Rust is installed and in PATH
2. **WebView2 missing (Windows)**: Install from Microsoft
3. **Build tools missing**: Install platform-specific dependencies
4. **Permission errors**: Check capabilities configuration

### Debug Mode

```bash
# Enable debug mode
TAURI_DEBUG=true pnpm dev:tauri

# This enables:
# - Detailed logging
# - Source maps
# - DevTools access
# - Unminified builds
```

### Logs and Debugging

- **Rust logs**: Appear in terminal during development
- **Frontend logs**: Available in browser DevTools
- **System logs**: Platform-specific locations (see TAURI_TROUBLESHOOTING.md)

## Next Steps

- See [TAURI_ARCHITECTURE.md](./TAURI_ARCHITECTURE.md) for system architecture details
- See [TAURI_API_REFERENCE.md](./TAURI_API_REFERENCE.md) for API documentation
- See [TAURI_DEPLOYMENT.md](./TAURI_DEPLOYMENT.md) for production deployment
- See [TAURI_TROUBLESHOOTING.md](./TAURI_TROUBLESHOOTING.md) for common issues
