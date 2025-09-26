// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    webview::WebviewWindowBuilder,
    AppHandle, Emitter, Manager, WebviewUrl, WebviewWindow,
};
use tauri_plugin_notification::{NotificationExt, PermissionState};
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_store::StoreBuilder;

#[derive(Debug, Serialize, Deserialize)]
struct WindowConfig {
    width: f64,
    height: f64,
    x: Option<f64>,
    y: Option<f64>,
    maximized: bool,
    minimized: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct AppState {
    chat_windows: HashMap<String, WindowConfig>,
    main_window_config: WindowConfig,
    unread_count: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct NotificationData {
    id: String,
    title: String,
    body: String,
    chat_id: Option<String>,
    sender_id: Option<String>,
    notification_type: String, // "message", "contact_request", "group_invite"
    timestamp: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct NotificationSettings {
    enabled: bool,
    sound_enabled: bool,
    show_preview: bool,
    suppress_when_focused: bool,
    quiet_hours_enabled: bool,
    quiet_hours_start: Option<String>, // "22:00"
    quiet_hours_end: Option<String>,   // "08:00"
}

impl Default for NotificationSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            sound_enabled: true,
            show_preview: true,
            suppress_when_focused: true,
            quiet_hours_enabled: false,
            quiet_hours_start: None,
            quiet_hours_end: None,
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            chat_windows: HashMap::new(),
            main_window_config: WindowConfig {
                width: 1200.0,
                height: 800.0,
                x: None,
                y: None,
                maximized: false,
                minimized: false,
            },
            unread_count: 0,
        }
    }
}

// Tauri commands for window management
#[tauri::command]
async fn create_chat_window(
    app_handle: AppHandle,
    chat_id: String,
    contact_name: String,
) -> Result<(), String> {
    // Normalize label to safe chars for Tauri window labels
    let normalized_id: String = chat_id
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '_' || c == '-' { c } else { '-' })
        .collect();
    let window_label = format!("chat-{}", normalized_id);

    // Check if window already exists
    if app_handle.get_webview_window(&window_label).is_some() {
        // Focus existing window
        if let Some(window) = app_handle.get_webview_window(&window_label) {
            window.set_focus().map_err(|e| e.to_string())?;
        }
        return Ok(());
    }

    // Create new chat window
    let window_title = format!("Chat with {}", contact_name);
    // Open chat-only window mode; renderer reads ?chat=... and window=chat
    let window_url = format!("/?chat={}&window=chat", chat_id);

    WebviewWindowBuilder::new(
        &app_handle,
        &window_label,
        WebviewUrl::App(window_url.into()),
    )
    .title(&window_title)
    .inner_size(600.0, 500.0)
    .min_inner_size(400.0, 300.0)
    .resizable(true)
    .center()
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn close_chat_window(app_handle: AppHandle, chat_id: String) -> Result<(), String> {
    // Use same normalization as create_chat_window to find the label
    let normalized_id: String = chat_id
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '_' || c == '-' { c } else { '-' })
        .collect();
    let window_label = format!("chat-{}", normalized_id);

    if let Some(window) = app_handle.get_webview_window(&window_label) {
        window.close().map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
async fn minimize_to_tray(window: WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn restore_from_tray(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn update_unread_count(app_handle: AppHandle, count: u32) -> Result<(), String> {
    // Update system tray tooltip with unread count
    if let Some(tray) = app_handle.tray_by_id("main-tray") {
        let tooltip = if count > 0 {
            format!("MSN Messenger - {} unread messages", count)
        } else {
            "MSN Messenger".to_string()
        };
        tray.set_tooltip(Some(&tooltip))
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
async fn save_window_state(
    app_handle: AppHandle,
    window_label: String,
    config: WindowConfig,
) -> Result<(), String> {
    let store = StoreBuilder::new(&app_handle, std::path::PathBuf::from("window-state.json"))
        .build()
        .map_err(|e| e.to_string())?;

    store.set(window_label, serde_json::to_value(config).unwrap());
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn load_window_state(
    app_handle: AppHandle,
    window_label: String,
) -> Result<Option<WindowConfig>, String> {
    let store = StoreBuilder::new(&app_handle, std::path::PathBuf::from("window-state.json"))
        .build()
        .map_err(|e| e.to_string())?;

    if let Some(value) = store.get(&window_label) {
        let config: WindowConfig =
            serde_json::from_value(value.clone()).map_err(|e| e.to_string())?;
        Ok(Some(config))
    } else {
        Ok(None)
    }
}

// Notification management commands
#[tauri::command]
async fn request_notification_permission(app_handle: AppHandle) -> Result<String, String> {
    match app_handle.notification().request_permission() {
        Ok(permission) => match permission {
            PermissionState::Granted => Ok("granted".to_string()),
            PermissionState::Denied => Ok("denied".to_string()),
            PermissionState::Prompt => Ok("prompt".to_string()),
            PermissionState::PromptWithRationale => Ok("prompt-with-rationale".to_string()),
        },
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn check_notification_permission(app_handle: AppHandle) -> Result<String, String> {
    match app_handle.notification().permission_state() {
        Ok(permission) => match permission {
            PermissionState::Granted => Ok("granted".to_string()),
            PermissionState::Denied => Ok("denied".to_string()),
            PermissionState::Prompt => Ok("prompt".to_string()),
            PermissionState::PromptWithRationale => Ok("prompt-with-rationale".to_string()),
        },
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn show_notification(
    app_handle: AppHandle,
    notification_data: NotificationData,
) -> Result<(), String> {
    // Check if app is focused and should suppress notifications
    let settings = load_notification_settings(app_handle.clone()).await?;

    if !settings.enabled {
        return Ok(());
    }

    // Check if main window is focused and suppression is enabled
    if settings.suppress_when_focused {
        if let Some(window) = app_handle.get_webview_window("main") {
            if window.is_focused().unwrap_or(false) {
                return Ok(());
            }
        }
    }

    // Check quiet hours
    if settings.quiet_hours_enabled {
        if let (Some(start), Some(end)) = (&settings.quiet_hours_start, &settings.quiet_hours_end) {
            let now = chrono::Local::now();
            let current_time = now.format("%H:%M").to_string();

            // Simple time comparison (doesn't handle overnight ranges perfectly)
            if current_time >= *start && current_time <= *end {
                return Ok(());
            }
        }
    }

    // Prepare notification body
    let body = if settings.show_preview {
        notification_data.body.clone()
    } else {
        "New message".to_string()
    };

    // Create and show notification
    let notification = app_handle
        .notification()
        .builder()
        .title(&notification_data.title)
        .body(&body);

    // Add action data for click handling
    let mut action_data = HashMap::new();
    action_data.insert("notification_id".to_string(), notification_data.id.clone());
    action_data.insert(
        "type".to_string(),
        notification_data.notification_type.clone(),
    );

    if let Some(chat_id) = &notification_data.chat_id {
        action_data.insert("chat_id".to_string(), chat_id.clone());
    }

    if let Some(sender_id) = &notification_data.sender_id {
        action_data.insert("sender_id".to_string(), sender_id.clone());
    }

    // Store notification data for click handling
    let store = StoreBuilder::new(&app_handle, std::path::PathBuf::from("notifications.json"))
        .build()
        .map_err(|e| e.to_string())?;

    store.set(
        &notification_data.id,
        serde_json::to_value(&action_data).unwrap(),
    );
    store.save().map_err(|e| e.to_string())?;

    notification.show().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn handle_notification_click(
    app_handle: AppHandle,
    notification_id: String,
) -> Result<(), String> {
    // Load notification data
    let store = StoreBuilder::new(&app_handle, std::path::PathBuf::from("notifications.json"))
        .build()
        .map_err(|e| e.to_string())?;

    if let Some(data_value) = store.get(&notification_id) {
        let data: HashMap<String, String> =
            serde_json::from_value(data_value.clone()).map_err(|e| e.to_string())?;

        match data.get("type").map(|s| s.as_str()) {
            Some("message") => {
                if let Some(chat_id) = data.get("chat_id") {
                    // Open chat window
                    create_chat_window(app_handle.clone(), chat_id.clone(), "Contact".to_string())
                        .await?;
                }

                // Show main window
                restore_from_tray(app_handle).await?;
            }
            Some("contact_request") => {
                // Show main window and navigate to contact requests
                restore_from_tray(app_handle.clone()).await?;

                // Emit event to frontend to show contact requests
                if let Some(window) = app_handle.get_webview_window("main") {
                    window
                        .emit("show-contact-requests", ())
                        .map_err(|e| e.to_string())?;
                }
            }
            Some("group_invite") => {
                // Show main window and navigate to group invites
                restore_from_tray(app_handle.clone()).await?;

                // Emit event to frontend to show group invites
                if let Some(window) = app_handle.get_webview_window("main") {
                    window
                        .emit("show-group-invites", ())
                        .map_err(|e| e.to_string())?;
                }
            }
            _ => {
                // Default: just show main window
                restore_from_tray(app_handle).await?;
            }
        }

        // Clean up notification data
        store.delete(&notification_id);
        let _ = store.save();
    }

    Ok(())
}

#[tauri::command]
async fn save_notification_settings(
    app_handle: AppHandle,
    settings: NotificationSettings,
) -> Result<(), String> {
    let store = StoreBuilder::new(
        &app_handle,
        std::path::PathBuf::from("notification-settings.json"),
    )
    .build()
    .map_err(|e| e.to_string())?;

    store.set("settings", serde_json::to_value(settings).unwrap());
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn load_notification_settings(app_handle: AppHandle) -> Result<NotificationSettings, String> {
    let store = StoreBuilder::new(
        &app_handle,
        std::path::PathBuf::from("notification-settings.json"),
    )
    .build()
    .map_err(|e| e.to_string())?;

    if let Some(value) = store.get("settings") {
        let settings: NotificationSettings =
            serde_json::from_value(value.clone()).map_err(|e| e.to_string())?;
        Ok(settings)
    } else {
        Ok(NotificationSettings::default())
    }
}

#[tauri::command]
async fn clear_all_notifications(app_handle: AppHandle) -> Result<(), String> {
    // Clear notification store
    let store = StoreBuilder::new(&app_handle, std::path::PathBuf::from("notifications.json"))
        .build()
        .map_err(|e| e.to_string())?;

    store.clear();
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

// OAuth and external URL handling
#[tauri::command]
async fn open_url(app_handle: AppHandle, url: String) -> Result<(), String> {
    // Validate URL to prevent security issues
    if !url.starts_with("https://") && !url.starts_with("http://") {
        return Err("Invalid URL scheme".to_string());
    }

    // Open URL in system browser using the opener plugin
    app_handle
        .opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| format!("Failed to open URL: {}", e))?;

    Ok(())
}

fn create_tray_menu(app: &AppHandle) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let show = MenuItem::with_id(app, "show", "Show MSN Messenger", true, None::<&str>)?;
    let hide = MenuItem::with_id(app, "hide", "Hide to Tray", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show,
            &PredefinedMenuItem::separator(app)?,
            &hide,
            &PredefinedMenuItem::separator(app)?,
            &quit,
        ],
    )?;

    Ok(menu)
}

fn main() {
    // Initialize Tauri application with modern v2.7 plugin architecture
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_deep_link::init());

    // Add updater plugin only on desktop platforms (not mobile)
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .invoke_handler(tauri::generate_handler![
            create_chat_window,
            close_chat_window,
            minimize_to_tray,
            restore_from_tray,
            update_unread_count,
            save_window_state,
            load_window_state,
            request_notification_permission,
            check_notification_permission,
            show_notification,
            handle_notification_click,
            save_notification_settings,
            load_notification_settings,
            clear_all_notifications,
            open_url
        ])
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // Prevent closing main window, minimize to tray instead
                    if window.label() == "main" {
                        let _ = window.hide();
                        api.prevent_close();
                    }
                }
                _ => {}
            }
        })
        .setup(|app| {
            // Initialize store for window state persistence
            let _store =
                StoreBuilder::new(app.handle(), std::path::PathBuf::from("window-state.json"))
                    .build()?;

            // Create system tray
            let tray_menu = create_tray_menu(app.handle())?;
            let _tray = TrayIconBuilder::with_id("main-tray")
                .menu(&tray_menu)
                .tooltip("MSN Messenger")
                .on_tray_icon_event(|_tray, event| {
                    match event {
                        TrayIconEvent::Click {
                            button: tauri::tray::MouseButton::Left,
                            button_state: tauri::tray::MouseButtonState::Up,
                            ..
                        } => {
                            // Show main window on left click
                            if let Some(app) = _tray.app_handle().get_webview_window("main") {
                                let _ = app.show();
                                let _ = app.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
