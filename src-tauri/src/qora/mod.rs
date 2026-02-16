//! Qora - The cinQ AI Agent
//! 
//! Qora is the first agent in the cinQ swarm. She builds and maintains
//! the system, understands every component, and orchestrates future agents.
//!
//! Named after the Quai network's agent swarm vision - Qora is the seed
//! from which the decentralized AI infrastructure grows.

pub mod agent;
pub mod ollama;
pub mod tasks;
pub mod git;

pub use agent::QoraAgent;
pub use tasks::{Task, TaskStatus, TaskQueue};
