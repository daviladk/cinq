# cinQ

**Workspace App for Entropic** · **3-Hop Onion Routing** · **Qi Micropayments**

cinQ is a native workspace app inside Entropic that provides identity, messaging, storage, and payments — all routed through a privacy-preserving P2P mesh. Users choose their privacy level (0H direct, 1H relay, 3H onion), and relay nodes earn Qi for forwarding traffic.

![Version](https://img.shields.io/badge/version-0.9.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What cinQ Is

cinQ lives inside Entropic as a workspace service — like Tasks, Jobs, or Messaging, but for decentralized identity, chat, storage, and payments.

```
┌─────────────────────────────────────────────────────────────────┐
│                          ENTROPIC                               │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                        Claude                            │   │
│   │                   (AI Assistant)                         │   │
│   └───────────────────────┬─────────────────────────────────┘   │
│                           │ tool calls                          │
│                           ▼                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                         cinQ                             │   │
│   │                  (Workspace App)                         │   │
│   │                                                          │   │
│   │   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │   │
│   │   │   ID   │ │  Chat  │ │ Drive  │ │  Pay   │           │   │
│   │   └────────┘ └────────┘ └────────┘ └────────┘           │   │
│   │                       │                                  │   │
│   │              local data + libp2p                         │   │
│   └───────────────────────┼──────────────────────────────────┘   │
│                           │                                     │
│   ┌───────────────────────┴─────────────────────────────────┐   │
│   │              Other Entropic Apps                         │   │
│   │        Tasks │ Jobs │ Logs │ Billing │ Messaging         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       P2P NETWORK                               │
│           (libp2p mesh for identity, messaging, files)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       QUAI NETWORK                              │
│              (Qi metering + Pelagus settlement)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## How It Works

1. **User opens Entropic** — cinQ starts automatically as a workspace service
2. **Claude has access to cinQ tools** — identity, chat, drive, pay
3. **User talks to Claude** — "Save this and send it to Alice"
4. **Claude calls cinQ tools** — saves file, generates link, sends message
5. **cinQ handles it** — local storage + P2P network + Qi metering

No separate app to launch. No configuration. cinQ is just part of Entropic.

---

## Services

### cinQ ID (Identity)
Your decentralized identity — a human-readable Chat ID mapped to a cryptographic Peer ID.

| Tool | Description |
|------|-------------|
| `cinq_id_whoami` | Get your identity (Chat ID, Peer ID, Quai address) |
| `cinq_id_lookup` | Find a user by Chat ID (e.g., `@alice`) |
| `cinq_id_contacts` | List your contacts |

### cinQ Chat (Messaging)
P2P messaging over libp2p. Messages stored locally, sent directly peer-to-peer.

| Tool | Description |
|------|-------------|
| `cinq_chat_send` | Send a message to a contact |
| `cinq_chat_history` | Get conversation history |
| `cinq_chat_conversations` | List all conversations |

### cinQ Drive (Storage)
Local-first file storage with P2P sharing.

| Tool | Description |
|------|-------------|
| `cinq_drive_list` | List files |
| `cinq_drive_read` | Read a file |
| `cinq_drive_write` | Write a file |
| `cinq_drive_share` | Generate a P2P share link |

### cinQ Pay (Payments)
Qi-based usage metering. Tracks costs, settles via Pelagus.

| Tool | Description |
|------|-------------|
| `cinq_pay_balance` | Check Qi balance |
| `cinq_pay_usage` | View usage breakdown |
| `cinq_pay_costs` | Get pricing table |

---

## Privacy & Routing

cinQ routes traffic through a P2P mesh with user-selectable privacy levels:

| Mode | Hops | Privacy | Cost | Use Case |
|------|------|---------|------|----------|
| **0H (Direct)** | 0 | None | Free | Trusted networks, local comms |
| **1H (Relay)** | 1 | Basic | Low | Default for most users |
| **3H (Onion)** | 3 | Strong | Higher | Sensitive communications |

**How it works:**
- **0H** — Direct connection, no relay, free
- **1H** — Traffic routes through one relay node, relay earns Qi
- **3H** — Onion-style routing through 3 nodes (like Tor), each hop earns Qi

Users tell Claude their privacy preference:
> "Send this message to Alice with high privacy"

Claude calls `cinq_chat_send` with `privacy: "3H"`, and cinQ routes through 3 hops. Each relay node earns micro-Qi for forwarding.

**Qi Economics:**
- Higher privacy = more hops = more Qi spent
- Relay nodes earn by forwarding traffic
- User controls the tradeoff (speed vs. privacy vs. cost)

This is built on libp2p tunnels — the infrastructure exists in [tunnel.rs](src-tauri/src/grid/tunnel.rs), with 3-hop onion routing planned for Phase 3.

---

## Development Status

| Component | Status |
|-----------|--------|
| Tool definitions | ✅ 13 tools defined |
| Rust handlers | 🔧 Stubbed (mock data) |
| P2P networking | ✅ libp2p infrastructure built |
| Entropic integration | ❌ Pending PR |

**See [STATUS.md](STATUS.md) for detailed implementation status.**

---

## Data Storage

cinQ keeps user data local by default:

```
~/.cinq/
├── chat.db          # SQLite: identity, messages, contacts
├── keys/            # libp2p keypair
└── drive/           # Local file storage
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| App | Tauri 2.x (Rust + Web) |
| MCP Server | Axum 0.7 |
| P2P | libp2p 0.54 (Kademlia, mDNS, Noise) |
| Database | SQLite (rusqlite) |
| Payments | Qi on Quai (via Pelagus) |

---

## Roadmap

### Phase 1: Wire Services
- [ ] ID → P2P identity (DHT registration)
- [ ] Chat → messaging (libp2p direct)
- [ ] Drive → local filesystem + P2P sharing
- [ ] Pay → Qi metering + Pelagus settlement

### Phase 2: Privacy Layer
- [ ] 1-hop relay routing
- [ ] Relay earnings distribution
- [ ] Privacy preference in tool calls

### Phase 3: Full Privacy
- [ ] 3-hop onion routing
- [ ] End-to-end encryption per hop
- [ ] Exit node marketplace

### Integration
Entropic is now [open source](https://github.com/dominant-strategies/entropic).

**Target: PR to Entropic Core**

cinQ needs native Rust (libp2p, SQLite) + a React UI — this isn't a lightweight "skill", it's a full service. The path is contributing to Entropic:

- [ ] Add cinQ Rust handlers to `src-tauri/`
- [ ] Add `Cinq.tsx` page component to `src/pages/`
- [ ] Wire into Layout navigation + Dashboard routing
- [ ] PR to Entropic repo

**See [docs/DESIGN.md](docs/DESIGN.md) for integration architecture.**

---

## License

MIT — see [LICENSE](LICENSE)

**Built for [Entropic](https://github.com/dominant-strategies/entropic) on [Quai Network](https://qu.ai)** 🔷
