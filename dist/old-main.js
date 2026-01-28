document.addEventListener('DOMContentLoaded', init);

function init() {
    console.log('cinQ Connect initializing...');
    
    const state = {
        walletConnected: false,
        walletAddress: null,
        walletBalance: 0,
        escrowBalance: 0,
        nodeRunning: false,
        proxyRunning: false,
        hops: 0,
        bandwidthUsed: 0,
        bandwidthLimit: 10,
        demoMode: false,
    };

    // DOM Elements - Landing
    const landingPage = document.getElementById('landing-page');
    const mainApp = document.getElementById('main-app');
    const connectBtn = document.getElementById('connect-btn');
    const disconnectWallet = document.getElementById('disconnect-wallet');
    const walletAddrEl = document.getElementById('wallet-addr');
    
    // DOM Elements - Main Interface
    const nodeDot = document.getElementById('node-dot');
    const nodeStatus = document.getElementById('node-status');
    const peerCount = document.getElementById('peer-count');
    const bytesSent = document.getElementById('bytes-sent');
    const bytesReceived = document.getElementById('bytes-received');
    const bandwidthBar = document.getElementById('bandwidth-bar');
    const bandwidthPercent = document.getElementById('bandwidth-percent');
    const speedUp = document.getElementById('speed-up');
    const speedDown = document.getElementById('speed-down');
    const depinPeers = document.getElementById('depin-peers');
    const securityLevel = document.getElementById('security-level');
    const depinStatus = document.getElementById('depin-status');
    const escrowBalance = document.getElementById('escrow-balance');
    const escrowUsd = document.getElementById('escrow-usd');
    const walletBalance = document.getElementById('wallet-balance');
    const addQi = document.getElementById('add-qi');
    const hopBadges = document.querySelectorAll('.hop-badge');
    
    // DOM Elements - Controls
    const proxyToggle = document.getElementById('proxy-toggle');
    const proxyHint = document.getElementById('proxy-hint');
    const proxyStatusEl = document.getElementById('proxy-status');
    const proxyAddr = document.getElementById('proxy-addr');
    const proxyConns = document.getElementById('proxy-conns');

    // DOM Elements - Dev Dashboard
    const devCard = document.querySelector('.dev-card');
    const devToggle = document.getElementById('dev-toggle');
    const devExpand = document.getElementById('dev-expand');
    const devContent = document.getElementById('dev-content');
    const devLog = document.getElementById('dev-log');
    const devLogClear = document.getElementById('dev-log-clear');

    if (!connectBtn) {
        console.error('Connect button not found!');
        return;
    }
    console.log('DOM elements ready');

    // ============================================
    // Developer Dashboard
    // ============================================

    const devSteps = {
        wallet: { el: document.getElementById('step-wallet'), detail: document.getElementById('step-wallet-detail') },
        node: { el: document.getElementById('step-node'), detail: document.getElementById('step-node-detail') },
        mdns: { el: document.getElementById('step-mdns'), detail: document.getElementById('step-mdns-detail') },
        dht: { el: document.getElementById('step-dht'), detail: document.getElementById('step-dht-detail') },
        nat: { el: document.getElementById('step-nat'), detail: document.getElementById('step-nat-detail') },
        relay: { el: document.getElementById('step-relay'), detail: document.getElementById('step-relay-detail') },
        holepunch: { el: document.getElementById('step-holepunch'), detail: document.getElementById('step-holepunch-detail') },
        peers: { el: document.getElementById('step-peers'), detail: document.getElementById('step-peers-detail') },
        proxy: { el: document.getElementById('step-proxy'), detail: document.getElementById('step-proxy-detail') },
    };

    const devStats = {
        peerId: document.getElementById('dev-peer-id'),
        listenAddrs: document.getElementById('dev-listen-addrs'),
        natStatus: document.getElementById('dev-nat-status'),
        relayAddr: document.getElementById('dev-relay-addr'),
        discovered: document.getElementById('dev-discovered'),
        connected: document.getElementById('dev-connected'),
    };

    function setStepStatus(stepName, status, detail) {
        const step = devSteps[stepName];
        if (!step || !step.el) return;
        
        step.el.classList.remove('pending', 'active', 'success', 'error');
        if (status) step.el.classList.add(status);
        if (detail !== undefined && step.detail) {
            step.detail.textContent = detail;
        }
    }

    function devLogEntry(msg, type = 'info') {
        if (!devLog) return;
        
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const entry = document.createElement('div');
        entry.className = 'log-entry ' + type;
        entry.innerHTML = '<span class="log-time">' + time + '</span><span class="log-msg">' + msg + '</span>';
        devLog.appendChild(entry);
        devLog.scrollTop = devLog.scrollHeight;
        
        // Keep only last 100 entries
        while (devLog.children.length > 100) {
            devLog.removeChild(devLog.firstChild);
        }
    }

    function clearDevLog() {
        if (devLog) devLog.innerHTML = '';
    }

    function updateDevStats(stats) {
        if (stats.peerId && devStats.peerId) {
            devStats.peerId.textContent = stats.peerId.slice(0, 12) + '...' + stats.peerId.slice(-8);
            devStats.peerId.title = stats.peerId;
        }
        if (stats.listenAddrs && devStats.listenAddrs) {
            devStats.listenAddrs.textContent = stats.listenAddrs.length + ' addresses';
            devStats.listenAddrs.title = stats.listenAddrs.join('\\n');
        }
        if (stats.natStatus && devStats.natStatus) {
            devStats.natStatus.textContent = stats.natStatus;
        }
        if (stats.relayAddr && devStats.relayAddr) {
            devStats.relayAddr.textContent = stats.relayAddr ? stats.relayAddr.slice(0, 20) + '...' : '-';
            devStats.relayAddr.title = stats.relayAddr || '';
        }
        if (stats.discovered !== undefined && devStats.discovered) {
            devStats.discovered.textContent = stats.discovered + ' peers';
        }
        if (stats.connected !== undefined && devStats.connected) {
            devStats.connected.textContent = stats.connected + ' peers';
        }
    }

    // Toggle dev dashboard
    if (devToggle && devCard) {
        devToggle.addEventListener('click', function() {
            devCard.classList.toggle('collapsed');
        });
    }

    if (devLogClear) {
        devLogClear.addEventListener('click', clearDevLog);
    }

    // Manual peer connect
    const manualPeerInput = document.getElementById('manual-peer-addr');
    const manualConnectBtn = document.getElementById('manual-connect-btn');
    
    if (manualConnectBtn && manualPeerInput) {
        manualConnectBtn.addEventListener('click', async function() {
            const addr = manualPeerInput.value.trim();
            if (!addr) {
                logDev('error', 'Enter a multiaddr to connect');
                return;
            }
            logDev('info', `Dialing peer: ${addr.substring(0, 50)}...`);
            try {
                const result = await window.__TAURI__.invoke('connect_peer', { address: addr });
                if (result.ok) {
                    logDev('success', 'Connected to peer!');
                    manualPeerInput.value = '';
                } else {
                    logDev('error', `Failed: ${result.error}`);
                }
            } catch (e) {
                logDev('error', `Error: ${e}`);
            }
        });
    }

    // ============================================
    // Pelagus Wallet Integration
    // ============================================
    
    function detectPelagus() {
        return typeof window.pelagus !== 'undefined';
    }
    
    async function connectPelagusWallet() {
        if (!detectPelagus()) {
            // Demo mode - simulate wallet connection
            console.log('Pelagus not detected, using demo mode');
            const demoAddress = '0x' + Array(40).fill(0).map(() => 
                Math.floor(Math.random() * 16).toString(16)).join('');
            return { address: demoAddress, demo: true };
        }
        
        try {
            console.log('Requesting Pelagus accounts...');
            const accounts = await window.pelagus.request({ 
                method: 'quai_requestAccounts' 
            });
            
            if (accounts && accounts.length > 0) {
                const address = accounts[0];
                console.log('Connected to Pelagus:', address);
                return { address, demo: false };
            } else {
                console.log('No accounts returned from Pelagus');
                return null;
            }
        } catch (error) {
            if (error.code === 4001) {
                console.log('User rejected Pelagus connection request');
                alert('Connection rejected. Please approve the connection in Pelagus to use cinQ Connect.');
            } else {
                console.error('Failed to connect Pelagus:', error);
                alert('Failed to connect to Pelagus: ' + error.message);
            }
            return null;
        }
    }
    
    async function getPelagusBalance(address) {
        if (!detectPelagus() || !address) {
            return 0;
        }
        
        try {
            const balanceHex = await window.pelagus.request({
                method: 'quai_getBalance',
                params: [address, 'latest']
            });
            
            const balanceWei = BigInt(balanceHex);
            const balanceQi = Number(balanceWei) / 1e18;
            
            console.log('Pelagus balance:', balanceQi, 'Qi');
            return balanceQi;
        } catch (error) {
            console.error('Failed to get balance:', error);
            return 0;
        }
    }
    
    function setupPelagusListeners() {
        if (!detectPelagus()) return;
        
        window.pelagus.on('accountsChanged', async (accounts) => {
            console.log('Pelagus accounts changed:', accounts);
            if (accounts.length === 0) {
                doDisconnectWallet();
            } else if (accounts[0] !== state.walletAddress) {
                state.walletAddress = accounts[0];
                state.walletBalance = await getPelagusBalance(accounts[0]);
                updateBalances();
                updateWalletDisplay();
            }
        });
        
        window.pelagus.on('chainChanged', (chainId) => {
            console.log('Pelagus chain changed:', chainId);
            if (state.walletAddress) {
                getPelagusBalance(state.walletAddress).then(balance => {
                    state.walletBalance = balance;
                    updateBalances();
                });
            }
        });
    }

    // ============================================
    // Utility Functions
    // ============================================

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    function shortenAddress(address) {
        if (!address) return '';
        return address.slice(0, 6) + '...' + address.slice(-4);
    }

    // ============================================
    // UI Update Functions
    // ============================================

    function updateWalletUI() {
        if (state.walletConnected) {
            landingPage.classList.add('hidden');
            mainApp.classList.remove('hidden');
            // Show demo mode indicator
            const demoBadge = document.getElementById('demo-badge');
            if (demoBadge) {
                demoBadge.classList.toggle('hidden', !state.demoMode);
            }
        } else {
            landingPage.classList.remove('hidden');
            mainApp.classList.add('hidden');
        }
    }
    
    function updateWalletDisplay() {
        if (walletAddrEl && state.walletAddress) {
            walletAddrEl.textContent = shortenAddress(state.walletAddress);
            walletAddrEl.title = state.walletAddress;
        }
    }

    function updateBalances() {
        escrowBalance.textContent = state.escrowBalance.toFixed(4);
        escrowUsd.textContent = (state.escrowBalance * 0.15).toFixed(2);
        walletBalance.textContent = state.walletBalance.toFixed(4);
    }

    function updateHops(hops) {
        state.hops = hops;
        hopBadges.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.hops) === hops);
        });
        securityLevel.textContent = hops + ' Hops';
    }

    function updateNodeStatus(running) {
        state.nodeRunning = running;
        nodeDot.classList.toggle('online', running);
        nodeStatus.textContent = running ? 'Online' : 'Offline';
        depinStatus.textContent = running ? 'Active' : 'Idle';
    }

    function updateProxyStatus(running, address, connections) {
        state.proxyRunning = running;
        if (proxyToggle) proxyToggle.checked = running;
        if (proxyHint) proxyHint.textContent = running ? 'Active: ' + (address || '127.0.0.1:1080') : 'Configure browser: 127.0.0.1:1080';
        if (proxyStatusEl) proxyStatusEl.classList.toggle('active', running);
        if (proxyAddr) proxyAddr.textContent = running ? address : '';
        if (proxyConns) proxyConns.textContent = running ? (connections + ' active') : '';
    }

    function updateStats(peers, sent, received) {
        peerCount.textContent = peers;
        depinPeers.textContent = peers;
        bytesSent.textContent = formatBytes(sent);
        bytesReceived.textContent = formatBytes(received);
        speedUp.textContent = formatBytes(sent) + '/s';
        speedDown.textContent = formatBytes(received) + '/s';
        
        const usedGb = (sent + received) / (1024 * 1024 * 1024);
        const limit = state.escrowBalance || 10;
        const percent = Math.min((usedGb / limit) * 100, 100);
        bandwidthBar.style.width = percent + '%';
        bandwidthPercent.textContent = Math.round(percent) + '%';
    }

    // ============================================
    // Wallet Actions
    // ============================================

    async function doConnectWallet() {
        console.log('Connecting wallet...');
        connectBtn.textContent = 'Connecting...';
        connectBtn.disabled = true;
        
        // Update dev dashboard
        setStepStatus('wallet', 'pending', 'Connecting...');
        devLogEntry('Initiating wallet connection...', 'info');
        
        try {
            const result = await connectPelagusWallet();
            
            if (result) {
                state.walletConnected = true;
                state.walletAddress = result.address;
                state.demoMode = result.demo;
                
                if (result.demo) {
                    // Demo mode - simulate balance
                    state.walletBalance = 42.50;
                    setStepStatus('wallet', 'success', 'Demo: ' + shortenAddress(result.address));
                    devLogEntry('Demo mode: wallet simulated', 'warning');
                    devLogEntry('Address: ' + result.address, 'info');
                } else {
                    state.walletBalance = await getPelagusBalance(result.address);
                    setupPelagusListeners();
                    setStepStatus('wallet', 'success', 'Pelagus: ' + shortenAddress(result.address));
                    devLogEntry('Connected to Pelagus wallet', 'success');
                    devLogEntry('Address: ' + result.address, 'info');
                    devLogEntry('Balance: ' + state.walletBalance.toFixed(4) + ' Qi', 'info');
                }
                
                state.escrowBalance = 0;
                
                updateWalletUI();
                updateWalletDisplay();
                updateBalances();
                
                doStartNode();
            } else {
                setStepStatus('wallet', 'error', 'Connection failed');
                devLogEntry('Wallet connection failed', 'error');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            setStepStatus('wallet', 'error', error.message || 'Error');
            devLogEntry('Error: ' + error.message, 'error');
        } finally {
            connectBtn.textContent = 'Connect Pelagus';
            connectBtn.disabled = false;
        }
    }

    function doDisconnectWallet() {
        console.log('Disconnecting wallet...');
        devLogEntry('Disconnecting wallet...', 'info');
        
        if (state.proxyRunning) doStopProxy();
        if (state.nodeRunning) doStopNode();
        state.walletConnected = false;
        state.walletAddress = null;
        state.walletBalance = 0;
        state.escrowBalance = 0;
        
        // Reset dev dashboard
        setStepStatus('wallet', '', 'Not connected');
        setStepStatus('node', '', 'Waiting...');
        setStepStatus('mdns', '', 'Waiting...');
        setStepStatus('dht', '', 'Waiting...');
        setStepStatus('nat', '', 'Waiting...');
        setStepStatus('relay', '', 'Waiting...');
        setStepStatus('holepunch', '', 'Waiting...');
        setStepStatus('peers', '', '0 connections');
        setStepStatus('proxy', '', 'Not started');
        
        updateWalletUI();
        devLogEntry('Disconnected', 'info');
    }

    async function doAddToEscrow() {
        const amount = 10;
        
        if (state.walletBalance < amount) {
            alert('Insufficient Qi balance');
            return;
        }
        
        if (detectPelagus() && state.walletAddress) {
            console.log('Adding to escrow (simulated):', amount, 'Qi');
        }
        
        state.walletBalance -= amount;
        state.escrowBalance += amount;
        updateBalances();
    }

    // ============================================
    // Node & Proxy Control
    // ============================================

    let pollInterval = null;

    async function doStartNode() {
        setStepStatus('node', 'pending', 'Initializing...');
        devLogEntry('Starting P2P node...', 'info');
        
        try {
            if (window.__TAURI__ && window.__TAURI__.core) {
                const response = await window.__TAURI__.core.invoke('start_node');
                if (response.success) {
                    updateNodeStatus(true);
                    
                    // Update dev dashboard with real data
                    setStepStatus('node', 'success', 'Peer ID: ' + (response.data?.peer_id || 'Active').slice(0, 12) + '...');
                    devLogEntry('Node started successfully', 'success');
                    
                    if (response.data?.peer_id) {
                        devLogEntry('Peer ID: ' + response.data.peer_id, 'info');
                        updateDevStats({ peerId: response.data.peer_id });
                    }
                    if (response.data?.listen_addrs) {
                        updateDevStats({ listenAddrs: response.data.listen_addrs });
                        devLogEntry('Listening on ' + response.data.listen_addrs.length + ' addresses', 'info');
                    }
                    
                    // Start simulated connection sequence for demo
                    simulateConnectionSequence();
                    startPolling();
                } else {
                    setStepStatus('node', 'error', response.error || 'Failed');
                    devLogEntry('Failed to start node: ' + response.error, 'error');
                }
            } else {
                // Demo mode - simulate the full connection sequence
                updateNodeStatus(true);
                devLogEntry('Demo mode: simulating P2P network', 'warning');
                simulateDemoConnectionSequence();
                startPolling();
            }
        } catch (error) {
            console.error('Failed to start node:', error);
            setStepStatus('node', 'error', error.message || 'Error');
            devLogEntry('Error starting node: ' + error.message, 'error');
        }
    }

    function simulateDemoConnectionSequence() {
        const steps = [
            { delay: 200, step: 'node', status: 'success', detail: 'Peer ID: 12D3KooW...demo', log: 'Node initialized (demo)', logType: 'success' },
            { delay: 500, step: 'mdns', status: 'pending', detail: 'Scanning...', log: 'Starting mDNS discovery...', logType: 'info' },
            { delay: 1500, step: 'mdns', status: 'success', detail: '0 local peers', log: 'mDNS discovery active', logType: 'success' },
            { delay: 2000, step: 'dht', status: 'pending', detail: 'Bootstrapping...', log: 'Connecting to DHT bootstrap nodes...', logType: 'info' },
            { delay: 3500, step: 'dht', status: 'success', detail: 'Connected to 3 nodes', log: 'DHT bootstrap complete', logType: 'success' },
            { delay: 4000, step: 'nat', status: 'pending', detail: 'Detecting...', log: 'Detecting NAT type...', logType: 'info' },
            { delay: 5500, step: 'nat', status: 'success', detail: 'Symmetric NAT', log: 'NAT detected: Symmetric', logType: 'success', stats: { natStatus: 'Symmetric NAT' } },
            { delay: 6000, step: 'relay', status: 'pending', detail: 'Reserving...', log: 'Requesting relay reservation...', logType: 'info' },
            { delay: 7500, step: 'relay', status: 'success', detail: 'Circuit ready', log: 'Relay circuit established', logType: 'success', stats: { relayAddr: '/p2p-circuit/demo-relay' } },
            { delay: 8000, step: 'holepunch', status: 'pending', detail: 'Ready', log: 'DCUtR hole punch ready', logType: 'info' },
            { delay: 8500, step: 'holepunch', status: 'success', detail: 'Available', log: 'Direct connection upgrade available', logType: 'success' },
            { delay: 9000, step: 'peers', status: 'active', detail: '0 connections', log: 'Peer mesh ready, waiting for peers...', logType: 'info', stats: { discovered: 0, connected: 0 } },
        ];
        
        // Simulate demo peer ID
        const demoPeerId = '12D3KooW' + Math.random().toString(36).substr(2, 8) + 'Demo';
        updateDevStats({ peerId: demoPeerId, listenAddrs: ['/ip4/127.0.0.1/tcp/0', '/ip4/0.0.0.0/udp/0/quic-v1'] });
        
        steps.forEach(s => {
            setTimeout(() => {
                setStepStatus(s.step, s.status, s.detail);
                if (s.log) devLogEntry(s.log, s.logType);
                if (s.stats) updateDevStats(s.stats);
            }, s.delay);
        });
    }

    function simulateConnectionSequence() {
        // Similar to demo but will be replaced with real events from Tauri
        setStepStatus('mdns', 'pending', 'Scanning...');
        devLogEntry('Starting mDNS discovery...', 'info');
        
        setTimeout(() => {
            setStepStatus('mdns', 'success', 'Active');
            devLogEntry('mDNS discovery active', 'success');
        }, 1000);
        
        setTimeout(() => {
            setStepStatus('dht', 'pending', 'Bootstrapping...');
            devLogEntry('Connecting to DHT...', 'info');
        }, 1500);
        
        setTimeout(() => {
            setStepStatus('dht', 'success', 'Connected');
            devLogEntry('DHT bootstrap complete', 'success');
        }, 3000);
        
        setTimeout(() => {
            setStepStatus('nat', 'pending', 'Detecting...');
            devLogEntry('Detecting NAT type...', 'info');
        }, 3500);
        
        setTimeout(() => {
            setStepStatus('nat', 'success', 'Detected');
            devLogEntry('NAT detection complete', 'success');
        }, 5000);
        
        setTimeout(() => {
            setStepStatus('relay', 'active', 'Available');
            setStepStatus('holepunch', 'active', 'Ready');
            setStepStatus('peers', 'active', 'Listening');
            devLogEntry('P2P mesh ready', 'success');
        }, 6000);
    }

    async function doStopNode() {
        devLogEntry('Stopping node...', 'info');
        try {
            if (state.proxyRunning) {
                await doStopProxy();
            }
            if (window.__TAURI__ && window.__TAURI__.core) {
                await window.__TAURI__.core.invoke('stop_node');
            }
            updateNodeStatus(false);
            stopPolling();
            
            // Reset pipeline
            setStepStatus('node', '', 'Stopped');
            setStepStatus('mdns', '', 'Stopped');
            setStepStatus('dht', '', 'Stopped');
            setStepStatus('nat', '', 'Stopped');
            setStepStatus('relay', '', 'Stopped');
            setStepStatus('holepunch', '', 'Stopped');
            setStepStatus('peers', '', '0 connections');
            
            devLogEntry('Node stopped', 'info');
        } catch (error) {
            console.error('Failed to stop node:', error);
            devLogEntry('Error stopping node: ' + error.message, 'error');
        }
    }

    async function doStartProxy() {
        if (!state.nodeRunning) {
            alert('Please start the node first');
            if (proxyToggle) proxyToggle.checked = false;
            return;
        }
        
        setStepStatus('proxy', 'pending', 'Starting...');
        devLogEntry('Starting SOCKS5 proxy...', 'info');
        
        try {
            if (window.__TAURI__ && window.__TAURI__.core) {
                const response = await window.__TAURI__.core.invoke('start_proxy', { port: 1080 });
                if (response.success) {
                    updateProxyStatus(true, response.data, 0);
                    setStepStatus('proxy', 'success', response.data);
                    devLogEntry('Proxy started on ' + response.data, 'success');
                } else {
                    setStepStatus('proxy', 'error', response.error || 'Failed');
                    devLogEntry('Failed to start proxy: ' + response.error, 'error');
                    alert('Failed to start proxy: ' + response.error);
                    if (proxyToggle) proxyToggle.checked = false;
                }
            } else {
                // Demo mode
                updateProxyStatus(true, '127.0.0.1:1080', 0);
                setStepStatus('proxy', 'success', '127.0.0.1:1080');
                devLogEntry('Demo: Proxy simulated on 127.0.0.1:1080', 'warning');
            }
        } catch (error) {
            console.error('Failed to start proxy:', error);
            setStepStatus('proxy', 'error', error.message || 'Error');
            devLogEntry('Error: ' + error.message, 'error');
            if (proxyToggle) proxyToggle.checked = false;
        }
    }

    async function doStopProxy() {
        try {
            if (window.__TAURI__ && window.__TAURI__.core) {
                await window.__TAURI__.core.invoke('stop_proxy');
            }
            updateProxyStatus(false, '', 0);
        } catch (error) {
            console.error('Failed to stop proxy:', error);
        }
    }

    // ============================================
    // Polling & Stats
    // ============================================

    async function fetchStats() {
        try {
            if (window.__TAURI__ && window.__TAURI__.core) {
                const [peersRes, metricsRes, proxyRes] = await Promise.all([
                    window.__TAURI__.core.invoke('get_peers'),
                    window.__TAURI__.core.invoke('get_billing_summary'),
                    window.__TAURI__.core.invoke('get_proxy_status')
                ]);
                if (peersRes.success && metricsRes.success) {
                    updateStats(peersRes.data.length, metricsRes.data.total_bytes_sent, metricsRes.data.total_bytes_received);
                }
                if (proxyRes.success && proxyRes.data) {
                    updateProxyStatus(proxyRes.data.running, proxyRes.data.listen_address, proxyRes.data.active_connections);
                }
            } else {
                updateStats(0, 0, 0);
            }
            
            if (state.walletConnected && state.walletAddress && detectPelagus()) {
                const newBalance = await getPelagusBalance(state.walletAddress);
                if (Math.abs(newBalance - state.walletBalance) > 0.0001) {
                    state.walletBalance = newBalance;
                    updateBalances();
                }
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }

    function startPolling() {
        fetchStats();
        pollInterval = setInterval(fetchStats, 5000);
    }

    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    // ============================================
    // Event Listeners
    // ============================================
    
    connectBtn.addEventListener('click', function() {
        console.log('Connect button clicked!');
        doConnectWallet();
    });
    
    disconnectWallet.addEventListener('click', function() {
        console.log('Disconnect clicked!');
        doDisconnectWallet();
    });

    addQi.addEventListener('click', doAddToEscrow);

    hopBadges.forEach(function(btn) {
        btn.addEventListener('click', function() {
            updateHops(parseInt(btn.dataset.hops));
        });
    });

    if (proxyToggle) {
        proxyToggle.addEventListener('change', function(e) {
            if (e.target.checked) {
                doStartProxy();
            } else {
                doStopProxy();
            }
        });
    }

    // ============================================
    // Initialization
    // ============================================
    
    async function checkExistingConnection() {
        if (detectPelagus()) {
            try {
                const accounts = await window.pelagus.request({ method: 'quai_accounts' });
                if (accounts && accounts.length > 0) {
                    console.log('Found existing Pelagus connection:', accounts[0]);
                    state.walletConnected = true;
                    state.walletAddress = accounts[0];
                    state.walletBalance = await getPelagusBalance(accounts[0]);
                    setupPelagusListeners();
                    updateWalletUI();
                    updateWalletDisplay();
                    updateBalances();
                    doStartNode();
                }
            } catch (error) {
                console.log('No existing Pelagus connection');
            }
        }
    }

    updateHops(0);
    checkExistingConnection();
    console.log('cinQ Connect ready!');
}
