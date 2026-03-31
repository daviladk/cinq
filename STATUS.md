# cinQ — Project Status

> **Version:** 0.9.0  
> **Updated:** March 30, 2026

---

## Overview

cinQ is a workspace app for Entropic — providing identity, messaging, storage, and payment services that Claude interacts with via tool calls.

**Development:** Standalone Tauri app with MCP server on localhost:3000  
**Production:** Integrates into Entropic as a native workspace service

---

## Current State

### What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| Tauri app | ✅ | Builds and runs standalone |
| MCP server | ✅ | HTTP on localhost:3000 |
| Tool definitions | ✅ | 13 tools registered |
| Tool handlers | 🔧 | Return mock data |
| P2P code (`grid/`) | ✅ | Exists, not connected |
| Storage code | ✅ | Exists, not connected |

### What's Stubbed

All tool handlers return mock data. Example:

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"cinq_id_whoami","arguments":{}},"id":1}'
```

Returns:
```json
{
  "chat_id": "@demo_user",
  "peer_id": "12D3KooW...",
  "quai_address": "0x..."
}
```

But this is **hardcoded mock data** — not reading from actual identity.

---

## MCP Tools

| Tool | Defined | Wired |
|------|---------|-------|
| `cinq_id_whoami` | ✅ | ❌ stub |
| `cinq_id_lookup` | ✅ | ❌ stub |
| `cinq_id_contacts` | ✅ | ❌ stub |
| `cinq_chat_send` | ✅ | ❌ stub |
| `cinq_chat_history` | ✅ | ❌ stub |
| `cinq_chat_conversations` | ✅ | ❌ stub |
| `cinq_drive_list` | ✅ | ❌ stub |
| `cinq_drive_read` | ✅ | ❌ stub |
| `cinq_drive_write` | ✅ | ❌ stub |
| `cinq_drive_share` | ✅ | ❌ stub |
| `cinq_pay_balance` | ✅ | ❌ stub |
| `cinq_pay_usage` | ✅ | ❌ stub |
| `cinq_pay_costs` | ✅ | ❌ stub |

---

## Code Structure

```
src-tauri/src/
├── main.rs           # App entry, starts MCP server
├── mcp/
│   ├── server.rs     # Axum HTTP server (localhost:3000)
│   ├── protocol.rs   # JSON-RPC types
│   └── tools.rs      # Tool definitions + stub handlers
├── grid/             # P2P layer (exists, not connected to MCP)
│   ├── node.rs       # libp2p swarm
│   ├── chat.rs       # Messaging + SQLite
│   ├── userid.rs     # Identity registry
│   └── transfer.rs   # File transfer
└── swarm/            # Metering (exists, not connected to MCP)
    ├── costs.rs      # Qi pricing
    └── tracker.rs    # Usage tracking
```

### The Gap

MCP handlers in `tools.rs` have `// TODO: Wire to CinqState` comments.

The connection: **MCP → CinqState → P2P/Storage** doesn't exist yet.

---

## To Make It Real

### Phase 1: Wire ID Tools
1. Pass `CinqState` to MCP server
2. `cinq_id_whoami` → read from identity store
3. `cinq_id_lookup` → query Kademlia DHT
4. `cinq_id_contacts` → read from SQLite

### Phase 2: Wire Chat Tools
1. `cinq_chat_send` → send via libp2p
2. `cinq_chat_history` → query SQLite
3. Test between two nodes on local network

### Phase 3: Wire Drive Tools
1. `cinq_drive_write` → write to `~/.cinq/drive/`
2. `cinq_drive_read` → read from filesystem
3. `cinq_drive_share` → generate P2P link

### Phase 4: Wire Pay Tools
1. `cinq_pay_balance` → read from metering tracker
2. `cinq_pay_usage` → query by time period

### Phase 5: Entropic Integration
1. Package cinQ for Entropic
2. Register as native workspace app
3. Remove standalone window (runs as service)

---

## Testing

### Run Standalone App

```bash
cd src-tauri
cargo tauri dev
```

### Test MCP Server

```bash
# Health check
curl http://localhost:3000/

# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Call tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"cinq_id_whoami","arguments":{}},"id":2}'
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| App | Tauri 2.x |
| MCP Server | Axum 0.7 |
| P2P | libp2p 0.54 |
| DHT | Kademlia |
| Encryption | Noise |
| Database | SQLite |
