# cinQ Cloud — Design Document

> **Version:** 0.9.0  
> **Date:** March 30, 2026

---

## Overview

cinQ is the decentralized workspace layer for [Entropic](https://github.com/dominant-strategies/entropic) — identity, messaging, storage, and payments exposed as tools an AI assistant can actually use.

### Core Thesis

Claude can actually use your workspace: save, share, message, pay — as actions.

### What's Built (v0.9)

| Service | Description | Status |
|---------|-------------|--------|
| **cinQ ID** | Identity + contacts | ✅ Working |
| **cinQ Chat** | P2P messaging | ✅ Working |
| **cinQ Drive Lite** | Local storage + share | ✅ Working |
| **cinQ Pay** | Usage metering | ✅ Working |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        ENTROPIC                             │
│                   (Claude AI + Runtime)                     │
│                            │                                │
│                       MCP Protocol                          │
│                            ▼                                │
├─────────────────────────────────────────────────────────────┤
│                        cinQ CLOUD                           │
│                                                             │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│   │ cinQ ID  │ │cinQ Chat │ │cinQ Drive│ │ cinQ Pay │      │
│   │ identity │ │ messaging│ │  storage │ │ metering │      │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
│        └────────────┴────────────┴────────────┘            │
│                          │                                  │
│                   libp2p mesh                               │
│            (Kademlia DHT + mDNS + Noise)                   │
│                          │                                  │
│   ┌──────────────────────┴─────────────────────────────┐   │
│   │              MCP SERVER (localhost:3000)            │   │
│   │                   JSON-RPC / HTTP                   │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │      QUAI NETWORK       │
              │    (Qi via Pelagus)     │
              └─────────────────────────┘
```

---

## Services

### cinQ ID (Identity)

Human-readable Chat IDs mapped to cryptographic Peer IDs.

**How it works:**
1. User picks Chat ID (`@alice`)
2. cinQ generates libp2p keypair (Ed25519)
3. Mapping published to Kademlia DHT
4. Others query DHT: `@alice` → Peer ID

**Storage:** SQLite (`~/.cinq/chat.db`)

**MCP Tools:**
| Tool | Description |
|------|-------------|
| `cinq_id_whoami` | Get your identity |
| `cinq_id_lookup` | Find user by Chat ID |
| `cinq_id_contacts` | List contacts |

**Current Limitations:**
- DHT entries don't persist across node restarts
- No spam protection on registration
- No key recovery

---

### cinQ Chat (Messaging)

Direct P2P messaging over libp2p.

**How it works:**
1. Resolve recipient Chat ID via DHT
2. Connect directly to their Peer ID
3. Send encrypted message (Noise protocol)
4. Store in local SQLite

**Protocol:** Request-response over libp2p streams

**MCP Tools:**
| Tool | Description |
|------|-------------|
| `cinq_chat_send` | Send a message |
| `cinq_chat_history` | Get conversation history |
| `cinq_chat_conversations` | List conversations |

**Current Limitations:**
- Requires both peers online (no offline queue)
- No read receipts
- No group chat

---

### cinQ Drive Lite (Storage)

Local-first file storage with P2P sharing.

**How it works:**
1. Files stored locally in `~/.cinq/drive/`
2. Share generates link with Peer ID + path
3. Recipient connects directly to fetch file

**Current Implementation:**
```
File save → Local filesystem
Share → P2P link (sender must be online)
Fetch → Direct peer connection
```

**MCP Tools:**
| Tool | Description |
|------|-------------|
| `cinq_drive_list` | List files |
| `cinq_drive_read` | Read file |
| `cinq_drive_write` | Write file |
| `cinq_drive_share` | Generate share link |

**Current Limitations:**
- Local storage only (not distributed)
- Share links fail if sender offline
- No redundancy or availability guarantees
- No provider economy

**Future (Drive Full):**
- Distributed storage across providers
- Encrypted chunks with Reed-Solomon
- Availability SLAs backed by Qi stakes

---

### cinQ Pay (Metering)

Track Qi costs for operations.

**How it works:**
- Every operation has a defined Qi cost
- Usage accumulated locally
- Breakdown available by category and time

**Current Qi Costs (defined in `costs.rs`):**
| Operation | Cost |
|-----------|------|
| Send message | 0.001 Qi |
| Store 1 MB | 0.01 Qi/month |
| Share file | 0.002 Qi |

**MCP Tools:**
| Tool | Description |
|------|-------------|
| `cinq_pay_balance` | Check balance |
| `cinq_pay_usage` | Usage breakdown |
| `cinq_pay_costs` | Pricing table |

**Current Limitations:**
- Metering only — no actual Qi transactions
- Requires Pelagus wallet integration for payments

---

## Technical Details

### Peer Discovery

| Method | Scope | How |
|--------|-------|-----|
| mDNS | Local network | Broadcast on 224.0.0.251:5353 |
| Kademlia DHT | Internet | Bootstrap to known nodes |
| Direct dial | Anywhere | Connect via known Peer ID |

### Identity Resolution

```
@alice → DHT query → Peer ID (12D3KooW...)
```

- Chat IDs are keys in the Kademlia DHT
- Values are Peer ID + Quai address + metadata
- Cached locally after first lookup

### Message Flow

```
User A                           User B
   │                                │
   ├─ resolve @bob ───DHT───────────┤
   │◄──────────────── Peer ID ──────┤
   │                                │
   ├─ connect ──────────────────────┤
   ├─ send message (encrypted) ─────┤
   │                                │
   ├─ store locally                 ├─ store locally
```

### File Sharing Flow

```
User A                           User B
   │                                │
   ├─ write file locally            │
   ├─ share → generate link         │
   │                                │
   │   Link: cinq://PeerID/path     │
   │                                │
   ├─────── send link via chat ─────┤
   │                                │
   │                    connect ◄───┤
   │◄───────── request file ────────┤
   ├─────────── send file ──────────┤
```

---

## Data Storage

### SQLite Schema (`~/.cinq/chat.db`)

**users**
```sql
CREATE TABLE users (
    peer_id TEXT PRIMARY KEY,
    chat_id TEXT UNIQUE,
    quai_address TEXT,
    name TEXT,
    created_at INTEGER
);
```

**messages**
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    from_peer TEXT,
    to_peer TEXT,
    content TEXT,
    timestamp INTEGER,
    read INTEGER DEFAULT 0
);
```

**contacts**
```sql
CREATE TABLE contacts (
    peer_id TEXT PRIMARY KEY,
    chat_id TEXT,
    name TEXT,
    added_at INTEGER
);
```

### File Storage

```
~/.cinq/
├── chat.db          # SQLite (identity, messages, contacts)
├── keys/            # libp2p keypair
└── drive/           # Local file storage
    ├── documents/
    ├── shared/
    └── ...
```

---

## MCP Server

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check + server info |
| `/mcp` | POST | JSON-RPC handler |

### JSON-RPC Protocol

**List tools:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

**Call tool:**
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
  "id": 2
}
```

---

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Tauri | 2.x |
| P2P | libp2p | 0.54 |
| DHT | Kademlia | — |
| Encryption | Noise | — |
| Discovery | mDNS | — |
| Database | SQLite | rusqlite |
| MCP Server | Axum | 0.7 |
| Serialization | serde_json | — |

---

## Future Work

### v1.0 (MVP Polish)
- Persistent DHT entries
- Offline message queue
- Pelagus wallet integration

### v1.x (Growth)
- Distributed storage (providers)
- Provider mode (earn Qi)
- Anti-spam (Qi deposits)
- Key recovery

### Future Services
- cinQ Mail (async email)
- cinQ Browser (web3 browser)
- Provider economy
