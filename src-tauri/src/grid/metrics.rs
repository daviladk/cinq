// Cinq Bandwidth Metrics - Track data usage for Qi billing
//
// Payment Model:
// - 1 Qi = 1 GB of bandwidth (per hop)
// - Minimum charge: smallest Qi denomination
// - Multi-hop: user pays each hop in the circuit

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================================================
// Qi Denomination Constants (based on Quai Network)
// ============================================================================

/// 1 Qi in its smallest unit (like wei for ETH)
pub const QI: u64 = 1_000_000_000_000_000_000; // 10^18

/// Common denominations
pub const MILLI_QI: u64 = QI / 1_000; // 0.001 Qi
pub const MICRO_QI: u64 = QI / 1_000_000; // 0.000001 Qi
pub const NANO_QI: u64 = QI / 1_000_000_000; // 0.000000001 Qi

/// Minimum billable amount - smallest practical denomination
/// This is the handshake fee and minimum charge for any data transfer
pub const MIN_BILLABLE_QI: u64 = MICRO_QI; // 0.000001 Qi

/// Rate: 1 Qi per GB (expressed in smallest units per byte)
/// 1 Qi / 1 GB = 10^18 / 10^9 = 10^9 units per byte
pub const RATE_PER_BYTE: u64 = QI / (1024 * 1024 * 1024); // ~0.93 nano-Qi per byte

// ============================================================================
// Convenience constants for readability
// ============================================================================

/// Bytes per GB
pub const BYTES_PER_GB: u64 = 1024 * 1024 * 1024;

/// 1 Qi = 1 GB, so 1 Qi per GB
pub const QI_PER_GB: f64 = 1.0;

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
    /// Number of tunnel handshakes (each incurs HANDSHAKE_FEE_QI)
    pub handshake_count: u32,
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
                handshake_count: 0,
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

        let peer = self
            .peers
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

        let peer = self
            .peers
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
            handshake_count: self.session.handshake_count,
        }
    }

    /// Record a tunnel handshake (charges MIN_BILLABLE_QI)
    pub fn record_handshake(&mut self) {
        self.session.handshake_count += 1;
        log::debug!(
            "Recorded handshake #{}, fee: {} units (MIN_BILLABLE_QI)",
            self.session.handshake_count,
            MIN_BILLABLE_QI
        );
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
            handshake_count: 0,
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
    /// Number of tunnel handshakes this session
    pub handshake_count: u32,
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

    /// Calculate cost in smallest Qi units
    /// Formula: max(MIN_BILLABLE_QI, bytes * RATE_PER_BYTE) * num_hops
    /// Plus MIN_BILLABLE_QI per handshake (anti-spam)
    pub fn calculate_cost_units(&self, hops: u32) -> u64 {
        // Handshake fees (1 minimum denomination per handshake)
        let handshake_cost = self.handshake_count as u64 * MIN_BILLABLE_QI;

        // Bandwidth cost (minimum is MIN_BILLABLE_QI if any data transferred)
        let bandwidth_cost = if self.total_bandwidth > 0 {
            let raw_cost = self.total_bandwidth * RATE_PER_BYTE * hops as u64;
            // Apply minimum denomination - round up to nearest MIN_BILLABLE_QI
            let rounded = ((raw_cost + MIN_BILLABLE_QI - 1) / MIN_BILLABLE_QI) * MIN_BILLABLE_QI;
            rounded.max(MIN_BILLABLE_QI * hops as u64) // At least 1 minimum per hop
        } else {
            0
        };

        handshake_cost + bandwidth_cost
    }

    /// Calculate cost in Qi (floating point for display)
    /// 1 Qi = 1 GB per hop
    pub fn calculate_cost_qi(&self, hops: u32) -> f64 {
        self.calculate_cost_units(hops) as f64 / QI as f64
    }

    /// Format cost as human-readable Qi string with appropriate precision
    pub fn format_cost(units: u64) -> String {
        let qi = units as f64 / QI as f64;

        if qi >= 1.0 {
            format!("{:.4} Qi", qi)
        } else if qi >= 0.001 {
            format!("{:.6} Qi", qi) // milli-Qi range
        } else {
            format!("{:.9} Qi", qi) // micro/nano-Qi range
        }
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
    fn test_billing_summary_format() {
        let summary = BillingSummary {
            total_bytes_sent: 1024 * 1024 * 100,     // 100MB
            total_bytes_received: 1024 * 1024 * 200, // 200MB
            total_bandwidth: 1024 * 1024 * 300,
            session_bandwidth: 1024 * 1024 * 50,
            peer_count: 5,
            session_started: 0,
            handshake_count: 10,
        };

        assert_eq!(
            BillingSummary::format_bandwidth(summary.total_bandwidth),
            "300.00 MB"
        );
    }

    #[test]
    fn test_handshake_tracking() {
        let mut metrics = BandwidthMetrics::new();

        metrics.record_handshake();
        metrics.record_handshake();
        metrics.record_handshake();

        let summary = metrics.get_billing_summary();
        assert_eq!(summary.handshake_count, 3);
    }

    #[test]
    fn test_qi_cost_calculation() {
        // 1 GB of bandwidth with 1 handshake
        let summary = BillingSummary {
            total_bytes_sent: BYTES_PER_GB / 2,
            total_bytes_received: BYTES_PER_GB / 2,
            total_bandwidth: BYTES_PER_GB, // 1 GB
            session_bandwidth: BYTES_PER_GB,
            peer_count: 1,
            session_started: 0,
            handshake_count: 1,
        };

        // 1 hop: ~1 Qi for bandwidth + MIN_BILLABLE_QI for handshake
        let cost_1hop = summary.calculate_cost_qi(1);
        assert!(
            cost_1hop > 0.99 && cost_1hop < 1.01,
            "1 hop cost should be ~1 Qi, got {}",
            cost_1hop
        );

        // 3 hops: ~3 Qi for bandwidth + MIN_BILLABLE_QI for handshake
        let cost_3hop = summary.calculate_cost_qi(3);
        assert!(
            cost_3hop > 2.99 && cost_3hop < 3.01,
            "3 hop cost should be ~3 Qi, got {}",
            cost_3hop
        );
    }

    #[test]
    fn test_minimum_charge() {
        // Very small transfer (1 byte)
        let summary = BillingSummary {
            total_bytes_sent: 1,
            total_bytes_received: 0,
            total_bandwidth: 1,
            session_bandwidth: 1,
            peer_count: 1,
            session_started: 0,
            handshake_count: 1,
        };

        // Should be charged at least MIN_BILLABLE_QI for handshake + MIN_BILLABLE_QI for bandwidth
        let cost = summary.calculate_cost_units(1);
        assert!(cost >= 2 * MIN_BILLABLE_QI, "Minimum cost should apply");
    }

    #[test]
    fn test_denomination_constants() {
        // Verify denomination relationships
        assert_eq!(MILLI_QI, QI / 1_000);
        assert_eq!(MICRO_QI, QI / 1_000_000);
        assert_eq!(NANO_QI, QI / 1_000_000_000);

        // 1 Qi = 1 GB worth of data
        assert_eq!(BYTES_PER_GB * RATE_PER_BYTE, QI);
    }
}
