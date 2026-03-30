// cinQ MCP Server - Model Context Protocol for Entropic integration
//
// Exposes cinQ Cloud services (ID, Chat, Drive, Pay) as MCP tools
// that Claude in Entropic can call.

mod protocol;
mod server;
mod tools;

pub use protocol::*;
pub use server::*;
pub use tools::*;
