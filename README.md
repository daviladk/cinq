# cinQ

**Decentralized Infrastructure-as-a-Service on Quai Network**

A Qi-backed compute marketplace where hardware providers earn native Qi for FLOPs. The Qora Agent Swarm orchestrates workloads across idle gaming PCs, servers, and edge devices—creating the foundation for a truly sovereign internet.

> **Network Backbone:** cinQ leverages **Stratum X nodes** as the DePIN network foundation. The architecture is also compatible with standard Quai nodes for broader deployment flexibility.

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
- Phase 4 ⏳ Agent Economy (Provider agents, UTXO micropayments, Qora treasury)
- Phase 5 ⏳ Sovereign OS (CRDTs, full IaaS marketplace, AWS replacement)

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

### Identity Layer (Soulbound NFT)

cinQ introduces a **permanent digital identity** backed by blockchain and hardware:

| Component | Description |
|-----------|-------------|
| **Soulbound NFT (SBT)** | Non-transferable token minted to your wallet—cannot be moved, sold, or transferred. Your identity stays with you forever. |
| **cinQ ID** | Phone-number style identifier (e.g., `1-555-0001`) minted INTO the SBT metadata. This is your permanent address on the network. |
| **Zone Prefix** | Auto-detected from your Quai wallet address (1=Cyprus, 2=Paxos, 3=Hydra). Your ID reflects your shard. |
| **Tangem Wallet** | Recommended hardware wallet where your SBT lives. NFC card + PIN + biometrics = three-factor identity. |

**Why Tangem?**

Your cinQ identity is **permanent**. Losing access means losing your reputation, contacts, and network history. Tangem provides:

- **PIN Recovery** - Lose your cards? Order new ones, enter your PIN, identity restored
- **Three-Factor Auth** - Something you have (card) + know (PIN) + are (biometrics)
- **No Seed Phrases** - No 24 words to lose or get phished
- **~$60 investment** - Small price for a lifetime digital identity

> ⚠️ **SBTs are non-transferable by design.** Once minted to a wallet address, the token cannot move. Choose your identity wallet carefully—we recommend Tangem for maximum security.

**Can I use a different wallet?**

Yes, any Quai-compatible wallet (Pelagus, etc.) works. But for a **permanent identity** that holds your reputation, contacts, and earnings history, hardware security makes sense. A browser extension wallet with seed phrase backup is technically possible but higher risk for something this permanent.

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

# Install UI dependencies
cd ui && npm install && cd ..

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
