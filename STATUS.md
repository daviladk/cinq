# cinQ Cloud — Project Status

> **Version:** 0.9.0  
> **Updated:** March 30, 2026  
> **Build:** ✅ Compiles

---

## What Actually Exists

### MCP Server
- ✅ HTTP server runs on `localhost:3000`
- ✅ JSON-RPC protocol (MCP spec)
- ✅ Tool definitions registered
- ✅ Entropic can discover and call tools

### Tool Handlers
- 🔧 **All handlers return mock/stub data**
- ❌ Not wired to actual CinqState services
- ❌ Not connected to P2P network
- ❌ Not persisting to SQLite

### P2P Infrastructure (in `grid/` module)
- ✅ libp2p swarm code exists
- ✅ Kademlia DHT code exists
- ✅ mDNS discovery code exists
- ✅ Chat protocol code exists
- ❌ Not connected to MCP handlers

### What This Means

When Claude calls `cinq_chat_send`, it returns:
```json
{
  "sent": true,
  "to": "@alice",
  "message_id": "msg_123"
}
```

But **no actual message is sent**. It's a stub.

---

## MCP Tools

| Tool | Defined | Wired |
|------|---------|-------|
| `cinq_id_whoami` | ✅ | ❌ stub |
| `cinq_id_lookup` | ✅ | ❌ stub |
| `cinq_id_contacts` | ✅ | ❌ stub |
| `cinq_chat_send` | ✅ | ❌ stub |
| `cinq_chat_history` | ✅ | ❌ stub |
| `cinq_chat_conversations` | ✅ | ❌ stub |
| `cinq_drive_list` | ✅ | ❌ stub |
| `cinq_drive_read` | ✅ | ❌ stub |
| `cinq_drive_write` | ✅ | ❌ stub |
| `cinq_drive_share` | ✅ | ❌ stub |
| `cinq_pay_balance` | ✅ | ❌ stub |
| `cinq_pay_usage` | ✅ | ❌ stub |
| `cinq_pay_costs` | ✅ | ❌ stub |

---

## Code That Exists But Isn't Connected

### `grid/` — P2P Layer
| File | What It Does | Status |
|------|--------------|--------|
| `node.rs` | libp2p swarm, Kademlia, mDNS | ✅ Code exists |
| `chat.rs` | Message protocol, SQLite storage | ✅ Code exists |
| `userid.rs` | Chat ID registry | ✅ Code exists |
| `transfer.rs` | File transfer protocol | ✅ Code exists |

### `swarm/` — Metering
| File | What It Does | Status |
|------|--------------|--------|
| `costs.rs` | Qi pricing tables | ✅ Code exists |
| `tracker.rs` | Usage accumulator | ✅ Code exists |

### The Gap

MCP tool handlers in `mcp/tools.rs` have `// TODO: Wire to CinqState` comments.

The connection between MCP → CinqState → P2P doesn't exist yet.

---

## To Make It Real

### Phase 1: Wire ID tools
1. Pass `CinqState` to MCP server
2. `cinq_id_whoami` → read from `CinqState.userid`
3. `cinq_id_lookup` → query DHT
4. `cinq_id_contacts` → read from SQLite

### Phase 2: Wire Chat tools
1. `cinq_chat_send` → call `CinqState.chat.send_message()`
2. `cinq_chat_history` → query SQLite
3. Test between two nodes

### Phase 3: Wire Drive tools
1. `cinq_drive_write` → write to `~/.cinq/drive/`
2. `cinq_drive_read` → read from filesystem
3. `cinq_drive_share` → generate P2P link

### Phase 4: Wire Pay tools
1. `cinq_pay_balance` → read from tracker
2. `cinq_pay_usage` → query tracker by period

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Tauri 2.x |
| P2P | libp2p 0.54 |
| DHT | Kademlia |
| Encryption | Noise |
| Database | SQLite (rusqlite) |
| MCP Server | Axum 0.7 |

---

## Testing

### MCP Server Test
```bash
# Start cinQ
cd src-tauri && cargo tauri dev

# Health check
curl http://localhost:3000/

# List tools (returns definitions)
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Call tool (returns MOCK data)
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"cinq_id_whoami","arguments":{}},"id":2}'
```
