// cinQ Chat - P2P Messaging Client
document.addEventListener('DOMContentLoaded', init);

function init() {
    console.log('cinQ Chat initializing...');
    
    // State
    const state = {
        nodeRunning: false,
        peerId: null,
        peers: [],
        conversations: [],
        currentConversation: null,
        messages: [],
    };

    // DOM Elements
    const landing = document.getElementById('landing');
    const mainApp = document.getElementById('main-app');
    const connectBtn = document.getElementById('connect-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const statusDot = document.getElementById('status-dot');
    const peerCount = document.getElementById('peer-count');
    const peerIdEl = document.getElementById('peer-id');
    const copyPeerIdBtn = document.getElementById('copy-peer-id');
    const conversationsEl = document.getElementById('conversations');
    const noConversations = document.getElementById('no-conversations');
    const noChatSelected = document.getElementById('no-chat-selected');
    const chatView = document.getElementById('chat-view');
    const chatAvatar = document.getElementById('chat-avatar');
    const chatPeerName = document.getElementById('chat-peer-name');
    const chatPeerId = document.getElementById('chat-peer-id');
    const messagesEl = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const newChatModal = document.getElementById('new-chat-modal');
    const peerList = document.getElementById('peer-list');
    const newPeerIdInput = document.getElementById('new-peer-id');
    const newPeerNameInput = document.getElementById('new-peer-name');
    const cancelNewChat = document.getElementById('cancel-new-chat');
    const startChatBtn = document.getElementById('start-chat-btn');
    
    // Dial peer modal elements
    const dialPeerBtn = document.getElementById('dial-peer-btn');
    const dialPeerModal = document.getElementById('dial-peer-modal');
    const dialAddressInput = document.getElementById('dial-address');
    const cancelDial = document.getElementById('cancel-dial');
    const dialBtn = document.getElementById('dial-btn');
    const dialStatus = document.getElementById('dial-status');

    // Tauri invoke helper
    async function invoke(cmd, args = {}) {
        if (window.__TAURI__?.core?.invoke) {
            return await window.__TAURI__.core.invoke(cmd, args);
        }
        // Demo mode fallback
        console.log('Demo mode:', cmd, args);
        return { success: true, data: null };
    }

    // Format time
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    // Short peer ID
    function shortPeerId(peerId) {
        if (!peerId) return '?';
        return peerId.substring(0, 8) + '...';
    }

    // Get initial from name
    function getInitial(name) {
        return name ? name.charAt(0).toUpperCase() : '?';
    }

    // Update UI
    function updateStatus() {
        statusDot.classList.toggle('online', state.nodeRunning);
        peerCount.textContent = state.peers.length;
        if (state.peerId) {
            peerIdEl.textContent = shortPeerId(state.peerId);
            peerIdEl.title = state.peerId;
        }
    }

    function renderConversations() {
        if (state.conversations.length === 0) {
            noConversations.classList.remove('hidden');
            return;
        }
        
        noConversations.classList.add('hidden');
        
        // Clear and rebuild (keep empty state hidden)
        const existingConvs = conversationsEl.querySelectorAll('.conversation');
        existingConvs.forEach(el => el.remove());
        
        state.conversations.forEach(conv => {
            const el = document.createElement('div');
            el.className = 'conversation' + (state.currentConversation?.id === conv.id ? ' active' : '');
            el.dataset.id = conv.id;
            el.dataset.peerId = conv.peer_id;
            
            el.innerHTML = `
                <div class="conv-avatar">${getInitial(conv.display_name)}</div>
                <div class="conv-info">
                    <div class="conv-name">${conv.display_name || shortPeerId(conv.peer_id)}</div>
                    <div class="conv-preview">${conv.last_message || 'No messages yet'}</div>
                </div>
                <div class="conv-meta">
                    ${conv.last_message_at ? `<span class="conv-time">${formatTime(conv.last_message_at)}</span>` : ''}
                    ${conv.unread_count > 0 ? `<span class="conv-unread">${conv.unread_count}</span>` : ''}
                </div>
            `;
            
            el.addEventListener('click', () => selectConversation(conv));
            conversationsEl.appendChild(el);
        });
    }

    function renderMessages() {
        messagesEl.innerHTML = '';
        
        state.messages.forEach(msg => {
            const el = document.createElement('div');
            el.className = 'message ' + (msg.is_outgoing ? 'outgoing' : 'incoming');
            
            el.innerHTML = `
                <div class="message-content">${escapeHtml(msg.content)}</div>
                <div class="message-time">
                    ${formatTime(msg.timestamp)}
                    ${msg.is_outgoing ? `<span class="message-status">${msg.status === 'sent' ? '✓' : msg.status === 'delivered' ? '✓✓' : ''}</span>` : ''}
                </div>
            `;
            
            messagesEl.appendChild(el);
        });
        
        // Scroll to bottom
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Actions
    async function startNode() {
        console.log('Starting node...');
        connectBtn.disabled = true;
        connectBtn.textContent = 'Starting...';
        
        try {
            const result = await invoke('start_node');
            if (result.success) {
                state.nodeRunning = true;
                state.peerId = result.data;
                landing.classList.add('hidden');
                mainApp.classList.remove('hidden');
                
                // Start polling
                startPolling();
                
                // Load conversations
                await loadConversations();
            } else {
                alert('Failed to start: ' + result.error);
            }
        } catch (e) {
            console.error('Start failed:', e);
            alert('Failed to start node');
        }
        
        connectBtn.disabled = false;
        connectBtn.textContent = 'Start cinQ';
        updateStatus();
    }

    async function stopNode() {
        try {
            await invoke('stop_node');
        } catch (e) {
            console.error('Stop failed:', e);
        }
        
        state.nodeRunning = false;
        state.peerId = null;
        state.peers = [];
        state.conversations = [];
        state.currentConversation = null;
        state.messages = [];
        
        stopPolling();
        
        mainApp.classList.add('hidden');
        landing.classList.remove('hidden');
        updateStatus();
    }

    async function loadConversations() {
        try {
            const result = await invoke('get_conversations');
            if (result.success && result.data) {
                state.conversations = result.data;
                renderConversations();
            }
        } catch (e) {
            console.error('Failed to load conversations:', e);
        }
    }

    async function selectConversation(conv) {
        state.currentConversation = conv;
        
        // Update UI
        noChatSelected.classList.add('hidden');
        chatView.classList.remove('hidden');
        chatAvatar.textContent = getInitial(conv.display_name);
        chatPeerName.textContent = conv.display_name || shortPeerId(conv.peer_id);
        chatPeerId.textContent = conv.peer_id;
        
        // Mark as read
        if (conv.unread_count > 0) {
            await invoke('mark_conversation_read', { conversationId: conv.id });
            conv.unread_count = 0;
        }
        
        // Load messages
        try {
            const result = await invoke('get_messages', { conversationId: conv.id, limit: 50 });
            if (result.success && result.data) {
                state.messages = result.data;
                renderMessages();
            }
        } catch (e) {
            console.error('Failed to load messages:', e);
        }
        
        renderConversations();
        messageInput.focus();
    }

    async function sendMessage() {
        const content = messageInput.value.trim();
        if (!content || !state.currentConversation) return;
        
        messageInput.value = '';
        messageInput.disabled = true;
        sendBtn.disabled = true;
        
        try {
            const result = await invoke('send_message', {
                peerId: state.currentConversation.peer_id,
                content: content,
            });
            
            if (result.success && result.data) {
                // Add to local messages
                state.messages.push(result.data);
                renderMessages();
                
                // Update conversation preview
                state.currentConversation.last_message = content;
                state.currentConversation.last_message_at = result.data.timestamp;
                renderConversations();
            } else {
                alert('Failed to send: ' + (result.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Send failed:', e);
            alert('Failed to send message');
        }
        
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }

    async function startNewChat() {
        const peerId = newPeerIdInput.value.trim();
        const displayName = newPeerNameInput.value.trim() || shortPeerId(peerId);
        
        if (!peerId) {
            alert('Please enter a Peer ID');
            return;
        }
        
        try {
            const result = await invoke('start_conversation', {
                peerId: peerId,
                displayName: displayName || null,
            });
            
            if (result.success && result.data) {
                // Check if already in list
                const existing = state.conversations.find(c => c.peer_id === peerId);
                if (!existing) {
                    state.conversations.unshift(result.data);
                }
                
                closeNewChatModal();
                renderConversations();
                selectConversation(result.data);
            } else {
                alert('Failed: ' + (result.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Start conversation failed:', e);
        }
    }

    function openNewChatModal() {
        // Populate peer list with connected peers
        peerList.innerHTML = '';
        
        if (state.peers.length > 0) {
            state.peers.forEach(peer => {
                const el = document.createElement('div');
                el.className = 'peer-item';
                el.innerHTML = `
                    <span class="dot"></span>
                    <span class="peer-id">${shortPeerId(peer.peer_id)}</span>
                `;
                el.addEventListener('click', () => {
                    newPeerIdInput.value = peer.peer_id;
                });
                peerList.appendChild(el);
            });
        } else {
            peerList.innerHTML = '<div style="color: var(--text-dim); font-size: 0.85rem;">No peers online</div>';
        }
        
        newPeerIdInput.value = '';
        newPeerNameInput.value = '';
        newChatModal.classList.remove('hidden');
    }

    function closeNewChatModal() {
        newChatModal.classList.add('hidden');
    }

    // Polling
    let pollInterval = null;
    
    function startPolling() {
        pollInterval = setInterval(async () => {
            if (!state.nodeRunning) return;
            
            try {
                // Get peers
                const peersResult = await invoke('get_peers');
                if (peersResult.success && peersResult.data) {
                    state.peers = peersResult.data;
                    updateStatus();
                }
                
                // Refresh conversations
                await loadConversations();
                
                // If viewing a conversation, refresh messages
                if (state.currentConversation) {
                    const msgResult = await invoke('get_messages', { 
                        conversationId: state.currentConversation.id, 
                        limit: 50 
                    });
                    if (msgResult.success && msgResult.data) {
                        const newCount = msgResult.data.length;
                        const oldCount = state.messages.length;
                        state.messages = msgResult.data;
                        if (newCount !== oldCount) {
                            renderMessages();
                        }
                    }
                }
            } catch (e) {
                console.error('Polling error:', e);
            }
        }, 3000);
    }

    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    // Event Listeners
    connectBtn.addEventListener('click', startNode);
    disconnectBtn.addEventListener('click', stopNode);
    newChatBtn.addEventListener('click', openNewChatModal);
    cancelNewChat.addEventListener('click', closeNewChatModal);
    startChatBtn.addEventListener('click', startNewChat);
    
    // Copy Peer ID to clipboard
    async function copyPeerId() {
        if (!state.peerId) return;
        try {
            await navigator.clipboard.writeText(state.peerId);
            copyPeerIdBtn.textContent = '✓';
            setTimeout(() => { copyPeerIdBtn.textContent = '📋'; }, 1500);
        } catch (e) {
            // Fallback
            prompt('Your Peer ID:', state.peerId);
        }
    }
    
    copyPeerIdBtn.addEventListener('click', copyPeerId);
    peerIdEl.addEventListener('click', copyPeerId);
    
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Close modal on overlay click
    newChatModal.addEventListener('click', (e) => {
        if (e.target === newChatModal) {
            closeNewChatModal();
        }
    });
    
    // Select peer from list by clicking
    peerList.addEventListener('click', (e) => {
        const peerItem = e.target.closest('.peer-item');
        if (peerItem) {
            const peerId = peerItem.querySelector('.peer-id').textContent;
            // Find full peer ID
            const peer = state.peers.find(p => shortPeerId(p.peer_id) === peerId);
            if (peer) {
                newPeerIdInput.value = peer.peer_id;
            }
        }
    });
    
    // Dial Peer Modal
    function openDialModal() {
        dialAddressInput.value = '';
        dialStatus.textContent = '';
        dialPeerModal.classList.remove('hidden');
        dialAddressInput.focus();
    }
    
    function closeDialModal() {
        dialPeerModal.classList.add('hidden');
    }
    
    async function dialPeer() {
        const address = dialAddressInput.value.trim();
        if (!address) {
            dialStatus.style.color = 'var(--red)';
            dialStatus.textContent = 'Please enter an address';
            return;
        }
        
        dialBtn.disabled = true;
        dialBtn.textContent = 'Connecting...';
        dialStatus.style.color = 'var(--text-dim)';
        dialStatus.textContent = 'Dialing...';
        
        try {
            const result = await invoke('connect_peer', { address: address });
            if (result.success) {
                dialStatus.style.color = 'var(--green)';
                dialStatus.textContent = '✓ Connection initiated! Peer should appear shortly.';
                setTimeout(() => {
                    closeDialModal();
                }, 2000);
            } else {
                dialStatus.style.color = 'var(--red)';
                dialStatus.textContent = '✗ ' + (result.error || 'Connection failed');
            }
        } catch (e) {
            console.error('Dial failed:', e);
            dialStatus.style.color = 'var(--red)';
            dialStatus.textContent = '✗ ' + e.message;
        }
        
        dialBtn.disabled = false;
        dialBtn.textContent = 'Connect';
    }
    
    dialPeerBtn.addEventListener('click', openDialModal);
    cancelDial.addEventListener('click', closeDialModal);
    dialBtn.addEventListener('click', dialPeer);
    
    dialAddressInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') dialPeer();
    });
    
    dialPeerModal.addEventListener('click', (e) => {
        if (e.target === dialPeerModal) closeDialModal();
    });

    console.log('cinQ Chat ready!');
}
