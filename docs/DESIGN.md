# cinQ - Design Document

> **Version:** 0.6.0  
> **Date:** February 12, 2026  
> **Status:** Phase 2 - Gateway Shell

---

## Overview

**cinQ** is a decentralized Infrastructure-as-a-Service (IaaS) platform built on Quai Network. By linking Qi directly to FLOPs, cinQ creates a marketplace where hardware providers are compensated in energy-backed currency—eliminating speculative token economics.

### Core Vision

- **Qi = FLOPs** - Energy-anchored compute pricing
- **Qora Agent Swarm** - AI-orchestrated workload management
- **Harvest Idle Silicon** - Gaming PCs, servers, EVs → productive mesh
- **10/90 Deposit Model** - High-quality, audit-ready nodes
- **$CINQ Soulbound Identity** - Non-tradable reputation (1:1 mint, 100:1 redeem)

### Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 1. Genesis Node | P2P connectivity, Qi settlement CLI | ✅ Complete |
| 2. Gateway Shell | Tauri app + **Messaging Alpha** | 🔄 Current |
| 3. Streaming & Edge | Voice/Video, RF hardware (Wingbits/Helium) | ⏳ Planned |
| 4. Agent Economy | Provider agents, UTXO micropayments, Qora treasury | ⏳ Planned |
| 5. Sovereign OS | CRDTs, full IaaS marketplace, AWS replacement | ⏳ Planned |

---

## Identity System

### Chat IDs (Phone Number Style)

Users get memorable identifiers instead of complex peer IDs:

| Peer ID | Chat ID |
|---------|---------|
| `12D3KooWP7zQ4dLEw3JiPdrerChHsTzhjfxs69oEBcxZieXU1sAu` | `555-123-4567` |

### ID Formats & Zone Prefixes (Like Country Codes)

Zones work like **country codes for phone numbers**, based on Quai Network shards:

| Type | Format | Example | Description |
|------|--------|---------|-------------|
| Legacy (Alpha) | 10 digits | `555-123-4567` | Pre-SBT users, no zone prefix |
| Cyprus (Zone 1) | 1 + 10 digits | `1-555-123-4567` | First shard, SBT verified |
| Paxos (Zone 2) | 2 + 10 digits | `2-555-123-4567` | Second shard, SBT verified |
| Hydra (Zone 3) | 3 + 10 digits | `3-555-123-4567` | Third shard, SBT verified |
| Future Zones | N + 10 digits | `N-XXX-XXX-XXXX` | Expands with Quai shards |

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZONE PREFIX SYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Legacy Users (pre-SBT):                                       │
│   └── No prefix: 555-123-4567 (alpha testers, unverified)       │
│                                                                 │
│   SBT Holders (verified on-chain):                              │
│   ├── Cyprus (Zone 1): 1-555-123-4567                           │
│   ├── Paxos  (Zone 2): 2-555-123-4567                           │
│   ├── Hydra  (Zone 3): 3-555-123-4567                           │
│   └── Future shards:   4-9+ as Quai expands                     │
│                                                                 │
│   Per-Zone Capacity: 10 billion unique IDs                      │
│   Total Capacity: Unlimited (grows with Quai shards)            │
│                                                                 │
│   Zone = Quai shard where SBT was minted                        │
│   Your zone prefix is permanent (part of your identity)         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Why this works:**
- **Infinite scalability** - Each Quai shard = new zone = 10B more IDs
- **Sybil resistance** - SBT mint ties ID to on-chain payment
- **Cross-shard routing** - Zone prefix tells network which shard to query

### Legacy ID Migration

Legacy IDs (no zone prefix) are **ephemeral alpha testing IDs**. They do NOT migrate to SBT:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEGACY → SBT MIGRATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ALPHA PHASE (pre-SBT):                                        │
│   └── User gets: 555-123-4567 (temporary, unverified)           │
│                                                                 │
│   SBT LAUNCH:                                                   │
│   └── User mints SBT on Cyprus shard                            │
│   └── Gets NEW number: 1-867-530-9999                           │
│   └── Old legacy ID (555-123-4567) expires/becomes inactive     │
│   └── Proof of alpha participation → Bonus $CINQ reward!        │
│                                                                 │
│   WHY NO MIGRATION?                                             │
│   • Legacy IDs were never on-chain (no ownership proof)         │
│   • SBT numbers are assigned at mint time by smart contract     │
│   • Clean slate = no complex migration logic                    │
│   • Alpha testers get rewarded with $CINQ, not number claims    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Alpha Tester Rewards:**
| Proof | Reward | How to Verify |
|-------|--------|---------------|
| Had legacy ID before SBT launch | 5,000 $CINQ | Signed message from old peer ID |
| Sent 100+ messages in alpha | +2,500 $CINQ | DHT activity logs |
| Relayed 1GB+ in alpha | +2,500 $CINQ | Bandwidth metrics |

This rewards early adopters **without** complex ID migration. Your new SBT number is your permanent identity.

### Soul Bound Token (SBT) Integration

SBTs are non-transferable NFTs that prove on-chain identity:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SBT MINTING FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User connects wallet (Pelagus)                              │
│  2. Selects Quai shard (Cyprus, Paxos, Hydra, etc.)             │
│  3. Pays mint fee on that shard (sybil resistance)              │
│  4. Contract assigns zone prefix + unique 10-digit Chat ID      │
│  5. User gets verified identity: 1-555-123-4567 (Cyprus)        │
│  6. Signs proof message with wallet                             │
│  7. Publishes to DHT for global discovery                       │
│                                                                 │
│  Your zone prefix = the shard where you minted = permanent      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### SBT Mint Pricing (Anti-Sybil)

The goal is **economic friction, not gatekeeping**. The mint fee should be:
- **Meaningful enough** that average users only want one identity
- **Low enough** that anyone can afford their first
- **Not prohibitive** - wealthy bad actors could still create multiple, and that's acceptable

| Approach | Price | Rationale |
|----------|-------|-----------|
| **Flat Fee** | ~$5-10 Qi | Coffee money - accessible but not free |
| **Tiered** | First: $1, Second: $10, Third: $100 | Exponential discourages multiples |

**Philosophy:** Freedom over identity verification. We're not trying to create a police state—we're creating friction that makes spam uneconomical while preserving pseudonymity. If someone wants 10 identities and pays 10x, that's their choice.

**Revenue Split:**
- 90% → Foundation (funds development)
- 10% → Contract maintenance (covers gas)

#### Early Adopter Benefits

First users help bootstrap the network and deserve recognition:

| Milestone | Bonus | Benefit |
|-----------|-------|---------|
| First 1,000 IDs | 🥇 **Founder Badge** | 10,000 $CINQ points |
| First 10,000 IDs | 🥈 **Pioneer Badge** | 5,000 $CINQ points |
| First 100,000 IDs | 🥉 **Early Adopter Badge** | 1,000 $CINQ points |

These points can be:
- **Converted to Qi** at a redemption rate (e.g., 100:1)
- **Staked for reputation** - higher score = priority in job queues
- **Used for premium features** - custom Chat IDs, profile themes

### $CINQ Points (Reputation GameFi)

$CINQ points gamify engagement like credit card rewards:

```
┌─────────────────────────────────────────────────────────────────┐
│                    EARNING $CINQ POINTS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DAILY ACTIONS                          POINTS                  │
│  ─────────────────────────────────────────────────              │
│  • Come online (daily check-in)         +10                     │
│  • Send first message of day            +5                      │
│  • Relay 1 GB of traffic                +50                     │
│  • Complete a compute job               +100                    │
│  • Refer a friend (on mint)             +500                    │
│                                                                 │
│  STREAKS                                                        │
│  ─────────────────────────────────────────────────              │
│  • 7-day streak                         +100 bonus              │
│  • 30-day streak                        +500 bonus              │
│  • 365-day streak                       +5,000 bonus            │
│                                                                 │
│  REPUTATION TIERS                                               │
│  ─────────────────────────────────────────────────              │
│  • Bronze   (0-999)       → Basic access                        │
│  • Silver   (1K-9.9K)     → Priority job queue                  │
│  • Gold     (10K-99K)     → Reduced fees (5%)                   │
│  • Platinum (100K+)       → VIP support, beta features          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Points Properties

- **Soulbound** - Points are tied to your SBT, not tradable
- **Decay** - Inactive accounts lose 1% per month (use it or lose it)
- **Convertible** - Redeem for Qi at 100:1 ratio (subject to change)
- **Non-inflatable** - Total supply capped per epoch

This creates a flywheel: **Use cinQ → Earn points → Higher reputation → Better rates → Use cinQ more**

### Contact Cards

Shareable identity info via QR codes or URLs:

```json
{
  "chat_id": "1-555-123-4567",
  "zone": 1,
  "display_name": "Alice Smith",
  "peer_id": "12D3KooW...",
  "bio": "DePIN enthusiast 🌐",
  "is_verified": true,
  "is_legacy": false,
  "reputation_tier": "Gold",
  "cinq_points": 45230
}
```

**Zone Indicator:**
- `zone: null` + `is_legacy: true` = Pre-SBT alpha user (OG!)
- `zone: 1` = Cyprus shard SBT holder
- `zone: 2` = Paxos shard SBT holder
- etc.

**Sharing Formats:**
- **URL:** `cinq://contact/eyJ1c2VyX2lkIjo...` (deep link)
- **Compact:** `cinq:1-555-123-4567:P7zQ4dLEw3Ji:Alice` (includes zone)
- **JSON:** Full card data for QR codes

---

## Architecture

### Technology Stack

| Component | Technology |
|-----------|------------|
| Desktop App | Tauri 2.x (Rust + WebView) |
| P2P Networking | libp2p 0.54 |
| Encryption | Noise Protocol |
| Multiplexing | Yamux |
| Local Discovery | mDNS |
| Wallet | Pelagus (Quai Network) |
| Frontend | Vite + TypeScript |
| Identity | SBT on Quai zones |

### Network Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                      CINQ MESH NETWORK                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌──────┐         ┌──────┐         ┌──────┐                   │
│    │Node A│◄───────►│Node B│◄───────►│Node C│                   │
│    └──┬───┘         └──┬───┘         └──┬───┘                   │
│       │                │                │                       │
│       │    ┌──────┐    │                │                       │
│       └───►│Node D│◄───┘                │                       │
│            └──┬───┘                     │                       │
│               │         ┌──────┐        │                       │
│               └────────►│Node E│◄───────┘                       │
│                         └──────┘                                │
│                                                                 │
│   Every node connects to multiple peers for resilience          │
│   Recommended: min 3, target 8-15, max 25-50 peers              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Privacy Levels (Hop Routing)

Users select their privacy level via hop count:

### 0 Hops (Direct)
- **Cost:** Free
- **Latency:** Lowest (~0ms overhead)
- **Privacy:** None - destination sees your IP
- **Use case:** Speed-critical, trusted sites

### 1 Hop
- **Cost:** 1 $Qi per GB
- **Latency:** Low (+20-50ms)
- **Privacy:** Basic - destination sees relay IP
- **Use case:** General browsing, light privacy

### 3 Hops (Onion Routing)
- **Cost:** 3 $Qi per GB (1 per relay)
- **Latency:** Higher (+100-200ms)
- **Privacy:** Strong - each relay only knows prev/next hop
- **Use case:** Sensitive browsing, maximum anonymity

```
3-HOP ONION ROUTING:

┌────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌──────┐
│You │───►│Relay 1 │───►│Relay 2 │───►│Relay 3 │───►│Server│
└────┘    └────────┘    └────────┘    └────────┘    └──────┘
  │           │             │             │
  │    Peels layer 1  Peels layer 2  Peels layer 3
  │           │             │             │
  └── Encrypted with 3 keys (onion layers) ──────────┘
```

---

## Split Tunneling

Not all traffic needs the same privacy level. **Split tunneling** allows users to configure per-domain routing rules while maintaining a default privacy level for everything else.

### Use Cases

| Scenario | Bypass Rule | Why |
|----------|-------------|-----|
| Banking apps | `*.chase.com` → Direct (0H) | Requires IP-based location verification |
| Streaming | `*.netflix.com` → Direct | Geo-licensing, reduces bandwidth cost |
| Work VPN | `*.company.com` → Direct | Corporate firewall whitelisting |
| Local services | `*.local`, `192.168.*` → Direct | LAN devices, printers |
| General browsing | Default → 1H or 3H | Privacy protection |

### Configuration Modes

#### 1. Global Default + Bypass List
Most common setup - route everything through mesh, except specific domains:

```
DEFAULT: 3 Hops (maximum privacy)

BYPASS LIST (0 Hops / Direct):
├── *.bankofamerica.com      # Banking - location required
├── *.google.com/maps        # Maps - location services
├── *.uber.com               # Rideshare - GPS required
├── *.doordash.com           # Delivery - address verification
├── 192.168.*                # Local network
└── *.local                  # mDNS local devices
```

#### 2. Per-Domain Privacy Levels
Advanced users can specify exact hop count per domain:

```
DOMAIN RULES:
├── *.reddit.com       → 1 Hop   # Basic privacy, faster
├── *.twitter.com      → 3 Hops  # Maximum privacy
├── *.amazon.com       → 0 Hops  # Direct (bypass)
├── *.protonmail.com   → 5 Hops  # Ultra paranoid
└── *                  → 1 Hop   # Default fallback
```

### UI Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  ROUTING RULES                                        [+ Add]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Default:  [▼ 1 Hop ]                                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ DOMAIN              │ ROUTING        │ ACTION          │    │
│  ├─────────────────────┼────────────────┼─────────────────┤    │
│  │ *.chase.com         │ Direct (0H)    │ [Edit] [×]      │    │
│  │ *.netflix.com       │ Direct (0H)    │ [Edit] [×]      │    │
│  │ *.protonmail.com    │ 3 Hops         │ [Edit] [×]      │    │
│  │ 192.168.*           │ Direct (0H)    │ [Edit] [×]      │    │
│  └─────────────────────┴────────────────┴─────────────────┘    │
│                                                                 │
│  💡 Sites requiring location (banking, maps, delivery)          │
│     should use Direct (0H) to avoid blocks.                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Actions

For common scenarios, one-click presets:

| Preset | Description | Bypass Domains |
|--------|-------------|----------------|
| **Privacy First** | 3H default, minimal bypass | Local network only |
| **Balanced** | 1H default, common services bypass | Banking, streaming, maps |
| **Speed First** | 0H default, sensitive sites routed | Protonmail, Signal, etc. |
| **Work Mode** | 1H default, corporate bypass | `*.company.com`, VPN ranges |

### Implementation Notes

```
PROXY DECISION FLOW:

Browser Request → SOCKS5 Proxy (1080)
                        │
                        ▼
              ┌─────────────────┐
              │ Check domain    │
              │ against rules   │
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    Match: 0H     Match: 1H/3H    No Match
         │             │             │
         ▼             ▼             ▼
    Direct TCP    P2P Tunnel    Use Default
    (bypass)      (routed)      (1H or 3H)
```

### Privacy Considerations

- **Bypass list is local** - never transmitted to peers
- **Exit nodes don't see bypass traffic** - it goes direct
- **DNS leaks** - bypassed domains still resolve through mesh (optional)
- **Fingerprinting risk** - mixed routing patterns could be detectable
  - Mitigation: Encourage "Privacy First" preset for sensitive users

---

## Economics

### The Quai Principle

Just as Quai Network defines:
> **1 $Qi ≈ 8 billion hashes** (measurable, predictable, fair)

cinQ defines:
> **1 $Qi = 1 GB relayed** (measurable, predictable, fair)

### Rate Card

| Service | User Pays | Provider Gets | Foundation Gets |
|---------|-----------|---------------|-----------------|
| **Relay (1 GB)** | 1 $Qi | 0.9 $Qi (90%) | 0.1 $Qi (10%) |
| **Bootstrap (hole punch)** | 0.01 $Qi | 0.009 $Qi | 0.001 $Qi |
| **3-hop routing (1 GB)** | 3 $Qi | 2.7 $Qi total | 0.3 $Qi |
| **1-hop routing (1 GB)** | 1 $Qi | 0.9 $Qi | 0.1 $Qi |
| **0-hop (direct)** | Free | — | — |

### Revenue Split: 90/10

- **90% to Node Operators** - Incentivizes network growth
- **10% to Foundation** - Funds ongoing development

### Foundation 10% Funds

- cinQ Connect maintenance & updates
- cinQ Browser development
- cinQ Messages (E2E encrypted messaging)
- Security audits
- Network monitoring infrastructure
- Bug bounties
- Community grants
- Fallback bootstrap nodes

### User Scenarios

```
CASUAL USER (10 GB/month browsing, 2 GB relaying)
├── Spent:  10 Qi
├── Earned:  1.8 Qi (2 GB × 0.9)
└── Net:    -8.2 Qi/month

POWER USER (50 GB/month browsing, 60 GB relaying)
├── Spent:  50 Qi
├── Earned: 54 Qi
└── Net:    +4 Qi/month  ← PRIVACY IS FREE + PROFIT

NODE OPERATOR (5 GB browsing, 500 GB relaying, always-on)
├── Spent:   5 Qi
├── Earned: 450 Qi + bootstrap fees
└── Net:   +445 Qi/month  ← PASSIVE INCOME
```

**Key insight:** If you contribute more than you consume, your privacy is free.

### Agent Economics (Qora Swarm)

Agents are automated representatives of humans and their hardware. They don't accumulate wealth—they coordinate resource allocation using Qi as the coordination signal.

#### The Agent = The Human (Automated)

```
Human owns GPU rig
       ↓
Runs cinQ node → spawns "Provider Agent"
       ↓
Agent has wallet → receives Qi for work done
       ↓
Human withdraws to Quai whenever they want
```

The agent is the *interface* between hardware and the economic layer—automation, not autonomy.

#### Agent Types

| Agent Type | Role | Accumulates Qi? |
|------------|------|-----------------|
| **Consumer Agent** (Qora) | Orchestrates jobs, allocates budgets | No - pass-through only |
| **Provider Agent** | Represents hardware owner, accepts jobs | Yes - for the human |

#### Qora Treasury Flow

```
Human deposits 100 Qi into Qora Treasury
         ↓
Human requests: "Render this video"
         ↓
Qora splits treasury → creates UTXOs for:
  • Router Agent (1 Qi) - finds best GPU nodes
  • Compute Agent (80 Qi) - pays for GPU time
  • Delivery Agent (5 Qi) - handles result transfer
  • Reserve (14 Qi) - retries/overages
         ↓
Agents pay Provider Agents for actual work
         ↓
Unused Qi returns to treasury
```

#### What Agents Do With Qi

| Use Case | Description |
|----------|-------------|
| **Pay infrastructure** | GPU node wants 0.5 Qi/min, agent pays in real-time |
| **Bid for priority** | Scarce resource? Offer more to jump queue |
| **Retry on failure** | Node drops? Pay another from reserve |
| **Return surplus** | Job done cheap? Unused Qi flows back |

#### Why UTXO Is Perfect

Quai's UTXO model is ideal for agent micropayments:

1. **Parallel execution** - Multiple agents spend simultaneously (no nonce coordination)
2. **Atomic splits** - Qora splits 100 Qi into 5 agent UTXOs in one transaction
3. **Payment channels** - Settle off-chain, batch to chain (Lightning-style)
4. **No account state** - Each UTXO is independent, agents don't block each other
5. **Natural audit trail** - UTXO graph = who paid whom for what

#### The Full Circle

```
Consumer (Human)
     │
     ├── Deposits Qi → Qora Treasury
     │
     ▼
Qora (Orchestrator Agent)
     │
     ├── Allocates budget to task agents
     │
     ▼
Provider Agents (Hardware Owners)
     │
     ├── Do work → Receive Qi
     │
     ▼
Provider (Human)
     │
     └── Withdraws Qi → Converts to Quai
```

Agents are just "the human, but automated and always online."

---

## Node Roles

Every node provides BOTH services:

### 1. Relay Service (Bandwidth)
- Forward encrypted traffic for other users
- Earn 0.9 $Qi per GB relayed
- Cannot see content (encrypted)
- Only knows previous and next hop

### 2. Bootstrap Service (NAT Traversal)
- Help new nodes join the network
- Coordinate hole punching through NAT
- Earn 0.009 $Qi per successful connection
- Essential for decentralized network entry

```
BOOTSTRAP FLOW:

┌──────────┐                              ┌─────────────────┐
│ New Node │──────── OUTBOUND ───────────►│ Existing Node   │
│ (NAT'd)  │         (works!)             │ (Bootstrap)     │
└──────────┘                              └────────┬────────┘
                                                   │
     Bootstrap registers new node in DHT ◄─────────┘
     and coordinates hole punches to other peers
```

---

## Network Mechanics

### Current Implementation (Local)

- **mDNS Discovery** - Find peers on local network
- **Auto-connect** - Immediately dial discovered peers
- **Noise Encryption** - All connections encrypted
- **Yamux Multiplexing** - Multiple streams per connection

### Future Implementation (Global)

| Component | Purpose | libp2p Module |
|-----------|---------|---------------|
| Bootstrap Nodes | Entry points to network | Hardcoded multiaddrs |
| Kademlia DHT | Global peer discovery | `libp2p::kad` |
| AutoNAT | Detect NAT type | `libp2p::autonat` |
| Relay | Route through relay if direct fails | `libp2p::relay` |
| DCUTR | Hole punch for direct connection | `libp2p::dcutr` |

### Connection Flow

```
1. USER OPENS CINQ CONNECT
   └── Node starts on wallet connect

2. BOOTSTRAP SEQUENCE
   ├── Connect to known bootstrap peer (outbound works through NAT)
   ├── AutoNAT: "What's my public IP? Am I reachable?"
   ├── Register in DHT: "I'm online at this address"
   └── mDNS: Also discover local peers (fast, bonus)

3. NODE IS NOW "ONLINE"
   ├── Reachable via relay (guaranteed fallback)
   ├── Reachable via hole punch (usually works)
   └── Reachable directly (if no NAT, rare)

4. USER BROWSES (e.g., 3 hops selected)
   ├── Query DHT for available relays
   ├── Select 3 by geography/latency/reputation
   ├── Build circuit (hole punch or relay to each)
   └── Onion encrypt → send through circuit
```

---

## Escrow System

Users deposit $Qi to escrow before using the network:

```
PAYMENT FLOW:

1. USER DEPOSITS TO ESCROW (on-chain)
   └── Smart contract holds $Qi

2. USER BUILDS CIRCUIT & BROWSES
   └── Micropayment vouchers signed as data flows

3. RELAYS ACCUMULATE VOUCHERS
   └── Off-chain for speed, batched settlement

4. SETTLEMENT (on-chain, periodic)
   └── Relays submit vouchers to claim $Qi from escrow
```

### Escrow Rules

- Minimum deposit: 10 $Qi
- 1 $Qi in escrow = 1 GB available (at 1-hop)
- Low escrow warning at 2 $Qi remaining
- Connection terminates at 0 $Qi

---

## Future Roadmap

### Phase 1: cinQ Connect (Current)
- [x] P2P mesh foundation with libp2p
- [x] Tauri desktop app
- [x] Pelagus wallet integration (mock)
- [x] Hop selection UI (0H, 1H, 3H)
- [x] Bandwidth tracking
- [ ] Global DHT discovery
- [ ] NAT traversal (DCUTR)
- [ ] Actual relay protocol
- [ ] On-chain escrow contract

### Phase 2: cinQ Card 🎁
Pre-loaded gift cards for zero-friction onboarding:

```
┌─────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░                             ░░  │
│  ░░   cinQ CARD                 ░░  │
│  ░░   PRIVACY CARD              ░░  │
│  ░░                             ░░  │
│  ░░   50 $Qi                    ░░  │
│  ░░   ≈ 50 GB Private Browsing  ░░  │
│  ░░                             ░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                     │
│  Scratch to reveal:                 │
│  ████████████████████████████████   │
│                                     │
└─────────────────────────────────────┘
```

**Product Line:**

| Card | Qi Amount | GB Equivalent | Retail Price |
|------|-----------|---------------|--------------|
| Starter | 10 $Qi | ~10 GB | $1.99 |
| Standard | 50 $Qi | ~50 GB | $7.50 |
| Power | 200 $Qi | ~200 GB | $25.00 |
| Gift Box | 500 $Qi | ~500 GB | $60.00 |

#### Card Creation (Foundation Side)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CARD CREATION PROCESS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Generate new Quai wallet                                    │
│     └── Creates: 12-word seed phrase + wallet address           │
│                                                                 │
│  2. Fund the wallet                                             │
│     └── Foundation sends 50 $Qi to that address                 │
│                                                                 │
│  3. Print card at secure facility                               │
│     └── Seed phrase hidden under scratch-off                    │
│     └── Wallet address visible (for balance verification)       │
│                                                                 │
│  4. Foundation deletes seed after printing (trustless)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### How Seed Phrase Works

```
SEED PHRASE (BIP-39 Standard)
    │
    ▼
"apple banana cherry dog elephant fox grape house igloo jade kite lemon"
    │
    ├── Deterministic derivation (BIP-32/44)
    │
    ▼
PRIVATE KEY ──────► PUBLIC KEY ──────► WALLET ADDRESS
                                       0x7a3B...9f2E
                                            │
                                            ▼
                                       Balance: 50 $Qi
                                       (pre-funded by Foundation)
```

**The seed phrase IS the wallet.** Whoever has it, owns the funds. Simple and trustless.

#### Redemption UX Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REDEMPTION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User scratches card → reveals 12-word seed phrase           │
│                                                                 │
│  2. Opens cinQ Connect → Landing page                           │
│                                                                 │
│  3. Clicks "Redeem cinQ Card" button                            │
│                                                                 │
│  4. Enters seed phrase in modal:                                │
│     ┌─────────────────────────────────────────────────┐         │
│     │  Enter your cinQ Card seed phrase:              │         │
│     │  ┌─────────────────────────────────────────┐    │         │
│     │  │ apple banana cherry dog elephant fox    │    │         │
│     │  │ grape house igloo jade kite lemon       │    │         │
│     │  └─────────────────────────────────────────┘    │         │
│     │                                                 │         │
│     │  ⚠ Never share your seed phrase with anyone    │         │
│     │                                                 │         │
│     │                     [Import Wallet]             │         │
│     └─────────────────────────────────────────────────┘         │
│                                                                 │
│  5. App derives wallet from seed → checks balance               │
│     └── "Found 50 $Qi! 🎉"                                      │
│                                                                 │
│  6. Wallet imported → escrow auto-funded → node starts          │
│     └── User is browsing privately in seconds                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Alternative: One-Time Redemption Codes

For better security and UX, cards can use redemption codes instead:

```
CARD HAS:  CINQ-7X4K-M2PQ-9RVW

USER FLOW:
1. Enter code in app
2. App calls Foundation API: "Redeem CINQ-7X4K-M2PQ-9RVW"
3. API verifies code (one-time use, marks as redeemed)
4. API creates NEW wallet for user, returns seed to app
5. Sends 50 $Qi from treasury to user's new wallet
6. User now owns wallet, Foundation cannot access

BENEFITS:
✓ Shorter code (16 chars vs 12 words - easier to type)
✓ One-time use (cannot be redeemed twice)
✓ User gets fresh wallet (not pre-generated)
✓ Foundation can track redemption stats
✓ Can invalidate stolen/unredeemed cards
```

#### Security Considerations

| Risk | Mitigation |
|------|------------|
| Card stolen before scratch | Seed hidden under scratch-off coating |
| Someone photographs seed | User advised to transfer to new wallet after import |
| Foundation could drain wallets | Foundation deletes seeds after printing (auditable) |
| Seed printed insecurely | Use secure printing facility (like gift card manufacturers) |
| Code redemption API compromised | Rate limiting, anomaly detection, card batch tracking |

**Strategic Value:**
- Retail distribution channel (gas stations, Best Buy, Amazon)
- Onboards non-crypto users to Quai ecosystem
- "Privacy as a gift" - unique market positioning
- Anonymous if purchased with cash
- Bootstrap network growth with pre-funded users

### Phase 3: cinQ Browser
- Full browser with built-in cinQ routing
- No separate Connect app needed
- Automatic hop selection based on site sensitivity
- Bookmark privacy levels per site

### Phase 4: cinQ Messages
- E2E encrypted messaging over cinQ mesh
- No phone number required
- Messages route through network (paid relays)
- Disappearing messages, group chats

---

## UI/UX Guidelines

### Branding
- **Primary Color:** #E85D04 (Quai orange-red)
- **Background:** #0D0D0D (near black)
- **Cards:** #1A1A1A (dark grey)
- **Text:** #FFFFFF / #888888
- **Logo:** cin**Q** (Q in accent color)

### App Flow
```
LANDING PAGE
    │
    ├── [Connect to Pelagus] ──► MAIN DASHBOARD
    │                                │
    └── [Redeem cinQ Card] ──────────┘ (future)
                                     │
                              ┌──────┴──────┐
                              │             │
                         System        DePIN
                         Monitor       Network
                              │             │
                         Escrow        Wallet
                         Balance       Balance
```

### Key Interactions
- Node auto-starts on wallet connect
- 0H selected by default (user opts into privacy)
- Real-time bandwidth and peer stats
- Clear escrow ↔ GB relationship

---

## Comparable Projects

| Project | Focus | Peer Limit | Pricing |
|---------|-------|------------|---------|
| Mysterium | VPN | 10-25 | Market |
| Orchid | VPN | 5-15 | Market |
| Sentinel | VPN | 8-20 | Fixed per GB |
| NYM | Mixnet | 3-5 | Fixed |
| IPFS | Storage | 600-900 | Free |
| **cinQ** | **Privacy mesh** | **8-15 target** | **Fixed (1 Qi/GB)** |

cinQ differentiates with:
- Fixed, fair pricing (Quai principle)
- Dual revenue (relay + bootstrap)
- Gift card onboarding
- Quai ecosystem integration

---

## Technical Debt & TODOs

### Backend (Rust)
- [ ] Add Kademlia DHT for global discovery
- [ ] Implement AutoNAT for NAT detection
- [ ] Add relay protocol with payment tracking
- [ ] DCUTR hole punching
- [ ] Circuit builder for multi-hop
- [ ] Peer reputation system
- [ ] Rate limiting and abuse prevention
- [ ] Split tunneling domain matcher in proxy
- [ ] Per-domain hop selection logic

### Frontend
- [ ] Actual Pelagus wallet integration
- [ ] Gift card redemption flow
- [ ] Earnings breakdown (relay vs bootstrap)
- [ ] Network health indicators
- [ ] Settings panel
- [ ] Split tunneling rules UI
- [ ] Quick routing presets (Privacy First, Balanced, etc.)

### Smart Contracts
- [ ] Escrow contract on Quai
- [ ] Payment channel for micropayments
- [ ] Foundation fee collection
- [ ] Gift card minting/redemption

---

## References

- [Quai Network](https://qu.ai)
- [Pelagus Wallet](https://pelaguswallet.io)
- [libp2p](https://libp2p.io)
- [Tauri](https://tauri.app)
- [SOAP - Quai's Subsidy Open Market Acquisition Protocol](https://qu.ai/docs)

---

*This document is a living spec. Update as the project evolves.*
