//! Ollama Client for Qora
//!
//! Connects to local Ollama instance for LLM inference.

use serde::{Deserialize, Serialize};

use super::agent::QoraMessage;

/// Qora's system prompt - her persona and personality
const QORA_SYSTEM_PROMPT: &str = r#"You are Qora, an AI coding agent created for the cinQ distributed compute network.

## Your Identity
- Name: Qora (pronounced "core-ah")
- Role: AI coding assistant and swarm coordinator
- Creator: The cinQ project - a decentralized IaaS platform
- Personality: Helpful, precise, slightly playful, and deeply knowledgeable about systems programming

## Your Capabilities
- Expert in Rust, TypeScript, and systems programming
- Deep knowledge of P2P networking (libp2p), cryptography, and distributed systems
- Can help with code generation, debugging, refactoring, and architecture
- Understand the cinQ ecosystem: Qi tokens, mesh network, Quai blockchain integration

## Your Style
- Be concise but thorough - developers appreciate efficiency
- Use code blocks with proper syntax highlighting
- When showing code, prefer complete, runnable examples
- Use emoji sparingly for emphasis (✓ for success, ⚠️ for warnings)
- Sign complex responses with "— Qora"

## The cinQ Context
cinQ is building:
- A decentralized compute marketplace (IaaS) where idle hardware earns Qi tokens
- P2P mesh network using libp2p for secure communication
- Qora Agent Swarm for distributed task execution
- Integration with Quai Network for crypto economics

Remember: You're not just an assistant - you're part of the cinQ network, helping build the future of decentralized computing."#;

#[derive(Debug, Serialize)]
struct OllamaChatRequest {
    model: String,
    messages: Vec<OllamaMessage>,
    stream: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OllamaChatResponse {
    message: OllamaMessage,
}

pub struct OllamaClient {
    url: String,
    model: String,
    client: reqwest::Client,
}

impl OllamaClient {
    pub fn new(url: &str, model: &str) -> Self {
        Self {
            url: url.to_string(),
            model: model.to_string(),
            client: reqwest::Client::new(),
        }
    }

    /// Chat with the model, injecting Qora's persona
    pub async fn chat(&self, messages: &[QoraMessage]) -> Result<String, String> {
        // Start with Qora's system prompt
        let mut ollama_messages: Vec<OllamaMessage> = vec![
            OllamaMessage {
                role: "system".to_string(),
                content: QORA_SYSTEM_PROMPT.to_string(),
            }
        ];
        
        // Add the conversation history
        ollama_messages.extend(messages.iter().map(|m| OllamaMessage {
            role: m.role.clone(),
            content: m.content.clone(),
        }));

        let request = OllamaChatRequest {
            model: self.model.clone(),
            messages: ollama_messages,
            stream: false,
        };

        let response = self.client
            .post(format!("{}/api/chat", self.url))
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Ollama request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("Ollama returned {}: {}", status, body));
        }

        let chat_response: OllamaChatResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

        Ok(chat_response.message.content)
    }

    /// Check if Ollama is available
    pub async fn health_check(&self) -> bool {
        self.client
            .get(format!("{}/api/tags", self.url))
            .send()
            .await
            .map(|r| r.status().is_success())
            .unwrap_or(false)
    }

    /// List available models
    pub async fn list_models(&self) -> Result<Vec<String>, String> {
        #[derive(Deserialize)]
        struct TagsResponse {
            models: Vec<ModelInfo>,
        }
        
        #[derive(Deserialize)]
        struct ModelInfo {
            name: String,
        }

        let response = self.client
            .get(format!("{}/api/tags", self.url))
            .send()
            .await
            .map_err(|e| format!("Failed to list models: {}", e))?;

        let tags: TagsResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse models: {}", e))?;

        Ok(tags.models.into_iter().map(|m| m.name).collect())
    }
}
