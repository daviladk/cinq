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

pub mod tracker;
pub mod costs;
pub mod intent;
pub mod qora;
pub mod workers;

pub use tracker::{UsageTracker, ActiveSession, Warning, WarningLevel};
pub use costs::{CostTable, ActionType};
pub use intent::{Intent, IntentParser};
pub use qora::{Qora, QoraResponse, ResponseContext};
pub use workers::{BandwidthWorker, StorageWorker, PaymentWorker, WorkerResult};
