# cinQ Connect

**P2P Chat & DePIN Bandwidth Marketplace for Quai Network**

A decentralized peer-to-peer network for private messaging and bandwidth sharing using Qi tokens. Chat directly with peers, route traffic through a privacy-preserving mesh network with configurable hop counts.

![Version](https://img.shields.io/badge/version-0.6.0-blue)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Current Status (v0.6.0)

**User ID System + Contact Cards!** 🎉
- Phone-number style Chat IDs (e.g., `555-123-4567`)
- Contact cards with QR codes for easy sharing
- SBT integration ready for on-chain identity verification
- Zone-based IDs for Quai Network shards (Cyprus, Paxos, Hydra)

## Features

- 💬 **P2P Chat** - Send messages directly to peers, no server required
- 🆔 **Chat IDs** - Memorable phone-number style identifiers
- 📇 **Contact Cards** - Share your identity via QR codes or URLs
- 🔐 **Pelagus Wallet Integration** - Connect your Quai Network wallet
- 🌐 **P2P Mesh Network** - Decentralized peer discovery via mDNS and Kademlia DHT
- 🔒 **Encrypted Connections** - All peer traffic secured with Noise protocol
- 🏷️ **SBT Ready** - Soul Bound Token integration for verified identities
- 📊 **Bandwidth Metering** - Track usage for Qi-based payments
- 🖥️ **SOCKS5 Proxy** - Route any app through the network (infrastructure ready)

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
