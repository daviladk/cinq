// Cinq Tunnel Manager - Manages P2P proxy tunnels
//
// This module handles the relay of traffic between SOCKS5 clients and exit peers.
// When a user wants to route traffic through a peer:
// 1. Client sends ProxyConnect to exit peer
// 2. Exit peer connects to target and creates a tunnel
// 3. ProxyData messages flow bidirectionally through the tunnel
// 4. ProxyClose terminates the tunnel

use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};
use tokio::net::TcpStream;
use tokio::sync::{mpsc, RwLock, oneshot};
use tokio::io::{AsyncReadExt, AsyncWriteExt, ReadHalf, WriteHalf};
use libp2p::PeerId;

use super::metrics::BandwidthMetrics;

/// Unique tunnel identifier
pub type TunnelId = u64;

/// Global tunnel ID counter
static TUNNEL_ID_COUNTER: AtomicU64 = AtomicU64::new(1);

/// Generate a new unique tunnel ID
pub fn new_tunnel_id() -> TunnelId {
    TUNNEL_ID_COUNTER.fetch_add(1, Ordering::SeqCst)
}

/// Represents an active tunnel on the exit node side
/// The exit node maintains a TCP connection to the actual target
pub struct ExitTunnel {
    pub tunnel_id: TunnelId,
    pub target_host: String,
    pub target_port: u16,
    /// Channel to send data to the target
    pub to_target_tx: mpsc::Sender<Vec<u8>>,
    /// Channel to receive data from the target
    pub from_target_rx: Option<mpsc::Receiver<Vec<u8>>>,
    /// Bytes sent through this tunnel
    pub bytes_sent: u64,
    /// Bytes received through this tunnel
    pub bytes_received: u64,
    /// The peer we're providing exit service to
    pub client_peer: PeerId,
}

/// Represents an active tunnel on the client side
/// The client routes SOCKS5 traffic through a peer
pub struct ClientTunnel {
    pub tunnel_id: TunnelId,
    pub target_host: String,
    pub target_port: u16,
    /// The peer acting as our exit node
    pub exit_peer: PeerId,
    /// Channel to send data to the exit peer (via P2P)
    pub to_peer_tx: mpsc::Sender<Vec<u8>>,
    /// Channel to receive data from the exit peer
    pub from_peer_rx: Option<mpsc::Receiver<Vec<u8>>>,
    /// Signal when tunnel is ready
    pub ready_tx: Option<oneshot::Sender<Result<(), String>>>,
    /// Bytes sent through this tunnel
    pub bytes_sent: u64,
    /// Bytes received through this tunnel
    pub bytes_received: u64,
}

/// Manages all active tunnels (both client and exit side)
pub struct TunnelManager {
    /// Tunnels where we are the exit node (serving other peers)
    exit_tunnels: Arc<RwLock<HashMap<TunnelId, ExitTunnel>>>,
    /// Tunnels where we are the client (using other peers as exit)
    client_tunnels: Arc<RwLock<HashMap<TunnelId, ClientTunnel>>>,
    /// Bandwidth metrics
    metrics: Arc<RwLock<BandwidthMetrics>>,
    /// Channel for outgoing P2P messages (to send ProxyData to peers)
    p2p_outbound_tx: Option<mpsc::Sender<P2PMessage>>,
}

/// Message to send through P2P network
#[derive(Debug, Clone)]
pub struct P2PMessage {
    pub peer_id: PeerId,
    pub tunnel_id: TunnelId,
    pub data: P2PMessageData,
}

#[derive(Debug, Clone)]
pub enum P2PMessageData {
    Connect { host: String, port: u16 },
    Connected { success: bool, error: Option<String> },
    Data(Vec<u8>),
    Close,
}

impl TunnelManager {
    pub fn new(metrics: Arc<RwLock<BandwidthMetrics>>) -> Self {
        Self {
            exit_tunnels: Arc::new(RwLock::new(HashMap::new())),
            client_tunnels: Arc::new(RwLock::new(HashMap::new())),
            metrics,
            p2p_outbound_tx: None,
        }
    }

    /// Set the channel for sending P2P messages
    pub fn set_p2p_outbound(&mut self, tx: mpsc::Sender<P2PMessage>) {
        self.p2p_outbound_tx = Some(tx);
    }

    /// Get channel for P2P outbound messages
    pub fn get_p2p_outbound(&self) -> Option<mpsc::Sender<P2PMessage>> {
        self.p2p_outbound_tx.clone()
    }

    // =========================================================================
    // Client-side methods (we want to route traffic through a peer)
    // =========================================================================

    /// Create a new client tunnel to route traffic through an exit peer
    pub async fn create_client_tunnel(
        &self,
        exit_peer: PeerId,
        target_host: String,
        target_port: u16,
    ) -> Result<(TunnelId, mpsc::Sender<Vec<u8>>, mpsc::Receiver<Vec<u8>>, oneshot::Receiver<Result<(), String>>), String> {
        let tunnel_id = new_tunnel_id();
        
        // Channels for data flow
        let (to_peer_tx, _to_peer_rx) = mpsc::channel::<Vec<u8>>(256);
        let (from_peer_tx, from_peer_rx) = mpsc::channel::<Vec<u8>>(256);
        let (ready_tx, ready_rx) = oneshot::channel();
        
        let tunnel = ClientTunnel {
            tunnel_id,
            target_host: target_host.clone(),
            target_port,
            exit_peer,
            to_peer_tx: from_peer_tx, // This is what the P2P layer uses to send data TO us
            from_peer_rx: None, // We don't store this, caller keeps it
            ready_tx: Some(ready_tx),
            bytes_sent: 0,
            bytes_received: 0,
        };
        
        {
            let mut tunnels = self.client_tunnels.write().await;
            tunnels.insert(tunnel_id, tunnel);
        }
        
        // Send connect request to exit peer via P2P
        if let Some(tx) = &self.p2p_outbound_tx {
            let msg = P2PMessage {
                peer_id: exit_peer,
                tunnel_id,
                data: P2PMessageData::Connect { 
                    host: target_host, 
                    port: target_port 
                },
            };
            tx.send(msg).await.map_err(|e| format!("Failed to send connect request: {}", e))?;
        } else {
            return Err("P2P outbound channel not configured".to_string());
        }
        
        Ok((tunnel_id, to_peer_tx, from_peer_rx, ready_rx))
    }

    /// Handle ProxyConnected response from exit peer
    pub async fn handle_tunnel_connected(&self, tunnel_id: TunnelId, success: bool, error: Option<String>) {
        let mut tunnels = self.client_tunnels.write().await;
        if let Some(tunnel) = tunnels.get_mut(&tunnel_id) {
            if let Some(ready_tx) = tunnel.ready_tx.take() {
                let result = if success {
                    Ok(())
                } else {
                    Err(error.unwrap_or_else(|| "Unknown error".to_string()))
                };
                let _ = ready_tx.send(result);
            }
        }
    }

    /// Handle incoming data from exit peer for a client tunnel
    pub async fn handle_client_tunnel_data(&self, tunnel_id: TunnelId, data: Vec<u8>) {
        let tunnels = self.client_tunnels.read().await;
        if let Some(tunnel) = tunnels.get(&tunnel_id) {
            if let Err(e) = tunnel.to_peer_tx.send(data).await {
                log::error!("Failed to forward data to client tunnel {}: {}", tunnel_id, e);
            }
        }
    }

    /// Send data through a client tunnel (to the exit peer)
    pub async fn send_through_client_tunnel(&self, tunnel_id: TunnelId, data: Vec<u8>) -> Result<(), String> {
        let tunnels = self.client_tunnels.read().await;
        if let Some(tunnel) = tunnels.get(&tunnel_id) {
            if let Some(tx) = &self.p2p_outbound_tx {
                let msg = P2PMessage {
                    peer_id: tunnel.exit_peer,
                    tunnel_id,
                    data: P2PMessageData::Data(data),
                };
                tx.send(msg).await.map_err(|e| format!("Failed to send data: {}", e))?;
                Ok(())
            } else {
                Err("P2P outbound not configured".to_string())
            }
        } else {
            Err(format!("Tunnel {} not found", tunnel_id))
        }
    }

    /// Close a client tunnel
    pub async fn close_client_tunnel(&self, tunnel_id: TunnelId) {
        // Send close message to exit peer
        let exit_peer = {
            let tunnels = self.client_tunnels.read().await;
            tunnels.get(&tunnel_id).map(|t| t.exit_peer)
        };
        
        if let (Some(peer), Some(tx)) = (exit_peer, &self.p2p_outbound_tx) {
            let msg = P2PMessage {
                peer_id: peer,
                tunnel_id,
                data: P2PMessageData::Close,
            };
            let _ = tx.send(msg).await;
        }
        
        // Remove the tunnel
        let mut tunnels = self.client_tunnels.write().await;
        tunnels.remove(&tunnel_id);
    }

    // =========================================================================
    // Exit-node side methods (we are routing traffic for another peer)
    // =========================================================================

    /// Handle incoming ProxyConnect request - create exit tunnel and connect to target
    pub async fn create_exit_tunnel(
        &self,
        tunnel_id: TunnelId,
        client_peer: PeerId,
        target_host: String,
        target_port: u16,
    ) -> Result<(), String> {
        let target_addr = format!("{}:{}", target_host, target_port);
        
        log::info!("Exit tunnel {}: connecting to {} for peer {}", tunnel_id, target_addr, client_peer);
        
        // Connect to the actual target
        let stream = TcpStream::connect(&target_addr).await
            .map_err(|e| format!("Failed to connect to {}: {}", target_addr, e))?;
        
        let (read_half, write_half) = tokio::io::split(stream);
        
        // Channels for bidirectional data flow
        let (to_target_tx, to_target_rx) = mpsc::channel::<Vec<u8>>(256);
        let (_from_target_tx, from_target_rx) = mpsc::channel::<Vec<u8>>(256);
        
        let tunnel = ExitTunnel {
            tunnel_id,
            target_host: target_host.clone(),
            target_port,
            to_target_tx,
            from_target_rx: Some(from_target_rx),
            bytes_sent: 0,
            bytes_received: 0,
            client_peer,
        };
        
        {
            let mut tunnels = self.exit_tunnels.write().await;
            tunnels.insert(tunnel_id, tunnel);
        }
        
        // Spawn task to read from target and forward to client peer
        let p2p_tx = self.p2p_outbound_tx.clone();
        let metrics = self.metrics.clone();
        let exit_tunnels = self.exit_tunnels.clone();
        
        tokio::spawn(async move {
            Self::exit_tunnel_read_loop(
                tunnel_id, 
                client_peer, 
                read_half, 
                p2p_tx,
                metrics.clone(),
                exit_tunnels.clone(),
            ).await;
        });
        
        // Spawn task to write to target from incoming P2P data
        let metrics = self.metrics.clone();
        let exit_tunnels = self.exit_tunnels.clone();
        
        tokio::spawn(async move {
            Self::exit_tunnel_write_loop(
                tunnel_id,
                client_peer,
                write_half,
                to_target_rx,
                metrics,
                exit_tunnels,
            ).await;
        });
        
        // Send success response
        if let Some(tx) = &self.p2p_outbound_tx {
            let msg = P2PMessage {
                peer_id: client_peer,
                tunnel_id,
                data: P2PMessageData::Connected { success: true, error: None },
            };
            let _ = tx.send(msg).await;
        }
        
        Ok(())
    }

    /// Read loop for exit tunnel - reads from target TCP and sends to client peer
    async fn exit_tunnel_read_loop(
        tunnel_id: TunnelId,
        client_peer: PeerId,
        mut read_half: ReadHalf<TcpStream>,
        p2p_tx: Option<mpsc::Sender<P2PMessage>>,
        metrics: Arc<RwLock<BandwidthMetrics>>,
        tunnels: Arc<RwLock<HashMap<TunnelId, ExitTunnel>>>,
    ) {
        let mut buf = [0u8; 8192];
        
        loop {
            match read_half.read(&mut buf).await {
                Ok(0) => {
                    log::info!("Exit tunnel {}: target closed connection", tunnel_id);
                    break;
                }
                Ok(n) => {
                    let data = buf[..n].to_vec();
                    
                    // Update metrics
                    {
                        let mut m = metrics.write().await;
                        m.record_sent(&client_peer.to_string(), n as u64);
                    }
                    
                    // Update tunnel bytes
                    {
                        let mut t = tunnels.write().await;
                        if let Some(tunnel) = t.get_mut(&tunnel_id) {
                            tunnel.bytes_received += n as u64;
                        }
                    }
                    
                    // Send to client peer via P2P
                    if let Some(tx) = &p2p_tx {
                        let msg = P2PMessage {
                            peer_id: client_peer,
                            tunnel_id,
                            data: P2PMessageData::Data(data),
                        };
                        if tx.send(msg).await.is_err() {
                            log::error!("Exit tunnel {}: failed to send to P2P", tunnel_id);
                            break;
                        }
                    }
                }
                Err(e) => {
                    log::error!("Exit tunnel {}: read error: {}", tunnel_id, e);
                    break;
                }
            }
        }
        
        // Send close message
        if let Some(tx) = &p2p_tx {
            let msg = P2PMessage {
                peer_id: client_peer,
                tunnel_id,
                data: P2PMessageData::Close,
            };
            let _ = tx.send(msg).await;
        }
        
        // Remove tunnel
        let mut t = tunnels.write().await;
        t.remove(&tunnel_id);
    }

    /// Write loop for exit tunnel - receives data from client peer and writes to target
    async fn exit_tunnel_write_loop(
        tunnel_id: TunnelId,
        client_peer: PeerId,
        mut write_half: WriteHalf<TcpStream>,
        mut from_peer_rx: mpsc::Receiver<Vec<u8>>,
        metrics: Arc<RwLock<BandwidthMetrics>>,
        tunnels: Arc<RwLock<HashMap<TunnelId, ExitTunnel>>>,
    ) {
        while let Some(data) = from_peer_rx.recv().await {
            let len = data.len();
            
            if let Err(e) = write_half.write_all(&data).await {
                log::error!("Exit tunnel {}: write error: {}", tunnel_id, e);
                break;
            }
            
            // Update metrics
            {
                let mut m = metrics.write().await;
                m.record_received(&client_peer.to_string(), len as u64);
            }
            
            // Update tunnel bytes
            {
                let mut t = tunnels.write().await;
                if let Some(tunnel) = t.get_mut(&tunnel_id) {
                    tunnel.bytes_sent += len as u64;
                }
            }
        }
        
        log::info!("Exit tunnel {}: write loop ended", tunnel_id);
    }

    /// Handle incoming ProxyData for an exit tunnel
    pub async fn handle_exit_tunnel_data(&self, tunnel_id: TunnelId, data: Vec<u8>) {
        let tunnels = self.exit_tunnels.read().await;
        if let Some(tunnel) = tunnels.get(&tunnel_id) {
            if let Err(e) = tunnel.to_target_tx.send(data).await {
                log::error!("Exit tunnel {}: failed to forward data: {}", tunnel_id, e);
            }
        } else {
            log::warn!("Exit tunnel {}: tunnel not found", tunnel_id);
        }
    }

    /// Handle ProxyClose for an exit tunnel
    pub async fn close_exit_tunnel(&self, tunnel_id: TunnelId) {
        let mut tunnels = self.exit_tunnels.write().await;
        if tunnels.remove(&tunnel_id).is_some() {
            log::info!("Exit tunnel {} closed", tunnel_id);
        }
    }

    // =========================================================================
    // Stats and info
    // =========================================================================

    /// Get count of active exit tunnels
    pub async fn exit_tunnel_count(&self) -> usize {
        self.exit_tunnels.read().await.len()
    }

    /// Get count of active client tunnels  
    pub async fn client_tunnel_count(&self) -> usize {
        self.client_tunnels.read().await.len()
    }
}
