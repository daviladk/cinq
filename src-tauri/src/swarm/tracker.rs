//! Usage Tracker - Real-time monitoring of active sessions
//!
//! Tracks ongoing actions (calls, transfers, etc.) and emits warnings
//! as the user's Qi balance approaches depletion.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use uuid::Uuid;

use super::costs::{ActionType, CostTable};

/// Warning severity levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WarningLevel {
    /// ~20% runway remaining - subtle notification
    Yellow,
    /// ~60 seconds remaining - audio/visual warning
    Orange,
    /// ~10 seconds remaining - countdown to end
    Red,
}

impl WarningLevel {
    /// Get threshold in seconds for this warning level
    pub fn threshold_secs(&self) -> f64 {
        match self {
            WarningLevel::Yellow => 120.0, // 2 minutes
            WarningLevel::Orange => 60.0,  // 1 minute
            WarningLevel::Red => 10.0,     // 10 seconds
        }
    }

    /// Get human-readable message for this warning
    pub fn message(&self, runway_secs: f64) -> String {
        match self {
            WarningLevel::Yellow => format!(
                "About {} left at current rate",
                Self::format_duration(runway_secs)
            ),
            WarningLevel::Orange => format!("⚠️ {} remaining", Self::format_duration(runway_secs)),
            WarningLevel::Red => format!("🔴 Ending in {} seconds", runway_secs as u32),
        }
    }

    fn format_duration(secs: f64) -> String {
        if secs >= 60.0 {
            let mins = (secs / 60.0).round() as u32;
            if mins == 1 {
                "1 minute".to_string()
            } else {
                format!("{} minutes", mins)
            }
        } else {
            format!("{} seconds", secs as u32)
        }
    }
}

/// A warning event to be sent to the UI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Warning {
    pub session_id: String,
    pub action_type: ActionType,
    pub level: WarningLevel,
    pub runway_secs: f64,
    pub message: String,
    pub suggestion: Option<String>,
}

/// An active session being tracked
#[derive(Debug, Clone)]
pub struct ActiveSession {
    pub id: Uuid,
    pub action_type: ActionType,
    pub started_at: Instant,
    pub peer_id: Option<String>,
    pub description: String,

    // Cumulative usage
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub units_consumed: f64,

    // Warning tracking
    pub warnings_sent: Vec<WarningLevel>,
}

impl ActiveSession {
    pub fn new(action_type: ActionType, description: String, peer_id: Option<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            action_type,
            started_at: Instant::now(),
            peer_id,
            description,
            bytes_sent: 0,
            bytes_received: 0,
            units_consumed: 0.0,
            warnings_sent: Vec::new(),
        }
    }

    /// Duration since session started
    pub fn elapsed(&self) -> Duration {
        self.started_at.elapsed()
    }

    /// Duration in minutes (for time-based billing like calls)
    pub fn elapsed_minutes(&self) -> f64 {
        self.started_at.elapsed().as_secs_f64() / 60.0
    }

    /// Calculate current Qi consumed based on action type
    pub fn qi_consumed(&self, cost_table: &CostTable) -> f64 {
        match self.action_type {
            ActionType::Message | ActionType::FileTransfer => {
                // Data-based: use bytes
                let mb = (self.bytes_sent + self.bytes_received) as f64 / (1024.0 * 1024.0);
                cost_table.calculate(self.action_type, mb)
            }
            ActionType::VoiceCall | ActionType::VideoCall => {
                // Time-based: use elapsed minutes
                cost_table.calculate(self.action_type, self.elapsed_minutes())
            }
            _ => {
                // Unit-based
                cost_table.calculate(self.action_type, self.units_consumed)
            }
        }
    }

    /// Update bytes sent
    pub fn add_bytes_sent(&mut self, bytes: u64) {
        self.bytes_sent += bytes;
    }

    /// Update bytes received  
    pub fn add_bytes_received(&mut self, bytes: u64) {
        self.bytes_received += bytes;
    }

    /// Update units consumed (for non-byte actions)
    pub fn add_units(&mut self, units: f64) {
        self.units_consumed += units;
    }
}

/// The main usage tracker that monitors all active sessions
pub struct UsageTracker {
    sessions: Arc<RwLock<HashMap<Uuid, ActiveSession>>>,
    cost_table: CostTable,
    qi_balance: Arc<RwLock<f64>>,
}

impl UsageTracker {
    pub fn new(initial_balance: f64) -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
            cost_table: CostTable::default(),
            qi_balance: Arc::new(RwLock::new(initial_balance)),
        }
    }

    /// Start tracking a new session
    pub async fn start_session(
        &self,
        action_type: ActionType,
        description: String,
        peer_id: Option<String>,
    ) -> Uuid {
        let session = ActiveSession::new(action_type, description, peer_id);
        let id = session.id;

        let mut sessions = self.sessions.write().await;
        sessions.insert(id, session);

        log::info!("Started tracking session {} ({:?})", id, action_type);
        id
    }

    /// End a session and return final Qi consumed
    pub async fn end_session(&self, session_id: Uuid) -> Option<f64> {
        let mut sessions = self.sessions.write().await;
        if let Some(session) = sessions.remove(&session_id) {
            let qi_consumed = session.qi_consumed(&self.cost_table);
            log::info!(
                "Ended session {} ({:?}): {:.4} Qi consumed over {:.1}s",
                session_id,
                session.action_type,
                qi_consumed,
                session.elapsed().as_secs_f64()
            );
            Some(qi_consumed)
        } else {
            None
        }
    }

    /// Update session with new bytes sent
    pub async fn record_bytes_sent(&self, session_id: Uuid, bytes: u64) {
        let mut sessions = self.sessions.write().await;
        if let Some(session) = sessions.get_mut(&session_id) {
            session.add_bytes_sent(bytes);
        }
    }

    /// Update session with new bytes received
    pub async fn record_bytes_received(&self, session_id: Uuid, bytes: u64) {
        let mut sessions = self.sessions.write().await;
        if let Some(session) = sessions.get_mut(&session_id) {
            session.add_bytes_received(bytes);
        }
    }

    /// Update Qi balance (call this when balance changes)
    pub async fn set_balance(&self, balance: f64) {
        let mut qi = self.qi_balance.write().await;
        *qi = balance;
    }

    /// Get current Qi balance
    pub async fn get_balance(&self) -> f64 {
        *self.qi_balance.read().await
    }

    /// Check all sessions and return any warnings
    pub async fn check_warnings(&self) -> Vec<Warning> {
        let balance = *self.qi_balance.read().await;
        let mut sessions = self.sessions.write().await;
        let mut warnings = Vec::new();

        for session in sessions.values_mut() {
            if let Some(warning) = self.check_session_warning(session, balance) {
                // Only send if we haven't sent this level before
                if !session.warnings_sent.contains(&warning.level) {
                    session.warnings_sent.push(warning.level);
                    warnings.push(warning);
                }
            }
        }

        warnings
    }

    /// Check a single session for warnings
    fn check_session_warning(&self, session: &ActiveSession, balance: f64) -> Option<Warning> {
        // Calculate current burn rate based on action type
        let rate_per_sec = match session.action_type {
            ActionType::VoiceCall => self.cost_table.voice_per_min / 60.0,
            ActionType::VideoCall => self.cost_table.video_per_min / 60.0,
            _ => {
                // For data-based actions, estimate rate from recent activity
                let elapsed = session.elapsed().as_secs_f64();
                if elapsed > 0.0 {
                    session.qi_consumed(&self.cost_table) / elapsed
                } else {
                    0.0
                }
            }
        };

        if rate_per_sec <= 0.0 {
            return None;
        }

        // Calculate remaining runway
        let qi_consumed = session.qi_consumed(&self.cost_table);
        let remaining_balance = balance - qi_consumed;
        let runway_secs = if rate_per_sec > 0.0 {
            remaining_balance / rate_per_sec
        } else {
            f64::INFINITY
        };

        // Determine warning level
        let level = if runway_secs <= WarningLevel::Red.threshold_secs() {
            Some(WarningLevel::Red)
        } else if runway_secs <= WarningLevel::Orange.threshold_secs() {
            Some(WarningLevel::Orange)
        } else if runway_secs <= WarningLevel::Yellow.threshold_secs() {
            Some(WarningLevel::Yellow)
        } else {
            None
        };

        level.map(|level| {
            let suggestion = match (session.action_type, level) {
                (ActionType::VideoCall, WarningLevel::Orange | WarningLevel::Red) => {
                    Some("Switch to voice-only to extend call time".to_string())
                }
                (_, WarningLevel::Red) => Some("Top up Qi to continue".to_string()),
                _ => None,
            };

            Warning {
                session_id: session.id.to_string(),
                action_type: session.action_type,
                level,
                runway_secs,
                message: level.message(runway_secs),
                suggestion,
            }
        })
    }

    /// Get summary of all active sessions
    pub async fn get_active_sessions(&self) -> Vec<SessionSummary> {
        let sessions = self.sessions.read().await;
        sessions
            .values()
            .map(|s| SessionSummary {
                id: s.id.to_string(),
                action_type: s.action_type,
                description: s.description.clone(),
                elapsed_secs: s.elapsed().as_secs_f64(),
                qi_consumed: s.qi_consumed(&self.cost_table),
            })
            .collect()
    }

    /// Estimate cost for a potential action
    pub fn estimate_cost(&self, action_type: ActionType, units: f64) -> CostEstimate {
        let cost = self.cost_table.calculate(action_type, units);
        CostEstimate {
            action_type,
            units,
            unit_label: action_type.unit().to_string(),
            qi_cost: cost,
            rate: self.cost_table.rate(action_type),
        }
    }

    /// Get a reference to the cost table
    pub fn cost_table(&self) -> &CostTable {
        &self.cost_table
    }
}

/// Summary of an active session for UI display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSummary {
    pub id: String,
    pub action_type: ActionType,
    pub description: String,
    pub elapsed_secs: f64,
    pub qi_consumed: f64,
}

/// Cost estimate for a potential action
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostEstimate {
    pub action_type: ActionType,
    pub units: f64,
    pub unit_label: String,
    pub qi_cost: f64,
    pub rate: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_session_tracking() {
        let tracker = UsageTracker::new(10.0);

        let session_id = tracker
            .start_session(ActionType::Message, "Test message".to_string(), None)
            .await;

        tracker.record_bytes_sent(session_id, 1024).await;

        let qi = tracker.end_session(session_id).await;
        assert!(qi.is_some());
        assert!(qi.unwrap() > 0.0);
    }

    #[tokio::test]
    async fn test_warning_levels() {
        let tracker = UsageTracker::new(0.5); // Low balance

        let session_id = tracker
            .start_session(
                ActionType::VideoCall,
                "Call with Alice".to_string(),
                Some("peer123".to_string()),
            )
            .await;

        // With 0.5 Qi and 0.5 Qi/min rate, runway is ~60 seconds
        // Should trigger Orange warning
        let warnings = tracker.check_warnings().await;
        assert!(!warnings.is_empty());

        tracker.end_session(session_id).await;
    }
}
