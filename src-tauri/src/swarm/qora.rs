//! Qora Orchestrator - Intent routing + template responses
//!
//! The "brains" of the swarm - parses user input, routes to workers,
//! and responds with personality. No ML model required.

use rand::seq::SliceRandom;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::costs::ActionType;
use super::intent::{Intent, IntentParser};

/// Context for template responses
#[derive(Debug, Clone, Default)]
pub struct ResponseContext {
    pub peer_name: String,
    pub cost: f64,
    pub balance: f64,
    pub duration: String,
    pub bytes: u64,
    pub file_name: String,
    pub query: String,
    pub count: usize,
}

/// Qora's response with action to take
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QoraResponse {
    /// The spoken response to show the user
    pub message: String,
    /// The parsed intent (for worker dispatch)
    pub intent: Intent,
    /// Whether this needs worker action
    pub needs_action: bool,
    /// Estimated Qi cost (if applicable)
    pub estimated_cost: Option<f64>,
}

/// Qora - the orchestrator agent
pub struct Qora {
    parser: IntentParser,
    templates: HashMap<&'static str, Vec<&'static str>>,
}

impl Default for Qora {
    fn default() -> Self {
        Self::new()
    }
}

impl Qora {
    pub fn new() -> Self {
        let mut templates: HashMap<&'static str, Vec<&'static str>> = HashMap::new();

        // Message templates
        templates.insert(
            "message_sent",
            vec![
                "Sent to {peer_name}. That was {cost:.4} Qi.",
                "Message delivered to {peer_name}. Cost: {cost:.4} Qi.",
                "Done! {peer_name} got your message. ({cost:.4} Qi)",
                "📤 Sent to {peer_name}",
            ],
        );

        templates.insert(
            "message_failed",
            vec![
                "Couldn't reach {peer_name}. They might be offline.",
                "{peer_name} is unreachable right now.",
                "Message failed - {peer_name} isn't connected.",
            ],
        );

        // Call templates
        templates.insert(
            "call_starting",
            vec![
                "Calling {peer_name}...",
                "Ringing {peer_name}...",
                "📞 Connecting to {peer_name}...",
            ],
        );

        templates.insert(
            "call_connected",
            vec![
                "Connected with {peer_name}!",
                "You're now talking to {peer_name}.",
                "📞 Call active with {peer_name}",
            ],
        );

        templates.insert(
            "call_ended",
            vec![
                "Call ended. Duration: {duration}. Cost: {cost:.4} Qi.",
                "Disconnected. {duration} call, {cost:.4} Qi.",
                "📞 Call complete - {duration}, {cost:.4} Qi",
            ],
        );

        templates.insert(
            "call_failed",
            vec![
                "{peer_name} didn't answer.",
                "No response from {peer_name}.",
                "Couldn't connect to {peer_name}.",
            ],
        );

        // Video templates
        templates.insert(
            "video_starting",
            vec![
                "Starting video with {peer_name}...",
                "🎥 Connecting video to {peer_name}...",
            ],
        );

        templates.insert(
            "video_connected",
            vec![
                "Video connected with {peer_name}!",
                "🎥 Live with {peer_name}",
            ],
        );

        // Balance templates
        templates.insert(
            "balance_check",
            vec![
                "You have {balance:.2} Qi available.",
                "Balance: {balance:.2} Qi",
                "💰 {balance:.2} Qi in your account",
            ],
        );

        templates.insert(
            "balance_low",
            vec![
                "⚠️ Only {balance:.2} Qi left. Consider topping up.",
                "Running low - {balance:.2} Qi remaining.",
                "Heads up: {balance:.2} Qi left.",
            ],
        );

        // Usage templates
        templates.insert(
            "usage_report",
            vec![
                "This session: {cost:.4} Qi used. Balance: {balance:.2} Qi.",
                "You've spent {cost:.4} Qi so far. {balance:.2} Qi remaining.",
                "📊 Session: {cost:.4} Qi | Balance: {balance:.2} Qi",
            ],
        );

        // Estimate templates
        templates.insert(
            "estimate",
            vec![
                "That would cost about {cost:.4} Qi.",
                "Estimated: {cost:.4} Qi",
                "~{cost:.4} Qi for that.",
            ],
        );

        // Upload templates
        templates.insert(
            "upload_starting",
            vec![
                "Uploading {file_name}...",
                "📤 Sending {file_name} to storage...",
            ],
        );

        templates.insert(
            "upload_complete",
            vec![
                "Uploaded {file_name}. Cost: {cost:.4} Qi.",
                "✅ {file_name} stored. ({cost:.4} Qi)",
                "{file_name} is now in your cloud. {cost:.4} Qi.",
            ],
        );

        // Download templates
        templates.insert(
            "download_complete",
            vec![
                "Downloaded {file_name}.",
                "✅ {file_name} ready.",
                "Got {file_name} for you.",
            ],
        );

        // Contact templates
        templates.insert(
            "contact_added",
            vec![
                "Added {peer_name} to your contacts.",
                "✅ {peer_name} saved.",
                "{peer_name} is now in your contacts.",
            ],
        );

        templates.insert(
            "contacts_list",
            vec![
                "You have {count} contacts.",
                "📇 {count} contacts in your list.",
            ],
        );

        // Search templates
        templates.insert(
            "search_results",
            vec![
                "Found {count} messages matching \"{query}\".",
                "🔍 {count} results for \"{query}\"",
            ],
        );

        templates.insert(
            "search_empty",
            vec![
                "No messages found for \"{query}\".",
                "🔍 Nothing matching \"{query}\"",
            ],
        );

        // Help templates
        templates.insert("help_general", vec![
            "I can help you message, call, store files, and track usage. What would you like to do?",
            "Try: 'send [name] [message]', 'call [name]', 'balance', or 'help [topic]'.",
            "Commands: message, call, video, upload, download, balance, usage, contacts, search.",
        ]);

        templates.insert(
            "help_message",
            vec!["To send a message: 'send alice hello there' or 'message bob how are you?'"],
        );

        templates.insert(
            "help_call",
            vec!["To call: 'call alice' or 'video call bob'. End with 'hang up'."],
        );

        templates.insert(
            "help_balance",
            vec!["Check your Qi: 'balance' or 'how much qi do i have?'"],
        );

        templates.insert(
            "help_storage",
            vec!["Upload: 'upload /path/to/file'. Download: 'download [file-id]'."],
        );

        // Unknown/fallback templates
        templates.insert(
            "unknown",
            vec![
                "I'm not sure what you mean. Try 'help' to see what I can do.",
                "Didn't catch that. Say 'help' for available commands.",
                "🤔 Not sure about that. Type 'help' for options.",
            ],
        );

        // Warning templates
        templates.insert(
            "warning_yellow",
            vec![
                "Heads up - about {duration} of Qi left at this rate.",
                "⚠️ ~{duration} remaining at current usage.",
            ],
        );

        templates.insert(
            "warning_orange",
            vec![
                "⚠️ Only {duration} left! Consider wrapping up.",
                "Running low - {duration} of Qi remaining.",
            ],
        );

        templates.insert(
            "warning_red",
            vec![
                "🔴 {duration} seconds left! Call will end soon.",
                "🔴 Almost out! {duration}s remaining.",
            ],
        );

        // Settings templates
        templates.insert(
            "setting_updated",
            vec![
                "Updated {query} setting.",
                "✅ {query} changed.",
                "Setting saved.",
            ],
        );

        Self {
            parser: IntentParser::new(),
            templates,
        }
    }

    /// Process user input and generate response
    pub fn process(&self, input: &str) -> QoraResponse {
        let intent = self.parser.parse(input);
        let needs_action = self.needs_worker_action(&intent);
        let estimated_cost = self.estimate_action_cost(&intent);

        // Generate initial response (before action completes)
        let message = self.generate_initial_response(&intent);

        QoraResponse {
            message,
            intent,
            needs_action,
            estimated_cost,
        }
    }

    /// Check if this intent needs worker dispatch
    fn needs_worker_action(&self, intent: &Intent) -> bool {
        matches!(
            intent,
            Intent::SendMessage { .. }
                | Intent::StartCall { .. }
                | Intent::StartVideoCall { .. }
                | Intent::EndCall
                | Intent::UploadFile { .. }
                | Intent::DownloadFile { .. }
                | Intent::AddContact { .. }
                | Intent::SearchMessages { .. }
        )
    }

    /// Estimate the cost for this action (rough estimate before execution)
    fn estimate_action_cost(&self, intent: &Intent) -> Option<f64> {
        match intent {
            Intent::SendMessage { content, .. } => {
                // Estimate based on content length
                let kb = (content.len() as f64 + 100.0) / 1024.0; // +100 for overhead
                Some(kb * 0.001) // message_per_kb rate
            }
            Intent::StartCall { .. } => {
                // Estimate 5 minute call
                Some(5.0 * 0.05) // 0.25 Qi
            }
            Intent::StartVideoCall { .. } => {
                // Estimate 5 minute video
                Some(5.0 * 0.5) // 2.5 Qi
            }
            Intent::UploadFile { .. } => {
                // Can't estimate without file size
                None
            }
            _ => None,
        }
    }

    /// Generate the initial response (shown before action completes)
    fn generate_initial_response(&self, intent: &Intent) -> String {
        match intent {
            Intent::SendMessage { recipient, .. } => {
                let ctx = ResponseContext {
                    peer_name: recipient.clone(),
                    ..Default::default()
                };
                self.render("message_sent", &ctx)
            }
            Intent::StartCall { recipient } => {
                let ctx = ResponseContext {
                    peer_name: recipient.clone(),
                    ..Default::default()
                };
                self.render("call_starting", &ctx)
            }
            Intent::StartVideoCall { recipient } => {
                let ctx = ResponseContext {
                    peer_name: recipient.clone(),
                    ..Default::default()
                };
                self.render("video_starting", &ctx)
            }
            Intent::EndCall => "Ending call...".to_string(),
            Intent::CheckBalance => {
                // Will be filled in by worker
                "Checking balance...".to_string()
            }
            Intent::CheckUsage => "Checking usage...".to_string(),
            Intent::EstimateCost { action, units } => {
                let cost = self.calculate_estimate(action, *units);
                let ctx = ResponseContext {
                    cost,
                    ..Default::default()
                };
                self.render("estimate", &ctx)
            }
            Intent::UploadFile { path, .. } => {
                let ctx = ResponseContext {
                    file_name: path.clone(),
                    ..Default::default()
                };
                self.render("upload_starting", &ctx)
            }
            Intent::DownloadFile { file_id } => {
                format!("Downloading {}...", file_id)
            }
            Intent::AddContact { name, .. } => {
                format!("Adding {}...", name)
            }
            Intent::ListContacts => "Fetching contacts...".to_string(),
            Intent::SearchMessages { query } => {
                format!("Searching for \"{}\"...", query)
            }
            Intent::Help { topic } => {
                let key = match topic.as_deref() {
                    Some("message") | Some("messages") | Some("messaging") => "help_message",
                    Some("call") | Some("calls") | Some("calling") => "help_call",
                    Some("balance") | Some("qi") | Some("money") => "help_balance",
                    Some("storage") | Some("files") | Some("upload") => "help_storage",
                    _ => "help_general",
                };
                self.render(key, &ResponseContext::default())
            }
            Intent::SetPreference { key, .. } => {
                let ctx = ResponseContext {
                    query: key.clone(),
                    ..Default::default()
                };
                self.render("setting_updated", &ctx)
            }
            Intent::Unknown { .. } => self.render("unknown", &ResponseContext::default()),
        }
    }

    /// Generate response after action completes
    pub fn generate_completion_response(
        &self,
        intent: &Intent,
        ctx: &ResponseContext,
        success: bool,
    ) -> String {
        match intent {
            Intent::SendMessage { .. } => {
                if success {
                    self.render("message_sent", ctx)
                } else {
                    self.render("message_failed", ctx)
                }
            }
            Intent::StartCall { .. } => {
                if success {
                    self.render("call_connected", ctx)
                } else {
                    self.render("call_failed", ctx)
                }
            }
            Intent::StartVideoCall { .. } => {
                if success {
                    self.render("video_connected", ctx)
                } else {
                    self.render("call_failed", ctx)
                }
            }
            Intent::EndCall => self.render("call_ended", ctx),
            Intent::CheckBalance => {
                if ctx.balance < 1.0 {
                    self.render("balance_low", ctx)
                } else {
                    self.render("balance_check", ctx)
                }
            }
            Intent::CheckUsage => self.render("usage_report", ctx),
            Intent::UploadFile { .. } => self.render("upload_complete", ctx),
            Intent::DownloadFile { .. } => self.render("download_complete", ctx),
            Intent::AddContact { .. } => self.render("contact_added", ctx),
            Intent::ListContacts => self.render("contacts_list", ctx),
            Intent::SearchMessages { .. } => {
                if ctx.count > 0 {
                    self.render("search_results", ctx)
                } else {
                    self.render("search_empty", ctx)
                }
            }
            _ => "Done.".to_string(),
        }
    }

    /// Generate warning message based on level
    pub fn generate_warning(&self, level: &str, ctx: &ResponseContext) -> String {
        let key = match level {
            "yellow" => "warning_yellow",
            "orange" => "warning_orange",
            "red" => "warning_red",
            _ => "warning_yellow",
        };
        self.render(key, ctx)
    }

    /// Render a template with context
    fn render(&self, key: &str, ctx: &ResponseContext) -> String {
        let templates = self
            .templates
            .get(key)
            .unwrap_or_else(|| self.templates.get("unknown").unwrap());

        let template = templates.choose(&mut rand::thread_rng()).unwrap_or(&"...");

        template
            .replace("{peer_name}", &ctx.peer_name)
            .replace("{cost:.4}", &format!("{:.4}", ctx.cost))
            .replace("{cost}", &format!("{:.4}", ctx.cost))
            .replace("{balance:.2}", &format!("{:.2}", ctx.balance))
            .replace("{balance}", &format!("{:.2}", ctx.balance))
            .replace("{duration}", &ctx.duration)
            .replace("{bytes}", &ctx.bytes.to_string())
            .replace("{file_name}", &ctx.file_name)
            .replace("{query}", &ctx.query)
            .replace("{count}", &ctx.count.to_string())
    }

    /// Calculate cost estimate for action
    fn calculate_estimate(&self, action: &str, units: f64) -> f64 {
        match action {
            "message" => units * 0.001,          // per KB
            "call" => units * 0.05,              // per minute
            "video" => units * 0.5,              // per minute
            "storage" => units * 0.001,          // per GB/day
            "file" | "transfer" => units * 0.01, // per MB
            _ => units * 0.01,
        }
    }

    /// Map intent to ActionType for cost tracking
    pub fn intent_to_action_type(&self, intent: &Intent) -> Option<ActionType> {
        match intent {
            Intent::SendMessage { .. } => Some(ActionType::Message),
            Intent::StartCall { .. } => Some(ActionType::VoiceCall),
            Intent::StartVideoCall { .. } => Some(ActionType::VideoCall),
            Intent::UploadFile { .. } | Intent::DownloadFile { .. } => {
                Some(ActionType::FileTransfer)
            }
            Intent::SearchMessages { .. } => Some(ActionType::Storage),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_message() {
        let qora = Qora::new();
        let response = qora.process("send alice hey there");

        assert!(response.needs_action);
        assert!(response.estimated_cost.is_some());
        assert!(matches!(response.intent, Intent::SendMessage { .. }));
    }

    #[test]
    fn test_process_balance() {
        let qora = Qora::new();
        let response = qora.process("what's my balance?");

        assert!(!response.needs_action);
        assert!(matches!(response.intent, Intent::CheckBalance));
    }

    #[test]
    fn test_help() {
        let qora = Qora::new();
        let response = qora.process("help");

        assert!(!response.needs_action);
        assert!(!response.message.is_empty());
    }
}
