# Tauri Architecture Overview

This document provides a comprehensive overview of the Tauri desktop application architecture for Bootleg MSN Messenger, including system design, plugin architecture, security model, and integration patterns.

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Desktop Application                       │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript)                             │
│  ├── Components (TauriIntegration, TauriMenu)              │
│  ├── Hooks (useTauri, useWindowState, etc.)               │
│  ├── Services (tauri-notifications)                        │
│  └── API Layer (src/lib/tauri.ts)                         │
├─────────────────────────────────────────────────────────────┤
│  Tauri Bridge (IPC Communication)                          │
├─────────────────────────────────────────────────────────────┤
│  Rust Backend (src-tauri/src/main.rs)                     │
│  ├── Window Management                                      │
│  ├── System Tray Integration                              │
│  ├── Native Notifications                                  │
│  ├── File System Operations                               │
│  ├── Deep Link Handling                                   │
│  └── Plugin Integrations                                  │
├─────────────────────────────────────────────────────────────┤
│  Operating System APIs                                     │
│  ├── Windows: Win32, WinRT                                │
│  ├── macOS: Cocoa, Core Foundation                        │
│  └── Linux: GTK, D-Bus                                    │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Frontend Integration Layer

**Location**: `src/lib/tauri.ts`, `src/hooks/useTauri.ts`

Provides TypeScript-safe wrappers around Tauri APIs:

```typescript
export const tauriApi = {
  async createChatWindow(chatId: string, contactName: string): Promise<void>,
  async minimizeToTray(): Promise<void>,
  async updateUnreadCount(count: number): Promise<void>,
  // ... other commands
};
```

**React Hooks**:
- `useTauri()` - Core Tauri state and platform detection
- `useWindowState()` - Window position/size persistence
- `useUnreadCount()` - System tray badge management
- `useChatWindows()` - Multi-window chat management
- `useSystemTray()` - System tray operations
- `useDeepLinks()` - Protocol link handling

#### 2. Rust Backend (`src-tauri/src/main.rs`)

**Custom Commands** (exposed to frontend):
```rust
#[tauri::command]
async fn create_chat_window(app: AppHandle, chat_id: String, contact_name: String)
#[tauri::command]
async fn minimize_to_tray(window: WebviewWindow)
#[tauri::command]
async fn update_unread_count(app: AppHandle, count: u32)
#[tauri::command]
async fn save_window_state(window_label: String, config: WindowConfig)
// ... 15+ total commands
```

**Core Functionality**:
- Window lifecycle management
- System tray with dynamic icons and context menus
- Native notification system with click handling
- Persistent storage for window states and settings
- Deep link protocol registration and handling

## Plugin Architecture

### Tauri v2.7 Plugin System

The application uses Tauri's modern plugin architecture:

```rust
let mut builder = tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_deep_link::init());

// Desktop-only plugins
#[cfg(not(any(target_os = "android", target_os = "ios")))]
{
    builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
}
```

### Plugin Responsibilities

| Plugin | Purpose | Frontend Integration |
|--------|---------|---------------------|
| `store` | Persistent key-value storage | Window state, user preferences |
| `notification` | Native system notifications | Message alerts, contact requests |
| `fs` | File system operations | File uploads, downloads |
| `shell` | Shell command execution | Opening external applications |
| `opener` | Open URLs/files with default apps | External links, file viewing |
| `dialog` | Native file/message dialogs | File picker, confirmations |
| `deep-link` | Protocol link handling | `msn-messenger://` URLs |
| `updater` | Auto-update functionality | Seamless app updates |

## Security Model

### Capability-Based Security

Tauri v2 uses a capability-based security model defined in `src-tauri/capabilities/main-capability.json`:

```json
{
  "identifier": "main-capability",
  "description": "Main application capabilities for MSN Messenger",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-create",
    "store:default",
    "notification:default",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "shell:allow-open",
    "dialog:allow-open",
    "updater:default"
  ]
}
```

### Content Security Policy (CSP)

Defined in `tauri.conf.json`:
```json
{
  "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:;"
}
```

### Platform-Specific Security

#### macOS Entitlements (`entitlements.plist`)
```xml
<key>com.apple.security.network.client</key>
<true/>
<key>com.apple.security.personal-information.notifications</key>
<true/>
<key>com.apple.security.files.user-selected.read-write</key>
<true/>
```

## Window Management System

### Multi-Window Architecture

The application supports multiple window types:

1. **Main Window**: Primary application interface
2. **Chat Windows**: Individual conversation windows
3. **System Tray**: Minimized state with quick access

### Window State Persistence

```rust
#[derive(Debug, Serialize, Deserialize)]
struct WindowConfig {
    width: f64,
    height: f64,
    x: Option<f64>,
    y: Option<f64>,
    maximized: bool,
    minimized: bool,
}
```

**Storage**: Uses `tauri-plugin-store` for persistent window configurations
**Restoration**: Automatic on app startup and window creation
**Saving**: Periodic saves and on window events

## System Tray Integration

### Features
- **Dynamic Icons**: Unread message count badges
- **Context Menu**: Quick actions (restore, new chat, quit)
- **Click Handling**: Restore window on click
- **Cross-Platform**: Native implementation for each OS

### Implementation
```rust
fn setup_system_tray(app: &AppHandle) -> tauri::Result<()> {
    let tray_menu = Menu::with_items(app, &[
        &MenuItem::with_id(app, "restore", "Restore", true, None::<&str>)?,
        &MenuItem::with_id(app, "new_chat", "New Chat", true, None::<&str>)?,
        &PredefinedMenuItem::separator(app)?,
        &MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?,
    ])?;

    TrayIconBuilder::new()
        .menu(&tray_menu)
        .icon(app.default_window_icon().unwrap().clone())
        .on_menu_event(handle_tray_menu_event)
        .on_tray_icon_event(handle_tray_icon_event)
        .build(app)?;
}
```

## Deep Link System

### Protocol Registration
- **Scheme**: `msn-messenger://`
- **Handlers**: Chat invitations, contact requests, group invites
- **Security**: Validation and sanitization of incoming URLs

### URL Patterns
```
msn-messenger://chat/{chatId}
msn-messenger://contact/{userId}
msn-messenger://group/{groupId}
```

## Notification System

### Native Integration
- **System Notifications**: Platform-native appearance
- **Click Actions**: Navigate to relevant chat/contact
- **Permissions**: Runtime permission requests
- **Settings**: User-configurable notification preferences

### Notification Types
```typescript
export type NotificationType = "message" | "contact_request" | "group_invite";

export type NotificationData = {
  id: string;
  title: string;
  body: string;
  chatId?: string;
  senderId?: string;
  notificationType: NotificationType;
  timestamp: number;
};
```

## Auto-Update System

### Update Flow
1. **Check**: Periodic checks for new versions
2. **Download**: Background download of updates
3. **Install**: User-prompted installation
4. **Restart**: Automatic restart with new version

### Configuration
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [],
      "dialog": true,
      "pubkey": ""
    }
  }
}
```

## Performance Considerations

### Memory Management
- **Rust Backend**: Zero-cost abstractions, minimal memory footprint
- **WebView**: Shared with system browser engine
- **IPC**: Efficient serialization with `serde`

### Startup Optimization
- **Lazy Loading**: Plugins loaded on-demand
- **Window Restoration**: Async state restoration
- **Background Tasks**: Non-blocking initialization

## Development Patterns

### Error Handling
```rust
#[tauri::command]
async fn example_command() -> Result<String, String> {
    match risky_operation().await {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("Operation failed: {}", e)),
    }
}
```

### Frontend Integration
```typescript
const { api, isReady, isTauri } = useTauri();

useEffect(() => {
  if (isTauri && isReady) {
    api.someCommand().catch(console.error);
  }
}, [isTauri, isReady]);
```

## Testing Strategy

### Unit Tests
- **Rust**: `cargo test` for backend logic
- **TypeScript**: Vitest for frontend integration
- **Mocking**: Mock Tauri APIs for web development

### Integration Tests
- **E2E**: Tauri's WebDriver integration
- **Platform Testing**: Automated testing on multiple OS

## Next Steps

- See [TAURI_API_REFERENCE.md](./TAURI_API_REFERENCE.md) for detailed API documentation
- See [TAURI_DEPLOYMENT.md](./TAURI_DEPLOYMENT.md) for build and deployment guides
- See [TAURI_TROUBLESHOOTING.md](./TAURI_TROUBLESHOOTING.md) for debugging information
