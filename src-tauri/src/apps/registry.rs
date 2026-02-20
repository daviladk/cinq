// cinQ App Registry
// Manages both built-in and user-installed applications

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// Unique identifier for an app
#[derive(Debug, Clone, Hash, Eq, PartialEq, Serialize, Deserialize)]
pub struct AppId(pub String);

impl AppId {
    pub fn new(id: impl Into<String>) -> Self {
        Self(id.into())
    }
}

/// Kind of app
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AppKind {
    /// Ships with cinQ
    BuiltIn,
    /// Installed by user
    UserInstalled,
    /// Third-party from marketplace
    Marketplace,
}

/// Current status of an app
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AppStatus {
    /// Not started
    Idle,
    /// Currently running/active
    Running,
    /// Paused in background
    Background,
    /// Error state
    Error(String),
}

/// App manifest - metadata about an app
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppManifest {
    pub id: AppId,
    pub name: String,
    pub description: String,
    pub version: String,
    pub icon: String, // SVG icon or emoji
    pub kind: AppKind,
    pub author: String,
    /// Foundation features this app requires
    pub permissions: Vec<String>,
    /// Entry point component name
    pub entry_component: String,
}

/// Full app definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct App {
    pub manifest: AppManifest,
    pub status: AppStatus,
    /// When the app was last opened
    pub last_opened: Option<u64>,
    /// User's pinned position (None = not pinned)
    pub pinned_position: Option<u32>,
}

impl App {
    pub fn built_in(
        id: &str,
        name: &str,
        description: &str,
        icon: &str,
        entry_component: &str,
        permissions: Vec<&str>,
    ) -> Self {
        Self {
            manifest: AppManifest {
                id: AppId::new(id),
                name: name.to_string(),
                description: description.to_string(),
                version: env!("CARGO_PKG_VERSION").to_string(),
                icon: icon.to_string(),
                kind: AppKind::BuiltIn,
                author: "cinQ".to_string(),
                permissions: permissions.into_iter().map(String::from).collect(),
                entry_component: entry_component.to_string(),
            },
            status: AppStatus::Idle,
            last_opened: None,
            pinned_position: None,
        }
    }
}

/// Built-in app identifiers
pub struct BuiltInApp;

impl BuiltInApp {
    pub const CHAT: &'static str = "cinq.chat";
    pub const VOICE: &'static str = "cinq.voice";
    pub const GRID: &'static str = "cinq.grid";
    pub const COMPUTE: &'static str = "cinq.compute";
    pub const WALLET: &'static str = "cinq.wallet";
    pub const SETTINGS: &'static str = "cinq.settings";
    pub const FILES: &'static str = "cinq.files";
}

/// Info about an installed (non-built-in) app
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledApp {
    pub manifest: AppManifest,
    /// Path to app bundle
    pub path: PathBuf,
    /// Installation timestamp
    pub installed_at: u64,
    /// Source (marketplace URL or local)
    pub source: String,
}

/// The main app registry
pub struct AppRegistry {
    /// All registered apps
    apps: HashMap<AppId, App>,
    /// Currently active app
    active_app: Option<AppId>,
    /// App data directory (reserved for future per-app storage)
    #[allow(dead_code)]
    data_dir: PathBuf,
}

impl AppRegistry {
    pub fn new(data_dir: PathBuf) -> Self {
        let mut registry = Self {
            apps: HashMap::new(),
            active_app: None,
            data_dir,
        };

        // Register built-in apps
        registry.register_built_ins();

        registry
    }

    /// Register all built-in apps
    fn register_built_ins(&mut self) {
        // Chat - E2EE messaging
        let mut chat = App::built_in(
            BuiltInApp::CHAT,
            "Chat",
            "End-to-end encrypted messaging with your contacts",
            "💬",
            "ChatApp",
            vec!["network", "storage", "identity"],
        );
        chat.pinned_position = Some(0); // Always first
        self.apps.insert(chat.manifest.id.clone(), chat);

        // Voice - WebRTC calls
        let mut voice = App::built_in(
            BuiltInApp::VOICE,
            "Voice",
            "Crystal-clear P2P voice and video calls",
            "📞",
            "VoiceApp",
            vec!["network", "bandwidth", "identity"],
        );
        voice.pinned_position = Some(1);
        self.apps.insert(voice.manifest.id.clone(), voice);

        // Grid - Discord-like servers
        let mut grid = App::built_in(
            BuiltInApp::GRID,
            "Grid",
            "Community spaces with channels and roles",
            "🌐",
            "GridApp",
            vec!["network", "storage", "identity", "permissions"],
        );
        grid.pinned_position = Some(2);
        self.apps.insert(grid.manifest.id.clone(), grid);

        // Compute - FLOPs marketplace
        let compute = App::built_in(
            BuiltInApp::COMPUTE,
            "Compute",
            "Rent or provide computing power for Qi",
            "⚡",
            "ComputeApp",
            vec!["network", "compute", "payment"],
        );
        self.apps.insert(compute.manifest.id.clone(), compute);

        // Wallet - Token management
        let wallet = App::built_in(
            BuiltInApp::WALLET,
            "Wallet",
            "Manage your Qi, Quai, and $CINQ tokens",
            "👛",
            "WalletApp",
            vec!["payment", "identity"],
        );
        self.apps.insert(wallet.manifest.id.clone(), wallet);

        // Files - Storage manager
        let files = App::built_in(
            BuiltInApp::FILES,
            "Files",
            "Encrypted local and distributed file storage",
            "📁",
            "FilesApp",
            vec!["storage"],
        );
        self.apps.insert(files.manifest.id.clone(), files);

        // Settings
        let settings = App::built_in(
            BuiltInApp::SETTINGS,
            "Settings",
            "Configure your cinQ experience",
            "⚙️",
            "SettingsApp",
            vec![],
        );
        self.apps.insert(settings.manifest.id.clone(), settings);
    }

    /// Get all registered apps
    pub fn list_apps(&self) -> Vec<&App> {
        let mut apps: Vec<_> = self.apps.values().collect();
        // Sort: pinned first (by position), then by name
        apps.sort_by(|a, b| match (&a.pinned_position, &b.pinned_position) {
            (Some(pa), Some(pb)) => pa.cmp(pb),
            (Some(_), None) => std::cmp::Ordering::Less,
            (None, Some(_)) => std::cmp::Ordering::Greater,
            (None, None) => a.manifest.name.cmp(&b.manifest.name),
        });
        apps
    }

    /// Get pinned apps (for dock/sidebar)
    pub fn pinned_apps(&self) -> Vec<&App> {
        let mut apps: Vec<_> = self
            .apps
            .values()
            .filter(|a| a.pinned_position.is_some())
            .collect();
        apps.sort_by_key(|a| a.pinned_position);
        apps
    }

    /// Get built-in apps
    pub fn built_in_apps(&self) -> Vec<&App> {
        self.apps
            .values()
            .filter(|a| a.manifest.kind == AppKind::BuiltIn)
            .collect()
    }

    /// Get a specific app
    pub fn get_app(&self, id: &AppId) -> Option<&App> {
        self.apps.get(id)
    }

    /// Get a mutable reference to an app
    pub fn get_app_mut(&mut self, id: &AppId) -> Option<&mut App> {
        self.apps.get_mut(id)
    }

    /// Launch an app
    pub fn launch_app(&mut self, id: &AppId) -> Result<(), String> {
        let app = self
            .apps
            .get_mut(id)
            .ok_or_else(|| format!("App not found: {:?}", id))?;

        app.status = AppStatus::Running;
        app.last_opened = Some(
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        );

        self.active_app = Some(id.clone());

        Ok(())
    }

    /// Close an app
    pub fn close_app(&mut self, id: &AppId) -> Result<(), String> {
        let app = self
            .apps
            .get_mut(id)
            .ok_or_else(|| format!("App not found: {:?}", id))?;

        app.status = AppStatus::Idle;

        if self.active_app.as_ref() == Some(id) {
            self.active_app = None;
        }

        Ok(())
    }

    /// Minimize app to background
    pub fn minimize_app(&mut self, id: &AppId) -> Result<(), String> {
        let app = self
            .apps
            .get_mut(id)
            .ok_or_else(|| format!("App not found: {:?}", id))?;

        app.status = AppStatus::Background;

        Ok(())
    }

    /// Get currently active app
    pub fn active_app(&self) -> Option<&App> {
        self.active_app.as_ref().and_then(|id| self.apps.get(id))
    }

    /// Pin an app to a position
    pub fn pin_app(&mut self, id: &AppId, position: u32) -> Result<(), String> {
        let app = self
            .apps
            .get_mut(id)
            .ok_or_else(|| format!("App not found: {:?}", id))?;

        app.pinned_position = Some(position);

        Ok(())
    }

    /// Unpin an app
    pub fn unpin_app(&mut self, id: &AppId) -> Result<(), String> {
        let app = self
            .apps
            .get_mut(id)
            .ok_or_else(|| format!("App not found: {:?}", id))?;

        // Don't allow unpinning built-in core apps
        if app.manifest.kind == AppKind::BuiltIn
            && matches!(
                app.manifest.id.0.as_str(),
                "cinq.chat" | "cinq.voice" | "cinq.grid"
            )
        {
            return Err("Cannot unpin core apps".to_string());
        }

        app.pinned_position = None;

        Ok(())
    }

    /// Install an app from manifest
    pub fn install_app(&mut self, manifest: AppManifest) -> Result<AppId, String> {
        if self.apps.contains_key(&manifest.id) {
            return Err(format!("App already installed: {:?}", manifest.id));
        }

        let id = manifest.id.clone();

        let app = App {
            manifest,
            status: AppStatus::Idle,
            last_opened: None,
            pinned_position: None,
        };

        self.apps.insert(id.clone(), app);

        Ok(id)
    }

    /// Uninstall an app
    pub fn uninstall_app(&mut self, id: &AppId) -> Result<(), String> {
        let app = self
            .apps
            .get(id)
            .ok_or_else(|| format!("App not found: {:?}", id))?;

        if app.manifest.kind == AppKind::BuiltIn {
            return Err("Cannot uninstall built-in apps".to_string());
        }

        self.apps.remove(id);

        if self.active_app.as_ref() == Some(id) {
            self.active_app = None;
        }

        Ok(())
    }
}

/// Serializable app info for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub version: String,
    pub icon: String,
    pub kind: AppKind,
    pub status: AppStatus,
    pub pinned: bool,
    pub pinned_position: Option<u32>,
    pub entry_component: String,
}

impl From<&App> for AppInfo {
    fn from(app: &App) -> Self {
        Self {
            id: app.manifest.id.0.clone(),
            name: app.manifest.name.clone(),
            description: app.manifest.description.clone(),
            version: app.manifest.version.clone(),
            icon: app.manifest.icon.clone(),
            kind: app.manifest.kind.clone(),
            status: app.status.clone(),
            pinned: app.pinned_position.is_some(),
            pinned_position: app.pinned_position,
            entry_component: app.manifest.entry_component.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_built_in_apps() {
        let registry = AppRegistry::new(PathBuf::from("/tmp"));

        let apps = registry.list_apps();
        assert!(apps.len() >= 7); // All built-ins

        // Chat should be first (pinned at 0)
        assert_eq!(apps[0].manifest.id.0, "cinq.chat");

        // Pinned apps
        let pinned = registry.pinned_apps();
        assert_eq!(pinned.len(), 3); // Chat, Voice, Grid
    }

    #[test]
    fn test_launch_close() {
        let mut registry = AppRegistry::new(PathBuf::from("/tmp"));

        let id = AppId::new("cinq.chat");

        registry.launch_app(&id).unwrap();
        assert_eq!(registry.get_app(&id).unwrap().status, AppStatus::Running);
        assert!(registry.active_app().is_some());

        registry.close_app(&id).unwrap();
        assert_eq!(registry.get_app(&id).unwrap().status, AppStatus::Idle);
    }
}
