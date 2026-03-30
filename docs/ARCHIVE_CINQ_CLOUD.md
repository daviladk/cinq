# cinQ Cloud — Decentralized Workspace for Entropic

> **Vision:** A familiar Google Workspace experience, but decentralized on Quai Network.  
> **Role:** Extension layer for Entropic — provides identity, storage, messaging, and payments.

---

## The Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENTROPIC                                 │
│            Claude AI in sandboxed OpenClaw runtime              │
│     (Quai team handles compute/AI models on idle hardware)      │
└─────────────────────────┬───────────────────────────────────────┘
                          │ MCP / Extension API
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       cinQ CLOUD                                │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ │
│  │ cinQ ID  │ │cinQ Mail │ │cinQ Chat │ │cinQ Drive│ │cinQ Pay│ │
│  │ identity │ │  email   │ │messaging │ │ storage  │ │  Qi   │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬───┘ │
│       └────────────┴────────────┴────────────┴───────────┘     │
│                         libp2p mesh                             │
│                    (P2P, encrypted, no servers)                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      QUAI NETWORK                               │
│              Qi payments • Pelagus wallet • Settlement          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Services

### 1. cinQ ID (Identity)
**Like:** Google Account  
**Status:** ✅ Built (`UserIdRegistry`)

Your decentralized identity across all cinQ services.

- **Chat ID**: Human-readable name (e.g., `@alice`)
- **Peer ID**: Cryptographic identity from libp2p keypair
- **Quai Address**: For payments (linked from Pelagus wallet)
- **Avatar/Profile**: Optional metadata

```
cinQ ID: @alice
Peer ID: 12D3KooW...
Quai: 0x1234...
```

**Key feature:** One identity, works everywhere. No separate logins.

---

### 2. cinQ Mail (Email)
**Like:** Gmail  
**Status:** 🆕 To build

Asynchronous, formal messaging with threading and attachments.

**Familiar UX:**
- Inbox / Sent / Drafts / Archive / Trash
- Subject lines and threaded conversations
- Rich text formatting
- Attachments (via cinQ Drive)
- Search across all mail

**Address format:**
```
alice@cinq.quai      # Human-readable
alice@12D3KooW...    # Peer ID fallback
```

**How it differs from centralized email:**
- No SMTP servers — messages route through libp2p mesh
- End-to-end encrypted by default
- Stored locally (with optional P2P backup)
- No spam (sender must pay micro-Qi or be in contacts)

**Anti-spam model:**
- Messages from contacts: Free
- Messages from unknowns: Require micro-Qi deposit (refunded if you reply)
- Flagged as spam: Sender loses deposit

---

### 3. cinQ Chat (Messaging)
**Like:** Google Chat / Slack / Discord  
**Status:** ✅ Built (`ChatManager`)

Real-time, casual messaging with presence.

**Features:**
- 1:1 direct messages
- Group conversations
- Online/offline presence
- Typing indicators
- Read receipts
- Message reactions

**Key difference from Mail:**
| cinQ Mail | cinQ Chat |
|-----------|-----------|
| Async, formal | Real-time, casual |
| Subject lines | No subjects |
| Threading | Linear flow |
| For: important comms | For: quick questions |

---

### 4. cinQ Drive (Storage)
**Like:** Google Drive  
**Status:** ✅ Partial (`StorageWorker` + file transfer)

Decentralized file storage with sharing.

**Features:**
- Upload/download files
- Folder organization
- Share links (P2P, time-limited)
- Version history
- Sync across devices

**Storage tiers:**
1. **Local**: On your device (free)
2. **Mesh**: Replicated to trusted peers (costs Qi)
3. **Pinned**: Guaranteed availability via storage providers (costs more Qi)

**Integration:**
- Attach files in Mail and Chat
- Entropic's Claude can read/write to Drive
- Collaborative editing (future)

---

### 5. cinQ Pay (Payments)
**Like:** Google Pay (but for compute/services)  
**Status:** ✅ Built (`PaymentWorker` + `UsageTracker`)

Qi-based metering for all services.

**What costs Qi:**
- Sending mail to non-contacts (anti-spam)
- Mesh storage (per GB/month)
- Pinned storage (per GB/month)
- Bandwidth for large transfers
- Premium features

**What's free:**
- Chat with contacts
- Local storage
- Receiving anything

**Settlement:**
- Real-time tracking in cinQ
- Periodic settlement to Quai via Pelagus
- No private keys in cinQ (wallet handles signing)

---

## Entropic Integration

### MCP Server Approach

cinQ exposes an MCP (Model Context Protocol) server that Entropic/OpenClaw can call:

```typescript
// Entropic's Claude can call these tools:
{
  "tools": [
    // Identity
    { "name": "cinq_id_whoami", "description": "Get current user identity" },
    { "name": "cinq_id_lookup", "description": "Look up a user by Chat ID" },
    
    // Mail
    { "name": "cinq_mail_send", "description": "Send an email" },
    { "name": "cinq_mail_inbox", "description": "List inbox messages" },
    { "name": "cinq_mail_read", "description": "Read a specific email" },
    { "name": "cinq_mail_search", "description": "Search emails" },
    
    // Chat
    { "name": "cinq_chat_send", "description": "Send a chat message" },
    { "name": "cinq_chat_history", "description": "Get conversation history" },
    { "name": "cinq_chat_contacts", "description": "List contacts" },
    
    // Drive
    { "name": "cinq_drive_list", "description": "List files in a folder" },
    { "name": "cinq_drive_read", "description": "Read a file" },
    { "name": "cinq_drive_write", "description": "Write/upload a file" },
    { "name": "cinq_drive_share", "description": "Generate share link" },
    
    // Pay
    { "name": "cinq_pay_balance", "description": "Check Qi balance" },
    { "name": "cinq_pay_usage", "description": "View usage breakdown" }
  ]
}
```

### Example Flow

User to Entropic: *"Send alice the quarterly report and email the team about it"*

```
1. Claude reads report from cinQ Drive
2. Claude shares report link via cinQ Drive
3. Claude sends cinQ Mail to team@cinq.quai with link
4. Claude confirms in cinQ Chat: "Sent! ✓"
```

---

## Architecture Decisions

### Why Extension, Not Fork?

1. **Quai team owns compute** — They're building AI model hosting on idle hardware
2. **We own data layer** — Storage, messaging, identity
3. **Clean separation** — Entropic doesn't need to know about P2P
4. **Upgradeable** — Can improve cinQ without touching Entropic

### Why Email + Chat (not just one)?

Users expect both:
- **Email** for: Job applications, official requests, receipts, newsletters
- **Chat** for: Quick questions, casual convos, team coordination

Trying to merge them always fails (see: Google's many chat apps).

### Why Qi for Anti-Spam?

- **Proof of stake**: Sending costs something → spammers pay
- **Aligned incentives**: Good actors get refunds, bad actors lose Qi
- **No CAPTCHAs**: Economic barrier > annoyance barrier

---

## Implementation Phases

### Phase 1: Core Services (Current)
- [x] cinQ ID (UserIdRegistry)
- [x] cinQ Chat (ChatManager)
- [x] cinQ Drive basics (StorageWorker)
- [x] cinQ Pay tracking (UsageTracker)

### Phase 2: Mail + MCP
- [ ] cinQ Mail service
- [ ] MCP server for Entropic
- [ ] Mail UI in cinQ app
- [ ] Anti-spam deposit system

### Phase 3: Polish
- [ ] Mail search (full-text)
- [ ] Drive sync daemon
- [ ] Collaborative editing
- [ ] Mobile companion app

### Phase 4: Network Effects
- [ ] cinQ directory (opt-in public profiles)
- [ ] Organization accounts
- [ ] Shared drives
- [ ] Calendar? (maybe)

---

## File Structure (Updated)

```
cinq/
├── src-tauri/src/
│   ├── main.rs              # Tauri commands
│   ├── lib.rs               # Module exports
│   │
│   ├── cloud/               # 🆕 cinQ Cloud services
│   │   ├── mod.rs           # Re-exports
│   │   ├── id.rs            # Identity service (wraps UserIdRegistry)
│   │   ├── mail.rs          # Email service
│   │   ├── chat.rs          # Chat service (wraps ChatManager)
│   │   ├── drive.rs         # Storage service (wraps StorageWorker)
│   │   └── pay.rs           # Payment service (wraps UsageTracker)
│   │
│   ├── mcp/                 # 🆕 MCP server for Entropic
│   │   ├── mod.rs           # MCP protocol handler
│   │   ├── server.rs        # HTTP/WebSocket server
│   │   └── tools.rs         # Tool definitions
│   │
│   ├── grid/                # P2P networking (existing)
│   ├── qora/                # Local AI agent (existing)
│   └── swarm/               # Worker agents (existing)
```

---

## Open Questions

1. **Mail address format**: `alice@cinq.quai` or `alice.cinq` or something else?
2. **Interop with real email?**: Bridge to SMTP? Or fully separate?
3. **Group mail**: Mailing lists? Or just use Chat groups?
4. **Encryption**: Always E2E? Or optional for search?

---

## Summary

cinQ Cloud = **Google Workspace, but decentralized**

- **cinQ ID**: Your identity (like Google Account)
- **cinQ Mail**: Async email (like Gmail)
- **cinQ Chat**: Real-time messaging (like Google Chat)
- **cinQ Drive**: File storage (like Google Drive)
- **cinQ Pay**: Qi-based payments (like Google Pay for services)

Entropic handles AI. cinQ handles data. Quai handles money.
