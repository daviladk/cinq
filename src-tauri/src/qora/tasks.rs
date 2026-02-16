//! Task Management for Qora
//!
//! Tasks are stored locally and can be synced across peers.

use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaskStatus {
    Pending,
    InProgress,
    WaitingForInput,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: String,
    pub status: TaskStatus,
    pub created_at: i64,
    pub updated_at: i64,
    pub notes: Vec<String>,
}

impl Task {
    pub fn new(title: &str, description: &str) -> Self {
        let now = Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title: title.to_string(),
            description: description.to_string(),
            status: TaskStatus::Pending,
            created_at: now,
            updated_at: now,
            notes: Vec::new(),
        }
    }

    pub fn add_note(&mut self, note: &str) {
        self.notes.push(note.to_string());
        self.updated_at = Utc::now().timestamp();
    }

    pub fn set_status(&mut self, status: TaskStatus) {
        self.status = status;
        self.updated_at = Utc::now().timestamp();
    }
}

pub struct TaskQueue {
    tasks: Vec<Task>,
    storage_path: PathBuf,
}

impl TaskQueue {
    pub fn new(project_root: &PathBuf) -> Self {
        let storage_path = project_root.join(".qora").join("tasks.json");
        
        let tasks = if storage_path.exists() {
            std::fs::read_to_string(&storage_path)
                .ok()
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default()
        } else {
            Vec::new()
        };

        Self { tasks, storage_path }
    }

    fn save(&self) -> Result<(), String> {
        if let Some(parent) = self.storage_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create .qora directory: {}", e))?;
        }
        
        let json = serde_json::to_string_pretty(&self.tasks)
            .map_err(|e| format!("Failed to serialize tasks: {}", e))?;
        
        std::fs::write(&self.storage_path, json)
            .map_err(|e| format!("Failed to save tasks: {}", e))
    }

    pub fn add(&mut self, title: &str, description: &str) -> Result<Task, String> {
        let task = Task::new(title, description);
        self.tasks.push(task.clone());
        self.save()?;
        Ok(task)
    }

    pub fn list(&self) -> Vec<Task> {
        self.tasks.clone()
    }

    pub fn pending(&self) -> Vec<Task> {
        self.tasks
            .iter()
            .filter(|t| t.status == TaskStatus::Pending)
            .cloned()
            .collect()
    }

    pub fn next(&mut self) -> Option<Task> {
        // Find the index of the first pending task
        let idx = self.tasks.iter().position(|t| t.status == TaskStatus::Pending)?;
        
        // Update status
        self.tasks[idx].set_status(TaskStatus::InProgress);
        let task = self.tasks[idx].clone();
        let _ = self.save();
        
        Some(task)
    }

    pub fn complete(&mut self, id: &str) -> Result<(), String> {
        if let Some(task) = self.tasks.iter_mut().find(|t| t.id == id) {
            task.set_status(TaskStatus::Completed);
            self.save()
        } else {
            Err("Task not found".to_string())
        }
    }

    pub fn fail(&mut self, id: &str, reason: &str) -> Result<(), String> {
        if let Some(task) = self.tasks.iter_mut().find(|t| t.id == id) {
            task.set_status(TaskStatus::Failed);
            task.add_note(&format!("Failed: {}", reason));
            self.save()
        } else {
            Err("Task not found".to_string())
        }
    }

    pub fn waiting_for_input(&mut self, id: &str, question: &str) -> Result<(), String> {
        if let Some(task) = self.tasks.iter_mut().find(|t| t.id == id) {
            task.set_status(TaskStatus::WaitingForInput);
            task.add_note(&format!("Question: {}", question));
            self.save()
        } else {
            Err("Task not found".to_string())
        }
    }

    pub fn get(&self, id: &str) -> Option<Task> {
        self.tasks.iter().find(|t| t.id == id).cloned()
    }

    pub fn update_note(&mut self, id: &str, note: &str) -> Result<(), String> {
        if let Some(task) = self.tasks.iter_mut().find(|t| t.id == id) {
            task.add_note(note);
            self.save()
        } else {
            Err("Task not found".to_string())
        }
    }
}
