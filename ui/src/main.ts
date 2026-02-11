/**
 * cinQ Main Application Entry
 * 
 * Integrates P2P mesh (Rust/Tauri) with Qi wallet (qi-agent-sdk)
 */

import { invoke } from '@tauri-apps/api/core';
import * as wallet from './wallet';
import { renderApp } from './ui';

// Application state
interface AppState {
  // P2P Node
  nodeRunning: boolean;
  peerId: string | null;
  peers: string[];
  
  // Wallet
  walletInitialized: boolean;
  paymentCode: string | null;
  quaiAddress: string | null;
  balance: bigint;
  
  // UI
  currentView: 'landing' | 'main' | 'wallet-setup';
}

const state: AppState = {
  nodeRunning: false,
  peerId: null,
  peers: [],
  walletInitialized: false,
  paymentCode: null,
  quaiAddress: null,
  balance: 0n,
  currentView: 'landing',
};

// Tauri command wrappers
async function startNode(): Promise<void> {
  try {
    const result = await invoke<{ peer_id: string }>('start_node');
    state.nodeRunning = true;
    state.peerId = result.peer_id;
    updateUI();
    console.log('Node started:', result.peer_id);
  } catch (error) {
    console.error('Failed to start node:', error);
    throw error;
  }
}

async function stopNode(): Promise<void> {
  try {
    await invoke('stop_node');
    state.nodeRunning = false;
    state.peerId = null;
    state.peers = [];
    updateUI();
    console.log('Node stopped');
  } catch (error) {
    console.error('Failed to stop node:', error);
    throw error;
  }
}

async function getPeers(): Promise<string[]> {
  try {
    const peers = await invoke<string[]>('get_connected_peers');
    state.peers = peers;
    updateUI();
    return peers;
  } catch (error) {
    console.error('Failed to get peers:', error);
    return [];
  }
}

// Wallet integration
async function initializeNewWallet(): Promise<{ mnemonic: string; paymentCode: string; quaiAddress: string }> {
  const result = await wallet.createWallet({ network: 'mainnet' });
  
  state.walletInitialized = true;
  state.paymentCode = result.paymentCode;
  state.quaiAddress = result.quaiAddress;
  
  // Start listening for payments
  wallet.onPaymentReceived((payment) => {
    console.log('Received payment:', wallet.formatQi(payment.amount));
    refreshBalance();
    showNotification(`Received ${wallet.formatQi(payment.amount)}`);
  });
  
  wallet.startPolling();
  updateUI();
  
  return result;
}

async function restoreWallet(mnemonic: string): Promise<void> {
  const { paymentCode, quaiAddress } = await wallet.importWallet(mnemonic, { network: 'mainnet' });
  
  state.walletInitialized = true;
  state.paymentCode = paymentCode;
  state.quaiAddress = quaiAddress;
  
  await refreshBalance();
  wallet.startPolling();
  updateUI();
}

async function refreshBalance(): Promise<void> {
  if (!state.walletInitialized) return;
  
  try {
    const { balance } = await wallet.getBalance();
    state.balance = balance;
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
  
  if (storedWallet && storedMnemonic) {
    try {
      await wallet.deserializeWallet(storedWallet, storedMnemonic);
      state.walletInitialized = true;
      state.paymentCode = wallet.getPaymentCode();
      await refreshBalance();
      wallet.startPolling();
    } catch (error) {
      console.error('Failed to restore wallet:', error);
      // Clear corrupted data
      localStorage.removeItem('cinq_wallet');
      localStorage.removeItem('cinq_mnemonic');
    }
  }
  
  // Initial render
  updateUI();
  
  // Start peer polling
  setInterval(getPeers, 10000);
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
