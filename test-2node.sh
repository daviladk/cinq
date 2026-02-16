#!/bin/bash
# cinQ Connect - 2-Node Local P2P Chat Test
# Tests direct peer-to-peer messaging between two nodes on the same machine

set -e

echo "======================================"
echo "   cinQ - 2-Node Local Chat Test"
echo "======================================"
echo ""

# Build if needed
if [ ! -f "src-tauri/target/debug/cinq-relay" ]; then
    echo "Building debug version first..."
    cd src-tauri && cargo build && cd ..
fi

# Clean up any old test data
echo "Cleaning test data directories..."
rm -rf /tmp/cinq-test-node1
rm -rf /tmp/cinq-test-node2

# Create test directories
mkdir -p /tmp/cinq-test-node1
mkdir -p /tmp/cinq-test-node2

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set log level
export RUST_LOG=info,libp2p_mdns=debug,libp2p_kad=debug

echo ""
echo "Starting Node 1 (port 9001)..."
./src-tauri/target/debug/cinq-relay --port 9001 --data-dir /tmp/cinq-test-node1 &
NODE1_PID=$!
echo "  Node 1 PID: $NODE1_PID"

sleep 2

echo ""
echo "Starting Node 2 (port 9002)..."
./src-tauri/target/debug/cinq-relay --port 9002 --data-dir /tmp/cinq-test-node2 &
NODE2_PID=$!
echo "  Node 2 PID: $NODE2_PID"

echo ""
echo "======================================"
echo "Both nodes started. They should discover each other via mDNS."
echo ""
echo "Watch the logs for:"
echo "  ✅ 'Peer connected' messages"
echo "  🔍 mDNS discovery events"
echo ""
echo "Press Ctrl+C to stop both nodes."
echo "======================================"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping nodes...'; kill $NODE1_PID $NODE2_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Keep script running
wait
