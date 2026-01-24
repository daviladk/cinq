// Cinq Bandwidth Metrics - Track data usage for Qi billing

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Bandwidth statistics for a single peer
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PeerBandwidth {
    /// Peer ID
    pub peer_id: String,
    /// Total bytes sent to this peer
    pub bytes_sent: u64,
    /// Total bytes received from this peer
    pub bytes_received: u64,
    /// Number of successful transfers
    pub transfer_count: u32,
    /// First interaction timestamp
    pub first_seen: u64,
    /// Last interaction timestamp
    pub last_seen: u64,
}

impl PeerBandwidth {
    pub fn new(peer_id: &str) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        Self {
            peer_id: peer_id.to_string(),
            bytes_sent: 0,
            bytes_received: 0,
            transfer_count: 0,
            first_seen: now,
            last_seen: now,
        }
    }

    /// Total bandwidth (sent + received)
    pub fn total_bytes(&self) -> u64 {
        self.bytes_sent + self.bytes_received
    }
}

/// Session-level bandwidth metrics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SessionMetrics {
    /// Session start time
    pub started_at: u64,
    /// Total bytes sent this session
    pub session_bytes_sent: u64,
    /// Total bytes received this session
    pub session_bytes_received: u64,
    /// Number of active connections
    pub active_connections: u32,
}

/// Overall bandwidth metrics for billing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BandwidthMetrics {
    /// Per-peer bandwidth tracking
    pub peers: HashMap<String, PeerBandwidth>,
    /// Current session metrics
    pub session: SessionMetrics,
    /// All-time total bytes sent
    pub total_bytes_sent: u64,
    /// All-time total bytes received
    pub total_bytes_received: u64,
    /// Metrics tracking started at
    pub tracking_started: u64,
}

impl Default for BandwidthMetrics {
    fn default() -> Self {
        Self::new()
    }
}

impl BandwidthMetrics {
    pub fn new() -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            peers: HashMap::new(),
            session: SessionMetrics {
                started_at: now,
                session_bytes_sent: 0,
                session_bytes_received: 0,
                active_connections: 0,
            },
            total_bytes_sent: 0,
            total_bytes_received: 0,
            tracking_started: now,
        }
    }

    /// Record bytes sent to a peer
    pub fn record_sent(&mut self, peer_id: &str, bytes: u64) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let peer = self.peers
            .entry(peer_id.to_string())
            .or_insert_with(|| PeerBandwidth::new(peer_id));

        peer.bytes_sent += bytes;
        peer.last_seen = now;
        peer.transfer_count += 1;

        self.session.session_bytes_sent += bytes;
        self.total_bytes_sent += bytes;

        log::debug!("Recorded {} bytes sent to peer {}", bytes, peer_id);
    }

    /// Record bytes received from a peer
    pub fn record_received(&mut self, peer_id: &str, bytes: u64) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let peer = self.peers
            .entry(peer_id.to_string())
            .or_insert_with(|| PeerBandwidth::new(peer_id));

        peer.bytes_received += bytes;
        peer.last_seen = now;
        peer.transfer_count += 1;

        self.session.session_bytes_received += bytes;
        self.total_bytes_received += bytes;

        log::debug!("Recorded {} bytes received from peer {}", bytes, peer_id);
    }

    /// Get bandwidth for a specific peer
    pub fn get_peer_bandwidth(&self, peer_id: &str) -> Option<&PeerBandwidth> {
        self.peers.get(peer_id)
    }

    /// Get total bandwidth across all peers
    pub fn get_total_bandwidth(&self) -> u64 {
        self.total_bytes_sent + self.total_bytes_received
    }

    /// Get session bandwidth
    pub fn get_session_bandwidth(&self) -> u64 {
        self.session.session_bytes_sent + self.session.session_bytes_received
    }

    /// Get summary for billing purposes
    pub fn get_billing_summary(&self) -> BillingSummary {
        BillingSummary {
            total_bytes_sent: self.total_bytes_sent,
            total_bytes_received: self.total_bytes_received,
            total_bandwidth: self.get_total_bandwidth(),
            session_bandwidth: self.get_session_bandwidth(),
            peer_count: self.peers.len() as u32,
            session_started: self.session.started_at,
        }
    }

    /// Reset session metrics (for new billing period)
    pub fn reset_session(&mut self) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.session = SessionMetrics {
            started_at: now,
            session_bytes_sent: 0,
            session_bytes_received: 0,
            active_connections: 0,
        };
    }

    /// Update active connection count
    pub fn update_connections(&mut self, count: u32) {
        self.session.active_connections = count;
    }

    /// Export metrics as JSON for persistence
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }

    /// Import metrics from JSON
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }
}

/// Summary for billing calculations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BillingSummary {
    pub total_bytes_sent: u64,
    pub total_bytes_received: u64,
    pub total_bandwidth: u64,
    pub session_bandwidth: u64,
    pub peer_count: u32,
    pub session_started: u64,
}

impl BillingSummary {
    /// Format bandwidth as human-readable string
    pub fn format_bandwidth(bytes: u64) -> String {
        const KB: u64 = 1024;
        const MB: u64 = KB * 1024;
        const GB: u64 = MB * 1024;

        if bytes >= GB {
            format!("{:.2} GB", bytes as f64 / GB as f64)
        } else if bytes >= MB {
            format!("{:.2} MB", bytes as f64 / MB as f64)
        } else if bytes >= KB {
            format!("{:.2} KB", bytes as f64 / KB as f64)
        } else {
            format!("{} bytes", bytes)
        }
    }

    /// Calculate estimated Qi cost (placeholder rate)
    /// This will be replaced with actual Quai Network rates
    pub fn estimate_qi_cost(&self, qi_per_gb: f64) -> f64 {
        let gb_used = self.total_bandwidth as f64 / (1024.0 * 1024.0 * 1024.0);
        gb_used * qi_per_gb
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bandwidth_tracking() {
        let mut metrics = BandwidthMetrics::new();
        
        metrics.record_sent("peer1", 1000);
        metrics.record_received("peer1", 2000);
        metrics.record_sent("peer2", 500);

        assert_eq!(metrics.total_bytes_sent, 1500);
        assert_eq!(metrics.total_bytes_received, 2000);
        assert_eq!(metrics.get_total_bandwidth(), 3500);
        
        let peer1 = metrics.get_peer_bandwidth("peer1").unwrap();
        assert_eq!(peer1.bytes_sent, 1000);
        assert_eq!(peer1.bytes_received, 2000);
    }

    #[test]
    fn test_billing_summary() {
        let summary = BillingSummary {
            total_bytes_sent: 1024 * 1024 * 100, // 100MB
            total_bytes_received: 1024 * 1024 * 200, // 200MB
            total_bandwidth: 1024 * 1024 * 300,
            session_bandwidth: 1024 * 1024 * 50,
            peer_count: 5,
            session_started: 0,
        };

        assert_eq!(BillingSummary::format_bandwidth(summary.total_bandwidth), "300.00 MB");
    }
}
