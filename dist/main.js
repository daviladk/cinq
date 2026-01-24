document.addEventListener('DOMContentLoaded', init);

function init() {
    console.log('cinQ Connect initializing...');
    
    const state = {
        walletConnected: false,
        walletAddress: null,
        walletBalance: 0,
        escrowBalance: 0,
        nodeRunning: false,
        hops: 0,
        bandwidthUsed: 0,
        bandwidthLimit: 10,
    };

    // DOM Elements - Landing
    const landingPage = document.getElementById('landing-page');
    const mainApp = document.getElementById('main-app');
    const connectBtn = document.getElementById('connect-btn');
    const disconnectWallet = document.getElementById('disconnect-wallet');
    
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

    if (!connectBtn) {
        console.error('Connect button not found!');
        return;
    }
    console.log('DOM elements ready');

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function updateWalletUI() {
        console.log('updateWalletUI called, connected:', state.walletConnected);
        if (state.walletConnected) {
            landingPage.classList.add('hidden');
            mainApp.classList.remove('hidden');
        } else {
            landingPage.classList.remove('hidden');
            mainApp.classList.add('hidden');
        }
    }

    function updateBalances() {
        escrowBalance.textContent = state.escrowBalance.toFixed(4);
        escrowUsd.textContent = (state.escrowBalance * 0.15).toFixed(2);
        walletBalance.textContent = state.walletBalance.toFixed(2);
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

    function doConnectWallet() {
        console.log('Connecting wallet...');
        state.walletConnected = true;
        state.walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
        state.walletBalance = 42.50;
        state.escrowBalance = 0;
        updateWalletUI();
        updateBalances();
        // Auto-start node when wallet connects
        doStartNode();
    }

    function doDisconnectWallet() {
        console.log('Disconnecting wallet...');
        if (state.nodeRunning) doStopNode();
        state.walletConnected = false;
        state.walletAddress = null;
        state.walletBalance = 0;
        state.escrowBalance = 0;
        updateWalletUI();
    }

    function doAddToEscrow() {
        const amount = 10;
        if (state.walletBalance >= amount) {
            state.walletBalance -= amount;
            state.escrowBalance += amount;
            updateBalances();
        } else {
            alert('Insufficient Qi balance');
        }
    }

    let pollInterval = null;

    async function doStartNode() {
        try {
            if (window.__TAURI__?.core?.invoke) {
                const response = await window.__TAURI__.core.invoke('start_node');
                if (response.success) {
                    updateNodeStatus(true);
                    startPolling();
                } else {
                    console.error('Failed to start node:', response.error);
                }
            } else {
                // Demo mode
                updateNodeStatus(true);
                startPolling();
            }
        } catch (error) {
            console.error('Failed to start node:', error);
        }
    }

    async function doStopNode() {
        try {
            if (window.__TAURI__?.core?.invoke) {
                await window.__TAURI__.core.invoke('stop_node');
            }
            updateNodeStatus(false);
            stopPolling();
        } catch (error) {
            console.error('Failed to stop node:', error);
        }
    }

    async function fetchStats() {
        try {
            if (window.__TAURI__?.core?.invoke) {
                const [peersRes, metricsRes] = await Promise.all([
                    window.__TAURI__.core.invoke('get_peers'),
                    window.__TAURI__.core.invoke('get_billing_summary')
                ]);
                if (peersRes.success && metricsRes.success) {
                    updateStats(peersRes.data.length, metricsRes.data.total_bytes_sent, metricsRes.data.total_bytes_received);
                }
            } else {
                updateStats(0, 0, 0);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }

    function startPolling() {
        fetchStats();
        pollInterval = setInterval(fetchStats, 3000);
    }

    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    // Event Listeners
    connectBtn.addEventListener('click', () => {
        console.log('Connect button clicked!');
        doConnectWallet();
    });
    
    disconnectWallet.addEventListener('click', () => {
        console.log('Disconnect clicked!');
        doDisconnectWallet();
    });

    addQi.addEventListener('click', doAddToEscrow);

    hopBadges.forEach(btn => {
        btn.addEventListener('click', () => updateHops(parseInt(btn.dataset.hops)));
    });

    updateHops(0);
    console.log('cinQ Connect ready!');
}
