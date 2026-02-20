// cinQ App Registry System
// Manages built-in and user-installed apps
//
// Note: Some types scaffolded for future marketplace integration.

#![allow(dead_code)]

mod registry;

#[allow(unused_imports)]
pub use registry::{
    App, AppId, AppInfo, AppKind, AppManifest, AppRegistry, AppStatus, BuiltInApp, InstalledApp,
};
