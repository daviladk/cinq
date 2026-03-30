# cinQ Cloud

**Workspace Sidecar for Entropic**

cinQ runs locally on each Entropic user's machine as a workspace sidecar:
- Exposes identity, messaging, storage, and payment-aware actions over MCP
- Keeps user data local by default
- Connects to a libp2p network for decentralized coordination and exchange

Quai is the economic layer — metering usage and settling value between participants.

![Version](https://img.shields.io/badge/version-0.9.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER'S MACHINE                                │
│                                                                         │
│   ┌───────────────────────┐           ┌───────────────────────┐        │
│   │       ENTROPIC        │           │         cinQ          │        │
│   │                       │   MCP     │                       │        │
│   │   Claude AI assistant │◄─────────►│   Workspace sidecar   │        │
│   │   User interface      │  :3000    │   Local data store    │        │
│   │                       │           │   MCP server          │        │
│   └───────────────────────┘           └───────────┬───────────┘        │
│                                                   │                     │
└───────────────────────────────────────────────────┼─────────────────────┘
                                                    │ libp2p
                                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           P2P NETWORK                                   │
│                                                                         │
│     ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐           │
│     │peer │◄───►│peer │◄───►│peer │◄───►│peer │◄───►│peer │           │
│     └─────┘     └─────┘     └─────┘     └─────┘     └─────┘           │
│                                                                         │
│   • Identity resolution (Kademlia DHT)                                 │
│   • Message routing                                                     │
│   • File sharing                                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          QUAI NETWORK                                   │
│                                                                         │
│   • Usage metering (Qi)                                                │
│   • Value settlement (via Pelagus wallet)                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## How It Runs

### 1. Start cinQ

```bash
cd cinq/src-tauri
cargo tauri dev
```

cinQ launches as a desktop app and starts the MCP server on `localhost:3000`.

### 2. Configure Entropic

Add cinQ as an MCP tool provider:

```json
{
  "mcpServers": {
    "cinq": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### 3. Start Entropic

Entropic connects to cinQ's MCP server and discovers available tools.

### 4. Use It

```
You: "Save this note and send it to Alice"

Claude:
├── calls cinq_drive_write → saves file locally
├── calls cinq_drive_share → generates P2P link
├── calls cinq_chat_send → messages Alice
└── calls cinq_pay_usage → logs Qi cost
```

### Verify

```bash
# Check server
curl http://localhost:3000/

# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

---

## Current Status

| Component | Status |
|-----------|--------|
| Tauri app runs | ✅ |
| MCP server (localhost:3000) | ✅ |
| Tool definitions (13 tools) | ✅ |
| Tool handlers | 🔧 Stub (mock data) |
| Wired to P2P/storage | ❌ Not yet |

**What works today:** cinQ starts, MCP server runs, Entropic can call tools.

**What's stubbed:** Tool handlers return mock data — not connected to real services yet.

---

## MCP Tools

### Identity (cinQ ID)
| Tool | Description |
|------|-------------|
| `cinq_id_whoami` | Get your identity |
| `cinq_id_lookup` | Find user by Chat ID |
| `cinq_id_contacts` | List contacts |

### Messaging (cinQ Chat)
| Tool | Description |
|------|-------------|
| `cinq_chat_send` | Send a message |
| `cinq_chat_history` | Get conversation history |
| `cinq_chat_conversations` | List conversations |

### Storage (cinQ Drive)
| Tool | Description |
|------|-------------|
| `cinq_drive_list` | List files |
| `cinq_drive_read` | Read a file |
| `cinq_drive_write` | Write a file |
| `cinq_drive_share` | Generate share link |

### Payments (cinQ Pay)
| Tool | Description |
|------|-------------|
| `cinq_pay_balance` | Check Qi balance |
| `cinq_pay_usage` | View usage breakdown |
| `cinq_pay_costs` | Get pricing table |

---

## Data Storage

cinQ keeps data local by default:

```
~/.cinq/
├── identity.db      # SQLite: identity, contacts
├── messages.db      # SQLite: chat history
├── keys/            # libp2p keypair
└── drive/           # Local file storage
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| App Framework | Tauri 2.x (Rust + Web) |
| MCP Server | Axum 0.7 |
| P2P | libp2p 0.54 (Kademlia, mDNS, Noise) |
| Database | SQLite (rusqlite) |
| Payments | Qi on Quai (via Pelagus) |

---

## Build

```bash
git clone https://github.com/daviladk/cinq.git
cd cinq
cd ui && npm install && cd ..
cd src-tauri && cargo build --release
```

---

## Roadmap

### v0.9 (Current)
- [x] Tauri app runs
- [x] MCP server
- [x] Tool definitions
- [x] Stub handlers

### v1.0 (Wire It)
- [ ] Connect handlers to services
- [ ] ID → P2P identity
- [ ] Chat → messaging
- [ ] Drive → filesystem
- [ ] Pay → metering

### Future
- [ ] Distributed storage
- [ ] Pelagus wallet integration
- [ ] Offline message queue

---

## License

MIT — see [LICENSE](LICENSE)

**Built for [Entropic](https://github.com/dominant-strategies/entropic) on [Quai Network](https://qu.ai)** 🔷
