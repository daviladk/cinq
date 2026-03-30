// Cinq Connect - DePIN Grid Foundation
// Secure P2P mesh network for Quai Network
// MCP Server for Entropic integration

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod apps;
mod grid;
mod mcp;
// mod qora; // Removed - Entropic's Claude handles AI
mod swarm;

use apps::{AppId, AppInfo, AppRegistry};
use grid::UserIdRegistry;
use grid::{BandwidthMetrics, CinqNode, GridPeer, NodeConfig, ProxyStatus};
use grid::{ChatManager, ChatMessage, Contact, Conversation, MessageStatus};
use grid::{PoolStats, StratumClient, StratumStatus, Worker};
use mcp::{McpServerConfig, spawn_mcp_server};
// use qora::{QoraAgent, Task}; // Removed - Entropic's Claude handles AI
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use swarm::{ActionType, CostTable, UsageTracker, Warning};
use swarm::{BandwidthWorker, PaymentWorker, StorageWorker};
// use swarm::{Qora, QoraResponse}; // Removed - Entropic's Claude handles AI
use tauri::State;
use tokio::sync::RwLock;

/// Global state for the Cinq node
pub struct CinqState {
    node: Arc<RwLock<Option<CinqNode>>>,
    chat: Arc<RwLock<Option<Arc<RwLock<ChatManager>>>>>,
    stratum: Arc<RwLock<Option<StratumClient>>>,
    userid: Arc<RwLock<Option<Arc<RwLock<UserIdRegistry>>>>>,
    tracker: Arc<UsageTracker>,
    // Service workers
    bandwidth_worker: Arc<BandwidthWorker>,
    storage_worker: Arc<StorageWorker>,
    payment_worker: Arc<RwLock<PaymentWorker>>,
    // App registry
    apps: Arc<RwLock<AppRegistry>>,
}

impl CinqState {
    pub fn new() -> Self {
        let tracker = Arc::new(UsageTracker::new(100.0)); // Start with 100 Qi for testing
        let data_dir = dirs::data_dir()
            .map(|d| d.join("cinq"))
            .unwrap_or_else(|| PathBuf::from("."));

        Self {
            node: Arc::new(RwLock::new(None)),
            chat: Arc::new(RwLock::new(None)),
            stratum: Arc::new(RwLock::new(None)),
            userid: Arc::new(RwLock::new(None)),
            tracker: tracker.clone(),
            // Initialize service workers
            bandwidth_worker: Arc::new(BandwidthWorker::new()),
            storage_worker: Arc::new(StorageWorker::new(data_dir.clone())),
            payment_worker: Arc::new(RwLock::new(PaymentWorker::new(tracker))),
            // Initialize app registry
            apps: Arc::new(RwLock::new(AppRegistry::new(data_dir))),
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
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn err(msg: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(msg.into()),
        }
    }
}

// ============================================================================
// Tauri Commands - These are callable from the frontend
// ============================================================================

/// Reset identity - clears keypair and Chat ID for new wallet
/// Call this when creating a new wallet to get fresh identities
#[tauri::command]
async fn reset_identity(state: State<'_, CinqState>) -> Result<CommandResponse<()>, String> {
    // Stop node if running
    {
        let node_guard = state.node.read().await;
        if node_guard.is_some() {
            return Ok(CommandResponse::err(
                "Stop the node before resetting identity",
            ));
        }
    }

    // Get data directory
    let data_dir = dirs::data_dir()
        .ok_or("Could not find data directory")?
        .join("cinq");

    // Delete keypair.bin to get a new Mesh ID
    let keypair_path = data_dir.join("keypair.bin");
    if keypair_path.exists() {
        if let Err(e) = std::fs::remove_file(&keypair_path) {
            log::warn!("Failed to delete keypair: {}", e);
        } else {
            log::info!("Deleted keypair.bin - new Mesh ID will be generated");
        }
    }

    // Clear Chat ID from registry
    let userid_guard = state.userid.read().await;
    if let Some(registry_arc) = userid_guard.as_ref() {
        let registry = registry_arc.read().await;
        if let Err(e) = registry.reset_local_identity() {
            log::warn!("Failed to reset Chat ID: {}", e);
        } else {
            log::info!("Reset Chat ID - new one will be generated");
        }
    }

    // Also clear the chat database conversations (optional - fresh start)
    let chat_db_path = data_dir.join("chat.db");
    if chat_db_path.exists() {
        if let Err(e) = std::fs::remove_file(&chat_db_path) {
            log::warn!("Failed to delete chat.db: {}", e);
        } else {
            log::info!("Deleted chat.db - fresh message history");
        }
    }

    Ok(CommandResponse::ok(()))
}

/// Start the Cinq grid node
#[tauri::command]
async fn start_node(
    state: State<'_, CinqState>,
    bootstrap_addresses: Option<Vec<String>>,
    seed_phrase: Option<String>,
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
    // Note: seed_phrase is used for Chat ID (human identity), not Mesh ID (network plumbing)

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

            // Initialize user ID registry with seed phrase for deterministic Chat ID
            {
                let mut userid_guard = state.userid.write().await;
                match UserIdRegistry::with_seed(&config.data_dir, &peer_id, seed_phrase) {
                    Ok(registry) => {
                        // Get or create user ID (derived from seed if provided)
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
        Err(e) => Ok(CommandResponse::err(format!(
            "Failed to create node: {}",
            e
        ))),
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
    let result = tokio::time::timeout(std::time::Duration::from_secs(3), async {
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
    })
    .await;

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
async fn connect_peer(
    state: State<'_, CinqState>,
    address: String,
) -> Result<CommandResponse<()>, String> {
    let node_guard = state.node.read().await;

    match node_guard.as_ref() {
        Some(node) => match node.connect(&address).await {
            Ok(_) => Ok(CommandResponse::ok(())),
            Err(e) => Ok(CommandResponse::err(format!("Failed to connect: {}", e))),
        },
        None => Ok(CommandResponse::err("Node is not running")),
    }
}

/// Get bandwidth metrics
#[tauri::command]
async fn get_bandwidth_metrics(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<BandwidthMetrics>, String> {
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
async fn get_billing_summary(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<grid::metrics::BillingSummary>, String> {
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
async fn start_proxy(
    state: State<'_, CinqState>,
    port: Option<u16>,
) -> Result<CommandResponse<String>, String> {
    log::info!("start_proxy command received, acquiring write lock...");

    // Use try_write with timeout to avoid blocking forever
    let node_guard =
        tokio::time::timeout(std::time::Duration::from_secs(5), state.node.write()).await;

    let mut node_guard = match node_guard {
        Ok(guard) => guard,
        Err(_) => {
            log::error!("Timeout acquiring write lock for start_proxy");
            return Ok(CommandResponse::err(
                "Timeout: could not acquire lock. Try again.",
            ));
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
                    Ok(CommandResponse::err(format!(
                        "Failed to start proxy: {}",
                        e
                    )))
                }
            }
        }
        None => Ok(CommandResponse::err(
            "Node is not running. Start the node first.",
        )),
    }
}

/// Stop the SOCKS5 proxy
#[tauri::command]
async fn stop_proxy(state: State<'_, CinqState>) -> Result<CommandResponse<()>, String> {
    let mut node_guard = state.node.write().await;

    match node_guard.as_mut() {
        Some(node) => match node.stop_proxy().await {
            Ok(_) => Ok(CommandResponse::ok(())),
            Err(e) => Ok(CommandResponse::err(format!("Failed to stop proxy: {}", e))),
        },
        None => Ok(CommandResponse::err("Node is not running")),
    }
}

/// Get proxy status
#[tauri::command]
async fn get_proxy_status(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<ProxyStatus>, String> {
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
async fn get_exit_peers(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<Vec<String>>, String> {
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
async fn get_conversations(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<Vec<Conversation>>, String> {
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
async fn get_contacts(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<Vec<Contact>>, String> {
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
                if peer_id.len() > 8 {
                    peer_id[..8].to_string()
                } else {
                    peer_id.clone()
                }
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
                avatar.as_deref(),
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
async fn get_contact_card(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<ContactCardInfo>, String> {
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
        return Ok(CommandResponse::err(
            "Cannot connect to StratumX API. Is go-quai running with --node.stratum-enabled?",
        ));
    }

    // Get initial stats
    match client.get_pool_stats().await {
        Ok(stats) => {
            let status = StratumStatus::from(&stats);
            *stratum_guard = Some(client);
            log::info!("Connected to StratumX: {:?}", status);
            Ok(CommandResponse::ok(status))
        }
        Err(e) => Ok(CommandResponse::err(format!(
            "Failed to get pool stats: {}",
            e
        ))),
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
async fn stratum_get_stats(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<PoolStats>, String> {
    let stratum_guard = state.stratum.read().await;

    match stratum_guard.as_ref() {
        Some(client) => match client.get_pool_stats().await {
            Ok(stats) => Ok(CommandResponse::ok(stats)),
            Err(e) => Ok(CommandResponse::err(format!("Failed to get stats: {}", e))),
        },
        None => Ok(CommandResponse::err("Not connected to StratumX")),
    }
}

/// Get StratumX workers (potential chat peers)
#[tauri::command]
async fn stratum_get_workers(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<Vec<Worker>>, String> {
    let stratum_guard = state.stratum.read().await;

    match stratum_guard.as_ref() {
        Some(client) => match client.get_workers().await {
            Ok(workers) => Ok(CommandResponse::ok(workers)),
            Err(e) => Ok(CommandResponse::err(format!(
                "Failed to get workers: {}",
                e
            ))),
        },
        None => Ok(CommandResponse::err("Not connected to StratumX")),
    }
}

/// Get unique miner addresses from StratumX
#[tauri::command]
async fn stratum_get_miners(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<Vec<String>>, String> {
    let stratum_guard = state.stratum.read().await;

    match stratum_guard.as_ref() {
        Some(client) => match client.get_miner_addresses().await {
            Ok(addresses) => Ok(CommandResponse::ok(addresses)),
            Err(e) => Ok(CommandResponse::err(format!("Failed to get miners: {}", e))),
        },
        None => Ok(CommandResponse::err("Not connected to StratumX")),
    }
}

/// Check if connected to StratumX
#[tauri::command]
async fn stratum_is_connected(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<bool>, String> {
    let stratum_guard = state.stratum.read().await;

    match stratum_guard.as_ref() {
        Some(client) => Ok(CommandResponse::ok(client.is_connected().await)),
        None => Ok(CommandResponse::ok(false)),
    }
}

// ============================================================================
// Swarm Usage Tracker Commands
// ============================================================================

/// Response for balance and usage info
#[derive(Debug, Serialize)]
pub struct BalanceInfo {
    pub qi_balance: f64,
    pub active_sessions: Vec<swarm::tracker::SessionSummary>,
    pub total_qi_in_use: f64,
}

/// Get current Qi balance and active sessions
#[tauri::command]
async fn swarm_get_balance(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<BalanceInfo>, String> {
    let balance = state.tracker.get_balance().await;
    let sessions = state.tracker.get_active_sessions().await;
    let in_use: f64 = sessions.iter().map(|s| s.qi_consumed).sum();

    Ok(CommandResponse::ok(BalanceInfo {
        qi_balance: balance,
        active_sessions: sessions,
        total_qi_in_use: in_use,
    }))
}

/// Update Qi balance (called when wallet syncs)
#[tauri::command]
async fn swarm_set_balance(
    state: State<'_, CinqState>,
    balance: f64,
) -> Result<CommandResponse<()>, String> {
    state.tracker.set_balance(balance).await;
    Ok(CommandResponse::ok(()))
}

/// Start tracking a new session (returns session ID)
#[tauri::command]
async fn swarm_start_session(
    state: State<'_, CinqState>,
    action_type: String,
    description: String,
    peer_id: Option<String>,
) -> Result<CommandResponse<String>, String> {
    let action = match action_type.as_str() {
        "message" => ActionType::Message,
        "file" => ActionType::FileTransfer,
        "voice" => ActionType::VoiceCall,
        "video" => ActionType::VideoCall,
        "inference" => ActionType::Inference,
        "compute" => ActionType::Compute,
        "storage" => ActionType::Storage,
        _ => {
            return Ok(CommandResponse::err(format!(
                "Unknown action type: {}",
                action_type
            )))
        }
    };

    let session_id = state
        .tracker
        .start_session(action, description, peer_id)
        .await;
    Ok(CommandResponse::ok(session_id.to_string()))
}

/// End a tracking session (returns Qi consumed)
#[tauri::command]
async fn swarm_end_session(
    state: State<'_, CinqState>,
    session_id: String,
) -> Result<CommandResponse<f64>, String> {
    let uuid =
        uuid::Uuid::parse_str(&session_id).map_err(|e| format!("Invalid session ID: {}", e))?;

    match state.tracker.end_session(uuid).await {
        Some(qi) => Ok(CommandResponse::ok(qi)),
        None => Ok(CommandResponse::err("Session not found")),
    }
}

/// Record bytes sent for a session
#[tauri::command]
async fn swarm_record_bytes(
    state: State<'_, CinqState>,
    session_id: String,
    bytes_sent: u64,
    bytes_received: u64,
) -> Result<CommandResponse<()>, String> {
    let uuid =
        uuid::Uuid::parse_str(&session_id).map_err(|e| format!("Invalid session ID: {}", e))?;

    if bytes_sent > 0 {
        state.tracker.record_bytes_sent(uuid, bytes_sent).await;
    }
    if bytes_received > 0 {
        state
            .tracker
            .record_bytes_received(uuid, bytes_received)
            .await;
    }

    Ok(CommandResponse::ok(()))
}

/// Check for any warnings across active sessions
#[tauri::command]
async fn swarm_check_warnings(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<Vec<Warning>>, String> {
    let warnings = state.tracker.check_warnings().await;
    Ok(CommandResponse::ok(warnings))
}

/// Estimate cost for a potential action
#[tauri::command]
async fn swarm_estimate_cost(
    state: State<'_, CinqState>,
    action_type: String,
    units: f64,
) -> Result<CommandResponse<swarm::tracker::CostEstimate>, String> {
    let action = match action_type.as_str() {
        "message" => ActionType::Message,
        "file" => ActionType::FileTransfer,
        "voice" => ActionType::VoiceCall,
        "video" => ActionType::VideoCall,
        "inference" => ActionType::Inference,
        "compute" => ActionType::Compute,
        "storage" => ActionType::Storage,
        _ => {
            return Ok(CommandResponse::err(format!(
                "Unknown action type: {}",
                action_type
            )))
        }
    };

    let estimate = state.tracker.estimate_cost(action, units);
    Ok(CommandResponse::ok(estimate))
}

/// Get the cost table (all rates)
#[tauri::command]
async fn swarm_get_cost_table(
    _state: State<'_, CinqState>,
) -> Result<CommandResponse<CostTable>, String> {
    Ok(CommandResponse::ok(CostTable::default()))
}

// ============================================================================
// Bandwidth Worker Commands
// ============================================================================

/// Response for bandwidth operations
#[derive(Debug, Serialize)]
pub struct BandwidthResponse {
    pub success: bool,
    pub message: String,
    pub stream_id: Option<String>,
    pub bytes_processed: u64,
    pub qi_cost: f64,
}

/// Send a message through bandwidth worker
#[tauri::command]
async fn worker_send_message(
    state: State<'_, CinqState>,
    peer_id: String,
    content: String,
) -> Result<CommandResponse<BandwidthResponse>, String> {
    let result = state
        .bandwidth_worker
        .send_message(&peer_id, &content)
        .await;

    Ok(CommandResponse::ok(BandwidthResponse {
        success: result.success,
        message: result.message,
        stream_id: None,
        bytes_processed: result.bytes_processed,
        qi_cost: result.qi_cost,
    }))
}

/// Start a voice call through bandwidth worker
#[tauri::command]
async fn worker_start_call(
    state: State<'_, CinqState>,
    peer_id: String,
) -> Result<CommandResponse<BandwidthResponse>, String> {
    let result = state.bandwidth_worker.start_call(&peer_id).await;

    // Extract stream_id from result data if present
    let stream_id = result
        .data
        .as_ref()
        .and_then(|d| d.as_str())
        .map(|s| s.to_string());

    Ok(CommandResponse::ok(BandwidthResponse {
        success: result.success,
        message: result.message,
        stream_id,
        bytes_processed: result.bytes_processed,
        qi_cost: result.qi_cost,
    }))
}

/// Start a video call through bandwidth worker
#[tauri::command]
async fn worker_start_video_call(
    state: State<'_, CinqState>,
    peer_id: String,
) -> Result<CommandResponse<BandwidthResponse>, String> {
    let result = state.bandwidth_worker.start_video_call(&peer_id).await;

    let stream_id = result
        .data
        .as_ref()
        .and_then(|d| d.as_str())
        .map(|s| s.to_string());

    Ok(CommandResponse::ok(BandwidthResponse {
        success: result.success,
        message: result.message,
        stream_id,
        bytes_processed: result.bytes_processed,
        qi_cost: result.qi_cost,
    }))
}

/// End an active call
#[tauri::command]
async fn worker_end_call(
    state: State<'_, CinqState>,
    stream_id: String,
) -> Result<CommandResponse<BandwidthResponse>, String> {
    let result = state.bandwidth_worker.end_call(&stream_id).await;

    Ok(CommandResponse::ok(BandwidthResponse {
        success: result.success,
        message: result.message,
        stream_id: Some(stream_id),
        bytes_processed: result.bytes_processed,
        qi_cost: result.qi_cost,
    }))
}

/// Get bandwidth metrics from worker
#[tauri::command]
async fn worker_get_bandwidth_stats(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<serde_json::Value>, String> {
    let stats = state.bandwidth_worker.get_session_stats().await;
    let active = state.bandwidth_worker.active_stream_count().await;
    Ok(CommandResponse::ok(serde_json::json!({
        "total_bytes_sent": stats.0,
        "total_bytes_received": stats.1,
        "active_streams": active,
    })))
}

// ============================================================================
// Storage Worker Commands
// ============================================================================

/// Response for storage operations
#[derive(Debug, Serialize)]
pub struct StorageResponse {
    pub success: bool,
    pub message: String,
    pub file_id: Option<String>,
    pub bytes_stored: u64,
    pub qi_cost: f64,
}

/// Store a message in local history
#[tauri::command]
async fn worker_store_message(
    state: State<'_, CinqState>,
    conversation_id: String,
    sender_id: String,
    content: String,
) -> Result<CommandResponse<StorageResponse>, String> {
    let result = state
        .storage_worker
        .store_message(&conversation_id, &sender_id, &content)
        .await;

    Ok(CommandResponse::ok(StorageResponse {
        success: result.success,
        message: result.message,
        file_id: None,
        bytes_stored: result.bytes_processed,
        qi_cost: result.qi_cost,
    }))
}

/// Search messages
#[tauri::command]
async fn worker_search_messages(
    state: State<'_, CinqState>,
    query: String,
) -> Result<CommandResponse<Vec<serde_json::Value>>, String> {
    let result = state.storage_worker.search_messages(&query).await;

    // Parse the data field which contains search results
    let messages = result
        .data
        .and_then(|d| d.as_array().cloned())
        .unwrap_or_default();

    Ok(CommandResponse::ok(messages))
}

/// Store a file locally
#[tauri::command]
async fn worker_store_file(
    state: State<'_, CinqState>,
    filename: String,
    data: Vec<u8>,
    mime_type: String,
) -> Result<CommandResponse<StorageResponse>, String> {
    let result = state
        .storage_worker
        .store_file_local(&filename, &data, &mime_type)
        .await;

    let file_id = result
        .data
        .as_ref()
        .and_then(|d| d.get("file_id"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    Ok(CommandResponse::ok(StorageResponse {
        success: result.success,
        message: result.message,
        file_id,
        bytes_stored: result.bytes_processed,
        qi_cost: result.qi_cost,
    }))
}

/// Upload a file to cloud backup (costs Qi)
#[tauri::command]
async fn worker_upload_cloud(
    state: State<'_, CinqState>,
    file_id: String,
) -> Result<CommandResponse<StorageResponse>, String> {
    let result = state.storage_worker.upload_to_cloud(&file_id).await;

    Ok(CommandResponse::ok(StorageResponse {
        success: result.success,
        message: result.message,
        file_id: Some(file_id),
        bytes_stored: result.bytes_processed,
        qi_cost: result.qi_cost,
    }))
}

/// Get storage stats
#[tauri::command]
async fn worker_get_storage_stats(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<serde_json::Value>, String> {
    let stats = state.storage_worker.get_storage_stats().await;
    Ok(CommandResponse::ok(serde_json::json!({
        "local_bytes": stats.0,
        "cloud_bytes": stats.1,
    })))
}

// ============================================================================
// Payment Worker Commands
// ============================================================================

/// Response for payment operations
#[derive(Debug, Serialize)]
pub struct PaymentResponse {
    pub success: bool,
    pub message: String,
    pub session_id: Option<String>,
    pub qi_amount: f64,
}

/// Start a payment session
#[tauri::command]
async fn worker_payment_start_session(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<PaymentResponse>, String> {
    let worker = state.payment_worker.write().await;
    let result = worker.start_session().await;

    Ok(CommandResponse::ok(PaymentResponse {
        success: result.success,
        message: result.message,
        session_id: None,
        qi_amount: result.qi_cost,
    }))
}

/// Record cost for a session
#[tauri::command]
async fn worker_payment_record_cost(
    state: State<'_, CinqState>,
    action_type: String,
    units: f64,
    cost: f64,
) -> Result<CommandResponse<PaymentResponse>, String> {
    let action = match action_type.as_str() {
        "message" => ActionType::Message,
        "file" => ActionType::FileTransfer,
        "voice" => ActionType::VoiceCall,
        "video" => ActionType::VideoCall,
        "inference" => ActionType::Inference,
        "compute" => ActionType::Compute,
        "storage" => ActionType::Storage,
        _ => {
            return Ok(CommandResponse::err(format!(
                "Unknown action type: {}",
                action_type
            )))
        }
    };

    let worker = state.payment_worker.read().await;
    let result = worker.record_cost(action, units, cost).await;

    Ok(CommandResponse::ok(PaymentResponse {
        success: result.success,
        message: result.message,
        session_id: None,
        qi_amount: result.qi_cost,
    }))
}

/// End a payment session
#[tauri::command]
async fn worker_payment_end_session(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<PaymentResponse>, String> {
    let worker = state.payment_worker.read().await;
    let result = worker.end_session().await;

    Ok(CommandResponse::ok(PaymentResponse {
        success: result.success,
        message: result.message,
        session_id: None,
        qi_amount: result.qi_cost,
    }))
}

/// Get all pending payments ready for settlement
#[tauri::command]
async fn worker_payment_get_pending(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<serde_json::Value>, String> {
    let worker = state.payment_worker.read().await;
    let payments = worker.get_pending_payments().await;

    Ok(CommandResponse::ok(serde_json::json!(payments)))
}

/// Prepare settlement batch for Pelagus
#[tauri::command]
async fn worker_payment_prepare_settlement(
    state: State<'_, CinqState>,
    payment_id: String,
) -> Result<CommandResponse<serde_json::Value>, String> {
    let worker = state.payment_worker.read().await;
    let result = worker.prepare_settlement(&payment_id).await;

    let settlement = result.data.unwrap_or(serde_json::json!({}));
    Ok(CommandResponse::ok(settlement))
}

// ============================================================================
// App Registry Commands
// ============================================================================

/// Get all registered apps
#[tauri::command]
async fn apps_list(state: State<'_, CinqState>) -> Result<CommandResponse<Vec<AppInfo>>, String> {
    let registry = state.apps.read().await;
    let apps: Vec<AppInfo> = registry.list_apps().into_iter().map(|a| a.into()).collect();

    Ok(CommandResponse::ok(apps))
}

/// Get pinned apps for dock/sidebar
#[tauri::command]
async fn apps_pinned(state: State<'_, CinqState>) -> Result<CommandResponse<Vec<AppInfo>>, String> {
    let registry = state.apps.read().await;
    let apps: Vec<AppInfo> = registry
        .pinned_apps()
        .into_iter()
        .map(|a| a.into())
        .collect();

    Ok(CommandResponse::ok(apps))
}

/// Get a specific app
#[tauri::command]
async fn apps_get(
    state: State<'_, CinqState>,
    app_id: String,
) -> Result<CommandResponse<AppInfo>, String> {
    let registry = state.apps.read().await;
    let id = AppId::new(&app_id);

    match registry.get_app(&id) {
        Some(app) => Ok(CommandResponse::ok(app.into())),
        None => Ok(CommandResponse::err(format!("App not found: {}", app_id))),
    }
}

/// Get currently active app
#[tauri::command]
async fn apps_active(
    state: State<'_, CinqState>,
) -> Result<CommandResponse<Option<AppInfo>>, String> {
    let registry = state.apps.read().await;
    let active = registry.active_app().map(|a| a.into());

    Ok(CommandResponse::ok(active))
}

/// Launch an app
#[tauri::command]
async fn apps_launch(
    state: State<'_, CinqState>,
    app_id: String,
) -> Result<CommandResponse<AppInfo>, String> {
    let mut registry = state.apps.write().await;
    let id = AppId::new(&app_id);

    if let Err(e) = registry.launch_app(&id) {
        return Ok(CommandResponse::err(e));
    }

    match registry.get_app(&id) {
        Some(app) => Ok(CommandResponse::ok(app.into())),
        None => Ok(CommandResponse::err(format!("App not found: {}", app_id))),
    }
}

/// Close an app
#[tauri::command]
async fn apps_close(
    state: State<'_, CinqState>,
    app_id: String,
) -> Result<CommandResponse<()>, String> {
    let mut registry = state.apps.write().await;
    let id = AppId::new(&app_id);

    if let Err(e) = registry.close_app(&id) {
        return Ok(CommandResponse::err(e));
    }

    Ok(CommandResponse::ok(()))
}

/// Minimize an app to background
#[tauri::command]
async fn apps_minimize(
    state: State<'_, CinqState>,
    app_id: String,
) -> Result<CommandResponse<()>, String> {
    let mut registry = state.apps.write().await;
    let id = AppId::new(&app_id);

    if let Err(e) = registry.minimize_app(&id) {
        return Ok(CommandResponse::err(e));
    }

    Ok(CommandResponse::ok(()))
}

/// Pin an app to the dock
#[tauri::command]
async fn apps_pin(
    state: State<'_, CinqState>,
    app_id: String,
    position: u32,
) -> Result<CommandResponse<()>, String> {
    let mut registry = state.apps.write().await;
    let id = AppId::new(&app_id);

    if let Err(e) = registry.pin_app(&id, position) {
        return Ok(CommandResponse::err(e));
    }

    Ok(CommandResponse::ok(()))
}

/// Unpin an app from the dock
#[tauri::command]
async fn apps_unpin(
    state: State<'_, CinqState>,
    app_id: String,
) -> Result<CommandResponse<()>, String> {
    let mut registry = state.apps.write().await;
    let id = AppId::new(&app_id);

    if let Err(e) = registry.unpin_app(&id) {
        return Ok(CommandResponse::err(e));
    }

    Ok(CommandResponse::ok(()))
}

fn main() {
    // Start the MCP server for Entropic integration
    std::thread::spawn(|| {
        let rt = tokio::runtime::Runtime::new().expect("Failed to create tokio runtime");
        rt.block_on(async {
            let config = McpServerConfig::default(); // localhost:3000
            log::info!("🚀 Starting cinQ MCP Server on http://{}:{}", config.host, config.port);
            if let Err(e) = mcp::start_mcp_server(config).await {
                log::error!("MCP server error: {}", e);
            }
        });
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .manage(CinqState::new())
        .invoke_handler(tauri::generate_handler![
            reset_identity,
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
            // Swarm usage tracker commands
            swarm_get_balance,
            swarm_set_balance,
            swarm_start_session,
            swarm_end_session,
            swarm_record_bytes,
            swarm_check_warnings,
            swarm_estimate_cost,
            swarm_get_cost_table,
            // Bandwidth worker commands
            worker_send_message,
            worker_start_call,
            worker_start_video_call,
            worker_end_call,
            worker_get_bandwidth_stats,
            // Storage worker commands
            worker_store_message,
            worker_search_messages,
            worker_store_file,
            worker_upload_cloud,
            worker_get_storage_stats,
            // Payment worker commands
            worker_payment_start_session,
            worker_payment_record_cost,
            worker_payment_end_session,
            worker_payment_get_pending,
            worker_payment_prepare_settlement,
            // App registry commands
            apps_list,
            apps_pinned,
            apps_get,
            apps_active,
            apps_launch,
            apps_close,
            apps_minimize,
            apps_pin,
            apps_unpin,
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
