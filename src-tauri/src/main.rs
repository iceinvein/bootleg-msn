// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    webview::WebviewWindowBuilder,
    AppHandle, Manager, WebviewUrl, WebviewWindow,
};
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
    let window_label = format!("chat-{}", chat_id);

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
    let window_url = format!("/#/chat/{}", chat_id);

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
    let window_label = format!("chat-{}", chat_id);

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

#[tauri::command]
async fn handle_deep_links(app_handle: AppHandle, url: String) -> Result<(), String> {
    // Parse deep link URLs like msn://chat/user-id or msn://add-contact/email
    if url.starts_with("msn://") {
        let path = url.strip_prefix("msn://").unwrap_or("");

        if path.starts_with("chat/") {
            let chat_id = path.strip_prefix("chat/").unwrap_or("");
            if !chat_id.is_empty() {
                create_chat_window(app_handle, chat_id.to_string(), "Contact".to_string()).await?;
            }
        }
        // Add more deep link handlers as needed
    }

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
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            create_chat_window,
            close_chat_window,
            minimize_to_tray,
            restore_from_tray,
            update_unread_count,
            save_window_state,
            load_window_state,
            handle_deep_links
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
