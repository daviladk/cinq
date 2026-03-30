// cinQ MCP Server
//
// HTTP server that exposes cinQ Cloud services via MCP protocol.
// Entropic/OpenClaw can connect to this server and call cinQ tools.

use axum::{
    extract::State,
    http::{HeaderMap, Method, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use tower_http::cors::{Any, CorsLayer};
use std::sync::Arc;
use tokio::sync::RwLock;

use super::protocol::*;
use super::tools::{get_tools, handle_tool_call};

/// MCP Server configuration
#[derive(Clone)]
pub struct McpServerConfig {
    pub host: String,
    pub port: u16,
}

impl Default for McpServerConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 3000,
        }
    }
}

/// MCP Server state
#[derive(Clone)]
pub struct McpServerState {
    pub initialized: Arc<RwLock<bool>>,
    // TODO: Add reference to CinqState for actual service calls
}

impl McpServerState {
    pub fn new() -> Self {
        Self {
            initialized: Arc::new(RwLock::new(false)),
        }
    }
}

/// Start the MCP server
pub async fn start_mcp_server(config: McpServerConfig) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let state = McpServerState::new();
    
    // CORS layer for cross-origin requests (Entropic might need this)
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(Any);

    let app = Router::new()
        // MCP endpoints
        .route("/mcp", post(handle_mcp_request))
        .route("/mcp/sse", get(handle_sse))
        
        // Health check
        .route("/health", get(health_check))
        
        // Server info
        .route("/", get(server_info))
        
        .layer(cors)
        .with_state(state);

    let addr = format!("{}:{}", config.host, config.port);
    log::info!("🚀 cinQ MCP Server starting on http://{}", addr);
    log::info!("   Tools available: {} cinQ Cloud tools", get_tools().len());
    
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}

/// Health check endpoint
async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "cinq-mcp",
        "version": env!("CARGO_PKG_VERSION")
    }))
}

/// Server info endpoint
async fn server_info() -> impl IntoResponse {
    Json(serde_json::json!({
        "name": "cinQ Cloud",
        "description": "Decentralized workspace for Entropic - ID, Chat, Drive, Pay",
        "version": env!("CARGO_PKG_VERSION"),
        "mcp_endpoint": "/mcp",
        "tools_count": get_tools().len(),
        "services": ["cinQ ID", "cinQ Chat", "cinQ Drive", "cinQ Pay"]
    }))
}

/// Handle MCP JSON-RPC requests
async fn handle_mcp_request(
    State(state): State<McpServerState>,
    Json(request): Json<JsonRpcRequest>,
) -> impl IntoResponse {
    log::debug!("MCP request: {} (id: {:?})", request.method, request.id);
    
    let response = match request.method.as_str() {
        METHOD_INITIALIZE => handle_initialize(&state, &request).await,
        METHOD_INITIALIZED => handle_initialized(&state, &request).await,
        METHOD_TOOLS_LIST => handle_tools_list(&request).await,
        METHOD_TOOLS_CALL => handle_tools_call(&request).await,
        METHOD_PING => handle_ping(&request).await,
        _ => JsonRpcResponse::error(
            request.id,
            METHOD_NOT_FOUND,
            format!("Method not found: {}", request.method),
        ),
    };
    
    Json(response)
}

/// Handle SSE endpoint for streaming (if needed)
async fn handle_sse() -> impl IntoResponse {
    // For now, just return info that SSE is available
    // Full SSE implementation can be added later if needed
    Json(serde_json::json!({
        "message": "SSE endpoint - use POST /mcp for JSON-RPC"
    }))
}

// ============================================================================
// MCP Method Handlers
// ============================================================================

async fn handle_initialize(
    state: &McpServerState,
    request: &JsonRpcRequest,
) -> JsonRpcResponse {
    // Parse initialize params (optional, for logging)
    if let Some(params) = &request.params {
        if let Ok(init_params) = serde_json::from_value::<InitializeParams>(params.clone()) {
            log::info!(
                "MCP client connecting: {} v{}",
                init_params.client_info.name,
                init_params.client_info.version
            );
        }
    }

    let result = InitializeResult {
        protocol_version: "2024-11-05".to_string(),
        capabilities: ServerCapabilities {
            tools: Some(ToolsCapability { list_changed: false }),
            resources: None,
            prompts: None,
        },
        server_info: ServerInfo {
            name: "cinQ Cloud".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
        },
    };

    JsonRpcResponse::success(request.id.clone(), serde_json::to_value(result).unwrap())
}

async fn handle_initialized(
    state: &McpServerState,
    request: &JsonRpcRequest,
) -> JsonRpcResponse {
    let mut initialized = state.initialized.write().await;
    *initialized = true;
    log::info!("✅ MCP client initialized successfully");
    
    // This is a notification, no response needed but we'll send one anyway
    JsonRpcResponse::success(request.id.clone(), serde_json::json!({}))
}

async fn handle_tools_list(request: &JsonRpcRequest) -> JsonRpcResponse {
    let tools = get_tools();
    let result = ListToolsResult { tools };
    
    JsonRpcResponse::success(request.id.clone(), serde_json::to_value(result).unwrap())
}

async fn handle_tools_call(request: &JsonRpcRequest) -> JsonRpcResponse {
    let params: CallToolParams = match &request.params {
        Some(p) => match serde_json::from_value(p.clone()) {
            Ok(params) => params,
            Err(e) => {
                return JsonRpcResponse::error(
                    request.id.clone(),
                    INVALID_PARAMS,
                    format!("Invalid tool call params: {}", e),
                );
            }
        },
        None => {
            return JsonRpcResponse::error(
                request.id.clone(),
                INVALID_PARAMS,
                "Missing tool call params",
            );
        }
    };

    log::info!("🔧 Tool call: {}", params.name);
    
    let result = handle_tool_call(&params.name, &params.arguments).await;
    
    JsonRpcResponse::success(request.id.clone(), serde_json::to_value(result).unwrap())
}

async fn handle_ping(request: &JsonRpcRequest) -> JsonRpcResponse {
    JsonRpcResponse::success(request.id.clone(), serde_json::json!({}))
}

// ============================================================================
// Helper to start server in background
// ============================================================================

/// Start MCP server in a background task
pub fn spawn_mcp_server(config: McpServerConfig) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        if let Err(e) = start_mcp_server(config).await {
            log::error!("MCP server error: {}", e);
        }
    })
}
