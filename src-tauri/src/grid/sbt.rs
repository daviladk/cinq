// Cinq SBT (Soul Bound Token) Integration
// 
// SBTs are non-transferable NFTs that represent on-chain identity.
// When minted on a Quai zone, they provide:
//   - A verified, unique Chat ID tied to the user's wallet
//   - Zone-based distribution across Quai's sharded architecture
//   - On-chain proof of identity ownership
//
// Contract Address (to be deployed):
//   Cyprus (zone 0): 0x... 
//   Paxos (zone 1):  0x...
//   Hydra (zone 2):  0x...

use serde::{Deserialize, Serialize};
use crate::grid::userid::{UserId, QuaiZone};

/// SBT Contract ABI function signatures
pub mod abi {
    /// mint() - Mint a new SBT with auto-assigned ID
    /// Returns: uint256 tokenId (encodes zone + 10-digit ID)
    pub const MINT: &str = "mint()";
    
    /// getUserId(address) - Get user's Chat ID from their wallet address
    /// Returns: (uint8 zone, uint64 localId)
    pub const GET_USER_ID: &str = "getUserId(address)";
    
    /// getOwner(uint8 zone, uint64 localId) - Get wallet that owns a Chat ID
    /// Returns: address owner (0x0 if not minted)
    pub const GET_OWNER: &str = "getOwner(uint8,uint64)";
    
    /// verifyOwnership(address, uint8 zone, uint64 localId) - Verify ownership
    /// Returns: bool isOwner
    pub const VERIFY_OWNERSHIP: &str = "verifyOwnership(address,uint8,uint64)";
}

/// SBT contract addresses per zone (placeholder - to be deployed)
#[derive(Debug, Clone)]
pub struct SbtContracts {
    pub cyprus: Option<String>,  // Zone 0
    pub paxos: Option<String>,   // Zone 1
    pub hydra: Option<String>,   // Zone 2
}

impl Default for SbtContracts {
    fn default() -> Self {
        Self {
            // TODO: Update with deployed contract addresses
            cyprus: None,
            paxos: None,
            hydra: None,
        }
    }
}

impl SbtContracts {
    /// Get contract address for a zone
    pub fn for_zone(&self, zone: QuaiZone) -> Option<&str> {
        match zone {
            QuaiZone::Cyprus => self.cyprus.as_deref(),
            QuaiZone::Paxos => self.paxos.as_deref(),
            QuaiZone::Hydra => self.hydra.as_deref(),
        }
    }
}

/// Information about a user's SBT
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SbtInfo {
    /// The Chat ID derived from the SBT
    pub user_id: UserId,
    /// The Quai zone where the SBT was minted
    pub zone: QuaiZone,
    /// The wallet address that owns the SBT
    pub owner: String,
    /// Token ID on the contract
    pub token_id: String,
    /// Block number when minted
    pub minted_block: Option<u64>,
    /// Transaction hash of mint
    pub mint_tx: Option<String>,
}

/// SBT verification proof (for DHT publication)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SbtProof {
    /// The Chat ID being claimed
    pub user_id: UserId,
    /// Wallet address claiming ownership
    pub wallet: String,
    /// Signature of: "cinq-identity:{user_id}:{peer_id}:{timestamp}"
    pub signature: String,
    /// Unix timestamp of the signature
    pub timestamp: u64,
    /// The peer ID this identity maps to
    pub peer_id: String,
}

impl SbtProof {
    /// Create the message to be signed for identity verification
    pub fn create_message(user_id: &UserId, peer_id: &str, timestamp: u64) -> String {
        format!("cinq-identity:{}:{}:{}", user_id.as_str(), peer_id, timestamp)
    }
    
    /// Verify the proof signature (requires wallet verification)
    /// This will be implemented when we integrate with Quai RPC
    pub fn verify(&self) -> Result<bool, SbtError> {
        // TODO: Implement signature verification
        // 1. Reconstruct the message
        // 2. Recover signer from signature
        // 3. Verify signer matches wallet
        // 4. Optionally verify on-chain SBT ownership
        
        // For now, return unverified
        Err(SbtError::NotImplemented("Signature verification not yet implemented".into()))
    }
}

/// SBT-related errors
#[derive(Debug, Clone)]
pub enum SbtError {
    /// Contract not deployed on this zone
    ContractNotDeployed(QuaiZone),
    /// User doesn't have an SBT
    NoSbtFound(String),
    /// Invalid signature
    InvalidSignature(String),
    /// RPC error
    RpcError(String),
    /// Feature not implemented yet
    NotImplemented(String),
}

impl std::fmt::Display for SbtError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ContractNotDeployed(zone) => {
                write!(f, "SBT contract not deployed on {} zone", zone.name())
            }
            Self::NoSbtFound(addr) => write!(f, "No SBT found for wallet {}", addr),
            Self::InvalidSignature(msg) => write!(f, "Invalid signature: {}", msg),
            Self::RpcError(msg) => write!(f, "RPC error: {}", msg),
            Self::NotImplemented(msg) => write!(f, "Not implemented: {}", msg),
        }
    }
}

impl std::error::Error for SbtError {}

/// SBT Manager - handles minting and verification
pub struct SbtManager {
    /// Contract addresses per zone
    contracts: SbtContracts,
    /// RPC endpoints per zone (placeholder)
    rpc_endpoints: std::collections::HashMap<u8, String>,
}

impl SbtManager {
    pub fn new() -> Self {
        Self {
            contracts: SbtContracts::default(),
            rpc_endpoints: std::collections::HashMap::new(),
        }
    }
    
    /// Configure RPC endpoint for a zone
    pub fn set_rpc_endpoint(&mut self, zone: QuaiZone, endpoint: String) {
        self.rpc_endpoints.insert(zone.code(), endpoint);
    }
    
    /// Configure contract address for a zone
    pub fn set_contract(&mut self, zone: QuaiZone, address: String) {
        match zone {
            QuaiZone::Cyprus => self.contracts.cyprus = Some(address),
            QuaiZone::Paxos => self.contracts.paxos = Some(address),
            QuaiZone::Hydra => self.contracts.hydra = Some(address),
        }
    }
    
    /// Check if SBT minting is available for a zone
    pub fn is_available(&self, zone: QuaiZone) -> bool {
        self.contracts.for_zone(zone).is_some() 
            && self.rpc_endpoints.contains_key(&zone.code())
    }
    
    /// Get user's Chat ID from their wallet (queries the SBT contract)
    pub async fn get_user_id(&self, wallet: &str, zone: QuaiZone) -> Result<Option<UserId>, SbtError> {
        let _contract = self.contracts.for_zone(zone)
            .ok_or(SbtError::ContractNotDeployed(zone))?;
        
        let _rpc = self.rpc_endpoints.get(&zone.code())
            .ok_or(SbtError::RpcError("No RPC endpoint configured".into()))?;
        
        // TODO: Implement actual contract call
        // 1. Call getUserId(wallet) on the SBT contract
        // 2. Decode the response (zone, localId)
        // 3. Return UserId::from_sbt(zone, localId)
        
        Err(SbtError::NotImplemented("Contract calls not yet implemented".into()))
    }
    
    /// Verify that a wallet owns a specific Chat ID
    pub async fn verify_ownership(
        &self, 
        wallet: &str, 
        user_id: &UserId
    ) -> Result<bool, SbtError> {
        let zone_code = user_id.zone.ok_or(
            SbtError::InvalidSignature("Legacy IDs cannot be verified on-chain".into())
        )?;
        
        let zone = QuaiZone::from_code(zone_code)
            .ok_or(SbtError::InvalidSignature("Invalid zone code".into()))?;
        
        let _contract = self.contracts.for_zone(zone)
            .ok_or(SbtError::ContractNotDeployed(zone))?;
        
        // TODO: Implement actual contract call
        // 1. Call verifyOwnership(wallet, zone, localId) on the SBT contract
        // 2. Return the boolean result
        
        Err(SbtError::NotImplemented("Contract calls not yet implemented".into()))
    }
    
    /// Create a proof of identity for DHT publication
    /// The wallet must sign the message to prove ownership
    pub fn create_proof_message(
        &self, 
        user_id: &UserId, 
        peer_id: &str
    ) -> String {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        SbtProof::create_message(user_id, peer_id, timestamp)
    }
}

impl Default for SbtManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_proof_message_format() {
        let user_id = UserId::from_sbt(QuaiZone::Hydra, "5551234567").unwrap();
        let peer_id = "12D3KooWTest123";
        let timestamp = 1700000000u64;
        
        let message = SbtProof::create_message(&user_id, peer_id, timestamp);
        assert_eq!(message, "cinq-identity:25551234567:12D3KooWTest123:1700000000");
    }
    
    #[test]
    fn test_sbt_manager_availability() {
        let mut manager = SbtManager::new();
        
        // Not available by default
        assert!(!manager.is_available(QuaiZone::Cyprus));
        
        // Still not available with just contract
        manager.set_contract(QuaiZone::Cyprus, "0x1234".into());
        assert!(!manager.is_available(QuaiZone::Cyprus));
        
        // Available with both contract and RPC
        manager.set_rpc_endpoint(QuaiZone::Cyprus, "http://localhost:8545".into());
        assert!(manager.is_available(QuaiZone::Cyprus));
    }
    
    #[test]
    fn test_zone_names() {
        assert_eq!(QuaiZone::Cyprus.name(), "Cyprus");
        assert_eq!(QuaiZone::Paxos.name(), "Paxos");
        assert_eq!(QuaiZone::Hydra.name(), "Hydra");
    }
}
