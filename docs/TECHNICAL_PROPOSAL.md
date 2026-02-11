# Technical Proposal: Project cinQ

**The First Energy-Backed DePIN Gateway for Quai Network**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Decentralized Host](#2-the-decentralized-host)
3. [Core Technology Stack](#3-core-technology-stack)
4. [The Qora Agent Swarm & Fluid Settlement](#4-the-qora-agent-swarm--fluid-settlement)
5. [The cinQ Marketplace & Edge Compute](#5-the-cinq-marketplace--edge-compute)
6. [DePIN Infrastructure & Hardware Migration](#6-depin-infrastructure--hardware-migration)
7. [Dynamic Resource Allocation](#7-dynamic-resource-allocation)
8. [The Mesh Map & Urban Equity](#8-the-mesh-map--urban-equity)
9. [The $CINQ Economy: User Incentive & Identity](#9-the-cinq-economy-user-incentive--identity)
10. [Swarm Resilience: Adversarial Defense](#10-swarm-resilience-adversarial-defense)
11. [Development Roadmap](#11-development-roadmap)
12. [Conclusion](#12-conclusion)

---

## 1. Executive Summary

cinQ is a decentralized Infrastructure-as-a-Service (IaaS) plugin for Quai Stratum X nodes. Unlike traditional DePIN models that rely on volatile native tokens, cinQ utilizes Qi, Quai's energy-backed currency. By linking Qi directly to FLOPs (Floating Point Operations), cinQ creates a marketplace where hardware providers are compensated in a currency that reflects the real-world cost of compute. This architecture removes the need for marketing-driven hype, replacing it with an autonomous, energy-anchored economy managed by AI agents.

---

## 2. The Decentralized Host

**Beyond Blockchain:** While Quai handles the global ledger and smart contract execution, the cinQ mesh provides the muscle. By hosting dApp frontends, databases, and AI models on the mesh, we eliminate the "AWS Kill-Switch."

**Hybrid Execution:** cinQ creates a seamless dual-layer economy. Qi covers the cost of the physical infrastructure on the mesh, while transactions within the apps are settled via smart contracts on the Quai EVM ledger.

**Resilience:** If one hosting node goes down, the Navigator Agent automatically re-routes the dApp frontend to another healthy node, ensuring the "front door" to DeFi remains open.

**Performance:** Unlike Flux, which can be slow for heavy tasks, cinQ's 10/90 deposit model ensures that nodes are high-performance and "audit-ready" for enterprise-grade applications and high-frequency dApp interactions.

---

## 3. Core Technology Stack

| Component | Technology | Intent & Implementation |
|-----------|------------|------------------------|
| **Agent Transactions** | qi-agent-sdk | Autonomous Settlement: Enables agents to sign and broadcast native UTXO transactions on the Qi ledger. |
| **Workload Isolation** | Docker / Wasm | Secure Execution: Sandbox environment that allows marketplace apps and HPC tasks to run safely on "underutilized" host hardware without security risks. |
| **Resource Discovery** | Kademlia DHT | Marketplace Indexing: Decentralized "search engine" that allows the Qora Swarm to instantly locate specific hardware (GPUs/RAM) across the global mesh. |
| **Logic Layer** | Rust | Performance & Safety: Handles encrypted binary streams and high-speed compute tasks. |
| **App Shell** | Tauri (v2) | Multi-Platform: Single codebase for Windows, macOS, Linux, iOS, and Android. |
| **Storage Engine** | Reed-Solomon | Self-Healing: Shards files into parity pieces so data survives node churn. |
| **Networking** | libp2p / Arti | Privacy & Routing: Arti for Stealth Mode and libp2p for high-speed P2P routing. |
| **Data Sync** | CRDTs | Serverless Collaboration: Conflict-free editing for decentralized workspaces. |

---

## 4. The Qora Agent Swarm & Fluid Settlement

Qora serves as the Master Conductor and User Interface, orchestrating the entire swarm via the qi-agent-sdk. Unlike traditional "silent" automation, Qora maintains a direct, real-time communication link with the user, providing a window into the mesh's operations:

### The Communication Hub (Qora)
Qora translates complex swarm telemetry into human-readable updates. She can proactively reach out to the user to request clarification on intent, provide status reports on high-stakes AI workloads, or alert the user if a "hacker node" attempt was successfully thwarted.

### Mesh Agent (The Navigator)
Directed by Qora to act as the traffic controller, consuming FLOPs to calculate P2P routes and ensuring data is moved securely. It is tasked with identifying and unlocking underutilized computing power across the mesh.

### Settlement Agent (The Treasurer)
Eliminates the need for complex escrow contracts. Under Qora's instruction, it audits the user's native Qi balance in real-time and orchestrates direct, programmatic transfers to providers as services are rendered.

### Sentinel Agent (The Auditor)
The swarm's "eyes" on data integrity. Its mathematical verification serves as the "Proof of Service" required to trigger the Settlement Agent's direct payment.

### Identity Agent (The Guardian)
Manages Soulbound $CINQ and its temporal decay, recording human contribution based on verified native Qi expenditure.

---

## 5. The cinQ Marketplace & Edge Compute

**Unlocking Underutilized Resources:** cinQ is designed to harvest idle compute cycles from gaming PCs, parked electric vehicles, and home servers. By identifying these "pockets" of wasted silicon, the Qora Swarm aggregates them into high-performance clusters.

**The Marketplace:** A centralized dashboard within the app to access and configure apps. Users can deploy game servers, business applications, or dedicated nodes for DeFi with a single click.

**HPC On-Demand:** Through the marketplace, developers can bid on the mesh's collective underutilized power for high-performance computing (HPC) tasks like AI training or 3D rendering, paying only for the FLOPs consumed.

**Node for DeFi:** Specialized templates allow users to launch high-availability nodes specifically tuned for DeFi protocols, ensuring 100% uptime for liquidators or market makers.

---

## 6. DePIN Infrastructure & Hardware Migration

cinQ provides a stable, zero-collateral environment for high-tier hardware providers:

**Desktop/Server Nodes:** The backbone for high-capacity storage and heavy compute.

**Mobile Nodes:** Light clients and P2P bridges for last-mile connectivity.

**Economic Stability:** By paying in Qi, cinQ ensures provider revenue scales with energy costs, making it a sustainable alternative to speculative DePIN models.

### Hardware Migration Paths

**Compute Tier (Flux/Dabba Pro):** cinQ can utilize the enterprise-grade hardware currently powering Flux nodes or Dabba Pro routers. By flashing these units with the qi-agent-sdk, providers move from earning project-specific utility tokens to earning Native Qi, anchored by real-world energy costs.

**Location & Security Tier (Wingbits/Helium):** The Gateway supports specialized hardware like high-gain 1090MHz and 915MHz antennas. These units are repurposed as Long-Range Sentinel Links, providing the "heartbeat" and geographic verification needed to secure a hex without requiring high-bandwidth fiber.

**The "Vampire Migration" Tool:** The Gateway includes a one-click onboarding path for "Refugee Hardware." It detects the hardware's CPU/RAM/Antenna capabilities and automatically assigns it a role in the Qora Swarm, allowing users to reclaim the value of their previous DePIN investments.

---

## 7. Dynamic Resource Allocation

**Unlocking Underutilized Resources:** cinQ harvests idle compute cycles from individual gaming PCs, home workstations, and parked electric vehicles. Unlike legacy DePIN models that force hardware into rigid, inefficient tiers, cinQ utilizes Dynamic Resource Allocation:

**Automatic Benchmarking:** The Swarm auto-detects the specific CPU, GPU, and RAM capabilities of every device, creating a granular "Capability Profile."

**Liquid Tagging:** The Navigator uses real-time tags to match workloads with the exact hardware required, ensuring that even non-standard or "mid-tier" PCs are fully monetized.

**Fluid Scalability:** Users can contribute as much or as little power as they choose; the Swarm scales the workload to the device's current idle capacity, settling the payment instantly in Qi.

---

## 8. The Mesh Map & Urban Equity

This layer gamifies growth while enforcing algorithmic fairness through the Braided Routing Protocol:

### The Mesh Map & Visual Rewards
- Uses H3 hexagonal integration to visualize density and network health.
- Issues "Coverage Bounties" in underserved (Red/Amber) hexes, allowing providers to earn higher Qi percentages for filling gaps.
- Displays performance heatmaps (FLOPs/Latency) so providers can optimize their node placement.

### Urban Equity (The "Braided Routing" Protocol)

**Path Diversity:** The Navigator Agent is prohibited from routing 100% of traffic through a single "Super-Node" (like a big antenna) in a city. Traffic is braided across multiple local nodes to prevent monopolies.

**Saturation-Aware Rewards:** In high-density cities, rewards follow a curve of diminishing returns. This forces "Whales" with high-gain antennas to push their coverage into new, unlit hexes rather than stacking gear where it's already saturated.

**Task Specialization:** Small home nodes are prioritized for high-value "Identity" and "Auditing" tasks, while big antennas handle the "Bulk Data," ensuring everyone in the hex stays profitable.

---

## 9. The $CINQ Economy: User Incentive & Identity

The $CINQ economy is designed to reward long-term participation and high-integrity hardware provision through a dual-layered system of liquidity and reputation.

### Token Mechanics

**1:1 Minting:** Users earn 1 $CINQ for every 1 Qi spent on network services. This creates a direct correlation between network utility and user standing.

**100:1 Redemption:** 100 $CINQ can be redeemed for 1 Qi (a 1% Rebate). This provides a tangible "floor value" for reputation without turning it into a speculative tradable asset.

### The cinQ Soulbound NFT (The Identity Pass)

**Non-Transferable Credentials:** Upon joining the mesh, the Identity Agent (The Guardian) mints a unique Soulbound NFT to the user's wallet. This NFT is non-transferable and serves as the user's permanent "Digital Legacy" on the Quai network.

**Dynamic Metadata:** The NFT's metadata (visual traits, rank, and tier) evolves in real-time to reflect the user's total $CINQ earned and their historical uptime.

**Privileged Access:** Higher-tier NFTs unlock "Priority Routing" from the Navigator Agent and allow hardware providers to bid on high-value "Sentinel" and "Conductor" contracts within the Qora swarm.

### Sustainability

**Sustainability:** Redemption reserves are funded by a consistent 10% network fee on all provider transactions, ensuring the Foundation can always back the 1% rebate.

**Utility:** $CINQ is a non-tradable reputation score. It represents a user's "sweat equity" in the network, making it a Sybil-resistant metric for governance and ecosystem rewards.

---

## 10. Swarm Resilience: Adversarial Defense

The cinQ mesh utilizes the native properties of the Quai network to defend against "Swarm" and Sybil attacks (coordinated attempts to fake work or hijack a hex).

**PoEM Consensus Integration:** By leveraging Quai's Proof-of-Entropy-Minima (PoEM), the mesh achieves instantaneous, objective finality. This prevents attackers from using "shadow swarms" to create forks or disrupt the local consensus of the mesh.

**Economic Friction (The 10/90 Bond):** Every node must maintain a security deposit in native Qi. To launch a swarm attack with 1,000 nodes, an adversary must put up 1,000 deposits. This creates a massive financial barrier where the cost of the attack far exceeds any potential exploit.

**Automated Slashing:** If the Sentinel Agent detects "Swarm Behavior"—such as multiple nodes sharing a single IP, faking latency heartbeats, or failing to verify encrypted packages—the associated Qi deposits are automatically slashed.

**Temporal Reputation (Seasoning):** New nodes enter a "Probationary State" where they must perform low-stakes tasks to build an Identity Score. This prevents "Flash Swarms" from immediately gaining control over sensitive network routing or high-value settlement tasks.

---

## 11. Development Roadmap

### Phase 1: The "Genesis Node" (The Foundation)

**Tech Stack:** Rust (Back-end), libp2p (Networking), qi-agent-sdk (Settlement).

**Focus:** Core connectivity. Building the "Invisible Mesh."

**Prototype Goal:** A CLI tool that allows two computers to find each other over the internet without a central server and settle a tiny amount of Qi for a 1KB data transfer.

**The "WiFi" Angle:** Implementing a basic P2P Proxy. If Node A has internet and Node B doesn't, Node B can "buy" bandwidth from Node A using Qi.

#### Phase 1 Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Rust back-end | ✅ | Core logic layer complete |
| libp2p networking | ✅ | Kademlia DHT, mDNS, Noise, Yamux |
| P2P discovery (no central server) | ✅ | Working across subnets |
| NAT traversal | ✅ | AutoNAT, DCUTR, UPnP, Relay |
| Data transfer protocol | ✅ | `/cinq/transfer/1.0.0` |
| Basic SOCKS5 proxy | ✅ | Foundation for "buy bandwidth" |
| qi-agent-sdk integration | 🔄 | In progress |
| Qi wallet integration | ⏳ | Next step |
| Metered transfer + settlement | ⏳ | Pending |

---

### Phase 2: The "Gateway Shell" (The Prototype App)

**Tech Stack:** Tauri v2 (App Wrapper), React/TypeScript (UI), Rust (Tauri Commands).

**Focus:** Wrapping the Rust engine in a beautiful, user-friendly interface.

**Prototype Goal:** The first version of the cinQ Desktop App. Users can see their node status, their Qi balance, and a "Nearby Nodes" map.

**Messaging Alpha:** High-speed, E2EE text messaging that doesn't go through a server, sharded via the Reed-Solomon logic.

---

### Phase 3: The "Streaming & Edge" Layer

**Tech Stack:** WebRTC (for Video/Voice), Arti (for Tor-style privacy), V2X Protocols.

**Focus:** Moving large amounts of data.

**Prototype Goal:** Encrypted Voice and Video calls where the "billing" happens per minute in real-time via the Treasurer Agent.

**The "Antenna" Integration:** Supporting external RF hardware (Wingbits/Helium) to broadcast the mesh signal further, effectively "lighting up" the local hex.

---

### Phase 4: The "Sovereign OS" (Total Decentralization)

**Tech Stack:** CRDTs (for Docs), Qora (Advanced Orchestration).

**Focus:** Replacing the entire Google/AWS suite.

**Prototype Goal:** A collaborative "Cloud Drive" and "Doc Editor" where the files are stored on the mesh and the AI agents (Qora) manage the permissions and syncing.

---

## 12. Conclusion

Project cinQ represents the evolution of Decentralized Physical Infrastructure. By anchoring the Qora Swarm to the qi-agent-sdk, we move away from the "hype-and-dump" cycles of legacy DePIN projects and toward a transparent, compute-driven economy.

cinQ does not just build a network; it harvests the world's idle silicon—from gaming rigs to electric vehicles—and converts it into a productive global asset. By turning Qi into the literal "electricity" of the digital workspace and $CINQ into the permanent record of a user's legacy, cinQ provides the first viable, long-term economic model for the decentralized world.

**We are not just building a gateway; we are building the foundation for a truly sovereign internet, powered by Quai.**

---

## References

- [qi-agent-sdk](https://github.com/0xnovabyte/qi-agent-sdk) - TypeScript SDK for Qi transactions
- [Quai Network](https://qu.ai/) - The underlying blockchain
- [libp2p](https://libp2p.io/) - P2P networking library
- [Tauri](https://tauri.app/) - Desktop app framework

---

*Last Updated: February 2026*
