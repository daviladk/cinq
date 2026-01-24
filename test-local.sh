#!/bin/bash
# cinQ Connect - Local P2P Testing Script
# Run this on two machines on the same network

echo "======================================"
echo "   cinQ Connect - Local P2P Test"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "src-tauri/target/debug/cinq-connect" ]; then
    echo "Building debug version first..."
    cd src-tauri && cargo build && cd ..
fi

echo "Starting cinQ Connect..."
echo ""
echo "To test P2P discovery:"
echo "1. Run this script on BOTH machines"
echo "2. In each app:"
echo "   - Click 'Connect Pelagus' (mock wallet)"
echo "   - Click '+ Add 10 Qi'"
echo "   - Toggle the Node switch ON"
echo "3. Both apps should show '1 peer' within 5-10 seconds"
echo ""
echo "Watch the logs below for mDNS discovery events..."
echo "======================================"
echo ""

# Set RUST_LOG to see the networking logs
export RUST_LOG=info,libp2p=debug,cinq=debug

# Run the app
./src-tauri/target/debug/cinq-connect
