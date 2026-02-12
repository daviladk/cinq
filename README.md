# cinQ

**Decentralized Infrastructure-as-a-Service on Quai Network**

A Qi-backed compute marketplace where hardware providers earn native Qi for FLOPs. The Qora Agent Swarm orchestrates workloads across idle gaming PCs, servers, and edge devices—creating the foundation for a truly sovereign internet.

![Version](https://img.shields.io/badge/version-0.6.0-blue)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Current Status (v0.6.0)

**Phase 2: Gateway Shell with Messaging Alpha** 🎉
- P2P mesh networking foundation (libp2p + Kademlia DHT)
- E2EE messaging for early user adoption
- Phone-number style Chat IDs (`555-123-4567`)
- Contact cards with QR sharing
- Pelagus wallet integration

## Vision

**Core:** Qi-backed IaaS marketplace where FLOPs = Qi, eliminating speculative token economics.

**Roadmap:**
- Phase 1 ✅ Genesis Node (P2P connectivity, Qi settlement prototype)
- Phase 2 🔄 Gateway Shell (Tauri app + **Messaging Alpha** for adoption)
- Phase 3 ⏳ Streaming & Edge (Voice/Video, RF hardware integration)
- Phase 4 ⏳ Sovereign OS (CRDTs, Qora orchestration, full AWS replacement)

## Features

### Infrastructure (Core)
- 🌐 **P2P Mesh Network** - Decentralized peer discovery via mDNS and Kademlia DHT
- 🔒 **Encrypted Connections** - All peer traffic secured with Noise protocol
- 📊 **Bandwidth Metering** - Track usage for Qi-based payments
- 🖥️ **SOCKS5 Proxy** - Route any app through the network
- 🔐 **Pelagus Wallet** - Native Qi payments

### Messaging Alpha (Adoption Hook)
- 💬 **E2EE Chat** - Serverless messaging via the mesh
- 🆔 **Chat IDs** - Phone-number style identifiers
- 📇 **Contact Cards** - QR codes & deep links for sharing
- 🏷️ **SBT Ready** - Soul Bound Token identity for $CINQ reputation

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) (1.70+)
- [Node.js](https://nodejs.org/) (18+)
- [Pelagus Wallet](https://pelaguswallet.io/) browser extension

### Build & Run

```bash
# Clone the repository
git clone https://github.com/daviladk/cinq.git
cd cinq

# Run in development mode
cargo tauri dev

# Build for production
cargo tauri build
```

### Usage

1. **Connect Wallet** - Click "Connect to Pelagus" and approve in the extension
2. **Add Escrow** - Click "+ Add 10 Qi" to fund your bandwidth escrow
3. **Start Node** - Toggle the P2P Node switch to join the network
4. **Start Proxy** - Toggle SOCKS5 Proxy to route traffic (127.0.0.1:1080)

Configure your browser or apps to use SOCKS5 proxy at `127.0.0.1:1080`.

## Architecture

```
Browser/App → SOCKS5 Proxy (1080) → P2P Tunnel → Exit Peer → Internet
                    ↓
            Pelagus Wallet (Qi payments)
```

### Tech Stack

- **Frontend**: HTML/CSS/JavaScript (vanilla)
- **Backend**: Rust + Tauri 2.x
- **P2P**: libp2p 0.54 (Kademlia, mDNS, Noise, Relay)
- **Proxy**: fast-socks5
- **Wallet**: Pelagus (Quai Network)

## Development

### Project Structure

```
cinq/
├── dist/                 # Frontend assets
│   ├── index.html
│   ├── main.js
│   └── styles.css
├── src-tauri/
│   ├── src/
│   │   ├── main.rs       # Tauri commands
│   │   ├── lib.rs
│   │   └── grid/         # P2P networking
│   │       ├── node.rs   # libp2p swarm
│   │       ├── chat.rs   # Chat manager & SQLite storage
│   │       ├── protocol.rs # P2P message types
│   │       ├── proxy.rs  # SOCKS5 server
│   │       ├── tunnel.rs # P2P tunneling
│   │       ├── bootstrap.rs # Peer persistence
│   │       └── metrics.rs # Bandwidth tracking
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docs/
│   └── DESIGN.md
├── CHANGELOG.md
└── README.md
```

### Git Tags

| Tag | Description |
|-----|-------------|
| `v0.1.0-p2p-working` | P2P peer discovery working |
| `v0.2.0-socks5-proxy` | SOCKS5 proxy implementation |
| `v0.3.0-p2p-routing-infra` | P2P tunnel infrastructure |
| `v0.4.0-pelagus-wallet` | Pelagus wallet integration |
| `v0.5.0-p2p-chat` | P2P chat with message storage |

## Roadmap

- [x] P2P peer discovery (mDNS + Kademlia)
- [x] SOCKS5 proxy server
- [x] P2P tunnel infrastructure
- [x] Pelagus wallet integration
- [x] P2P Chat messaging ✨ **NEW**
- [ ] Message encryption (currently plaintext)
- [ ] Complete P2P traffic routing
- [ ] Escrow smart contract
- [ ] Multi-hop onion routing
- [ ] Bootstrap nodes for WAN discovery
- [ ] Exit node earnings

## Contributing

Contributions welcome! Please read the [DESIGN.md](docs/DESIGN.md) for architecture details.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built for [Quai Network](https://qu.ai)** 🔷
