//! Cost Tables for Qi Pricing
//! 
//! Defines the Qi rates for all metered actions in the cinQ network.
//! 1 Qi ≈ 1 GB of data transfer or 1 TeraFLOP of compute.

use serde::{Deserialize, Serialize};

/// Types of actions that consume Qi
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ActionType {
    /// Text message (per KB)
    Message,
    /// File transfer (per MB)
    FileTransfer,
    /// Voice call (per minute)
    VoiceCall,
    /// Video call (per minute)  
    VideoCall,
    /// AI inference (per 1K tokens)
    Inference,
    /// Compute job (per TeraFLOP)
    Compute,
    /// Storage (per GB per day)
    Storage,
}

impl ActionType {
    /// Human-readable name for the action type
    pub fn display_name(&self) -> &'static str {
        match self {
            ActionType::Message => "Message",
            ActionType::FileTransfer => "File Transfer",
            ActionType::VoiceCall => "Voice Call",
            ActionType::VideoCall => "Video Call",
            ActionType::Inference => "AI Query",
            ActionType::Compute => "Compute Job",
            ActionType::Storage => "Storage",
        }
    }
    
    /// Unit of measurement for this action
    pub fn unit(&self) -> &'static str {
        match self {
            ActionType::Message => "KB",
            ActionType::FileTransfer => "MB",
            ActionType::VoiceCall => "minute",
            ActionType::VideoCall => "minute",
            ActionType::Inference => "1K tokens",
            ActionType::Compute => "TFLOP",
            ActionType::Storage => "GB/day",
        }
    }
}

/// Qi cost rates for different action types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostTable {
    /// Qi per KB for messages
    pub message_per_kb: f64,
    /// Qi per MB for file transfers
    pub file_per_mb: f64,
    /// Qi per minute for voice calls
    pub voice_per_min: f64,
    /// Qi per minute for video calls
    pub video_per_min: f64,
    /// Qi per 1K tokens for inference
    pub inference_per_1k_tokens: f64,
    /// Qi per TeraFLOP for compute
    pub compute_per_tflop: f64,
    /// Qi per GB per day for storage
    pub storage_per_gb_day: f64,
}

impl Default for CostTable {
    fn default() -> Self {
        Self {
            // ~0.001 Qi per message (assuming 1KB avg)
            message_per_kb: 0.001,
            // ~0.01 Qi per MB file transfer
            file_per_mb: 0.01,
            // ~0.05 Qi per minute voice (low bandwidth)
            voice_per_min: 0.05,
            // ~0.5 Qi per minute video (high bandwidth)
            video_per_min: 0.5,
            // ~0.01 Qi per 1K tokens inference
            inference_per_1k_tokens: 0.01,
            // ~1.0 Qi per TeraFLOP compute
            compute_per_tflop: 1.0,
            // ~0.001 Qi per GB per day storage
            storage_per_gb_day: 0.001,
        }
    }
}

impl CostTable {
    /// Calculate Qi cost for an action
    pub fn calculate(&self, action_type: ActionType, units: f64) -> f64 {
        let rate = match action_type {
            ActionType::Message => self.message_per_kb,
            ActionType::FileTransfer => self.file_per_mb,
            ActionType::VoiceCall => self.voice_per_min,
            ActionType::VideoCall => self.video_per_min,
            ActionType::Inference => self.inference_per_1k_tokens,
            ActionType::Compute => self.compute_per_tflop,
            ActionType::Storage => self.storage_per_gb_day,
        };
        rate * units
    }
    
    /// Get the rate for an action type
    pub fn rate(&self, action_type: ActionType) -> f64 {
        match action_type {
            ActionType::Message => self.message_per_kb,
            ActionType::FileTransfer => self.file_per_mb,
            ActionType::VoiceCall => self.voice_per_min,
            ActionType::VideoCall => self.video_per_min,
            ActionType::Inference => self.inference_per_1k_tokens,
            ActionType::Compute => self.compute_per_tflop,
            ActionType::Storage => self.storage_per_gb_day,
        }
    }
    
    /// Estimate runway (time/units remaining) given current balance
    pub fn estimate_runway(&self, action_type: ActionType, balance: f64) -> f64 {
        let rate = self.rate(action_type);
        if rate > 0.0 {
            balance / rate
        } else {
            f64::INFINITY
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_cost_calculation() {
        let table = CostTable::default();
        
        // 1KB message = 0.001 Qi
        assert_eq!(table.calculate(ActionType::Message, 1.0), 0.001);
        
        // 100MB file = 1.0 Qi
        assert_eq!(table.calculate(ActionType::FileTransfer, 100.0), 1.0);
        
        // 10 min video call = 5.0 Qi
        assert_eq!(table.calculate(ActionType::VideoCall, 10.0), 5.0);
    }
    
    #[test]
    fn test_runway_estimation() {
        let table = CostTable::default();
        
        // With 2.5 Qi, video call runway = 5 minutes
        assert_eq!(table.estimate_runway(ActionType::VideoCall, 2.5), 5.0);
        
        // With 1.0 Qi, voice call runway = 20 minutes
        assert_eq!(table.estimate_runway(ActionType::VoiceCall, 1.0), 20.0);
    }
}
