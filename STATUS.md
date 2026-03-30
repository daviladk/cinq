# cinQ Cloud — Project Status

> **Version:** 0.9.0  
> **Updated:** March 30, 2026  
> **Build:** ✅ Compiles and runs

---

## What's Working

### cinQ ID (Identity)
- ✅ Chat ID registration (`@alice`)
- ✅ Peer ID generation (libp2p keypair)
- ✅ Contact list (SQLite)
- ✅ DHT lookup (resolve Chat ID → Peer ID)

**How identity works:**
- User picks a Chat ID (like `@alice`)
- cinQ generates a libp2p Peer ID (cryptographic keypair)
- Chat ID → Peer ID mapping published to Kademlia DHT
- Contacts stored locally in SQLite

**Limitations:**
- DHT entries don't persist across restarts (no permanent storage yet)
- No key recovery mechanism
- No spam protection on Chat ID registration

### cinQ Chat (Messaging)
- ✅ Send/receive P2P messages
- ✅ Conversation history (SQLite)
- ✅ Message delivery when both peers online

**How chat works:**
- Messages sent directly peer-to-peer via libp2p
- Stored in local SQLite database
- Chat IDs resolved via DHT before sending

**Limitations:**
- No offline message queue (messages fail if recipient offline)
- No read receipts
- No group chat

### cinQ Drive Lite (Storage)
- ✅ Save files locally (`~/.cinq/drive/`)
- ✅ Read files
- ✅ Generate P2P share links

**How Drive Lite works:**
- Files stored in local filesystem
- Share links contain Peer ID + file path
- Recipients connect directly to sender to fetch

**Limitations:**
- Local-first only (not distributed across peers)
- Share links require sender to be online
- No redundancy or availability guarantees
- No storage provider economy yet

### cinQ Pay (Metering)
- ✅ Track Qi costs for operations
- ✅ Usage breakdown by category
- ✅ Cost table display

**How Pay works:**
- Every operation has a Qi cost (defined in `costs.rs`)
- Usage accumulated locally in memory
- Balance and breakdown available via MCP

**Limitations:**
- Metering only — no actual Qi transactions yet
- Requires Pelagus wallet integration for real payments
- No provider payments

### MCP Server
- ✅ HTTP server on `localhost:3000`
- ✅ JSON-RPC protocol (MCP spec)
- ✅ Tool definitions for all services
- ✅ Entropic can discover and call tools

---

## MCP Tools Available

| Tool | Service | Status |
|------|---------|--------|
| `cinq_id_whoami` | ID | ✅ |
| `cinq_id_lookup` | ID | ✅ |
| `cinq_id_contacts` | ID | ✅ |
| `cinq_chat_send` | Chat | ✅ |
| `cinq_chat_history` | Chat | ✅ |
| `cinq_chat_conversations` | Chat | ✅ |
| `cinq_drive_list` | Drive | ✅ |
| `cinq_drive_read` | Drive | ✅ |
| `cinq_drive_write` | Drive | ✅ |
| `cinq_drive_share` | Drive | ✅ |
| `cinq_pay_balance` | Pay | ✅ |
| `cinq_pay_usage` | Pay | ✅ |
| `cinq_pay_costs` | Pay | ✅ |

---

## Technical Questions & Answers

### How are identities resolved?
Chat IDs (`@alice`) are resolved via Kademlia DHT. When you register, your Chat ID → Peer ID mapping is published to the DHT. Others query the DHT to find you.

### How are peers discovered?
- **Local**: mDNS broadcasts on local network
- **Remote**: Kademlia DHT with bootstrap nodes
- **Direct**: If you know someone's Peer ID, dial directly

### What happens offline?
- **Chat**: Messages fail if recipient offline (no queue yet)
- **Drive**: Files accessible locally, share links fail
- **Identity**: Cached locally, DHT lookup fails

### Who guarantees availability?
Currently: nobody. Drive Lite is local-first. Future: storage providers stake Qi for availability SLAs.

### How is spam handled?
Currently: not handled. Future: Qi deposits to register Chat IDs, Qi costs to send messages.

### How is key recovery handled?
Currently: not handled. Lose your keys, lose your identity. Future: social recovery or seed phrases.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Tauri 2.x |
| P2P | libp2p 0.54 |
| DHT | Kademlia |
| Discovery | mDNS |
| Encryption | Noise protocol |
| Database | SQLite (rusqlite) |
| MCP Server | Axum 0.7 |
| Payments | Qi (Quai Network) |

---

## File Structure

```
src-tauri/src/
├── main.rs           # Tauri app + MCP server startup
├── lib.rs            # Module exports
├── mcp/
│   ├── server.rs     # Axum HTTP server
│   ├── protocol.rs   # JSON-RPC types
│   └── tools.rs      # Tool definitions
├── grid/
│   ├── node.rs       # libp2p swarm
│   ├── chat.rs       # Messaging + SQLite
│   ├── userid.rs     # Identity registry
│   └── transfer.rs   # File transfer
└── swarm/
    ├── costs.rs      # Qi pricing
    └── tracker.rs    # Usage metering
```

---

## Roadmap

### v0.9 (Current)
- [x] Core services working locally
- [x] MCP server running
- [x] Tools callable from Entropic

### v1.0 (MVP)
- [ ] Persistent DHT (survive restarts)
- [ ] Offline message queue
- [ ] Pelagus wallet integration (real Qi)
- [ ] Share link relay (work when sender offline)

### v1.x (Growth)
- [ ] Distributed storage (multiple providers)
- [ ] Provider mode (earn Qi)
- [ ] Anti-spam (Qi deposits)
- [ ] Key recovery

### Future
- [ ] cinQ Mail
- [ ] cinQ Browser
- [ ] Full provider economy

---

## Testing

### Two-Node Test
```bash
# Mac Mini (192.168.5.4)
cargo run --release -- --port 9000

# MacBook Air (192.168.4.253)  
cargo run --release -- --port 9000 --bootstrap /ip4/192.168.5.4/tcp/9000/p2p/PEER_ID
```

### MCP Test
```bash
# Health check
curl http://localhost:3000/

# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Call a tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"cinq_id_whoami","arguments":{}},"id":2}'
```
