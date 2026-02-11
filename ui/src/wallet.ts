/**
 * cinQ Wallet - Qi Agent SDK Integration
 * 
 * This module provides wallet functionality for the cinQ mesh network,
 * enabling Qi payments for P2P services.
 */

// Note: @quai/agent-sdk may need to be installed from GitHub directly
// npm install github:0xnovabyte/qi-agent-sdk

export interface WalletState {
  initialized: boolean;
  paymentCode: string | null;
  balance: bigint;
  utxoCount: number;
  zone: string;
}

export interface PaymentResult {
  qiTxHash: string;
  notifyTxHash?: string;
  amount: bigint;
  recipient: string;
}

export interface IncomingPayment {
  amount: bigint;
  senderPaymentCode?: string;
  txHash: string;
  timestamp: number;
}

// Wallet configuration
export interface WalletConfig {
  network: 'mainnet' | 'orchard' | 'local';
  rpcUrl?: string;
  pollingInterval?: number;
}

const DEFAULT_CONFIG: WalletConfig = {
  network: 'mainnet',
  pollingInterval: 30000,
};

// Wallet state management
let walletState: WalletState = {
  initialized: false,
  paymentCode: null,
  balance: 0n,
  utxoCount: 0,
  zone: 'Cyprus1',
};

// Event callbacks
type PaymentCallback = (payment: IncomingPayment) => void;
type SenderCallback = (senderPaymentCode: string) => void;

let onPaymentCallbacks: PaymentCallback[] = [];
let onSenderCallbacks: SenderCallback[] = [];

/**
 * Initialize a new wallet with a fresh mnemonic
 */
export async function createWallet(config: Partial<WalletConfig> = {}): Promise<{
  mnemonic: string;
  paymentCode: string;
}> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  try {
    // Dynamic import to handle SDK availability
    const { QiAgentWallet } = await import('@quai/agent-sdk');
    
    const { wallet, mnemonic } = await QiAgentWallet.create({
      network: cfg.network,
      pollingInterval: cfg.pollingInterval,
    });
    
    const paymentCode = wallet.getPaymentCode();
    
    // Update state
    walletState = {
      initialized: true,
      paymentCode,
      balance: 0n,
      utxoCount: 0,
      zone: 'Cyprus1',
    };
    
    // Store wallet instance globally for later use
    (window as any).__cinqWallet = wallet;
    
    // Set up payment listeners
    wallet.onPaymentReceived((payment: any) => {
      const incoming: IncomingPayment = {
        amount: payment.amount,
        senderPaymentCode: payment.senderPaymentCode,
        txHash: payment.txHash || '',
        timestamp: Date.now(),
      };
      onPaymentCallbacks.forEach(cb => cb(incoming));
    });
    
    wallet.onSenderDiscovered((sender: string) => {
      onSenderCallbacks.forEach(cb => cb(sender));
    });
    
    return { mnemonic, paymentCode };
  } catch (error) {
    console.error('Failed to create wallet:', error);
    throw new Error(`Wallet creation failed: ${error}`);
  }
}

/**
 * Import an existing wallet from mnemonic
 */
export async function importWallet(
  mnemonic: string,
  config: Partial<WalletConfig> = {}
): Promise<string> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  try {
    const { QiAgentWallet } = await import('@quai/agent-sdk');
    
    const wallet = await QiAgentWallet.fromMnemonic(mnemonic, {
      network: cfg.network,
      pollingInterval: cfg.pollingInterval,
    });
    
    const paymentCode = wallet.getPaymentCode();
    
    // Sync to get current balance
    await wallet.sync();
    const balance = await wallet.getBalance();
    
    walletState = {
      initialized: true,
      paymentCode,
      balance: balance.balance,
      utxoCount: balance.utxoCount,
      zone: 'Cyprus1',
    };
    
    (window as any).__cinqWallet = wallet;
    
    return paymentCode;
  } catch (error) {
    console.error('Failed to import wallet:', error);
    throw new Error(`Wallet import failed: ${error}`);
  }
}

/**
 * Get current wallet balance
 */
export async function getBalance(): Promise<{ balance: bigint; utxoCount: number }> {
  const wallet = (window as any).__cinqWallet;
  if (!wallet) {
    throw new Error('Wallet not initialized');
  }
  
  const result = await wallet.getBalance();
  walletState.balance = result.balance;
  walletState.utxoCount = result.utxoCount;
  
  return result;
}

/**
 * Get total balance across all zones
 */
export async function getTotalBalance(): Promise<bigint> {
  const wallet = (window as any).__cinqWallet;
  if (!wallet) {
    throw new Error('Wallet not initialized');
  }
  
  return await wallet.getTotalBalance();
}

/**
 * Send Qi to another payment code
 */
export async function sendPayment(
  recipientPaymentCode: string,
  amount: bigint
): Promise<PaymentResult> {
  const wallet = (window as any).__cinqWallet;
  if (!wallet) {
    throw new Error('Wallet not initialized');
  }
  
  try {
    const result = await wallet.send(recipientPaymentCode, amount);
    
    // Refresh balance after send
    await getBalance();
    
    return {
      qiTxHash: result.qiTxHash,
      notifyTxHash: result.notifyTxHash,
      amount,
      recipient: recipientPaymentCode,
    };
  } catch (error) {
    console.error('Payment failed:', error);
    throw new Error(`Payment failed: ${error}`);
  }
}

/**
 * Pay for a data transfer
 * Calculates cost based on bytes transferred
 */
export async function payForTransfer(
  providerPaymentCode: string,
  bytesTransferred: number,
  ratePerMB: bigint = 1000n // Default: 1000 Qi per MB
): Promise<PaymentResult> {
  // Calculate cost: bytes → MB → Qi
  const mbTransferred = bytesTransferred / (1024 * 1024);
  const cost = BigInt(Math.ceil(mbTransferred)) * ratePerMB;
  
  if (cost === 0n) {
    throw new Error('Transfer too small to bill');
  }
  
  console.log(`Paying ${cost} Qi for ${mbTransferred.toFixed(2)} MB transfer`);
  
  return await sendPayment(providerPaymentCode, cost);
}

/**
 * Start polling for incoming payments
 */
export function startPolling(intervalMs?: number): void {
  const wallet = (window as any).__cinqWallet;
  if (!wallet) {
    throw new Error('Wallet not initialized');
  }
  
  wallet.startPolling(intervalMs);
}

/**
 * Stop polling for payments
 */
export function stopPolling(): void {
  const wallet = (window as any).__cinqWallet;
  if (wallet) {
    wallet.stopPolling();
  }
}

/**
 * Register callback for incoming payments
 */
export function onPaymentReceived(callback: PaymentCallback): void {
  onPaymentCallbacks.push(callback);
}

/**
 * Register callback for new sender discovery
 */
export function onSenderDiscovered(callback: SenderCallback): void {
  onSenderCallbacks.push(callback);
}

/**
 * Get current wallet state
 */
export function getWalletState(): WalletState {
  return { ...walletState };
}

/**
 * Get payment code for receiving payments
 */
export function getPaymentCode(): string | null {
  return walletState.paymentCode;
}

/**
 * Serialize wallet for persistence
 */
export async function serializeWallet(): Promise<string> {
  const wallet = (window as any).__cinqWallet;
  if (!wallet) {
    throw new Error('Wallet not initialized');
  }
  
  const data = wallet.serialize();
  return JSON.stringify(data);
}

/**
 * Deserialize wallet from storage
 */
export async function deserializeWallet(
  json: string,
  mnemonic: string,
  config: Partial<WalletConfig> = {}
): Promise<string> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  try {
    const { QiAgentWallet } = await import('@quai/agent-sdk');
    
    const data = JSON.parse(json);
    const wallet = await QiAgentWallet.deserialize(data, mnemonic, {
      network: cfg.network,
      pollingInterval: cfg.pollingInterval,
    });
    
    const paymentCode = wallet.getPaymentCode();
    
    walletState = {
      initialized: true,
      paymentCode,
      balance: 0n,
      utxoCount: 0,
      zone: 'Cyprus1',
    };
    
    (window as any).__cinqWallet = wallet;
    
    // Sync to get current state
    await wallet.sync();
    await getBalance();
    
    return paymentCode;
  } catch (error) {
    console.error('Failed to deserialize wallet:', error);
    throw new Error(`Wallet restore failed: ${error}`);
  }
}

/**
 * Format Qi amount for display
 */
export function formatQi(amount: bigint): string {
  // Qi uses 18 decimals like ETH
  const str = amount.toString().padStart(19, '0');
  const whole = str.slice(0, -18) || '0';
  const decimal = str.slice(-18, -14); // Show 4 decimal places
  return `${whole}.${decimal} Qi`;
}
