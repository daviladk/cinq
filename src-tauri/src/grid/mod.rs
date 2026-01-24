// Cinq Connect Grid - P2P mesh network foundation
// This module handles peer discovery, secure connections, and packet routing

pub mod node;
pub mod protocol;
pub mod transfer;
pub mod metrics;

pub use node::{CinqNode, GridPeer};
pub use transfer::FileTransfer;
pub use metrics::BandwidthMetrics;
