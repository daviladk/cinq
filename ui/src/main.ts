/**
 * cinQ Main Application Entry
 * 
 * Integrates P2P mesh (Rust/Tauri) with Qi wallet (qi-agent-sdk)
 */

import { invoke } from '@tauri-apps/api/core';
import * as wallet from './wallet';
import { renderApp } from './ui';

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

// User ID info
interface UserIdInfo {
  user_id: string;
  display: string;
  peer_id: string;
}

// ============================================================================
// Qora Types
// ============================================================================

interface QoraStatus {
  initialized: boolean;
  ollama_available: boolean;
  model: string;
  pending_tasks: number;
  pending_questions: string[];
}

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

// Application state
interface AppState {
  // P2P Node
  nodeRunning: boolean;
  peerId: string | null;
  peers: GridPeer[];
  
  // User ID
  userId: string | null;         // Raw 10-digit user ID
  userIdDisplay: string | null;  // Formatted XXX-XXX-XXXX
  
  // Wallet
  walletInitialized: boolean;
  paymentCode: string | null;
  quaiAddress: string | null;
  balance: bigint;
  quaiBalance: bigint;  // Quai balance for DeFi/dApps
  hasSavedWallet: boolean;
  network: 'orchard' | 'mainnet';
  
  // Chat
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  chatView: 'list' | 'conversation';
  
  // Qora AI Agent
  qora: {
    initialized: boolean;
    available: boolean;
    model: string;
    tasks: QoraTask[];
    questions: string[];
    history: QoraMessage[];
    chatInput: string;
    isWorking: boolean;
  };
  
  // UI
  currentView: 'landing' | 'main' | 'wallet-setup';
  activeTab: 'messages' | 'qora';
}

const state: AppState = {
  nodeRunning: false,
  peerId: null,
  peers: [] as GridPeer[],
  userId: null,
  userIdDisplay: null,
  walletInitialized: false,
  paymentCode: null,
  quaiAddress: null,
  balance: 0n,
  quaiBalance: 0n,
  hasSavedWallet: false,
  network: (localStorage.getItem('cinq_network') as 'orchard' | 'mainnet') || 'orchard',
  currentView: 'landing',
  // Chat state
  conversations: [],
  currentConversation: null,
  messages: [],
  chatView: 'list',
  // Qora state
  qora: {
    initialized: false,
    available: false,
    model: '',
    tasks: [],
    questions: [],
    history: [],
    chatInput: '',
    isWorking: false,
  },
  // UI state
  activeTab: 'messages',
};

// Response type from Rust backend
interface CommandResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// ============================================================================
// User ID Functions
// ============================================================================

async function getUserId(): Promise<UserIdInfo | null> {
  try {
    const result = await invoke<CommandResponse<UserIdInfo>>('get_user_id');
    if (result.success && result.data) {
      state.userId = result.data.user_id;
      state.userIdDisplay = result.data.display;
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to get user ID:', error);
    return null;
  }
}

async function lookupUserId(userId: string): Promise<string | null> {
  try {
    const result = await invoke<CommandResponse<string | null>>('lookup_user_id', { userId });
    if (result.success) {
      return result.data;
    }
    console.error('Lookup failed:', result.error);
    return null;
  } catch (error) {
    console.error('Failed to lookup user ID:', error);
    return null;
  }
}

// Tauri command wrappers
async function startNode(): Promise<void> {
  try {
    // Get the seed phrase from localStorage to derive Mesh ID
    const seedPhrase = localStorage.getItem('cinq_mnemonic') || undefined;
    
    const result = await invoke<CommandResponse<string>>('start_node', {
      seedPhrase: seedPhrase,
    });
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to start node');
    }
    state.nodeRunning = true;
    state.peerId = result.data;
    
    // Fetch user ID after node starts
    await getUserId();
    
    updateUI();
    console.log('Node started:', result.data);
    console.log('User ID:', state.userIdDisplay);
  } catch (error) {
    console.error('Failed to start node:', error);
    throw error;
  }
}

async function stopNode(): Promise<void> {
  try {
    const result = await invoke<CommandResponse<null>>('stop_node');
    if (!result.success) {
      console.warn('Stop node warning:', result.error);
    }
    state.nodeRunning = false;
    state.peerId = null;
    state.userId = null;
    state.userIdDisplay = null;
    state.peers = [];
    updateUI();
    console.log('Node stopped');
  } catch (error) {
    console.error('Failed to stop node:', error);
    throw error;
  }
}

interface GridPeer {
  peer_id: string;
  addresses: string[];
  connected: boolean;
  last_seen: number;
  chat_id: string | null;
}

async function getPeers(): Promise<GridPeer[]> {
  try {
    const result = await invoke<CommandResponse<GridPeer[]>>('get_peers');
    if (result.success && result.data) {
      state.peers = result.data;
      updateUI();
      return state.peers;
    }
    return [];
  } catch (error) {
    console.error('Failed to get peers:', error);
    return [];
  }
}

// ============================================================================
// Chat Functions
// ============================================================================

async function getConversations(): Promise<Conversation[]> {
  try {
    const result = await invoke<CommandResponse<Conversation[]>>('get_conversations');
    if (result.success && result.data) {
      state.conversations = result.data;
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return [];
  }
}

async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const result = await invoke<CommandResponse<ChatMessage[]>>('get_messages', {
      conversationId,
      limit: 100,
    });
    if (result.success && result.data) {
      state.messages = result.data.reverse(); // Show oldest first
      return state.messages;
    }
    return [];
  } catch (error) {
    console.error('Failed to get messages:', error);
    return [];
  }
}

async function sendMessage(peerId: string, content: string): Promise<ChatMessage | null> {
  try {
    const result = await invoke<CommandResponse<ChatMessage>>('send_message', {
      peerId,
      content,
    });
    if (result.success && result.data) {
      // Add to local messages
      state.messages.push(result.data);
      // Refresh conversations to update preview
      await getConversations();
      updateUI();
      return result.data;
    }
    console.error('Send message failed:', result.error);
    return null;
  } catch (error) {
    console.error('Failed to send message:', error);
    return null;
  }
}

// Start conversation with a peer ID or user ID
async function startConversationByUserId(userIdOrPeerId: string): Promise<void> {
  let peerId = userIdOrPeerId;
  let displayName = userIdOrPeerId;
  
  // Check if this looks like a user ID (10 digits, possibly with dashes)
  const normalized = userIdOrPeerId.replace(/-/g, '').replace(/\s/g, '');
  if (normalized.length === 10 && /^\d+$/.test(normalized)) {
    // It's a user ID - look up the peer ID
    const foundPeerId = await lookupUserId(normalized);
    if (foundPeerId) {
      peerId = foundPeerId;
      // Format user ID for display
      displayName = `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
    } else {
      // User ID not found in cache - for now, we can't proceed
      // TODO: Search DHT
      console.error('User ID not found:', normalized);
      alert(`User ID ${displayName} not found. They need to be online first.`);
      return;
    }
  } else if (peerId.length > 12) {
    // It's a peer ID - shorten for display
    displayName = peerId.slice(0, 12) + '...';
  }
  
  await startConversation(peerId, displayName);
}

async function startConversation(peerId: string, displayName?: string): Promise<void> {
  // Create or get conversation with this peer
  const name = displayName || (peerId.length > 12 ? peerId.slice(0, 12) + '...' : peerId);
  
  try {
    // Send an empty message just to create the conversation
    // Or find existing conversation
    let conversation = state.conversations.find(c => c.peer_id === peerId);
    
    if (!conversation) {
      // We'll create it when they send their first message
      // For now, create a temporary one
      conversation = {
        id: 'new-' + peerId,
        peer_id: peerId,
        display_name: name,
        last_message: null,
        last_message_at: null,
        unread_count: 0,
      };
      state.conversations.unshift(conversation);
    }
    
    state.currentConversation = conversation;
    state.messages = [];
    state.chatView = 'conversation';
    
    if (!conversation.id.startsWith('new-')) {
      await getMessages(conversation.id);
    }
    
    updateUI();
  } catch (error) {
    console.error('Failed to start conversation:', error);
  }
}

function openConversation(conversation: Conversation): void {
  state.currentConversation = conversation;
  state.chatView = 'conversation';
  getMessages(conversation.id).then(() => updateUI());
}

function backToConversationList(): void {
  state.currentConversation = null;
  state.chatView = 'list';
  state.messages = [];
  updateUI();
}

// ============================================================================
// Qora AI Agent Functions
// ============================================================================

async function qoraInit(ollamaUrl?: string, model?: string): Promise<QoraStatus | null> {
  try {
    const result = await invoke<CommandResponse<QoraStatus>>('qora_init', {
      ollamaUrl: ollamaUrl || null,
      model: model || null,
    });
    if (result.success && result.data) {
      state.qora.initialized = result.data.initialized;
      state.qora.available = result.data.ollama_available;
      state.qora.model = result.data.model;
      state.qora.questions = result.data.pending_questions;
      console.log('Qora initialized:', result.data);
      updateUI();
      return result.data;
    }
    console.error('Qora init failed:', result.error);
    return null;
  } catch (error) {
    console.error('Failed to initialize Qora:', error);
    return null;
  }
}

async function qoraStatus(): Promise<QoraStatus | null> {
  try {
    const result = await invoke<CommandResponse<QoraStatus>>('qora_status');
    if (result.success && result.data) {
      state.qora.initialized = result.data.initialized;
      state.qora.available = result.data.ollama_available;
      state.qora.model = result.data.model;
      state.qora.questions = result.data.pending_questions;
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to get Qora status:', error);
    return null;
  }
}

async function qoraChat(message: string): Promise<string | null> {
  try {
    // Add user message to history immediately for responsive UI
    state.qora.history.push({ role: 'user', content: message });
    updateUI();
    
    const result = await invoke<CommandResponse<string>>('qora_chat', { message });
    if (result.success && result.data) {
      // Add assistant response
      state.qora.history.push({ role: 'assistant', content: result.data });
      updateUI();
      return result.data;
    }
    console.error('Qora chat failed:', result.error);
    // Remove the user message if failed
    state.qora.history.pop();
    updateUI();
    return null;
  } catch (error) {
    console.error('Failed to chat with Qora:', error);
    state.qora.history.pop();
    updateUI();
    return null;
  }
}

async function qoraAddTask(title: string, description: string): Promise<QoraTask | null> {
  try {
    const result = await invoke<CommandResponse<QoraTask>>('qora_add_task', { title, description });
    if (result.success && result.data) {
      state.qora.tasks.push(result.data);
      updateUI();
      return result.data;
    }
    console.error('Add task failed:', result.error);
    return null;
  } catch (error) {
    console.error('Failed to add task:', error);
    return null;
  }
}

async function qoraGetTasks(): Promise<QoraTask[]> {
  try {
    const result = await invoke<CommandResponse<QoraTask[]>>('qora_get_tasks');
    if (result.success && result.data) {
      state.qora.tasks = result.data;
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Failed to get tasks:', error);
    return [];
  }
}

async function qoraWork(): Promise<string | null> {
  try {
    state.qora.isWorking = true;
    updateUI();
    
    const result = await invoke<CommandResponse<string | null>>('qora_work');
    
    state.qora.isWorking = false;
    
    if (result.success) {
      // Refresh tasks after work
      await qoraGetTasks();
      await qoraGetQuestions();
      updateUI();
      return result.data;
    }
    console.error('Work failed:', result.error);
    updateUI();
    return null;
  } catch (error) {
    console.error('Failed to work:', error);
    state.qora.isWorking = false;
    updateUI();
    return null;
  }
}

async function qoraWorkAll(): Promise<string | null> {
  try {
    state.qora.isWorking = true;
    updateUI();
    showNotification('Qora is grinding through tasks...');
    
    const result = await invoke<CommandResponse<string>>('qora_work_all');
    
    state.qora.isWorking = false;
    
    if (result.success && result.data) {
      await qoraGetTasks();
      await qoraGetQuestions();
      updateUI();
      showNotification('Qora finished working!');
      return result.data;
    }
    console.error('Work all failed:', result.error);
    updateUI();
    return null;
  } catch (error) {
    console.error('Failed to work all:', error);
    state.qora.isWorking = false;
    updateUI();
    return null;
  }
}

async function qoraGetQuestions(): Promise<string[]> {
  try {
    const result = await invoke<CommandResponse<string[]>>('qora_get_questions');
    if (result.success && result.data) {
      state.qora.questions = result.data;
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Failed to get questions:', error);
    return [];
  }
}

async function qoraAnswerQuestion(questionIndex: number, answer: string): Promise<string | null> {
  try {
    const result = await invoke<CommandResponse<string>>('qora_answer_question', {
      questionIndex,
      answer,
    });
    if (result.success && result.data) {
      // Refresh questions
      await qoraGetQuestions();
      updateUI();
      return result.data;
    }
    console.error('Answer failed:', result.error);
    return null;
  } catch (error) {
    console.error('Failed to answer question:', error);
    return null;
  }
}

async function qoraGetHistory(): Promise<QoraMessage[]> {
  try {
    const result = await invoke<CommandResponse<QoraMessage[]>>('qora_get_history');
    if (result.success && result.data) {
      state.qora.history = result.data.filter(m => m.role !== 'system'); // Don't show system prompt
      return state.qora.history;
    }
    return [];
  } catch (error) {
    console.error('Failed to get history:', error);
    return [];
  }
}

// Tab state management
function setActiveTab(tab: 'messages' | 'qora'): void {
  state.activeTab = tab;
  updateUI();
}

// Wallet integration
async function initializeNewWallet(): Promise<{ mnemonic: string; paymentCode: string; quaiAddress: string }> {
  // Reset identity (get new Chat ID and Mesh ID for new wallet)
  try {
    const resetResult = await invoke<CommandResponse<void>>('reset_identity');
    if (resetResult.success) {
      console.log('Identity reset - new Chat ID and Mesh ID will be generated');
    }
  } catch (e) {
    console.warn('Could not reset identity (node may need to be stopped first):', e);
  }
  
  const result = await wallet.createWallet({ network: state.network });
  
  state.walletInitialized = true;
  state.hasSavedWallet = true;
  state.paymentCode = result.paymentCode;
  state.quaiAddress = result.quaiAddress;
  
  // Save to localStorage (in production, use secure storage!)
  localStorage.setItem('cinq_mnemonic', result.mnemonic);
  localStorage.setItem('cinq_wallet', await wallet.serializeWallet());
  localStorage.setItem('cinq_network', state.network);
  
  // Start listening for payments
  wallet.onPaymentReceived((payment) => {
    console.log('Received payment:', wallet.formatQi(payment.amount));
    refreshBalance();
    showNotification(`Received ${wallet.formatQi(payment.amount)}`);
  });
  
  wallet.startPolling();
  // Don't call updateUI() here - let the caller show the mnemonic modal first
  
  return result;
}

async function restoreWallet(mnemonic: string): Promise<void> {
  const { paymentCode, quaiAddress } = await wallet.importWallet(mnemonic, { network: state.network });
  
  state.walletInitialized = true;
  state.hasSavedWallet = true;
  state.paymentCode = paymentCode;
  state.quaiAddress = quaiAddress;
  
  // Save to localStorage
  localStorage.setItem('cinq_mnemonic', mnemonic);
  localStorage.setItem('cinq_wallet', await wallet.serializeWallet());
  localStorage.setItem('cinq_network', state.network);
  
  await refreshBalance();
  wallet.startPolling();
  updateUI();
}

async function switchNetwork(network: 'orchard' | 'mainnet'): Promise<void> {
  if (network === state.network) return;
  
  const mnemonic = localStorage.getItem('cinq_mnemonic');
  if (!mnemonic) {
    console.error('No mnemonic found');
    return;
  }
  
  // Stop polling on old network
  wallet.stopPolling();
  
  // Update state
  state.network = network;
  localStorage.setItem('cinq_network', network);
  
  // Re-import wallet on new network
  try {
    const { paymentCode, quaiAddress } = await wallet.importWallet(mnemonic, { network });
    state.paymentCode = paymentCode;
    state.quaiAddress = quaiAddress;
    state.balance = 0n;  // Reset balance, will be fetched
    
    localStorage.setItem('cinq_wallet', await wallet.serializeWallet());
    
    await refreshBalance();
    wallet.startPolling();
    
    showNotification(`Switched to ${network === 'mainnet' ? 'Mainnet' : 'Orchard Testnet'}`);
  } catch (error) {
    console.error('Failed to switch network:', error);
    // Revert
    state.network = network === 'mainnet' ? 'orchard' : 'mainnet';
    localStorage.setItem('cinq_network', state.network);
  }
  
  updateUI();
}

async function clearSavedWallet(): Promise<void> {
  // Reset identity when clearing wallet
  try {
    const resetResult = await invoke<CommandResponse<void>>('reset_identity');
    if (resetResult.success) {
      console.log('Identity reset with wallet clear');
    }
  } catch (e) {
    console.warn('Could not reset identity:', e);
  }
  
  localStorage.removeItem('cinq_wallet');
  localStorage.removeItem('cinq_mnemonic');
  state.walletInitialized = false;
  state.hasSavedWallet = false;
  state.paymentCode = null;
  state.quaiAddress = null;
  state.balance = 0n;
  updateUI();
}

async function refreshBalance(): Promise<void> {
  if (!state.walletInitialized) return;
  
  try {
    // Fetch both Qi and Quai balances
    const [qiResult, quaiBalance] = await Promise.all([
      wallet.getBalance(),
      wallet.getQuaiBalance()
    ]);
    
    state.balance = qiResult.balance;
    state.quaiBalance = quaiBalance;
    updateUI();
  } catch (error) {
    console.error('Failed to refresh balance:', error);
  }
}

// Transfer with payment
async function transferAndPay(
  targetPeerId: string,
  data: Uint8Array,
  providerPaymentCode: string
): Promise<{ transferId: string; paymentTx: string }> {
  // 1. Execute transfer via Rust backend
  const transferResult = await invoke<{ transfer_id: string; bytes: number }>('send_data', {
    peerId: targetPeerId,
    data: Array.from(data),
  });
  
  // 2. Pay for the transfer
  const paymentResult = await wallet.payForTransfer(
    providerPaymentCode,
    transferResult.bytes
  );
  
  console.log(`Transfer ${transferResult.transfer_id} paid with tx ${paymentResult.qiTxHash}`);
  
  return {
    transferId: transferResult.transfer_id,
    paymentTx: paymentResult.qiTxHash,
  };
}

// UI helpers
function updateUI(): void {
  renderApp(state, {
    startNode,
    stopNode,
    initializeNewWallet,
    restoreWallet,
    refreshBalance,
    sendPayment: wallet.sendPayment,
    formatQi: wallet.formatQi,
    connectWithSavedWallet: async () => {
      // This is handled by the normal flow now
      await startNode();
    },
    clearSavedWallet,
    switchNetwork,
    // Chat actions
    getConversations,
    openConversation,
    backToConversationList,
    sendMessage,
    startConversation: startConversationByUserId, // Use the user ID aware version
    // Qora actions
    qoraInit,
    qoraStatus,
    qoraChat,
    qoraAddTask,
    qoraGetTasks,
    qoraWork,
    qoraWorkAll,
    qoraGetQuestions,
    qoraAnswerQuestion,
    qoraGetHistory,
    // Tab state
    setActiveTab,
  });
}

function showNotification(message: string): void {
  // Simple notification - can be enhanced with system notifications
  console.log('Notification:', message);
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 5000);
}

// Initialize app
async function init(): Promise<void> {
  console.log('cinQ initializing...');
  
  // Check for stored wallet
  const storedWallet = localStorage.getItem('cinq_wallet');
  const storedMnemonic = localStorage.getItem('cinq_mnemonic'); // Note: In production, use secure storage!
  
  // Track if there's a saved wallet (even before loading)
  state.hasSavedWallet = !!(storedWallet && storedMnemonic);
  
  if (storedWallet && storedMnemonic) {
    try {
      // Restore wallet with the correct network
      await wallet.deserializeWallet(storedWallet, storedMnemonic, { network: state.network });
      state.walletInitialized = true;
      state.paymentCode = wallet.getPaymentCode();
      state.quaiAddress = wallet.getQuaiAddress();
      
      // Refresh balance in background (don't block UI)
      refreshBalance().catch(e => console.warn('Balance refresh failed:', e));
      wallet.startPolling();
      console.log('Restored wallet:', state.paymentCode?.slice(0, 20) + '...');
    } catch (error) {
      console.error('Failed to restore wallet:', error);
      // Clear corrupted data
      localStorage.removeItem('cinq_wallet');
      localStorage.removeItem('cinq_mnemonic');
      state.hasSavedWallet = false;
    }
  }
  
  // Initial render
  updateUI();
  
  // Start peer polling when connected
  setInterval(() => {
    if (state.nodeRunning) {
      getPeers();
    }
  }, 10000);
}

// Export for use in UI
export {
  state,
  startNode,
  stopNode,
  getPeers,
  initializeNewWallet,
  restoreWallet,
  refreshBalance,
  transferAndPay,
};

// Start app
document.addEventListener('DOMContentLoaded', init);
