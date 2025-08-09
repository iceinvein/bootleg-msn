# MSN Messenger - Tauri Desktop Application

This directory contains the Tauri configuration and Rust backend for the MSN Messenger desktop application.

## Overview

The Tauri desktop application provides native functionality including:

- **Window Management**: Create and manage multiple chat windows
- **System Tray Integration**: Minimize to system tray with unread message indicators
- **Native Notifications**: System-level notifications for new messages
- **File System Access**: Native file picker and drag-and-drop support
- **Window State Persistence**: Remember window positions and sizes
- **Deep Link Handling**: Support for `msn://` protocol links

## Architecture

### Rust Backend (`src/main.rs`)

The Rust backend handles:

- Window creation and management
- System tray functionality
- File system operations
- Native notifications
- Window state persistence
- Deep link processing

### Frontend Integration

The frontend integrates with Tauri through:

- `src/lib/tauri.ts` - Tauri API wrapper functions
- `src/hooks/useTauri.ts` - React hooks for Tauri functionality
- `src/components/TauriIntegration.tsx` - Main integration component
- `src/components/TauriMenu.tsx` - Native menu components

## Development

### Prerequisites

- Rust (latest stable)
- Node.js and pnpm
- Platform-specific dependencies:
  - **Windows**: Microsoft C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `build-essential`, `libwebkit2gtk-4.0-dev`, `libssl-dev`

### Development Commands

```bash
# Start Tauri development server
pnpm dev:tauri

# Build Tauri application
pnpm build:tauri

# Build for specific platform
pnpm tauri build --target x86_64-pc-windows-msvc  # Windows
pnpm tauri build --target x86_64-apple-darwin     # macOS Intel
pnpm tauri build --target aarch64-apple-darwin    # macOS Apple Silicon
pnpm tauri build --target x86_64-unknown-linux-gnu # Linux
```

### Configuration

The main configuration is in `tauri.conf.json`:

- **App Settings**: Window size, title, icon
- **Build Settings**: Frontend integration, build commands
- **Bundle Settings**: Platform-specific packaging options
- **Plugin Configuration**: Enabled Tauri plugins
- **Security Settings**: CSP and permission configuration

## Features

### Window Management

- **Main Window**: Primary messenger interface
- **Chat Windows**: Individual chat windows for conversations
- **Window Persistence**: Automatic saving/restoring of window states
- **Multi-monitor Support**: Proper positioning across multiple displays

### System Integration

- **System Tray**: Always-available tray icon with context menu
- **Notifications**: Native system notifications with click handling
- **File Operations**: Native file picker and drag-and-drop
- **Keyboard Shortcuts**: Global shortcuts for common actions

### Platform-Specific Features

- **Windows**: Taskbar integration, Windows notifications
- **macOS**: Dock integration, macOS notification center
- **Linux**: System tray, desktop notifications

## Security

The application follows Tauri security best practices:

- **Minimal Permissions**: Only required filesystem and notification permissions
- **CSP Configuration**: Content Security Policy for web content
- **Secure Communication**: All frontend-backend communication through Tauri's secure IPC
- **Sandboxing**: Proper application sandboxing on supported platforms

## Building for Distribution

### Icons

Place application icons in `src-tauri/icons/`:

- `32x32.png` - Small icon
- `128x128.png` - Standard icon
- `128x128@2x.png` - High-DPI icon
- `icon.icns` - macOS icon bundle
- `icon.ico` - Windows icon

### Code Signing

For distribution, configure code signing:

**macOS:**

```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name",
      "providerShortName": "YourTeam"
    }
  }
}
```

**Windows:**

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "your-certificate-thumbprint"
    }
  }
}
```

### App Store Distribution

The application is configured for distribution through:

- Microsoft Store (Windows)
- Mac App Store (macOS)
- Various Linux package managers

## Troubleshooting

### Common Issues

1. **Build Failures**: Ensure all platform dependencies are installed
2. **Permission Errors**: Check filesystem permissions in `tauri.conf.json`
3. **Icon Issues**: Verify all required icon sizes are present
4. **Notification Problems**: Check system notification permissions

### Debug Mode

Enable debug logging by setting environment variables:

```bash
RUST_LOG=debug pnpm dev:tauri
```

### Platform-Specific Debugging

- **Windows**: Use Windows Event Viewer for system-level errors
- **macOS**: Check Console.app for application logs
- **Linux**: Use `journalctl` for system logs

## Contributing

When modifying the Tauri backend:

1. Update Rust code in `src/main.rs`
2. Add corresponding TypeScript types in `src/lib/tauri.ts`
3. Update React hooks in `src/hooks/useTauri.ts`
4. Add tests for new functionality
5. Update this README with new features

## License

This Tauri application is part of the MSN Messenger project and follows the same license terms.
