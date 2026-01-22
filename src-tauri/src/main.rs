// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_updater::UpdaterExt;
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Spawn server startup in background
            let server_handle = app_handle.clone();
            std::thread::spawn(move || {
                if let Err(e) = start_server(&server_handle) {
                    eprintln!("Failed to start server: {}", e);
                }
            });

            // Check for updates in background
            let update_handle = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                check_for_updates(update_handle).await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn check_for_updates(app: tauri::AppHandle) {
    // Wait a few seconds for the app to fully load
    tokio::time::sleep(std::time::Duration::from_secs(3)).await;

    match app.updater().check().await {
        Ok(Some(update)) => {
            let version = update.version.clone();
            let body = update.body.clone().unwrap_or_default();

            // Ask user if they want to update
            let should_update = app.dialog()
                .message(format!(
                    "A new version ({}) is available!\n\n{}\n\nWould you like to download and install it?",
                    version,
                    body.chars().take(200).collect::<String>()
                ))
                .kind(MessageDialogKind::Info)
                .title("Update Available")
                .ok_button_label("Update")
                .cancel_button_label("Later")
                .blocking_show();

            if should_update {
                println!("User accepted update to {}", version);

                // Download and install the update
                match update.download_and_install(|_, _| {}, || {}).await {
                    Ok(_) => {
                        app.dialog()
                            .message("Update installed! The app will now restart.")
                            .kind(MessageDialogKind::Info)
                            .title("Update Complete")
                            .blocking_show();

                        // Restart the app
                        app.restart();
                    }
                    Err(e) => {
                        eprintln!("Failed to install update: {}", e);
                        app.dialog()
                            .message(format!("Failed to install update: {}\n\nPlease download manually from GitHub.", e))
                            .kind(MessageDialogKind::Error)
                            .title("Update Failed")
                            .blocking_show();
                    }
                }
            }
        }
        Ok(None) => {
            println!("No updates available");
        }
        Err(e) => {
            eprintln!("Failed to check for updates: {}", e);
        }
    }
}

fn start_server(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Get the resource directory where server files are bundled
    let resource_dir = app.path().resource_dir()?;
    let server_dir = resource_dir.join("server");

    // Check if we're in production (bundled) or development mode
    if server_dir.exists() {
        // Production: use bundled sidecar (Node.js) and server script
        start_production_server(app, &server_dir)
    } else {
        // Development: use system node and local cli.js
        start_development_server(app)
    }
}

fn start_production_server(app: &tauri::AppHandle, server_dir: &std::path::Path) -> Result<(), Box<dyn std::error::Error>> {
    let sidecar = app.shell().sidecar("node-server")?;
    let cli_path = server_dir.join("cli.js");

    // Spawn the sidecar (Node.js) with the cli.js script as first argument
    let (mut rx, _child) = sidecar
        .args([
            cli_path.to_string_lossy().to_string(),
            "ui".to_string(),
            "--foreground".to_string(),
            "--port".to_string(),
            "3333".to_string(),
        ])
        .env("NODE_PATH", server_dir.join("node_modules").to_string_lossy().to_string())
        .spawn()?;

    // Log output in background
    std::thread::spawn(move || {
        while let Some(event) = rx.blocking_recv() {
            handle_command_event(event);
        }
    });

    Ok(())
}

fn start_development_server(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let cli_path = find_dev_cli_path();

    let shell = app.shell();
    let (mut rx, _child) = shell
        .command("node")
        .args([&cli_path, "ui", "--foreground", "--port", "3333"])
        .spawn()?;

    // Log output in background
    std::thread::spawn(move || {
        while let Some(event) = rx.blocking_recv() {
            handle_command_event(event);
        }
    });

    Ok(())
}

fn handle_command_event(event: CommandEvent) {
    match event {
        CommandEvent::Stdout(line) => {
            if let Ok(s) = String::from_utf8(line) {
                println!("[server] {}", s);
            }
        }
        CommandEvent::Stderr(line) => {
            if let Ok(s) = String::from_utf8(line) {
                eprintln!("[server] {}", s);
            }
        }
        CommandEvent::Error(e) => {
            eprintln!("[server error] {}", e);
        }
        CommandEvent::Terminated(status) => {
            println!("[server] terminated with status: {:?}", status);
        }
        _ => {}
    }
}

fn find_dev_cli_path() -> String {
    // In development, cli.js is in the project root (parent of src-tauri)
    let possible_paths = [
        "../cli.js",
        "../../cli.js",
        "cli.js",
    ];

    for path in &possible_paths {
        if std::path::Path::new(path).exists() {
            return path.to_string();
        }
    }

    // Default
    "../cli.js".to_string()
}
