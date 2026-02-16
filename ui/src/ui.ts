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

interface GridPeer {
  peer_id: string;
  addresses: string[];
  connected: boolean;
  last_seen: number;
  chat_id: string | null;
}

// Qora types
interface QoraTask {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Failed' | 'Blocked';
  result: string | null;
  created_at: number;
  completed_at: number | null;
}

interface QoraMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface QoraState {
  initialized: boolean;
  available: boolean;
  model: string;
  tasks: QoraTask[];
  questions: string[];
  history: QoraMessage[];
  chatInput: string;
  isWorking: boolean;
}

interface AppState {
  nodeRunning: boolean;
  peerId: string | null;
  peers: GridPeer[];
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
  // Qora state
  qora: QoraState;
  // UI state
  activeTab: 'messages' | 'qora';
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
  clearSavedWallet: () => Promise<void>;
  switchNetwork: (network: 'orchard' | 'mainnet') => Promise<void>;
  // Chat actions
  getConversations: () => Promise<Conversation[]>;
  openConversation: (conversation: Conversation) => void;
  backToConversationList: () => void;
  sendMessage: (peerId: string, content: string) => Promise<ChatMessage | null>;
  startConversation: (peerId: string) => Promise<void>;
  // Qora actions
  qoraInit: (ollamaUrl?: string, model?: string) => Promise<any>;
  qoraStatus: () => Promise<any>;
  qoraChat: (message: string) => Promise<string | null>;
  qoraAddTask: (title: string, description: string) => Promise<any>;
  qoraGetTasks: () => Promise<QoraTask[]>;
  qoraWork: () => Promise<string | null>;
  qoraWorkAll: () => Promise<string | null>;
  qoraGetQuestions: () => Promise<string[]>;
  qoraAnswerQuestion: (questionIndex: number, answer: string) => Promise<string | null>;
  qoraGetHistory: () => Promise<QoraMessage[]>;
  setActiveTab: (tab: 'messages' | 'qora') => void;
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
          <h1 class="logo">CIN<span>Q</span></h1>
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
          <h1 class="logo">CIN<span>Q</span></h1>
          <p class="tagline">Loading your wallet...</p>
        </div>
      </div>
    `;
  } else {
    // First-time user - show wallet creation options
    return `
      <div class="landing">
        <div class="landing-content">
          <h1 class="logo">CIN<span>Q</span></h1>
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
  const isMainnet = state.network === 'mainnet';
  
  return `
    <div class="main-app">
      <header class="header">
        <div class="logo-small">CIN<span>Q</span></div>
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
      
      <div class="dashboard-layout">
        <!-- Left Gauge Panel -->
        <div class="gauge-panel">
          ${renderWalletMini(state, isMainnet)}
          ${renderQoraStatus(state)}
          ${renderSystemMonitor()}
          ${renderBandwidthStats()}
          ${renderDePINStats(state)}
          ${renderNetworkInfo(state, shortPeerId)}
        </div>
        
        <!-- Main Content - Tabbed: Messages / Qora -->
        <div class="main-content">
          <div class="content-tabs">
            <button class="tab-btn ${state.activeTab === 'messages' ? 'active' : ''}" data-tab="messages">💬 Messages</button>
            <button class="tab-btn ${state.activeTab === 'qora' ? 'active' : ''}" data-tab="qora">🤖 Qora</button>
          </div>
          
          <!-- Messages Tab -->
          <div class="tab-content ${state.activeTab === 'messages' ? 'active' : ''}" id="tab-messages">
            <div class="card chat-card">
              <div class="chat-card-header">
                <h3>💬 Messages</h3>
                <div class="chat-id-badge">
                  <span>Your ID: </span>
                  <code id="user-id-display">${state.userIdDisplay || 'Loading...'}</code>
                  <button id="copy-user-id" class="btn-icon" title="Copy Chat ID">📋</button>
                </div>
              </div>
              ${renderChat(state)}
            </div>
          </div>
          
          <!-- Qora Tab -->
          <div class="tab-content ${state.activeTab === 'qora' ? 'active' : ''}" id="tab-qora">
            ${renderQoraPanel(state)}
          </div>
        </div>
      </div>
      
      ${renderModals(state, isMainnet)}
    </div>
  `;
}

// Render Qora status card for sidebar
function renderQoraStatus(state: AppState): string {
  const qora = state.qora;
  const statusClass = qora.initialized ? (qora.available ? 'online' : 'warning') : 'offline';
  const statusText = qora.initialized ? (qora.available ? 'Ready' : 'No Ollama') : 'Not Init';
  const pendingCount = qora.tasks.filter(t => t.status === 'Pending').length;
  const questionCount = qora.questions.length;
  
  return `
    <div class="gauge-card qora-status-card">
      <h4>🤖 Qora Agent</h4>
      <div class="qora-status-row">
        <span class="qora-label">Status</span>
        <span class="qora-value ${statusClass}">${statusText}</span>
      </div>
      ${qora.initialized ? `
        <div class="qora-status-row">
          <span class="qora-label">Model</span>
          <span class="qora-value model">${qora.model.split(':')[0] || 'N/A'}</span>
        </div>
        <div class="qora-status-row">
          <span class="qora-label">Pending</span>
          <span class="qora-value ${pendingCount > 0 ? 'highlight' : ''}">${pendingCount} tasks</span>
        </div>
        ${questionCount > 0 ? `
          <div class="qora-status-row">
            <span class="qora-label">Questions</span>
            <span class="qora-value urgent">${questionCount} waiting</span>
          </div>
        ` : ''}
        ${qora.isWorking ? `
          <div class="qora-working">
            <span class="spinner">⏳</span> Working...
          </div>
        ` : ''}
      ` : `
        <button id="init-qora-btn" class="btn-mini qora-init">Initialize</button>
      `}
    </div>
  `;
}

// Render the full Qora panel
function renderQoraPanel(state: AppState): string {
  const qora = state.qora;
  
  if (!qora.initialized) {
    return `
      <div class="card qora-card">
        <div class="qora-init-panel">
          <h3>🤖 Initialize Qora</h3>
          <p>Connect Qora to your local Ollama instance to enable AI-powered development assistance.</p>
          <div class="qora-init-form">
            <div class="form-group">
              <label>Ollama URL</label>
              <input type="text" id="qora-ollama-url" placeholder="http://192.168.4.255:11434" value="http://192.168.4.255:11434">
            </div>
            <div class="form-group">
              <label>Model</label>
              <input type="text" id="qora-model" placeholder="deepseek-coder-v2:16b" value="deepseek-coder-v2:16b">
            </div>
            <button id="qora-init-btn" class="btn-primary">Connect to Ollama</button>
          </div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="card qora-card">
      <div class="qora-header">
        <h3>🤖 Qora</h3>
        <div class="qora-controls">
          ${qora.isWorking ? `
            <span class="qora-working-badge">⏳ Working...</span>
          ` : `
            <button id="qora-work-btn" class="btn-mini" title="Work on next task">▶️ Work</button>
            <button id="qora-work-all-btn" class="btn-mini" title="Grind through all tasks">⚡ Grind</button>
          `}
        </div>
      </div>
      
      <div class="qora-layout">
        <!-- Left: Chat -->
        <div class="qora-chat-section">
          <div class="qora-chat-messages" id="qora-chat-messages">
            ${qora.history.length === 0 ? `
              <div class="qora-empty">
                <p>👋 Hey! I'm Qora, your AI dev assistant.</p>
                <p>Ask me anything or add tasks for me to work on!</p>
              </div>
            ` : qora.history.map(msg => `
              <div class="qora-message ${msg.role}">
                <div class="qora-message-content">${escapeHtml(msg.content)}</div>
              </div>
            `).join('')}
          </div>
          <div class="qora-chat-input">
            <input type="text" id="qora-input" placeholder="Ask Qora anything..." autocomplete="off">
            <button id="qora-send-btn" class="btn-send">Send</button>
          </div>
        </div>
        
        <!-- Right: Tasks & Questions -->
        <div class="qora-sidebar">
          <!-- Questions (urgent!) -->
          ${qora.questions.length > 0 ? `
            <div class="qora-questions">
              <h4>❓ Qora Needs Your Input</h4>
              ${qora.questions.map((q, i) => `
                <div class="qora-question" data-index="${i}">
                  <div class="question-text">${escapeHtml(q)}</div>
                  <div class="question-answer">
                    <input type="text" class="question-input" placeholder="Your answer..." data-index="${i}">
                    <button class="btn-answer" data-index="${i}">→</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <!-- Tasks -->
          <div class="qora-tasks">
            <div class="qora-tasks-header">
              <h4>📋 Task Queue</h4>
              <button id="add-task-btn" class="btn-icon" title="Add task">➕</button>
            </div>
            ${qora.tasks.length === 0 ? `
              <div class="qora-empty-tasks">No tasks yet. Add one!</div>
            ` : `
              <div class="task-list">
                ${qora.tasks.map(task => `
                  <div class="task-item ${task.status.toLowerCase()}">
                    <div class="task-status">${getTaskStatusIcon(task.status)}</div>
                    <div class="task-info">
                      <div class="task-title">${escapeHtml(task.title)}</div>
                      <div class="task-desc">${escapeHtml(task.description.slice(0, 50))}${task.description.length > 50 ? '...' : ''}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add Task Modal -->
    <div id="add-task-modal" class="modal hidden">
      <div class="modal-content">
        <h3>➕ Add Task for Qora</h3>
        <div class="form-group">
          <label>Task Title</label>
          <input type="text" id="task-title" placeholder="e.g., Add dark mode toggle">
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="task-description" placeholder="Describe what you want Qora to do..."></textarea>
        </div>
        <div class="modal-buttons">
          <button id="cancel-task-btn" class="btn-secondary">Cancel</button>
          <button id="confirm-task-btn" class="btn-primary">Add Task</button>
        </div>
      </div>
    </div>
  `;
}

function getTaskStatusIcon(status: string): string {
  switch (status) {
    case 'Pending': return '⏳';
    case 'InProgress': return '🔄';
    case 'Completed': return '✅';
    case 'Failed': return '❌';
    case 'Blocked': return '🚫';
    default: return '•';
  }
}

// Render status bar
function renderStatusBar(percent: number, label: string): string {
  const colorClass = percent > 80 ? 'red' : percent > 50 ? 'yellow' : 'green';
  
  return `
    <div class="status-bar-row">
      <div class="status-bar-label">
        <span class="label-text">${label}</span>
        <span class="label-value">${percent}%</span>
      </div>
      <div class="status-bar">
        <div class="status-bar-fill ${colorClass}" style="width: ${percent}%"></div>
      </div>
    </div>
  `;
}

function renderSystemMonitor(): string {
  // TODO: Get actual system metrics from Tauri backend
  const cpuUsage = 12;
  const ramUsage = 38;
  const gpuUsage = 5;
  
  return `
    <div class="gauge-card">
      <h4>🖥️ System Monitor</h4>
      ${renderStatusBar(cpuUsage, 'CPU')}
      ${renderStatusBar(ramUsage, 'RAM')}
      ${renderStatusBar(gpuUsage, 'GPU')}
    </div>
  `;
}

function renderBandwidthStats(): string {
  // TODO: Get actual bandwidth from backend
  return `
    <div class="gauge-card">
      <h4>📡 Bandwidth</h4>
      <div class="bandwidth-item">
        <span class="direction"><span class="arrow up">↑</span> Upload</span>
        <span class="speed">0.0 MB/s</span>
      </div>
      <div class="bandwidth-item">
        <span class="direction"><span class="arrow down">↓</span> Download</span>
        <span class="speed">0.0 MB/s</span>
      </div>
    </div>
  `;
}

function renderDePINStats(state: AppState): string {
  const peerCount = state.peers.length;
  return `
    <div class="gauge-card">
      <h4>🌐 DePIN Network</h4>
      <div class="depin-stat">
        <span class="stat-name">Peers</span>
        <span class="stat-value ${peerCount > 0 ? 'online' : 'offline'}">${peerCount}</span>
      </div>
      <div class="depin-stat">
        <span class="stat-name">Security</span>
        <span class="stat-value secure">● High</span>
      </div>
      <div class="depin-stat">
        <span class="stat-name">Status</span>
        <span class="stat-value online">Online</span>
      </div>
    </div>
  `;
}

function renderEarnings(): string {
  // TODO: Get actual earnings from backend
  return `
    <div class="gauge-card">
      <h4>💰 Today's Earnings</h4>
      <div class="earnings-display">
        <div class="earnings-amount">0.0000 Qi</div>
        <div class="earnings-usd">≈ $0.00 USD</div>
      </div>
    </div>
  `;
}

function renderWalletMini(state: AppState, isMainnet: boolean): string {
  return `
    <div class="gauge-card wallet-card">
      <div class="wallet-header-row">
        <h4>💳 Wallet</h4>
        <div class="network-toggle-wrapper">
          <button id="network-toggle-btn" class="btn-network-toggle ${isMainnet ? 'mainnet' : 'testnet'}">
            ${isMainnet ? '🔴 Mainnet' : '🧪 Testnet'}
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
      <div class="wallet-balances">
        <div class="balance-row">
          <span class="balance-icon">⚡</span>
          <span class="balance-label">Qi</span>
          <span class="balance-amount qi">${formatQi(state.balance)}</span>
        </div>
        <div class="balance-row">
          <span class="balance-icon">💎</span>
          <span class="balance-label">Quai</span>
          <span class="balance-amount quai">${formatQuai(state.quaiBalance)}</span>
        </div>
      </div>
      <div class="wallet-actions">
        <button id="refresh-balance-btn" class="btn-mini" title="Refresh">↻</button>
        <button id="view-seed-btn" class="btn-mini" title="Recovery Phrase">🔑</button>
      </div>
    </div>
  `;
}

function renderNetworkInfo(state: AppState, shortPeerId: string): string {
  return `
    <div class="gauge-card">
      <h4>⛓️ Quai Network</h4>
      <div class="network-info-item">
        <span class="info-label">Chain</span>
        <span class="info-value">${state.network === 'mainnet' ? 'Colosseum' : 'Orchard'}</span>
      </div>
      <div class="network-info-item">
        <span class="info-label">Mesh ID</span>
        <span class="info-value">${shortPeerId}</span>
      </div>
      <div class="network-info-item">
        <span class="info-label">Uptime</span>
        <span class="info-value" id="uptime-display">0:00</span>
      </div>
    </div>
  `;
}

function renderModals(state: AppState, isMainnet: boolean): string {
  const shortPaymentCode = state.paymentCode ? `${state.paymentCode.slice(0, 12)}...` : 'N/A';
  const shortQuaiAddress = state.quaiAddress ? `${state.quaiAddress.slice(0, 10)}...${state.quaiAddress.slice(-6)}` : 'N/A';
  
  return `
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
    
    <!-- Wallet Details Modal -->
    <div id="wallet-details-modal" class="modal hidden">
      <div class="modal-content">
        <h3>💳 Wallet Details</h3>
        <div class="wallet-addresses">
          <div class="address-row">
            <label>Qi Payment Code:</label>
            <code id="payment-code" title="${state.paymentCode || ''}">${shortPaymentCode}</code>
            <button id="copy-payment-code" class="btn-icon" title="Copy Payment Code">📋</button>
          </div>
          <div class="address-row">
            <label>Quai Address:</label>
            <code id="quai-address" title="${state.quaiAddress || ''}">${shortQuaiAddress}</code>
            <button id="copy-quai-address" class="btn-icon" title="Copy Quai Address">📋</button>
          </div>
        </div>
        <div class="modal-buttons">
          <button id="close-wallet-modal-btn" class="btn-primary">Close</button>
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
            ${peers.slice(0, 5).map(peer => {
              // Display Chat ID if available, otherwise show "Unknown"
              const displayId = peer.chat_id 
                ? formatChatId(peer.chat_id)
                : 'Unknown';
              return `
              <button class="peer-item" data-peer-id="${peer.peer_id}">
                <span class="peer-status">●</span>
                <span class="peer-id">${displayId}</span>
              </button>
            `;}).join('')}
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

// Format a 10-digit chat ID as XXX-XXX-XXXX
function formatChatId(chatId: string): string {
  if (chatId.length !== 10) return chatId;
  return `${chatId.slice(0, 3)}-${chatId.slice(3, 6)}-${chatId.slice(6)}`;
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
  document.getElementById('use-different-wallet-btn')?.addEventListener('click', async () => {
    await actions.clearSavedWallet();
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

// Flag to track if global handlers are attached
let globalHandlersAttached = false;

function attachMainHandlers(state: AppState, actions: AppActions): void {
  // Update body data attribute with current network
  document.body.dataset.network = state.network;
  
  // Direct handler for network toggle button - add each time since DOM is re-rendered
  const networkToggleBtn = document.getElementById('network-toggle-btn');
  const networkDropdown = document.getElementById('network-dropdown');
  
  if (networkToggleBtn) {
    networkToggleBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Network toggle clicked!');
      networkDropdown?.classList.toggle('hidden');
    };
  }
  
  // Network option buttons
  document.querySelectorAll('.network-option').forEach(btn => {
    (btn as HTMLElement).onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const network = (btn as HTMLElement).dataset.network as 'orchard' | 'mainnet';
      console.log('Network option clicked:', network);
      
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
    };
  });
  
  // Attach global click-outside handler only once
  if (!globalHandlersAttached) {
    globalHandlersAttached = true;
    
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const dropdown = document.getElementById('network-dropdown');
      const toggleBtn = document.getElementById('network-toggle-btn');
      
      // Close dropdown when clicking outside
      if (dropdown && !dropdown.contains(target) && !toggleBtn?.contains(target)) {
        dropdown.classList.add('hidden');
      }
    });
  }
  
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
  
  // ============================================================================
  // Tab Handlers
  // ============================================================================
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = (btn as HTMLElement).dataset.tab as 'messages' | 'qora';
      if (!tab) return;
      
      // Update state (this will re-render with correct active states)
      actions.setActiveTab(tab);
    });
  });
  
  // ============================================================================
  // Qora Handlers
  // ============================================================================
  
  // Initialize Qora from sidebar
  document.getElementById('init-qora-btn')?.addEventListener('click', async () => {
    showToast('Initializing Qora...');
    await actions.qoraInit();
    await actions.qoraGetTasks();
    await actions.qoraGetHistory();
  });
  
  // Initialize Qora from main panel
  document.getElementById('qora-init-btn')?.addEventListener('click', async () => {
    const urlInput = document.getElementById('qora-ollama-url') as HTMLInputElement;
    const modelInput = document.getElementById('qora-model') as HTMLInputElement;
    const btn = document.getElementById('qora-init-btn') as HTMLButtonElement;
    
    btn.disabled = true;
    btn.textContent = 'Connecting...';
    
    try {
      await actions.qoraInit(urlInput.value || undefined, modelInput.value || undefined);
      await actions.qoraGetTasks();
      await actions.qoraGetHistory();
      showToast('Qora connected!');
    } catch (e) {
      showToast('Failed to connect to Ollama');
      btn.disabled = false;
      btn.textContent = 'Connect to Ollama';
    }
  });
  
  // Send chat to Qora
  const qoraChatHandler = async () => {
    const input = document.getElementById('qora-input') as HTMLInputElement;
    const content = input.value.trim();
    if (!content) return;
    
    input.value = '';
    input.disabled = true;
    
    try {
      await actions.qoraChat(content);
      // Scroll chat to bottom
      const chatContainer = document.getElementById('qora-chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    } finally {
      input.disabled = false;
      input.focus();
    }
  };
  
  document.getElementById('qora-send-btn')?.addEventListener('click', qoraChatHandler);
  document.getElementById('qora-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') qoraChatHandler();
  });
  
  // Work buttons
  document.getElementById('qora-work-btn')?.addEventListener('click', async () => {
    showToast('Qora is working...');
    const result = await actions.qoraWork();
    if (result) {
      showToast('Task completed!');
    }
  });
  
  document.getElementById('qora-work-all-btn')?.addEventListener('click', async () => {
    const confirmed = confirm('Start Qora grinding through all tasks? This may take a while.');
    if (!confirmed) return;
    
    showToast('Qora is grinding...');
    const result = await actions.qoraWorkAll();
    if (result) {
      showToast(result);
    }
  });
  
  // Add task
  document.getElementById('add-task-btn')?.addEventListener('click', () => {
    document.getElementById('add-task-modal')?.classList.remove('hidden');
  });
  
  document.getElementById('cancel-task-btn')?.addEventListener('click', () => {
    document.getElementById('add-task-modal')?.classList.add('hidden');
  });
  
  document.getElementById('confirm-task-btn')?.addEventListener('click', async () => {
    const titleInput = document.getElementById('task-title') as HTMLInputElement;
    const descInput = document.getElementById('task-description') as HTMLTextAreaElement;
    
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();
    
    if (!title || !desc) {
      showToast('Please fill in both title and description');
      return;
    }
    
    const btn = document.getElementById('confirm-task-btn') as HTMLButtonElement;
    btn.disabled = true;
    
    try {
      await actions.qoraAddTask(title, desc);
      titleInput.value = '';
      descInput.value = '';
      document.getElementById('add-task-modal')?.classList.add('hidden');
      showToast('Task added!');
    } finally {
      btn.disabled = false;
    }
  });
  
  // Answer questions
  document.querySelectorAll('.btn-answer').forEach(btn => {
    btn.addEventListener('click', async () => {
      const index = parseInt((btn as HTMLElement).dataset.index || '0');
      const input = document.querySelector(`.question-input[data-index="${index}"]`) as HTMLInputElement;
      const answer = input?.value.trim();
      
      if (!answer) {
        showToast('Please enter an answer');
        return;
      }
      
      (btn as HTMLButtonElement).disabled = true;
      
      try {
        await actions.qoraAnswerQuestion(index, answer);
        showToast('Answer submitted!');
      } finally {
        (btn as HTMLButtonElement).disabled = false;
      }
    });
  });
  
  // Scroll Qora chat to bottom
  const qoraChatContainer = document.getElementById('qora-chat-messages');
  if (qoraChatContainer) {
    qoraChatContainer.scrollTop = qoraChatContainer.scrollHeight;
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
