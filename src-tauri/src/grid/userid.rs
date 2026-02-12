// Cinq User ID System
// Maps short, memorable user IDs to libp2p peer IDs
// Published to DHT for global lookup
//
// === FUTURE: Soul Bound Token (SBT) Integration ===
// When SBTs are implemented on Quai Network, the user ID will be derived from
// the SBT rather than randomly generated. The ID format will be:
//
//   [ZONE]-[LOCAL_ID]
//   Example: 2-555-123-4567
//
// Where:
//   - ZONE (1-2 digits): Quai zone/shard where the SBT was minted
//     (0=Cyprus, 1=Paxos, 2=Hydra, etc.)
//   - LOCAL_ID (10 digits): Unique identifier within that zone
//
// This provides:
//   - 90+ billion unique IDs (9 zones × 10B each)
//   - Natural load distribution across Quai shards
//   - Room to expand as Quai adds more zones
//   - On-chain verification of identity ownership
//
// The SBT contract will ensure uniqueness within each zone and provide
// the authoritative mapping from user ID to wallet address.
// ===================================================

use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Mutex as StdMutex;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use rand::Rng;

/// Quai Network zones (for future SBT-based IDs)
/// These correspond to the zone shards in Quai's hierarchy
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum QuaiZone {
    Cyprus = 0,   // Zone 0-0
    Paxos = 1,    // Zone 0-1
    Hydra = 2,    // Zone 0-2
    // Future zones will be added as Quai expands
    // Zone 1-0, 1-1, 1-2, 2-0, 2-1, 2-2 (9 total in full rollout)
}

impl QuaiZone {
    pub fn from_code(code: u8) -> Option<Self> {
        match code {
            0 => Some(Self::Cyprus),
            1 => Some(Self::Paxos),
            2 => Some(Self::Hydra),
            _ => None,
        }
    }
    
    pub fn code(&self) -> u8 {
        *self as u8
    }
    
    pub fn name(&self) -> &'static str {
        match self {
            Self::Cyprus => "Cyprus",
            Self::Paxos => "Paxos",
            Self::Hydra => "Hydra",
        }
    }
}

/// A user ID (short, memorable identifier)
/// 
/// Current format: 10-digit numeric (temporary, randomly generated)
/// Future format: ZONE-XXX-XXX-XXXX (derived from SBT minted on Quai zone)
/// 
/// Example current: "5551234567" displayed as "555-123-4567"
/// Example future:  "2-5551234567" displayed as "2-555-123-4567" (Hydra zone)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserId {
    /// Optional zone prefix (None = legacy format, Some = SBT-derived)
    pub zone: Option<u8>,
    /// The local ID within the zone (10 digits)
    pub local_id: String,
}

impl UserId {
    /// Generate a new random user ID (10 digits, no zone - legacy format)
    /// This is temporary until SBT minting is implemented
    pub fn generate() -> Self {
        let mut rng = rand::thread_rng();
        // Generate 10-digit number (first digit not 0 to look like phone number)
        let first: u32 = rng.gen_range(1..10);
        let rest: u32 = rng.gen_range(0..1_000_000_000);
        Self {
            zone: None,
            local_id: format!("{}{:09}", first, rest),
        }
    }
    
    /// Create from SBT (future use)
    /// zone: The Quai zone where the SBT was minted
    /// local_id: The unique ID assigned by the SBT contract
    pub fn from_sbt(zone: QuaiZone, local_id: &str) -> Option<Self> {
        // Validate local_id is 10 digits
        if local_id.len() == 10 && local_id.chars().all(|c| c.is_ascii_digit()) {
            Some(Self {
                zone: Some(zone.code()),
                local_id: local_id.to_string(),
            })
        } else {
            None
        }
    }
    
    /// Create from string (validates format)
    /// Accepts both legacy "5551234567" and zone-prefixed "2-5551234567"
    pub fn from_string(s: &str) -> Option<Self> {
        let normalized = s.replace("-", "").replace(" ", "");
        
        // Check for zone-prefixed format: Z-XXXXXXXXXX (12 chars with zone)
        if normalized.len() == 11 && normalized.chars().all(|c| c.is_ascii_digit()) {
            let zone = normalized[0..1].parse::<u8>().ok()?;
            let local_id = &normalized[1..11];
            return Some(Self {
                zone: Some(zone),
                local_id: local_id.to_string(),
            });
        }
        
        // Legacy format: XXXXXXXXXX (10 digits, no zone)
        if normalized.len() == 10 && normalized.chars().all(|c| c.is_ascii_digit()) {
            return Some(Self {
                zone: None,
                local_id: normalized,
            });
        }
        
        None
    }
    
    /// Format as display string
    /// Legacy: "555-123-4567"
    /// Zone-prefixed: "2-555-123-4567"
    pub fn display(&self) -> String {
        let local = &self.local_id;
        let formatted_local = if local.len() == 10 {
            format!("{}-{}-{}", &local[0..3], &local[3..6], &local[6..10])
        } else {
            local.clone()
        };
        
        match self.zone {
            Some(z) => format!("{}-{}", z, formatted_local),
            None => formatted_local,
        }
    }
    
    /// Get raw string (for storage/lookup)
    /// Legacy: "5551234567"
    /// Zone-prefixed: "25551234567"
    pub fn as_str(&self) -> String {
        match self.zone {
            Some(z) => format!("{}{}", z, self.local_id),
            None => self.local_id.clone(),
        }
    }
    
    /// Get zone name if present
    pub fn zone_name(&self) -> Option<&'static str> {
        self.zone.and_then(QuaiZone::from_code).map(|z| z.name())
    }
    
    /// Check if this is a verified (SBT-backed) ID
    /// Legacy IDs without zone prefix are unverified/test IDs
    pub fn is_verified(&self) -> bool {
        self.zone.is_some()
    }
    
    /// Check if this is a legacy/test ID (no SBT backing)
    /// These IDs will be replaced when user mints their SBT
    pub fn is_legacy(&self) -> bool {
        self.zone.is_none()
    }
}

/// DHT key prefix for user ID lookups
pub const USER_ID_DHT_PREFIX: &str = "/cinq/userid/";

/// Record stored in DHT for user ID -> peer ID mapping
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserIdRecord {
    /// The user ID
    pub user_id: String,
    /// The peer ID this maps to
    pub peer_id: String,
    /// Display name (optional)
    pub display_name: Option<String>,
    /// When this was published (Unix millis)
    pub published_at: u64,
    /// Signature to prove ownership (peer signs user_id with their key)
    pub signature: Option<Vec<u8>>,
}

impl UserIdRecord {
    /// Create DHT key for this user ID
    pub fn dht_key(user_id: &str) -> Vec<u8> {
        format!("{}{}", USER_ID_DHT_PREFIX, user_id).into_bytes()
    }
    
    /// Serialize for DHT storage
    pub fn to_bytes(&self) -> Vec<u8> {
        bincode::serialize(self).unwrap_or_default()
    }
    
    /// Deserialize from DHT
    pub fn from_bytes(bytes: &[u8]) -> Option<Self> {
        bincode::deserialize(bytes).ok()
    }
}

/// Contact card - shareable identity info (for QR codes, etc.)
/// Can be shared as a URL, QR code, or embedded in messages
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactCard {
    /// User's Chat ID (e.g., "555-123-4567" or "2-555-123-4567")
    pub user_id: String,
    /// Display name (the user's actual name)
    pub display_name: Option<String>,
    /// Peer ID for direct connection
    pub peer_id: String,
    /// Optional avatar URL or base64 encoded small image
    pub avatar: Option<String>,
    /// Optional bio/status message
    pub bio: Option<String>,
    /// Whether this ID is SBT-verified
    pub is_verified: bool,
    /// Zone name if SBT-verified
    pub zone_name: Option<String>,
}

impl ContactCard {
    /// Create a contact card from user ID and profile info
    pub fn new(user_id: &UserId, peer_id: &str) -> Self {
        Self {
            user_id: user_id.display(),
            display_name: None,
            peer_id: peer_id.to_string(),
            avatar: None,
            bio: None,
            is_verified: user_id.is_verified(),
            zone_name: user_id.zone_name().map(|s| s.to_string()),
        }
    }
    
    /// Set display name
    pub fn with_name(mut self, name: impl Into<String>) -> Self {
        self.display_name = Some(name.into());
        self
    }
    
    /// Set bio/status
    pub fn with_bio(mut self, bio: impl Into<String>) -> Self {
        self.bio = Some(bio.into());
        self
    }
    
    /// Serialize to JSON for QR code or sharing
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_default()
    }
    
    /// Create a shareable URL (cinq:// protocol)
    pub fn to_url(&self) -> String {
        let encoded = self.to_json();
        let base64 = base64_encode(&encoded);
        format!("cinq://contact/{}", base64)
    }
    
    /// Parse from JSON
    pub fn from_json(json: &str) -> Option<Self> {
        serde_json::from_str(json).ok()
    }
    
    /// Parse from cinq:// URL
    pub fn from_url(url: &str) -> Option<Self> {
        let prefix = "cinq://contact/";
        if !url.starts_with(prefix) {
            return None;
        }
        let base64_data = &url[prefix.len()..];
        let json = base64_decode(base64_data)?;
        Self::from_json(&json)
    }
    
    /// Get a compact representation for QR codes
    /// Format: cinq:{user_id}:{peer_id_short}:{name_or_empty}
    pub fn to_compact(&self) -> String {
        let name = self.display_name.as_deref().unwrap_or("");
        // Use shortened peer ID (first 12 chars after "12D3KooW")
        let peer_short = if self.peer_id.starts_with("12D3KooW") {
            &self.peer_id[8..20.min(self.peer_id.len())]
        } else {
            &self.peer_id[..12.min(self.peer_id.len())]
        };
        format!("cinq:{}:{}:{}", self.user_id.replace("-", ""), peer_short, name)
    }
}

/// Simple base64 encode (for URL-safe sharing)
fn base64_encode(data: &str) -> String {
    use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
    URL_SAFE_NO_PAD.encode(data.as_bytes())
}

/// Simple base64 decode
fn base64_decode(data: &str) -> Option<String> {
    use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
    URL_SAFE_NO_PAD.decode(data)
        .ok()
        .and_then(|bytes| String::from_utf8(bytes).ok())
}

/// Local user ID registry (persisted to SQLite)
pub struct UserIdRegistry {
    db: Arc<StdMutex<Connection>>,
    local_user_id: StdMutex<Option<UserId>>,
    local_peer_id: String,
}

// Manually implement Send + Sync for thread safety
unsafe impl Send for UserIdRegistry {}
unsafe impl Sync for UserIdRegistry {}

impl UserIdRegistry {
    /// Create a new user ID registry
    pub fn new(data_dir: &PathBuf, local_peer_id: &str) -> Result<Self, String> {
        std::fs::create_dir_all(data_dir)
            .map_err(|e| format!("Failed to create data dir: {}", e))?;
        
        let db_path = data_dir.join("userid.db");
        let db = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open user ID database: {}", e))?;
        
        let registry = Self {
            db: Arc::new(StdMutex::new(db)),
            local_user_id: StdMutex::new(None),
            local_peer_id: local_peer_id.to_string(),
        };
        
        registry.init_schema()?;
        registry.load_local_user_id()?;
        
        Ok(registry)
    }
    
    /// Initialize database schema
    fn init_schema(&self) -> Result<(), String> {
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        db.execute_batch(r#"
            -- Local user's ID and profile (only one row)
            CREATE TABLE IF NOT EXISTS local_identity (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                user_id TEXT NOT NULL,
                peer_id TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );
            
            -- Local user's profile info
            CREATE TABLE IF NOT EXISTS local_profile (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                display_name TEXT,
                bio TEXT,
                avatar TEXT,
                updated_at INTEGER NOT NULL
            );
            
            -- Cached user ID -> peer ID mappings (from DHT lookups)
            CREATE TABLE IF NOT EXISTS user_id_cache (
                user_id TEXT PRIMARY KEY,
                peer_id TEXT NOT NULL,
                display_name TEXT,
                bio TEXT,
                avatar TEXT,
                last_seen INTEGER NOT NULL,
                is_verified INTEGER DEFAULT 0
            );
            
            -- Index for reverse lookup (peer_id -> user_id)
            CREATE INDEX IF NOT EXISTS idx_cache_peer_id ON user_id_cache(peer_id);
        "#).map_err(|e| format!("Failed to init schema: {}", e))?;
        
        Ok(())
    }
    
    /// Load local user ID from database
    fn load_local_user_id(&self) -> Result<(), String> {
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        
        let result: Result<String, _> = db.query_row(
            "SELECT user_id FROM local_identity WHERE id = 1",
            [],
            |row| row.get(0),
        );
        
        if let Ok(user_id_str) = result {
            if let Some(user_id) = UserId::from_string(&user_id_str) {
                let mut local = self.local_user_id.lock().unwrap();
                *local = Some(user_id);
                log::info!("Loaded local user ID: {}", user_id_str);
            }
        }
        
        Ok(())
    }
    
    /// Get local user ID (generates one if not exists)
    pub fn get_or_create_local_user_id(&self) -> Result<UserId, String> {
        // Check if we already have one
        {
            let local = self.local_user_id.lock().unwrap();
            if let Some(ref user_id) = *local {
                return Ok(user_id.clone());
            }
        }
        
        // Generate new user ID
        let user_id = UserId::generate();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        
        // Store in database
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        db.execute(
            "INSERT OR REPLACE INTO local_identity (id, user_id, peer_id, created_at)
             VALUES (1, ?1, ?2, ?3)",
            params![user_id.as_str(), self.local_peer_id, now],
        ).map_err(|e| format!("Failed to save user ID: {}", e))?;
        
        // Update in-memory
        let mut local = self.local_user_id.lock().unwrap();
        *local = Some(user_id.clone());
        
        log::info!("Generated new user ID: {}", user_id.display());
        Ok(user_id)
    }
    
    /// Get local user ID if it exists
    pub fn get_local_user_id(&self) -> Option<UserId> {
        let local = self.local_user_id.lock().unwrap();
        local.clone()
    }
    
    /// Upgrade from legacy (test) ID to SBT-verified ID
    /// This replaces the auto-generated test ID with the on-chain verified ID
    /// Called when user mints their SBT on a Quai zone
    pub fn upgrade_to_sbt(&self, new_user_id: UserId) -> Result<(), String> {
        if !new_user_id.is_verified() {
            return Err("New ID must be SBT-verified (have zone prefix)".into());
        }
        
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        
        // Update in database
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        
        // Get old ID for logging
        let old_id: Option<String> = db.query_row(
            "SELECT user_id FROM local_identity WHERE id = 1",
            [],
            |row| row.get(0),
        ).ok();
        
        db.execute(
            "UPDATE local_identity SET user_id = ?1, created_at = ?2 WHERE id = 1",
            params![new_user_id.as_str(), now],
        ).map_err(|e| format!("Failed to upgrade user ID: {}", e))?;
        
        // Update in-memory
        let mut local = self.local_user_id.lock().unwrap();
        *local = Some(new_user_id.clone());
        
        if let Some(old) = old_id {
            log::info!(
                "Upgraded user ID from {} (legacy) to {} (SBT-verified on {})",
                old,
                new_user_id.display(),
                new_user_id.zone_name().unwrap_or("unknown")
            );
        } else {
            log::info!("Set SBT-verified user ID: {}", new_user_id.display());
        }
        
        Ok(())
    }

    /// Cache a user ID -> peer ID mapping (from DHT lookup)
    pub fn cache_user_id(&self, user_id: &str, peer_id: &str, display_name: Option<&str>) -> Result<(), String> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        db.execute(
            "INSERT OR REPLACE INTO user_id_cache (user_id, peer_id, display_name, last_seen)
             VALUES (?1, ?2, ?3, ?4)",
            params![user_id, peer_id, display_name, now],
        ).map_err(|e| format!("Failed to cache user ID: {}", e))?;
        
        Ok(())
    }
    
    /// Look up peer ID from cache
    pub fn lookup_cached(&self, user_id: &str) -> Option<String> {
        let db = self.db.lock().ok()?;
        db.query_row(
            "SELECT peer_id FROM user_id_cache WHERE user_id = ?1",
            params![user_id],
            |row| row.get(0),
        ).ok()
    }
    
    /// Reverse lookup: get user ID for a peer ID
    pub fn get_user_id_for_peer(&self, peer_id: &str) -> Option<String> {
        let db = self.db.lock().ok()?;
        db.query_row(
            "SELECT user_id FROM user_id_cache WHERE peer_id = ?1",
            params![peer_id],
            |row| row.get(0),
        ).ok()
    }
    
    /// Get all cached user IDs
    pub fn get_all_cached(&self) -> Result<Vec<(String, String, Option<String>)>, String> {
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        let mut stmt = db.prepare(
            "SELECT user_id, peer_id, display_name FROM user_id_cache ORDER BY last_seen DESC"
        ).map_err(|e| format!("Failed to prepare: {}", e))?;
        
        let results = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
            ))
        }).map_err(|e| format!("Failed to query: {}", e))?
          .filter_map(|r| r.ok())
          .collect();
        
        Ok(results)
    }
    
    /// Create a record for DHT publication
    pub fn create_dht_record(&self, display_name: Option<&str>) -> Result<UserIdRecord, String> {
        let user_id = self.get_or_create_local_user_id()?;
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        
        Ok(UserIdRecord {
            user_id: user_id.as_str(),
            peer_id: self.local_peer_id.clone(),
            display_name: display_name.map(|s| s.to_string()),
            published_at: now,
            signature: None, // TODO: Sign with keypair for verification
        })
    }
    
    /// Update local profile (display name, bio, avatar)
    pub fn update_profile(
        &self, 
        display_name: Option<&str>, 
        bio: Option<&str>,
        avatar: Option<&str>
    ) -> Result<(), String> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        db.execute(
            "INSERT OR REPLACE INTO local_profile (id, display_name, bio, avatar, updated_at)
             VALUES (1, ?1, ?2, ?3, ?4)",
            params![display_name, bio, avatar, now],
        ).map_err(|e| format!("Failed to update profile: {}", e))?;
        
        log::info!("Updated profile: name={:?}", display_name);
        Ok(())
    }
    
    /// Get local profile
    pub fn get_profile(&self) -> Result<(Option<String>, Option<String>, Option<String>), String> {
        let db = self.db.lock().map_err(|e| format!("Lock error: {}", e))?;
        
        let result = db.query_row(
            "SELECT display_name, bio, avatar FROM local_profile WHERE id = 1",
            [],
            |row| Ok((
                row.get::<_, Option<String>>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, Option<String>>(2)?,
            )),
        );
        
        match result {
            Ok(profile) => Ok(profile),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok((None, None, None)),
            Err(e) => Err(format!("Failed to get profile: {}", e)),
        }
    }
    
    /// Create a contact card for sharing (QR code, URL, etc.)
    pub fn create_contact_card(&self) -> Result<ContactCard, String> {
        let user_id = self.get_or_create_local_user_id()?;
        let (display_name, bio, avatar) = self.get_profile()?;
        
        let mut card = ContactCard::new(&user_id, &self.local_peer_id);
        card.display_name = display_name;
        card.bio = bio;
        card.avatar = avatar;
        
        Ok(card)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_user_id_generate() {
        let id = UserId::generate();
        assert_eq!(id.local_id.len(), 10);
        assert!(id.local_id.chars().all(|c| c.is_ascii_digit()));
        assert_ne!(id.local_id.chars().next().unwrap(), '0');
        assert!(id.zone.is_none()); // Legacy format has no zone
    }
    
    #[test]
    fn test_user_id_display_legacy() {
        let id = UserId::from_string("5551234567").unwrap();
        assert_eq!(id.display(), "555-123-4567");
        assert!(id.zone.is_none());
    }
    
    #[test]
    fn test_user_id_display_with_zone() {
        let id = UserId::from_sbt(QuaiZone::Hydra, "5551234567").unwrap();
        assert_eq!(id.display(), "2-555-123-4567");
        assert_eq!(id.zone, Some(2));
        assert_eq!(id.zone_name(), Some("Hydra"));
    }
    
    #[test]
    fn test_user_id_from_string_with_zone() {
        // With zone prefix
        let id = UserId::from_string("2-555-123-4567").unwrap();
        assert_eq!(id.zone, Some(2));
        assert_eq!(id.local_id, "5551234567");
        assert_eq!(id.display(), "2-555-123-4567");
        
        // Without dashes
        let id2 = UserId::from_string("25551234567").unwrap();
        assert_eq!(id2.zone, Some(2));
        assert_eq!(id2.local_id, "5551234567");
    }
    
    #[test]
    fn test_user_id_validation() {
        assert!(UserId::from_string("5551234567").is_some());   // Legacy 10 digits
        assert!(UserId::from_string("25551234567").is_some());  // Zone + 10 digits
        assert!(UserId::from_string("123456789").is_none());    // 9 digits
        assert!(UserId::from_string("1234567890123").is_none()); // Too long
    }
    
    #[test]
    fn test_user_id_verification_status() {
        // Legacy ID (auto-generated) should be unverified
        let legacy = UserId::generate();
        assert!(!legacy.is_verified());
        assert!(legacy.is_legacy());
        assert!(legacy.zone.is_none());
        
        // SBT ID should be verified
        let sbt_id = UserId::from_sbt(QuaiZone::Cyprus, "1234567890").unwrap();
        assert!(sbt_id.is_verified());
        assert!(!sbt_id.is_legacy());
        assert_eq!(sbt_id.zone, Some(0));
        assert_eq!(sbt_id.zone_name(), Some("Cyprus"));
    }
    
    #[test]
    fn test_contact_card() {
        let user_id = UserId::from_sbt(QuaiZone::Hydra, "5551234567").unwrap();
        let peer_id = "12D3KooWP7zQ4dLEw3JiPdrerChHsTzhjfxs69oEBcxZieXU1sAu";
        
        let card = ContactCard::new(&user_id, peer_id)
            .with_name("Alice Smith")
            .with_bio("DePIN enthusiast 🌐");
        
        // Check card properties
        assert_eq!(card.user_id, "2-555-123-4567");
        assert_eq!(card.display_name, Some("Alice Smith".to_string()));
        assert_eq!(card.bio, Some("DePIN enthusiast 🌐".to_string()));
        assert!(card.is_verified);
        assert_eq!(card.zone_name, Some("Hydra".to_string()));
        
        // Test JSON serialization
        let json = card.to_json();
        let parsed = ContactCard::from_json(&json).unwrap();
        assert_eq!(parsed.user_id, card.user_id);
        assert_eq!(parsed.display_name, card.display_name);
        
        // Test URL generation and parsing
        let url = card.to_url();
        assert!(url.starts_with("cinq://contact/"));
        let from_url = ContactCard::from_url(&url).unwrap();
        assert_eq!(from_url.user_id, card.user_id);
        assert_eq!(from_url.display_name, card.display_name);
        
        // Test compact format
        let compact = card.to_compact();
        assert!(compact.starts_with("cinq:"));
        assert!(compact.contains("Alice Smith"));
    }
}
