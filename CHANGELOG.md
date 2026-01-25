# Changelog

All notable changes to cinQ Connect are documented here.

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
