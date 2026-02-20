//! Payment Worker - Handles Qi accounting and settlement
//!
//! Responsible for:
//! - Tracking session costs
//! - Preparing payment requests for Pelagus
//! - Managing prepaid balances
//! - Settlement batching

use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};

use super::{Worker, WorkerResult};
use crate::swarm::tracker::UsageTracker;
use crate::swarm::costs::ActionType;

/// A pending payment to be settled
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingPayment {
    pub id: String,
    pub recipient_id: String,
    pub amount_qi: f64,
    pub reason: String,
    pub created_at: i64,
    pub status: PaymentStatus,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum PaymentStatus {
    /// Waiting to be batched
    Pending,
    /// Sent to Pelagus for signing
    AwaitingSignature,
    /// Submitted to network
    Submitted,
    /// Confirmed on-chain
    Confirmed,
    /// Failed
    Failed,
}

/// Session cost summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSummary {
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub total_qi_spent: f64,
    pub breakdown: Vec<CostBreakdown>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostBreakdown {
    pub action_type: String,
    pub units: f64,
    pub unit_name: String,
    pub cost_qi: f64,
}

/// Payment worker state
pub struct PaymentWorker {
    /// Reference to the usage tracker
    tracker: Arc<UsageTracker>,
    /// Pending payments queue
    pending_payments: Arc<RwLock<Vec<PendingPayment>>>,
    /// Current session summary
    current_session: Arc<RwLock<Option<SessionSummary>>>,
    /// Settlement threshold (batch when this is reached)
    settlement_threshold: f64,
}

impl PaymentWorker {
    pub fn new(tracker: Arc<UsageTracker>) -> Self {
        Self {
            tracker,
            pending_payments: Arc::new(RwLock::new(Vec::new())),
            current_session: Arc::new(RwLock::new(None)),
            settlement_threshold: 1.0, // Settle when 1 Qi accumulated
        }
    }
    
    /// Start a new billing session
    pub async fn start_session(&self) -> WorkerResult {
        let session = SessionSummary {
            started_at: chrono::Utc::now().timestamp(),
            ended_at: None,
            total_qi_spent: 0.0,
            breakdown: Vec::new(),
        };
        
        *self.current_session.write().await = Some(session);
        
        WorkerResult::ok("Session started")
    }
    
    /// Record a cost to the current session
    pub async fn record_cost(
        &self,
        action_type: ActionType,
        units: f64,
        cost: f64,
    ) -> WorkerResult {
        let mut session = self.current_session.write().await;
        
        if let Some(ref mut s) = *session {
            // Add to breakdown
            s.breakdown.push(CostBreakdown {
                action_type: action_type.display_name().to_string(),
                units,
                unit_name: action_type.unit().to_string(),
                cost_qi: cost,
            });
            
            s.total_qi_spent += cost;
            
            // Check if we should settle
            let should_settle = s.total_qi_spent >= self.settlement_threshold;
            
            if should_settle {
                // In production: trigger Pelagus payment flow
                log::info!("Settlement threshold reached: {:.4} Qi", s.total_qi_spent);
            }
            
            WorkerResult::ok(format!("Recorded {:.4} Qi", cost))
                .with_cost(cost)
                .with_data(serde_json::json!({
                    "action": action_type.display_name(),
                    "units": units,
                    "cost": cost,
                    "session_total": s.total_qi_spent,
                }))
        } else {
            WorkerResult::err("No active session")
        }
    }
    
    /// Get current session summary
    pub async fn get_session_summary(&self) -> Option<SessionSummary> {
        self.current_session.read().await.clone()
    }
    
    /// End the current session and prepare settlement
    pub async fn end_session(&self) -> WorkerResult {
        let mut session = self.current_session.write().await;
        
        if let Some(ref mut s) = *session {
            s.ended_at = Some(chrono::Utc::now().timestamp());
            
            let summary = s.clone();
            let total = summary.total_qi_spent;
            
            // Clear session
            *session = None;
            
            // Queue payment if there's anything to settle
            if total > 0.0 {
                drop(session);
                
                let payment = PendingPayment {
                    id: uuid::Uuid::new_v4().to_string(),
                    recipient_id: "network".to_string(), // Would be actual provider IDs
                    amount_qi: total,
                    reason: format!("Session settlement: {} items", summary.breakdown.len()),
                    created_at: chrono::Utc::now().timestamp(),
                    status: PaymentStatus::Pending,
                };
                
                self.pending_payments.write().await.push(payment);
            }
            
            WorkerResult::ok(format!("Session ended. Total: {:.4} Qi", total))
                .with_cost(total)
                .with_data(serde_json::json!(summary))
        } else {
            WorkerResult::err("No active session")
        }
    }
    
    /// Get pending payments
    pub async fn get_pending_payments(&self) -> Vec<PendingPayment> {
        self.pending_payments.read().await.clone()
    }
    
    /// Get total pending amount
    pub async fn get_pending_total(&self) -> f64 {
        self.pending_payments
            .read()
            .await
            .iter()
            .filter(|p| p.status == PaymentStatus::Pending)
            .map(|p| p.amount_qi)
            .sum()
    }
    
    /// Prepare payment for Pelagus signing
    /// Returns payment data that frontend can pass to Pelagus
    pub async fn prepare_settlement(&self, payment_id: &str) -> WorkerResult {
        let mut payments = self.pending_payments.write().await;
        
        if let Some(payment) = payments.iter_mut().find(|p| p.id == payment_id) {
            payment.status = PaymentStatus::AwaitingSignature;
            
            // Prepare Pelagus-compatible transaction data
            // This would be actual Quai transaction parameters
            let tx_data = serde_json::json!({
                "to": "0x...", // Provider's Quai address
                "value": payment.amount_qi,
                "data": format!("cinq:settlement:{}", payment.id),
            });
            
            WorkerResult::ok("Payment prepared")
                .with_cost(payment.amount_qi)
                .with_data(serde_json::json!({
                    "payment_id": payment.id,
                    "amount_qi": payment.amount_qi,
                    "tx_data": tx_data,
                }))
        } else {
            WorkerResult::err("Payment not found")
        }
    }
    
    /// Confirm payment was submitted (called after Pelagus signs)
    pub async fn confirm_submitted(&self, payment_id: &str, tx_hash: &str) -> WorkerResult {
        let mut payments = self.pending_payments.write().await;
        
        if let Some(payment) = payments.iter_mut().find(|p| p.id == payment_id) {
            payment.status = PaymentStatus::Submitted;
            
            WorkerResult::ok("Payment submitted")
                .with_data(serde_json::json!({
                    "payment_id": payment.id,
                    "tx_hash": tx_hash,
                }))
        } else {
            WorkerResult::err("Payment not found")
        }
    }
    
    /// Check current balance from tracker
    pub async fn get_balance(&self) -> f64 {
        self.tracker.get_balance().await
    }
    
    /// Check if balance is sufficient for action
    pub async fn can_afford(&self, estimated_cost: f64) -> bool {
        self.get_balance().await >= estimated_cost
    }
    
    /// Get cost estimate for an action
    pub fn estimate_cost(&self, action_type: ActionType, units: f64) -> f64 {
        self.tracker.cost_table().calculate(action_type, units)
    }
    
    /// Set settlement threshold
    pub fn set_settlement_threshold(&mut self, threshold: f64) {
        self.settlement_threshold = threshold;
    }
}

impl Worker for PaymentWorker {
    fn name(&self) -> &'static str {
        "payment"
    }
    
    async fn health_check(&self) -> bool {
        true // Pure Rust, always healthy
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_session_flow() {
        let tracker = Arc::new(UsageTracker::new(100.0));
        let worker = PaymentWorker::new(tracker);
        
        // Start session
        let result = worker.start_session().await;
        assert!(result.success);
        
        // Record some costs
        worker.record_cost(ActionType::Message, 1.0, 0.001).await;
        worker.record_cost(ActionType::VoiceCall, 5.0, 0.25).await;
        
        // Check summary
        let summary = worker.get_session_summary().await.unwrap();
        assert_eq!(summary.breakdown.len(), 2);
        assert!((summary.total_qi_spent - 0.251).abs() < 0.0001);
        
        // End session
        let result = worker.end_session().await;
        assert!(result.success);
        
        // Check pending payment
        let pending = worker.get_pending_payments().await;
        assert_eq!(pending.len(), 1);
    }
    
    #[tokio::test]
    async fn test_balance_check() {
        let tracker = Arc::new(UsageTracker::new(50.0));
        let worker = PaymentWorker::new(tracker);
        
        assert_eq!(worker.get_balance().await, 50.0);
        assert!(worker.can_afford(10.0).await);
        assert!(!worker.can_afford(100.0).await);
    }
}
