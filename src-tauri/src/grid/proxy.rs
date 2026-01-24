// Cinq SOCKS5 Proxy - Routes traffic through P2P mesh
//
// This provides a local SOCKS5 proxy server that forwards traffic through
// connected peers on the Cinq network, enabling decentralized bandwidth sharing.

use std::net::SocketAddr;
use std::sync::Arc;
use std::io;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{mpsc, RwLock, broadcast};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use libp2p::PeerId;

use super::metrics::BandwidthMetrics;

/// SOCKS5 protocol constants
const SOCKS5_VERSION: u8 = 0x05;
const SOCKS5_AUTH_NONE: u8 = 0x00;
const SOCKS5_CMD_CONNECT: u8 = 0x01;
const SOCKS5_ATYP_IPV4: u8 = 0x01;
const SOCKS5_ATYP_DOMAIN: u8 = 0x03;
const SOCKS5_ATYP_IPV6: u8 = 0x04;
const SOCKS5_REP_SUCCESS: u8 = 0x00;
const SOCKS5_REP_FAILURE: u8 = 0x01;
const SOCKS5_REP_NOT_ALLOWED: u8 = 0x02;
const SOCKS5_REP_NETWORK_UNREACHABLE: u8 = 0x03;
const SOCKS5_REP_HOST_UNREACHABLE: u8 = 0x04;
const SOCKS5_REP_CONNECTION_REFUSED: u8 = 0x05;

/// Proxy configuration
#[derive(Debug, Clone)]
pub struct ProxyConfig {
    /// Local port to listen on for SOCKS5 connections
    pub listen_port: u16,
    /// Whether to route through peers (true) or direct connect (false for testing)
    pub route_through_peers: bool,
    /// Maximum concurrent connections
    pub max_connections: usize,
}

impl Default for ProxyConfig {
    fn default() -> Self {
        Self {
            listen_port: 1080, // Standard SOCKS5 port
            route_through_peers: true,
            max_connections: 100,
        }
    }
}

/// Proxy status information
#[derive(Debug, Clone, serde::Serialize)]
pub struct ProxyStatus {
    pub running: bool,
    pub listen_address: String,
    pub active_connections: usize,
    pub total_bytes_proxied: u64,
    pub exit_peer: Option<String>,
}

/// Events from the proxy
#[derive(Debug, Clone)]
pub enum ProxyEvent {
    /// Client connected to SOCKS5 proxy
    ClientConnected { client_addr: SocketAddr },
    /// Client disconnected
    ClientDisconnected { client_addr: SocketAddr },
    /// Connection established through peer
    TunnelOpened { target: String, via_peer: Option<PeerId> },
    /// Tunnel closed
    TunnelClosed { target: String },
    /// Bytes transferred
    BytesTransferred { bytes_sent: u64, bytes_received: u64 },
    /// Error occurred
    Error { message: String },
}

/// The SOCKS5 proxy server
pub struct Socks5Proxy {
    config: ProxyConfig,
    /// Metrics tracking
    metrics: Arc<RwLock<BandwidthMetrics>>,
    /// Shutdown signal sender
    shutdown_tx: Option<broadcast::Sender<()>>,
    /// Current status
    status: Arc<RwLock<ProxyStatus>>,
    /// Channel for sending proxy requests to the P2P layer
    tunnel_request_tx: Option<mpsc::Sender<TunnelRequest>>,
}

/// A request to open a tunnel through the P2P network
#[derive(Debug, Clone)]
pub struct TunnelRequest {
    /// Target host
    pub host: String,
    /// Target port
    pub port: u16,
    /// Request ID for matching responses
    pub request_id: u64,
    /// Response channel
    pub response_tx: mpsc::Sender<TunnelResponse>,
}

/// Response to a tunnel request
#[derive(Debug, Clone)]
pub enum TunnelResponse {
    /// Tunnel established - data can be sent
    Established { peer_id: PeerId },
    /// Tunnel failed
    Failed { reason: String },
    /// Data received from tunnel
    Data { data: Vec<u8> },
    /// Tunnel closed
    Closed,
}

impl Socks5Proxy {
    /// Create a new SOCKS5 proxy
    pub fn new(metrics: Arc<RwLock<BandwidthMetrics>>) -> Self {
        Self {
            config: ProxyConfig::default(),
            metrics,
            shutdown_tx: None,
            status: Arc::new(RwLock::new(ProxyStatus {
                running: false,
                listen_address: String::new(),
                active_connections: 0,
                total_bytes_proxied: 0,
                exit_peer: None,
            })),
            tunnel_request_tx: None,
        }
    }

    /// Create with custom configuration
    pub fn with_config(config: ProxyConfig, metrics: Arc<RwLock<BandwidthMetrics>>) -> Self {
        Self {
            config,
            metrics,
            shutdown_tx: None,
            status: Arc::new(RwLock::new(ProxyStatus {
                running: false,
                listen_address: String::new(),
                active_connections: 0,
                total_bytes_proxied: 0,
                exit_peer: None,
            })),
            tunnel_request_tx: None,
        }
    }

    /// Start the SOCKS5 proxy server
    pub async fn start(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let listen_addr = format!("127.0.0.1:{}", self.config.listen_port);
        let listener = TcpListener::bind(&listen_addr).await?;
        
        log::info!("SOCKS5 proxy listening on {}", listen_addr);
        
        let (shutdown_tx, _) = broadcast::channel::<()>(1);
        self.shutdown_tx = Some(shutdown_tx.clone());
        
        // Update status
        {
            let mut status = self.status.write().await;
            status.running = true;
            status.listen_address = listen_addr.clone();
        }
        
        let status = self.status.clone();
        let metrics = self.metrics.clone();
        let route_through_peers = self.config.route_through_peers;
        
        // Spawn the accept loop
        tokio::spawn(async move {
            let mut shutdown_rx = shutdown_tx.subscribe();
            
            loop {
                tokio::select! {
                    // Accept new connections
                    result = listener.accept() => {
                        match result {
                            Ok((stream, client_addr)) => {
                                log::info!("SOCKS5 client connected: {}", client_addr);
                                
                                // Update active connections
                                {
                                    let mut s = status.write().await;
                                    s.active_connections += 1;
                                }
                                
                                let status_clone = status.clone();
                                let metrics_clone = metrics.clone();
                                
                                // Handle the connection
                                tokio::spawn(async move {
                                    if let Err(e) = handle_socks5_connection(
                                        stream,
                                        client_addr,
                                        route_through_peers,
                                        metrics_clone,
                                    ).await {
                                        log::error!("SOCKS5 connection error: {}", e);
                                    }
                                    
                                    // Decrement active connections
                                    let mut s = status_clone.write().await;
                                    s.active_connections = s.active_connections.saturating_sub(1);
                                });
                            }
                            Err(e) => {
                                log::error!("Failed to accept connection: {}", e);
                            }
                        }
                    }
                    // Shutdown signal
                    _ = shutdown_rx.recv() => {
                        log::info!("SOCKS5 proxy shutting down");
                        break;
                    }
                }
            }
            
            // Mark as stopped
            let mut s = status.write().await;
            s.running = false;
        });
        
        Ok(())
    }

    /// Stop the SOCKS5 proxy
    pub async fn stop(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(());
        }
        
        let mut status = self.status.write().await;
        status.running = false;
        
        log::info!("SOCKS5 proxy stopped");
        Ok(())
    }

    /// Get current proxy status
    pub async fn status(&self) -> ProxyStatus {
        self.status.read().await.clone()
    }

    /// Check if proxy is running
    pub async fn is_running(&self) -> bool {
        self.status.read().await.running
    }
}

/// Handle a single SOCKS5 client connection
async fn handle_socks5_connection(
    mut stream: TcpStream,
    client_addr: SocketAddr,
    route_through_peers: bool,
    metrics: Arc<RwLock<BandwidthMetrics>>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Step 1: Authentication handshake
    let mut buf = [0u8; 258];
    
    // Read: version + number of auth methods + auth methods
    let n = stream.read(&mut buf[..2]).await?;
    if n < 2 {
        return Err("Connection closed during handshake".into());
    }
    
    let version = buf[0];
    let nmethods = buf[1] as usize;
    
    if version != SOCKS5_VERSION {
        return Err(format!("Unsupported SOCKS version: {}", version).into());
    }
    
    // Read auth methods
    stream.read_exact(&mut buf[..nmethods]).await?;
    
    // We only support "no auth" for now
    // Respond: version + chosen method
    stream.write_all(&[SOCKS5_VERSION, SOCKS5_AUTH_NONE]).await?;
    
    // Step 2: Connection request
    // Read: version + command + reserved + address type
    stream.read_exact(&mut buf[..4]).await?;
    
    let version = buf[0];
    let cmd = buf[1];
    // reserved byte at buf[2]
    let atyp = buf[3];
    
    if version != SOCKS5_VERSION {
        return Err("Invalid SOCKS version in request".into());
    }
    
    if cmd != SOCKS5_CMD_CONNECT {
        // Only CONNECT is supported
        send_socks5_reply(&mut stream, SOCKS5_REP_NOT_ALLOWED).await?;
        return Err("Only CONNECT command is supported".into());
    }
    
    // Parse target address based on address type
    let (target_host, target_port) = match atyp {
        SOCKS5_ATYP_IPV4 => {
            // Read 4 bytes of IPv4 + 2 bytes port
            let mut addr_buf = [0u8; 6];
            stream.read_exact(&mut addr_buf).await?;
            let ip = format!("{}.{}.{}.{}", addr_buf[0], addr_buf[1], addr_buf[2], addr_buf[3]);
            let port = u16::from_be_bytes([addr_buf[4], addr_buf[5]]);
            (ip, port)
        }
        SOCKS5_ATYP_DOMAIN => {
            // Read domain length + domain + port
            let mut len_buf = [0u8; 1];
            stream.read_exact(&mut len_buf).await?;
            let domain_len = len_buf[0] as usize;
            
            let mut domain_buf = vec![0u8; domain_len + 2];
            stream.read_exact(&mut domain_buf).await?;
            
            let domain = String::from_utf8_lossy(&domain_buf[..domain_len]).to_string();
            let port = u16::from_be_bytes([domain_buf[domain_len], domain_buf[domain_len + 1]]);
            (domain, port)
        }
        SOCKS5_ATYP_IPV6 => {
            // Read 16 bytes of IPv6 + 2 bytes port
            let mut addr_buf = [0u8; 18];
            stream.read_exact(&mut addr_buf).await?;
            let ip = format!(
                "{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}",
                addr_buf[0], addr_buf[1], addr_buf[2], addr_buf[3],
                addr_buf[4], addr_buf[5], addr_buf[6], addr_buf[7],
                addr_buf[8], addr_buf[9], addr_buf[10], addr_buf[11],
                addr_buf[12], addr_buf[13], addr_buf[14], addr_buf[15]
            );
            let port = u16::from_be_bytes([addr_buf[16], addr_buf[17]]);
            (ip, port)
        }
        _ => {
            send_socks5_reply(&mut stream, SOCKS5_REP_FAILURE).await?;
            return Err(format!("Unsupported address type: {}", atyp).into());
        }
    };
    
    log::info!("SOCKS5 CONNECT request: {}:{}", target_host, target_port);
    
    // Step 3: Connect to target
    // For now, we do direct connection. In the full implementation,
    // this would route through a peer on the Cinq network.
    
    let target_addr = if route_through_peers {
        // TODO: Route through P2P peer
        // For now, fall back to direct connection
        format!("{}:{}", target_host, target_port)
    } else {
        format!("{}:{}", target_host, target_port)
    };
    
    match TcpStream::connect(&target_addr).await {
        Ok(mut target_stream) => {
            // Send success reply
            send_socks5_reply(&mut stream, SOCKS5_REP_SUCCESS).await?;
            
            log::info!("Tunnel established: {} -> {}", client_addr, target_addr);
            
            // Bidirectional copy
            let (mut client_read, mut client_write) = stream.into_split();
            let (mut target_read, mut target_write) = target_stream.into_split();
            
            let metrics_send = metrics.clone();
            let metrics_recv = metrics.clone();
            
            // Client -> Target
            let send_task = tokio::spawn(async move {
                let mut buf = [0u8; 8192];
                let mut total_sent: u64 = 0;
                loop {
                    match client_read.read(&mut buf).await {
                        Ok(0) => break,
                        Ok(n) => {
                            if target_write.write_all(&buf[..n]).await.is_err() {
                                break;
                            }
                            total_sent += n as u64;
                            // Update metrics (using "proxy" as placeholder until P2P routing)
                            let mut m = metrics_send.write().await;
                            m.record_sent("proxy", n as u64);
                        }
                        Err(_) => break,
                    }
                }
                total_sent
            });
            
            // Target -> Client
            let recv_task = tokio::spawn(async move {
                let mut buf = [0u8; 8192];
                let mut total_recv: u64 = 0;
                loop {
                    match target_read.read(&mut buf).await {
                        Ok(0) => break,
                        Ok(n) => {
                            if client_write.write_all(&buf[..n]).await.is_err() {
                                break;
                            }
                            total_recv += n as u64;
                            // Update metrics (using "proxy" as placeholder until P2P routing)
                            let mut m = metrics_recv.write().await;
                            m.record_received("proxy", n as u64);
                        }
                        Err(_) => break,
                    }
                }
                total_recv
            });
            
            // Wait for both to complete
            let (sent, recv) = tokio::join!(send_task, recv_task);
            let total_sent = sent.unwrap_or(0);
            let total_recv = recv.unwrap_or(0);
            
            log::info!(
                "Tunnel closed: {} -> {} (sent: {} bytes, recv: {} bytes)",
                client_addr, target_addr, total_sent, total_recv
            );
        }
        Err(e) => {
            log::error!("Failed to connect to target {}: {}", target_addr, e);
            
            let reply = match e.kind() {
                io::ErrorKind::ConnectionRefused => SOCKS5_REP_CONNECTION_REFUSED,
                io::ErrorKind::NetworkUnreachable => SOCKS5_REP_NETWORK_UNREACHABLE,
                _ => SOCKS5_REP_HOST_UNREACHABLE,
            };
            
            send_socks5_reply(&mut stream, reply).await?;
            return Err(format!("Failed to connect to target: {}", e).into());
        }
    }
    
    Ok(())
}

/// Send a SOCKS5 reply
async fn send_socks5_reply(
    stream: &mut TcpStream,
    reply: u8,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Reply format: version + reply + reserved + address type + bound address + bound port
    // We use IPv4 0.0.0.0:0 as the bound address
    let response = [
        SOCKS5_VERSION,
        reply,
        0x00, // Reserved
        SOCKS5_ATYP_IPV4,
        0, 0, 0, 0, // Bound address (0.0.0.0)
        0, 0, // Bound port (0)
    ];
    
    stream.write_all(&response).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_proxy_start_stop() {
        let metrics = Arc::new(RwLock::new(BandwidthMetrics::new()));
        let config = ProxyConfig {
            listen_port: 11080, // Non-privileged test port
            ..Default::default()
        };
        let mut proxy = Socks5Proxy::with_config(config, metrics);
        
        // Start proxy
        assert!(proxy.start().await.is_ok());
        assert!(proxy.is_running().await);
        
        // Check status
        let status = proxy.status().await;
        assert!(status.running);
        assert_eq!(status.listen_address, "127.0.0.1:11080");
        
        // Stop proxy
        assert!(proxy.stop().await.is_ok());
        
        // Give it a moment to shut down
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }
}
