use std::{sync::atomic::AtomicBool, sync::atomic::Ordering, time::Duration};

use coremidi::Sources;
use midi2vol_mac::{
    midi::{self, Connection},
    vol::Volume,
};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{
    ActivationPolicy, CustomMenuItem, Manager, RunEvent, State, SystemTray, SystemTrayEvent,
    SystemTrayMenu, SystemTrayMenuItem, TitleBarStyle, WindowBuilder, WindowUrl,
};

struct ConnectionState {
    connection: Mutex<Connection>,
    enabled: AtomicBool,
}

fn main() {
    let connection = Connection::new(0, Volume::new(5.0, Duration::from_millis(100)))
        .expect("Could not open midi connection");

    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("enabled", "Enabled").selected())
        .add_item(CustomMenuItem::new("open", "Open Settings"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit", "Quit"));

    let tray = SystemTray::new().with_menu(tray_menu);

    let app = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_settings,
            set_settings,
            get_error,
            attempt_restart,
        ])
        .system_tray(tray)
        .manage(ConnectionState {
            enabled: AtomicBool::new(true),
            connection: Mutex::new(connection),
        })
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "enabled" => {
                    let state = app.state::<ConnectionState>();

                    let is_enabled = state.enabled.fetch_xor(true, Ordering::Relaxed);

                    app.tray_handle()
                        .get_item("enabled")
                        .set_selected(is_enabled)
                        .expect("Could not set selected value");

                    let mut connection = state.connection.lock().unwrap();

                    if is_enabled {
                        let port = connection.create_callback();
                        connection.set_port(port);
                    } else {
                        connection.set_port(Err(midi::Error::UserStopped))
                    }
                }
                "quit" => std::process::exit(0),
                "open" => {
                    WindowBuilder::new(app, "settings", WindowUrl::App("index.html".into()))
                        .title_bar_style(TitleBarStyle::Overlay)
                        .title("Settings")
                        .hidden_title(true)
                        .build()
                        .expect("Could not make a new settings window, one may already exist");
                }
                _ => (),
            },
            _ => (),
        })
        .setup(|app| {
            app.set_activation_policy(ActivationPolicy::Accessory);
            Ok(())
        });

    app.build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|_app_handle, event| match event {
            RunEvent::ExitRequested { api, .. } => {
                api.prevent_exit();
            }
            _ => {}
        });
}

#[derive(Serialize, Deserialize)]
struct Settings {
    vol_sample_time: u64,
    midi_devices: Vec<String>,
    channel: u8,
    cc_num: u8,
    enabled: bool,
}

#[tauri::command]
fn get_settings(state: State<ConnectionState>) -> Settings {
    let connection = state.connection.lock().unwrap();

    Settings {
        vol_sample_time: connection.volume.get_sleep_time().as_millis() as u64,
        midi_devices: Sources
            .into_iter()
            .enumerate()
            .map(|(index, source)| {
                source
                    .display_name()
                    .unwrap_or(format!("Unnamed source: {}", index))
            })
            .collect::<Vec<_>>(),
        channel: connection.get_channel(),
        cc_num: connection.get_cc(),
        enabled: matches!(connection.get_error(), Some(midi::Error::UserStopped)),
    }
}

#[tauri::command]
fn set_settings(
    device_index: usize,
    sample_time: u64,
    channel: u8,
    cc_num: u8,
    state: State<ConnectionState>,
) -> String {
    let mut connection = state.connection.lock().unwrap();

    connection.set_source_index(device_index);
    connection
        .volume
        .set_sleep_time(Duration::from_millis(sample_time));
    connection.set_cc(cc_num);
    connection.set_channel(channel);

    let port = connection.create_callback();
    connection.set_port(port);

    match connection.get_error() {
        Some(err) => format!("{:?}", err),
        None => "".to_owned(),
    }
}

#[tauri::command]
fn get_error(state: State<ConnectionState>) -> String {
    match state
        .connection
        .lock()
        .expect("Could not access the connection")
        .get_error()
    {
        Some(err) => format!("{:?}", err),
        None => "".to_owned(),
    }
}

#[tauri::command]
fn attempt_restart(state: State<ConnectionState>) -> String {
    let mut connection = state.connection.lock().unwrap();

    let port = connection.create_callback();
    connection.set_port(port);

    match connection.get_error() {
        Some(err) => format!("{:?}", err),
        None => "".to_owned(),
    }
}
