//! Storage Worker - Handles file storage and message history
//!
//! Responsible for:
//! - Local SQLite storage (free)
//! - Cloud backup coordination
//! - Message transcript management
//! - File chunking and retrieval

use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};

use super::{Worker, WorkerResult};

/// Stored file metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredFile {
    pub id: String,
    pub name: String,
    pub size_bytes: u64,
    pub mime_type: String,
    pub created_at: i64,
    pub location: FileLocation,
    pub encrypted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum FileLocation {
    /// Only on local device
    Local,
    /// Local + cloud backup
    CloudBackup,
    /// Only in cloud (local deleted)
    CloudOnly,
}

/// Message storage entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredMessage {
    pub id: String,
    pub conversation_id: String,
    pub sender_id: String,
    pub content: String,
    pub timestamp: i64,
    pub encrypted: bool,
}

/// Storage worker state
pub struct StorageWorker {
    /// Base path for local storage
    data_dir: PathBuf,
    /// Stored files metadata (in-memory cache)
    files: Arc<RwLock<Vec<StoredFile>>>,
    /// Message storage (simplified - would be SQLite in production)
    messages: Arc<RwLock<Vec<StoredMessage>>>,
    /// Cloud backup enabled
    cloud_enabled: Arc<RwLock<bool>>,
    /// Total local storage used (bytes)
    local_bytes_used: Arc<RwLock<u64>>,
    /// Total cloud storage used (bytes)
    cloud_bytes_used: Arc<RwLock<u64>>,
}

impl StorageWorker {
    pub fn new(data_dir: PathBuf) -> Self {
        Self {
            data_dir,
            files: Arc::new(RwLock::new(Vec::new())),
            messages: Arc::new(RwLock::new(Vec::new())),
            cloud_enabled: Arc::new(RwLock::new(false)),
            local_bytes_used: Arc::new(RwLock::new(0)),
            cloud_bytes_used: Arc::new(RwLock::new(0)),
        }
    }
    
    /// Enable/disable cloud backup
    pub async fn set_cloud_enabled(&self, enabled: bool) {
        *self.cloud_enabled.write().await = enabled;
    }
    
    /// Check if cloud backup is enabled
    pub async fn is_cloud_enabled(&self) -> bool {
        *self.cloud_enabled.read().await
    }
    
    /// Get storage stats
    pub async fn get_storage_stats(&self) -> (u64, u64) {
        let local = *self.local_bytes_used.read().await;
        let cloud = *self.cloud_bytes_used.read().await;
        (local, cloud)
    }
    
    /// Store a message locally (always free)
    pub async fn store_message(
        &self,
        conversation_id: &str,
        sender_id: &str,
        content: &str,
    ) -> WorkerResult {
        let msg = StoredMessage {
            id: uuid::Uuid::new_v4().to_string(),
            conversation_id: conversation_id.to_string(),
            sender_id: sender_id.to_string(),
            content: content.to_string(),
            timestamp: chrono::Utc::now().timestamp(),
            encrypted: true,
        };
        
        let size = content.len() as u64;
        
        // Add to local storage
        self.messages.write().await.push(msg);
        *self.local_bytes_used.write().await += size;
        
        // If cloud backup enabled, also queue for sync
        let cloud_cost = if *self.cloud_enabled.read().await {
            *self.cloud_bytes_used.write().await += size;
            // Storage cost per GB per day, prorated
            let gb = size as f64 / (1024.0 * 1024.0 * 1024.0);
            gb * 0.001 // storage_per_gb_day rate
        } else {
            0.0
        };
        
        WorkerResult::ok("Message stored")
            .with_bytes(size)
            .with_cost(cloud_cost)
    }
    
    /// Search messages
    pub async fn search_messages(&self, query: &str) -> WorkerResult {
        let messages = self.messages.read().await;
        let query_lower = query.to_lowercase();
        
        let results: Vec<_> = messages
            .iter()
            .filter(|m| m.content.to_lowercase().contains(&query_lower))
            .cloned()
            .collect();
        
        let count = results.len();
        
        WorkerResult::ok(format!("Found {} messages", count))
            .with_data(serde_json::json!({
                "count": count,
                "results": results.iter().take(50).collect::<Vec<_>>(), // Limit to 50
            }))
    }
    
    /// Get messages for a conversation
    pub async fn get_conversation_messages(&self, conversation_id: &str) -> Vec<StoredMessage> {
        let messages = self.messages.read().await;
        messages
            .iter()
            .filter(|m| m.conversation_id == conversation_id)
            .cloned()
            .collect()
    }
    
    /// Store a file locally
    pub async fn store_file_local(
        &self,
        name: &str,
        data: &[u8],
        mime_type: &str,
    ) -> WorkerResult {
        let file = StoredFile {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.to_string(),
            size_bytes: data.len() as u64,
            mime_type: mime_type.to_string(),
            created_at: chrono::Utc::now().timestamp(),
            location: FileLocation::Local,
            encrypted: true,
        };
        
        let id = file.id.clone();
        let size = file.size_bytes;
        
        // In production: actually write to disk
        // let path = self.data_dir.join("files").join(&file.id);
        // tokio::fs::write(&path, data).await?;
        
        self.files.write().await.push(file);
        *self.local_bytes_used.write().await += size;
        
        WorkerResult::ok(format!("File stored: {}", name))
            .with_bytes(size)
            .with_cost(0.0) // Local storage is free
            .with_data(serde_json::json!({ "file_id": id }))
    }
    
    /// Upload file to cloud (incurs cost)
    pub async fn upload_to_cloud(&self, file_id: &str) -> WorkerResult {
        let mut files = self.files.write().await;
        
        if let Some(file) = files.iter_mut().find(|f| f.id == file_id) {
            if file.location == FileLocation::CloudBackup || file.location == FileLocation::CloudOnly {
                return WorkerResult::err("File already in cloud");
            }
            
            let size = file.size_bytes;
            
            // Update location
            file.location = FileLocation::CloudBackup;
            
            // Calculate upload cost (bandwidth) + storage initiation
            let mb = size as f64 / (1024.0 * 1024.0);
            let bandwidth_cost = mb * 0.01; // file_per_mb rate
            
            *self.cloud_bytes_used.write().await += size;
            
            WorkerResult::ok(format!("Uploaded {} to cloud", file.name))
                .with_bytes(size)
                .with_cost(bandwidth_cost)
                .with_data(serde_json::json!({
                    "file_id": file_id,
                    "size_mb": mb,
                }))
        } else {
            WorkerResult::err("File not found")
        }
    }
    
    /// Download file from cloud
    pub async fn download_from_cloud(&self, file_id: &str) -> WorkerResult {
        let files = self.files.read().await;
        
        if let Some(file) = files.iter().find(|f| f.id == file_id) {
            if file.location == FileLocation::Local {
                return WorkerResult::ok("File already local")
                    .with_data(serde_json::json!({ "file_id": file_id }));
            }
            
            // Download is free (storage providers eat the bandwidth cost)
            WorkerResult::ok(format!("Downloaded {}", file.name))
                .with_bytes(file.size_bytes)
                .with_cost(0.0)
                .with_data(serde_json::json!({
                    "file_id": file_id,
                    "name": file.name,
                }))
        } else {
            WorkerResult::err("File not found")
        }
    }
    
    /// List stored files
    pub async fn list_files(&self) -> Vec<StoredFile> {
        self.files.read().await.clone()
    }
    
    /// Delete a file
    pub async fn delete_file(&self, file_id: &str, delete_cloud: bool) -> WorkerResult {
        let mut files = self.files.write().await;
        
        if let Some(pos) = files.iter().position(|f| f.id == file_id) {
            let file = files.remove(pos);
            
            // Update storage tracking
            if file.location != FileLocation::CloudOnly {
                let mut local = self.local_bytes_used.write().await;
                *local = local.saturating_sub(file.size_bytes);
            }
            
            if delete_cloud && (file.location == FileLocation::CloudBackup || file.location == FileLocation::CloudOnly) {
                let mut cloud = self.cloud_bytes_used.write().await;
                *cloud = cloud.saturating_sub(file.size_bytes);
            }
            
            WorkerResult::ok(format!("Deleted {}", file.name))
        } else {
            WorkerResult::err("File not found")
        }
    }
    
    /// Calculate ongoing storage cost (per day)
    pub async fn calculate_daily_storage_cost(&self) -> f64 {
        let cloud = *self.cloud_bytes_used.read().await;
        let gb = cloud as f64 / (1024.0 * 1024.0 * 1024.0);
        gb * 0.001 // storage_per_gb_day rate
    }
}

impl Worker for StorageWorker {
    fn name(&self) -> &'static str {
        "storage"
    }
    
    async fn health_check(&self) -> bool {
        // Check if data directory exists
        self.data_dir.exists()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    
    #[tokio::test]
    async fn test_store_message() {
        let worker = StorageWorker::new(PathBuf::from("/tmp/cinq-test"));
        
        let result = worker.store_message("conv1", "alice", "hello").await;
        assert!(result.success);
        assert!(result.bytes_processed > 0);
    }
    
    #[tokio::test]
    async fn test_search_messages() {
        let worker = StorageWorker::new(PathBuf::from("/tmp/cinq-test"));
        
        worker.store_message("conv1", "alice", "hello world").await;
        worker.store_message("conv1", "bob", "hello there").await;
        worker.store_message("conv1", "alice", "goodbye").await;
        
        let result = worker.search_messages("hello").await;
        assert!(result.success);
        
        let data = result.data.unwrap();
        assert_eq!(data["count"], 2);
    }
    
    #[tokio::test]
    async fn test_file_storage() {
        let worker = StorageWorker::new(PathBuf::from("/tmp/cinq-test"));
        
        let data = b"test file content";
        let result = worker.store_file_local("test.txt", data, "text/plain").await;
        
        assert!(result.success);
        assert_eq!(result.qi_cost, 0.0); // Local is free
    }
}
