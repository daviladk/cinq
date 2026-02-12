/**
 * cinQ UI Rendering Module
 */

import { formatQi } from './wallet';

// Format Quai balance (18 decimals)
function formatQuai(amount: bigint): string {
  if (amount === 0n) return '0.00 QUAI';
  const quai = Number(amount) / 1e18;
  return quai.toFixed(4) + ' QUAI';
}

// Chat types
interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  timestamp: number;
  is_outgoing: boolean;
  status: 'Pending' | 'Sent' | 'Delivered' | 'Read' | 'Failed';
}

interface Conversation {
  id: string;
  peer_id: string;
  display_name: string;
  last_message: string | null;
  last_message_at: number | null;
  unread_count: number;
}

interface AppState {
  nodeRunning: boolean;
  peerId: string | null;
  peers: string[];
  userId: string | null;         // Raw 10-digit user ID
  userIdDisplay: string | null;  // Formatted XXX-XXX-XXXX
  walletInitialized: boolean;
  paymentCode: string | null;
  quaiAddress: string | null;
  balance: bigint;
  quaiBalance: bigint;  // Quai balance for DeFi/dApps
  currentView: 'landing' | 'main' | 'wallet-setup';
  hasSavedWallet: boolean;  // Whether there's a wallet in localStorage
  network: 'orchard' | 'mainnet';  // Current network
  // Chat state
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  chatView: 'list' | 'conversation';
}

interface AppActions {
  startNode: () => Promise<void>;
  stopNode: () => Promise<void>;
  initializeNewWallet: () => Promise<{ mnemonic: string; paymentCode: string; quaiAddress: string }>;
  restoreWallet: (mnemonic: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  sendPayment: (recipient: string, amount: bigint) => Promise<any>;
  formatQi: (amount: bigint) => string;
  connectWithSavedWallet: () => Promise<void>;
  clearSavedWallet: () => void;
  switchNetwork: (network: 'orchard' | 'mainnet') => Promise<void>;
  // Chat actions
  getConversations: () => Promise<Conversation[]>;
  openConversation: (conversation: Conversation) => void;
  backToConversationList: () => void;
  sendMessage: (peerId: string, content: string) => Promise<ChatMessage | null>;
  startConversation: (peerId: string) => Promise<void>;
}

export function renderApp(state: AppState, actions: AppActions): void {
  const app = document.getElementById('app');
  if (!app) return;

  // If wallet is initialized and node is running, show main dashboard
  if (state.walletInitialized && state.nodeRunning) {
    app.innerHTML = renderMain(state, actions);
    attachMainHandlers(state, actions);
  } 
  // If wallet is initialized but node not running, connect automatically
  else if (state.walletInitialized && !state.nodeRunning) {
    app.innerHTML = renderLanding(state, actions);
    attachLandingHandlers(state, actions);
  }
  // No wallet - show setup options
  else {
    app.innerHTML = renderLanding(state, actions);
    attachLandingHandlers(state, actions);
  }
}

function renderLanding(state: AppState, actions: AppActions): string {
  // Check if there's a saved wallet
  const hasSavedWallet = state.hasSavedWallet;
  
  if (hasSavedWallet && state.walletInitialized) {
    // Returning user with loaded wallet - just connect
    return `
      <div class="landing">
        <div class="landing-content">
          <h1 class="logo">cinQ</h1>
          <p class="tagline">Welcome back!</p>
          
          <div class="wallet-preview">
            <div class="preview-label">Your Wallet</div>
            <code class="preview-address">${state.paymentCode?.slice(0, 20)}...</code>
          </div>
          
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
          
          <button id="use-different-wallet-btn" class="btn-link">
            Use a different wallet
          </button>
        </div>
      </div>
    `;
  } else if (hasSavedWallet && !state.walletInitialized) {
    // Has saved wallet but not loaded yet - loading state
    return `
      <div class="landing">
        <div class="landing-content">
          <h1 class="logo">cinQ</h1>
          <p class="tagline">Loading your wallet...</p>
        </div>
      </div>
    `;
  } else {
    // First-time user - show wallet creation options
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
          
          <div class="wallet-setup-landing">
            <h3>Get Started</h3>
            <p class="setup-description">Create a new Qi wallet or import an existing one to join the mesh.</p>
            
            <button id="create-wallet-landing-btn" class="btn-primary">
              Create New Wallet
            </button>
            
            <button id="import-wallet-landing-btn" class="btn-secondary">
              Import Existing Wallet
            </button>
          </div>
        </div>
      </div>
      
      <!-- Import modal -->
      <div id="import-modal" class="modal hidden">
        <div class="modal-content">
          <h3>Import Wallet</h3>
          <p>Enter your 12-word mnemonic phrase:</p>
          <textarea id="mnemonic-input" placeholder="word1 word2 word3 ..."></textarea>
          <div class="modal-buttons">
            <button id="cancel-import-btn" class="btn-secondary">Cancel</button>
            <button id="confirm-import-btn" class="btn-primary">Import</button>
          </div>
        </div>
      </div>
      
      <!-- Mnemonic display modal -->
      <div id="mnemonic-modal" class="modal hidden">
        <div class="modal-content">
          <h3>⚠️ Save Your Recovery Phrase!</h3>
          <p>Write down these 12 words in order. This is the ONLY way to recover your wallet.</p>
          <div class="mnemonic-words" id="mnemonic-words"></div>
          <div class="modal-buttons">
            <button id="confirm-saved-btn" class="btn-primary">I've Saved It Securely</button>
          </div>
        </div>
      </div>
    `;
  }
}

function renderMain(state: AppState, actions: AppActions): string {
  const shortPeerId = state.peerId ? `${state.peerId.slice(0, 8)}...` : 'Not connected';
  const shortPaymentCode = state.paymentCode ? `${state.paymentCode.slice(0, 12)}...` : 'N/A';
  const shortQuaiAddress = state.quaiAddress ? `${state.quaiAddress.slice(0, 10)}...${state.quaiAddress.slice(-6)}` : 'N/A';
  const isMainnet = state.network === 'mainnet';
  
  return `
    <div class="main-app">
      <header class="header">
        <div class="logo-small">cinQ</div>
        <div class="header-right">
          <div class="network-badge ${isMainnet ? 'mainnet' : 'testnet'}">
            ${isMainnet ? '🔴 MAINNET' : '🧪 TESTNET'}
          </div>
          <div class="status">
            <span class="status-dot ${state.nodeRunning ? 'online' : 'offline'}"></span>
            <span>${state.nodeRunning ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
      </header>
      
      <div class="dashboard">
        <div class="card wallet-card">
          <div class="wallet-header">
            <h3>💰 Wallet</h3>
            <div class="network-toggle">
              <button id="network-toggle-btn" class="btn-network ${isMainnet ? 'mainnet' : 'testnet'}">
                ${isMainnet ? '🔴 Mainnet' : '🧪 Orchard'}
                <span class="toggle-arrow">▼</span>
              </button>
              <div id="network-dropdown" class="network-dropdown hidden">
                <button class="network-option ${!isMainnet ? 'active' : ''}" data-network="orchard">
                  🧪 Orchard (Testnet)
                </button>
                <button class="network-option ${isMainnet ? 'active' : ''}" data-network="mainnet">
                  🔴 Mainnet
                </button>
              </div>
            </div>
          </div>
          <div class="balances">
            <div class="balance-item">
              <span class="balance-label">Qi (Payments)</span>
              <span class="balance-value qi">${formatQi(state.balance)}</span>
            </div>
            <div class="balance-item">
              <span class="balance-label">Quai (DeFi)</span>
              <span class="balance-value quai">${formatQuai(state.quaiBalance)}</span>
            </div>
          </div>
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
          <div class="wallet-actions">
            <button id="refresh-balance-btn" class="btn-secondary">Refresh Balance</button>
            <button id="view-seed-btn" class="btn-link">🔑 View Recovery Phrase</button>
          </div>
        </div>
        
        <!-- Recovery phrase modal -->
        <div id="view-seed-modal" class="modal hidden">
          <div class="modal-content">
            <h3>🔑 Recovery Phrase</h3>
            <p class="warning-text">⚠️ Never share these words with anyone!</p>
            <div class="mnemonic-words" id="view-mnemonic-words"></div>
            <div class="modal-buttons">
              <button id="close-seed-modal-btn" class="btn-primary">Close</button>
            </div>
          </div>
        </div>
        
        <div class="card node-card">
          <h3>🌐 Mesh Connection</h3>
          <p class="card-description">You're connected to the cinQ P2P network</p>
          <div class="node-info">
            <div class="info-row user-id-row">
              <span>Your Chat ID:</span>
              <code id="user-id-display" class="user-id" title="Share this ID with friends to chat">${state.userIdDisplay || 'Loading...'}</code>
              <button id="copy-user-id" class="btn-icon" title="Copy Chat ID">📋</button>
            </div>
            <div class="info-row">
              <span>Mesh ID:</span>
              <code class="peer-id-small" title="Technical peer ID">${shortPeerId}</code>
            </div>
            <div class="info-row status-row">
              <span class="status-indicator online">● Online</span>
            </div>
          </div>
          <button id="disconnect-btn" class="btn-danger">Disconnect from Mesh</button>
        </div>
        
        <div class="card stats-card">
          <h3>📊 Network Stats</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">${state.peers.length + 1}</span>
              <span class="stat-label">Nodes Online</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">0 KB</span>
              <span class="stat-label">Bandwidth Shared</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">0.00 Qi</span>
              <span class="stat-label">Earned This Session</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" id="uptime-display">0:00</span>
              <span class="stat-label">Uptime</span>
            </div>
          </div>
        </div>
        
        <!-- Chat Card -->
        <div class="card chat-card">
          <h3>💬 Messages</h3>
          ${renderChat(state)}
        </div>
      </div>
    </div>
  `;
}

// Render chat interface
function renderChat(state: AppState): string {
  if (state.chatView === 'conversation' && state.currentConversation) {
    return renderConversation(state);
  }
  return renderConversationList(state);
}

function renderConversationList(state: AppState): string {
  const conversations = state.conversations;
  const peers = state.peers;
  
  return `
    <div class="chat-container">
      <div class="chat-header">
        <span>Your Conversations</span>
        <button id="new-chat-btn" class="btn-icon" title="New Chat">➕</button>
      </div>
      
      ${conversations.length === 0 ? `
        <div class="chat-empty">
          <p>No conversations yet</p>
          <p class="chat-hint">Enter a Chat ID to start messaging</p>
        </div>
      ` : `
        <div class="conversation-list">
          ${conversations.map(conv => `
            <div class="conversation-item" data-conv-id="${conv.id}" data-peer-id="${conv.peer_id}">
              <div class="conv-avatar">👤</div>
              <div class="conv-info">
                <div class="conv-name">${escapeHtml(conv.display_name)}</div>
                <div class="conv-preview">${escapeHtml(conv.last_message || 'No messages yet')}</div>
              </div>
              ${conv.unread_count > 0 ? `<span class="unread-badge">${conv.unread_count}</span>` : ''}
            </div>
          `).join('')}
        </div>
      `}
      
      ${peers.length > 0 ? `
        <div class="online-peers">
          <div class="peers-header">Online Peers (${peers.length})</div>
          <div class="peer-list">
            ${peers.slice(0, 5).map(peerId => `
              <button class="peer-item" data-peer-id="${peerId}">
                <span class="peer-status">●</span>
                <span class="peer-id">${peerId.slice(0, 12)}...</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderConversation(state: AppState): string {
  const conv = state.currentConversation!;
  const messages = state.messages;
  
  return `
    <div class="chat-container conversation-view">
      <div class="chat-header">
        <button id="back-to-list-btn" class="btn-icon">←</button>
        <div class="conv-title">
          <span class="conv-name">${conv.display_name}</span>
          <span class="conv-status">● Online</span>
        </div>
      </div>
      
      <div class="messages-container" id="messages-container">
        ${messages.length === 0 ? `
          <div class="chat-empty">
            <p>No messages yet</p>
            <p class="chat-hint">Send the first message!</p>
          </div>
        ` : messages.map(msg => `
          <div class="message ${msg.is_outgoing ? 'outgoing' : 'incoming'}">
            <div class="message-content">${escapeHtml(msg.content)}</div>
            <div class="message-meta">
              <span class="message-time">${formatTime(msg.timestamp)}</span>
              ${msg.is_outgoing ? `<span class="message-status">${getStatusIcon(msg.status)}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="message-input-container">
        <input type="text" id="message-input" placeholder="Type a message..." autocomplete="off">
        <button id="send-msg-btn" class="btn-send">Send</button>
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'Pending': return '⏳';
    case 'Sent': return '✓';
    case 'Delivered': return '✓✓';
    case 'Read': return '✓✓';
    case 'Failed': return '✗';
    default: return '';
  }
}

function attachLandingHandlers(state: AppState, actions: AppActions): void {
  console.log('attachLandingHandlers called, hasSavedWallet:', state.hasSavedWallet, 'walletInitialized:', state.walletInitialized);
  
  // Connect to mesh (for returning users with wallet loaded)
  const connectBtn = document.getElementById('connect-btn');
  console.log('connect-btn element:', connectBtn ? 'FOUND' : 'NOT FOUND');
  
  connectBtn?.addEventListener('click', async () => {
    const btn = document.getElementById('connect-btn') as HTMLButtonElement;
    if (!btn) {
      console.error('Connect button not found');
      return;
    }
    
    console.log('Connect button clicked, walletInitialized:', state.walletInitialized);
    btn.disabled = true;
    btn.textContent = 'Connecting...';
    
    try {
      console.log('Calling startNode...');
      await actions.startNode();
      console.log('startNode completed successfully');
    } catch (error) {
      console.error('Failed to connect:', error);
      btn.disabled = false;
      btn.textContent = 'Connect to Mesh';
      alert('Failed to connect: ' + (error instanceof Error ? error.message : String(error)));
    }
  });
  
  // Use different wallet (for returning users who want to switch)
  document.getElementById('use-different-wallet-btn')?.addEventListener('click', () => {
    actions.clearSavedWallet();
  });
  
  // Create new wallet (for first-time users)
  document.getElementById('create-wallet-landing-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('create-wallet-landing-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Creating...';
    
    try {
      console.log('Creating new wallet...');
      const { mnemonic } = await actions.initializeNewWallet();
      console.log('Wallet created, mnemonic received:', mnemonic ? 'yes' : 'no');
      
      // Show mnemonic modal
      const modal = document.getElementById('mnemonic-modal');
      const words = document.getElementById('mnemonic-words');
      console.log('Modal element:', modal ? 'found' : 'NOT FOUND');
      console.log('Words element:', words ? 'found' : 'NOT FOUND');
      
      if (modal && words) {
        words.innerHTML = mnemonic.split(' ').map((word, i) => 
          `<span class="word"><span class="num">${i + 1}.</span> ${word}</span>`
        ).join('');
        modal.classList.remove('hidden');
        console.log('Modal should now be visible');
      } else {
        // Modal elements not found - show alert as fallback
        alert('⚠️ SAVE THESE WORDS:\n\n' + mnemonic.split(' ').map((w, i) => `${i+1}. ${w}`).join('\n') + '\n\nClick OK after saving.');
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
      btn.disabled = false;
      btn.textContent = 'Create New Wallet';
      alert('Failed to create wallet: ' + (error instanceof Error ? error.message : String(error)));
    }
  });
  
  // Import wallet button (shows modal)
  document.getElementById('import-wallet-landing-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('import-modal');
    modal?.classList.remove('hidden');
  });
  
  // Cancel import
  document.getElementById('cancel-import-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('import-modal');
    modal?.classList.add('hidden');
  });
  
  // Confirm import
  document.getElementById('confirm-import-btn')?.addEventListener('click', async () => {
    const input = document.getElementById('mnemonic-input') as HTMLTextAreaElement;
    const mnemonic = input.value.trim().toLowerCase();
    
    if (!mnemonic || mnemonic.split(/\s+/).length !== 12) {
      alert('Please enter a valid 12-word mnemonic.');
      return;
    }
    
    const btn = document.getElementById('confirm-import-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Importing...';
    
    try {
      await actions.restoreWallet(mnemonic);
      // Modal will close when UI re-renders
    } catch (error) {
      console.error('Failed to import wallet:', error);
      btn.disabled = false;
      btn.textContent = 'Import';
      alert('Failed to import wallet. Check your mnemonic.');
    }
  });
  
  // Confirm saved mnemonic - connect to mesh
  document.getElementById('confirm-saved-btn')?.addEventListener('click', async () => {
    const modal = document.getElementById('mnemonic-modal');
    modal?.classList.add('hidden');
    
    // Now connect to mesh
    try {
      await actions.startNode();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  });
}

function attachMainHandlers(state: AppState, actions: AppActions): void {
  // Network toggle dropdown
  const networkToggleBtn = document.getElementById('network-toggle-btn');
  const networkDropdown = document.getElementById('network-dropdown');
  
  networkToggleBtn?.addEventListener('click', () => {
    networkDropdown?.classList.toggle('hidden');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!networkToggleBtn?.contains(e.target as Node) && !networkDropdown?.contains(e.target as Node)) {
      networkDropdown?.classList.add('hidden');
    }
  }, { once: true });
  
  // Network option selection
  document.querySelectorAll('.network-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      const network = (btn as HTMLElement).dataset.network as 'orchard' | 'mainnet';
      if (network === state.network) {
        networkDropdown?.classList.add('hidden');
        return;
      }
      
      // Confirm mainnet switch
      if (network === 'mainnet') {
        const confirmed = confirm('⚠️ Switching to MAINNET will use REAL FUNDS.\n\nAre you sure?');
        if (!confirmed) {
          networkDropdown?.classList.add('hidden');
          return;
        }
      }
      
      networkDropdown?.classList.add('hidden');
      showToast(`Switching to ${network === 'mainnet' ? 'Mainnet' : 'Orchard Testnet'}...`);
      
      try {
        await actions.switchNetwork(network);
        showToast(`Connected to ${network === 'mainnet' ? 'Mainnet' : 'Orchard Testnet'}`);
      } catch (error) {
        console.error('Failed to switch network:', error);
        showToast('Failed to switch network');
      }
    });
  });
  
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
  
  // Copy User ID (Chat ID)
  document.getElementById('copy-user-id')?.addEventListener('click', () => {
    if (state.userId) {
      navigator.clipboard.writeText(state.userId);
      showToast('Chat ID copied! Share it with friends.');
    }
  });
  
  // View recovery phrase
  document.getElementById('view-seed-btn')?.addEventListener('click', () => {
    const mnemonic = localStorage.getItem('cinq_mnemonic');
    if (mnemonic) {
      const modal = document.getElementById('view-seed-modal');
      const words = document.getElementById('view-mnemonic-words');
      if (modal && words) {
        words.innerHTML = mnemonic.split(' ').map((word, i) => 
          `<span class="word"><span class="num">${i + 1}.</span> ${word}</span>`
        ).join('');
        modal.classList.remove('hidden');
      }
    } else {
      showToast('No recovery phrase found');
    }
  });
  
  // Close seed modal
  document.getElementById('close-seed-modal-btn')?.addEventListener('click', () => {
    document.getElementById('view-seed-modal')?.classList.add('hidden');
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
  
  // ============================================================================
  // Chat Handlers
  // ============================================================================
  
  // Load conversations on init
  actions.getConversations();
  
  // Click on conversation to open it
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.addEventListener('click', () => {
      const convId = (item as HTMLElement).dataset.convId;
      const peerId = (item as HTMLElement).dataset.peerId;
      const conv = state.conversations.find(c => c.id === convId);
      if (conv) {
        actions.openConversation(conv);
      }
    });
  });
  
  // Click on peer to start conversation
  document.querySelectorAll('.peer-item').forEach(item => {
    item.addEventListener('click', () => {
      const peerId = (item as HTMLElement).dataset.peerId;
      if (peerId) {
        actions.startConversation(peerId);
      }
    });
  });
  
  // Back to conversation list
  document.getElementById('back-to-list-btn')?.addEventListener('click', () => {
    actions.backToConversationList();
  });
  
  // Send message
  const sendMsgHandler = async () => {
    const input = document.getElementById('message-input') as HTMLInputElement;
    const content = input.value.trim();
    
    if (!content || !state.currentConversation) return;
    
    const peerId = state.currentConversation.peer_id;
    input.value = '';
    input.focus();
    
    await actions.sendMessage(peerId, content);
    
    // Scroll to bottom
    const container = document.getElementById('messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };
  
  document.getElementById('send-msg-btn')?.addEventListener('click', sendMsgHandler);
  
  document.getElementById('message-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMsgHandler();
    }
  });
  
  // New chat button - shows prompt for Chat ID
  document.getElementById('new-chat-btn')?.addEventListener('click', () => {
    const userIdInput = prompt('Enter Chat ID (e.g., 555-123-4567):');
    if (userIdInput && userIdInput.trim()) {
      actions.startConversation(userIdInput.trim());
    }
  });
  
  // Scroll messages to bottom on load
  const messagesContainer = document.getElementById('messages-container');
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
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
