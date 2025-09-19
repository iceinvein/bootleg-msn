# Tauri API Reference

Complete API reference for the Bootleg MSN Messenger Tauri desktop application, including Rust commands, TypeScript wrappers, React hooks, and integration patterns.

## Table of Contents

- [Rust Commands](#rust-commands)
- [TypeScript API Wrappers](#typescript-api-wrappers)
- [React Hooks](#react-hooks)
- [Components](#components)
- [Event System](#event-system)
- [Types and Interfaces](#types-and-interfaces)

## Rust Commands

All Rust commands are defined in `src-tauri/src/main.rs` and exposed to the frontend via Tauri's IPC system.

### Window Management

#### `create_chat_window`
Creates a new chat window for a specific conversation.

```rust
#[tauri::command]
async fn create_chat_window(
    app: AppHandle,
    chat_id: String,
    contact_name: String
) -> Result<(), String>
```

**Parameters:**
- `chat_id`: Unique identifier for the chat
- `contact_name`: Display name for the window title

**Frontend Usage:**
```typescript
await tauriApi.createChatWindow("chat123", "John Doe");
```

#### `close_chat_window`
Closes a specific chat window.

```rust
#[tauri::command]
async fn close_chat_window(
    app: AppHandle,
    chat_id: String
) -> Result<(), String>
```

#### `save_window_state` / `load_window_state`
Persist and restore window positions and sizes.

```rust
#[tauri::command]
async fn save_window_state(
    window_label: String,
    config: WindowConfig
) -> Result<(), String>

#[tauri::command]
async fn load_window_state(
    window_label: String
) -> Result<Option<WindowConfig>, String>
```

### System Tray Operations

#### `minimize_to_tray` / `restore_from_tray`
Handle system tray minimize/restore operations.

```rust
#[tauri::command]
async fn minimize_to_tray(window: WebviewWindow) -> Result<(), String>

#[tauri::command]
async fn restore_from_tray(app: AppHandle) -> Result<(), String>
```

#### `update_unread_count`
Updates the system tray icon with unread message count.

```rust
#[tauri::command]
async fn update_unread_count(
    app: AppHandle,
    count: u32
) -> Result<(), String>
```

### Notification System

#### `request_notification_permission`
Requests permission for native notifications.

```rust
#[tauri::command]
async fn request_notification_permission(
    app: AppHandle
) -> Result<String, String>
```

**Returns:** Permission state (`"granted"`, `"denied"`, `"prompt"`)

#### `show_notification`
Displays a native system notification.

```rust
#[tauri::command]
async fn show_notification(
    app: AppHandle,
    notification_data: NotificationData
) -> Result<(), String>
```

#### `handle_notification_click`
Handles notification click events.

```rust
#[tauri::command]
async fn handle_notification_click(
    app: AppHandle,
    notification_id: String
) -> Result<(), String>
```

### Settings and Storage

#### `save_notification_settings` / `load_notification_settings`
Manage notification preferences.

```rust
#[tauri::command]
async fn save_notification_settings(
    settings: NotificationSettings
) -> Result<(), String>

#[tauri::command]
async fn load_notification_settings() -> Result<NotificationSettings, String>
```

#### `clear_all_notifications`
Clears all pending notifications.

```rust
#[tauri::command]
async fn clear_all_notifications(app: AppHandle) -> Result<(), String>
```

### Utility Commands

#### `open_url`
Opens a URL in the default browser.

```rust
#[tauri::command]
async fn open_url(url: String) -> Result<(), String>
```

## TypeScript API Wrappers

Located in `src/lib/tauri.ts`, these provide type-safe wrappers around Tauri commands.

### Core API Object

```typescript
export const tauriApi = {
  // Window Management
  async createChatWindow(chatId: string, contactName: string): Promise<void>
  async closeChatWindow(chatId: string): Promise<void>
  
  // System Tray
  async minimizeToTray(): Promise<void>
  async restoreFromTray(): Promise<void>
  async updateUnreadCount(count: number): Promise<void>
  
  // Window State
  async saveWindowState(windowLabel: string, config: WindowConfig): Promise<void>
  async loadWindowState(windowLabel: string): Promise<WindowConfig | null>
  
  // Deep Links
  async handleDeepLinks(url: string): Promise<void>
}
```

### Window Manager Utilities

```typescript
export const windowManager = {
  async getCurrentWindowConfig(): Promise<WindowConfig>
  async saveCurrentWindowState(windowLabel: string): Promise<void>
  async restoreWindowState(windowLabel: string): Promise<void>
}
```

### Event Listeners

```typescript
export const tauriEvents = {
  async onWindowClose(callback: () => void): Promise<UnlistenFn>
  async onWindowFocus(callback: () => void): Promise<UnlistenFn>
  async onWindowBlur(callback: () => void): Promise<UnlistenFn>
  async onDeepLink(callback: (url: string) => void): Promise<UnlistenFn>
}
```

### Utility Functions

```typescript
// Platform Detection
export const isTauri = (): boolean
export const getPlatform = (): "windows" | "macos" | "linux" | "web"
```

## React Hooks

Located in `src/hooks/useTauri.ts`, these hooks provide React integration for Tauri functionality.

### `useTauri()`
Core hook for Tauri state and platform information.

```typescript
export const useTauri = () => {
  return {
    isReady: boolean,
    isTauri: boolean,
    platform: Platform,
    api: typeof tauriApi,
    events: typeof tauriEvents,
    windowManager: typeof windowManager,
  };
};
```

**Usage:**
```typescript
const { isTauri, platform, isReady, api } = useTauri();

useEffect(() => {
  if (isTauri && isReady) {
    // Tauri-specific code
  }
}, [isTauri, isReady]);
```

### `useWindowState(windowLabel: string)`
Manages window state persistence.

```typescript
export const useWindowState = (windowLabel: string) => {
  return {
    saveState: () => Promise<void>,
    restoreState: () => Promise<void>,
  };
};
```

**Features:**
- Automatic state restoration on mount
- Periodic saving during component lifecycle
- Save on unmount

### `useUnreadCount()`
Manages system tray unread count badge.

```typescript
export const useUnreadCount = () => {
  return {
    updateUnreadCount: (count: number) => Promise<void>,
  };
};
```

### `useChatWindows()`
Manages multiple chat windows.

```typescript
export const useChatWindows = () => {
  return {
    openChatWindow: (chatId: string, contactName: string) => Promise<void>,
    closeChatWindow: (chatId: string) => Promise<void>,
  };
};
```

**Web Fallback:** Opens new browser tab when not in Tauri environment.

### `useSystemTray()`
System tray operations.

```typescript
export const useSystemTray = () => {
  return {
    minimizeToTray: () => Promise<void>,
    restoreFromTray: () => Promise<void>,
  };
};
```

### `useDeepLinks()`
Deep link handling.

```typescript
export const useDeepLinks = () => {
  return {
    handleDeepLink: (url: string) => Promise<void>,
  };
};
```

**Features:**
- Automatic event listener setup
- URL validation and routing
- Cleanup on unmount

## Components

### `TauriIntegration`
Main integration component that should wrap the entire app.

```typescript
type TauriIntegrationProps = {
  children: React.ReactNode;
};

export function TauriIntegration({ children }: TauriIntegrationProps)
```

**Features:**
- Platform detection and CSS class application
- Window state management
- Deep link handling on startup
- Unread count synchronization

**Usage:**
```typescript
<TauriIntegration>
  <App />
</TauriIntegration>
```

### `TauriStyles`
Platform-specific CSS styles.

```typescript
export function TauriStyles()
```

**Features:**
- Platform-specific font families
- Native scrollbar styling
- User selection controls
- Dark mode support

### `TauriMenu`
Native application menu component.

```typescript
type TauriMenuProps = {
  onOpenSettings?: () => void;
  onOpenContacts?: () => void;
  onNewChat?: () => void;
};

export function TauriMenu(props: TauriMenuProps)
```

**Features:**
- System tray integration
- New chat window creation
- Settings and contacts access
- Platform-aware rendering

### `TauriWindowControls`
Custom window controls (Windows/Linux only).

```typescript
export function TauriWindowControls()
```

**Features:**
- Minimize to tray functionality
- Close button handling
- Platform-specific visibility

## Event System

### Tauri Events

Events emitted by the Rust backend:

```typescript
// Window Events
"tauri://close-requested" // Window close attempt
"tauri://focus"           // Window gained focus
"tauri://blur"            // Window lost focus

// Custom Events
"deep-link"               // Deep link received
"notification-clicked"    // Notification was clicked
"show-contact-requests"   // Navigate to contact requests
"show-group-invites"      // Navigate to group invites
```

### Event Handling Pattern

```typescript
useEffect(() => {
  if (isTauri) {
    const unlisten = tauriEvents.onDeepLink((url) => {
      // Handle deep link
    });
    
    return () => {
      unlisten.then(fn => fn());
    };
  }
}, [isTauri]);
```

## Types and Interfaces

### Core Types

```typescript
export type Platform = "windows" | "macos" | "linux" | "web";

export type WindowConfig = {
  width: number;
  height: number;
  x?: number;
  y?: number;
  maximized: boolean;
  minimized: boolean;
};

export type NotificationPermission = 
  | "granted" 
  | "denied" 
  | "prompt" 
  | "prompt-with-rationale";

export type NotificationType = 
  | "message" 
  | "contact_request" 
  | "group_invite";

export type NotificationData = {
  id: string;
  title: string;
  body: string;
  chatId?: string;
  senderId?: string;
  notificationType: NotificationType;
  timestamp: number;
};

export type NotificationSettings = {
  enabled: boolean;
  soundEnabled: boolean;
  showPreview: boolean;
  suppressWhenFocused: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
};
```

### Command Types

```typescript
export type TauriCommands = {
  create_chat_window: (chatId: string, contactName: string) => Promise<void>;
  close_chat_window: (chatId: string) => Promise<void>;
  minimize_to_tray: () => Promise<void>;
  restore_from_tray: () => Promise<void>;
  update_unread_count: (count: number) => Promise<void>;
  save_window_state: (windowLabel: string, config: WindowConfig) => Promise<void>;
  load_window_state: (windowLabel: string) => Promise<WindowConfig | null>;
  handle_deep_links: (url: string) => Promise<void>;
};
```

## Error Handling

### Rust Error Patterns

```rust
#[tauri::command]
async fn example_command() -> Result<String, String> {
    match operation().await {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("Operation failed: {}", e)),
    }
}
```

### TypeScript Error Handling

```typescript
try {
  await tauriApi.createChatWindow(chatId, contactName);
} catch (error) {
  console.error('Failed to create chat window:', error);
  // Handle error appropriately
}
```

## Best Practices

1. **Always check `isTauri` before calling Tauri APIs**
2. **Provide web fallbacks for Tauri-specific functionality**
3. **Handle errors gracefully with user feedback**
4. **Use TypeScript types for better development experience**
5. **Clean up event listeners in useEffect cleanup functions**
6. **Test both Tauri and web environments**

## Next Steps

- See [TAURI_SETUP.md](./TAURI_SETUP.md) for development setup
- See [TAURI_ARCHITECTURE.md](./TAURI_ARCHITECTURE.md) for system architecture
- See [TAURI_DEPLOYMENT.md](./TAURI_DEPLOYMENT.md) for build and deployment
- See [TAURI_TROUBLESHOOTING.md](./TAURI_TROUBLESHOOTING.md) for debugging help
