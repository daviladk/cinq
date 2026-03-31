# cinQ — Design Document

> **Version:** 0.9.0  
> **Date:** March 30, 2026

---

## Overview

cinQ is a workspace app for [Entropic](https://github.com/dominant-strategies/entropic) — providing identity, messaging, storage, and payment services that Claude interacts with via tool calls.

**Entropic is open source** — cinQ integrates via PR to Entropic core.

### Core Idea

Claude can use your workspace: save files, send messages, look up contacts, track costs — all through natural conversation.

### How It Fits

```
┌─────────────────────────────────────────────────────────────────┐
│                          ENTROPIC                               │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                        Claude                            │   │
│   └───────────────────────┬─────────────────────────────────┘   │
│                           │ tool calls                          │
│                           ▼                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                         cinQ                             │   │
│   │                                                          │   │
│   │   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │   │
│   │   │   ID   │ │  Chat  │ │ Drive  │ │  Pay   │           │   │
│   │   └────────┘ └────────┘ └────────┘ └────────┘           │   │
│   │                       │                                  │   │
│   │              local data + libp2p mesh                    │   │
│   └───────────────────────┼──────────────────────────────────┘   │
│                           │                                     │
│   Other Entropic Apps: Tasks, Jobs, Logs, Billing, Messaging    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    P2P Network (libp2p)
                              │
                              ▼
                    Quai Network (Qi)
```

---

## Services

### cinQ ID (Identity)

Human-readable Chat ID mapped to cryptographic Peer ID.

**How it works:**
1. User picks Chat ID (`@alice`)
2. cinQ generates libp2p keypair (Ed25519)
3. Mapping published to Kademlia DHT
4. Others query DHT: `@alice` → Peer ID

**Tools:**
| Tool | Description |
|------|-------------|
| `cinq_id_whoami` | Get your identity |
| `cinq_id_lookup` | Find user by Chat ID |
| `cinq_id_contacts` | List contacts |

**Data:** SQLite (`~/.cinq/chat.db`)

---

### cinQ Chat (Messaging)

P2P messaging over libp2p.

**How it works:**
1. Resolve recipient Chat ID via DHT
2. Connect directly to their Peer ID
3. Send encrypted message (Noise protocol)
4. Store in local SQLite

**Tools:**
| Tool | Description |
|------|-------------|
| `cinq_chat_send` | Send a message |
| `cinq_chat_history` | Get conversation history |
| `cinq_chat_conversations` | List conversations |

**Flow:**
```
You                              Alice
 │                                  │
 ├─ resolve @alice ───DHT──────────►│
 │◄─────────────── Peer ID ─────────┤
 │                                  │
 ├─ connect (libp2p) ──────────────►│
 ├─ send message (encrypted) ──────►│
 │                                  │
 ├─ store locally                   ├─ store locally
```

---

### cinQ Drive (Storage)

Local-first file storage with P2P sharing.

**How it works:**
1. Files stored locally in `~/.cinq/drive/`
2. Share generates link with Peer ID + path
3. Recipient connects directly to fetch

**Tools:**
| Tool | Description |
|------|-------------|
| `cinq_drive_list` | List files |
| `cinq_drive_read` | Read a file |
| `cinq_drive_write` | Write a file |
| `cinq_drive_share` | Generate share link |

**Flow:**
```
You                              Alice
 │                                  │
 ├─ write file locally              │
 ├─ share → link                    │
 ├─ send link via chat ────────────►│
 │                                  │
 │                     connect ◄────┤
 │◄─────────── request file ────────┤
 ├─────────── send file ───────────►│
```

---

### cinQ Pay (Metering)

Qi-based usage tracking.

**How it works:**
- Operations have defined Qi costs
- Usage accumulated locally
- Settlement via Pelagus wallet

**Tools:**
| Tool | Description |
|------|-------------|
| `cinq_pay_balance` | Check Qi balance |
| `cinq_pay_usage` | Usage breakdown |
| `cinq_pay_costs` | Pricing table |

**Example costs:**
| Operation | Cost |
|-----------|------|
| Send message | 0.001 Qi |
| Store 1 MB | 0.01 Qi/month |
| Share file | 0.002 Qi |

---

## Data Storage

```
~/.cinq/
├── chat.db          # SQLite: identity, messages, contacts
├── keys/            # libp2p keypair
└── drive/           # Local files
```

### SQLite Schema

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

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| App | Tauri 2.x |
| P2P | libp2p 0.54 |
| DHT | Kademlia |
| Encryption | Noise |
| Discovery | mDNS |
| Database | SQLite |
| MCP Server | Axum 0.7 |

---

## Entropic Integration Architecture

Entropic is [open source](https://github.com/dominant-strategies/entropic). cinQ integrates as a **native service** — not a skill/plugin.

### Why Not a Skill?

Entropic "skills" are lightweight JavaScript plugins. cinQ needs:
- Native Rust for libp2p P2P networking
- SQLite for local storage
- Real mesh connectivity
- Its own UI for identity/chat/drive/pay

Skills can't do this. cinQ is a full service, like Tasks or Channels.

### Integration Path: PR to Entropic Core

Contribute cinQ as a native Entropic service:

```
entropic/
├── src-tauri/src/
│   └── cinq/                   # Rust handlers
│       ├── mod.rs
│       ├── identity.rs         # P2P identity, DHT
│       ├── chat.rs             # Messaging
│       ├── drive.rs            # File storage
│       └── pay.rs              # Qi metering
│
├── src/pages/
│   └── Cinq.tsx                # React UI
│
└── src/components/
    └── Layout.tsx              # Add cinQ to nav
```

### How It Works

1. **Rust Handlers** — Add Tauri commands for cinQ services
   ```rust
   #[tauri::command]
   async fn cinq_id_whoami() -> Result<Identity, String> { ... }
   ```

2. **React Page** — Add `Cinq.tsx` component
   ```tsx
   export function Cinq({ gatewayRunning }: Props) {
     // ID, Chat, Drive, Pay UI
   }
   ```

3. **Wire In** — Add to Dashboard routing + Layout nav
   ```tsx
   // Dashboard.tsx
   case "cinq":
     return <Cinq gatewayRunning={gatewayRunning} />;
   
   // Layout.tsx
   { id: "cinq", label: "cinQ", icon: Users }
   ```

4. **PR to Entropic** — Submit for review

### Ownership Model

| Component | Owner |
|-----------|-------|
| Entropic app | Quai / Dominant Strategies |
| cinQ code | You |
| Integration | PR approval by Quai |

You write and maintain the cinQ code. It ships as part of Entropic once merged.

### Key Integration Points

| Entropic Pattern | cinQ Implementation |
|------------------|---------------------|
| `invoke()` FFI | Rust handlers for P2P, storage |
| `GatewayClient` | Tool calls for ID, Chat, Drive, Pay |
| `gatewayRunning` | Controls P2P mesh connection |
| Local storage | `~/.cinq/` data directory |
| WebSocket events | Message notifications |

---

## Development vs Production

### Development (Current)

Standalone Tauri app for testing:

```bash
cargo tauri dev
```

- Launches desktop window
- MCP server on localhost:3000
- Can test tools via curl
- Mirrors production architecture

### Production (Target)

Integrated into Entropic:

- No separate window
- Runs as native workspace service
- Claude has direct access to tools
- User data stored locally
- P2P via Entropic's network layer

---

## Current Status

| Component | Status |
|-----------|--------|
| Tauri app | ✅ Runs |
| MCP server | ✅ Runs |
| Tool definitions | ✅ Done |
| Tool handlers | 🔧 Stub |
| Wired to services | ❌ Not yet |

### What's Next

1. Wire tool handlers to real services
2. Test P2P between two nodes
3. Package for Entropic integration
