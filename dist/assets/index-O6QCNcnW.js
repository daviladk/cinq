const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-DoSyO7I7.js","assets/_commonjsHelpers-C4iS2aBk.js","assets/index-CSCCMl66.js"])))=>i.map(i=>d[i]);
(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const l of s)if(l.type==="childList")for(const c of l.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&n(c)}).observe(document,{childList:!0,subtree:!0});function a(s){const l={};return s.integrity&&(l.integrity=s.integrity),s.referrerPolicy&&(l.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?l.credentials="include":s.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function n(s){if(s.ep)return;s.ep=!0;const l=a(s);fetch(s.href,l)}})();async function f(e,t={},a){return window.__TAURI_INTERNALS__.invoke(e,t,a)}const O="modulepreload",P=function(e){return"/"+e},q={},y=function(t,a,n){let s=Promise.resolve();if(a&&a.length>0){document.getElementsByTagName("link");const c=document.querySelector("meta[property=csp-nonce]"),i=c?.nonce||c?.getAttribute("nonce");s=Promise.allSettled(a.map(r=>{if(r=P(r),r in q)return;q[r]=!0;const u=r.endsWith(".css"),m=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${r}"]${m}`))return;const d=document.createElement("link");if(d.rel=u?"stylesheet":O,u||(d.as="script"),d.crossOrigin="",d.href=r,i&&d.setAttribute("nonce",i),document.head.appendChild(d),u)return new Promise((g,v)=>{d.addEventListener("load",g),d.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${r}`)))})}))}function l(c){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=c,window.dispatchEvent(i),!i.defaultPrevented)throw c}return s.then(c=>{for(const i of c||[])i.status==="rejected"&&l(i.reason);return t().catch(l)})},k={network:"orchard",pollingInterval:3e4};let w={initialized:!1,paymentCode:null,quaiAddress:null,balance:0n,utxoCount:0,zone:"Cyprus1"},A=[],F=[];async function R(e={}){const t={...k,...e};try{const{QiAgentWallet:a}=await y(async()=>{const{QiAgentWallet:d}=await import("./index-DoSyO7I7.js").then(g=>g.i);return{QiAgentWallet:d}},__vite__mapDeps([0,1])),{Mnemonic:n,HDNodeWallet:s}=await y(async()=>{const{Mnemonic:d,HDNodeWallet:g}=await import("./index-CSCCMl66.js");return{Mnemonic:d,HDNodeWallet:g}},__vite__mapDeps([2,1])),{wallet:l,mnemonic:c}=await a.create({network:t.network,pollingInterval:t.pollingInterval}),i=l.getPaymentCode(),r=n.fromPhrase(c),m=s.fromMnemonic(r,"m/44'/994'/0'/0/0").address;return w={initialized:!0,paymentCode:i,quaiAddress:m,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=l,window.__cinqMnemonic=c,l.onPaymentReceived(d=>{const g={amount:d.amount,senderPaymentCode:d.senderPaymentCode,txHash:d.txHash||"",timestamp:Date.now()};A.forEach(v=>v(g))}),l.onSenderDiscovered(d=>{F.forEach(g=>g(d))}),{mnemonic:c,paymentCode:i,quaiAddress:m}}catch(a){throw console.error("Failed to create wallet:",a),new Error(`Wallet creation failed: ${a}`)}}async function B(e,t={}){const a={...k,...t};try{const{QiAgentWallet:n}=await y(async()=>{const{QiAgentWallet:g}=await import("./index-DoSyO7I7.js").then(v=>v.i);return{QiAgentWallet:g}},__vite__mapDeps([0,1])),{Mnemonic:s,HDNodeWallet:l}=await y(async()=>{const{Mnemonic:g,HDNodeWallet:v}=await import("./index-CSCCMl66.js");return{Mnemonic:g,HDNodeWallet:v}},__vite__mapDeps([2,1])),c=await n.fromMnemonic(e,{network:a.network,pollingInterval:a.pollingInterval}),i=c.getPaymentCode(),r=s.fromPhrase(e),m=l.fromMnemonic(r,"m/44'/994'/0'/0/0").address;await c.sync();const d=await c.getBalance();return w={initialized:!0,paymentCode:i,quaiAddress:m,balance:d.balance,utxoCount:d.utxoCount,zone:"Cyprus1"},window.__cinqWallet=c,window.__cinqMnemonic=e,{paymentCode:i,quaiAddress:m}}catch(n){throw console.error("Failed to import wallet:",n),new Error(`Wallet import failed: ${n}`)}}async function N(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=await e.getBalance();return w.balance=t.balance,w.utxoCount=t.utxoCount,t}async function z(){try{const{JsonRpcProvider:e}=await y(async()=>{const{JsonRpcProvider:c}=await import("./index-CSCCMl66.js");return{JsonRpcProvider:c}},__vite__mapDeps([2,1])),t=w.quaiAddress;if(!t)return 0n;const n=(localStorage.getItem("cinq_network")||"orchard")==="mainnet"?"https://rpc.quai.network":"https://rpc.orchard.quai.network";return await new e(n).getBalance(t)}catch(e){return console.error("Failed to get Quai balance:",e),0n}}async function x(e,t){const a=window.__cinqWallet;if(!a)throw new Error("Wallet not initialized");try{const n=await a.send(e,t);return await N(),{qiTxHash:n.qiTxHash,notifyTxHash:n.notifyTxHash,amount:t,recipient:e}}catch(n){throw console.error("Payment failed:",n),new Error(`Payment failed: ${n}`)}}function C(e){const t=window.__cinqWallet;if(!t)throw new Error("Wallet not initialized");try{t.startPolling(e)}catch(a){console.warn("Wallet polling not available:",a)}}function H(){const e=window.__cinqWallet;e&&e.stopPolling()}function Q(e){A.push(e)}function U(){return w.paymentCode}function V(){return w.quaiAddress}async function S(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=e.serialize();return JSON.stringify(t)}async function j(e,t,a={}){const n={...k,...a};try{const{QiAgentWallet:s}=await y(async()=>{const{QiAgentWallet:v}=await import("./index-DoSyO7I7.js").then(_=>_.i);return{QiAgentWallet:v}},__vite__mapDeps([0,1])),{Mnemonic:l,HDNodeWallet:c}=await y(async()=>{const{Mnemonic:v,HDNodeWallet:_}=await import("./index-CSCCMl66.js");return{Mnemonic:v,HDNodeWallet:_}},__vite__mapDeps([2,1])),i=JSON.parse(e),r=await s.deserialize(i,t,{network:n.network,pollingInterval:n.pollingInterval}),u=r.getPaymentCode(),m=l.fromPhrase(t),g=c.fromMnemonic(m,"m/44'/994'/0'/0/0").address;return w={initialized:!0,paymentCode:u,quaiAddress:g,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=r,window.__cinqMnemonic=t,await r.sync(),await N(),u}catch(s){throw console.error("Failed to deserialize wallet:",s),new Error(`Wallet restore failed: ${s}`)}}function I(e){const t=e.toString().padStart(19,"0"),a=t.slice(0,-18)||"0",n=t.slice(-18,-14);return`${a}.${n} Qi`}function J(e){return e===0n?"0.00 QUAI":(Number(e)/1e18).toFixed(4)+" QUAI"}function G(e,t){const a=document.getElementById("app");a&&(e.walletInitialized&&e.nodeRunning?(a.innerHTML=Y(e),ne(e,t)):(e.walletInitialized&&e.nodeRunning,a.innerHTML=W(e),T(e,t)))}function W(e,t){const a=e.hasSavedWallet;return a&&e.walletInitialized?`
      <div class="landing">
        <div class="landing-content">
          <h1 class="logo"><span class="logo-cin">cin</span><span class="logo-q">Q</span></h1>
          <p class="tagline">Welcome back!</p>
          
          <div class="wallet-preview">
            <div class="preview-label">Your Wallet</div>
            <code class="preview-address">${e.paymentCode?.slice(0,20)}...</code>
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
    `:a&&!e.walletInitialized?`
      <div class="landing">
        <div class="landing-content">
          <h1 class="logo"><span class="logo-cin">cin</span><span class="logo-q">Q</span></h1>
          <p class="tagline">Loading your wallet...</p>
        </div>
      </div>
    `:`
      <div class="landing">
        <div class="landing-content">
          <h1 class="logo"><span class="logo-cin">cin</span><span class="logo-q">Q</span></h1>
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
    `}function Y(e,t){e.peerId&&`${e.peerId.slice(0,8)}`,e.paymentCode&&`${e.paymentCode.slice(0,10)}`;const a=e.network==="mainnet",n=e.sidebarCollapsed?"sidebar collapsed":"sidebar",s=e.sidebarCollapsed?"▶":"◀";return`
    <div class="main-app cockpit-layout">
      <!-- Collapsible Sidebar -->
      <aside class="${n}" id="sidebar">
        <button class="sidebar-toggle" id="sidebar-toggle" title="Toggle panel">
          <span class="toggle-icon">${s}</span>
        </button>
        
        <div class="sidebar-content">
          <!-- Status Gauge -->
          <div class="gauge status-gauge">
            <div class="gauge-header">
              <span class="gauge-icon">●</span>
              <span class="gauge-title">Mesh</span>
            </div>
            <div class="gauge-value ${e.nodeRunning?"online":"offline"}">
              ${e.nodeRunning?"ONLINE":"OFFLINE"}
            </div>
            <div class="gauge-detail">${e.peers.length} peers</div>
          </div>
          
          <!-- Wallet Gauge -->
          <div class="gauge wallet-gauge">
            <div class="gauge-header">
              <span class="gauge-icon">💰</span>
              <span class="gauge-title">Wallet</span>
            </div>
            <div class="gauge-value qi">${I(e.balance)}</div>
            <div class="gauge-detail">${J(e.quaiBalance)}</div>
            <div class="gauge-network ${a?"mainnet":"testnet"}">
              ${a?"🔴 MAINNET":"🧪 TESTNET"}
            </div>
          </div>
          
          <!-- Network Gauge -->
          <div class="gauge network-gauge">
            <div class="gauge-header">
              <span class="gauge-icon">📊</span>
              <span class="gauge-title">Stats</span>
            </div>
            <div class="gauge-stats">
              <div class="mini-stat">
                <span class="mini-value">${e.peers.length+1}</span>
                <span class="mini-label">Nodes</span>
              </div>
              <div class="mini-stat">
                <span class="mini-value">0</span>
                <span class="mini-label">KB</span>
              </div>
            </div>
          </div>
          
          <!-- Identity Gauge -->
          <div class="gauge identity-gauge">
            <div class="gauge-header">
              <span class="gauge-icon">🆔</span>
              <span class="gauge-title">Chat ID</span>
            </div>
            <div class="gauge-value chat-id" id="sidebar-chat-id">${e.userIdDisplay||"..."}</div>
            <button class="gauge-action" id="copy-user-id" title="Copy Chat ID">📋 Copy</button>
          </div>
          
          <!-- Sidebar Actions -->
          <div class="sidebar-actions">
            <button id="view-seed-btn" class="sidebar-btn" title="Recovery phrase">🔑</button>
            <button id="refresh-balance-btn" class="sidebar-btn" title="Refresh">🔄</button>
            <button id="network-toggle-btn" class="sidebar-btn" title="Network">⚙️</button>
            <button id="disconnect-btn" class="sidebar-btn danger" title="Disconnect">⏻</button>
          </div>
        </div>
      </aside>
      
      <!-- Network dropdown (hidden) -->
      <div id="network-dropdown" class="network-dropdown hidden">
        <button class="network-option ${a?"":"active"}" data-network="orchard">
          🧪 Orchard (Testnet)
        </button>
        <button class="network-option ${a?"active":""}" data-network="mainnet">
          🔴 Mainnet
        </button>
      </div>
      
      <!-- Main Chat Area -->
      <main class="main-content">
        <header class="chat-topbar">
          <div class="topbar-left">
            <h1 class="logo-small"><span class="logo-cin">cin</span><span class="logo-q">Q</span></h1>
          </div>
          <div class="topbar-center">
            <span class="your-id">Your ID: <strong>${e.userIdDisplay||"..."}</strong></span>
          </div>
          <div class="topbar-right">
            <span class="connection-indicator ${e.nodeRunning?"online":"offline"}">●</span>
          </div>
        </header>
        
        <div class="chat-main">
          ${K(e)}
        </div>
      </main>
      
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
    </div>
  `}function K(e){return e.chatView==="conversation"&&e.currentConversation?Z(e):X(e)}function X(e){const t=e.conversations,a=e.peers;return`
    <div class="chat-container full-height">
      <div class="chat-list-header">
        <h2>Messages</h2>
        <button id="new-chat-btn" class="btn-new-chat" title="New Chat">+ New Chat</button>
      </div>
      
      <div class="chat-list-body">
        ${t.length===0&&a.length===0?`
          <div class="chat-empty-state">
            <div class="empty-icon">💬</div>
            <h3>No conversations yet</h3>
            <p>Enter a Chat ID to start messaging, or wait for peers to connect.</p>
            <button id="start-chat-empty-btn" class="btn-primary">Start a Chat</button>
          </div>
        `:""}
        
        ${t.length>0?`
          <div class="conversation-list">
            ${t.map(n=>`
              <div class="conversation-item" data-conv-id="${n.id}" data-peer-id="${n.peer_id}">
                <div class="conv-avatar">👤</div>
                <div class="conv-info">
                  <div class="conv-name">${E(n.display_name)}</div>
                  <div class="conv-preview">${E(n.last_message||"No messages yet")}</div>
                </div>
                ${n.unread_count>0?`<span class="unread-badge">${n.unread_count}</span>`:""}
              </div>
            `).join("")}
          </div>
        `:""}
        
        ${a.length>0?`
          <div class="online-peers-section">
            <div class="section-header">
              <span class="section-icon">🌐</span>
              Online Now (${a.length})
            </div>
            <div class="peer-grid">
              ${a.map(n=>`
                <button class="peer-chip" data-peer-id="${n}">
                  <span class="peer-dot">●</span>
                  ${n.slice(0,8)}...
                </button>
              `).join("")}
            </div>
          </div>
        `:""}
      </div>
    </div>
  `}function Z(e){const t=e.currentConversation,a=e.messages;return`
    <div class="chat-container full-height conversation-active">
      <div class="conversation-header">
        <button id="back-to-list-btn" class="btn-back">← Back</button>
        <div class="conv-header-info">
          <span class="conv-header-name">${E(t.display_name)}</span>
          <span class="conv-header-status">● Online</span>
        </div>
        <div class="conv-header-actions">
          <!-- Future: call, video, info buttons -->
        </div>
      </div>
      
      <div class="messages-scroll" id="messages-container">
        ${a.length===0?`
          <div class="chat-empty-state">
            <div class="empty-icon">👋</div>
            <p>Send the first message to start the conversation!</p>
          </div>
        `:`
          <div class="messages-list">
            ${a.map(n=>`
              <div class="message ${n.is_outgoing?"outgoing":"incoming"}">
                <div class="message-bubble">
                  <div class="message-text">${E(n.content)}</div>
                  <div class="message-meta">
                    <span class="message-time">${ee(n.timestamp)}</span>
                    ${n.is_outgoing?`<span class="message-status">${te(n.status)}</span>`:""}
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>
      
      <div class="message-composer">
        <input type="text" id="message-input" placeholder="Type a message..." autocomplete="off">
        <button id="send-msg-btn" class="btn-send">
          <span>Send</span>
        </button>
      </div>
    </div>
  `}function E(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function ee(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function te(e){switch(e){case"Pending":return"⏳";case"Sent":return"✓";case"Delivered":return"✓✓";case"Read":return"✓✓";case"Failed":return"✗";default:return""}}function T(e,t){console.log("attachLandingHandlers called, hasSavedWallet:",e.hasSavedWallet,"walletInitialized:",e.walletInitialized);const a=document.getElementById("connect-btn");console.log("connect-btn element:",a?"FOUND":"NOT FOUND"),a?.addEventListener("click",async()=>{const n=document.getElementById("connect-btn");if(!n){console.error("Connect button not found");return}console.log("Connect button clicked, walletInitialized:",e.walletInitialized),n.disabled=!0,n.textContent="Connecting...";try{console.log("Calling startNode..."),await t.startNode(),console.log("startNode completed successfully")}catch(s){console.error("Failed to connect:",s),n.disabled=!1,n.textContent="Connect to Mesh",alert("Failed to connect: "+(s instanceof Error?s.message:String(s)))}}),document.getElementById("use-different-wallet-btn")?.addEventListener("click",()=>{t.clearSavedWallet()}),document.getElementById("create-wallet-landing-btn")?.addEventListener("click",async()=>{const n=document.getElementById("create-wallet-landing-btn");n.disabled=!0,n.textContent="Creating...";try{console.log("Creating new wallet...");const{mnemonic:s}=await t.initializeNewWallet();console.log("Wallet created, mnemonic received:",s?"yes":"no");const l=document.getElementById("mnemonic-modal"),c=document.getElementById("mnemonic-words");console.log("Modal element:",l?"found":"NOT FOUND"),console.log("Words element:",c?"found":"NOT FOUND"),l&&c?(c.innerHTML=s.split(" ").map((i,r)=>`<span class="word"><span class="num">${r+1}.</span> ${i}</span>`).join(""),l.classList.remove("hidden"),console.log("Modal should now be visible")):alert(`⚠️ SAVE THESE WORDS:

`+s.split(" ").map((i,r)=>`${r+1}. ${i}`).join(`
`)+`

Click OK after saving.`)}catch(s){console.error("Failed to create wallet:",s),n.disabled=!1,n.textContent="Create New Wallet",alert("Failed to create wallet: "+(s instanceof Error?s.message:String(s)))}}),document.getElementById("import-wallet-landing-btn")?.addEventListener("click",()=>{document.getElementById("import-modal")?.classList.remove("hidden")}),document.getElementById("cancel-import-btn")?.addEventListener("click",()=>{document.getElementById("import-modal")?.classList.add("hidden")}),document.getElementById("confirm-import-btn")?.addEventListener("click",async()=>{const s=document.getElementById("mnemonic-input").value.trim().toLowerCase();if(!s||s.split(/\s+/).length!==12){alert("Please enter a valid 12-word mnemonic.");return}const l=document.getElementById("confirm-import-btn");l.disabled=!0,l.textContent="Importing...";try{await t.restoreWallet(s)}catch(c){console.error("Failed to import wallet:",c),l.disabled=!1,l.textContent="Import",alert("Failed to import wallet. Check your mnemonic.")}}),document.getElementById("confirm-saved-btn")?.addEventListener("click",async()=>{document.getElementById("mnemonic-modal")?.classList.add("hidden");try{await t.startNode()}catch(s){console.error("Failed to connect:",s)}})}function ne(e,t){document.getElementById("sidebar-toggle")?.addEventListener("click",()=>{t.toggleSidebar()});const n=document.getElementById("network-toggle-btn"),s=document.getElementById("network-dropdown");n?.addEventListener("click",()=>{s?.classList.toggle("hidden")}),document.addEventListener("click",i=>{!n?.contains(i.target)&&!s?.contains(i.target)&&s?.classList.add("hidden")},{once:!0}),document.querySelectorAll(".network-option").forEach(i=>{i.addEventListener("click",async()=>{const r=i.dataset.network;if(r===e.network){s?.classList.add("hidden");return}if(r==="mainnet"&&!confirm(`⚠️ Switching to MAINNET will use REAL FUNDS.

Are you sure?`)){s?.classList.add("hidden");return}s?.classList.add("hidden"),h(`Switching to ${r==="mainnet"?"Mainnet":"Orchard Testnet"}...`);try{await t.switchNetwork(r),h(`Connected to ${r==="mainnet"?"Mainnet":"Orchard Testnet"}`)}catch(u){console.error("Failed to switch network:",u),h("Failed to switch network")}})}),document.getElementById("copy-payment-code")?.addEventListener("click",()=>{e.paymentCode&&(navigator.clipboard.writeText(e.paymentCode),h("Payment code copied!"))}),document.getElementById("copy-quai-address")?.addEventListener("click",()=>{e.quaiAddress&&(navigator.clipboard.writeText(e.quaiAddress),h("Quai address copied!"))}),document.getElementById("copy-user-id")?.addEventListener("click",()=>{e.userId&&(navigator.clipboard.writeText(e.userId),h("Chat ID copied! Share it with friends."))}),document.getElementById("view-seed-btn")?.addEventListener("click",()=>{const i=localStorage.getItem("cinq_mnemonic");if(i){const r=document.getElementById("view-seed-modal"),u=document.getElementById("view-mnemonic-words");r&&u&&(u.innerHTML=i.split(" ").map((m,d)=>`<span class="word"><span class="num">${d+1}.</span> ${m}</span>`).join(""),r.classList.remove("hidden"))}else h("No recovery phrase found")}),document.getElementById("close-seed-modal-btn")?.addEventListener("click",()=>{document.getElementById("view-seed-modal")?.classList.add("hidden")}),document.getElementById("refresh-balance-btn")?.addEventListener("click",async()=>{const i=document.getElementById("refresh-balance-btn");i.disabled=!0,i.textContent="Refreshing...";try{await t.refreshBalance()}finally{i.disabled=!1,i.textContent="Refresh Balance"}}),document.getElementById("disconnect-btn")?.addEventListener("click",async()=>{await t.stopNode()}),t.getConversations(),document.querySelectorAll(".conversation-item").forEach(i=>{i.addEventListener("click",()=>{const r=i.dataset.convId;i.dataset.peerId;const u=e.conversations.find(m=>m.id===r);u&&t.openConversation(u)})}),document.querySelectorAll(".peer-chip").forEach(i=>{i.addEventListener("click",()=>{const r=i.dataset.peerId;r&&t.startConversation(r)})}),document.getElementById("start-chat-empty-btn")?.addEventListener("click",()=>{const i=prompt("Enter Chat ID (e.g., 555-123-4567):");i&&i.trim()&&t.startConversation(i.trim())}),document.getElementById("back-to-list-btn")?.addEventListener("click",()=>{t.backToConversationList()});const l=async()=>{const i=document.getElementById("message-input"),r=i.value.trim();if(!r||!e.currentConversation)return;const u=e.currentConversation.peer_id;i.value="",i.focus(),await t.sendMessage(u,r);const m=document.getElementById("messages-container");m&&(m.scrollTop=m.scrollHeight)};document.getElementById("send-msg-btn")?.addEventListener("click",l),document.getElementById("message-input")?.addEventListener("keypress",i=>{i.key==="Enter"&&l()}),document.getElementById("new-chat-btn")?.addEventListener("click",()=>{const i=prompt("Enter Chat ID (e.g., 555-123-4567):");i&&i.trim()&&t.startConversation(i.trim())});const c=document.getElementById("messages-container");c&&(c.scrollTop=c.scrollHeight)}function h(e){const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.classList.add("show"),10),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},3e3)}const ae=console.error;console.error=(...e)=>{const t=e[0]?.toString?.()||"";t.includes("Invalid zone")||t.includes("fetching notifications")||ae.apply(console,e)};const o={nodeRunning:!1,peerId:null,peers:[],userId:null,userIdDisplay:null,walletInitialized:!1,paymentCode:null,quaiAddress:null,balance:0n,quaiBalance:0n,hasSavedWallet:!1,network:localStorage.getItem("cinq_network")||"orchard",currentView:"landing",conversations:[],currentConversation:null,messages:[],chatView:"list",sidebarCollapsed:!1};async function oe(){try{const e=await f("get_user_id");return e.success&&e.data?(o.userId=e.data.user_id,o.userIdDisplay=e.data.display,e.data):null}catch(e){return console.error("Failed to get user ID:",e),null}}async function se(e){try{const t=await f("lookup_user_id",{userId:e});return t.success?t.data:(console.error("Lookup failed:",t.error),null)}catch(t){return console.error("Failed to lookup user ID:",t),null}}async function $(){try{console.log("%c[NODE] Starting node...","color: yellow; font-weight: bold");const e=await f("start_node");if(console.log("%c[NODE] start_node result:","color: yellow",e),!e.success||!e.data)throw new Error(e.error||"Failed to start node");o.nodeRunning=!0,o.peerId=e.data,console.log("%c[NODE] Node running, fetching user ID...","color: yellow"),await oe(),console.log("%c[NODE] User ID fetched, fetching conversations...","color: yellow"),await L(),console.log("%c[NODE] Conversations fetched, updating UI...","color: yellow"),p(),console.log("Node started:",e.data),console.log("User ID:",o.userIdDisplay)}catch(e){throw console.error("%c[NODE] ✗ Failed to start node:","color: red; font-weight: bold",e),e}}async function ie(){try{const e=await f("stop_node");e.success||console.warn("Stop node warning:",e.error),o.nodeRunning=!1,o.peerId=null,o.userId=null,o.userIdDisplay=null,o.peers=[],p(),console.log("Node stopped")}catch(e){throw console.error("Failed to stop node:",e),e}}async function re(){try{const e=await f("get_peers");if(e.success&&e.data){const t=e.data.map(a=>a.peer_id);return JSON.stringify(t)!==JSON.stringify(o.peers)&&(o.peers=t,p()),o.peers}return[]}catch(e){return console.error("Failed to get peers:",e),[]}}async function L(){try{console.log("%c[CHAT] Fetching conversations...","color: cyan; font-weight: bold");const e=await f("get_conversations");return console.log("%c[CHAT] Conversations result:","color: cyan; font-weight: bold",JSON.stringify(e,null,2)),e.success&&e.data?(o.conversations=e.data,console.log("%c[CHAT] ✓ Loaded "+e.data.length+" conversations","color: lime; font-weight: bold"),console.log("%c[CHAT] Conversations in state:","color: lime",o.conversations),e.data):(console.log("%c[CHAT] ✗ No conversations or error:","color: orange; font-weight: bold",e.error),[])}catch(e){return console.error("%c[CHAT] ✗ Failed to get conversations:","color: red; font-weight: bold",e),[]}}async function D(e){try{const t=await f("get_messages",{conversationId:e,limit:100});return t.success&&t.data?(o.messages=t.data.reverse(),o.messages):[]}catch(t){return console.error("Failed to get messages:",t),[]}}async function le(e,t){try{const a=await f("send_message",{peerId:e,content:t});return a.success&&a.data?(o.messages.push(a.data),await L(),p(),a.data):(console.error("Send message failed:",a.error),null)}catch(a){return console.error("Failed to send message:",a),null}}async function ce(e){let t=e,a=e;const n=e.replace(/-/g,"").replace(/\s/g,"");if(n.length===10&&/^\d+$/.test(n)){const s=await se(n);if(s)t=s,a=`${n.slice(0,3)}-${n.slice(3,6)}-${n.slice(6)}`;else{console.error("User ID not found:",n),alert(`User ID ${a} not found. They need to be online first.`);return}}else t.length>12&&(a=t.slice(0,12)+"...");await de(t,a)}async function de(e,t){const a=t||(e.length>12?e.slice(0,12)+"...":e);try{let n=o.conversations.find(s=>s.peer_id===e);n||(n={id:"new-"+e,peer_id:e,display_name:a,last_message:null,last_message_at:null,unread_count:0},o.conversations.unshift(n)),o.currentConversation=n,o.messages=[],o.chatView="conversation",n.id.startsWith("new-")||await D(n.id),p()}catch(n){console.error("Failed to start conversation:",n)}}function ue(e){o.currentConversation=e,o.chatView="conversation",D(e.id).then(()=>p())}function me(){o.currentConversation=null,o.chatView="list",o.messages=[],p()}async function ge(){const e=await R({network:o.network});return o.walletInitialized=!0,o.hasSavedWallet=!0,o.paymentCode=e.paymentCode,o.quaiAddress=e.quaiAddress,localStorage.setItem("cinq_mnemonic",e.mnemonic),localStorage.setItem("cinq_wallet",await S()),localStorage.setItem("cinq_network",o.network),Q(t=>{console.log("Received payment:",I(t.amount)),b(),M(`Received ${I(t.amount)}`)}),C(),e}async function pe(e){const{paymentCode:t,quaiAddress:a}=await B(e,{network:o.network});o.walletInitialized=!0,o.hasSavedWallet=!0,o.paymentCode=t,o.quaiAddress=a,localStorage.setItem("cinq_mnemonic",e),localStorage.setItem("cinq_wallet",await S()),localStorage.setItem("cinq_network",o.network),await b(),C(),p()}async function ve(e){if(e===o.network)return;const t=localStorage.getItem("cinq_mnemonic");if(!t){console.error("No mnemonic found");return}H(),o.network=e,localStorage.setItem("cinq_network",e);try{const{paymentCode:a,quaiAddress:n}=await B(t,{network:e});o.paymentCode=a,o.quaiAddress=n,o.balance=0n,localStorage.setItem("cinq_wallet",await S()),await b(),C(),M(`Switched to ${e==="mainnet"?"Mainnet":"Orchard Testnet"}`)}catch(a){console.error("Failed to switch network:",a),o.network=e==="mainnet"?"orchard":"mainnet",localStorage.setItem("cinq_network",o.network)}p()}function we(){localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic"),o.walletInitialized=!1,o.hasSavedWallet=!1,o.paymentCode=null,o.quaiAddress=null,o.balance=0n,p()}async function b(){if(o.walletInitialized)try{const[e,t]=await Promise.all([N(),z()]);o.balance=e.balance,o.quaiBalance=t,p()}catch(e){console.error("Failed to refresh balance:",e)}}function fe(){o.sidebarCollapsed=!o.sidebarCollapsed,p()}function p(){G(o,{startNode:$,stopNode:ie,initializeNewWallet:ge,restoreWallet:pe,refreshBalance:b,sendPayment:x,formatQi:I,connectWithSavedWallet:async()=>{await $()},clearSavedWallet:we,switchNetwork:ve,getConversations:L,openConversation:ue,backToConversationList:me,sendMessage:le,startConversation:ce,toggleSidebar:fe})}function M(e){console.log("Notification:",e);const t=document.createElement("div");t.className="notification",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),5e3)}async function he(){console.log("%c[INIT] init() starting...","color: magenta; font-weight: bold");const e=localStorage.getItem("cinq_wallet"),t=localStorage.getItem("cinq_mnemonic");if(console.log("%c[INIT] storedWallet:","color: magenta",e?"EXISTS":"NONE"),console.log("%c[INIT] storedMnemonic:","color: magenta",t?"EXISTS":"NONE"),o.hasSavedWallet=!!(e&&t),console.log("%c[INIT] hasSavedWallet:","color: magenta",o.hasSavedWallet),e&&t)try{console.log("%c[INIT] Restoring wallet...","color: magenta"),await j(e,t,{network:o.network}),o.walletInitialized=!0,o.paymentCode=U(),o.quaiAddress=V(),console.log("%c[INIT] Wallet restored, walletInitialized:","color: lime; font-weight: bold",o.walletInitialized),b().catch(a=>console.warn("Balance refresh failed:",a)),C(),console.log("Restored wallet:",o.paymentCode?.slice(0,20)+"...")}catch(a){console.error("%c[INIT] ✗ Failed to restore wallet:","color: red; font-weight: bold",a),localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic"),o.hasSavedWallet=!1}console.log("%c[INIT] Calling updateUI()...","color: magenta; font-weight: bold"),p(),setInterval(()=>{o.nodeRunning&&re()},1e4)}console.log("%c[INIT] main.ts loaded, adding DOMContentLoaded listener","color: magenta; font-weight: bold");document.addEventListener("DOMContentLoaded",()=>{console.log("%c[INIT] DOMContentLoaded fired, calling init()","color: magenta; font-weight: bold"),he()});
