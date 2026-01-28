// Cinq Chat - Encrypted peer-to-peer messaging
// Local-first: messages stored on device, optional mesh backup

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Mutex as StdMutex;
use serde::{Deserialize, Serialize};
use rusqlite::{Connection, params};
use uuid::Uuid;

/// A chat contact (peer we can message)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    /// Peer ID (libp2p identity)
    pub peer_id: String,
    /// Display name (user-chosen)
    pub display_name: String,
    /// When we first connected
    pub added_at: u64,
    /// Last seen online timestamp
    pub last_seen: Option<u64>,
    /// Contact's public key for encryption (base64)
    pub public_key: Option<String>,
    /// Whether currently online
    #[serde(skip)]
    pub is_online: bool,
}

/// A chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    /// Unique message ID
    pub id: String,
    /// Conversation this belongs to
    pub conversation_id: String,
    /// Sender peer ID (our ID if outgoing)
    pub sender_id: String,
    /// Message content (decrypted)
    pub content: String,
    /// Unix timestamp (millis)
    pub timestamp: u64,
    /// Whether we sent this
    pub is_outgoing: bool,
    /// Delivery status
    pub status: MessageStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MessageStatus {
    /// Message is queued locally
    Pending,
    /// Message sent to peer (or mailbox)
    Sent,
    /// Message delivered to recipient
    Delivered,
    /// Message read by recipient
    Read,
    /// Failed to send
    Failed,
}

impl MessageStatus {
    fn to_str(&self) -> &str {
        match self {
            MessageStatus::Pending => "pending",
            MessageStatus::Sent => "sent",
            MessageStatus::Delivered => "delivered",
            MessageStatus::Read => "read",
            MessageStatus::Failed => "failed",
        }
    }
    
    fn from_str(s: &str) -> Self {
        match s {
            "pending" => MessageStatus::Pending,
            "sent" => MessageStatus::Sent,
            "delivered" => MessageStatus::Delivered,
            "read" => MessageStatus::Read,
            "failed" => MessageStatus::Failed,
            _ => MessageStatus::Pending,
        }
    }
}

/// A conversation (chat thread with a peer)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    /// Unique conversation ID
    pub id: String,
    /// Peer ID we're chatting with
    pub peer_id: String,
    /// Display name for this conversation
    pub display_name: String,
    /// Last message preview
    pub last_message: Option<String>,
    /// Last message timestamp
    pub last_message_at: Option<u64>,
    /// Unread message count
    pub unread_count: u32,
}

/// Thread-safe chat manager using std::sync::Mutex
/// SQLite Connection is not Send, so we wrap it in std::sync::Mutex
/// and use blocking operations (fine for local DB)
pub struct ChatManager {
    db: Arc<StdMutex<Connection>>,
    local_peer_id: String,
    online_peers: Arc<StdMutex<HashMap<String, bool>>>,
}

// Manually implement Send + Sync since we're using std::sync::Mutex
// which is Send + Sync when T is Send
unsafe impl Send for ChatManager {}
unsafe impl Sync for ChatManager {}

impl ChatManager {
    /// Create a new chat manager
    pub fn new(data_dir: &PathBuf, local_peer_id: &str) -> Result<Self, String> {
        // Ensure directory exists
        std::fs::create_dir_all(data_dir)
            .map_err(|e| format!("Failed to create data dir: {}", e))?;
        
        let db_path = data_dir.join("chat.db");
        let db = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open chat database: {}", e))?;
        
        let manager = Self {
            db: Arc::new(StdMutex::new(db)),
            local_peer_id: local_peer_id.to_string(),
            online_peers: Arc::new(StdMutex::new(HashMap::new())),
        };
        
        manager.init_schema()?;
        Ok(manager)
    }
    
    /// Initialize database schema
    fn init_schema(&self) -> Result<(), String> {
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        db.execute_batch(r#"
            -- Contacts table
            CREATE TABLE IF NOT EXISTS contacts (
                peer_id TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                added_at INTEGER NOT NULL,
                last_seen INTEGER,
                public_key TEXT
            );
            
            -- Conversations table
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                peer_id TEXT NOT NULL UNIQUE,
                display_name TEXT NOT NULL,
                last_message TEXT,
                last_message_at INTEGER,
                unread_count INTEGER DEFAULT 0
            );
            
            -- Messages table
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                sender_id TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                is_outgoing INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            );
            
            -- Index for fast message lookup
            CREATE INDEX IF NOT EXISTS idx_messages_conversation 
                ON messages(conversation_id, timestamp DESC);
        "#).map_err(|e| format!("Failed to init schema: {}", e))?;
        
        Ok(())
    }
    
    /// Get local peer ID
    pub fn local_peer_id(&self) -> &str {
        &self.local_peer_id
    }
    
    /// Add or update a contact
    pub fn upsert_contact(&self, contact: &Contact) -> Result<(), String> {
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        db.execute(
            "INSERT INTO contacts (peer_id, display_name, added_at, last_seen, public_key)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(peer_id) DO UPDATE SET
                display_name = ?2,
                last_seen = COALESCE(?4, last_seen),
                public_key = COALESCE(?5, public_key)",
            params![
                contact.peer_id,
                contact.display_name,
                contact.added_at,
                contact.last_seen,
                contact.public_key,
            ],
        ).map_err(|e| format!("Failed to upsert contact: {}", e))?;
        Ok(())
    }
    
    /// Get all contacts
    pub fn get_contacts(&self) -> Result<Vec<Contact>, String> {
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        let mut stmt = db.prepare(
            "SELECT peer_id, display_name, added_at, last_seen, public_key 
             FROM contacts ORDER BY display_name"
        ).map_err(|e| format!("Failed to prepare: {}", e))?;
        
        let online = self.online_peers.lock().unwrap_or_else(|e| e.into_inner());
        
        let contacts = stmt.query_map([], |row| {
            let peer_id: String = row.get(0)?;
            Ok(Contact {
                is_online: online.get(&peer_id).copied().unwrap_or(false),
                peer_id,
                display_name: row.get(1)?,
                added_at: row.get(2)?,
                last_seen: row.get(3)?,
                public_key: row.get(4)?,
            })
        }).map_err(|e| format!("Failed to query: {}", e))?
          .filter_map(|r| r.ok())
          .collect();
        
        Ok(contacts)
    }
    
    /// Get or create a conversation with a peer
    pub fn get_or_create_conversation(&self, peer_id: &str, display_name: &str) -> Result<Conversation, String> {
        // Try to get existing
        if let Ok(conv) = self.get_conversation_by_peer(peer_id) {
            return Ok(conv);
        }
        
        // Create new
        let id = Uuid::new_v4().to_string();
        
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        db.execute(
            "INSERT INTO conversations (id, peer_id, display_name, unread_count)
             VALUES (?1, ?2, ?3, 0)",
            params![id, peer_id, display_name],
        ).map_err(|e| format!("Failed to create conversation: {}", e))?;
        
        Ok(Conversation {
            id,
            peer_id: peer_id.to_string(),
            display_name: display_name.to_string(),
            last_message: None,
            last_message_at: None,
            unread_count: 0,
        })
    }
    
    /// Get conversation by peer ID
    fn get_conversation_by_peer(&self, peer_id: &str) -> Result<Conversation, String> {
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        db.query_row(
            "SELECT id, peer_id, display_name, last_message, last_message_at, unread_count
             FROM conversations WHERE peer_id = ?1",
            params![peer_id],
            |row| Ok(Conversation {
                id: row.get(0)?,
                peer_id: row.get(1)?,
                display_name: row.get(2)?,
                last_message: row.get(3)?,
                last_message_at: row.get(4)?,
                unread_count: row.get::<_, i64>(5)? as u32,
            }),
        ).map_err(|e| format!("Conversation not found: {}", e))
    }
    
    /// Get all conversations
    pub fn get_conversations(&self) -> Result<Vec<Conversation>, String> {
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        let mut stmt = db.prepare(
            "SELECT id, peer_id, display_name, last_message, last_message_at, unread_count
             FROM conversations ORDER BY last_message_at DESC NULLS LAST"
        ).map_err(|e| format!("Failed to prepare: {}", e))?;
        
        let convs = stmt.query_map([], |row| {
            Ok(Conversation {
                id: row.get(0)?,
                peer_id: row.get(1)?,
                display_name: row.get(2)?,
                last_message: row.get(3)?,
                last_message_at: row.get(4)?,
                unread_count: row.get::<_, i64>(5)? as u32,
            })
        }).map_err(|e| format!("Failed to query: {}", e))?
          .filter_map(|r| r.ok())
          .collect();
        
        Ok(convs)
    }
    
    /// Store a new message
    pub fn store_message(&self, msg: &ChatMessage) -> Result<(), String> {
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        db.execute(
            "INSERT INTO messages (id, conversation_id, sender_id, content, timestamp, is_outgoing, status)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                msg.id,
                msg.conversation_id,
                msg.sender_id,
                msg.content,
                msg.timestamp,
                msg.is_outgoing as i32,
                msg.status.to_str(),
            ],
        ).map_err(|e| format!("Failed to store message: {}", e))?;
        
        // Update conversation preview
        let preview = if msg.content.len() > 50 {
            format!("{}...", &msg.content[..47])
        } else {
            msg.content.clone()
        };
        
        db.execute(
            "UPDATE conversations SET last_message = ?1, last_message_at = ?2,
             unread_count = unread_count + CASE WHEN ?3 = 0 THEN 1 ELSE 0 END
             WHERE id = ?4",
            params![preview, msg.timestamp, msg.is_outgoing as i32, msg.conversation_id],
        ).map_err(|e| format!("Failed to update conversation: {}", e))?;
        
        Ok(())
    }
    
    /// Get messages for a conversation
    pub fn get_messages(&self, conversation_id: &str, limit: u32, before_timestamp: Option<u64>) -> Result<Vec<ChatMessage>, String> {
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        
        let messages: Vec<ChatMessage> = if let Some(ts) = before_timestamp {
            let mut stmt = db.prepare(
                "SELECT id, conversation_id, sender_id, content, timestamp, is_outgoing, status
                 FROM messages WHERE conversation_id = ?1 AND timestamp < ?2
                 ORDER BY timestamp DESC LIMIT ?3"
            ).map_err(|e| format!("Failed to prepare: {}", e))?;
            
            let rows = stmt.query_map(params![conversation_id, ts, limit], Self::row_to_message)
                .map_err(|e| format!("Failed to query: {}", e))?;
            rows.filter_map(|r| r.ok()).collect()
        } else {
            let mut stmt = db.prepare(
                "SELECT id, conversation_id, sender_id, content, timestamp, is_outgoing, status
                 FROM messages WHERE conversation_id = ?1
                 ORDER BY timestamp DESC LIMIT ?2"
            ).map_err(|e| format!("Failed to prepare: {}", e))?;
            
            let rows = stmt.query_map(params![conversation_id, limit], Self::row_to_message)
                .map_err(|e| format!("Failed to query: {}", e))?;
            rows.filter_map(|r| r.ok()).collect()
        };
        
        // Reverse to get chronological order
        Ok(messages.into_iter().rev().collect())
    }
    
    fn row_to_message(row: &rusqlite::Row) -> rusqlite::Result<ChatMessage> {
        Ok(ChatMessage {
            id: row.get(0)?,
            conversation_id: row.get(1)?,
            sender_id: row.get(2)?,
            content: row.get(3)?,
            timestamp: row.get(4)?,
            is_outgoing: row.get::<_, i32>(5)? != 0,
            status: MessageStatus::from_str(&row.get::<_, String>(6)?),
        })
    }
    
    /// Update message status
    pub fn update_message_status(&self, message_id: &str, status: MessageStatus) -> Result<(), String> {
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        db.execute(
            "UPDATE messages SET status = ?1 WHERE id = ?2",
            params![status.to_str(), message_id],
        ).map_err(|e| format!("Failed to update status: {}", e))?;
        Ok(())
    }
    
    /// Mark all messages in conversation as read
    pub fn mark_conversation_read(&self, conversation_id: &str) -> Result<(), String> {
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        db.execute(
            "UPDATE conversations SET unread_count = 0 WHERE id = ?1",
            params![conversation_id],
        ).map_err(|e| format!("Failed to mark read: {}", e))?;
        Ok(())
    }
    
    /// Set peer online status
    pub fn set_peer_online(&self, peer_id: &str, online: bool) {
        if let Ok(mut peers) = self.online_peers.lock() {
            peers.insert(peer_id.to_string(), online);
        }
        if online {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64;
            if let Ok(db) = self.db.lock() {
                let _ = db.execute(
                    "UPDATE contacts SET last_seen = ?1 WHERE peer_id = ?2",
                    params![now, peer_id],
                );
            }
        }
    }
    
    /// Check if peer is online
    pub fn is_peer_online(&self, peer_id: &str) -> bool {
        self.online_peers.lock()
            .map(|p| p.get(peer_id).copied().unwrap_or(false))
            .unwrap_or(false)
    }
    
    /// Create a new outgoing message (ready to send)
    pub fn create_outgoing_message(&self, peer_id: &str, content: &str) -> Result<ChatMessage, String> {
        // Get or create conversation
        let short_id = if peer_id.len() > 8 { &peer_id[..8] } else { peer_id };
        let conv = self.get_or_create_conversation(peer_id, short_id)?;
        
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        
        let msg = ChatMessage {
            id: Uuid::new_v4().to_string(),
            conversation_id: conv.id,
            sender_id: self.local_peer_id.clone(),
            content: content.to_string(),
            timestamp: now,
            is_outgoing: true,
            status: MessageStatus::Pending,
        };
        
        self.store_message(&msg)?;
        Ok(msg)
    }
    
    /// Store an incoming message from a peer
    pub fn store_incoming_message(&self, peer_id: &str, message_id: &str, content: &str, timestamp: u64) -> Result<ChatMessage, String> {
        // Get or create conversation
        let short_id = if peer_id.len() > 8 { &peer_id[..8] } else { peer_id };
        let conv = self.get_or_create_conversation(peer_id, short_id)?;
        
        let msg = ChatMessage {
            id: message_id.to_string(),
            conversation_id: conv.id,
            sender_id: peer_id.to_string(),
            content: content.to_string(),
            timestamp,
            is_outgoing: false,
            status: MessageStatus::Delivered,
        };
        
        self.store_message(&msg)?;
        Ok(msg)
    }
}
