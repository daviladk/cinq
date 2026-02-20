//! Swarm Coordination Module
//!
//! Manages the local agent swarm, tracking resource usage, Qi costs,
//! and providing real-time warnings to users before actions complete.
//!
//! Architecture:
//! - Qora: Intent parser + response generator (orchestrator)
//! - Workers: Specialized agents (bandwidth, storage, payment)
//! - Tracker: Real-time usage monitoring
//! - Costs: Qi pricing tables
//!
//! Note: Many components are scaffolded for future implementation.

#![allow(dead_code)]

pub mod costs;
pub mod intent;
pub mod qora;
pub mod tracker;
pub mod workers;

// Re-exports for public API
#[allow(unused_imports)]
pub use costs::{ActionType, CostTable};
#[allow(unused_imports)]
pub use intent::{Intent, IntentParser};
#[allow(unused_imports)]
pub use qora::{Qora, QoraResponse, ResponseContext};
#[allow(unused_imports)]
pub use tracker::{ActiveSession, UsageTracker, Warning, WarningLevel};
#[allow(unused_imports)]
pub use workers::{BandwidthWorker, PaymentWorker, StorageWorker, WorkerResult};
