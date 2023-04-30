// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use midi2vol_mac::{midi::Connection, vol::Volume};
use std::thread;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    thread::spawn(|| {
        let connection = Connection::new(0);
        let volume = Volume::new(5.0);

        for packet in connection.data.iter() {
            if packet.channel == 1 || packet.channel == 2 {
                volume.set((packet.val as f32 / 127.0 * 70.0).round() / 10.0)
            }
        }
    });

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
