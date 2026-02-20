//! Bandwidth Worker - Handles message routing and byte tracking
//!
//! Responsible for:
//! - Encrypting/decrypting messages
//! - Sending via libp2p
//! - Tracking bytes sent/received
//! - Reporting to UsageTracker

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

use super::{Worker, WorkerResult};
use crate::swarm::costs::ActionType;

/// Active stream for calls/transfers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveStream {
    pub id: String,
    pub peer_id: String,
    pub stream_type: StreamType,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub started_at: i64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum StreamType {
    Message,
    VoiceCall,
    VideoCall,
    FileTransfer,
}

impl StreamType {
    pub fn to_action_type(&self) -> ActionType {
        match self {
            StreamType::Message => ActionType::Message,
            StreamType::VoiceCall => ActionType::VoiceCall,
            StreamType::VideoCall => ActionType::VideoCall,
            StreamType::FileTransfer => ActionType::FileTransfer,
        }
    }
}

/// Bandwidth worker state
pub struct BandwidthWorker {
    /// Active streams (calls, transfers)
    active_streams: Arc<RwLock<Vec<ActiveStream>>>,
    /// Total bytes sent this session
    session_bytes_sent: Arc<RwLock<u64>>,
    /// Total bytes received this session
    session_bytes_received: Arc<RwLock<u64>>,
}

impl Default for BandwidthWorker {
    fn default() -> Self {
        Self::new()
    }
}

impl BandwidthWorker {
    pub fn new() -> Self {
        Self {
            active_streams: Arc::new(RwLock::new(Vec::new())),
            session_bytes_sent: Arc::new(RwLock::new(0)),
            session_bytes_received: Arc::new(RwLock::new(0)),
        }
    }

    /// Record bytes sent (for billing)
    pub async fn record_sent(&self, bytes: u64) {
        let mut total = self.session_bytes_sent.write().await;
        *total += bytes;
    }

    /// Record bytes received (for tracking, not billed)
    pub async fn record_received(&self, bytes: u64) {
        let mut total = self.session_bytes_received.write().await;
        *total += bytes;
    }

    /// Get session stats
    pub async fn get_session_stats(&self) -> (u64, u64) {
        let sent = *self.session_bytes_sent.read().await;
        let received = *self.session_bytes_received.read().await;
        (sent, received)
    }

    /// Get number of active streams
    pub async fn active_stream_count(&self) -> usize {
        self.active_streams.read().await.len()
    }

    /// Start a new stream (call, transfer)
    pub async fn start_stream(&self, peer_id: String, stream_type: StreamType) -> String {
        let id = uuid::Uuid::new_v4().to_string();
        let stream = ActiveStream {
            id: id.clone(),
            peer_id,
            stream_type,
            bytes_sent: 0,
            bytes_received: 0,
            started_at: chrono::Utc::now().timestamp(),
        };

        let mut streams = self.active_streams.write().await;
        streams.push(stream);

        id
    }

    /// Update stream bytes
    pub async fn update_stream(&self, stream_id: &str, sent: u64, received: u64) {
        let mut streams = self.active_streams.write().await;
        if let Some(stream) = streams.iter_mut().find(|s| s.id == stream_id) {
            stream.bytes_sent += sent;
            stream.bytes_received += received;
        }

        // Also update session totals
        drop(streams);
        self.record_sent(sent).await;
        self.record_received(received).await;
    }

    /// End a stream and return final stats
    pub async fn end_stream(&self, stream_id: &str) -> Option<ActiveStream> {
        let mut streams = self.active_streams.write().await;
        if let Some(pos) = streams.iter().position(|s| s.id == stream_id) {
            Some(streams.remove(pos))
        } else {
            None
        }
    }

    /// Get all active streams
    pub async fn get_active_streams(&self) -> Vec<ActiveStream> {
        self.active_streams.read().await.clone()
    }

    /// Get a specific stream
    pub async fn get_stream(&self, stream_id: &str) -> Option<ActiveStream> {
        let streams = self.active_streams.read().await;
        streams.iter().find(|s| s.id == stream_id).cloned()
    }

    /// Send a message (simulated for now - will integrate with grid)
    pub async fn send_message(&self, peer_id: &str, content: &str) -> WorkerResult {
        // Calculate message size with overhead
        let payload_size = content.len() + 200; // ~200 bytes crypto overhead

        // Record the bytes
        self.record_sent(payload_size as u64).await;

        // Calculate cost
        let kb = payload_size as f64 / 1024.0;
        let cost = kb * 0.001; // message_per_kb rate

        WorkerResult::ok(format!("Message sent to {}", peer_id))
            .with_bytes(payload_size as u64)
            .with_cost(cost)
    }

    /// Initiate a voice call
    pub async fn start_call(&self, peer_id: &str) -> WorkerResult {
        let stream_id = self
            .start_stream(peer_id.to_string(), StreamType::VoiceCall)
            .await;

        // Signal overhead (~500 bytes for call setup)
        self.record_sent(500).await;

        WorkerResult::ok(format!("Calling {}", peer_id))
            .with_bytes(500)
            .with_cost(0.0005) // Signal cost
            .with_data(serde_json::json!({ "stream_id": stream_id }))
    }

    /// Initiate a video call
    pub async fn start_video_call(&self, peer_id: &str) -> WorkerResult {
        let stream_id = self
            .start_stream(peer_id.to_string(), StreamType::VideoCall)
            .await;

        // Signal overhead
        self.record_sent(500).await;

        WorkerResult::ok(format!("Video calling {}", peer_id))
            .with_bytes(500)
            .with_cost(0.0005)
            .with_data(serde_json::json!({ "stream_id": stream_id }))
    }

    /// End an active call
    pub async fn end_call(&self, stream_id: &str) -> WorkerResult {
        if let Some(stream) = self.end_stream(stream_id).await {
            let duration_secs = (chrono::Utc::now().timestamp() - stream.started_at) as f64;
            let duration_mins = duration_secs / 60.0;

            // Calculate cost based on type
            let rate = match stream.stream_type {
                StreamType::VoiceCall => 0.05, // per minute
                StreamType::VideoCall => 0.5,  // per minute
                _ => 0.0,
            };
            let cost = duration_mins * rate;

            WorkerResult::ok("Call ended")
                .with_bytes(stream.bytes_sent + stream.bytes_received)
                .with_cost(cost)
                .with_duration(duration_secs)
                .with_data(serde_json::json!({
                    "peer_id": stream.peer_id,
                    "duration_mins": duration_mins,
                    "bytes_sent": stream.bytes_sent,
                    "bytes_received": stream.bytes_received,
                }))
        } else {
            WorkerResult::err("No active call found")
        }
    }

    /// Reset session stats (for new session)
    pub async fn reset_session(&self) {
        *self.session_bytes_sent.write().await = 0;
        *self.session_bytes_received.write().await = 0;
    }
}

impl Worker for BandwidthWorker {
    fn name(&self) -> &'static str {
        "bandwidth"
    }

    async fn health_check(&self) -> bool {
        true // Pure Rust, always healthy
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_send_message() {
        let worker = BandwidthWorker::new();
        let result = worker.send_message("alice", "hello world").await;

        assert!(result.success);
        assert!(result.bytes_processed > 0);
        assert!(result.qi_cost > 0.0);
    }

    #[tokio::test]
    async fn test_call_flow() {
        let worker = BandwidthWorker::new();

        // Start call
        let start_result = worker.start_call("bob").await;
        assert!(start_result.success);

        let stream_id = start_result.data.unwrap()["stream_id"]
            .as_str()
            .unwrap()
            .to_string();

        // Simulate some bytes
        worker.update_stream(&stream_id, 10000, 10000).await;

        // End call
        let end_result = worker.end_call(&stream_id).await;
        assert!(end_result.success);
        assert!(end_result.bytes_processed > 0);
    }
}
