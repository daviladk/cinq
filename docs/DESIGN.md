# cinQ Cloud — Design Document

> **Version:** 0.8.0  
> **Date:** March 30, 2026  
> **Status:** Phase 4 - cinQ Cloud for Entropic

---

## Overview

**cinQ Cloud** is a decentralized workspace layer for [Entropic](https://github.com/dominant-strategies/entropic), providing familiar productivity services (identity, email, chat, storage, payments) powered by a P2P mesh network.

### Core Vision

- **People-powered infrastructure** — Users ARE the network, no dedicated servers needed
- **Familiar services** — Google Workspace UX with decentralized backend
- **MCP integration** — Claude in Entropic can use cinQ tools directly
- **Qi economy** — All services metered in Qi for fair compensation

### The Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENTROPIC                                 │
│                  (Claude AI Desktop App)                        │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Claude Agent                          │   │
│   │            (understands natural language)                │   │
│   └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                        MCP Protocol                             │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        cinQ CLOUD                               │
│                  (Decentralized Workspace)                      │
│                                                                 │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│   │ cinQ ID  │ │cinQ Chat │ │cinQ Drive│ │cinQ Mail │          │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│        │            │            │            │                 │
│   ┌──────────┐ ┌──────────┐                                    │
│   │cinQ Pay  │ │cinQBrowser│                                    │
│   └────┬─────┘ └────┬─────┘                                    │
│        │            │                                           │
│        └────────────┴────────────┬──────────────────────────┐  │
│                                  │                           │  │
│                          ┌───────┴───────┐                   │  │
│                          │  libp2p mesh  │                   │  │
│                          └───────────────┘                   │  │
│                                                              │  │
│   ┌──────────────────────────────────────────────────────┐  │  │
│   │                 MCP SERVER (:3000)                    │  │  │
│   │           JSON-RPC over HTTP (Axum)                   │  │  │
│   └──────────────────────────────────────────────────────┘  │  │
│                                                              │  │
└──────────────────────────────────────────────────────────────┘  │
                                                                  │
                              ▼                                   │
┌─────────────────────────────────────────────────────────────────┘
│                      QUAI NETWORK
│                   (Qi Payments + Identity)
│
│   ┌──────────────────────────────────────────────────────┐
│   │                  Pelagus Wallet                       │
│   │          (handles all blockchain operations)          │
│   └──────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────
```

---

## Services

### cinQ ID (Identity)

Decentralized identity with human-readable Chat IDs.

**Features:**
- Chat ID registration (`@username`)
- Peer ID mapping (libp2p Ed25519 keypair)
- Contact management
- Profile information (name, avatar, bio)

**Storage:** SQLite (`~/.cinq/chat.db`)

**MCP Tools:**
- `cinq_id_whoami` — Get current user's identity
- `cinq_id_lookup` — Find user by Chat ID
- `cinq_id_contacts` — List all contacts

---

### cinQ Chat (Messaging)

Real-time P2P messaging over libp2p.

**Features:**
- Direct peer-to-peer messages
- Conversation history (persisted to SQLite)
- Online/offline presence
- Read receipts

**Protocol:** GossipSub over libp2p with Noise encryption

**MCP Tools:**
- `cinq_chat_send` — Send a message
- `cinq_chat_history` — Get conversation history
- `cinq_chat_conversations` — List all conversations

---

### cinQ Drive (Storage)

Decentralized file storage with providers.

**Features:**
- Local file storage
- P2P file transfer
- Distributed storage across providers
- Encrypted chunks with Reed-Solomon redundancy

**How It Works:**
```
YOUR FILE
    │
    ▼ Encrypt (your keys)
    │
    ▼ Chunk into pieces
    │
    ▼ Reed-Solomon parity
    │
    ▼ Distribute to providers
    │
┌───┴───┬───────┬───────┐
▼       ▼       ▼       ▼
Provider Provider Provider Provider
```

**MCP Tools:**
- `cinq_drive_list` — List files in directory
- `cinq_drive_read` — Read file contents
- `cinq_drive_write` — Write a file
- `cinq_drive_delete` — Delete a file
- `cinq_drive_share` — Generate share link

---

### cinQ Mail (Email)

Async threaded messaging (like email).

**Features:**
- Subject lines
- Rich text bodies
- Attachments (via cinQ Drive)
- Threading/replies
- Anti-spam (Qi deposit for unknowns)

**Anti-Spam Model:**
- Messages from contacts: Free
- Messages from unknowns: Require 0.01 Qi deposit
- If recipient accepts: Deposit refunded
- If recipient rejects as spam: Deposit kept

**Status:** To be built

---

### cinQ Browser (Web3 Browser)

Integrated browser with Pelagus wallet for web3.

**Features:**
- Full web browser
- Pelagus wallet integration
- dApp connectivity
- Transaction signing
- Tab management
- Bookmarks and history

**MCP Tools:**
- `cinq_browser_open` — Navigate to URL
- `cinq_browser_current` — Get current page state
- `cinq_browser_tabs` — List open tabs
- `cinq_browser_wallet_status` — Get wallet connection
- `cinq_browser_wallet_connect` — Connect to dApp
- `cinq_browser_wallet_send` — Request Qi transaction

**Security:** All wallet operations require user approval in Pelagus.

---

### cinQ Pay (Payments)

Usage tracking and Qi payments.

**Features:**
- Real-time usage metering
- Qi cost tables
- Session accounting
- Pelagus integration for actual payments

**Cost Table:**
| Service | Cost |
|---------|------|
| Chat message | 0.0001 Qi |
| Mail to unknown | 0.01 Qi deposit |
| Mail to contact | Free |
| Storage | 0.5 Qi/GB/month |
| Transfer | 1.0 Qi/GB |
| Share link | 0.001 Qi |

**MCP Tools:**
- `cinq_pay_balance` — Get Qi balance and usage
- `cinq_pay_usage` — Get detailed breakdown
- `cinq_pay_costs` — Get pricing table

---

## MCP Server

The MCP (Model Context Protocol) server allows Entropic's Claude to use cinQ services.

### Protocol

JSON-RPC 2.0 over HTTP.

**Endpoint:** `http://localhost:3000/mcp`

### Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "cinq_chat_send",
    "arguments": {
      "to": "@alice",
      "message": "Hello!"
    }
  },
  "id": 1
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"message_id\": \"abc123\"}"
      }
    ]
  },
  "id": 1
}
```

### Available Methods

| Method | Description |
|--------|-------------|
| `initialize` | Initialize MCP session |
| `tools/list` | List available tools |
| `tools/call` | Call a tool |

---

## P2P Networking

### libp2p Stack

| Component | Purpose |
|-----------|---------|
| **Kademlia DHT** | Peer discovery and content routing |
| **mDNS** | Local network discovery |
| **Noise** | Encrypted connections |
| **Yamux** | Stream multiplexing |
| **GossipSub** | Message propagation |

### Peer Discovery

1. **Local (mDNS)** — Discover peers on same network
2. **Bootstrap nodes** — Well-known peers for initial connectivity
3. **DHT** — Find peers by ID across the internet

### Connection Flow

```
1. User starts cinQ app
2. Load keypair from ~/.cinq/keypair.bin (or generate)
3. Start libp2p swarm on port 9000
4. Discover peers via mDNS + bootstrap
5. Connect to discovered peers
6. Exchange identity via /cinq/id/1.0.0
7. Ready for chat/file transfer
```

---

## Security Model

### Trust Boundaries

1. **Pelagus Wallet** — Handles all blockchain operations (signing, transactions)
2. **cinQ App** — Handles compute/data (never sees private keys)
3. **Claude Agent** — Can request actions but requires user approval for payments

### Encryption

| Layer | Protection |
|-------|-----------|
| **Transport** | Noise protocol (all P2P traffic) |
| **Storage** | User's encryption keys (Drive) |
| **Wallet** | Hardware/browser wallet (Pelagus) |

### Key Management

- **Peer Identity**: Ed25519 keypair in `~/.cinq/keypair.bin`
- **Wallet Keys**: Managed by Pelagus (never exposed to cinQ)
- **Encryption Keys**: Derived from user's wallet (for Drive)

---

## Data Storage

### Local Files

| Path | Purpose |
|------|---------|
| `~/.cinq/keypair.bin` | Ed25519 keypair (Peer ID) |
| `~/.cinq/peers.json` | Known peers for bootstrap |
| `~/.cinq/chat.db` | SQLite database |
| `~/.cinq/drive/` | Local file storage |

### SQLite Schema

```sql
-- Conversations
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    peer_id TEXT NOT NULL,
    display_name TEXT,
    created_at INTEGER,
    last_message_at INTEGER,
    unread_count INTEGER DEFAULT 0
);

-- Messages
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    is_outgoing INTEGER NOT NULL,
    status TEXT DEFAULT 'pending'
);

-- Contacts
CREATE TABLE contacts (
    peer_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    chat_id TEXT,
    added_at INTEGER NOT NULL,
    last_seen INTEGER,
    is_online INTEGER DEFAULT 0
);

-- Files (for Drive)
CREATE TABLE files (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    size INTEGER NOT NULL,
    hash TEXT NOT NULL,
    encrypted INTEGER DEFAULT 1,
    created_at INTEGER,
    modified_at INTEGER,
    shared INTEGER DEFAULT 0
);
```

---

## Provider Model

Anyone can be a provider and earn Qi for sharing resources.

### Becoming a Provider

1. Enable "Provider Mode" in settings
2. Configure storage allocation (e.g., 50GB)
3. Set availability schedule
4. Start earning Qi

### Provider Earnings

| Resource | Rate |
|----------|------|
| Storage | 0.25 Qi/GB/month (50% of user cost) |
| Transfer | 0.5 Qi/GB (50% of user cost) |

### Quality Metrics

Providers are rated on:
- **Uptime** — Percentage of time online
- **Latency** — Response time
- **Reliability** — Data retrieval success rate

Higher ratings = More jobs = More earnings.

---

## Roadmap

### Phase 1 — Foundation ✅
- P2P mesh networking (libp2p)
- Basic chat functionality
- Identity (Chat IDs)

### Phase 2 — cinQ Cloud ✅
- MCP server for Entropic
- cinQ Browser with Pelagus
- Usage tracking (cinQ Pay)

### Phase 3 — Storage (Current)
- cinQ Drive (distributed storage)
- Provider mode
- File sharing

### Phase 4 — Communication
- cinQ Mail (async email)
- Anti-spam system
- Rich media support

### Phase 5 — Scale
- Federation between networks
- Mobile companion app
- Enterprise features

---

## Development Guide

### Prerequisites

- Rust 1.77+
- Node.js 18+
- Tauri CLI

### Build Commands

```bash
# Development
cargo tauri dev

# Production
cargo tauri build

# Check compilation
cd src-tauri && cargo check
```

### Testing MCP

```bash
# Health check
curl http://localhost:3000/

# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

### Adding a New Tool

1. Define tool in `src/mcp/tools.rs`:
```rust
Tool {
    name: "cinq_new_tool".to_string(),
    description: "Does something".to_string(),
    input_schema: json!({
        "type": "object",
        "properties": { ... },
        "required": []
    }),
}
```

2. Add handler in `handle_tool_call()`:
```rust
"cinq_new_tool" => handle_new_tool(arguments).await,
```

3. Implement handler:
```rust
async fn handle_new_tool(args: &HashMap<String, Value>) -> CallToolResult {
    // Implementation
    CallToolResult::json(&json!({ "result": "..." }))
}
```

---

## References

- [Entropic](https://github.com/dominant-strategies/entropic) — Claude AI desktop app
- [Quai Network](https://qu.ai) — Layer 1 blockchain
- [Pelagus Wallet](https://pelaguswallet.io) — Quai browser wallet
- [libp2p](https://libp2p.io) — P2P networking
- [Tauri](https://tauri.app) — Desktop app framework
- [MCP Protocol](https://modelcontextprotocol.io) — Model Context Protocol
