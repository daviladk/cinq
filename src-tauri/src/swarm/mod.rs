//! Swarm Coordination Module
//!
//! Manages resource usage tracking, Qi costs, and providing 
//! real-time warnings to users before actions complete.
//!
//! Architecture:
//! - Workers: Specialized agents (bandwidth, storage, payment)
//! - Tracker: Real-time usage monitoring
//! - Costs: Qi pricing tables
//!
//! Note: AI orchestration is handled by Entropic's Claude.

#![allow(dead_code)]

pub mod costs;
pub mod intent;
pub mod tracker;
pub mod workers;

// Re-exports for public API
#[allow(unused_imports)]
pub use costs::{ActionType, CostTable};
#[allow(unused_imports)]
pub use intent::{Intent, IntentParser};
#[allow(unused_imports)]
pub use tracker::{ActiveSession, UsageTracker, Warning, WarningLevel};
#[allow(unused_imports)]
pub use workers::{BandwidthWorker, PaymentWorker, StorageWorker, WorkerResult};
