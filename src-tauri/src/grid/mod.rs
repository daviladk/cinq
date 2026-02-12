// Cinq Connect Grid - P2P mesh network foundation
// This module handles peer discovery, secure connections, and packet routing

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

pub use bootstrap::{PeerStorage, BootstrapConfig, SavedPeer};
pub use chat::{ChatManager, ChatMessage, Contact, Conversation, MessageStatus};
pub use node::{CinqNode, GridPeer, NodeConfig};
pub use transfer::FileTransfer;
pub use metrics::BandwidthMetrics;
pub use proxy::{Socks5Proxy, ProxyConfig, ProxyStatus};
pub use tunnel::TunnelManager;
pub use stratum::{StratumClient, PoolStats, Worker, StratumStatus, StratumError};
pub use userid::{UserId, UserIdRegistry, UserIdRecord, ContactCard, USER_ID_DHT_PREFIX, QuaiZone};
pub use sbt::{SbtManager, SbtInfo, SbtProof, SbtError};

// Re-export protocol types for relay binary
pub use protocol::{
    CinqBehaviour, CinqBehaviourEvent,
    CinqRelayBehaviour, CinqRelayBehaviourEvent,
    CinqRequest, CinqResponse,
    new_cinq_protocol, new_kademlia, new_identify, new_autonat,
};
