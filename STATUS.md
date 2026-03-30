# cinQ Cloud — Project Status

> **Last Updated:** March 30, 2026  
> **Version:** 0.8.0 (cinQ Cloud for Entropic)  
> **Build Status:** ✅ Working

---

## Project Vision

**cinQ Cloud** is a decentralized Google Workspace for [Entropic](https://github.com/dominant-strategies/entropic) — Quai Network's Claude AI desktop app.

Entropic handles **AI**. cinQ handles **data**:
- **cinQ ID** — Decentralized identity (like Google Account)
- **cinQ Mail** — Async email (like Gmail)
- **cinQ Chat** — Real-time messaging (like Google Chat)
- **cinQ Drive** — File storage (like Google Drive)
- **cinQ Browser** — Web3 browser with Pelagus wallet
- **cinQ Pay** — Qi-based metering (like Google Pay for services)

**Not a fork** — cinQ is an extension that gives Entropic's Claude access to familiar productivity tools, all running on a P2P mesh with Qi payments.

---

## Current Phase: MCP Integration

Building the MCP server so Entropic's Claude can use cinQ services.

### Completed
- ✅ P2P mesh networking (libp2p + Kademlia DHT)
- ✅ cinQ ID (identity registry with Chat IDs)
- ✅ cinQ Chat (real-time P2P messaging)
- ✅ cinQ Pay (usage tracking + Qi cost tables)
- ✅ MCP server (localhost:3000)
- ✅ cinQ Browser tools (Pelagus wallet integration)

### In Progress
- 🔄 Wire MCP tools to actual CinqState services
- 🔄 Test with Entropic on MacBook Air

### To Build
- ⏳ cinQ Mail (async threaded email)
- ⏳ cinQ Drive (distributed storage with providers)
- ⏳ Provider mode (earn Qi for sharing storage)

---

## Architecture

### Tech Stack
| Component | Technology |
|-----------|------------|
| **App Framework** | Tauri 2.x (Rust + Web) |
| **P2P Networking** | libp2p 0.54 (Kademlia DHT, mDNS, Noise) |
| **Database** | SQLite (rusqlite) |
| **MCP Server** | Axum 0.7 (HTTP + JSON-RPC) |
| **Payments** | Qi on Quai Network (via Pelagus wallet) |

### Network Setup (Testing)
| Device | IP Address | Peer ID |
|--------|------------|---------|
| Mac Mini | 192.168.5.4:9000 | `12D3KooWP7zQ4dLEw3JiPdrerChHsTzhjfxs69oEBcxZieXU1sAu` |
| MacBook Air | 192.168.4.253:9000 | `12D3KooWGhyNKVUhwiigtPZ9DpMyho9gvAsRWhGfeGDVcEt6Tgkr` |

---

## MCP Tools

The MCP server exposes these tools for Entropic's Claude:

### Identity (cinQ ID)
| Tool | Description |
|------|-------------|
| `cinq_id_whoami` | Get current user identity |
| `cinq_id_lookup` | Find user by Chat ID |
| `cinq_id_contacts` | List contacts |

### Messaging (cinQ Chat)
| Tool | Description |
|------|-------------|
| `cinq_chat_send` | Send a message |
| `cinq_chat_history` | Get conversation history |
| `cinq_chat_conversations` | List all conversations |

### Storage (cinQ Drive)
| Tool | Description |
|------|-------------|
| `cinq_drive_list` | List files in directory |
| `cinq_drive_read` | Read file contents |
| `cinq_drive_write` | Write file |
| `cinq_drive_delete` | Delete file |
| `cinq_drive_share` | Generate share link |

### Browser (cinQ Browser)
| Tool | Description |
|------|-------------|
| `cinq_browser_open` | Open URL |
| `cinq_browser_current` | Get current page state |
| `cinq_browser_tabs` | List open tabs |
| `cinq_browser_wallet_status` | Get Pelagus status |
| `cinq_browser_wallet_connect` | Connect to dApp |
| `cinq_browser_wallet_send` | Send Qi transaction |

### Payments (cinQ Pay)
| Tool | Description |
|------|-------------|
| `cinq_pay_balance` | Get Qi balance |
| `cinq_pay_usage` | Get usage breakdown |
| `cinq_pay_costs` | Get pricing table |

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
│   ├── main.rs              # Tauri commands + MCP server start
│   ├── lib.rs               # Module exports
│   │
│   ├── mcp/                 # MCP server for Entropic
│   │   ├── mod.rs           # Module exports
│   │   ├── server.rs        # Axum HTTP server (:3000)
│   │   ├── protocol.rs      # JSON-RPC types
│   │   └── tools.rs         # Tool definitions + handlers
│   │
│   ├── grid/                # P2P networking
│   │   ├── mod.rs           # Module re-exports
│   │   ├── node.rs          # libp2p swarm
│   │   ├── chat.rs          # Chat + SQLite storage
│   │   ├── userid.rs        # Identity registry
│   │   ├── transfer.rs      # File transfer protocol
│   │   └── protocol.rs      # P2P message types
│   │
│   └── swarm/               # Usage tracking
│       ├── costs.rs         # Qi pricing tables
│       ├── tracker.rs       # Real-time metering
│       └── workers/         # Service workers
│
├── docs/
│   ├── DESIGN.md            # Technical design
│   └── CINQ_CLOUD.md        # Architecture spec
├── CHANGELOG.md             # Version history
├── README.md                # Project overview
└── STATUS.md                # This file
```

---

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
1. [ ] Wire MCP tool handlers to CinqState services
2. [ ] Test MCP server with Entropic
3. [ ] Add message encryption (currently plaintext over Noise transport)

### Short-term
4. [ ] Build cinQ Mail service
5. [ ] Build cinQ Drive distributed storage
6. [ ] Provider mode (share storage, earn Qi)

### Long-term
7. [ ] Anti-spam (Qi deposits for unknown senders)
8. [ ] Mobile companion app
9. [ ] Federation with other cinQ networks

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

### Test MCP Server
```bash
# Check if server is running
curl http://localhost:3000/

# List available tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Call a tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"cinq_id_whoami","arguments":{}},"id":2}'
```

### Testing on MacBook Air
```bash
# Clear quarantine
xattr -cr "/Applications/Cinq Connect.app"

# Run with logs
RUST_LOG=info "/Applications/Cinq Connect.app/Contents/MacOS/cinq-connect" 2>&1
```

---

## Known Issues

1. **mDNS blocked on Eero mesh** - Different subnets can't discover via mDNS, but DHT bootstrap works
2. **MCP handlers are stubs** - Tool definitions exist but handlers return mock data
3. **Messages are plaintext** - Noise transport encrypts the channel, but message content not additionally encrypted

---

## Version History

| Version | Date | Milestone |
|---------|------|-----------|
| 0.8.0 | Mar 30, 2026 | cinQ Cloud for Entropic, MCP server, Browser tools |
| 0.7.0 | Mar 15, 2026 | Usage tracking, Qi cost tables |
| 0.6.0 | Feb 12, 2026 | Chat IDs, Contact cards |
| 0.5.0 | Jan 2026 | P2P chat with message storage |
| 0.4.0 | Jan 2026 | Pelagus wallet integration |
| 0.3.0 | Dec 2025 | P2P tunnel infrastructure |
| 0.2.0 | Dec 2025 | SOCKS5 proxy implementation |
| 0.1.0 | Nov 2025 | P2P peer discovery working |
