// StratumX Client - Connect to local go-quai node's Stratum API
// Fetches mining stats and discovers other miners for chat

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

/// StratumX API base URL (default go-quai stratum port)
const DEFAULT_STRATUM_API: &str = "http://127.0.0.1:3336";

/// Pool-wide statistics from StratumX
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PoolStats {
    pub node_name: Option<String>,
    pub workers_total: u32,
    pub workers_connected: u32,
    pub hashrate: u64,
    pub shares_valid: u64,
    pub shares_stale: u64,
    pub shares_invalid: u64,
    pub blocks_found: u32,
    pub uptime: f64,
    pub sha: Option<AlgorithmStats>,
    pub scrypt: Option<AlgorithmStats>,
    pub kawpow: Option<AlgorithmStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AlgorithmStats {
    pub hashrate: u64,
    pub workers: u32,
}

/// Worker information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Worker {
    pub id: String,
    pub address: String,
    pub worker_name: Option<String>,
    pub algorithm: String,
    pub hashrate: u64,
    pub shares_valid: u64,
    pub shares_invalid: u64,
    pub connected_at: Option<String>,
    pub last_share: Option<String>,
}

/// Block found by this node
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockFound {
    pub height: u64,
    pub hash: String,
    pub algorithm: String,
    pub miner: String,
    pub reward: Option<String>,
    pub timestamp: String,
}

/// Miner-specific stats
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MinerStats {
    pub address: String,
    pub hashrate: u64,
    pub shares_valid: u64,
    pub shares_invalid: u64,
    pub workers: u32,
    pub blocks_found: u32,
}

/// StratumX client for connecting to local go-quai node
pub struct StratumClient {
    base_url: String,
    client: reqwest::Client,
    connected: Arc<RwLock<bool>>,
    last_stats: Arc<RwLock<Option<PoolStats>>>,
}

impl StratumClient {
    pub fn new(base_url: Option<String>) -> Self {
        let url = base_url.unwrap_or_else(|| DEFAULT_STRATUM_API.to_string());
        Self {
            base_url: url,
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(5))
                .build()
                .unwrap_or_default(),
            connected: Arc::new(RwLock::new(false)),
            last_stats: Arc::new(RwLock::new(None)),
        }
    }

    /// Check if StratumX API is available
    pub async fn check_connection(&self) -> bool {
        match self
            .client
            .get(&format!("{}/health", self.base_url))
            .send()
            .await
        {
            Ok(resp) => {
                let ok = resp.status().is_success();
                *self.connected.write().await = ok;
                ok
            }
            Err(_) => {
                *self.connected.write().await = false;
                false
            }
        }
    }

    /// Get pool-wide statistics
    pub async fn get_pool_stats(&self) -> Result<PoolStats, StratumError> {
        let url = format!("{}/api/pool/stats", self.base_url);
        let resp = self.client.get(&url).send().await?;

        if !resp.status().is_success() {
            return Err(StratumError::ApiError(resp.status().to_string()));
        }

        let stats: PoolStats = resp.json().await?;
        *self.last_stats.write().await = Some(stats.clone());
        *self.connected.write().await = true;
        Ok(stats)
    }

    /// Get all connected workers
    pub async fn get_workers(&self) -> Result<Vec<Worker>, StratumError> {
        let url = format!("{}/api/pool/workers", self.base_url);
        let resp = self.client.get(&url).send().await?;

        if !resp.status().is_success() {
            return Err(StratumError::ApiError(resp.status().to_string()));
        }

        let workers: Vec<Worker> = resp.json().await?;
        Ok(workers)
    }

    /// Get blocks found by this node
    pub async fn get_blocks(&self) -> Result<Vec<BlockFound>, StratumError> {
        let url = format!("{}/api/pool/blocks", self.base_url);
        let resp = self.client.get(&url).send().await?;

        if !resp.status().is_success() {
            return Err(StratumError::ApiError(resp.status().to_string()));
        }

        let blocks: Vec<BlockFound> = resp.json().await?;
        Ok(blocks)
    }

    /// Get stats for a specific miner address
    pub async fn get_miner_stats(&self, address: &str) -> Result<MinerStats, StratumError> {
        let url = format!("{}/api/miner/{}/stats", self.base_url, address);
        let resp = self.client.get(&url).send().await?;

        if !resp.status().is_success() {
            return Err(StratumError::ApiError(resp.status().to_string()));
        }

        let stats: MinerStats = resp.json().await?;
        Ok(stats)
    }

    /// Get unique miner addresses from workers (potential chat peers)
    pub async fn get_miner_addresses(&self) -> Result<Vec<String>, StratumError> {
        let workers = self.get_workers().await?;
        let mut addresses: Vec<String> = workers.iter().map(|w| w.address.clone()).collect();
        addresses.sort();
        addresses.dedup();
        Ok(addresses)
    }

    /// Check if connected to StratumX
    pub async fn is_connected(&self) -> bool {
        *self.connected.read().await
    }

    /// Get cached stats (doesn't make API call)
    pub async fn cached_stats(&self) -> Option<PoolStats> {
        self.last_stats.read().await.clone()
    }

    /// Get the base URL
    pub fn base_url(&self) -> &str {
        &self.base_url
    }
}

#[derive(Debug)]
pub enum StratumError {
    NetworkError(reqwest::Error),
    ApiError(String),
    ParseError(String),
}

impl From<reqwest::Error> for StratumError {
    fn from(e: reqwest::Error) -> Self {
        StratumError::NetworkError(e)
    }
}

impl std::fmt::Display for StratumError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StratumError::NetworkError(e) => write!(f, "Network error: {}", e),
            StratumError::ApiError(s) => write!(f, "API error: {}", s),
            StratumError::ParseError(s) => write!(f, "Parse error: {}", s),
        }
    }
}

impl std::error::Error for StratumError {}

/// Serializable response for Tauri commands
#[derive(Debug, Clone, Serialize)]
pub struct StratumStatus {
    pub connected: bool,
    pub node_name: Option<String>,
    pub hashrate: u64,
    pub workers: u32,
    pub blocks_found: u32,
    pub uptime_hours: f64,
}

impl From<&PoolStats> for StratumStatus {
    fn from(stats: &PoolStats) -> Self {
        Self {
            connected: true,
            node_name: stats.node_name.clone(),
            hashrate: stats.hashrate,
            workers: stats.workers_connected,
            blocks_found: stats.blocks_found,
            uptime_hours: stats.uptime / 3600.0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_client_creation() {
        let client = StratumClient::new(None);
        assert_eq!(client.base_url(), DEFAULT_STRATUM_API);
    }

    #[tokio::test]
    async fn test_custom_url() {
        let client = StratumClient::new(Some("http://192.168.1.100:3336".to_string()));
        assert_eq!(client.base_url(), "http://192.168.1.100:3336");
    }
}
