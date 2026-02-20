//! Git Operations for Qora
//!
//! Allows Qora to commit, push, and manage the repository.

use std::path::PathBuf;
use std::process::Command;

pub struct GitOps {
    repo_path: PathBuf,
}

impl GitOps {
    pub fn new(repo_path: &PathBuf) -> Self {
        Self {
            repo_path: repo_path.clone(),
        }
    }

    fn run(&self, args: &[&str]) -> Result<String, String> {
        let output = Command::new("git")
            .args(args)
            .current_dir(&self.repo_path)
            .output()
            .map_err(|e| format!("Failed to run git: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        if output.status.success() {
            Ok(stdout.to_string())
        } else {
            Err(format!("Git error: {}\n{}", stdout, stderr))
        }
    }

    /// Get current branch name
    pub async fn current_branch(&self) -> Result<String, String> {
        self.run(&["branch", "--show-current"])
            .map(|s| s.trim().to_string())
    }

    /// Get status of the repository
    pub async fn status(&self) -> Result<String, String> {
        self.run(&["status", "--short"])
    }

    /// Stage all changes
    pub async fn add_all(&self) -> Result<String, String> {
        self.run(&["add", "-A"])
    }

    /// Commit staged changes
    pub async fn commit(&self, message: &str) -> Result<String, String> {
        // First stage all changes
        self.add_all().await?;

        // Check if there's anything to commit
        let status = self.status().await?;
        if status.trim().is_empty() {
            return Ok("Nothing to commit".to_string());
        }

        // Commit with message
        self.run(&["commit", "-m", message])
    }

    /// Push to remote
    pub async fn push(&self) -> Result<String, String> {
        self.run(&["push"])
    }

    /// Pull from remote
    pub async fn pull(&self) -> Result<String, String> {
        self.run(&["pull"])
    }

    /// Get recent commits
    pub async fn log(&self, count: usize) -> Result<String, String> {
        self.run(&["log", "--oneline", "-n", &count.to_string()])
    }

    /// Get diff of unstaged changes
    pub async fn diff(&self) -> Result<String, String> {
        self.run(&["diff"])
    }

    /// Get diff of staged changes
    pub async fn diff_staged(&self) -> Result<String, String> {
        self.run(&["diff", "--staged"])
    }

    /// Create a new branch
    pub async fn create_branch(&self, name: &str) -> Result<String, String> {
        self.run(&["checkout", "-b", name])
    }

    /// Switch to a branch
    pub async fn checkout(&self, branch: &str) -> Result<String, String> {
        self.run(&["checkout", branch])
    }

    /// Stash changes
    pub async fn stash(&self) -> Result<String, String> {
        self.run(&["stash"])
    }

    /// Pop stashed changes
    pub async fn stash_pop(&self) -> Result<String, String> {
        self.run(&["stash", "pop"])
    }
}
