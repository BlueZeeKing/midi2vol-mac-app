// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use midi2vol_mac::{midi, vol::Volume};
use tauri::ActivationPolicy;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    let volume = Volume::new(5.0);

    #[allow(unused_variables)] // This value must be kept in order to keep the callback alive
    let data = midi::new(0, move |packet| {
        volume.set((packet.val as f32 / 127.0 * 70.0).round() / 10.0)
    });

    let app = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            app.set_activation_policy(ActivationPolicy::Accessory);
            Ok(())
        });

    app.run(tauri::generate_context!())
        .expect("error while running tauri application");
}
