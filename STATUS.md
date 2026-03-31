# cinQ — Project Status

> **Version:** 0.9.0  
> **Updated:** March 30, 2026

---

## Overview

cinQ is a workspace app for Entropic — providing identity, messaging, storage, and payment services with 3-hop onion routing for privacy. Claude interacts with cinQ via tool calls.

**Target:** Native Rust service inside Entropic (PR to dominant-strategies/entropic)

---

## Current State

### What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| Tool definitions | ✅ | 13 tools registered |
| Tool handlers | 🔧 | Return mock data (stubbed) |
| P2P networking (`grid/`) | ✅ | libp2p swarm, DHT, tunnels |
| Storage layer | ✅ | SQLite for identity, messages |
| Metering (`swarm/`) | ✅ | Cost tables, usage tracking |

### What's Stubbed

All MCP tool handlers return mock data. The connection from tools → real services doesn't exist yet.

Example stub response for `cinq_id_whoami`:
```json
{
  "chat_id": "@demo_user",
  "peer_id": "12D3KooW...",
  "quai_address": "0x..."
}
```

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
├── main.rs           # CinqState + Tauri commands
├── lib.rs            # Library exports
├── mcp/
│   ├── server.rs     # Axum HTTP server
│   ├── protocol.rs   # JSON-RPC types
│   └── tools.rs      # Tool definitions + stub handlers
├── grid/             # P2P layer
│   ├── node.rs       # libp2p swarm (Kademlia, mDNS, Noise)
│   ├── chat.rs       # Messaging + SQLite storage
│   ├── tunnel.rs     # P2P tunnel management (for routing)
│   ├── protocol.rs   # Custom P2P protocol messages
│   ├── userid.rs     # Identity registry (Chat ID ↔ Peer ID)
│   ├── proxy.rs      # SOCKS5 proxy (for tunnel routing)
│   ├── metrics.rs    # Bandwidth tracking per peer
│   └── transfer.rs   # File transfer
└── swarm/            # Metering + economics
    ├── costs.rs      # Qi pricing tables
    ├── tracker.rs    # Usage tracking + warnings
    ├── intent.rs     # Intent parsing (for routing decisions)
    └── workers/      # Background workers
        ├── bandwidth.rs
        ├── storage.rs
        └── payment.rs
```

### The Gap

MCP handlers in `tools.rs` have `// TODO: Wire to CinqState` comments.

The connection: **MCP Tools → CinqState → P2P/Storage** doesn't exist yet.

---

## To Make It Real

### Phase 1: Wire ID Tools
1. `cinq_id_whoami` → read from identity store
2. `cinq_id_lookup` → query Kademlia DHT
3. `cinq_id_contacts` → read from SQLite

### Phase 2: Wire Chat Tools
1. `cinq_chat_send` → send via libp2p (with privacy level)
2. `cinq_chat_history` → query SQLite
3. Implement 1-hop routing, peer earns Qi

### Phase 3: Wire Drive Tools
1. `cinq_drive_write` → write to `~/.cinq/drive/`
2. `cinq_drive_read` → read from filesystem
3. `cinq_drive_share` → generate P2P share link

### Phase 4: Wire Pay Tools
1. `cinq_pay_balance` → read from metering tracker
2. `cinq_pay_usage` → query by time period
3. Pelagus integration for Qi settlement

### Phase 5: Privacy Layer
1. 3-hop onion routing
2. Layered encryption per hop
3. Peer selection logic (Claude picks, cinQ executes)

### Phase 6: Entropic Integration
1. Add cinQ Rust code to Entropic's `src-tauri/`
2. Add React UI component (`Cinq.tsx`)
3. Wire into Entropic navigation + Dashboard
4. PR to dominant-strategies/entropic

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| App Shell | Tauri 2.x | Native Rust + Web UI |
| P2P | libp2p 0.54 | DHT, peer discovery, tunnels |
| Encryption | Noise protocol | Secure P2P connections |
| Database | SQLite | Identity, messages, contacts |
| Metering | Custom | Qi cost tracking + warnings |
| Payments | Pelagus | Qi UTXO signing + settlement |
| MCP | Axum 0.7 | Tool interface for Claude |

---

## What Was Removed

- `qora/` — Local AI agent (Ollama-based). Entropic's Claude handles all AI.
- `swarm/qora.rs` — Intent parser. Claude handles intent understanding.
- `test-*.sh` — Old standalone testing scripts.
- Standalone window mode — cinQ runs as service inside Entropic.

---

## See Also

- [README.md](README.md) — Vision and value proposition
- [docs/DESIGN.md](docs/DESIGN.md) — Integration architecture
