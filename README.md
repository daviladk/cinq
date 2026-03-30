# cinQ Cloud

**Decentralized Workspace for Entropic**

cinQ is the workspace layer for [Entropic](https://github.com/dominant-strategies/entropic) — identity, messaging, storage, and payments exposed as tools an AI assistant can actually use.

![Version](https://img.shields.io/badge/version-0.9.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## What cinQ Does

```
USER: "Save this report and send it to Alice"

CLAUDE (via cinQ):
├── cinq_drive_write → saves file locally
├── cinq_drive_share → generates P2P share link  
├── cinq_chat_send → messages Alice with link
└── cinq_pay_usage → tracks Qi cost
```

**Own your identity and data. No SaaS lock-in. Claude can actually use your workspace.**

## Core Services

| Service | What It Does | Status |
|---------|--------------|--------|
| **cinQ ID** | Your identity, contacts, Chat IDs | 🔧 Stubbed |
| **cinQ Chat** | P2P messaging, conversation history | 🔧 Stubbed |
| **cinQ Drive Lite** | Save/read/share files (local-first) | 🔧 Stubbed |
| **cinQ Pay** | Usage metering, Qi costs, balances | 🔧 Stubbed |

**Status key:**
- 🔧 **Stubbed** = MCP tool defined, returns mock data, not wired to real services yet

### The Demo Flow (Target)

1. **User has cinQ identity** — `@alice` resolved to Peer ID
2. **Claude saves a file** — stored locally in cinQ Drive
3. **Claude shares it** — generates P2P link
4. **Claude messages contact** — sends link via cinQ Chat
5. **Usage metered in Qi** — tracked automatically

This proves the thesis: **AI assistant + decentralized workspace + usage-based payments**.

## MCP Tools

cinQ runs an MCP server (`localhost:3000`) that Entropic's Claude connects to.

### Identity (cinQ ID)
| Tool | Description |
|------|-------------|
| `cinq_id_whoami` | Get your identity (Chat ID, Peer ID, Quai address) |
| `cinq_id_lookup` | Find a user by Chat ID (e.g., `@alice`) |
| `cinq_id_contacts` | List your contacts |

### Messaging (cinQ Chat)
| Tool | Description |
|------|-------------|
| `cinq_chat_send` | Send a message to a contact |
| `cinq_chat_history` | Get conversation history |
| `cinq_chat_conversations` | List all conversations |

### Storage (cinQ Drive Lite)
| Tool | Description |
|------|-------------|
| `cinq_drive_list` | List files |
| `cinq_drive_read` | Read a file |
| `cinq_drive_write` | Write a file |
| `cinq_drive_share` | Generate P2P share link |

### Payments (cinQ Pay)
| Tool | Description |
|------|-------------|
| `cinq_pay_balance` | Check Qi balance |
| `cinq_pay_usage` | View usage breakdown |
| `cinq_pay_costs` | Get pricing table |

## How It Works

### Identity Resolution

Chat IDs (like `@alice`) are resolved via libp2p Kademlia DHT:

```
@alice → DHT lookup → Peer ID + Quai address
```

- **Registration**: User claims Chat ID, broadcasts to DHT
- **Lookup**: Query DHT for Chat ID → get Peer ID
- **Contacts**: Stored locally in SQLite

### Peer Discovery

- **Local network**: mDNS for same-subnet discovery
- **Internet**: Kademlia DHT with bootstrap nodes
- **Direct dial**: Connect via known Peer ID

### Online/Offline Behavior

- **Chat**: Messages queue locally when recipient offline, deliver on reconnect
- **Drive Lite**: Files stored locally first, shared via P2P when online
- **Identity**: Cached locally, refreshed from DHT when online

### Storage (Drive Lite)

Current implementation is **local-first**:
- Files stored in `~/.cinq/drive/`
- Share links are P2P (require sender online)
- Full distributed storage with provider economics is planned

### Payments

Qi usage is **metered locally** for visibility:
- Track what operations cost
- See balance and usage breakdown
- Actual Qi transactions use Pelagus wallet (when integrated)

## Quick Start

### Prerequisites

- [Entropic](https://github.com/dominant-strategies/entropic-releases/releases) — cinQ runs as an app within Entropic
- [Rust](https://rustup.rs/) (1.77+) — for building from source
- [Node.js](https://nodejs.org/) (18+) — for UI dependencies

### Build

```bash
git clone https://github.com/daviladk/cinq.git
cd cinq

# Install UI dependencies
cd ui && npm install && cd ..

# Build
cd src-tauri && cargo build --release
```

### Run

```bash
# Start cinQ (launches MCP server on localhost:3000)
cd src-tauri && cargo tauri dev
```

### Connect Entropic

Add cinQ to your Entropic MCP config:

```json
{
  "mcpServers": {
    "cinq": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Test MCP Directly

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
│                         cinQ Cloud                              │
│                                                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │  cinQ ID  │ │ cinQ Chat │ │cinQ Drive │ │ cinQ Pay  │       │
│  │ identity  │ │ messaging │ │  storage  │ │  metering │       │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘       │
│        └─────────────┴─────────────┴─────────────┘             │
│                           │                                     │
│                    libp2p mesh                                  │
│            (Kademlia DHT, mDNS, Noise)                         │
│                           │                                     │
│  ┌────────────────────────┴────────────────────────────────┐   │
│  │               MCP Server (localhost:3000)                │   │
│  │                 Entropic ←→ Claude ←→ cinQ               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

- **Framework**: Tauri 2.x (Rust + Web)
- **P2P**: libp2p 0.54 (Kademlia DHT, mDNS, Noise encryption)
- **Storage**: SQLite (rusqlite) + local filesystem
- **MCP**: Axum 0.7 (HTTP + JSON-RPC)
- **Payments**: Qi on Quai Network

## For Quai Network

**AI-native utility**: Claude can save, share, message, and pay as actions.

**Network-aligned economics**: Usage-based Qi payments, 1% flows to network.

**Own your data**: No corporate cloud. Identity and files stay with you.

## Roadmap

### Now (v0.9)
- [x] cinQ ID — identity + contacts
- [x] cinQ Chat — P2P messaging
- [x] cinQ Drive Lite — local storage + share links
- [x] cinQ Pay — usage metering
- [x] MCP server — Entropic integration

### Next
- [ ] Persistent DHT (identity survives restarts)
- [ ] Offline message queue
- [ ] Share link reliability (relay nodes)

### Future
- [ ] cinQ Drive (full distributed storage)
- [ ] Provider mode (earn Qi for storage)
- [ ] cinQ Mail (async email)
- [ ] cinQ Browser (web3 browser)

## License

MIT — see [LICENSE](LICENSE)

---

**Built for [Entropic](https://github.com/dominant-strategies/entropic) on [Quai Network](https://qu.ai)** 🔷
