/**
 * cinQ UI Rendering Module
 */

import { formatQi } from './wallet';

interface AppState {
  nodeRunning: boolean;
  peerId: string | null;
  peers: string[];
  walletInitialized: boolean;
  paymentCode: string | null;
  quaiAddress: string | null;
  balance: bigint;
  currentView: 'landing' | 'main' | 'wallet-setup';
}

interface AppActions {
  startNode: () => Promise<void>;
  stopNode: () => Promise<void>;
  initializeNewWallet: () => Promise<{ mnemonic: string; paymentCode: string; quaiAddress: string }>;
  restoreWallet: (mnemonic: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  sendPayment: (recipient: string, amount: bigint) => Promise<any>;
  formatQi: (amount: bigint) => string;
}

export function renderApp(state: AppState, actions: AppActions): void {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.nodeRunning && !state.walletInitialized) {
    app.innerHTML = renderLanding(actions);
    attachLandingHandlers(actions);
  } else if (!state.walletInitialized) {
    app.innerHTML = renderWalletSetup(actions);
    attachWalletSetupHandlers(actions);
  } else {
    app.innerHTML = renderMain(state, actions);
    attachMainHandlers(state, actions);
  }
}

function renderLanding(actions: AppActions): string {
  return `
    <div class="landing">
      <div class="landing-content">
        <h1 class="logo">cinQ</h1>
        <p class="tagline">Decentralized Infrastructure for Quai Network</p>
        
        <div class="features">
          <div class="feature">
            <span class="icon">🌐</span>
            <span>P2P Mesh Network</span>
          </div>
          <div class="feature">
            <span class="icon">⚡</span>
            <span>Qi Micropayments</span>
          </div>
          <div class="feature">
            <span class="icon">🔒</span>
            <span>E2E Encrypted</span>
          </div>
        </div>
        
        <button id="connect-btn" class="btn-primary">
          Connect to Mesh
        </button>
      </div>
    </div>
  `;
}

function renderWalletSetup(actions: AppActions): string {
  return `
    <div class="wallet-setup">
      <h2>Set Up Your Wallet</h2>
      <p>You need a Qi wallet to use the cinQ mesh.</p>
      
      <div class="wallet-options">
        <div class="wallet-option">
          <h3>Create New Wallet</h3>
          <p>Generate a new wallet with a fresh mnemonic phrase.</p>
          <button id="create-wallet-btn" class="btn-primary">Create Wallet</button>
        </div>
        
        <div class="divider">or</div>
        
        <div class="wallet-option">
          <h3>Import Existing Wallet</h3>
          <p>Restore from your 12-word mnemonic phrase.</p>
          <textarea id="mnemonic-input" placeholder="Enter your 12-word mnemonic..."></textarea>
          <button id="import-wallet-btn" class="btn-secondary">Import Wallet</button>
        </div>
      </div>
      
      <div id="mnemonic-display" class="mnemonic-display hidden">
        <h3>⚠️ Save Your Mnemonic!</h3>
        <p>This is the ONLY way to recover your wallet. Write it down and store it safely.</p>
        <div class="mnemonic-words" id="mnemonic-words"></div>
        <button id="confirm-saved-btn" class="btn-primary">I've Saved It</button>
      </div>
    </div>
  `;
}

function renderMain(state: AppState, actions: AppActions): string {
  const shortPeerId = state.peerId ? `${state.peerId.slice(0, 8)}...` : 'Not connected';
  const shortPaymentCode = state.paymentCode ? `${state.paymentCode.slice(0, 12)}...` : 'N/A';
  const shortQuaiAddress = state.quaiAddress ? `${state.quaiAddress.slice(0, 10)}...${state.quaiAddress.slice(-6)}` : 'N/A';
  
  return `
    <div class="main-app">
      <header class="header">
        <div class="logo-small">cinQ</div>
        <div class="status">
          <span class="status-dot ${state.nodeRunning ? 'online' : 'offline'}"></span>
          <span>${state.peers.length} peers</span>
        </div>
      </header>
      
      <div class="dashboard">
        <div class="card wallet-card">
          <h3>💰 Wallet</h3>
          <div class="balance">${formatQi(state.balance)}</div>
          <div class="wallet-addresses">
            <div class="address-row">
              <label>Qi Payment Code:</label>
              <code id="payment-code" title="${state.paymentCode || ''}">${shortPaymentCode}</code>
              <button id="copy-payment-code" class="btn-icon" title="Copy Payment Code">📋</button>
            </div>
            <div class="address-row">
              <label>Quai Address (DeFi):</label>
              <code id="quai-address" title="${state.quaiAddress || ''}">${shortQuaiAddress}</code>
              <button id="copy-quai-address" class="btn-icon" title="Copy Quai Address">📋</button>
            </div>
          </div>
          <button id="refresh-balance-btn" class="btn-secondary">Refresh Balance</button>
        </div>
        
        <div class="card node-card">
          <h3>🌐 Node Status</h3>
          <div class="node-info">
            <div class="info-row">
              <span>Peer ID:</span>
              <code>${shortPeerId}</code>
            </div>
            <div class="info-row">
              <span>Connected Peers:</span>
              <span class="peer-count">${state.peers.length}</span>
            </div>
          </div>
          <button id="disconnect-btn" class="btn-danger">Disconnect</button>
        </div>
        
        <div class="card peers-card">
          <h3>👥 Connected Peers</h3>
          <div class="peer-list">
            ${state.peers.length > 0 
              ? state.peers.map(peer => `
                <div class="peer-item">
                  <span class="peer-id">${peer.slice(0, 16)}...</span>
                  <button class="btn-small btn-send" data-peer="${peer}">Send Qi</button>
                </div>
              `).join('')
              : '<p class="no-peers">No peers connected yet.</p>'
            }
          </div>
        </div>
        
        <div class="card send-card">
          <h3>📤 Send Payment</h3>
          <div class="send-form">
            <input type="text" id="recipient-input" placeholder="Recipient Payment Code (PM8T...)" />
            <input type="number" id="amount-input" placeholder="Amount in Qi" />
            <button id="send-payment-btn" class="btn-primary">Send</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function attachLandingHandlers(actions: AppActions): void {
  document.getElementById('connect-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('connect-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Connecting...';
    
    try {
      await actions.startNode();
    } catch (error) {
      console.error('Failed to connect:', error);
      btn.disabled = false;
      btn.textContent = 'Connect to Mesh';
    }
  });
}

function attachWalletSetupHandlers(actions: AppActions): void {
  // Create new wallet
  document.getElementById('create-wallet-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('create-wallet-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Creating...';
    
    try {
      const { mnemonic, paymentCode } = await actions.initializeNewWallet();
      
      // Show mnemonic
      const display = document.getElementById('mnemonic-display');
      const words = document.getElementById('mnemonic-words');
      if (display && words) {
        words.innerHTML = mnemonic.split(' ').map((word, i) => 
          `<span class="word"><span class="num">${i + 1}.</span> ${word}</span>`
        ).join('');
        display.classList.remove('hidden');
        
        // Store for persistence (in production, use secure storage!)
        localStorage.setItem('cinq_mnemonic', mnemonic);
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
      btn.disabled = false;
      btn.textContent = 'Create Wallet';
    }
  });
  
  // Import existing wallet
  document.getElementById('import-wallet-btn')?.addEventListener('click', async () => {
    const input = document.getElementById('mnemonic-input') as HTMLTextAreaElement;
    const mnemonic = input.value.trim();
    
    if (!mnemonic || mnemonic.split(/\s+/).length !== 12) {
      alert('Please enter a valid 12-word mnemonic.');
      return;
    }
    
    const btn = document.getElementById('import-wallet-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Importing...';
    
    try {
      await actions.restoreWallet(mnemonic);
      localStorage.setItem('cinq_mnemonic', mnemonic);
    } catch (error) {
      console.error('Failed to import wallet:', error);
      btn.disabled = false;
      btn.textContent = 'Import Wallet';
      alert('Failed to import wallet. Check your mnemonic.');
    }
  });
  
  // Confirm saved mnemonic
  document.getElementById('confirm-saved-btn')?.addEventListener('click', () => {
    // Wallet is already initialized, just trigger re-render
    window.location.reload();
  });
}

function attachMainHandlers(state: AppState, actions: AppActions): void {
  // Copy payment code
  document.getElementById('copy-payment-code')?.addEventListener('click', () => {
    if (state.paymentCode) {
      navigator.clipboard.writeText(state.paymentCode);
      showToast('Payment code copied!');
    }
  });
  
  // Copy Quai address
  document.getElementById('copy-quai-address')?.addEventListener('click', () => {
    if (state.quaiAddress) {
      navigator.clipboard.writeText(state.quaiAddress);
      showToast('Quai address copied!');
    }
  });
  
  // Refresh balance
  document.getElementById('refresh-balance-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('refresh-balance-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Refreshing...';
    
    try {
      await actions.refreshBalance();
    } finally {
      btn.disabled = false;
      btn.textContent = 'Refresh Balance';
    }
  });
  
  // Disconnect
  document.getElementById('disconnect-btn')?.addEventListener('click', async () => {
    await actions.stopNode();
  });
  
  // Send payment
  document.getElementById('send-payment-btn')?.addEventListener('click', async () => {
    const recipientInput = document.getElementById('recipient-input') as HTMLInputElement;
    const amountInput = document.getElementById('amount-input') as HTMLInputElement;
    
    const recipient = recipientInput.value.trim();
    const amount = BigInt(Math.floor(parseFloat(amountInput.value) * 1e18)); // Convert to wei-like
    
    if (!recipient.startsWith('PM8T')) {
      alert('Invalid payment code. Must start with PM8T...');
      return;
    }
    
    if (amount <= 0n) {
      alert('Please enter a valid amount.');
      return;
    }
    
    const btn = document.getElementById('send-payment-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Sending...';
    
    try {
      await actions.sendPayment(recipient, amount);
      showToast(`Sent ${actions.formatQi(amount)} successfully!`);
      recipientInput.value = '';
      amountInput.value = '';
      await actions.refreshBalance();
    } catch (error) {
      console.error('Payment failed:', error);
      alert(`Payment failed: ${error}`);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send';
    }
  });
}

function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
