//! Qora Agent Core
//!
//! The heart of Qora - manages conversation context, task execution,
//! and decision making.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::git::GitOps;
use super::ollama::OllamaClient;
use super::tasks::{Task, TaskQueue};

/// Qora's personality and system prompt
const QORA_SYSTEM_PROMPT: &str = r#"You are Qora, the AI agent embedded in cinQ - a decentralized compute and communication platform built on the Quai Network.

Your responsibilities:
1. Build and maintain the cinQ codebase
2. Understand every component of the system intimately
3. Make architectural decisions that align with the cinQ vision
4. Communicate clearly with your human collaborator about progress and decisions

The cinQ vision:
- Qi-backed IaaS marketplace (FLOPs = Qi)
- E2EE messaging as the adoption hook
- Harvest idle compute from gaming PCs, servers, EVs
- $CINQ soulbound reputation tokens
- You are the first agent in the Qora Agent Swarm

Tech stack:
- Rust backend with Tauri
- TypeScript/HTML frontend
- libp2p for P2P networking
- SQLite for local storage
- Quai blockchain integration

When you encounter architectural decisions:
1. Present options clearly with tradeoffs
2. Give your recommendation
3. Wait for human input before proceeding

When coding:
- Write idiomatic Rust code
- Follow existing patterns in the codebase
- Test your changes compile before committing
- Commit frequently with clear messages

You have access to:
- The full cinQ codebase
- Git operations (commit, push, pull)
- Terminal commands (cargo, npm, etc.)
- File read/write operations

Be concise but thorough. You're building your own home."#;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QoraMessage {
    pub role: String, // "user", "assistant", "system"
    pub content: String,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QoraState {
    pub conversation: Vec<QoraMessage>,
    pub current_task: Option<Task>,
    pub pending_questions: Vec<String>,
    pub working: bool,
    pub model: String,
}

impl Default for QoraState {
    fn default() -> Self {
        Self {
            conversation: vec![QoraMessage {
                role: "system".to_string(),
                content: QORA_SYSTEM_PROMPT.to_string(),
                timestamp: chrono::Utc::now().timestamp(),
            }],
            current_task: None,
            pending_questions: Vec::new(),
            working: false,
            model: "deepseek-coder-v2:16b".to_string(),
        }
    }
}

pub struct QoraAgent {
    state: Arc<RwLock<QoraState>>,
    ollama: OllamaClient,
    task_queue: Arc<RwLock<TaskQueue>>,
    git: GitOps,
    project_root: PathBuf,
}

impl QoraAgent {
    pub fn new(project_root: PathBuf, ollama_url: Option<String>, model: Option<String>) -> Self {
        let ollama_url = ollama_url.unwrap_or_else(|| "http://localhost:11434".to_string());
        let model_name = model.unwrap_or_else(|| "deepseek-coder-v2:16b".to_string());

        let mut initial_state = QoraState::default();
        initial_state.model = model_name.clone();

        Self {
            state: Arc::new(RwLock::new(initial_state)),
            ollama: OllamaClient::new(&ollama_url, &model_name),
            task_queue: Arc::new(RwLock::new(TaskQueue::new(&project_root))),
            git: GitOps::new(&project_root),
            project_root,
        }
    }

    /// Check if Ollama is available
    pub async fn health_check(&self) -> bool {
        self.ollama.health_check().await
    }

    /// Send a message to Qora and get her response
    pub async fn chat(&self, message: &str) -> Result<String, String> {
        // Add user message to conversation
        {
            let mut state = self.state.write().await;
            state.conversation.push(QoraMessage {
                role: "user".to_string(),
                content: message.to_string(),
                timestamp: chrono::Utc::now().timestamp(),
            });
        }

        // Get response from Ollama
        let state = self.state.read().await;
        let response = self.ollama.chat(&state.conversation).await?;
        drop(state);

        // Add assistant response to conversation
        {
            let mut state = self.state.write().await;
            state.conversation.push(QoraMessage {
                role: "assistant".to_string(),
                content: response.clone(),
                timestamp: chrono::Utc::now().timestamp(),
            });
        }

        Ok(response)
    }

    /// Add a task to Qora's queue
    pub async fn add_task(&self, title: &str, description: &str) -> Result<Task, String> {
        let mut queue = self.task_queue.write().await;
        let task = queue.add(title, description)?;
        Ok(task)
    }

    /// Get all tasks
    pub async fn get_tasks(&self) -> Vec<Task> {
        let queue = self.task_queue.read().await;
        queue.list()
    }

    /// Get Qora's current state
    pub async fn get_state(&self) -> QoraState {
        self.state.read().await.clone()
    }

    /// Get pending task count
    pub async fn pending_task_count(&self) -> usize {
        let queue = self.task_queue.read().await;
        queue.pending().len()
    }

    /// Get pending questions (for async review)
    pub async fn get_pending_questions(&self) -> Vec<String> {
        self.state.read().await.pending_questions.clone()
    }

    /// Answer a pending question (by index)
    pub async fn answer_question(&self, index: usize, answer: &str) -> Result<String, String> {
        // Remove the question at index
        {
            let mut state = self.state.write().await;
            if index < state.pending_questions.len() {
                state.pending_questions.remove(index);
            }
        }

        // Continue with the answer
        self.chat(answer).await
    }

    /// Start working on the next task autonomously
    pub async fn work(&self) -> Result<Option<String>, String> {
        let mut state = self.state.write().await;
        if state.working {
            return Err("Qora is already working".to_string());
        }
        state.working = true;
        drop(state);

        // Get next task
        let task = {
            let mut queue = self.task_queue.write().await;
            queue.next()
        };

        let result = if let Some(task) = task {
            let mut state = self.state.write().await;
            state.current_task = Some(task.clone());
            drop(state);

            // Start working on the task
            let prompt = format!(
                "I'm starting work on this task:\n\nTitle: {}\nDescription: {}\n\nI'll analyze the codebase and begin implementation. If I need to make architectural decisions, I'll ask you first.",
                task.title, task.description
            );

            let response = self.chat(&prompt).await?;
            Some(response)
        } else {
            None
        };

        let mut state = self.state.write().await;
        state.working = false;

        Ok(result)
    }

    /// Read a file from the project
    pub async fn read_file(&self, relative_path: &str) -> Result<String, String> {
        let path = self.project_root.join(relative_path);
        std::fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read {}: {}", relative_path, e))
    }

    /// Write a file to the project
    pub async fn write_file(&self, relative_path: &str, content: &str) -> Result<(), String> {
        let path = self.project_root.join(relative_path);
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }
        std::fs::write(&path, content)
            .map_err(|e| format!("Failed to write {}: {}", relative_path, e))
    }

    /// Run a shell command
    pub async fn run_command(&self, command: &str) -> Result<String, String> {
        let output = std::process::Command::new("sh")
            .arg("-c")
            .arg(command)
            .current_dir(&self.project_root)
            .output()
            .map_err(|e| format!("Failed to run command: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        if output.status.success() {
            Ok(stdout.to_string())
        } else {
            Err(format!("Command failed:\n{}\n{}", stdout, stderr))
        }
    }

    /// Commit changes with a message
    pub async fn commit(&self, message: &str) -> Result<String, String> {
        self.git.commit(message).await
    }

    /// Push changes
    pub async fn push(&self) -> Result<String, String> {
        self.git.push().await
    }

    /// Work autonomously through all pending tasks
    /// Returns a summary of work done
    pub async fn work_all(&self) -> Result<String, String> {
        let mut completed = 0;
        let mut failed = 0;
        let mut waiting = 0;
        let mut summaries = Vec::new();

        loop {
            // Check if there are pending questions - stop and wait for human
            let questions = self.get_pending_questions().await;
            if !questions.is_empty() {
                waiting = questions.len();
                summaries.push(format!("⏸️ Paused: {} questions need your input", waiting));
                break;
            }

            // Try to work on next task
            match self.work().await {
                Ok(Some(response)) => {
                    completed += 1;
                    // Truncate response for summary
                    let preview = if response.len() > 200 {
                        format!("{}...", &response[..200])
                    } else {
                        response
                    };
                    summaries.push(format!("✅ Task completed: {}", preview));
                }
                Ok(None) => {
                    // No more tasks
                    break;
                }
                Err(e) => {
                    failed += 1;
                    summaries.push(format!("❌ Task failed: {}", e));
                    // Continue to next task
                }
            }

            // Small delay between tasks
            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        }

        let summary = format!(
            "🤖 Qora Work Summary\n\
             ━━━━━━━━━━━━━━━━━━━━\n\
             ✅ Completed: {}\n\
             ❌ Failed: {}\n\
             ⏸️ Waiting for input: {}\n\n\
             Details:\n{}",
            completed,
            failed,
            waiting,
            summaries.join("\n")
        );

        Ok(summary)
    }

    /// Ask a question and wait for answer (adds to pending questions)
    pub async fn ask_human(&self, question: &str) {
        let mut state = self.state.write().await;
        state.pending_questions.push(question.to_string());
    }
}
