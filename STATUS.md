# cinQ Cloud — Project Status

> **Last Updated:** March 29, 2026  
> **Version:** 0.8.0 (Phase 4: cinQ Cloud for Entropic)  
> **Build Status:** ✅ Working

---

## 🎯 Project Vision

**cinQ Cloud** is a decentralized Google Workspace for [Entropic](https://github.com/dominant-strategies/entropic) — Quai Network's Claude AI desktop app.

While Quai handles **compute** (AI models on idle hardware), cinQ handles **data**:
- **cinQ ID** — Decentralized identity (like Google Account)
- **cinQ Mail** — Async email (like Gmail)
- **cinQ Chat** — Real-time messaging (like Google Chat)
- **cinQ Drive** — File storage (like Google Drive)
- **cinQ Pay** — Qi-based metering (like Google Pay for services)

**Not a fork** — cinQ is an extension that gives Entropic's Claude access to familiar productivity tools, all running on a P2P mesh with Qi payments.

---

## 🎉 Current Phase: cinQ Cloud Architecture

Building the cloud services layer and MCP integration for Entropic.

### Qora Orchestrator (Alpha - Pure Rust)
- Intent parsing via keyword patterns (no LLM dependency)
- Template-based responses with personality
- Routes actions to specialized workers
- Zero external API calls = instant response

### Worker Agents
- **BandwidthWorker**: Message/call routing, byte tracking
- **StorageWorker**: Local file storage, cloud backup, message search
- **PaymentWorker**: Qi metering, session accounting, settlement prep

### Trust Model
- **Pelagus Wallet**: Handles all blockchain (balance, signing, transactions)
- **cinQ App**: Handles compute orchestration (metering, sessions, workers)
- **Clean Separation**: No private keys in cinQ, no RPC calls needed

---

## Current Architecture

### Network Setup (Testing)
| Device | IP Address | Peer ID |
|--------|------------|---------|
| Mac Mini | 192.168.5.4:9000 | `12D3KooWP7zQ4dLEw3JiPdrerChHsTzhjfxs69oEBcxZieXU1sAu` |
| MacBook Air | 192.168.4.253:9000 | `12D3KooWGhyNKVUhwiigtPZ9DpMyho9gvAsRWhGfeGDVcEt6Tgkr` |

### Tech Stack
- **Tauri 2.x** - Desktop app framework
- **libp2p 0.54** - P2P networking (Kademlia DHT, mDNS, Noise encryption)
- **SQLite (rusqlite)** - Chat + User ID storage
- **Yamux** - Stream multiplexing
- **Protocol:** `/cinq/transfer/1.0.0`

---

## cinQ Cloud Services

### ✅ cinQ ID (Identity) — Built
- Chat ID registration (`@username`)
- Peer ID mapping (libp2p keypair)
- SQLite storage for identity registry
- Contact management

### ✅ cinQ Chat (Messaging) — Built
- Real-time P2P messaging
- Conversation history (SQLite)
- Online/offline presence
- Read receipts

### ✅ cinQ Drive (Storage) — Built
- Local file storage
- P2P file transfer protocol
- Folder organization
- Share links (planned)

### ✅ cinQ Pay (Payments) — Built
- Real-time usage tracking
- Qi cost tables
- Session accounting
- Pelagus integration (wallet handles signing)

### 🆕 cinQ Mail (Email) — To Build
- Async threaded messages
- Subject lines + rich text
- Attachments (via Drive)
- Anti-spam (Qi deposit for unknowns)

### 🆕 MCP Server — To Build
- Expose cinQ services to Entropic
- Tool definitions for Claude
- HTTP/WebSocket interface

---

## File Structure

```
cinq/
├── ui/                       # Frontend (Vite + TypeScript)
│   ├── src/main.ts          # App logic + Tauri invoke
│   ├── src/ui.ts            # DOM rendering
│   └── index.html           # Entry point
│
├── src-tauri/src/
│   ├── main.rs              # Tauri commands (90+ commands)
│   ├── lib.rs               # Module exports
│   │
│   ├── cloud/               # 🆕 cinQ Cloud services
│   │   ├── mod.rs           # Re-exports
│   │   ├── id.rs            # Identity service
│   │   ├── mail.rs          # Email service
│   │   ├── chat.rs          # Chat service
│   │   ├── drive.rs         # Storage service
│   │   └── pay.rs           # Payment service
│   │
│   ├── mcp/                 # 🆕 MCP server for Entropic
│   │   ├── mod.rs           # MCP protocol handler
│   │   ├── server.rs        # HTTP/WebSocket server
│   │   └── tools.rs         # Tool definitions
│   │
│   ├── grid/                # P2P networking
│   │   ├── mod.rs           # Module re-exports
│   │   ├── node.rs          # libp2p swarm, peer management
│   │   ├── chat.rs          # ChatManager, SQLite storage
│   │   ├── protocol.rs      # CinqRequest/CinqResponse types
│   │   └── ...
│   │
│   ├── qora/                # Local AI agent (Qora)
│   │   ├── mod.rs           # Module exports
│   │   ├── agent.rs         # QoraAgent
│   │   ├── ollama.rs        # Ollama API client
│   │   └── tasks.rs         # Task queue
│   │
│   └── swarm/               # Worker agents
│       ├── mod.rs           # Module exports
│       ├── costs.rs         # Qi pricing tables
│       ├── tracker.rs       # Real-time usage tracking
│       ├── intent.rs        # Intent parsing
│       ├── qora.rs          # Qora orchestrator
│       └── workers/
│           ├── mod.rs       # Worker trait
│           ├── bandwidth.rs # BandwidthWorker
│           ├── storage.rs   # StorageWorker
│           └── payment.rs   # PaymentWorker
│
├── docs/
│   ├── DESIGN.md            # Architecture & design
│   └── CINQ_CLOUD.md        # 🆕 Cloud services spec
├── CHANGELOG.md             # Version history
├── README.md                # Project overview
└── STATUS.md                # This file
```

---

## Tauri Commands

### Core
| Command | Description |
|---------|-------------|
| `start_node` | Initialize P2P node |
| `stop_node` | Gracefully disconnect |
| `get_peers` | List connected peers |
| `get_peer_id` | Get local peer ID |

### Chat
| Command | Description |
|---------|-------------|
| `send_message` | Send chat message to peer |
| `get_conversations` | List all conversations |
| `get_messages` | Get messages for conversation |
| `start_conversation` | Create conversation with peer |

### Identity (New in v0.6.0)
| Command | Description |
|---------|-------------|
| `get_user_id` | Get local Chat ID |
| `lookup_user_id` | Find peer ID from Chat ID |
| `update_profile` | Set name, bio, avatar |
| `get_profile` | Get profile info |
| `get_contact_card` | Generate shareable card |
| `parse_contact_card` | Parse QR/URL data |

### Swarm Usage Tracker
| Command | Description |
|---------|-------------|
| `swarm_get_balance` | Get current Qi balance + active sessions |
| `swarm_set_balance` | Update balance from Pelagus |
| `swarm_start_session` | Start tracking an action |
| `swarm_end_session` | End session, get Qi consumed |
| `swarm_record_bytes` | Record bytes sent/received |
| `swarm_check_warnings` | Get low-balance warnings |
| `swarm_estimate_cost` | Estimate Qi cost for action |
| `swarm_get_cost_table` | Get all pricing rates |

### Qora Orchestrator (New in v0.7.0)
| Command | Description |
|---------|-------------|
| `qora_process` | Process natural language input |
| `qora_get_intents` | Get list of supported intents |

### Worker Commands (New in v0.7.0)
| Command | Description |
|---------|-------------|
| `worker_send_message` | Send message via bandwidth worker |
| `worker_start_call` | Start voice call |
| `worker_start_video_call` | Start video call |
| `worker_end_call` | End active call |
| `worker_get_bandwidth_stats` | Get bandwidth metrics |
| `worker_store_message` | Store message locally |
| `worker_search_messages` | Search message history |
| `worker_store_file` | Store file locally |
| `worker_upload_cloud` | Upload to cloud backup |
| `worker_get_storage_stats` | Get storage metrics |
| `worker_payment_start_session` | Start payment session |
| `worker_payment_record_cost` | Record Qi cost |
| `worker_payment_end_session` | End payment session |
| `worker_payment_get_pending` | Get pending payments |
| `worker_payment_prepare_settlement` | Prepare for Pelagus |

## Data Storage

**Location:** `~/.cinq/`

| File | Purpose |
|------|---------|
| `keypair.bin` | Ed25519 keypair (persistent Peer ID) |
| `peers.json` | Known peer addresses for bootstrap |
| `chat.db` | SQLite database for conversations/messages |

### SQLite Schema (`chat.db`)
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
    added_at INTEGER NOT NULL,
    last_seen INTEGER,
    public_key TEXT,
    is_online INTEGER DEFAULT 0
);
```

---

## Next Steps

### Immediate
1. [ ] Add message encryption (currently plaintext over Noise transport)
2. [ ] Real-time event push (instead of polling)
3. [ ] Notification when new message arrives

### Short-term
4. [ ] Wire SOCKS5 proxy through P2P tunnels
5. [ ] Implement hop-based routing (0H/1H/3H)
6. [ ] Integrate Pelagus wallet for Qi payments

### Long-term
7. [ ] Escrow smart contract on Quai
8. [ ] Exit node earnings
9. [ ] Mobile companion app

---

## How to Resume Development

### Build & Run
```bash
cd /Users/Dad/cinq

# Development (with hot reload)
cargo tauri dev

# Production build
cargo tauri build

# DMG location
open src-tauri/target/release/bundle/dmg/
```

### Testing on MacBook Air
```bash
# Clear quarantine
xattr -cr "/Applications/Cinq Connect.app"

# Run with logs
RUST_LOG=info "/Applications/Cinq Connect.app/Contents/MacOS/cinq-connect" 2>&1
```

### Debug Logs
Key log prefixes to watch:
- `>>> Sending request` - Message send attempt
- `>>> Peer ... connected:` - Connection status
- `ChatMessage from` - Incoming message received
- `Stored incoming message` - Message saved to DB
- `ChatReceived { delivered: true }` - Delivery confirmation

---

## Known Issues

1. **mDNS blocked on Eero mesh** - Different subnets can't discover via mDNS, but DHT bootstrap works
2. **Polling-based UI updates** - 3-second delay for new messages (no real-time push yet)
3. **Messages are plaintext** - Noise transport encrypts the channel, but message content not additionally encrypted

---

## Git Status

```bash
# Create tag for this milestone
git add -A
git commit -m "v0.5.0: P2P chat working with message storage"
git tag v0.5.0-p2p-chat
```
