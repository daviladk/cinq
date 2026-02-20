// Cinq Relay Node - Headless bootstrap/relay server for the Cinq network
//
// Run this on a machine with a public IP to help NAT-ed peers connect.
// Usage: cinq-relay --port 9000 --external-ip 1.2.3.4

use clap::Parser;
use futures::StreamExt;
use libp2p::{
    autonat, dcutr, identify,
    identity::{self, Keypair},
    mdns, noise, relay,
    swarm::SwarmEvent,
    tcp, yamux, Multiaddr, PeerId, Swarm,
};
use std::error::Error;
use std::path::PathBuf;
use std::time::Duration;
use tokio::signal;

// Re-use protocol definitions from the main crate
use cinq_lib::grid::protocol::{
    new_autonat, new_cinq_protocol, new_identify, new_kademlia, CinqRelayBehaviour,
    CinqRelayBehaviourEvent,
};

#[derive(Parser, Debug)]
#[command(name = "cinq-relay")]
#[command(about = "Cinq Network Relay Node - Bootstrap and relay server for P2P mesh")]
#[command(version)]
struct Args {
    /// Port to listen on
    #[arg(short, long, default_value = "9000")]
    port: u16,

    /// External IP address to advertise (required for relay mode)
    #[arg(short, long)]
    external_ip: Option<String>,

    /// Data directory for storing keypair and peer info
    #[arg(short, long, default_value = "~/.cinq-relay")]
    data_dir: String,

    /// Enable verbose logging
    #[arg(short, long)]
    verbose: bool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error + Send + Sync>> {
    let args = Args::parse();

    // Setup logging
    let log_level = if args.verbose { "debug" } else { "info" };
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or(log_level))
        .format_timestamp_secs()
        .init();

    // Expand data directory
    let data_dir = if args.data_dir.starts_with("~") {
        dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(args.data_dir.trim_start_matches("~/"))
    } else {
        PathBuf::from(&args.data_dir)
    };
    std::fs::create_dir_all(&data_dir)?;

    // Load or generate keypair (persisted so peer ID stays consistent)
    let keypair_path = data_dir.join("keypair.bin");
    let keypair = if keypair_path.exists() {
        let keypair_bytes = std::fs::read(&keypair_path)?;
        identity::Keypair::from_protobuf_encoding(&keypair_bytes)
            .map_err(|e| format!("Failed to decode keypair: {}", e))?
    } else {
        let new_keypair = identity::Keypair::generate_ed25519();
        let keypair_bytes = new_keypair
            .to_protobuf_encoding()
            .map_err(|e| format!("Failed to encode keypair: {}", e))?;
        std::fs::write(&keypair_path, &keypair_bytes)?;
        log::info!("Generated new keypair at {:?}", keypair_path);
        new_keypair
    };

    let local_peer_id = PeerId::from(keypair.public());

    log::info!("╔════════════════════════════════════════════════════════════════╗");
    log::info!("║              CINQ RELAY NODE                                   ║");
    log::info!("╠════════════════════════════════════════════════════════════════╣");
    log::info!("║ Peer ID: {}  ║", local_peer_id);
    log::info!(
        "║ Port: {:5}                                                    ║",
        args.port
    );
    if let Some(ref ip) = args.external_ip {
        log::info!(
            "║ External IP: {:15}                                  ║",
            ip
        );
    }
    log::info!("╚════════════════════════════════════════════════════════════════╝");

    // Build the relay swarm
    let mut swarm = build_relay_swarm(keypair.clone())?;

    // Listen on all interfaces
    let listen_addr: Multiaddr = format!("/ip4/0.0.0.0/tcp/{}", args.port)
        .parse()
        .expect("Valid multiaddr");

    swarm.listen_on(listen_addr)?;

    // If external IP is provided, add it as an external address
    if let Some(ref external_ip) = args.external_ip {
        let external_addr: Multiaddr = format!("/ip4/{}/tcp/{}", external_ip, args.port)
            .parse()
            .expect("Valid external multiaddr");
        swarm.add_external_address(external_addr.clone());
        log::info!("Added external address: {}", external_addr);

        // Print the full connection string for clients
        log::info!("");
        log::info!("📋 Client connection string (add to bootstrap_config):");
        log::info!(
            "   /ip4/{}/tcp/{}/p2p/{}",
            external_ip,
            args.port,
            local_peer_id
        );
        log::info!("");
    }

    // Track some stats
    let mut connections: u64 = 0;
    let mut relayed_circuits: u64 = 0;

    log::info!("Relay node started. Press Ctrl+C to stop.");

    // Main event loop
    loop {
        tokio::select! {
            event = swarm.select_next_some() => {
                match event {
                    SwarmEvent::NewListenAddr { address, .. } => {
                        log::info!("🎧 Listening on: {}/p2p/{}", address, local_peer_id);
                    }

                    SwarmEvent::ConnectionEstablished { peer_id, endpoint, .. } => {
                        connections += 1;
                        log::info!("✅ Peer connected: {} via {:?} (total: {})",
                            peer_id, endpoint.get_remote_address(), connections);
                    }

                    SwarmEvent::ConnectionClosed { peer_id, cause, .. } => {
                        if connections > 0 {
                            connections -= 1;
                        }
                        log::info!("❌ Peer disconnected: {} cause: {:?} (remaining: {})",
                            peer_id, cause, connections);
                    }

                    SwarmEvent::Behaviour(CinqRelayBehaviourEvent::RelayServer(relay_event)) => {
                        match relay_event {
                            relay::Event::ReservationReqAccepted { src_peer_id, renewed } => {
                                if renewed {
                                    log::debug!("🔄 Relay reservation renewed: {}", src_peer_id);
                                } else {
                                    relayed_circuits += 1;
                                    log::info!("🔗 Relay reservation accepted: {} (total circuits: {})",
                                        src_peer_id, relayed_circuits);
                                }
                            }
                            relay::Event::CircuitClosed { src_peer_id, dst_peer_id, .. } => {
                                log::info!("📴 Circuit closed: {} -> {}", src_peer_id, dst_peer_id);
                            }
                            _ => {
                                log::debug!("Relay event: {:?}", relay_event);
                            }
                        }
                    }

                    SwarmEvent::Behaviour(CinqRelayBehaviourEvent::Mdns(mdns::Event::Discovered(peers))) => {
                        for (peer_id, addr) in peers {
                            log::debug!("mDNS discovered: {} at {}", peer_id, addr);
                            swarm.behaviour_mut().kademlia.add_address(&peer_id, addr);
                        }
                    }

                    SwarmEvent::Behaviour(CinqRelayBehaviourEvent::Kademlia(kad_event)) => {
                        log::debug!("Kademlia: {:?}", kad_event);
                    }

                    SwarmEvent::Behaviour(CinqRelayBehaviourEvent::Identify(identify::Event::Received { peer_id, info, .. })) => {
                        log::debug!("Identified peer {}: {} {:?}", peer_id, info.protocol_version, info.protocols);
                        // Add peer's addresses to Kademlia
                        for addr in info.listen_addrs {
                            swarm.behaviour_mut().kademlia.add_address(&peer_id, addr);
                        }
                    }

                    SwarmEvent::Behaviour(CinqRelayBehaviourEvent::Autonat(autonat_event)) => {
                        match autonat_event {
                            autonat::Event::StatusChanged { old, new } => {
                                log::info!("NAT status: {:?} -> {:?}", old, new);
                            }
                            _ => {}
                        }
                    }

                    _ => {
                        log::trace!("Swarm event: {:?}", event);
                    }
                }
            }

            _ = signal::ctrl_c() => {
                log::info!("Shutting down relay node...");
                break;
            }
        }
    }

    log::info!(
        "Relay node stopped. Stats: {} connections, {} circuits",
        connections,
        relayed_circuits
    );
    Ok(())
}

/// Build a relay-capable swarm
fn build_relay_swarm(
    keypair: Keypair,
) -> Result<Swarm<CinqRelayBehaviour>, Box<dyn Error + Send + Sync>> {
    let swarm = libp2p::SwarmBuilder::with_existing_identity(keypair.clone())
        .with_tokio()
        .with_tcp(
            tcp::Config::default(),
            noise::Config::new,
            yamux::Config::default,
        )?
        .with_relay_client(noise::Config::new, yamux::Config::default)?
        .with_behaviour(|key, relay_client| {
            let local_peer_id = key.public().to_peer_id();

            // mDNS for local discovery
            let mdns = mdns::tokio::Behaviour::new(mdns::Config::default(), local_peer_id)?;

            // Kademlia DHT for global discovery
            let kademlia = new_kademlia(local_peer_id);

            // Identify protocol
            let identify = new_identify(key.public());

            // AutoNAT for NAT detection (we should be public!)
            let autonat = new_autonat(local_peer_id);

            // DCUTR for hole punching
            let dcutr = dcutr::Behaviour::new(local_peer_id);

            // Relay SERVER - this is what makes us a relay node!
            let relay_server = relay::Behaviour::new(local_peer_id, relay::Config::default());

            // Our custom protocol
            let protocol = new_cinq_protocol();

            Ok(CinqRelayBehaviour {
                mdns,
                kademlia,
                identify,
                autonat,
                dcutr,
                relay_server,
                relay_client,
                protocol,
            })
        })?
        .with_swarm_config(|c| c.with_idle_connection_timeout(Duration::from_secs(300)))
        .build();

    Ok(swarm)
}
