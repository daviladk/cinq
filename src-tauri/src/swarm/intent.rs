//! Intent Parser - Zero-dependency intent classification
//!
//! Parses user input into structured intents without any ML model.
//! Pure Rust pattern matching for instant, offline operation.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Parsed user intent with extracted parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Intent {
    /// Send a message to a peer
    SendMessage { recipient: String, content: String },
    /// Initiate a voice call
    StartCall { recipient: String },
    /// Initiate a video call
    StartVideoCall { recipient: String },
    /// End an active call
    EndCall,
    /// Upload a file to storage
    UploadFile { path: String, cloud_backup: bool },
    /// Download a file
    DownloadFile { file_id: String },
    /// Check current balance
    CheckBalance,
    /// Check session usage
    CheckUsage,
    /// Get cost estimate for an action
    EstimateCost { action: String, units: f64 },
    /// Add a contact
    AddContact { name: String, chat_id: String },
    /// List contacts
    ListContacts,
    /// Search messages
    SearchMessages { query: String },
    /// Get help
    Help { topic: Option<String> },
    /// Set user preferences
    SetPreference { key: String, value: String },
    /// Unknown/fallback - for conversational response
    Unknown { input: String },
}

impl Intent {
    /// Get the action type name for this intent (for cost tracking)
    pub fn action_name(&self) -> &'static str {
        match self {
            Intent::SendMessage { .. } => "message",
            Intent::StartCall { .. } => "voice_call",
            Intent::StartVideoCall { .. } => "video_call",
            Intent::EndCall => "call",
            Intent::UploadFile { .. } => "file_upload",
            Intent::DownloadFile { .. } => "file_download",
            Intent::CheckBalance => "query",
            Intent::CheckUsage => "query",
            Intent::EstimateCost { .. } => "query",
            Intent::AddContact { .. } => "contact",
            Intent::ListContacts => "query",
            Intent::SearchMessages { .. } => "query",
            Intent::Help { .. } => "help",
            Intent::SetPreference { .. } => "settings",
            Intent::Unknown { .. } => "unknown",
        }
    }
}

/// Intent parser with keyword patterns
pub struct IntentParser {
    /// Keyword mappings for each intent type
    patterns: HashMap<&'static str, Vec<&'static str>>,
}

impl Default for IntentParser {
    fn default() -> Self {
        Self::new()
    }
}

impl IntentParser {
    pub fn new() -> Self {
        let mut patterns: HashMap<&'static str, Vec<&'static str>> = HashMap::new();

        // Message patterns
        patterns.insert(
            "message",
            vec!["send", "message", "msg", "tell", "text", "dm", "write to"],
        );

        // Call patterns
        patterns.insert("call", vec!["call", "phone", "ring", "dial"]);

        // Video call patterns
        patterns.insert(
            "video",
            vec!["video", "facetime", "video call", "video chat"],
        );

        // End call patterns
        patterns.insert(
            "hangup",
            vec!["hang up", "end call", "disconnect", "stop call"],
        );

        // Upload patterns
        patterns.insert("upload", vec!["upload", "store", "save", "backup", "sync"]);

        // Download patterns
        patterns.insert(
            "download",
            vec!["download", "get file", "fetch", "retrieve"],
        );

        // Balance patterns
        patterns.insert(
            "balance",
            vec!["balance", "how much", "qi left", "funds", "wallet"],
        );

        // Usage patterns
        patterns.insert(
            "usage",
            vec!["usage", "spent", "consumed", "session", "cost so far"],
        );

        // Estimate patterns
        patterns.insert(
            "estimate",
            vec!["estimate", "how much would", "cost of", "price"],
        );

        // Contact patterns
        patterns.insert(
            "contact",
            vec!["add contact", "new contact", "save contact"],
        );

        // List contacts patterns
        patterns.insert(
            "list_contacts",
            vec!["contacts", "list contacts", "show contacts", "who"],
        );

        // Search patterns
        patterns.insert("search", vec!["search", "find", "look for", "where did"]);

        // Help patterns
        patterns.insert(
            "help",
            vec!["help", "how do i", "what can", "commands", "?"],
        );

        // Settings patterns
        patterns.insert(
            "settings",
            vec!["set", "change", "configure", "preference", "setting"],
        );

        Self { patterns }
    }

    /// Parse input text into an intent
    pub fn parse(&self, input: &str) -> Intent {
        let lower = input.to_lowercase();
        let _words: Vec<&str> = lower.split_whitespace().collect();

        // Check for patterns
        if self.matches(&lower, "hangup") {
            return Intent::EndCall;
        }

        if self.matches(&lower, "video") {
            if let Some(recipient) =
                self.extract_recipient(&lower, &["video call", "video chat", "video"])
            {
                return Intent::StartVideoCall { recipient };
            }
        }

        if self.matches(&lower, "call") && !self.matches(&lower, "video") {
            if let Some(recipient) = self.extract_recipient(&lower, &["call", "ring", "dial"]) {
                return Intent::StartCall { recipient };
            }
        }

        if self.matches(&lower, "message") {
            if let Some((recipient, content)) = self.extract_message(&lower) {
                return Intent::SendMessage { recipient, content };
            }
        }

        if self.matches(&lower, "balance") {
            return Intent::CheckBalance;
        }

        if self.matches(&lower, "usage") {
            return Intent::CheckUsage;
        }

        if self.matches(&lower, "estimate") {
            if let Some((action, units)) = self.extract_estimate(&lower) {
                return Intent::EstimateCost { action, units };
            }
        }

        if self.matches(&lower, "upload") {
            if let Some(path) = self.extract_path(&lower) {
                let cloud_backup = lower.contains("cloud") || lower.contains("backup");
                return Intent::UploadFile { path, cloud_backup };
            }
        }

        if self.matches(&lower, "download") {
            if let Some(file_id) = self.extract_file_id(&lower) {
                return Intent::DownloadFile { file_id };
            }
        }

        if self.matches(&lower, "contact") {
            if let Some((name, chat_id)) = self.extract_contact(&lower) {
                return Intent::AddContact { name, chat_id };
            }
        }

        if self.matches(&lower, "list_contacts") {
            return Intent::ListContacts;
        }

        if self.matches(&lower, "search") {
            if let Some(query) = self.extract_search_query(&lower) {
                return Intent::SearchMessages { query };
            }
        }

        if self.matches(&lower, "help") {
            let topic = self.extract_help_topic(&lower);
            return Intent::Help { topic };
        }

        if self.matches(&lower, "settings") {
            if let Some((key, value)) = self.extract_setting(&lower) {
                return Intent::SetPreference { key, value };
            }
        }

        // Fallback to unknown
        Intent::Unknown {
            input: input.to_string(),
        }
    }

    /// Check if input matches any pattern in category
    fn matches(&self, input: &str, category: &str) -> bool {
        if let Some(keywords) = self.patterns.get(category) {
            return keywords.iter().any(|k| input.contains(k));
        }
        false
    }

    /// Extract recipient from call-type commands
    fn extract_recipient(&self, input: &str, triggers: &[&str]) -> Option<String> {
        for trigger in triggers {
            if let Some(pos) = input.find(trigger) {
                let after = &input[pos + trigger.len()..].trim();
                let recipient = after.split_whitespace().next()?;
                if !recipient.is_empty() {
                    return Some(recipient.to_string());
                }
            }
        }
        None
    }

    /// Extract recipient and content from message commands
    fn extract_message(&self, input: &str) -> Option<(String, String)> {
        // Pattern: "send [recipient] [content]" or "message [recipient] [content]"
        let triggers = ["send", "message", "msg", "tell", "text", "dm"];

        for trigger in triggers {
            if let Some(pos) = input.find(trigger) {
                let after = &input[pos + trigger.len()..].trim();
                let parts: Vec<&str> = after.splitn(2, ' ').collect();
                if parts.len() >= 2 {
                    return Some((parts[0].to_string(), parts[1].to_string()));
                }
            }
        }
        None
    }

    /// Extract estimate parameters
    fn extract_estimate(&self, input: &str) -> Option<(String, f64)> {
        // Pattern: "estimate [action] [units]" or "how much [action] for [units]"
        let actions = ["message", "call", "video", "storage", "file"];

        for action in actions {
            if input.contains(action) {
                // Try to find a number
                for word in input.split_whitespace() {
                    if let Ok(num) = word.parse::<f64>() {
                        return Some((action.to_string(), num));
                    }
                }
                // Default to 1 unit
                return Some((action.to_string(), 1.0));
            }
        }
        None
    }

    /// Extract file path
    fn extract_path(&self, input: &str) -> Option<String> {
        // Look for paths starting with / or ~
        for word in input.split_whitespace() {
            if word.starts_with('/') || word.starts_with('~') || word.contains('.') {
                return Some(word.to_string());
            }
        }
        None
    }

    /// Extract file ID for downloads
    fn extract_file_id(&self, input: &str) -> Option<String> {
        // Look for UUID-like strings or quoted strings
        for word in input.split_whitespace() {
            // UUID pattern check (simplified)
            if word.len() >= 8 && word.chars().all(|c| c.is_alphanumeric() || c == '-') {
                return Some(word.to_string());
            }
        }
        None
    }

    /// Extract contact info
    fn extract_contact(&self, input: &str) -> Option<(String, String)> {
        // Pattern: "add contact [name] [chat_id]"
        let parts: Vec<&str> = input.split_whitespace().collect();
        if parts.len() >= 4 {
            // Find "contact" and take next two words
            for (i, part) in parts.iter().enumerate() {
                if *part == "contact" && i + 2 < parts.len() {
                    return Some((parts[i + 1].to_string(), parts[i + 2].to_string()));
                }
            }
        }
        None
    }

    /// Extract search query
    fn extract_search_query(&self, input: &str) -> Option<String> {
        let triggers = ["search", "find", "look for"];
        for trigger in triggers {
            if let Some(pos) = input.find(trigger) {
                let after = input[pos + trigger.len()..].trim();
                if !after.is_empty() {
                    return Some(after.to_string());
                }
            }
        }
        None
    }

    /// Extract help topic
    fn extract_help_topic(&self, input: &str) -> Option<String> {
        let triggers = ["help with", "help about", "how do i"];
        for trigger in triggers {
            if let Some(pos) = input.find(trigger) {
                let after = input[pos + trigger.len()..].trim();
                if !after.is_empty() && after != "?" {
                    return Some(after.to_string());
                }
            }
        }
        None
    }

    /// Extract setting key-value pair
    fn extract_setting(&self, input: &str) -> Option<(String, String)> {
        // Pattern: "set [key] to [value]" or "set [key] [value]"
        let parts: Vec<&str> = input.split_whitespace().collect();
        if parts.len() >= 3 {
            for (i, part) in parts.iter().enumerate() {
                if *part == "set" && i + 2 < parts.len() {
                    let key = parts[i + 1].to_string();
                    // Check for "to" separator
                    if parts.len() > i + 3 && parts[i + 2] == "to" {
                        return Some((key, parts[i + 3].to_string()));
                    }
                    return Some((key, parts[i + 2].to_string()));
                }
            }
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_message() {
        let parser = IntentParser::new();

        match parser.parse("send alice hello there") {
            Intent::SendMessage { recipient, content } => {
                assert_eq!(recipient, "alice");
                assert_eq!(content, "hello there");
            }
            _ => panic!("Expected SendMessage intent"),
        }
    }

    #[test]
    fn test_parse_call() {
        let parser = IntentParser::new();

        match parser.parse("call bob") {
            Intent::StartCall { recipient } => {
                assert_eq!(recipient, "bob");
            }
            _ => panic!("Expected StartCall intent"),
        }
    }

    #[test]
    fn test_parse_balance() {
        let parser = IntentParser::new();

        match parser.parse("what's my balance?") {
            Intent::CheckBalance => {}
            _ => panic!("Expected CheckBalance intent"),
        }
    }
}
