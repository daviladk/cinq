// Cinq File Transfer - Handles file sending and receiving with metrics

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::fs::{self, File};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};

use super::metrics::BandwidthMetrics;

/// Size of chunks for file transfer (64KB)
pub const CHUNK_SIZE: usize = 64 * 1024;

/// Status of a file transfer
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TransferStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Cancelled,
}

/// Direction of the transfer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransferDirection {
    Upload,
    Download,
}

/// Information about an ongoing or completed transfer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferInfo {
    pub id: String,
    pub filename: String,
    pub direction: TransferDirection,
    pub peer_id: String,
    pub total_bytes: u64,
    pub transferred_bytes: u64,
    pub status: TransferStatus,
    pub started_at: u64,
    pub completed_at: Option<u64>,
    pub hash: Option<String>,
    pub error: Option<String>,
}

impl TransferInfo {
    pub fn new(id: String, filename: String, direction: TransferDirection, peer_id: String, total_bytes: u64) -> Self {
        Self {
            id,
            filename,
            direction,
            peer_id,
            total_bytes,
            transferred_bytes: 0,
            status: TransferStatus::Pending,
            started_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            completed_at: None,
            hash: None,
            error: None,
        }
    }

    pub fn progress_percent(&self) -> f32 {
        if self.total_bytes == 0 {
            return 0.0;
        }
        (self.transferred_bytes as f32 / self.total_bytes as f32) * 100.0
    }
}

/// Manages file transfers
pub struct FileTransfer {
    /// Directory to save downloaded files
    download_dir: PathBuf,
    /// Active transfers
    transfers: Arc<RwLock<HashMap<String, TransferInfo>>>,
    /// Reference to bandwidth metrics
    metrics: Arc<RwLock<BandwidthMetrics>>,
}

impl FileTransfer {
    pub fn new(download_dir: impl AsRef<Path>, metrics: Arc<RwLock<BandwidthMetrics>>) -> Self {
        Self {
            download_dir: download_dir.as_ref().to_path_buf(),
            transfers: Arc::new(RwLock::new(HashMap::new())),
            metrics,
        }
    }

    /// Ensure download directory exists
    pub async fn ensure_download_dir(&self) -> Result<(), std::io::Error> {
        fs::create_dir_all(&self.download_dir).await
    }

    /// Read a file and return its contents along with hash
    pub async fn read_file(&self, path: impl AsRef<Path>) -> Result<(Vec<u8>, String, u64), std::io::Error> {
        let path = path.as_ref();
        let mut file = File::open(path).await?;
        let metadata = file.metadata().await?;
        let size = metadata.len();

        let mut contents = Vec::with_capacity(size as usize);
        file.read_to_end(&mut contents).await?;

        // Calculate SHA256 hash
        let mut hasher = Sha256::new();
        hasher.update(&contents);
        let hash = format!("{:x}", hasher.finalize());

        Ok((contents, hash, size))
    }

    /// Save received file data
    pub async fn save_file(
        &self,
        filename: &str,
        data: &[u8],
        peer_id: &str,
    ) -> Result<TransferInfo, std::io::Error> {
        self.ensure_download_dir().await?;

        // Generate unique filename if it exists
        let mut save_path = self.download_dir.join(filename);
        let mut counter = 1;
        while save_path.exists() {
            let stem = Path::new(filename)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("file");
            let ext = Path::new(filename)
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("");
            
            if ext.is_empty() {
                save_path = self.download_dir.join(format!("{}_{}", stem, counter));
            } else {
                save_path = self.download_dir.join(format!("{}_{}.{}", stem, counter, ext));
            }
            counter += 1;
        }

        // Write file
        let mut file = File::create(&save_path).await?;
        file.write_all(data).await?;
        file.flush().await?;

        let size = data.len() as u64;

        // Calculate hash of received data
        let mut hasher = Sha256::new();
        hasher.update(data);
        let hash = format!("{:x}", hasher.finalize());

        // Update metrics
        {
            let mut metrics = self.metrics.write().await;
            metrics.record_received(peer_id, size);
        }

        // Create transfer info
        let transfer_id = uuid::Uuid::new_v4().to_string();
        let mut transfer = TransferInfo::new(
            transfer_id.clone(),
            save_path.file_name().unwrap().to_string_lossy().to_string(),
            TransferDirection::Download,
            peer_id.to_string(),
            size,
        );
        transfer.transferred_bytes = size;
        transfer.status = TransferStatus::Completed;
        transfer.hash = Some(hash);
        transfer.completed_at = Some(
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        );

        // Store transfer record
        {
            let mut transfers = self.transfers.write().await;
            transfers.insert(transfer_id.clone(), transfer.clone());
        }

        log::info!(
            "Saved file '{}' from peer {} ({} bytes)",
            save_path.display(),
            peer_id,
            size
        );

        Ok(transfer)
    }

    /// Record bytes sent for metrics
    pub async fn record_sent(&self, peer_id: &str, bytes: u64) {
        let mut metrics = self.metrics.write().await;
        metrics.record_sent(peer_id, bytes);
    }

    /// Create a new outgoing transfer record
    pub async fn create_upload_transfer(
        &self,
        filename: &str,
        peer_id: &str,
        total_bytes: u64,
    ) -> TransferInfo {
        let transfer_id = uuid::Uuid::new_v4().to_string();
        let transfer = TransferInfo::new(
            transfer_id.clone(),
            filename.to_string(),
            TransferDirection::Upload,
            peer_id.to_string(),
            total_bytes,
        );

        let mut transfers = self.transfers.write().await;
        transfers.insert(transfer_id, transfer.clone());

        transfer
    }

    /// Update transfer progress
    pub async fn update_progress(&self, transfer_id: &str, bytes_transferred: u64) {
        let mut transfers = self.transfers.write().await;
        if let Some(transfer) = transfers.get_mut(transfer_id) {
            transfer.transferred_bytes = bytes_transferred;
            transfer.status = TransferStatus::InProgress;
        }
    }

    /// Mark transfer as complete
    pub async fn complete_transfer(&self, transfer_id: &str, hash: Option<String>) {
        let mut transfers = self.transfers.write().await;
        if let Some(transfer) = transfers.get_mut(transfer_id) {
            transfer.status = TransferStatus::Completed;
            transfer.hash = hash;
            transfer.completed_at = Some(
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            );
        }
    }

    /// Mark transfer as failed
    pub async fn fail_transfer(&self, transfer_id: &str, error: String) {
        let mut transfers = self.transfers.write().await;
        if let Some(transfer) = transfers.get_mut(transfer_id) {
            transfer.status = TransferStatus::Failed;
            transfer.error = Some(error);
        }
    }

    /// Get all transfers
    pub async fn get_transfers(&self) -> Vec<TransferInfo> {
        let transfers = self.transfers.read().await;
        transfers.values().cloned().collect()
    }

    /// Get a specific transfer
    pub async fn get_transfer(&self, id: &str) -> Option<TransferInfo> {
        let transfers = self.transfers.read().await;
        transfers.get(id).cloned()
    }

    /// Get transfers for a specific peer
    pub async fn get_peer_transfers(&self, peer_id: &str) -> Vec<TransferInfo> {
        let transfers = self.transfers.read().await;
        transfers
            .values()
            .filter(|t| t.peer_id == peer_id)
            .cloned()
            .collect()
    }

    /// Clear completed transfers
    pub async fn clear_completed(&self) {
        let mut transfers = self.transfers.write().await;
        transfers.retain(|_, t| t.status != TransferStatus::Completed);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_save_and_read_file() {
        let dir = tempdir().unwrap();
        let metrics = Arc::new(RwLock::new(BandwidthMetrics::new()));
        let transfer = FileTransfer::new(dir.path(), metrics);

        let data = b"Hello, Cinq Connect!";
        let info = transfer.save_file("test.txt", data, "peer123").await.unwrap();

        assert_eq!(info.status, TransferStatus::Completed);
        assert_eq!(info.transferred_bytes, data.len() as u64);
        assert!(info.hash.is_some());
    }
}
