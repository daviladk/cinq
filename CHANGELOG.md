# Changelog

All notable changes to cinQ Connect are documented here.

## [v0.6.0-identity] - 2026-02-11

### Added
- **User ID System** 🆔
  - Phone-number style Chat IDs (e.g., `555-123-4567`)
  - Auto-generated 10-digit IDs for testing
  - Zone-prefixed format for SBT: `Z-XXX-XXX-XXXX` (e.g., `2-555-123-4567`)
  - SQLite registry for user ID storage
  - Reverse lookup: peer ID → user ID

- **Contact Card System** 📇
  - Shareable contact cards with name, bio, avatar
  - QR code generation (JSON, URL, compact formats)
  - `cinq://contact/` deep link protocol
  - Profile management (display name, bio)

- **SBT Integration Foundation** 🏷️
  - `QuaiZone` enum (Cyprus=0, Paxos=1, Hydra=2)
  - `SbtManager` for future on-chain verification
  - `SbtProof` for signed identity attestations
  - `upgrade_to_sbt()` for migrating test IDs to verified IDs
  - 90+ billion unique ID capacity (9 zones × 10B each)

### Technical
- `userid.rs` - UserId struct with zone support, UserIdRegistry
- `sbt.rs` - SBT contract ABI, SbtManager, SbtProof, SbtError
- `ContactCard` - Shareable identity with QR/URL serialization
- New Tauri commands: `get_user_id`, `lookup_user_id`, `update_profile`, `get_contact_card`, `parse_contact_card`
- Added `base64` crate for URL-safe contact card encoding

### ID Format
| Type | Format | Example | Verified |
|------|--------|---------|----------|
| Legacy/Test | 10 digits | `555-123-4567` | ❌ |
| SBT Cyprus | Zone 0 | `0-555-123-4567` | ✅ |
| SBT Paxos | Zone 1 | `1-555-123-4567` | ✅ |
| SBT Hydra | Zone 2 | `2-555-123-4567` | ✅ |

---

## [v0.5.0-p2p-chat] - 2026-01-27

### Added
- **P2P Chat System** 🎉
  - Real-time peer-to-peer messaging between connected nodes
  - Chat-first UI replacing the old dashboard interface
  - SQLite-backed message storage with conversations
  - Contact management with peer ID and display names
  - Message delivery confirmation (`ChatReceived { delivered: true }`)
  - Auto-start node on app launch
  - Persistent peer discovery via Kademlia DHT across subnets

### Technical
- `ChatManager` - SQLite database for conversations, messages, contacts
- `ChatMessage` protocol with `message_id`, `sender_name`, `encrypted_content`, `timestamp`
- `store_incoming_message()` - Stores received messages in database
- Node now accepts `chat_manager` reference for storing incoming messages
- Frontend polls every 3 seconds for conversation updates

### Fixed
- **Cross-subnet messaging** - Messages now properly stored on receiving end
  - Bug: Incoming messages were logged but not saved to database
  - Fix: Pass `ChatManager` to swarm task via `Arc<RwLock<ChatManager>>`
  - Messages now visible in UI after frontend polling

### Network Testing
- Successfully tested P2P chat between:
  - Mac Mini (192.168.5.4) - Peer ID: `12D3KooWP7zQ4dLEw3JiPdrerChHsTzhjfxs69oEBcxZieXU1sAu`
  - MacBook Air (192.168.4.253) - Peer ID: `12D3KooWGhyNKVUhwiigtPZ9DpMyho9gvAsRWhGfeGDVcEt6Tgkr`
- mDNS blocked by Eero mesh (different subnets), but DHT bootstrap works
- ~66ms round-trip for message delivery

---

## [v0.4.0-pelagus-wallet] - 2026-01-24

### Added
- **Pelagus Wallet Integration**
  - Integrated `window.pelagus` provider API for Quai Network wallet
  - `quai_requestAccounts` for wallet connection with approval popup
  - `quai_getBalance` for fetching real Qi balance from chain
  - Event listeners for `accountsChanged` and `chainChanged`
  - Auto-reconnect if previous Pelagus session exists
  - Shortened wallet address display (`0x1234...5678`) with full address on hover

### Changed
- Wallet balance now displays 4 decimal places
- Polling interval increased to 5 seconds (was 3s)

### Notes
- Escrow deposits are currently simulated (smart contract integration pending)
- Requires Pelagus browser extension installed

---

## [v0.3.0-p2p-routing-infra] - 2026-01-24

### Added
- **P2P Tunnel Routing Infrastructure**
  - `TunnelManager` module for managing client and exit tunnels
  - `ExitTunnel` - handles exit node side (connects to target, relays data)
  - `ClientTunnel` - handles client side (routes through exit peer)
  - P2P message types: `ProxyConnect`, `ProxyData`, `ProxyClose`
  - Protocol handlers in node.rs for tunnel message routing
  - `get_exit_peers` Tauri command for frontend exit node selection

### Technical
- Added `p2p_outbound_tx/rx` channel for tunnel manager → swarm communication
- Wired tunnel_manager to proxy via `set_tunnel_manager()`
- Infrastructure ready but proxy still uses direct TCP (final wiring pending)

---

## [v0.2.0-socks5-proxy] - 2026-01-24

### Added
- **SOCKS5 Proxy Server**
  - Local SOCKS5 proxy on `127.0.0.1:1080`
  - SOCKS5 handshake and CONNECT command support
  - Bidirectional data relay between client and target
  - Bandwidth tracking integrated with metrics system
  - Proxy status reporting to frontend

### UI
- Added proxy toggle switch (requires node running first)
- Proxy status display with address and connection count
- Control card with P2P Node and SOCKS5 Proxy toggles

### Commands
- `start_proxy` - Start SOCKS5 proxy on specified port
- `stop_proxy` - Stop the proxy server
- `get_proxy_status` - Get running state and connection info

---

## [v0.1.0-p2p-working] - 2026-01-24

### Added
- **P2P Networking Foundation**
  - libp2p 0.54 integration with Noise encryption
  - mDNS for local peer discovery
  - Kademlia DHT for distributed peer routing
  - Custom `/cinq/1.0.0` protocol for request/response
  - Identify protocol for peer information exchange
  - AutoNAT and DCUTR for NAT traversal
  - Relay protocol support for peers behind NAT

### UI
- Landing page with Pelagus connect prompt
  - Hop selector (0H, 1H, 3H) for privacy routing
  - Status bar with node status, peer count, bandwidth
  - System Monitor card with bandwidth usage
  - DePIN Network card with peers and security level
  - Escrow Balance card with USD conversion
  - Wallet Balance card

### Backend
- Tauri 2.x desktop app framework
- Rust async runtime with tokio
- Bandwidth metrics tracking per peer
- Billing summary calculations

### Commands
- `start_node` - Initialize P2P node and join network
- `stop_node` - Gracefully disconnect from network
- `get_peers` - List connected peer IDs
- `get_billing_summary` - Get bandwidth usage stats

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     cinQ Connect                             │
├─────────────────────────────────────────────────────────────┤
│  Frontend (HTML/JS/CSS)                                      │
│  ├── Pelagus Wallet Integration (window.pelagus)            │
│  └── Tauri IPC (window.__TAURI__.core.invoke)               │
├─────────────────────────────────────────────────────────────┤
│  Tauri Commands (main.rs)                                    │
│  ├── start_node / stop_node                                  │
│  ├── start_proxy / stop_proxy                                │
│  ├── get_peers / get_billing_summary                         │
│  └── get_exit_peers                                          │
├─────────────────────────────────────────────────────────────┤
│  Grid Module (src/grid/)                                     │
│  ├── node.rs      - CinqNode with libp2p swarm              │
│  ├── proxy.rs     - SOCKS5 proxy server                      │
│  ├── tunnel.rs    - P2P tunnel management                    │
│  ├── protocol.rs  - Custom protocol messages                 │
│  ├── metrics.rs   - Bandwidth tracking                       │
│  └── transfer.rs  - File transfer (future)                   │
├─────────────────────────────────────────────────────────────┤
│  libp2p Stack                                                │
│  ├── Transport: TCP + Noise encryption                       │
│  ├── Discovery: mDNS + Kademlia DHT                          │
│  ├── NAT: AutoNAT + DCUTR + Relay                           │
│  └── Protocol: Request/Response + Identify                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Roadmap

- [ ] Wire proxy to use P2P tunnels (complete routing)
- [ ] Escrow smart contract on Quai Network
- [ ] Bootstrap nodes for cross-internet discovery
- [ ] Multi-hop onion routing (3 hops)
- [ ] Exit node earnings distribution
- [ ] Mobile companion app
