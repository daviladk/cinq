# cinQ Cloud

**Decentralized Workspace Layer for Entropic**

cinQ exposes identity, messaging, storage, and payments as MCP tools that Entropic's Claude can call.

![Version](https://img.shields.io/badge/version-0.9.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## What cinQ Is

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
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                          │                                  │
│                   libp2p mesh                               │
│                          │                                  │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              MCP Server (localhost:3000)            │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Target flow:**
```
USER: "Save this report and send it to Alice"

CLAUDE (via cinQ):
├── cinq_drive_write → saves file
├── cinq_drive_share → generates share link  
├── cinq_chat_send → messages Alice
└── cinq_pay_usage → tracks Qi cost
```

## Current Status

| What | Status |
|------|--------|
| MCP server runs | ✅ |
| Tool definitions | ✅ 13 tools |
| Tool handlers | 🔧 Return mock data |
| Wired to P2P | ❌ Not yet |
| Wired to storage | ❌ Not yet |

**What this means:** Claude can discover and call cinQ tools, but they return stub responses. The P2P infrastructure code exists but isn't connected to the MCP handlers yet.

See [STATUS.md](STATUS.md) for detailed breakdown.

## MCP Tools

| Tool | Description |
|------|-------------|
| `cinq_id_whoami` | Get your identity |
| `cinq_id_lookup` | Find user by Chat ID |
| `cinq_id_contacts` | List contacts |
| `cinq_chat_send` | Send a message |
| `cinq_chat_history` | Get conversation history |
| `cinq_chat_conversations` | List conversations |
| `cinq_drive_list` | List files |
| `cinq_drive_read` | Read a file |
| `cinq_drive_write` | Write a file |
| `cinq_drive_share` | Generate share link |
| `cinq_pay_balance` | Check Qi balance |
| `cinq_pay_usage` | View usage breakdown |
| `cinq_pay_costs` | Get pricing table |

## Quick Start

### Prerequisites

- [Entropic](https://github.com/dominant-strategies/entropic-releases/releases) — cinQ runs as an app within Entropic
- [Rust](https://rustup.rs/) (1.77+)
- [Node.js](https://nodejs.org/) (18+)

### Build

```bash
git clone https://github.com/daviladk/cinq.git
cd cinq
cd ui && npm install && cd ..
cd src-tauri && cargo build --release
```

### Run

```bash
cd src-tauri && cargo tauri dev
# MCP server starts on localhost:3000
```

### Test MCP

```bash
# Health check
curl http://localhost:3000/

# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Call a tool (returns mock data)
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"cinq_id_whoami","arguments":{}},"id":2}'
```

### Connect Entropic

Add to Entropic's MCP config:

```json
{
  "mcpServers": {
    "cinq": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Tauri 2.x |
| P2P | libp2p 0.54 |
| DHT | Kademlia |
| Encryption | Noise |
| Database | SQLite |
| MCP Server | Axum 0.7 |
| Payments | Qi (Quai Network) |

## Code Structure

```
src-tauri/src/
├── main.rs           # Tauri app + MCP server startup
├── mcp/
│   ├── server.rs     # Axum HTTP (localhost:3000)
│   ├── protocol.rs   # JSON-RPC types
│   └── tools.rs      # Tool definitions + stub handlers
├── grid/             # P2P layer (exists, not connected)
│   ├── node.rs       # libp2p swarm
│   ├── chat.rs       # Message protocol
│   ├── userid.rs     # Chat ID registry
│   └── transfer.rs   # File transfer
└── swarm/            # Metering (exists, not connected)
    ├── costs.rs      # Qi pricing
    └── tracker.rs    # Usage tracking
```

## Roadmap

### v0.9 (Current)
- [x] MCP server running
- [x] Tool definitions
- [x] Stub handlers

### v1.0 (Wire it up)
- [ ] Connect MCP handlers to CinqState
- [ ] Wire ID tools to P2P identity
- [ ] Wire Chat tools to messaging
- [ ] Wire Drive tools to filesystem
- [ ] Wire Pay tools to metering

### v1.x (Polish)
- [ ] Persistent DHT
- [ ] Offline message queue
- [ ] Pelagus wallet integration

## For Quai Network

**AI-native utility**: Claude can save, share, message, pay as actions.

**Network-aligned economics**: Usage-based Qi payments, 1% flows to network.

**Own your data**: No corporate cloud. Identity and files stay with you.

## License

MIT — see [LICENSE](LICENSE)

---

**Built for [Entropic](https://github.com/dominant-strategies/entropic) on [Quai Network](https://qu.ai)** 🔷
