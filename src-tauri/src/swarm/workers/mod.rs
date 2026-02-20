//! Worker Agents Module
//!
//! Specialized workers that handle specific tasks in the swarm.
//! Each worker is pure Rust, no external dependencies.
//!
//! Note: Workers are scaffolded for Phase 3 implementation.

#![allow(dead_code)]

pub mod bandwidth;
pub mod payment;
pub mod storage;

pub use bandwidth::BandwidthWorker;
pub use payment::PaymentWorker;
pub use storage::StorageWorker;

use serde::{Deserialize, Serialize};

/// Result of a worker operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerResult {
    /// Whether the operation succeeded
    pub success: bool,
    /// Human-readable message
    pub message: String,
    /// Bytes processed (for bandwidth tracking)
    pub bytes_processed: u64,
    /// Qi cost incurred
    pub qi_cost: f64,
    /// Duration in seconds (for time-based operations)
    pub duration_secs: f64,
    /// Additional data (JSON-serializable)
    pub data: Option<serde_json::Value>,
}

impl WorkerResult {
    pub fn ok(message: impl Into<String>) -> Self {
        Self {
            success: true,
            message: message.into(),
            bytes_processed: 0,
            qi_cost: 0.0,
            duration_secs: 0.0,
            data: None,
        }
    }

    pub fn err(message: impl Into<String>) -> Self {
        Self {
            success: false,
            message: message.into(),
            bytes_processed: 0,
            qi_cost: 0.0,
            duration_secs: 0.0,
            data: None,
        }
    }

    pub fn with_bytes(mut self, bytes: u64) -> Self {
        self.bytes_processed = bytes;
        self
    }

    pub fn with_cost(mut self, cost: f64) -> Self {
        self.qi_cost = cost;
        self
    }

    pub fn with_duration(mut self, secs: f64) -> Self {
        self.duration_secs = secs;
        self
    }

    pub fn with_data(mut self, data: serde_json::Value) -> Self {
        self.data = Some(data);
        self
    }
}

/// Trait for all worker agents
#[allow(async_fn_in_trait)]
pub trait Worker {
    /// Worker name for logging
    fn name(&self) -> &'static str;

    /// Health check - is the worker ready?
    async fn health_check(&self) -> bool;
}
