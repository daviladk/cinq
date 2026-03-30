// Cinq Connect Library
// Re-export grid modules for use in mobile builds

pub mod apps;
pub mod grid;
pub mod mcp;
pub mod swarm;

pub use apps::{App, AppId, AppInfo, AppKind, AppManifest, AppRegistry, AppStatus};
pub use grid::{BandwidthMetrics, CinqNode};
pub use mcp::{McpServerConfig, spawn_mcp_server};
pub use swarm::{ActionType, CostTable, UsageTracker, Warning, WarningLevel};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
