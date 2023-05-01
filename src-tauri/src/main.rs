use midi2vol_mac::{midi, vol::Volume};
use tauri::{
    ActivationPolicy, CustomMenuItem, RunEvent, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem, WindowBuilder, WindowUrl,
};

fn main() {
    let volume = Volume::new(5.0);

    #[allow(unused_variables)] // This value must be kept in order to keep the callback alive
    let data = midi::new(0, move |packet| {
        volume.set((packet.val as f32 / 127.0 * 70.0).round() / 10.0)
    });

    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("open", "Open Settings"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit", "Quit"));

    let tray = SystemTray::new().with_menu(tray_menu);

    let app = tauri::Builder::default()
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => std::process::exit(0),
                "open" => {
                    WindowBuilder::new(app, "settings", WindowUrl::App("index.html".into()))
                        .build()
                        .expect("Could not make a new settings window, one may already exist")
                        .set_title("Settings")
                        .expect("Could not set title");
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
