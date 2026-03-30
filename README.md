# cinQ Cloud

**Decentralized Workspace for Entropic**

cinQ is the data layer for [Entropic](https://github.com/dominant-strategies/entropic) — providing decentralized identity, messaging, storage, and payments powered by the people running Entropic.

Think Google Workspace, but decentralized. No servers. No corporations. Just people.

![Version](https://img.shields.io/badge/version-0.8.0-blue)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

## The Vision

```
ENTROPIC (Claude AI)     ←→     cinQ CLOUD (Workspace)
├── AI assistant                ├── cinQ ID (identity)
├── Sandboxed runtime           ├── cinQ Chat (messaging)
└── Runs on your machine        ├── cinQ Drive (storage)
                                ├── cinQ Mail (email) 
                                ├── cinQ Browser (web3)
                                └── cinQ Pay (Qi payments)
```

**Entropic handles AI. cinQ handles data. Quai handles money.**

## How It Works

Every Entropic user's machine is part of the network:

```
┌────────────────────────────────────────────────┐
│                THE MESH                        │
│                                                │
│    👤────👤────👤────👤────👤────👤           │
│     │    │    │    │    │    │               │
│    👤────👤────👤────👤────👤────👤           │
│     │    │    │    │    │    │               │
│    👤────👤────👤────👤────👤────👤           │
│                                                │
│    Everyone IS the infrastructure              │
│    No servers. No datacenters required.        │
│                                                │
└────────────────────────────────────────────────┘
```

- **Consumer**: Use cinQ services (chat, storage, etc.)
- **Provider**: Share spare disk space, earn Qi
- **Most people**: Both

## Services

| Service | Like | Description |
|---------|------|-------------|
| **cinQ ID** | Google Account | Decentralized identity with Chat IDs |
| **cinQ Chat** | Google Chat | Real-time P2P messaging |
| **cinQ Drive** | Google Drive | Decentralized file storage |
| **cinQ Mail** | Gmail | Async email with anti-spam |
| **cinQ Browser** | Chrome + MetaMask | Web3 browser with Pelagus wallet |
| **cinQ Pay** | Google Pay | Qi-based metering and payments |

## For Entropic Users

cinQ exposes an MCP server that Claude can use:

```
You: "Save this report to my Drive and send it to Alice"

Claude (in Entropic):
├── Calls cinq_drive_write → saves file
├── Calls cinq_drive_share → generates link  
├── Calls cinq_chat_send → messages Alice
└── "Done! Sent to Alice ✓"
```

### Available Tools

**Identity**
- `cinq_id_whoami` — Get your cinQ identity
- `cinq_id_lookup` — Find a user by Chat ID
- `cinq_id_contacts` — List your contacts

**Chat**
- `cinq_chat_send` — Send a message
- `cinq_chat_history` — Get conversation history
- `cinq_chat_conversations` — List all conversations

**Drive**
- `cinq_drive_list` — List files
- `cinq_drive_read` — Read a file
- `cinq_drive_write` — Write a file
- `cinq_drive_share` — Generate share link

**Browser**
- `cinq_browser_open` — Open URL with Pelagus wallet
- `cinq_browser_wallet_status` — Check wallet connection
- `cinq_browser_wallet_connect` — Connect to dApp
- `cinq_browser_wallet_send` — Send Qi (requires approval)

**Pay**
- `cinq_pay_balance` — Check Qi balance
- `cinq_pay_usage` — View usage breakdown
- `cinq_pay_costs` — Get pricing table

## Quick Start

### Prerequisites

- [Entropic](https://github.com/dominant-strategies/entropic-releases/releases) — cinQ runs as an app within Entropic
- [Rust](https://rustup.rs/) (1.77+) — for building from source
- [Node.js](https://nodejs.org/) (18+) — for UI dependencies

### Build and Run

```bash
# Clone
git clone https://github.com/daviladk/cinq.git
cd cinq

# Install UI dependencies
cd ui && npm install && cd ..

# Build
cd src-tauri && cargo build --release

# Run (starts MCP server on localhost:3000)
cargo tauri dev
```

### Connect to Entropic

Add cinQ as a skill in your OpenClaw config:

```json
{
  "skills": {
    "cinq": {
      "type": "mcp",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Or test the MCP server directly:

```bash
# Server info
curl http://localhost:3000/

# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         cinQ APP                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    TAURI UI                              │   │
│  │              (standalone interface)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   RUST BACKEND                           │   │
│  │                                                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │   │
│  │  │ cinQ ID  │ │cinQ Chat │ │cinQ Drive│ │ cinQ Pay │    │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    │   │
│  │       └────────────┴────────────┴────────────┘          │   │
│  │                         │                                │   │
│  │                    libp2p mesh                           │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────┴──────────────────────────────┐   │
│  │                 MCP SERVER (:3000)                       │   │
│  │           (for Entropic/Claude integration)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

- **App Framework**: Tauri 2.x (Rust + Web)
- **P2P Networking**: libp2p 0.54 (Kademlia DHT, mDNS, Noise encryption)
- **Database**: SQLite (rusqlite)
- **MCP Server**: Axum (HTTP + JSON-RPC)
- **Payments**: Qi on Quai Network (via Pelagus wallet)

## Project Structure

```
cinq/
├── ui/                       # Frontend (Vite + TypeScript)
│   └── src/
├── src-tauri/src/
│   ├── main.rs              # Tauri commands + MCP server start
│   ├── lib.rs               # Module exports
│   ├── mcp/                 # MCP server for Entropic
│   │   ├── mod.rs
│   │   ├── server.rs        # HTTP server (Axum)
│   │   ├── protocol.rs      # JSON-RPC types
│   │   └── tools.rs         # cinQ tool definitions
│   ├── grid/                # P2P networking
│   │   ├── node.rs          # libp2p swarm
│   │   ├── chat.rs          # Chat + SQLite
│   │   ├── userid.rs        # Identity registry
│   │   └── transfer.rs      # File transfer
│   └── swarm/               # Usage tracking
│       ├── costs.rs         # Qi pricing
│       ├── tracker.rs       # Metering
│       └── workers/         # Service workers
├── docs/
│   ├── DESIGN.md            # Technical design
│   └── CINQ_CLOUD.md        # Architecture spec
└── README.md
```

## Decentralized Storage

Files are encrypted, chunked, and distributed across the network:

```
YOUR FILE
    │
    ▼ Encrypt (your keys)
    │
    ▼ Chunk into pieces
    │
    ▼ Distribute to providers
    │
┌───┴───┬───────┬───────┐
▼       ▼       ▼       ▼
Alice   Bob    Carol   Dave
(peer)  (peer) (peer)  (peer)
```

**Anyone can be a provider.** Share spare disk space, earn Qi. No special hardware required.

## Roadmap

- [x] P2P mesh networking (libp2p)
- [x] cinQ ID (identity registry)
- [x] cinQ Chat (P2P messaging)
- [x] cinQ Pay (usage tracking)
- [x] MCP server (Entropic integration)
- [x] cinQ Browser tools (Pelagus wallet)
- [ ] cinQ Mail (async email)
- [ ] cinQ Drive (distributed storage)
- [ ] Provider mode (earn Qi for storage)
- [ ] Anti-spam (Qi deposits)

## Contributing

Contributions welcome! See [docs/CINQ_CLOUD.md](docs/CINQ_CLOUD.md) for architecture details.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built for [Entropic](https://github.com/dominant-strategies/entropic) on [Quai Network](https://qu.ai)** 🔷
