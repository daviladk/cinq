// Cinq Grid Bootstrap - Peer persistence and auto-discovery
//
// Every node acts as a bootstrap node. This module:
// 1. Persists known peer addresses to disk
// 2. Loads saved peers on startup and tries to reconnect
// 3. Falls back to hardcoded bootstraps if no saved peers work
// 4. Shares peer info via Kademlia DHT

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

/// A saved peer entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedPeer {
    /// The peer's libp2p peer ID
    pub peer_id: String,
    /// Known multiaddresses for this peer
    pub addresses: Vec<String>,
    /// Unix timestamp of last successful connection
    pub last_connected: u64,
    /// Number of successful connections
    pub success_count: u32,
    /// Number of failed connection attempts
    pub fail_count: u32,
}

impl SavedPeer {
    pub fn new(peer_id: String, address: String) -> Self {
        Self {
            peer_id,
            addresses: vec![address],
            last_connected: now(),
            success_count: 1,
            fail_count: 0,
        }
    }

    /// Calculate a score for peer selection (higher = more reliable)
    pub fn reliability_score(&self) -> f64 {
        let total = self.success_count + self.fail_count;
        if total == 0 {
            return 0.5; // Unknown reliability
        }

        let success_rate = self.success_count as f64 / total as f64;

        // Decay based on how long ago we connected (prefer recent connections)
        let age_hours = (now() - self.last_connected) as f64 / 3600.0;
        let recency_factor = 1.0 / (1.0 + age_hours / 24.0); // Half weight after 24 hours

        success_rate * recency_factor
    }

    /// Record a successful connection
    pub fn record_success(&mut self) {
        self.last_connected = now();
        self.success_count += 1;
    }

    /// Record a failed connection attempt
    pub fn record_failure(&mut self) {
        self.fail_count += 1;
    }

    /// Add an address if not already known
    pub fn add_address(&mut self, addr: String) {
        if !self.addresses.contains(&addr) {
            self.addresses.push(addr);
        }
    }
}

/// Bootstrap configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BootstrapConfig {
    /// Hardcoded bootstrap peers (fallback)
    pub initial_bootstraps: Vec<String>,
    /// Maximum number of peers to save
    pub max_saved_peers: usize,
    /// Maximum connection attempts per peer
    pub max_attempts_per_peer: u32,
    /// How many peers to try connecting to on startup
    pub startup_connect_count: usize,
}

impl Default for BootstrapConfig {
    fn default() -> Self {
        Self {
            // Hardcoded bootstrap nodes for initial network connectivity
            // These are the "seed" nodes that new peers connect to first
            initial_bootstraps: vec![
                // Mac Mini - primary bootstrap node
                "/ip4/50.4.171.204/tcp/9000/p2p/12D3KooWP7zQ4dLEw3JiPdrerChHsTzhjfxs69oEBcxZieXU1sAu".to_string(),
            ],
            max_saved_peers: 100,
            max_attempts_per_peer: 3,
            startup_connect_count: 5,
        }
    }
}

/// Peer storage - persists known peers to disk
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerStorage {
    /// Known peers indexed by peer ID
    pub peers: HashMap<String, SavedPeer>,
    /// Configuration
    #[serde(skip)]
    pub config: BootstrapConfig,
    /// Path to the storage file
    #[serde(skip)]
    storage_path: Option<PathBuf>,
}

impl Default for PeerStorage {
    fn default() -> Self {
        Self {
            peers: HashMap::new(),
            config: BootstrapConfig::default(),
            storage_path: None,
        }
    }
}

impl PeerStorage {
    /// Create new peer storage with the given data directory
    pub fn new(data_dir: PathBuf) -> Self {
        let storage_path = data_dir.join("known_peers.json");
        let mut storage = Self {
            peers: HashMap::new(),
            config: BootstrapConfig::default(),
            storage_path: Some(storage_path),
        };

        // Try to load existing peers
        if let Err(e) = storage.load() {
            log::warn!("Could not load saved peers: {}", e);
        }

        storage
    }

    /// Create storage with custom config
    pub fn with_config(data_dir: PathBuf, config: BootstrapConfig) -> Self {
        let mut storage = Self::new(data_dir);
        storage.config = config;
        storage
    }

    /// Load peers from disk
    pub fn load(&mut self) -> Result<(), String> {
        let path = self
            .storage_path
            .as_ref()
            .ok_or_else(|| "No storage path configured".to_string())?;

        if !path.exists() {
            log::info!("No saved peers file found, starting fresh");
            return Ok(());
        }

        let data = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read peers file: {}", e))?;

        let loaded: PeerStorage = serde_json::from_str(&data)
            .map_err(|e| format!("Failed to parse peers file: {}", e))?;

        self.peers = loaded.peers;
        log::info!("Loaded {} saved peers", self.peers.len());

        Ok(())
    }

    /// Save peers to disk
    pub fn save(&self) -> Result<(), String> {
        let path = self
            .storage_path
            .as_ref()
            .ok_or_else(|| "No storage path configured".to_string())?;

        // Ensure directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create data directory: {}", e))?;
        }

        let data = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize peers: {}", e))?;

        std::fs::write(path, data).map_err(|e| format!("Failed to write peers file: {}", e))?;

        log::debug!("Saved {} peers to disk", self.peers.len());

        Ok(())
    }

    /// Add or update a peer
    pub fn upsert_peer(&mut self, peer_id: &str, address: &str) {
        if let Some(peer) = self.peers.get_mut(peer_id) {
            peer.add_address(address.to_string());
            peer.record_success();
        } else {
            self.peers.insert(
                peer_id.to_string(),
                SavedPeer::new(peer_id.to_string(), address.to_string()),
            );
        }

        // Prune if we have too many peers
        self.prune_old_peers();

        // Auto-save
        if let Err(e) = self.save() {
            log::warn!("Failed to save peers: {}", e);
        }
    }

    /// Record a successful connection to a peer
    pub fn record_connection_success(&mut self, peer_id: &str) {
        if let Some(peer) = self.peers.get_mut(peer_id) {
            peer.record_success();
            if let Err(e) = self.save() {
                log::warn!("Failed to save peers: {}", e);
            }
        }
    }

    /// Record a failed connection to a peer
    pub fn record_connection_failure(&mut self, peer_id: &str) {
        if let Some(peer) = self.peers.get_mut(peer_id) {
            peer.record_failure();

            // Remove peer if too many failures
            if peer.fail_count >= self.config.max_attempts_per_peer {
                log::info!(
                    "Removing peer {} after {} failures",
                    peer_id,
                    peer.fail_count
                );
                self.peers.remove(peer_id);
            }

            if let Err(e) = self.save() {
                log::warn!("Failed to save peers: {}", e);
            }
        }
    }

    /// Get the best peers to connect to on startup
    /// Returns a list of multiaddresses sorted by reliability
    pub fn get_bootstrap_addresses(&self) -> Vec<String> {
        // Sort peers by reliability score
        let mut peers: Vec<_> = self.peers.values().collect();
        peers.sort_by(|a, b| {
            b.reliability_score()
                .partial_cmp(&a.reliability_score())
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        // Collect addresses from top peers
        let mut addresses: Vec<String> = Vec::new();
        for peer in peers.iter().take(self.config.startup_connect_count) {
            // For each peer, add all known addresses with the peer ID suffix
            for addr in &peer.addresses {
                // If address doesn't include peer ID, append it
                let full_addr = if addr.contains("/p2p/") {
                    addr.clone()
                } else {
                    format!("{}/p2p/{}", addr, peer.peer_id)
                };
                addresses.push(full_addr);
            }
        }

        // If we don't have enough saved peers, add the hardcoded bootstraps
        if addresses.len() < self.config.startup_connect_count {
            for bootstrap in &self.config.initial_bootstraps {
                if !addresses.contains(bootstrap) {
                    addresses.push(bootstrap.clone());
                }
            }
        }

        addresses
    }

    /// Get all known peer addresses (for sharing via DHT)
    pub fn get_all_addresses(&self) -> Vec<String> {
        let mut addresses = Vec::new();
        for peer in self.peers.values() {
            for addr in &peer.addresses {
                let full_addr = if addr.contains("/p2p/") {
                    addr.clone()
                } else {
                    format!("{}/p2p/{}", addr, peer.peer_id)
                };
                addresses.push(full_addr);
            }
        }
        addresses
    }

    /// Prune old/unreliable peers to stay under the limit
    fn prune_old_peers(&mut self) {
        if self.peers.len() <= self.config.max_saved_peers {
            return;
        }

        // Sort by reliability score and keep the best
        let mut peers: Vec<_> = self.peers.iter().collect();
        peers.sort_by(|a, b| {
            b.1.reliability_score()
                .partial_cmp(&a.1.reliability_score())
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        // Keep only max_saved_peers
        let to_keep: std::collections::HashSet<_> = peers
            .iter()
            .take(self.config.max_saved_peers)
            .map(|(k, _)| (*k).clone())
            .collect();

        self.peers.retain(|k, _| to_keep.contains(k));
    }

    /// Check if we have any saved peers
    pub fn has_saved_peers(&self) -> bool {
        !self.peers.is_empty()
    }

    /// Get count of saved peers
    pub fn peer_count(&self) -> usize {
        self.peers.len()
    }
}

/// Get current unix timestamp
fn now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_peer_storage_save_load() {
        let dir = tempdir().unwrap();
        let mut storage = PeerStorage::new(dir.path().to_path_buf());

        storage.upsert_peer("12D3KooWTestPeerId123", "/ip4/192.168.1.100/tcp/9000");

        assert_eq!(storage.peer_count(), 1);

        // Create a new storage and load
        let storage2 = PeerStorage::new(dir.path().to_path_buf());
        assert_eq!(storage2.peer_count(), 1);
    }

    #[test]
    fn test_reliability_score() {
        let mut peer = SavedPeer::new("test".to_string(), "/ip4/1.2.3.4/tcp/9000".to_string());

        // Fresh peer should have decent score
        let initial_score = peer.reliability_score();
        assert!(initial_score > 0.0);

        // After failures, score should decrease
        peer.record_failure();
        peer.record_failure();
        assert!(peer.reliability_score() < initial_score);
    }
}
