# Tauri Troubleshooting Guide

Comprehensive troubleshooting guide for common issues, debugging techniques, and platform-specific problems with the Bootleg MSN Messenger Tauri desktop application.

## Table of Contents

- [Development Issues](#development-issues)
- [Build Problems](#build-problems)
- [Runtime Issues](#runtime-issues)
- [Platform-Specific Problems](#platform-specific-problems)
- [Debugging Techniques](#debugging-techniques)
- [Performance Issues](#performance-issues)

## Development Issues

### Tauri CLI Not Found

**Problem**: `tauri` command not recognized

**Solutions**:
```bash
# Install Tauri CLI globally
npm install -g @tauri-apps/cli

# Or use via pnpm
pnpm add -D @tauri-apps/cli
pnpm tauri --version

# Or use npx
npx tauri --version
```

### Rust Not Found

**Problem**: Rust compiler not available

**Solutions**:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Update Rust
rustup update

# Verify installation
rustc --version
cargo --version
```

### Frontend Not Starting

**Problem**: Vite dev server fails to start

**Solutions**:
```bash
# Check Node.js version (requires v18+)
node --version

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check for port conflicts
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# Start frontend separately
pnpm dev:frontend
```

### IPC Communication Errors

**Problem**: Frontend can't communicate with Rust backend

**Symptoms**:
- `invoke` calls fail
- Commands not found errors
- Timeout errors

**Solutions**:
```typescript
// Check if running in Tauri
import { isTauri } from '@/lib/tauri';

if (!isTauri()) {
  console.log('Not running in Tauri environment');
  return;
}

// Add error handling
try {
  await invoke('your_command');
} catch (error) {
  console.error('Command failed:', error);
}
```

## Build Problems

### Missing Build Dependencies

#### Windows
**Problem**: Build tools not found

**Solutions**:
```bash
# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/

# Or install via chocolatey
choco install visualstudio2022buildtools

# Install Windows SDK
choco install windows-sdk-10-version-2004-all
```

#### macOS
**Problem**: Xcode tools missing

**Solutions**:
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Verify installation
xcode-select -p

# Update if needed
sudo xcode-select --reset
```

#### Linux
**Problem**: System libraries missing

**Solutions**:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora
sudo dnf groupinstall "Development Tools"
sudo dnf install openssl-devel gtk3-devel libappindicator-gtk3-devel librsvg2-devel

# Arch Linux
sudo pacman -S base-devel openssl gtk3 libappindicator-gtk3 librsvg
```

### Rust Compilation Errors

**Problem**: Cargo build fails

**Common Solutions**:
```bash
# Clean build cache
cargo clean
rm -rf target/

# Update Rust toolchain
rustup update

# Check for conflicting dependencies
cargo tree --duplicates

# Build with verbose output
cargo build --verbose
```

### WebView2 Issues (Windows)

**Problem**: WebView2 not found

**Solutions**:
```bash
# Download and install WebView2 Runtime
# From: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

# Check if installed
reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
```

## Runtime Issues

### Application Won't Start

**Problem**: App crashes on startup

**Debugging Steps**:
```bash
# Run with debug logging
RUST_LOG=debug ./your-app

# Check system logs
# Windows: Event Viewer
# macOS: Console.app
# Linux: journalctl -f
```

### Window Management Issues

**Problem**: Windows not appearing or positioning incorrectly

**Solutions**:
```typescript
// Reset window state
await tauriApi.saveWindowState('main', {
  width: 1200,
  height: 800,
  x: undefined,
  y: undefined,
  maximized: false,
  minimized: false
});

// Force window to center
const window = getCurrentWindow();
await window.center();
```

### System Tray Not Working

**Problem**: System tray icon not appearing

**Platform-Specific Solutions**:

**Windows**:
```rust
// Ensure proper icon format (ICO)
// Check Windows notification area settings
```

**macOS**:
```rust
// Verify entitlements.plist permissions
// Check macOS privacy settings
```

**Linux**:
```bash
# Install system tray support
sudo apt install libayatana-appindicator3-1

# Check desktop environment support
echo $XDG_CURRENT_DESKTOP
```

### Notification Issues

**Problem**: Notifications not appearing

**Solutions**:
```typescript
// Check permissions
const permission = await checkNotificationPermission();
if (permission !== 'granted') {
  await requestNotificationPermission();
}

// Test notification
await showNotification({
  id: 'test',
  title: 'Test Notification',
  body: 'This is a test',
  notificationType: 'message',
  timestamp: Date.now()
});
```

**Platform Settings**:
- **Windows**: Check Windows notification settings
- **macOS**: System Preferences > Notifications
- **Linux**: Check desktop environment notification settings

## Platform-Specific Problems

### Windows Issues

#### Code Signing Errors
```bash
# Check certificate
certutil -dump certificate.pfx

# Verify thumbprint
Get-ChildItem -Path Cert:\CurrentUser\My

# Test signing
signtool sign /sha1 THUMBPRINT /t http://timestamp.digicert.com file.exe
```

#### MSI Installation Issues
```bash
# Enable MSI logging
msiexec /i app.msi /l*v install.log

# Check Windows Installer service
sc query msiserver
```

### macOS Issues

#### Notarization Problems
```bash
# Check notarization status
xcrun altool --notarization-info REQUEST_ID -u "apple-id@example.com"

# Staple notarization
xcrun stapler staple "App.app"

# Verify notarization
spctl -a -vvv -t install "App.app"
```

#### Gatekeeper Issues
```bash
# Remove quarantine attribute
xattr -rd com.apple.quarantine "App.app"

# Check Gatekeeper status
spctl --status

# Allow app through Gatekeeper
sudo spctl --add "App.app"
```

### Linux Issues

#### AppImage Problems
```bash
# Make AppImage executable
chmod +x app.AppImage

# Check FUSE support
fusermount --version

# Install FUSE if missing
sudo apt install fuse libfuse2
```

#### Desktop Integration
```bash
# Install desktop file
cp app.desktop ~/.local/share/applications/

# Update desktop database
update-desktop-database ~/.local/share/applications/

# Check MIME associations
xdg-mime query default application/x-msn-messenger
```

## Debugging Techniques

### Enable Debug Mode

```bash
# Development
TAURI_DEBUG=true pnpm dev:tauri

# Production debugging
RUST_LOG=debug ./app
```

### Browser DevTools

```typescript
// Open DevTools programmatically
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

const webview = getCurrentWebviewWindow();
await webview.openDevtools();
```

### Rust Debugging

```rust
// Add debug logging
use log::{debug, info, warn, error};

#[tauri::command]
async fn debug_command() -> Result<String, String> {
    debug!("Debug command called");
    info!("Processing request");
    
    match some_operation().await {
        Ok(result) => {
            info!("Operation successful: {:?}", result);
            Ok(result)
        }
        Err(e) => {
            error!("Operation failed: {:?}", e);
            Err(format!("Error: {}", e))
        }
    }
}
```

### Network Debugging

```bash
# Check network connectivity
curl -v https://your-api-endpoint.com

# Monitor network requests
# Use browser DevTools Network tab
# Or system tools like Wireshark
```

### File System Debugging

```rust
// Check file permissions
use std::fs;

#[tauri::command]
async fn debug_file_access(path: String) -> Result<String, String> {
    match fs::metadata(&path) {
        Ok(metadata) => {
            Ok(format!("File exists, size: {}", metadata.len()))
        }
        Err(e) => {
            Err(format!("File access error: {}", e))
        }
    }
}
```

## Performance Issues

### Slow Startup

**Causes and Solutions**:

1. **Large Bundle Size**:
   ```bash
   # Analyze bundle size
   pnpm build:tauri --verbose
   
   # Optimize assets
   # Compress images
   # Remove unused dependencies
   ```

2. **Synchronous Operations**:
   ```rust
   // Use async operations
   #[tauri::command]
   async fn optimized_command() -> Result<String, String> {
       tokio::spawn(async {
           // Heavy operation
       }).await.map_err(|e| e.to_string())?
   }
   ```

### Memory Leaks

**Detection**:
```typescript
// Monitor memory usage
const memoryInfo = (performance as any).memory;
console.log('Used:', memoryInfo.usedJSHeapSize);
console.log('Total:', memoryInfo.totalJSHeapSize);
```

**Prevention**:
```typescript
// Clean up event listeners
useEffect(() => {
  const unlisten = tauriEvents.onWindowClose(() => {
    // Handle close
  });
  
  return () => {
    unlisten.then(fn => fn());
  };
}, []);
```

### High CPU Usage

**Debugging**:
```bash
# Profile Rust code
cargo build --release
perf record ./target/release/app
perf report

# Profile frontend
# Use browser DevTools Performance tab
```

## Log Files and Diagnostics

### Log Locations

**Windows**:
- Application logs: `%APPDATA%\com.msnmessenger.bootleg\logs\`
- System logs: Event Viewer

**macOS**:
- Application logs: `~/Library/Logs/com.msnmessenger.bootleg/`
- System logs: Console.app

**Linux**:
- Application logs: `~/.local/share/com.msnmessenger.bootleg/logs/`
- System logs: `journalctl -u your-app`

### Diagnostic Commands

```bash
# System information
pnpm tauri info

# Check dependencies
cargo tree

# Verify configuration
cat src-tauri/tauri.conf.json | jq .

# Test IPC
pnpm tauri dev --verbose
```

## Getting Help

### Community Resources

- **Tauri Discord**: https://discord.gg/tauri
- **GitHub Issues**: https://github.com/tauri-apps/tauri/issues
- **Stack Overflow**: Tag questions with `tauri`

### Reporting Issues

When reporting issues, include:

1. **System Information**:
   ```bash
   pnpm tauri info
   ```

2. **Error Messages**: Full error output with stack traces

3. **Reproduction Steps**: Minimal example to reproduce the issue

4. **Configuration**: Relevant parts of `tauri.conf.json`

5. **Logs**: Application and system logs

### Creating Minimal Reproduction

```bash
# Create new Tauri project
npm create tauri-app@latest

# Add minimal code to reproduce issue
# Share repository or code snippet
```

## Next Steps

- See [TAURI_SETUP.md](./TAURI_SETUP.md) for initial setup
- See [TAURI_ARCHITECTURE.md](./TAURI_ARCHITECTURE.md) for system understanding
- See [TAURI_API_REFERENCE.md](./TAURI_API_REFERENCE.md) for API details
- See [TAURI_DEPLOYMENT.md](./TAURI_DEPLOYMENT.md) for build and deployment
