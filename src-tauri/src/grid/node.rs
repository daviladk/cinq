// Cinq Grid Node - Core P2P networking using libp2p

use libp2p::{
    autonat, dcutr, identify, kad,
    identity::{self, Keypair},
    mdns, noise, relay,
    request_response::{self, ResponseChannel},
    swarm::SwarmEvent,
    tcp, yamux, Multiaddr, PeerId, Swarm,
};
use futures::StreamExt;
use std::collections::HashMap;
use std::error::Error;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{mpsc, RwLock};

use super::metrics::BandwidthMetrics;
use super::protocol::{
    CinqBehaviour, CinqBehaviourEvent, CinqRequest, CinqResponse, 
    new_cinq_protocol, new_kademlia, new_identify, new_autonat,
};
use super::proxy::{Socks5Proxy, ProxyConfig, ProxyStatus};
use super::tunnel::{TunnelManager, P2PMessage, P2PMessageData};

/// Represents a peer on the Cinq grid
#[derive(Debug, Clone, serde::Serialize)]
pub struct GridPeer {
    pub peer_id: String,
    pub addresses: Vec<String>,
    pub connected: bool,
    pub last_seen: u64,
}

/// Events emitted by the Cinq node
#[derive(Debug, Clone, serde::Serialize)]
#[serde(tag = "type")]
pub enum GridEvent {
    PeerDiscovered { peer_id: String, addresses: Vec<String> },
    PeerConnected { peer_id: String },
    PeerDisconnected { peer_id: String },
    FileReceived { from_peer: String, filename: String, size: u64 },
    TransferProgress { peer_id: String, bytes_transferred: u64, total_bytes: u64 },
    NatStatusChanged { nat_status: String },
    RelayReserved { relay_addr: String },
    Error { message: String },
}

/// Configuration for the Cinq node
#[derive(Debug, Clone)]
pub struct NodeConfig {
    /// Port to listen on (0 = random available port)
    pub listen_port: u16,
    /// Enable mDNS for local network discovery
    pub enable_mdns: bool,
    /// Directory to store received files
    pub download_dir: String,
}

impl Default for NodeConfig {
    fn default() -> Self {
        Self {
            listen_port: 0,
            enable_mdns: true,
            download_dir: "./cinq_downloads".to_string(),
        }
    }
}

/// The main Cinq Connect node
pub struct CinqNode {
    /// Our peer ID on the network
    pub local_peer_id: PeerId,
    /// Our keypair for signing/encryption
    keypair: Keypair,
    /// Known peers on the grid
    peers: Arc<RwLock<HashMap<PeerId, GridPeer>>>,
    /// Bandwidth metrics for billing
    pub metrics: Arc<RwLock<BandwidthMetrics>>,
    /// Channel to send commands to the swarm
    command_tx: Option<mpsc::Sender<NodeCommand>>,
    /// Channel to receive events from the swarm
    event_rx: Option<mpsc::Receiver<GridEvent>>,
    /// Node configuration
    config: NodeConfig,
    /// SOCKS5 proxy server
    proxy: Option<Socks5Proxy>,
    /// Tunnel manager for P2P proxy routing
    tunnel_manager: Arc<RwLock<TunnelManager>>,
}

/// Commands that can be sent to the running node
#[derive(Debug)]
pub enum NodeCommand {
    /// Connect to a specific peer
    ConnectPeer(Multiaddr),
    /// Send a file to a peer
    SendFile { peer_id: PeerId, file_path: String },
    /// Request file from peer
    RequestFile { peer_id: PeerId, filename: String },
    /// Get list of connected peers
    ListPeers,
    /// Bootstrap the Kademlia DHT
    BootstrapDht,
    /// Find peers on the DHT
    FindPeers,
    /// Shutdown the node
    Shutdown,
    /// Send a proxy request to a peer
    SendProxyRequest { peer_id: PeerId, request: CinqRequest },
    /// Send a proxy response to a peer (via pending channel)
    SendProxyResponse { channel_id: u64, response: CinqResponse },
}

impl CinqNode {
    /// Create a new Cinq node with default configuration
    pub fn new() -> Result<Self, Box<dyn Error + Send + Sync>> {
        Self::with_config(NodeConfig::default())
    }

    /// Create a new Cinq node with custom configuration
    pub fn with_config(config: NodeConfig) -> Result<Self, Box<dyn Error + Send + Sync>> {
        // Generate a new identity keypair
        let keypair = identity::Keypair::generate_ed25519();
        let local_peer_id = PeerId::from(keypair.public());

        log::info!("Cinq Node initialized with Peer ID: {}", local_peer_id);

        let metrics = Arc::new(RwLock::new(BandwidthMetrics::new()));
        let tunnel_manager = Arc::new(RwLock::new(TunnelManager::new(metrics.clone())));

        Ok(Self {
            local_peer_id,
            keypair,
            peers: Arc::new(RwLock::new(HashMap::new())),
            metrics,
            command_tx: None,
            event_rx: None,
            config,
            proxy: None,
            tunnel_manager,
        })
    }

    /// Get our peer ID as a string
    pub fn peer_id_string(&self) -> String {
        self.local_peer_id.to_string()
    }

    /// Start the node and begin listening for connections
    pub async fn start(&mut self) -> Result<(), Box<dyn Error + Send + Sync>> {
        let (command_tx, mut command_rx) = mpsc::channel::<NodeCommand>(100);
        let (event_tx, event_rx) = mpsc::channel::<GridEvent>(100);
        let (p2p_outbound_tx, mut p2p_outbound_rx) = mpsc::channel::<P2PMessage>(256);

        self.command_tx = Some(command_tx.clone());
        self.event_rx = Some(event_rx);

        // Configure tunnel manager with P2P channel
        {
            let mut tm = self.tunnel_manager.write().await;
            tm.set_p2p_outbound(p2p_outbound_tx.clone());
        }

        // Build the swarm
        let mut swarm = self.build_swarm()?;

        // Listen on all interfaces
        let listen_addr: Multiaddr = format!("/ip4/0.0.0.0/tcp/{}", self.config.listen_port)
            .parse()
            .expect("Valid multiaddr");
        
        swarm.listen_on(listen_addr)?;

        let peers = self.peers.clone();
        let tunnel_manager = self.tunnel_manager.clone();
        let metrics = self.metrics.clone();

        // Spawn the swarm event loop
        tokio::spawn(async move {
            loop {
                tokio::select! {
                    // Handle swarm events
                    event = swarm.select_next_some() => {
                        match event {
                            SwarmEvent::NewListenAddr { address, .. } => {
                                log::info!("Listening on: {}", address);
                            }
                            SwarmEvent::Behaviour(CinqBehaviourEvent::Mdns(mdns::Event::Discovered(peers_list))) => {
                                for (peer_id, addr) in peers_list {
                                    log::info!("Discovered peer: {} at {}", peer_id, addr);
                                    swarm.add_peer_address(peer_id, addr.clone());
                                    
                                    // AUTO-CONNECT: Immediately dial discovered peers to form mesh
                                    if !swarm.is_connected(&peer_id) {
                                        log::info!("Auto-connecting to peer: {}", peer_id);
                                        if let Err(e) = swarm.dial(peer_id) {
                                            log::warn!("Failed to auto-dial {}: {}", peer_id, e);
                                        }
                                    }
                                    
                                    let mut peers_guard = peers.write().await;
                                    let peer = peers_guard.entry(peer_id).or_insert(GridPeer {
                                        peer_id: peer_id.to_string(),
                                        addresses: vec![],
                                        connected: false,
                                        last_seen: std::time::SystemTime::now()
                                            .duration_since(std::time::UNIX_EPOCH)
                                            .unwrap()
                                            .as_secs(),
                                    });
                                    peer.addresses.push(addr.to_string());
                                    
                                    let _ = event_tx.send(GridEvent::PeerDiscovered {
                                        peer_id: peer_id.to_string(),
                                        addresses: peer.addresses.clone(),
                                    }).await;
                                }
                            }
                            SwarmEvent::Behaviour(CinqBehaviourEvent::Mdns(mdns::Event::Expired(peers_list))) => {
                                for (peer_id, _addr) in peers_list {
                                    log::info!("Peer expired: {}", peer_id);
                                    let mut peers_guard = peers.write().await;
                                    if let Some(peer) = peers_guard.get_mut(&peer_id) {
                                        peer.connected = false;
                                    }
                                    let _ = event_tx.send(GridEvent::PeerDisconnected {
                                        peer_id: peer_id.to_string(),
                                    }).await;
                                }
                            }
                            // Kademlia DHT events
                            SwarmEvent::Behaviour(CinqBehaviourEvent::Kademlia(kad_event)) => {
                                match kad_event {
                                    kad::Event::RoutingUpdated { peer, addresses, .. } => {
                                        log::info!("Kademlia: routing updated for peer {} with {} addresses", peer, addresses.len());
                                        // Add discovered peer to our list
                                        let mut peers_guard = peers.write().await;
                                        let addr_strings: Vec<String> = addresses.iter().map(|a| a.to_string()).collect();
                                        peers_guard.entry(peer).or_insert(GridPeer {
                                            peer_id: peer.to_string(),
                                            addresses: addr_strings.clone(),
                                            connected: false,
                                            last_seen: std::time::SystemTime::now()
                                                .duration_since(std::time::UNIX_EPOCH)
                                                .unwrap()
                                                .as_secs(),
                                        });
                                        let _ = event_tx.send(GridEvent::PeerDiscovered {
                                            peer_id: peer.to_string(),
                                            addresses: addr_strings,
                                        }).await;
                                    }
                                    kad::Event::OutboundQueryProgressed { result, .. } => {
                                        match result {
                                            kad::QueryResult::Bootstrap(Ok(kad::BootstrapOk { num_remaining, .. })) => {
                                                log::info!("Kademlia bootstrap progress: {} remaining", num_remaining);
                                            }
                                            kad::QueryResult::GetClosestPeers(Ok(kad::GetClosestPeersOk { peers: found_peers, .. })) => {
                                                log::info!("Kademlia: found {} closest peers", found_peers.len());
                                            }
                                            _ => {}
                                        }
                                    }
                                    _ => {}
                                }
                            }
                            // Identify protocol events
                            SwarmEvent::Behaviour(CinqBehaviourEvent::Identify(identify_event)) => {
                                match identify_event {
                                    identify::Event::Received { peer_id, info, .. } => {
                                        log::info!("Identify: peer {} is running {} ({})", 
                                            peer_id, info.protocol_version, info.agent_version);
                                        // Add peer's addresses to Kademlia
                                        for addr in info.listen_addrs {
                                            swarm.behaviour_mut().kademlia.add_address(&peer_id, addr);
                                        }
                                    }
                                    identify::Event::Sent { peer_id, .. } => {
                                        log::debug!("Identify: sent info to {}", peer_id);
                                    }
                                    _ => {}
                                }
                            }
                            // AutoNAT events - detect our NAT status
                            SwarmEvent::Behaviour(CinqBehaviourEvent::Autonat(autonat_event)) => {
                                match autonat_event {
                                    autonat::Event::StatusChanged { old, new } => {
                                        let status_str = match new {
                                            autonat::NatStatus::Public(addr) => format!("Public: {}", addr),
                                            autonat::NatStatus::Private => "Private (behind NAT)".to_string(),
                                            autonat::NatStatus::Unknown => "Unknown".to_string(),
                                        };
                                        log::info!("NAT status changed from {:?} to {}", old, status_str);
                                        let _ = event_tx.send(GridEvent::NatStatusChanged {
                                            nat_status: status_str,
                                        }).await;
                                    }
                                    _ => {}
                                }
                            }
                            // DCUTR (hole punching) events
                            SwarmEvent::Behaviour(CinqBehaviourEvent::Dcutr(dcutr_event)) => {
                                log::info!("DCUTR event: {:?}", dcutr_event);
                            }
                            // Relay client events
                            SwarmEvent::Behaviour(CinqBehaviourEvent::RelayClient(relay_event)) => {
                                match relay_event {
                                    relay::client::Event::ReservationReqAccepted { relay_peer_id, .. } => {
                                        log::info!("Relay: reservation accepted by {}", relay_peer_id);
                                    }
                                    _ => {}
                                }
                            }
                            SwarmEvent::Behaviour(CinqBehaviourEvent::Protocol(protocol_event)) => {
                                // Handle request-response protocol events
                                match protocol_event {
                                    request_response::Event::Message { peer, message } => {
                                        log::debug!("Protocol message from peer: {}", peer);
                                        match message {
                                            request_response::Message::Request { request, channel, .. } => {
                                                // Handle incoming request
                                                let response = match request {
                                                    CinqRequest::Ping => CinqResponse::Pong,
                                                    CinqRequest::GetPeerInfo => CinqResponse::PeerInfo {
                                                        peer_id: swarm.local_peer_id().to_string(),
                                                        version: "0.1.0".to_string(),
                                                        uptime_secs: 0,
                                                    },
                                                    CinqRequest::FileTransfer { filename, data, total_size } => {
                                                        log::info!("Received file: {} ({} bytes)", filename, total_size);
                                                        let _ = event_tx.send(GridEvent::FileReceived {
                                                            from_peer: peer.to_string(),
                                                            filename: filename.clone(),
                                                            size: total_size,
                                                        }).await;
                                                        CinqResponse::FileReceived {
                                                            filename,
                                                            bytes_received: data.len() as u64,
                                                            success: true,
                                                        }
                                                    }
                                                    // Handle ProxyConnect - we are the exit node
                                                    CinqRequest::ProxyConnect { tunnel_id, target_host, target_port } => {
                                                        log::info!("ProxyConnect request from {}: tunnel {} -> {}:{}", 
                                                            peer, tunnel_id, target_host, target_port);
                                                        
                                                        let tm = tunnel_manager.clone();
                                                        let result = tm.write().await.create_exit_tunnel(
                                                            tunnel_id, peer, target_host.clone(), target_port
                                                        ).await;
                                                        
                                                        match result {
                                                            Ok(()) => CinqResponse::ProxyConnected {
                                                                tunnel_id,
                                                                success: true,
                                                                error: None,
                                                            },
                                                            Err(e) => CinqResponse::ProxyConnected {
                                                                tunnel_id,
                                                                success: false,
                                                                error: Some(e),
                                                            },
                                                        }
                                                    }
                                                    // Handle ProxyData - forward to exit tunnel
                                                    CinqRequest::ProxyData { tunnel_id, data } => {
                                                        log::debug!("ProxyData from {}: tunnel {} ({} bytes)", 
                                                            peer, tunnel_id, data.len());
                                                        
                                                        let tm = tunnel_manager.clone();
                                                        tm.read().await.handle_exit_tunnel_data(tunnel_id, data).await;
                                                        
                                                        // No response needed for data packets
                                                        CinqResponse::Pong // Dummy ack
                                                    }
                                                    // Handle ProxyClose
                                                    CinqRequest::ProxyClose { tunnel_id } => {
                                                        log::info!("ProxyClose from {}: tunnel {}", peer, tunnel_id);
                                                        
                                                        let tm = tunnel_manager.clone();
                                                        tm.write().await.close_exit_tunnel(tunnel_id).await;
                                                        
                                                        CinqResponse::ProxyClosed { tunnel_id }
                                                    }
                                                    _ => CinqResponse::Error { message: "Not implemented".to_string() },
                                                };
                                                let _ = swarm.behaviour_mut().protocol.send_response(channel, response);
                                            }
                                            request_response::Message::Response { response, .. } => {
                                                // Handle responses to our requests (e.g., ProxyConnected)
                                                match response {
                                                    CinqResponse::ProxyConnected { tunnel_id, success, error } => {
                                                        log::info!("ProxyConnected response: tunnel {} success={}", tunnel_id, success);
                                                        let tm = tunnel_manager.clone();
                                                        tm.read().await.handle_tunnel_connected(tunnel_id, success, error).await;
                                                    }
                                                    CinqResponse::ProxyData { tunnel_id, data } => {
                                                        log::debug!("ProxyData response: tunnel {} ({} bytes)", tunnel_id, data.len());
                                                        let tm = tunnel_manager.clone();
                                                        tm.read().await.handle_client_tunnel_data(tunnel_id, data).await;
                                                    }
                                                    CinqResponse::ProxyClosed { tunnel_id } => {
                                                        log::info!("ProxyClosed response: tunnel {}", tunnel_id);
                                                        let tm = tunnel_manager.clone();
                                                        tm.write().await.close_client_tunnel(tunnel_id).await;
                                                    }
                                                    _ => {
                                                        log::debug!("Received response: {:?}", response);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    request_response::Event::OutboundFailure { peer, error, .. } => {
                                        log::error!("Outbound failure to {}: {:?}", peer, error);
                                    }
                                    request_response::Event::InboundFailure { peer, error, .. } => {
                                        log::error!("Inbound failure from {}: {:?}", peer, error);
                                    }
                                    request_response::Event::ResponseSent { peer, .. } => {
                                        log::debug!("Response sent to {}", peer);
                                    }
                                }
                            }
                            SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                                log::info!("Connected to peer: {}", peer_id);
                                let mut peers_guard = peers.write().await;
                                if let Some(peer) = peers_guard.get_mut(&peer_id) {
                                    peer.connected = true;
                                }
                                let _ = event_tx.send(GridEvent::PeerConnected {
                                    peer_id: peer_id.to_string(),
                                }).await;
                            }
                            SwarmEvent::ConnectionClosed { peer_id, .. } => {
                                log::info!("Disconnected from peer: {}", peer_id);
                                let mut peers_guard = peers.write().await;
                                if let Some(peer) = peers_guard.get_mut(&peer_id) {
                                    peer.connected = false;
                                }
                                let _ = event_tx.send(GridEvent::PeerDisconnected {
                                    peer_id: peer_id.to_string(),
                                }).await;
                            }
                            _ => {}
                        }
                    }
                    // Handle commands from the application
                    Some(command) = command_rx.recv() => {
                        match command {
                            NodeCommand::ConnectPeer(addr) => {
                                if let Err(e) = swarm.dial(addr.clone()) {
                                    log::error!("Failed to dial {}: {}", addr, e);
                                }
                            }
                            NodeCommand::BootstrapDht => {
                                log::info!("Bootstrapping Kademlia DHT...");
                                if let Err(e) = swarm.behaviour_mut().kademlia.bootstrap() {
                                    log::warn!("Failed to bootstrap DHT: {:?}", e);
                                }
                            }
                            NodeCommand::FindPeers => {
                                log::info!("Searching for peers on DHT...");
                                let random_peer = PeerId::random();
                                swarm.behaviour_mut().kademlia.get_closest_peers(random_peer);
                            }
                            NodeCommand::Shutdown => {
                                log::info!("Shutting down Cinq node");
                                break;
                            }
                            NodeCommand::SendProxyRequest { peer_id, request } => {
                                log::debug!("Sending proxy request to peer {}", peer_id);
                                swarm.behaviour_mut().protocol.send_request(&peer_id, request);
                            }
                            _ => {
                                // TODO: Handle other commands
                            }
                        }
                    }
                    // Handle outbound P2P messages from tunnel manager
                    Some(msg) = p2p_outbound_rx.recv() => {
                        let request = match msg.data {
                            P2PMessageData::Connect { host, port } => {
                                CinqRequest::ProxyConnect {
                                    tunnel_id: msg.tunnel_id,
                                    target_host: host,
                                    target_port: port,
                                }
                            }
                            P2PMessageData::Data(data) => {
                                CinqRequest::ProxyData {
                                    tunnel_id: msg.tunnel_id,
                                    data,
                                }
                            }
                            P2PMessageData::Close => {
                                CinqRequest::ProxyClose {
                                    tunnel_id: msg.tunnel_id,
                                }
                            }
                            P2PMessageData::Connected { .. } => {
                                // This is a response, not handled here
                                continue;
                            }
                        };
                        log::debug!("Sending P2P message to peer {}: tunnel {}", msg.peer_id, msg.tunnel_id);
                        swarm.behaviour_mut().protocol.send_request(&msg.peer_id, request);
                    }
                }
            }
        });

        Ok(())
    }

    /// Build the libp2p swarm with our custom behaviour
    fn build_swarm(&self) -> Result<Swarm<CinqBehaviour>, Box<dyn Error + Send + Sync>> {
        let swarm = libp2p::SwarmBuilder::with_existing_identity(self.keypair.clone())
            .with_tokio()
            .with_tcp(
                tcp::Config::default(),
                noise::Config::new,
                yamux::Config::default,
            )?
            .with_relay_client(noise::Config::new, yamux::Config::default)?
            .with_behaviour(|key, relay_client| {
                let local_peer_id = key.public().to_peer_id();
                
                // mDNS for local discovery
                let mdns = mdns::tokio::Behaviour::new(
                    mdns::Config::default(),
                    local_peer_id,
                )?;
                
                // Kademlia DHT for global discovery
                let kademlia = new_kademlia(local_peer_id);
                
                // Identify protocol
                let identify = new_identify(key.public());
                
                // AutoNAT for NAT detection
                let autonat = new_autonat(local_peer_id);
                
                // DCUTR for hole punching
                let dcutr = dcutr::Behaviour::new(local_peer_id);
                
                // Our custom protocol
                let protocol = new_cinq_protocol();
                
                Ok(CinqBehaviour { 
                    mdns, 
                    kademlia,
                    identify,
                    autonat,
                    dcutr,
                    relay_client,
                    protocol,
                })
            })?
            .with_swarm_config(|c| c.with_idle_connection_timeout(Duration::from_secs(60)))
            .build();

        Ok(swarm)
    }

    /// Get list of discovered peers
    pub async fn get_peers(&self) -> Vec<GridPeer> {
        let peers = self.peers.read().await;
        peers.values().cloned().collect()
    }

    /// Connect to a peer by multiaddress
    pub async fn connect(&self, addr: &str) -> Result<(), Box<dyn Error + Send + Sync>> {
        let multiaddr: Multiaddr = addr.parse()?;
        if let Some(tx) = &self.command_tx {
            tx.send(NodeCommand::ConnectPeer(multiaddr)).await?;
        }
        Ok(())
    }

    /// Get the next event from the node
    pub async fn next_event(&mut self) -> Option<GridEvent> {
        if let Some(rx) = &mut self.event_rx {
            rx.recv().await
        } else {
            None
        }
    }

    /// Shutdown the node
    pub async fn shutdown(&self) -> Result<(), Box<dyn Error + Send + Sync>> {
        if let Some(tx) = &self.command_tx {
            tx.send(NodeCommand::Shutdown).await?;
        }
        Ok(())
    }

    // =========================================================================
    // SOCKS5 Proxy Methods
    // =========================================================================

    /// Start the SOCKS5 proxy on the specified port
    pub async fn start_proxy(&mut self, port: u16) -> Result<(), Box<dyn Error + Send + Sync>> {
        if self.proxy.is_some() {
            return Err("Proxy is already running".into());
        }

        let config = ProxyConfig {
            listen_port: port,
            route_through_peers: true,
            max_connections: 100,
        };

        let mut proxy = Socks5Proxy::with_config(config, self.metrics.clone());
        
        // Give proxy access to tunnel manager for P2P routing
        proxy.set_tunnel_manager(self.tunnel_manager.clone());
        
        proxy.start().await?;
        
        self.proxy = Some(proxy);
        log::info!("SOCKS5 proxy started on port {}", port);
        
        Ok(())
    }

    /// Stop the SOCKS5 proxy
    pub async fn stop_proxy(&mut self) -> Result<(), Box<dyn Error + Send + Sync>> {
        if let Some(mut proxy) = self.proxy.take() {
            proxy.stop().await?;
            log::info!("SOCKS5 proxy stopped");
        }
        Ok(())
    }

    /// Get the proxy status
    pub async fn proxy_status(&self) -> ProxyStatus {
        match &self.proxy {
            Some(proxy) => proxy.status().await,
            None => ProxyStatus {
                running: false,
                listen_address: String::new(),
                active_connections: 0,
                total_bytes_proxied: 0,
                exit_peer: None,
            },
        }
    }

    /// Check if proxy is running
    pub async fn is_proxy_running(&self) -> bool {
        match &self.proxy {
            Some(proxy) => proxy.is_running().await,
            None => false,
        }
    }

    // =========================================================================
    // P2P Tunnel Methods  
    // =========================================================================

    /// Get the tunnel manager
    pub fn tunnel_manager(&self) -> Arc<RwLock<TunnelManager>> {
        self.tunnel_manager.clone()
    }

    /// Get a random connected peer for use as exit node
    pub async fn get_exit_peer(&self) -> Option<PeerId> {
        let peers = self.peers.read().await;
        peers.values()
            .filter(|p| p.connected)
            .next()
            .and_then(|p| p.peer_id.parse().ok())
    }

    /// Get list of connected peer IDs
    pub async fn get_connected_peer_ids(&self) -> Vec<PeerId> {
        let peers = self.peers.read().await;
        peers.values()
            .filter(|p| p.connected)
            .filter_map(|p| p.peer_id.parse().ok())
            .collect()
    }
}
