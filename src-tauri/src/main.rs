// Cinq Connect - DePIN Grid Foundation
// Secure P2P mesh network for Quai Network

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod grid;

use grid::{CinqNode, BandwidthMetrics, GridPeer, ProxyStatus, NodeConfig, BootstrapConfig};
use grid::{ChatManager, ChatMessage, Contact, Conversation, MessageStatus};
use grid::{StratumClient, PoolStats, Worker, StratumStatus};
use grid::{UserId, UserIdRegistry, UserIdRecord, USER_ID_DHT_PREFIX};
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::State;
use serde::{Serialize, Deserialize};

/// Global state for the Cinq node
pub struct CinqState {
    node: Arc<RwLock<Option<CinqNode>>>,
    chat: Arc<RwLock<Option<Arc<RwLock<ChatManager>>>>>,
    stratum: Arc<RwLock<Option<StratumClient>>>,
    userid: Arc<RwLock<Option<Arc<RwLock<UserIdRegistry>>>>>,
}

impl CinqState {
    pub fn new() -> Self {
        Self {
            node: Arc::new(RwLock::new(None)),
            chat: Arc::new(RwLock::new(None)),
            stratum: Arc::new(RwLock::new(None)),
            userid: Arc::new(RwLock::new(None)),
        }
    }
}

/// Response type for commands
#[derive(Debug, Serialize)]
pub struct CommandResponse<T: Serialize> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T: Serialize> CommandResponse<T> {
    pub fn ok(data: T) -> Self {
        Self { success: true, data: Some(data), error: None }
    }
    
    pub fn err(msg: impl Into<String>) -> Self {
        Self { success: false, data: None, error: Some(msg.into()) }
    }
}

// ============================================================================
// Tauri Commands - These are callable from the frontend
// ============================================================================

/// Start the Cinq grid node
#[tauri::command]
async fn start_node(
    state: State<'_, CinqState>,
    bootstrap_addresses: Option<Vec<String>>,
) -> Result<CommandResponse<String>, String> {
    let mut node_guard = state.node.write().await;
    
    if node_guard.is_some() {
        return Ok(CommandResponse::err("Node is already running"));
    }
    
    // Build config with optional bootstrap addresses
    let mut config = NodeConfig::default();
    if let Some(addrs) = bootstrap_addresses {
        config.bootstrap_config.initial_bootstraps = addrs;
    }
    
    match CinqNode::with_config(config.clone()) {
        Ok(mut node) => {
            let peer_id = node.peer_id_string();
            
            // Initialize chat manager with peer ID
            let chat_arc = {
                let mut chat_guard = state.chat.write().await;
                match ChatManager::new(&config.data_dir, &peer_id) {
                    Ok(chat) => {
                        let chat_arc = Arc::new(RwLock::new(chat));
                        *chat_guard = Some(chat_arc.clone());
                        log::info!("Chat manager initialized");
                        Some(chat_arc)
                    }
                    Err(e) => {
                        log::error!("Failed to init chat: {}", e);
                        // Continue anyway - chat is optional
                        None
                    }
                }
            };
            
            // Initialize user ID registry
            {
                let mut userid_guard = state.userid.write().await;
                match UserIdRegistry::new(&config.data_dir, &peer_id) {
                    Ok(registry) => {
                        // Get or create user ID
                        if let Ok(user_id) = registry.get_or_create_local_user_id() {
                            log::info!("User ID: {} ({})", user_id.display(), user_id.as_str());
                        }
                        let registry_arc = Arc::new(RwLock::new(registry));
                        *userid_guard = Some(registry_arc);
                        log::info!("User ID registry initialized");
                    }
                    Err(e) => {
                        log::error!("Failed to init user ID registry: {}", e);
                    }
                }
            }
            
            // Give the node access to chat manager for storing incoming messages
            if let Some(cm) = chat_arc {
                node.set_chat_manager(cm);
            }
            
            if let Err(e) = node.start().await {
                return Ok(CommandResponse::err(format!("Failed to start node: {}", e)));
            }
            
            *node_guard = Some(node);
            Ok(CommandResponse::ok(peer_id))
        }
        Err(e) => Ok(CommandResponse::err(format!("Failed to create node: {}", e))),
    }
}

/// Stop the Cinq grid node
#[tauri::command]
async fn stop_node(state: State<'_, CinqState>) -> Result<CommandResponse<()>, String> {
    let mut node_guard = state.node.write().await;
    
    if let Some(node) = node_guard.as_ref() {
        if let Err(e) = node.shutdown().await {
            return Ok(CommandResponse::err(format!("Failed to shutdown: {}", e)));
        }
    }
    
    *node_guard = None;
    Ok(CommandResponse::ok(()))
}

/// Get our peer ID
#[tauri::command]
async fn get_peer_id(state: State<'_, CinqState>) -> Result<CommandResponse<String>, String> {
    log::debug!("get_peer_id: acquiring read lock");
    let node_guard = state.node.read().await;
    log::debug!("get_peer_id: got read lock");
    
    match node_guard.as_ref() {
        Some(node) => Ok(CommandResponse::ok(node.peer_id_string())),
        None => Ok(CommandResponse::err("Node is not running")),
    }
}

/// Get list of discovered peers on the grid
#[tauri::command]
async fn get_peers(state: State<'_, CinqState>) -> Result<CommandResponse<Vec<GridPeer>>, String> {
    log::debug!("get_peers: starting with full timeout");
    
    // Wrap the entire operation in a timeout
    let result = tokio::time::timeout(
        std::time::Duration::from_secs(3),
        async {
            let node_guard = state.node.read().await;
            log::debug!("get_peers: got read lock");
            
            match node_guard.as_ref() {
                Some(node) => {
                    log::debug!("get_peers: calling node.get_peers()");
                    let peers = node.get_peers().await;
                    log::debug!("get_peers: got {} peers", peers.len());
                    CommandResponse::ok(peers)
                }
                None => {
                    log::debug!("get_peers: node not running");
                    CommandResponse::err("Node is not running")
                }
            }
        }
    ).await;
    
    match result {
        Ok(response) => Ok(response),
        Err(_) => {
            log::warn!("get_peers: operation timed out");
            Ok(CommandResponse::ok(vec![])) // Return empty list on timeout
        }
    }
}

/// Connect to a peer by address
#[tauri::command]
async fn connect_peer(state: State<'_, CinqState>, address: String) -> Result<CommandResponse<()>, String> {
    let node_guard = state.node.read().await;
    
    match node_guard.as_ref() {
        Some(node) => {
            match node.connect(&address).await {
                Ok(_) => Ok(CommandResponse::ok(())),
                Err(e) => Ok(CommandResponse::err(format!("Failed to connect: {}", e))),
            }
        }
        None => Ok(CommandResponse::err("Node is not running")),
    }
}

/// Get bandwidth metrics
#[tauri::command]
async fn get_bandwidth_metrics(state: State<'_, CinqState>) -> Result<CommandResponse<BandwidthMetrics>, String> {
    let node_guard = state.node.read().await;
    
    match node_guard.as_ref() {
        Some(node) => {
            let metrics = node.metrics.read().await;
            Ok(CommandResponse::ok(metrics.clone()))
        }
        None => Ok(CommandResponse::err("Node is not running")),
    }
}

/// Get billing summary for Qi payments (future)
#[tauri::command]
async fn get_billing_summary(state: State<'_, CinqState>) -> Result<CommandResponse<grid::metrics::BillingSummary>, String> {
    let node_guard = state.node.read().await;
    
    match node_guard.as_ref() {
        Some(node) => {
            let metrics = node.metrics.read().await;
            Ok(CommandResponse::ok(metrics.get_billing_summary()))
        }
        None => Ok(CommandResponse::err("Node is not running")),
    }
}

/// Calculate provider/foundation split (10% foundation, 90% provider)
#[tauri::command]
fn calculate_deposit(amount: f64) -> String {
    let foundation_cut = amount * 0.10;
    let provider_cut = amount * 0.90;
    format!(
        "Deposit Split: ${:.2} to Foundation (10%), ${:.2} to you (90%)",
        foundation_cut, provider_cut
    )
}

// ============================================================================
// SOCKS5 Proxy Commands
// ============================================================================

/// Start the SOCKS5 proxy on the specified port
#[tauri::command]
async fn start_proxy(state: State<'_, CinqState>, port: Option<u16>) -> Result<CommandResponse<String>, String> {
    log::info!("start_proxy command received, acquiring write lock...");
    
    // Use try_write with timeout to avoid blocking forever
    let node_guard = tokio::time::timeout(
        std::time::Duration::from_secs(5),
        state.node.write()
    ).await;
    
    let mut node_guard = match node_guard {
        Ok(guard) => guard,
        Err(_) => {
            log::error!("Timeout acquiring write lock for start_proxy");
            return Ok(CommandResponse::err("Timeout: could not acquire lock. Try again."));
        }
    };
    
    log::info!("start_proxy: acquired write lock");
    
    match node_guard.as_mut() {
        Some(node) => {
            let proxy_port = port.unwrap_or(1080);
            log::info!("start_proxy: starting proxy on port {}", proxy_port);
            match node.start_proxy(proxy_port).await {
                Ok(_) => {
                    log::info!("start_proxy: proxy started successfully");
                    Ok(CommandResponse::ok(format!("127.0.0.1:{}", proxy_port)))
                }
                Err(e) => {
                    log::error!("start_proxy: failed - {}", e);
                    Ok(CommandResponse::err(format!("Failed to start proxy: {}", e)))
                }
            }
        }
        None => Ok(CommandResponse::err("Node is not running. Start the node first.")),
    }
}

/// Stop the SOCKS5 proxy
#[tauri::command]
async fn stop_proxy(state: State<'_, CinqState>) -> Result<CommandResponse<()>, String> {
    let mut node_guard = state.node.write().await;
    
    match node_guard.as_mut() {
        Some(node) => {
            match node.stop_proxy().await {
                Ok(_) => Ok(CommandResponse::ok(())),
                Err(e) => Ok(CommandResponse::err(format!("Failed to stop proxy: {}", e))),
            }
        }
        None => Ok(CommandResponse::err("Node is not running")),
    }
}

/// Get proxy status
#[tauri::command]
async fn get_proxy_status(state: State<'_, CinqState>) -> Result<CommandResponse<ProxyStatus>, String> {
    let node_guard = state.node.read().await;
    
    match node_guard.as_ref() {
        Some(node) => {
            let status = node.proxy_status().await;
            Ok(CommandResponse::ok(status))
        }
        None => Ok(CommandResponse::ok(ProxyStatus {
            running: false,
            listen_address: String::new(),
            active_connections: 0,
            total_bytes_proxied: 0,
            exit_peer: None,
        })),
    }
}

/// Get list of connected peers that can be used as exit nodes
#[tauri::command]
async fn get_exit_peers(state: State<'_, CinqState>) -> Result<CommandResponse<Vec<String>>, String> {
    let node_guard = state.node.read().await;
    
    match node_guard.as_ref() {
        Some(node) => {
            let peers = node.get_connected_peer_ids().await;
            let peer_strings: Vec<String> = peers.iter().map(|p| p.to_string()).collect();
            Ok(CommandResponse::ok(peer_strings))
        }
        None => Ok(CommandResponse::err("Node is not running")),
    }
}

// ============================================================================
// Chat Commands
// ============================================================================

/// Get all conversations
#[tauri::command]
async fn get_conversations(state: State<'_, CinqState>) -> Result<CommandResponse<Vec<Conversation>>, String> {
    let chat_guard = state.chat.read().await;
    
    match chat_guard.as_ref() {
        Some(chat_arc) => {
            let chat = chat_arc.read().await;
            match chat.get_conversations() {
                Ok(convs) => Ok(CommandResponse::ok(convs)),
                Err(e) => Ok(CommandResponse::err(e)),
            }
        }
        None => Ok(CommandResponse::err("Chat not initialized")),
    }
}

/// Get messages for a conversation
#[tauri::command]
async fn get_messages(
    state: State<'_, CinqState>,
    conversation_id: String,
    limit: Option<u32>,
    before_timestamp: Option<u64>,
) -> Result<CommandResponse<Vec<ChatMessage>>, String> {
    let chat_guard = state.chat.read().await;
    
    match chat_guard.as_ref() {
        Some(chat_arc) => {
            let chat = chat_arc.read().await;
            match chat.get_messages(&conversation_id, limit.unwrap_or(50), before_timestamp) {
                Ok(msgs) => Ok(CommandResponse::ok(msgs)),
                Err(e) => Ok(CommandResponse::err(e)),
            }
        }
        None => Ok(CommandResponse::err("Chat not initialized")),
    }
}

/// Send a chat message to a peer
#[tauri::command]
async fn send_message(
    state: State<'_, CinqState>,
    peer_id: String,
    content: String,
) -> Result<CommandResponse<ChatMessage>, String> {
    // First create the message locally
    let msg = {
        let chat_guard = state.chat.read().await;
        match chat_guard.as_ref() {
            Some(chat_arc) => {
                let chat = chat_arc.read().await;
                match chat.create_outgoing_message(&peer_id, &content) {
                    Ok(msg) => msg,
                    Err(e) => return Ok(CommandResponse::err(e)),
                }
            }
            None => return Ok(CommandResponse::err("Chat not initialized")),
        }
    };
    
    // Now send via the network
    let node_guard = state.node.read().await;
    match node_guard.as_ref() {
        Some(node) => {
            // Parse peer_id to libp2p PeerId
            use std::str::FromStr;
            match libp2p::PeerId::from_str(&peer_id) {
                Ok(pid) => {
                    // For now, we send unencrypted (encryption TODO)
                    let request = grid::protocol::CinqRequest::ChatMessage {
                        message_id: msg.id.clone(),
                        sender_name: None,
                        encrypted_content: content.as_bytes().to_vec(),
                        timestamp: msg.timestamp,
                    };
                    
                    // Try to send (update status based on result)
                    if let Err(e) = node.send_request(pid, request).await {
                        log::warn!("Failed to send message: {}", e);
                        // Update status to failed
                        let chat_guard = state.chat.read().await;
                        if let Some(chat_arc) = chat_guard.as_ref() {
                            let chat = chat_arc.read().await;
                            let _ = chat.update_message_status(&msg.id, MessageStatus::Failed);
                        }
                        return Ok(CommandResponse::ok(ChatMessage { 
                            status: MessageStatus::Failed, 
                            ..msg 
                        }));
                    }
                    
                    // Update status to sent
                    {
                        let chat_guard = state.chat.read().await;
                        if let Some(chat_arc) = chat_guard.as_ref() {
                            let chat = chat_arc.read().await;
                            let _ = chat.update_message_status(&msg.id, MessageStatus::Sent);
                        }
                    }
                    
                    Ok(CommandResponse::ok(ChatMessage { 
                        status: MessageStatus::Sent, 
                        ..msg 
                    }))
                }
                Err(_) => Ok(CommandResponse::err("Invalid peer ID")),
            }
        }
        None => {
            // Node not running - message stays pending for later
            Ok(CommandResponse::ok(msg))
        }
    }
}

/// Get all contacts
#[tauri::command]
async fn get_contacts(state: State<'_, CinqState>) -> Result<CommandResponse<Vec<Contact>>, String> {
    let chat_guard = state.chat.read().await;
    
    match chat_guard.as_ref() {
        Some(chat_arc) => {
            let chat = chat_arc.read().await;
            match chat.get_contacts() {
                Ok(contacts) => Ok(CommandResponse::ok(contacts)),
                Err(e) => Ok(CommandResponse::err(e)),
            }
        }
        None => Ok(CommandResponse::err("Chat not initialized")),
    }
}

/// Add a contact
#[tauri::command]
async fn add_contact(
    state: State<'_, CinqState>,
    peer_id: String,
    display_name: String,
) -> Result<CommandResponse<Contact>, String> {
    let chat_guard = state.chat.read().await;
    
    match chat_guard.as_ref() {
        Some(chat_arc) => {
            let chat = chat_arc.read().await;
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64;
            
            let contact = Contact {
                peer_id: peer_id.clone(),
                display_name,
                added_at: now,
                last_seen: None,
                public_key: None,
                is_online: false,
            };
            
            match chat.upsert_contact(&contact) {
                Ok(()) => Ok(CommandResponse::ok(contact)),
                Err(e) => Ok(CommandResponse::err(e)),
            }
        }
        None => Ok(CommandResponse::err("Chat not initialized")),
    }
}

/// Mark conversation as read
#[tauri::command]
async fn mark_conversation_read(
    state: State<'_, CinqState>,
    conversation_id: String,
) -> Result<CommandResponse<()>, String> {
    let chat_guard = state.chat.read().await;
    
    match chat_guard.as_ref() {
        Some(chat_arc) => {
            let chat = chat_arc.read().await;
            match chat.mark_conversation_read(&conversation_id) {
                Ok(()) => Ok(CommandResponse::ok(())),
                Err(e) => Ok(CommandResponse::err(e)),
            }
        }
        None => Ok(CommandResponse::err("Chat not initialized")),
    }
}

/// Get or create a conversation with a peer
#[tauri::command]
async fn start_conversation(
    state: State<'_, CinqState>,
    peer_id: String,
    display_name: Option<String>,
) -> Result<CommandResponse<Conversation>, String> {
    let chat_guard = state.chat.read().await;
    
    match chat_guard.as_ref() {
        Some(chat_arc) => {
            let chat = chat_arc.read().await;
            let name = display_name.unwrap_or_else(|| {
                if peer_id.len() > 8 { peer_id[..8].to_string() } else { peer_id.clone() }
            });
            match chat.get_or_create_conversation(&peer_id, &name) {
                Ok(conv) => Ok(CommandResponse::ok(conv)),
                Err(e) => Ok(CommandResponse::err(e)),
            }
        }
        None => Ok(CommandResponse::err("Chat not initialized")),
    }
}

// ============================================================================
// User ID Commands - Short, memorable IDs for users
// ============================================================================

/// User ID info returned to frontend
#[derive(Debug, Serialize, Deserialize)]
pub struct UserIdInfo {
    /// Raw user ID (10-11 digits depending on zone)
    pub user_id: String,
    /// Formatted for display (XXX-XXX-XXXX or Z-XXX-XXX-XXXX)
    pub display: String,
    /// Associated peer ID
    pub peer_id: String,
    /// Whether this ID is SBT-verified (vs auto-generated test ID)
    pub is_verified: bool,
    /// Zone name if SBT-verified (e.g., "Cyprus", "Paxos", "Hydra")
    pub zone_name: Option<String>,
}

/// Get local user's ID (creates one if needed)
#[tauri::command]
async fn get_user_id(state: State<'_, CinqState>) -> Result<CommandResponse<UserIdInfo>, String> {
    let userid_guard = state.userid.read().await;
    let node_guard = state.node.read().await;
    
    let peer_id = match node_guard.as_ref() {
        Some(node) => node.peer_id_string(),
        None => return Ok(CommandResponse::err("Node is not running")),
    };
    
    match userid_guard.as_ref() {
        Some(registry_arc) => {
            let registry = registry_arc.read().await;
            match registry.get_or_create_local_user_id() {
                Ok(user_id) => Ok(CommandResponse::ok(UserIdInfo {
                    user_id: user_id.as_str().to_string(),
                    display: user_id.display(),
                    peer_id,
                    is_verified: user_id.is_verified(),
                    zone_name: user_id.zone_name().map(|s| s.to_string()),
                })),
                Err(e) => Ok(CommandResponse::err(e)),
            }
        }
        None => Ok(CommandResponse::err("User ID registry not initialized")),
    }
}

/// Look up a peer ID from a user ID (checks local cache first)
#[tauri::command]
async fn lookup_user_id(
    state: State<'_, CinqState>,
    user_id: String,
) -> Result<CommandResponse<Option<String>>, String> {
    // Normalize the user ID (remove dashes if present)
    let normalized = user_id.replace("-", "").replace(" ", "");
    
    // Validate format: either 10 digits (legacy) or 11 digits (zone-prefixed)
    let is_valid = (normalized.len() == 10 || normalized.len() == 11) 
        && normalized.chars().all(|c| c.is_ascii_digit());
    
    if !is_valid {
        return Ok(CommandResponse::err(
            "Invalid user ID format. Use 10 digits (555-123-4567) or zone-prefixed (2-555-123-4567)"
        ));
    }
    
    let userid_guard = state.userid.read().await;
    
    match userid_guard.as_ref() {
        Some(registry_arc) => {
            let registry = registry_arc.read().await;
            
            // Check local cache first
            if let Some(peer_id) = registry.lookup_cached(&normalized) {
                return Ok(CommandResponse::ok(Some(peer_id)));
            }
            
            // TODO: Query DHT for the user ID
            // For now, return None if not in cache
            Ok(CommandResponse::ok(None))
        }
        None => Ok(CommandResponse::err("User ID registry not initialized")),
    }
}

/// Cache a user ID -> peer ID mapping (e.g., after receiving a message)
#[tauri::command]
async fn cache_user_id(
    state: State<'_, CinqState>,
    user_id: String,
    peer_id: String,
    display_name: Option<String>,
) -> Result<CommandResponse<()>, String> {
    let userid_guard = state.userid.read().await;
    
    match userid_guard.as_ref() {
        Some(registry_arc) => {
            let registry = registry_arc.read().await;
            match registry.cache_user_id(&user_id, &peer_id, display_name.as_deref()) {
                Ok(()) => Ok(CommandResponse::ok(())),
                Err(e) => Ok(CommandResponse::err(e)),
            }
        }
        None => Ok(CommandResponse::err("User ID registry not initialized")),
    }
}

/// Get user ID for a known peer ID (reverse lookup from cache)
#[tauri::command]
async fn get_user_id_for_peer(
    state: State<'_, CinqState>,
    peer_id: String,
) -> Result<CommandResponse<Option<String>>, String> {
    let userid_guard = state.userid.read().await;
    
    match userid_guard.as_ref() {
        Some(registry_arc) => {
            let registry = registry_arc.read().await;
            Ok(CommandResponse::ok(registry.get_user_id_for_peer(&peer_id)))
        }
        None => Ok(CommandResponse::err("User ID registry not initialized")),
    }
}

/// Profile info returned to frontend
#[derive(Debug, Serialize, Deserialize)]
pub struct ProfileInfo {
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub avatar: Option<String>,
}

/// Update local user profile (name, bio, avatar)
#[tauri::command]
async fn update_profile(
    state: State<'_, CinqState>,
    display_name: Option<String>,
    bio: Option<String>,
    avatar: Option<String>,
) -> Result<CommandResponse<()>, String> {
    let userid_guard = state.userid.read().await;
    
    match userid_guard.as_ref() {
        Some(registry_arc) => {
            let registry = registry_arc.read().await;
            match registry.update_profile(
                display_name.as_deref(),
                bio.as_deref(),
                avatar.as_deref()
            ) {
                Ok(()) => Ok(CommandResponse::ok(())),
                Err(e) => Ok(CommandResponse::err(e)),
            }
        }
        None => Ok(CommandResponse::err("User ID registry not initialized")),
    }
}

/// Get local user profile
#[tauri::command]
async fn get_profile(state: State<'_, CinqState>) -> Result<CommandResponse<ProfileInfo>, String> {
    let userid_guard = state.userid.read().await;
    
    match userid_guard.as_ref() {
        Some(registry_arc) => {
            let registry = registry_arc.read().await;
            match registry.get_profile() {
                Ok((display_name, bio, avatar)) => Ok(CommandResponse::ok(ProfileInfo {
                    display_name,
                    bio,
                    avatar,
                })),
                Err(e) => Ok(CommandResponse::err(e)),
            }
        }
        None => Ok(CommandResponse::err("User ID registry not initialized")),
    }
}

/// Contact card info for sharing (QR code, URL)
#[derive(Debug, Serialize, Deserialize)]
pub struct ContactCardInfo {
    /// Raw JSON for QR code
    pub json: String,
    /// Shareable URL (cinq://contact/...)
    pub url: String,
    /// Compact format for small QR codes
    pub compact: String,
    /// The actual card data
    pub card: ContactCardData,
}

/// Contact card data structure for frontend
#[derive(Debug, Serialize, Deserialize)]
pub struct ContactCardData {
    pub user_id: String,
    pub display_name: Option<String>,
    pub peer_id: String,
    pub bio: Option<String>,
    pub is_verified: bool,
    pub zone_name: Option<String>,
}

/// Get contact card for sharing (generates QR-ready data)
#[tauri::command]
async fn get_contact_card(state: State<'_, CinqState>) -> Result<CommandResponse<ContactCardInfo>, String> {
    let userid_guard = state.userid.read().await;
    
    match userid_guard.as_ref() {
        Some(registry_arc) => {
            let registry = registry_arc.read().await;
            match registry.create_contact_card() {
                Ok(card) => Ok(CommandResponse::ok(ContactCardInfo {
                    json: card.to_json(),
                    url: card.to_url(),
                    compact: card.to_compact(),
                    card: ContactCardData {
                        user_id: card.user_id.clone(),
                        display_name: card.display_name.clone(),
                        peer_id: card.peer_id.clone(),
                        bio: card.bio.clone(),
                        is_verified: card.is_verified,
                        zone_name: card.zone_name.clone(),
                    },
                })),
                Err(e) => Ok(CommandResponse::err(e)),
            }
        }
        None => Ok(CommandResponse::err("User ID registry not initialized")),
    }
}

/// Parse a contact card from URL or JSON (for scanning QR codes)
#[tauri::command]
async fn parse_contact_card(data: String) -> Result<CommandResponse<ContactCardData>, String> {
    use grid::userid::ContactCard;
    
    // Try parsing as URL first
    if let Some(card) = ContactCard::from_url(&data) {
        return Ok(CommandResponse::ok(ContactCardData {
            user_id: card.user_id,
            display_name: card.display_name,
            peer_id: card.peer_id,
            bio: card.bio,
            is_verified: card.is_verified,
            zone_name: card.zone_name,
        }));
    }
    
    // Try parsing as JSON
    if let Some(card) = ContactCard::from_json(&data) {
        return Ok(CommandResponse::ok(ContactCardData {
            user_id: card.user_id,
            display_name: card.display_name,
            peer_id: card.peer_id,
            bio: card.bio,
            is_verified: card.is_verified,
            zone_name: card.zone_name,
        }));
    }
    
    Ok(CommandResponse::err("Invalid contact card format"))
}

// ============================================================================
// StratumX Commands - Connect to local go-quai node
// ============================================================================

/// Connect to StratumX API on local go-quai node
#[tauri::command]
async fn stratum_connect(
    state: State<'_, CinqState>,
    url: Option<String>,
) -> Result<CommandResponse<StratumStatus>, String> {
    let mut stratum_guard = state.stratum.write().await;
    
    let client = StratumClient::new(url);
    
    // Check connection
    if !client.check_connection().await {
        return Ok(CommandResponse::err("Cannot connect to StratumX API. Is go-quai running with --node.stratum-enabled?"));
    }
    
    // Get initial stats
    match client.get_pool_stats().await {
        Ok(stats) => {
            let status = StratumStatus::from(&stats);
            *stratum_guard = Some(client);
            log::info!("Connected to StratumX: {:?}", status);
            Ok(CommandResponse::ok(status))
        }
        Err(e) => {
            Ok(CommandResponse::err(format!("Failed to get pool stats: {}", e)))
        }
    }
}

/// Disconnect from StratumX
#[tauri::command]
async fn stratum_disconnect(state: State<'_, CinqState>) -> Result<CommandResponse<()>, String> {
    let mut stratum_guard = state.stratum.write().await;
    *stratum_guard = None;
    log::info!("Disconnected from StratumX");
    Ok(CommandResponse::ok(()))
}

/// Get StratumX pool stats
#[tauri::command]
async fn stratum_get_stats(state: State<'_, CinqState>) -> Result<CommandResponse<PoolStats>, String> {
    let stratum_guard = state.stratum.read().await;
    
    match stratum_guard.as_ref() {
        Some(client) => {
            match client.get_pool_stats().await {
                Ok(stats) => Ok(CommandResponse::ok(stats)),
                Err(e) => Ok(CommandResponse::err(format!("Failed to get stats: {}", e))),
            }
        }
        None => Ok(CommandResponse::err("Not connected to StratumX")),
    }
}

/// Get StratumX workers (potential chat peers)
#[tauri::command]
async fn stratum_get_workers(state: State<'_, CinqState>) -> Result<CommandResponse<Vec<Worker>>, String> {
    let stratum_guard = state.stratum.read().await;
    
    match stratum_guard.as_ref() {
        Some(client) => {
            match client.get_workers().await {
                Ok(workers) => Ok(CommandResponse::ok(workers)),
                Err(e) => Ok(CommandResponse::err(format!("Failed to get workers: {}", e))),
            }
        }
        None => Ok(CommandResponse::err("Not connected to StratumX")),
    }
}

/// Get unique miner addresses from StratumX
#[tauri::command]
async fn stratum_get_miners(state: State<'_, CinqState>) -> Result<CommandResponse<Vec<String>>, String> {
    let stratum_guard = state.stratum.read().await;
    
    match stratum_guard.as_ref() {
        Some(client) => {
            match client.get_miner_addresses().await {
                Ok(addresses) => Ok(CommandResponse::ok(addresses)),
                Err(e) => Ok(CommandResponse::err(format!("Failed to get miners: {}", e))),
            }
        }
        None => Ok(CommandResponse::err("Not connected to StratumX")),
    }
}

/// Check if connected to StratumX
#[tauri::command]
async fn stratum_is_connected(state: State<'_, CinqState>) -> Result<CommandResponse<bool>, String> {
    let stratum_guard = state.stratum.read().await;
    
    match stratum_guard.as_ref() {
        Some(client) => Ok(CommandResponse::ok(client.is_connected().await)),
        None => Ok(CommandResponse::ok(false)),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .manage(CinqState::new())
        .invoke_handler(tauri::generate_handler![
            start_node,
            stop_node,
            get_peer_id,
            get_peers,
            connect_peer,
            get_bandwidth_metrics,
            get_billing_summary,
            calculate_deposit,
            start_proxy,
            stop_proxy,
            get_proxy_status,
            get_exit_peers,
            test_ping,
            // Chat commands
            get_conversations,
            get_messages,
            send_message,
            get_contacts,
            add_contact,
            mark_conversation_read,
            start_conversation,
            // User ID commands
            get_user_id,
            lookup_user_id,
            cache_user_id,
            get_user_id_for_peer,
            // Profile & Contact Card commands
            update_profile,
            get_profile,
            get_contact_card,
            parse_contact_card,
            // StratumX commands
            stratum_connect,
            stratum_disconnect,
            stratum_get_stats,
            stratum_get_workers,
            stratum_get_miners,
            stratum_is_connected,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Cinq Connect");
}

/// Simple test command
#[tauri::command]
fn test_ping() -> String {
    log::info!("test_ping called!");
    "pong".to_string()
}