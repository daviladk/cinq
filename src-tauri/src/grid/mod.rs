// Cinq Connect Grid - P2P mesh network foundation
// This module handles peer discovery, secure connections, and packet routing

// Allow dead code - these modules contain scaffolded features for Phase 2
#![allow(dead_code)]

pub mod bootstrap;
pub mod chat;
pub mod node;
pub mod protocol;
pub mod transfer;
pub mod metrics;
pub mod proxy;
pub mod tunnel;
pub mod stratum;
pub mod userid;
pub mod sbt;

pub use chat::{ChatManager, ChatMessage, Contact, Conversation, MessageStatus};
pub use node::{CinqNode, GridPeer, NodeConfig};
pub use metrics::BandwidthMetrics;
pub use proxy::ProxyStatus;
pub use stratum::{StratumClient, PoolStats, Worker, StratumStatus};
pub use userid::UserIdRegistry;

// Re-export protocol types for relay binary
