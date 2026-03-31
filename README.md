# cinQ

**Workspace App for Entropic** · **3-Hop Onion Routing** · **Qi Micropayments**

cinQ is a native workspace app inside Entropic that provides identity, messaging, storage, and payments — all routed through a privacy-preserving P2P mesh. Users choose their privacy level (0H direct, 1H single-hop, 3H onion), and peers earn Qi for forwarding traffic.

![Version](https://img.shields.io/badge/version-0.9.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Why cinQ

| Value | What cinQ Delivers |
|-------|-------------------|
| **Qi Payments** | Every action has a Qi cost. Send a message, forward traffic, share a file — Claude handles micropayments automatically via Pelagus. |
| **Decentralization** | No central servers. Users connect directly via libp2p. Your identity, messages, and files stay on your machine. |
| **Privacy** | 3-hop onion routing (like Tor). Traffic is encrypted in layers and routed through other Entropic users. Each hop only knows prev/next. |
| **Identity** | Human-readable Chat IDs (`@alice`) mapped to cryptographic Peer IDs. Decentralized, no registrar, secured by Quai. |
| **Entropic Utility** | cinQ makes Entropic a network, not just an app. Every user becomes a peer. The more users, the stronger the mesh. |
| **Claude as Agent** | Claude picks optimal routes, manages Qi spend, executes payments. Users talk naturally — Claude handles the crypto. |

---

## Claude as Payment Agent

Claude isn't just chat — it's your payment agent:

```
User: "Send this to Alice, keep it private"

Claude thinks:
  → Privacy requested = 3H onion routing
  → Find 3 low-latency peers with good reputation
  → Qi cost: 0.0003 Qi (0.0001 per hop)
  → User has 1.2 Qi balance ✓

Claude calls: cinq_chat_send(to: "@alice", message: "...", privacy: "3H")

cinQ executes:
  → Encrypt message in 3 layers (onion)
  → Route: User → Peer A → Peer B → Peer C → Alice
  → Pay each peer 0.0001 Qi via Pelagus UTXO
  → Confirm delivery
```

**Claude optimizes for what the user asks:**
- "Send this cheap" → 1H, cheapest peer
- "Send this private" → 3H, geographically diverse peers  
- "Send this fast" → 0H direct or 1H low-latency

Every Entropic user has their own intelligent router. No dumb algorithms — Claude understands intent.

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

| Mode | Hops | Privacy | Qi Cost | Use Case |
|------|------|---------|---------|----------|
| **0H (Direct)** | 0 | None | Free | Trusted networks, local comms |
| **1H (Single-hop)** | 1 | Basic | ~0.0001 Qi | Default for most users |
| **3H (Onion)** | 3 | Strong | ~0.0003 Qi | Sensitive communications |

**How it works:**
- **0H** — Direct peer-to-peer, no intermediaries, free
- **1H** — Traffic routes through one other Entropic user, that peer earns Qi
- **3H** — Onion-style routing through 3 Entropic users (like Tor), each peer earns Qi

**The Economics:**
```
Alice sends message to Bob with 3H privacy:

Alice (sender)
    │ pays 0.0001 Qi
    ▼
  Peer 1 (earns 0.0001 Qi) ── can only see: Alice → Peer 2
    │ pays 0.0001 Qi
    ▼
  Peer 2 (earns 0.0001 Qi) ── can only see: Peer 1 → Peer 3
    │ pays 0.0001 Qi
    ▼
  Peer 3 (earns 0.0001 Qi) ── can only see: Peer 2 → Bob
    │
    ▼
  Bob (receiver)

Total: Alice spends 0.0003 Qi, 3 peers each earn 0.0001 Qi
No peer knows both sender and receiver.
```

**Users earn by participating:**
- Run Entropic → automatically part of the mesh
- Forward traffic for others → earn Qi
- More uptime + bandwidth = more earnings

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

**Why Native Rust (Not a Skill)**

Entropic "skills" are JavaScript plugins — great for lightweight integrations, but they can't do:
- P2P networking (libp2p is Rust)
- Low-level cryptography at speed
- Direct wallet signing
- DHT operations, tunnel management

cinQ handles all of this natively in Rust:

| Component | Technology | What It Does |
|-----------|------------|--------------|
| App Shell | Tauri 2.x | Native desktop app with web UI |
| P2P Network | libp2p 0.54 | Kademlia DHT, peer discovery, encrypted tunnels |
| Onion Routing | libp2p + custom | Multi-hop tunnels, layered encryption |
| Database | SQLite | Identity, messages, contacts (local-first) |
| Payments | Pelagus + Quai | Qi UTXO signing, micropayment execution |
| MCP Server | Axum 0.7 | Tool interface for Claude |

**Claude calls tools → cinQ executes in Rust → results back to Claude**

---

## Roadmap

### Phase 1: Wire Services
- [ ] ID → P2P identity (DHT registration)
- [ ] Chat → messaging (libp2p direct)
- [ ] Drive → local filesystem + P2P sharing
- [ ] Pay → Qi metering + Pelagus settlement

### Phase 2: Privacy Layer
- [ ] 1-hop routing through peers
- [ ] Peer earnings distribution
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
