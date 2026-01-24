// Cinq Connect - DePIN Grid Foundation
// Secure P2P mesh network for Quai Network

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod grid;

use grid::{CinqNode, BandwidthMetrics, GridPeer, ProxyStatus};
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::State;
use serde::Serialize;

/// Global state for the Cinq node
pub struct CinqState {
    node: Arc<RwLock<Option<CinqNode>>>,
}

impl CinqState {
    pub fn new() -> Self {
        Self {
            node: Arc::new(RwLock::new(None)),
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
async fn start_node(state: State<'_, CinqState>) -> Result<CommandResponse<String>, String> {
    let mut node_guard = state.node.write().await;
    
    if node_guard.is_some() {
        return Ok(CommandResponse::err("Node is already running"));
    }
    
    match CinqNode::new() {
        Ok(mut node) => {
            let peer_id = node.peer_id_string();
            
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
    let node_guard = state.node.read().await;
    
    match node_guard.as_ref() {
        Some(node) => Ok(CommandResponse::ok(node.peer_id_string())),
        None => Ok(CommandResponse::err("Node is not running")),
    }
}

/// Get list of discovered peers on the grid
#[tauri::command]
async fn get_peers(state: State<'_, CinqState>) -> Result<CommandResponse<Vec<GridPeer>>, String> {
    let node_guard = state.node.read().await;
    
    match node_guard.as_ref() {
        Some(node) => {
            let peers = node.get_peers().await;
            Ok(CommandResponse::ok(peers))
        }
        None => Ok(CommandResponse::err("Node is not running")),
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
    let mut node_guard = state.node.write().await;
    
    match node_guard.as_mut() {
        Some(node) => {
            let proxy_port = port.unwrap_or(1080);
            match node.start_proxy(proxy_port).await {
                Ok(_) => Ok(CommandResponse::ok(format!("127.0.0.1:{}", proxy_port))),
                Err(e) => Ok(CommandResponse::err(format!("Failed to start proxy: {}", e))),
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running Cinq Connect");
}