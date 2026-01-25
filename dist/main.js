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
    const nodeToggle = document.getElementById('node-toggle');
    const nodeHint = document.getElementById('node-hint');
    const proxyToggle = document.getElementById('proxy-toggle');
    const proxyHint = document.getElementById('proxy-hint');
    const proxyStatusEl = document.getElementById('proxy-status');
    const proxyAddr = document.getElementById('proxy-addr');
    const proxyConns = document.getElementById('proxy-conns');

    if (!connectBtn) {
        console.error('Connect button not found!');
        return;
    }
    console.log('DOM elements ready');

    // ============================================
    // Pelagus Wallet Integration
    // ============================================
    
    function detectPelagus() {
        return typeof window.pelagus !== 'undefined';
    }
    
    async function connectPelagusWallet() {
        if (!detectPelagus()) {
            alert('Pelagus Wallet not detected.\n\nPlease install the Pelagus browser extension from pelaguswallet.io');
            window.open('https://pelaguswallet.io/', '_blank');
            return null;
        }
        
        try {
            console.log('Requesting Pelagus accounts...');
            const accounts = await window.pelagus.request({ 
                method: 'quai_requestAccounts' 
            });
            
            if (accounts && accounts.length > 0) {
                const address = accounts[0];
                console.log('Connected to Pelagus:', address);
                return address;
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
        if (nodeToggle) nodeToggle.checked = running;
        if (nodeHint) nodeHint.textContent = running ? 'Connected to mesh' : 'Start to join network';
        
        if (proxyToggle) {
            proxyToggle.disabled = !running;
            if (!running && state.proxyRunning) {
                doStopProxy();
            }
        }
    }

    function updateProxyStatus(running, address, connections) {
        state.proxyRunning = running;
        if (proxyToggle) proxyToggle.checked = running;
        if (proxyHint) proxyHint.textContent = running ? (address || '127.0.0.1:1080') : 'Start node first';
        if (proxyStatusEl) proxyStatusEl.classList.toggle('active', running);
        if (proxyAddr) proxyAddr.textContent = running ? address : '';
        if (proxyConns) proxyConns.textContent = running ? (connections + ' active connections') : '';
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
        
        try {
            const address = await connectPelagusWallet();
            
            if (address) {
                state.walletConnected = true;
                state.walletAddress = address;
                state.walletBalance = await getPelagusBalance(address);
                state.escrowBalance = 0;
                
                setupPelagusListeners();
                updateWalletUI();
                updateWalletDisplay();
                updateBalances();
                
                doStartNode();
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
        } finally {
            connectBtn.textContent = 'Connect Pelagus';
            connectBtn.disabled = false;
        }
    }

    function doDisconnectWallet() {
        console.log('Disconnecting wallet...');
        if (state.proxyRunning) doStopProxy();
        if (state.nodeRunning) doStopNode();
        state.walletConnected = false;
        state.walletAddress = null;
        state.walletBalance = 0;
        state.escrowBalance = 0;
        updateWalletUI();
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
        try {
            if (window.__TAURI__ && window.__TAURI__.core) {
                const response = await window.__TAURI__.core.invoke('start_node');
                if (response.success) {
                    updateNodeStatus(true);
                    startPolling();
                } else {
                    console.error('Failed to start node:', response.error);
                    if (nodeToggle) nodeToggle.checked = false;
                }
            } else {
                updateNodeStatus(true);
                startPolling();
            }
        } catch (error) {
            console.error('Failed to start node:', error);
            if (nodeToggle) nodeToggle.checked = false;
        }
    }

    async function doStopNode() {
        try {
            if (state.proxyRunning) {
                await doStopProxy();
            }
            if (window.__TAURI__ && window.__TAURI__.core) {
                await window.__TAURI__.core.invoke('stop_node');
            }
            updateNodeStatus(false);
            stopPolling();
        } catch (error) {
            console.error('Failed to stop node:', error);
        }
    }

    async function doStartProxy() {
        if (!state.nodeRunning) {
            alert('Please start the node first');
            if (proxyToggle) proxyToggle.checked = false;
            return;
        }
        try {
            if (window.__TAURI__ && window.__TAURI__.core) {
                const response = await window.__TAURI__.core.invoke('start_proxy', { port: 1080 });
                if (response.success) {
                    updateProxyStatus(true, response.data, 0);
                    console.log('SOCKS5 proxy started on', response.data);
                } else {
                    console.error('Failed to start proxy:', response.error);
                    alert('Failed to start proxy: ' + response.error);
                    if (proxyToggle) proxyToggle.checked = false;
                }
            } else {
                updateProxyStatus(true, '127.0.0.1:1080', 0);
            }
        } catch (error) {
            console.error('Failed to start proxy:', error);
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

    if (nodeToggle) {
        nodeToggle.addEventListener('change', function(e) {
            if (e.target.checked) {
                doStartNode();
            } else {
                doStopNode();
            }
        });
    }

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
