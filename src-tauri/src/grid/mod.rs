// Cinq Connect Grid - P2P mesh network foundation
// This module handles peer discovery, secure connections, and packet routing

pub mod node;
pub mod protocol;
pub mod transfer;
pub mod metrics;
pub mod proxy;
pub mod tunnel;

pub use node::{CinqNode, GridPeer};
pub use transfer::FileTransfer;
pub use metrics::BandwidthMetrics;
pub use proxy::{Socks5Proxy, ProxyConfig, ProxyStatus};
pub use tunnel::TunnelManager;
