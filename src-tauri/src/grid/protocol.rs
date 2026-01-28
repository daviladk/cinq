// Cinq Protocol - Custom request/response protocol for file transfer

use libp2p::{
    autonat, dcutr, identify, kad,
    relay,
    request_response::{self, Codec, ProtocolSupport},
    swarm::NetworkBehaviour,
    StreamProtocol, PeerId,
};
use serde::{Deserialize, Serialize};
use std::io;
use std::time::Duration;
use futures::{AsyncRead, AsyncWrite, AsyncReadExt, AsyncWriteExt};

/// Protocol name for Cinq file transfer
pub const CINQ_PROTOCOL: StreamProtocol = StreamProtocol::new("/cinq/transfer/1.0.0");

/// A message stored in a mailbox for offline delivery
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MailboxMessage {
    /// When this message was stored
    pub stored_at: u64,
    /// Encrypted message blob
    pub encrypted_data: Vec<u8>,
    /// Sender hint (optional, for filtering)
    pub sender_hint: Option<String>,
}

/// Request types for the Cinq protocol
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CinqRequest {
    /// Ping to check if peer is alive
    Ping,
    /// Request file metadata
    FileInfo { filename: String },
    /// Request file data (chunked transfer)
    FileChunk { 
        filename: String, 
        offset: u64, 
        length: u64 
    },
    /// Full file transfer request
    FileTransfer { 
        filename: String,
        data: Vec<u8>,
        total_size: u64,
    },
    /// Request peer info
    GetPeerInfo,
    /// Proxy tunnel request - ask peer to connect to target and relay traffic
    ProxyConnect {
        /// Unique tunnel ID
        tunnel_id: u64,
        /// Target hostname or IP
        target_host: String,
        /// Target port
        target_port: u16,
    },
    /// Proxy data - send data through an established tunnel
    ProxyData {
        tunnel_id: u64,
        data: Vec<u8>,
    },
    /// Close a proxy tunnel
    ProxyClose {
        tunnel_id: u64,
    },
    
    // ========== CHAT MESSAGES ==========
    
    /// Send a direct chat message to a peer
    ChatMessage {
        /// Unique message ID (UUID)
        message_id: String,
        /// Sender's display name (optional, for convenience)
        sender_name: Option<String>,
        /// Encrypted message content (recipient decrypts with their key)
        encrypted_content: Vec<u8>,
        /// Unix timestamp (millis)
        timestamp: u64,
    },
    
    /// Store a message in peer's mailbox (for offline delivery)
    MailboxStore {
        /// Hint for recipient (hashed peer ID or similar)
        recipient_hint: String,
        /// Encrypted message blob
        encrypted_message: Vec<u8>,
        /// Expiration timestamp (Unix millis) - default 7 days
        expires_at: u64,
    },
    
    /// Retrieve messages from a mailbox
    MailboxRetrieve {
        /// Proof that requester owns this mailbox
        recipient_proof: String,
        /// Only messages after this timestamp
        since_timestamp: Option<u64>,
    },
    
    /// Store an encrypted shard for backup
    ShardStore {
        /// Unique shard ID
        shard_id: String,
        /// Encrypted shard data
        encrypted_data: Vec<u8>,
        /// Size in bytes (for billing)
        size_bytes: u64,
        /// TTL in seconds (how long to keep)
        ttl_secs: u64,
    },
    
    /// Retrieve a stored shard
    ShardRetrieve {
        /// Shard ID to retrieve
        shard_id: String,
        /// Proof of ownership
        proof: String,
    },
}

/// Response types for the Cinq protocol
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CinqResponse {
    /// Pong response
    Pong,
    /// File metadata response
    FileInfo {
        filename: String,
        size: u64,
        hash: String,
        exists: bool,
    },
    /// File chunk data
    FileChunk {
        filename: String,
        offset: u64,
        data: Vec<u8>,
        is_last: bool,
    },
    /// Full file received acknowledgment
    FileReceived {
        filename: String,
        bytes_received: u64,
        success: bool,
    },
    /// Peer info response
    PeerInfo {
        peer_id: String,
        version: String,
        uptime_secs: u64,
    },
    /// Proxy tunnel established
    ProxyConnected {
        tunnel_id: u64,
        success: bool,
        error: Option<String>,
    },
    /// Proxy data from target
    ProxyData {
        tunnel_id: u64,
        data: Vec<u8>,
    },
    /// Proxy tunnel closed
    ProxyClosed {
        tunnel_id: u64,
    },
    
    // ========== CHAT RESPONSES ==========
    
    /// Chat message received acknowledgment
    ChatReceived {
        /// The message ID that was received
        message_id: String,
        /// Whether it was delivered (true) or stored in mailbox (false)
        delivered: bool,
    },
    
    /// Mailbox store result
    MailboxStored {
        /// Success or failure
        success: bool,
        /// Storage cost in nano-Qi
        cost_nano_qi: u64,
        /// Expiration timestamp
        expires_at: u64,
    },
    
    /// Mailbox retrieval result
    MailboxMessages {
        /// Retrieved messages (each is an encrypted blob)
        messages: Vec<MailboxMessage>,
    },
    
    /// Shard stored result
    ShardStored {
        /// Shard ID
        shard_id: String,
        /// Success
        success: bool,
        /// Storage cost in nano-Qi
        cost_nano_qi: u64,
    },
    
    /// Shard retrieval result
    ShardData {
        /// Shard ID
        shard_id: String,
        /// Encrypted shard data (empty if not found)
        encrypted_data: Vec<u8>,
        /// Found or not
        found: bool,
    },
    
    /// Error response
    Error { message: String },
}

/// Codec for encoding/decoding Cinq messages
#[derive(Debug, Clone, Default)]
pub struct CinqCodec {
    /// Maximum file size to accept (100MB default)
    pub max_file_size: u64,
}

impl CinqCodec {
    pub fn new() -> Self {
        Self {
            max_file_size: 100 * 1024 * 1024, // 100MB
        }
    }
}

#[async_trait::async_trait]
impl Codec for CinqCodec {
    type Protocol = StreamProtocol;
    type Request = CinqRequest;
    type Response = CinqResponse;

    async fn read_request<T>(&mut self, _protocol: &Self::Protocol, io: &mut T) -> io::Result<Self::Request>
    where
        T: AsyncRead + Unpin + Send,
    {
        let mut length_buf = [0u8; 4];
        io.read_exact(&mut length_buf).await?;
        let length = u32::from_be_bytes(length_buf) as usize;
        
        if length > self.max_file_size as usize {
            return Err(io::Error::new(io::ErrorKind::InvalidData, "Message too large"));
        }
        
        let mut buf = vec![0u8; length];
        io.read_exact(&mut buf).await?;
        
        serde_json::from_slice(&buf)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))
    }

    async fn read_response<T>(&mut self, _protocol: &Self::Protocol, io: &mut T) -> io::Result<Self::Response>
    where
        T: AsyncRead + Unpin + Send,
    {
        let mut length_buf = [0u8; 4];
        io.read_exact(&mut length_buf).await?;
        let length = u32::from_be_bytes(length_buf) as usize;
        
        if length > self.max_file_size as usize {
            return Err(io::Error::new(io::ErrorKind::InvalidData, "Message too large"));
        }
        
        let mut buf = vec![0u8; length];
        io.read_exact(&mut buf).await?;
        
        serde_json::from_slice(&buf)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))
    }

    async fn write_request<T>(&mut self, _protocol: &Self::Protocol, io: &mut T, request: Self::Request) -> io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        let data = serde_json::to_vec(&request)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;
        
        let length = (data.len() as u32).to_be_bytes();
        io.write_all(&length).await?;
        io.write_all(&data).await?;
        io.flush().await?;
        
        Ok(())
    }

    async fn write_response<T>(&mut self, _protocol: &Self::Protocol, io: &mut T, response: Self::Response) -> io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        let data = serde_json::to_vec(&response)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;
        
        let length = (data.len() as u32).to_be_bytes();
        io.write_all(&length).await?;
        io.write_all(&data).await?;
        io.flush().await?;
        
        Ok(())
    }
}

/// Type alias for the request-response behaviour
pub type CinqProtocolBehaviour = request_response::Behaviour<CinqCodec>;

/// Create a new CinqProtocol behaviour
pub fn new_cinq_protocol() -> CinqProtocolBehaviour {
    request_response::Behaviour::with_codec(
        CinqCodec::new(),
        [(CINQ_PROTOCOL, ProtocolSupport::Full)],
        request_response::Config::default(),
    )
}

// Bootstrap nodes for the Cinq DHT network
// These are well-known nodes that help new peers join the network
pub const BOOTSTRAP_NODES: &[&str] = &[
    // Will be populated with actual bootstrap nodes when deployed
    // Format: "/ip4/<IP>/tcp/<PORT>/p2p/<PEER_ID>"
];

/// Create Kademlia DHT config for the Cinq network
pub fn new_kademlia(local_peer_id: PeerId) -> kad::Behaviour<kad::store::MemoryStore> {
    let mut kad_config = kad::Config::new(StreamProtocol::new("/cinq/kad/1.0.0"));
    
    // Configure for better connectivity
    kad_config
        .set_query_timeout(Duration::from_secs(60))
        .set_record_ttl(Some(Duration::from_secs(24 * 60 * 60))) // 24 hour TTL
        .set_replication_interval(Some(Duration::from_secs(60 * 60))) // 1 hour
        .set_provider_record_ttl(Some(Duration::from_secs(24 * 60 * 60)));
    
    let store = kad::store::MemoryStore::new(local_peer_id);
    kad::Behaviour::with_config(local_peer_id, store, kad_config)
}

/// Create identify config
pub fn new_identify(local_public_key: libp2p::identity::PublicKey) -> identify::Behaviour {
    identify::Behaviour::new(identify::Config::new(
        "/cinq/identify/1.0.0".to_string(),
        local_public_key,
    ).with_push_listen_addr_updates(true))
}

/// Create AutoNAT client for NAT detection
pub fn new_autonat(local_peer_id: PeerId) -> autonat::Behaviour {
    autonat::Behaviour::new(
        local_peer_id,
        autonat::Config {
            retry_interval: Duration::from_secs(60),
            refresh_interval: Duration::from_secs(5 * 60),
            boot_delay: Duration::from_secs(10),
            throttle_server_period: Duration::from_secs(5),
            only_global_ips: false, // Also test local IPs for development
            ..Default::default()
        },
    )
}

/// Combined network behaviour for the Cinq node
#[derive(NetworkBehaviour)]
pub struct CinqBehaviour {
    /// mDNS for local network discovery
    pub mdns: libp2p::mdns::tokio::Behaviour,
    /// Kademlia DHT for global peer discovery
    pub kademlia: kad::Behaviour<kad::store::MemoryStore>,
    /// Protocol identification
    pub identify: identify::Behaviour,
    /// AutoNAT for NAT type detection
    pub autonat: autonat::Behaviour,
    /// DCUTR for NAT hole punching
    pub dcutr: dcutr::Behaviour,
    /// Relay client for connecting through relays when direct fails
    pub relay_client: relay::client::Behaviour,
    /// Our custom request-response protocol
    pub protocol: CinqProtocolBehaviour,
}
