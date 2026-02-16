//! Ollama Client for Qora
//!
//! Connects to local Ollama instance for LLM inference.

use serde::{Deserialize, Serialize};

use super::agent::QoraMessage;

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

    /// Chat with the model
    pub async fn chat(&self, messages: &[QoraMessage]) -> Result<String, String> {
        let ollama_messages: Vec<OllamaMessage> = messages
            .iter()
            .map(|m| OllamaMessage {
                role: m.role.clone(),
                content: m.content.clone(),
            })
            .collect();

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
