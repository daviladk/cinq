# cinQ Connect - Project Status

> **Last Updated:** January 27, 2026 (4:30 AM)  
> **Version:** 0.5.0-p2p-chat  
> **Build Status:** ✅ Working

---

## 🎉 Latest Achievement

**P2P Chat is working across subnets!** Messages successfully delivered between Mac Mini and MacBook Air through Kademlia DHT (mDNS blocked by Eero mesh router).

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
- **SQLite (rusqlite)** - Chat message storage
- **Yamux** - Stream multiplexing
- **Protocol:** `/cinq/transfer/1.0.0`

---

## File Structure

```
cinq/
├── dist/                     # Frontend (chat-first UI)
│   ├── index.html           # Chat interface
│   ├── main.js              # Chat logic + Tauri invoke
│   └── styles.css           # Dark theme styling
│
├── src-tauri/src/
│   ├── main.rs              # Tauri commands (start_node, send_message, etc.)
│   ├── lib.rs               # Module exports
│   └── grid/
│       ├── mod.rs           # Module re-exports
│       ├── node.rs          # libp2p swarm, peer management
│       ├── chat.rs          # ChatManager, SQLite storage
│       ├── protocol.rs      # CinqRequest/CinqResponse types
│       ├── bootstrap.rs     # Peer persistence between sessions
│       ├── proxy.rs         # SOCKS5 proxy (not fully wired)
│       ├── tunnel.rs        # P2P tunnel infrastructure
│       ├── transfer.rs      # File transfer (unused)
│       └── metrics.rs       # Bandwidth tracking
│
├── docs/DESIGN.md           # Architecture & design decisions
├── CHANGELOG.md             # Version history
├── README.md                # Project overview
└── STATUS.md                # This file
```

---

## Key Code Locations

### Message Sending (sender side)
- **Frontend:** `dist/main.js` → `sendMessage()` → `invoke('send_message', ...)`
- **Backend:** `main.rs` → `send_message()` → `node.send_request()`
- **Node:** `node.rs` → `NodeCommand::SendProxyRequest` → `swarm.behaviour_mut().protocol.send_request()`

### Message Receiving (receiver side)
- **Node:** `node.rs` line ~491 → `CinqRequest::ChatMessage` handler
- **Storage:** `chat_manager.store_incoming_message()` (added in v0.5.0)
- **Frontend:** Polls `get_conversations` + `get_messages` every 3 seconds

### Important Fix (v0.5.0)
The bug was that incoming messages were logged but **never stored in the database**. Fixed by:
1. Added `chat_manager: Option<Arc<RwLock<ChatManager>>>` field to `CinqNode`
2. Added `set_chat_manager()` method to inject ChatManager reference
3. Modified `CinqRequest::ChatMessage` handler to call `store_incoming_message()`

---

## Tauri Commands

| Command | Description |
|---------|-------------|
| `start_node` | Initialize P2P node, auto-connect to bootstraps |
| `stop_node` | Gracefully disconnect |
| `get_peers` | List connected peers |
| `get_peer_id` | Get local peer ID |
| `connect_peer` | Dial a peer by multiaddr |
| `send_message` | Send chat message to peer |
| `get_conversations` | List all chat conversations |
| `get_messages` | Get messages for a conversation |
| `start_conversation` | Create/get conversation with peer |
| `mark_conversation_read` | Clear unread count |
| `get_contacts` | List saved contacts |
| `add_contact` | Add a contact |

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
