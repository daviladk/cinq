//! Qora Swarm Coordination API
//! 
//! Lightweight coordination layer for agent mesh communication.
//! This runs on ANY hardware - it's just messaging, not inference.
//! 
//! Responsibilities:
//! - Task distribution and assignment
//! - Agent discovery and availability
//! - Status updates and progress tracking
//! - Result collection and aggregation

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

// ============================================================================
// Core Types
// ============================================================================

/// Unique identifier for a swarm task
pub type TaskId = String;

/// Unique identifier for an agent in the swarm
pub type AgentId = String;

/// Task priority (higher = more urgent)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum Priority {
    Low = 0,
    Normal = 1,
    High = 2,
    Critical = 3,
}

impl Default for Priority {
    fn default() -> Self {
        Priority::Normal
    }
}

/// Current state of a task
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum TaskState {
    /// Task is waiting to be assigned
    Pending,
    /// Task has been assigned to an agent
    Assigned { agent: AgentId },
    /// Agent is actively working on the task
    InProgress { agent: AgentId, progress: u8 },
    /// Task completed successfully
    Completed { agent: AgentId, result: TaskResult },
    /// Task failed
    Failed { agent: AgentId, error: String },
    /// Task was cancelled
    Cancelled,
}

/// Result of a completed task
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TaskResult {
    /// Output data (could be code, text, file paths, etc.)
    pub output: String,
    /// Any artifacts produced (file hashes, etc.)
    pub artifacts: Vec<String>,
    /// Execution time in milliseconds
    pub duration_ms: u64,
    /// Qi cost for this task (for accounting)
    pub qi_cost: u64,
}

/// A task in the swarm
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwarmTask {
    pub id: TaskId,
    pub task_type: TaskType,
    pub description: String,
    pub priority: Priority,
    pub state: TaskState,
    pub created_at: u64,
    pub updated_at: u64,
    /// Parent task ID if this is a subtask
    pub parent_id: Option<TaskId>,
    /// Required capabilities to execute this task
    pub requirements: TaskRequirements,
    /// Context/input data for the task
    pub context: String,
}

/// Types of tasks the swarm can handle
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum TaskType {
    /// Code generation/modification
    Code { language: String, action: CodeAction },
    /// File operations
    File { action: FileAction },
    /// Research/analysis
    Research { query: String },
    /// Review/validation
    Review { target: String },
    /// Generic task
    Custom { name: String },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum CodeAction {
    Generate,
    Modify,
    Refactor,
    Debug,
    Test,
    Document,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum FileAction {
    Read,
    Write,
    Delete,
    Move,
    Search,
}

/// Requirements for executing a task
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TaskRequirements {
    /// Minimum agent tier (0 = any)
    pub min_tier: u8,
    /// Required capabilities
    pub capabilities: Vec<Capability>,
    /// Estimated Qi cost
    pub estimated_qi: u64,
    /// Timeout in seconds
    pub timeout_secs: u64,
}

/// Capabilities an agent can have
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum Capability {
    /// Has local LLM inference
    LocalInference,
    /// Can access network for inference
    NetworkInference,
    /// Has code execution sandbox
    CodeExecution,
    /// Has filesystem access
    FileSystem,
    /// Has git operations
    Git,
    /// Has network/web access
    Web,
    /// Custom capability
    Custom(String),
}

// ============================================================================
// Agent Types
// ============================================================================

/// An agent in the swarm
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwarmAgent {
    pub id: AgentId,
    pub peer_id: Option<String>,
    pub name: String,
    pub capabilities: Vec<Capability>,
    pub tier: AgentTier,
    pub status: AgentStatus,
    pub current_tasks: Vec<TaskId>,
    pub max_concurrent_tasks: u8,
    pub last_seen: u64,
    /// Qi balance for this agent
    pub qi_balance: u64,
}

/// Agent hardware/capability tier
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum AgentTier {
    /// Entry level - coordination only, no local inference
    Coordinator = 0,
    /// Light inference (1-3B models)
    Light = 1,
    /// Standard inference (7-8B models)
    Standard = 2,
    /// Power inference (16B+ models)
    Power = 3,
}

impl Default for AgentTier {
    fn default() -> Self {
        AgentTier::Coordinator
    }
}

/// Current status of an agent
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AgentStatus {
    /// Agent is online and ready
    Ready,
    /// Agent is busy with tasks
    Busy,
    /// Agent is offline
    Offline,
    /// Agent is paused (manual)
    Paused,
}

// ============================================================================
// Swarm Protocol Messages
// ============================================================================

/// Messages sent between agents in the swarm
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SwarmMessage {
    // === Discovery ===
    /// Agent announcing itself to the swarm
    Announce(SwarmAgent),
    /// Request for available agents
    DiscoverAgents,
    /// Response with list of known agents
    AgentList(Vec<SwarmAgent>),
    
    // === Task Management ===
    /// Submit a new task to the swarm
    SubmitTask(SwarmTask),
    /// Claim a task for execution
    ClaimTask { task_id: TaskId, agent_id: AgentId },
    /// Release a claimed task
    ReleaseTask { task_id: TaskId, agent_id: AgentId },
    /// Update task progress
    TaskProgress { task_id: TaskId, progress: u8, message: String },
    /// Report task completion
    TaskComplete { task_id: TaskId, result: TaskResult },
    /// Report task failure
    TaskFailed { task_id: TaskId, error: String },
    /// Cancel a task
    CancelTask { task_id: TaskId },
    
    // === Queries ===
    /// Get status of a specific task
    GetTaskStatus { task_id: TaskId },
    /// Response with task status
    TaskStatus(SwarmTask),
    /// Get all pending tasks
    GetPendingTasks,
    /// Response with pending tasks
    PendingTasks(Vec<SwarmTask>),
    
    // === Coordination ===
    /// Request help from another agent
    RequestAssist { task_id: TaskId, need: String },
    /// Offer assistance to another agent
    OfferAssist { task_id: TaskId, agent_id: AgentId },
    /// Broadcast a message to all agents
    Broadcast { from: AgentId, message: String },
    
    // === Heartbeat ===
    /// Periodic ping to indicate agent is alive
    Ping { agent_id: AgentId, timestamp: u64 },
    /// Response to ping
    Pong { agent_id: AgentId, timestamp: u64 },
}

// ============================================================================
// Swarm Coordinator
// ============================================================================

/// Local swarm coordinator - manages tasks and agent communication
pub struct SwarmCoordinator {
    /// This agent's identity
    pub local_agent: SwarmAgent,
    /// Known agents in the swarm
    pub agents: HashMap<AgentId, SwarmAgent>,
    /// All tasks (local and remote)
    pub tasks: HashMap<TaskId, SwarmTask>,
    /// Pending tasks queue
    pub pending_queue: Vec<TaskId>,
    /// Message handlers
    message_tx: Option<tokio::sync::mpsc::Sender<SwarmMessage>>,
}

impl SwarmCoordinator {
    /// Create a new swarm coordinator
    pub fn new(name: String, peer_id: Option<String>) -> Self {
        let agent_id = generate_agent_id();
        
        let local_agent = SwarmAgent {
            id: agent_id,
            peer_id,
            name,
            capabilities: vec![Capability::FileSystem, Capability::Git],
            tier: AgentTier::Coordinator, // Start as coordinator, upgrade when inference available
            status: AgentStatus::Ready,
            current_tasks: vec![],
            max_concurrent_tasks: 3,
            last_seen: now_timestamp(),
            qi_balance: 0,
        };
        
        Self {
            local_agent,
            agents: HashMap::new(),
            tasks: HashMap::new(),
            pending_queue: vec![],
            message_tx: None,
        }
    }
    
    /// Set the message sender for outgoing swarm messages
    pub fn set_message_channel(&mut self, tx: tokio::sync::mpsc::Sender<SwarmMessage>) {
        self.message_tx = Some(tx);
    }
    
    /// Upgrade agent tier when inference becomes available
    pub fn upgrade_tier(&mut self, tier: AgentTier) {
        self.local_agent.tier = tier;
        if tier >= AgentTier::Light {
            self.local_agent.capabilities.push(Capability::LocalInference);
        }
    }
    
    /// Add a capability to the local agent
    pub fn add_capability(&mut self, cap: Capability) {
        if !self.local_agent.capabilities.contains(&cap) {
            self.local_agent.capabilities.push(cap);
        }
    }
    
    // === Task Management ===
    
    /// Create and submit a new task
    pub fn create_task(&mut self, task_type: TaskType, description: String, context: String) -> TaskId {
        let task_id = generate_task_id();
        let now = now_timestamp();
        
        let task = SwarmTask {
            id: task_id.clone(),
            task_type,
            description,
            priority: Priority::Normal,
            state: TaskState::Pending,
            created_at: now,
            updated_at: now,
            parent_id: None,
            requirements: TaskRequirements::default(),
            context,
        };
        
        self.tasks.insert(task_id.clone(), task);
        self.pending_queue.push(task_id.clone());
        
        task_id
    }
    
    /// Claim a pending task for this agent
    pub fn claim_task(&mut self, task_id: &TaskId) -> Result<(), String> {
        let task = self.tasks.get_mut(task_id)
            .ok_or_else(|| "Task not found".to_string())?;
        
        if !matches!(task.state, TaskState::Pending) {
            return Err("Task is not pending".to_string());
        }
        
        // Check if we can take more tasks
        if self.local_agent.current_tasks.len() >= self.local_agent.max_concurrent_tasks as usize {
            return Err("Agent at capacity".to_string());
        }
        
        // Check requirements
        if task.requirements.min_tier > self.local_agent.tier as u8 {
            return Err("Agent tier too low".to_string());
        }
        
        // Claim the task
        task.state = TaskState::Assigned { 
            agent: self.local_agent.id.clone() 
        };
        task.updated_at = now_timestamp();
        
        self.local_agent.current_tasks.push(task_id.clone());
        self.pending_queue.retain(|id| id != task_id);
        
        Ok(())
    }
    
    /// Update progress on a task
    pub fn update_progress(&mut self, task_id: &TaskId, progress: u8, _message: &str) -> Result<(), String> {
        let task = self.tasks.get_mut(task_id)
            .ok_or_else(|| "Task not found".to_string())?;
        
        task.state = TaskState::InProgress {
            agent: self.local_agent.id.clone(),
            progress: progress.min(100),
        };
        task.updated_at = now_timestamp();
        
        Ok(())
    }
    
    /// Complete a task
    pub fn complete_task(&mut self, task_id: &TaskId, output: String, qi_cost: u64) -> Result<(), String> {
        let task = self.tasks.get_mut(task_id)
            .ok_or_else(|| "Task not found".to_string())?;
        
        let duration_ms = (now_timestamp() - task.created_at) * 1000;
        
        task.state = TaskState::Completed {
            agent: self.local_agent.id.clone(),
            result: TaskResult {
                output,
                artifacts: vec![],
                duration_ms,
                qi_cost,
            },
        };
        task.updated_at = now_timestamp();
        
        self.local_agent.current_tasks.retain(|id| id != task_id);
        
        Ok(())
    }
    
    /// Fail a task
    pub fn fail_task(&mut self, task_id: &TaskId, error: String) -> Result<(), String> {
        let task = self.tasks.get_mut(task_id)
            .ok_or_else(|| "Task not found".to_string())?;
        
        task.state = TaskState::Failed {
            agent: self.local_agent.id.clone(),
            error,
        };
        task.updated_at = now_timestamp();
        
        self.local_agent.current_tasks.retain(|id| id != task_id);
        
        Ok(())
    }
    
    // === Agent Management ===
    
    /// Register a discovered agent
    pub fn register_agent(&mut self, agent: SwarmAgent) {
        self.agents.insert(agent.id.clone(), agent);
    }
    
    /// Update agent status
    pub fn update_agent_status(&mut self, agent_id: &AgentId, status: AgentStatus) {
        if let Some(agent) = self.agents.get_mut(agent_id) {
            agent.status = status;
            agent.last_seen = now_timestamp();
        }
    }
    
    /// Get all available agents for a task
    pub fn find_capable_agents(&self, requirements: &TaskRequirements) -> Vec<&SwarmAgent> {
        self.agents.values()
            .filter(|agent| {
                // Check status
                if agent.status != AgentStatus::Ready {
                    return false;
                }
                // Check tier
                if (agent.tier as u8) < requirements.min_tier {
                    return false;
                }
                // Check capabilities
                for cap in &requirements.capabilities {
                    if !agent.capabilities.contains(cap) {
                        return false;
                    }
                }
                // Check capacity
                if agent.current_tasks.len() >= agent.max_concurrent_tasks as usize {
                    return false;
                }
                true
            })
            .collect()
    }
    
    // === Message Handling ===
    
    /// Handle an incoming swarm message
    pub async fn handle_message(&mut self, msg: SwarmMessage) -> Option<SwarmMessage> {
        match msg {
            SwarmMessage::Announce(agent) => {
                self.register_agent(agent);
                None
            }
            SwarmMessage::DiscoverAgents => {
                let agents: Vec<SwarmAgent> = self.agents.values().cloned().collect();
                Some(SwarmMessage::AgentList(agents))
            }
            SwarmMessage::SubmitTask(task) => {
                self.tasks.insert(task.id.clone(), task.clone());
                self.pending_queue.push(task.id);
                None
            }
            SwarmMessage::ClaimTask { task_id, agent_id } => {
                if let Some(task) = self.tasks.get_mut(&task_id) {
                    if matches!(task.state, TaskState::Pending) {
                        task.state = TaskState::Assigned { agent: agent_id };
                        task.updated_at = now_timestamp();
                        self.pending_queue.retain(|id| id != &task_id);
                    }
                }
                None
            }
            SwarmMessage::TaskProgress { task_id, progress, message: _ } => {
                if let Some(task) = self.tasks.get_mut(&task_id) {
                    if let TaskState::Assigned { agent } | TaskState::InProgress { agent, .. } = &task.state {
                        task.state = TaskState::InProgress { 
                            agent: agent.clone(), 
                            progress 
                        };
                        task.updated_at = now_timestamp();
                    }
                }
                None
            }
            SwarmMessage::TaskComplete { task_id, result } => {
                if let Some(task) = self.tasks.get_mut(&task_id) {
                    if let TaskState::InProgress { agent, .. } | TaskState::Assigned { agent } = &task.state {
                        task.state = TaskState::Completed { 
                            agent: agent.clone(), 
                            result 
                        };
                        task.updated_at = now_timestamp();
                    }
                }
                None
            }
            SwarmMessage::TaskFailed { task_id, error } => {
                if let Some(task) = self.tasks.get_mut(&task_id) {
                    if let TaskState::InProgress { agent, .. } | TaskState::Assigned { agent } = &task.state {
                        task.state = TaskState::Failed { 
                            agent: agent.clone(), 
                            error 
                        };
                        task.updated_at = now_timestamp();
                    }
                }
                None
            }
            SwarmMessage::GetTaskStatus { task_id } => {
                self.tasks.get(&task_id).cloned().map(SwarmMessage::TaskStatus)
            }
            SwarmMessage::GetPendingTasks => {
                let pending: Vec<SwarmTask> = self.pending_queue.iter()
                    .filter_map(|id| self.tasks.get(id).cloned())
                    .collect();
                Some(SwarmMessage::PendingTasks(pending))
            }
            SwarmMessage::Ping { agent_id, timestamp } => {
                self.update_agent_status(&agent_id, AgentStatus::Ready);
                Some(SwarmMessage::Pong { 
                    agent_id: self.local_agent.id.clone(), 
                    timestamp 
                })
            }
            SwarmMessage::Pong { agent_id, .. } => {
                self.update_agent_status(&agent_id, AgentStatus::Ready);
                None
            }
            _ => None,
        }
    }
    
    /// Broadcast our agent announcement to the swarm
    pub async fn announce(&self) -> SwarmMessage {
        SwarmMessage::Announce(self.local_agent.clone())
    }
    
    /// Get pending tasks that this agent could handle
    pub fn get_claimable_tasks(&self) -> Vec<&SwarmTask> {
        self.pending_queue.iter()
            .filter_map(|id| self.tasks.get(id))
            .filter(|task| {
                // Check if we meet requirements
                if task.requirements.min_tier > self.local_agent.tier as u8 {
                    return false;
                }
                for cap in &task.requirements.capabilities {
                    if !self.local_agent.capabilities.contains(cap) {
                        return false;
                    }
                }
                true
            })
            .collect()
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

fn now_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::ZERO)
        .as_secs()
}

fn generate_task_id() -> TaskId {
    use std::time::{SystemTime, UNIX_EPOCH};
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("task-{:x}", ts)
}

fn generate_agent_id() -> AgentId {
    use std::time::{SystemTime, UNIX_EPOCH};
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("agent-{:x}", ts)
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_create_coordinator() {
        let coord = SwarmCoordinator::new("test-agent".to_string(), None);
        assert_eq!(coord.local_agent.tier, AgentTier::Coordinator);
        assert!(coord.local_agent.capabilities.contains(&Capability::FileSystem));
    }
    
    #[test]
    fn test_create_and_claim_task() {
        let mut coord = SwarmCoordinator::new("test-agent".to_string(), None);
        
        let task_id = coord.create_task(
            TaskType::Code { 
                language: "rust".to_string(), 
                action: CodeAction::Generate 
            },
            "Create a hello world".to_string(),
            "fn main() { }".to_string(),
        );
        
        assert!(coord.claim_task(&task_id).is_ok());
        assert!(coord.local_agent.current_tasks.contains(&task_id));
    }
    
    #[test]
    fn test_task_lifecycle() {
        let mut coord = SwarmCoordinator::new("test-agent".to_string(), None);
        
        let task_id = coord.create_task(
            TaskType::Research { query: "test".to_string() },
            "Research something".to_string(),
            "".to_string(),
        );
        
        coord.claim_task(&task_id).unwrap();
        coord.update_progress(&task_id, 50, "Halfway done").unwrap();
        coord.complete_task(&task_id, "Result!".to_string(), 10).unwrap();
        
        let task = coord.tasks.get(&task_id).unwrap();
        assert!(matches!(task.state, TaskState::Completed { .. }));
    }
}
