# Tauri Desktop Application Documentation

Complete documentation for the Bootleg MSN Messenger Tauri desktop application - a modern recreation of the classic MSN Messenger experience with native desktop integration.

## 🚀 Quick Start

New to Tauri development? Start here:

1. **[Setup Guide](./TAURI_SETUP.md)** - Get your development environment ready
2. **[Architecture Overview](./TAURI_ARCHITECTURE.md)** - Understand the system design
3. **[API Reference](./TAURI_API_REFERENCE.md)** - Learn the available APIs
4. **[Deployment Guide](./TAURI_DEPLOYMENT.md)** - Build and distribute your app

## 📖 Documentation Overview

### 🛠️ Development

- **[TAURI_SETUP.md](./TAURI_SETUP.md)**
  - Prerequisites and installation
  - Development environment setup
  - Configuration and environment variables
  - Development commands and workflows

### 🏗️ Architecture

- **[TAURI_ARCHITECTURE.md](./TAURI_ARCHITECTURE.md)**
  - System architecture overview
  - Plugin system and integrations
  - Security model and capabilities
  - Window management and system tray
  - Performance considerations

### 📚 API Documentation

- **[TAURI_API_REFERENCE.md](./TAURI_API_REFERENCE.md)**
  - Complete Rust command reference
  - TypeScript API wrappers
  - React hooks documentation
  - Component integration patterns
  - Event system and types

### 🚀 Deployment

- **[TAURI_DEPLOYMENT.md](./TAURI_DEPLOYMENT.md)**
  - Build process and configuration
  - Platform-specific builds (Windows, macOS, Linux)
  - Code signing and notarization
  - Auto-updater setup
  - Distribution strategies

### 🔧 Troubleshooting

- **[TAURI_TROUBLESHOOTING.md](./TAURI_TROUBLESHOOTING.md)**
  - Common development issues
  - Build and runtime problems
  - Platform-specific troubleshooting
  - Debugging techniques
  - Performance optimization

## 🎯 Key Features

### Native Desktop Integration

- **System Tray**: Minimize to system tray with unread message badges
- **Native Notifications**: Platform-native notifications with click handling
- **Multi-Window Support**: Create separate chat windows with persistent state
- **File System Access**: Native file picker and drag-and-drop support
- **Deep Link Handling**: Support for `msn-messenger://` protocol URLs

### Cross-Platform Support

- **Windows**: MSI installer, system tray, native notifications
- **macOS**: DMG distribution, dock integration, notarization support
- **Linux**: AppImage/DEB packages, desktop integration

### Security & Performance

- **Capability-Based Security**: Fine-grained permission system
- **Rust Backend**: Zero-cost abstractions and memory safety
- **WebView Frontend**: Lightweight and efficient UI rendering
- **Auto-Updates**: Secure, signed updates with rollback support

## 🔄 Development Workflow

### 1. Initial Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev:tauri
```

### 2. Development Cycle
```bash
# Frontend changes: Hot reload automatically
# Rust changes: Automatic recompilation

# Debug mode
TAURI_DEBUG=true pnpm dev:tauri
```

### 3. Testing
```bash
# Run tests
pnpm test

# Test Tauri integration
pnpm test src/components/TauriIntegration.test.tsx
```

### 4. Building
```bash
# Development build
pnpm build:tauri

# Production build with optimizations
pnpm build && pnpm build:tauri
```

## 🏛️ Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                    Desktop Application                       │
├─────────────────────────────────────────────────────────────┤
│  React Frontend (TypeScript)                               │
│  ├── TauriIntegration.tsx                                  │
│  ├── useTauri.ts hooks                                     │
│  └── tauri.ts API wrappers                                 │
├─────────────────────────────────────────────────────────────┤
│  Tauri IPC Bridge                                          │
├─────────────────────────────────────────────────────────────┤
│  Rust Backend                                              │
│  ├── Window Management                                      │
│  ├── System Tray                                          │
│  ├── Notifications                                        │
│  ├── File System                                          │
│  └── Plugin Integrations                                  │
├─────────────────────────────────────────────────────────────┤
│  Operating System APIs                                     │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 Plugin Ecosystem

The application uses Tauri's modern plugin architecture:

| Plugin | Purpose | Documentation |
|--------|---------|---------------|
| `store` | Persistent storage | [API Reference](./TAURI_API_REFERENCE.md#settings-and-storage) |
| `notification` | Native notifications | [API Reference](./TAURI_API_REFERENCE.md#notification-system) |
| `fs` | File system operations | [Architecture](./TAURI_ARCHITECTURE.md#plugin-architecture) |
| `shell` | Shell command execution | [Architecture](./TAURI_ARCHITECTURE.md#plugin-architecture) |
| `opener` | Open URLs/files | [Architecture](./TAURI_ARCHITECTURE.md#plugin-architecture) |
| `dialog` | Native dialogs | [Architecture](./TAURI_ARCHITECTURE.md#plugin-architecture) |
| `deep-link` | Protocol handling | [Architecture](./TAURI_ARCHITECTURE.md#deep-link-system) |
| `updater` | Auto-updates | [Deployment](./TAURI_DEPLOYMENT.md#auto-updater-setup) |

## 🛡️ Security Model

Tauri v2 uses a capability-based security system:

- **Sandboxed Execution**: App runs in a secure sandbox
- **Explicit Permissions**: Each API requires explicit permission
- **CSP Protection**: Content Security Policy prevents XSS
- **Code Signing**: All production builds are signed
- **Update Security**: Updates are cryptographically signed

See [Security Model](./TAURI_ARCHITECTURE.md#security-model) for details.

## 🎨 Frontend Integration

### React Hooks

```typescript
import { useTauri, useWindowState, useSystemTray } from '@/hooks/useTauri';

function MyComponent() {
  const { isTauri, platform } = useTauri();
  const { saveState } = useWindowState('main');
  const { minimizeToTray } = useSystemTray();
  
  // Component logic
}
```

### API Wrappers

```typescript
import { tauriApi } from '@/lib/tauri';

// Create new chat window
await tauriApi.createChatWindow('chat123', 'John Doe');

// Update system tray badge
await tauriApi.updateUnreadCount(5);
```

## 🚀 Deployment Targets

### Supported Platforms

- **Windows**: x86_64, ARM64
- **macOS**: Intel (x86_64), Apple Silicon (ARM64), Universal
- **Linux**: x86_64, ARM64

### Distribution Methods

- **Direct Download**: DMG, MSI, AppImage files
- **Package Managers**: Homebrew, Chocolatey, APT, etc.
- **App Stores**: Microsoft Store, Mac App Store (with additional setup)

## 📊 Performance Characteristics

- **Memory Usage**: ~50-100MB (depending on chat history)
- **Startup Time**: ~1-2 seconds cold start
- **CPU Usage**: <1% idle, <5% active messaging
- **Bundle Size**: ~15-25MB (platform-specific)

## 🤝 Contributing

### Development Guidelines

1. **Follow Rust best practices** for backend code
2. **Use TypeScript strictly** for frontend integration
3. **Test both Tauri and web environments**
4. **Document new APIs** in the appropriate files
5. **Update security capabilities** when adding new features

### Testing Strategy

- **Unit Tests**: Rust (`cargo test`) and TypeScript (Vitest)
- **Integration Tests**: Tauri WebDriver for E2E testing
- **Platform Testing**: Automated testing on Windows, macOS, Linux

## 📞 Support

### Getting Help

1. **Check Documentation**: Start with these docs
2. **Search Issues**: Look for similar problems in GitHub issues
3. **Community**: Join the Tauri Discord for community support
4. **Create Issue**: Report bugs with detailed reproduction steps

### Useful Resources

- **Tauri Documentation**: https://tauri.app/
- **Tauri Discord**: https://discord.gg/tauri
- **Rust Documentation**: https://doc.rust-lang.org/
- **React Documentation**: https://react.dev/

## 🗺️ Roadmap

### Planned Features

- **Multi-Account Support**: Handle multiple MSN accounts
- **Plugin System**: Custom plugin architecture for extensions
- **Advanced Notifications**: Rich notifications with actions
- **Accessibility**: Enhanced screen reader and keyboard support
- **Performance**: Further optimization and memory reduction

### Version History

- **v0.3.1**: Current version with core desktop features
- **v0.4.0**: Planned - Enhanced notifications and multi-window improvements
- **v0.5.0**: Planned - Plugin system and advanced integrations

---

## 📝 Quick Reference

### Essential Commands

```bash
# Development
pnpm dev:tauri              # Start development server
pnpm build:tauri            # Build for current platform
TAURI_DEBUG=true pnpm dev:tauri  # Debug mode

# Information
pnpm tauri info             # System information
pnpm tauri --version        # Tauri CLI version

# Cross-platform builds
pnpm tauri build --target x86_64-pc-windows-msvc    # Windows
pnpm tauri build --target x86_64-apple-darwin       # macOS Intel
pnpm tauri build --target aarch64-apple-darwin      # macOS ARM
pnpm tauri build --target x86_64-unknown-linux-gnu  # Linux
```

### Key Files

- `src-tauri/tauri.conf.json` - Main configuration
- `src-tauri/Cargo.toml` - Rust dependencies
- `src-tauri/capabilities/main-capability.json` - Security permissions
- `src/lib/tauri.ts` - TypeScript API wrappers
- `src/hooks/useTauri.ts` - React hooks

---

*This documentation is maintained alongside the codebase. For the latest updates, see the [project repository](https://github.com/iceinvein/bootleg-msn).*
