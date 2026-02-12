const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-DoSyO7I7.js","assets/_commonjsHelpers-C4iS2aBk.js","assets/index-CSCCMl66.js"])))=>i.map(i=>d[i]);
(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function a(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=a(i);fetch(i.href,r)}})();async function f(e,t={},a){return window.__TAURI_INTERNALS__.invoke(e,t,a)}const D="modulepreload",O=function(e){return"/"+e},L={},y=function(t,a,n){let i=Promise.resolve();if(a&&a.length>0){document.getElementsByTagName("link");const s=document.querySelector("meta[property=csp-nonce]"),l=s?.nonce||s?.getAttribute("nonce");i=Promise.allSettled(a.map(c=>{if(c=O(c),c in L)return;L[c]=!0;const u=c.endsWith(".css"),v=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${v}`))return;const d=document.createElement("link");if(d.rel=u?"stylesheet":D,u||(d.as="script"),d.crossOrigin="",d.href=c,l&&d.setAttribute("nonce",l),document.head.appendChild(d),u)return new Promise((m,w)=>{d.addEventListener("load",m),d.addEventListener("error",()=>w(new Error(`Unable to preload CSS for ${c}`)))})}))}function r(s){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=s,window.dispatchEvent(l),!l.defaultPrevented)throw s}return i.then(s=>{for(const l of s||[])l.status==="rejected"&&r(l.reason);return t().catch(r)})},k={network:"orchard",pollingInterval:3e4};let g={initialized:!1,paymentCode:null,quaiAddress:null,balance:0n,utxoCount:0,zone:"Cyprus1"},A=[],F=[];async function R(e={}){const t={...k,...e};try{const{QiAgentWallet:a}=await y(async()=>{const{QiAgentWallet:d}=await import("./index-DoSyO7I7.js").then(m=>m.i);return{QiAgentWallet:d}},__vite__mapDeps([0,1])),{Mnemonic:n,HDNodeWallet:i}=await y(async()=>{const{Mnemonic:d,HDNodeWallet:m}=await import("./index-CSCCMl66.js");return{Mnemonic:d,HDNodeWallet:m}},__vite__mapDeps([2,1])),{wallet:r,mnemonic:s}=await a.create({network:t.network,pollingInterval:t.pollingInterval}),l=r.getPaymentCode(),c=n.fromPhrase(s),v=i.fromMnemonic(c,"m/44'/994'/0'/0/0").address;return g={initialized:!0,paymentCode:l,quaiAddress:v,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=r,window.__cinqMnemonic=s,r.onPaymentReceived(d=>{const m={amount:d.amount,senderPaymentCode:d.senderPaymentCode,txHash:d.txHash||"",timestamp:Date.now()};A.forEach(w=>w(m))}),r.onSenderDiscovered(d=>{F.forEach(m=>m(d))}),{mnemonic:s,paymentCode:l,quaiAddress:v}}catch(a){throw console.error("Failed to create wallet:",a),new Error(`Wallet creation failed: ${a}`)}}async function B(e,t={}){const a={...k,...t};try{const{QiAgentWallet:n}=await y(async()=>{const{QiAgentWallet:m}=await import("./index-DoSyO7I7.js").then(w=>w.i);return{QiAgentWallet:m}},__vite__mapDeps([0,1])),{Mnemonic:i,HDNodeWallet:r}=await y(async()=>{const{Mnemonic:m,HDNodeWallet:w}=await import("./index-CSCCMl66.js");return{Mnemonic:m,HDNodeWallet:w}},__vite__mapDeps([2,1])),s=await n.fromMnemonic(e,{network:a.network,pollingInterval:a.pollingInterval}),l=s.getPaymentCode(),c=i.fromPhrase(e),v=r.fromMnemonic(c,"m/44'/994'/0'/0/0").address;await s.sync();const d=await s.getBalance();return g={initialized:!0,paymentCode:l,quaiAddress:v,balance:d.balance,utxoCount:d.utxoCount,zone:"Cyprus1"},window.__cinqWallet=s,window.__cinqMnemonic=e,{paymentCode:l,quaiAddress:v}}catch(n){throw console.error("Failed to import wallet:",n),new Error(`Wallet import failed: ${n}`)}}async function q(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=await e.getBalance();return g.balance=t.balance,g.utxoCount=t.utxoCount,t}async function z(){try{const{JsonRpcProvider:e}=await y(async()=>{const{JsonRpcProvider:s}=await import("./index-CSCCMl66.js");return{JsonRpcProvider:s}},__vite__mapDeps([2,1])),t=g.quaiAddress;if(!t)return 0n;const n=(localStorage.getItem("cinq_network")||"orchard")==="mainnet"?"https://rpc.quai.network":"https://rpc.orchard.quai.network";return await new e(n).getBalance(t)}catch(e){return console.error("Failed to get Quai balance:",e),0n}}async function x(e,t){const a=window.__cinqWallet;if(!a)throw new Error("Wallet not initialized");try{const n=await a.send(e,t);return await q(),{qiTxHash:n.qiTxHash,notifyTxHash:n.notifyTxHash,amount:t,recipient:e}}catch(n){throw console.error("Payment failed:",n),new Error(`Payment failed: ${n}`)}}function E(e){const t=window.__cinqWallet;if(!t)throw new Error("Wallet not initialized");t.startPolling(e)}function Q(){const e=window.__cinqWallet;e&&e.stopPolling()}function H(e){A.push(e)}function U(){return g.paymentCode}function V(){return g.quaiAddress}async function S(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=e.serialize();return JSON.stringify(t)}async function j(e,t,a={}){const n={...k,...a};try{const{QiAgentWallet:i}=await y(async()=>{const{QiAgentWallet:w}=await import("./index-DoSyO7I7.js").then(C=>C.i);return{QiAgentWallet:w}},__vite__mapDeps([0,1])),{Mnemonic:r,HDNodeWallet:s}=await y(async()=>{const{Mnemonic:w,HDNodeWallet:C}=await import("./index-CSCCMl66.js");return{Mnemonic:w,HDNodeWallet:C}},__vite__mapDeps([2,1])),l=JSON.parse(e),c=await i.deserialize(l,t,{network:n.network,pollingInterval:n.pollingInterval}),u=c.getPaymentCode(),v=r.fromPhrase(t),m=s.fromMnemonic(v,"m/44'/994'/0'/0/0").address;return g={initialized:!0,paymentCode:u,quaiAddress:m,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=c,window.__cinqMnemonic=t,await c.sync(),await q(),u}catch(i){throw console.error("Failed to deserialize wallet:",i),new Error(`Wallet restore failed: ${i}`)}}function I(e){const t=e.toString().padStart(19,"0"),a=t.slice(0,-18)||"0",n=t.slice(-18,-14);return`${a}.${n} Qi`}function Y(e){return e===0n?"0.00 QUAI":(Number(e)/1e18).toFixed(4)+" QUAI"}function J(e,t){const a=document.getElementById("app");a&&(e.walletInitialized&&e.nodeRunning?(a.innerHTML=K(e),ne(e,t)):(e.walletInitialized&&e.nodeRunning,a.innerHTML=W(e),N(e,t)))}function W(e,t){const a=e.hasSavedWallet;return a&&e.walletInitialized?`
      <div class="landing">
        <div class="landing-content">
          <h1 class="logo">cinQ</h1>
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
          <h1 class="logo">cinQ</h1>
          <p class="tagline">Loading your wallet...</p>
        </div>
      </div>
    `:`
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
    `}function K(e,t){const a=e.peerId?`${e.peerId.slice(0,8)}...`:"Not connected",n=e.paymentCode?`${e.paymentCode.slice(0,12)}...`:"N/A",i=e.quaiAddress?`${e.quaiAddress.slice(0,10)}...${e.quaiAddress.slice(-6)}`:"N/A",r=e.network==="mainnet";return`
    <div class="main-app">
      <header class="header">
        <div class="logo-small">cinQ</div>
        <div class="header-right">
          <div class="network-badge ${r?"mainnet":"testnet"}">
            ${r?"🔴 MAINNET":"🧪 TESTNET"}
          </div>
          <div class="status">
            <span class="status-dot ${e.nodeRunning?"online":"offline"}"></span>
            <span>${e.nodeRunning?"Connected":"Offline"}</span>
          </div>
        </div>
      </header>
      
      <div class="dashboard">
        <div class="card wallet-card">
          <div class="wallet-header">
            <h3>💰 Wallet</h3>
            <div class="network-toggle">
              <button id="network-toggle-btn" class="btn-network ${r?"mainnet":"testnet"}">
                ${r?"🔴 Mainnet":"🧪 Orchard"}
                <span class="toggle-arrow">▼</span>
              </button>
              <div id="network-dropdown" class="network-dropdown hidden">
                <button class="network-option ${r?"":"active"}" data-network="orchard">
                  🧪 Orchard (Testnet)
                </button>
                <button class="network-option ${r?"active":""}" data-network="mainnet">
                  🔴 Mainnet
                </button>
              </div>
            </div>
          </div>
          <div class="balances">
            <div class="balance-item">
              <span class="balance-label">Qi (Payments)</span>
              <span class="balance-value qi">${I(e.balance)}</span>
            </div>
            <div class="balance-item">
              <span class="balance-label">Quai (DeFi)</span>
              <span class="balance-value quai">${Y(e.quaiBalance)}</span>
            </div>
          </div>
          <div class="wallet-addresses">
            <div class="address-row">
              <label>Qi Payment Code:</label>
              <code id="payment-code" title="${e.paymentCode||""}">${n}</code>
              <button id="copy-payment-code" class="btn-icon" title="Copy Payment Code">📋</button>
            </div>
            <div class="address-row">
              <label>Quai Address (DeFi):</label>
              <code id="quai-address" title="${e.quaiAddress||""}">${i}</code>
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
              <code id="user-id-display" class="user-id" title="Share this ID with friends to chat">${e.userIdDisplay||"Loading..."}</code>
              <button id="copy-user-id" class="btn-icon" title="Copy Chat ID">📋</button>
            </div>
            <div class="info-row">
              <span>Mesh ID:</span>
              <code class="peer-id-small" title="Technical peer ID">${a}</code>
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
              <span class="stat-value">${e.peers.length+1}</span>
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
          ${G(e)}
        </div>
      </div>
    </div>
  `}function G(e){return e.chatView==="conversation"&&e.currentConversation?Z(e):X(e)}function X(e){const t=e.conversations,a=e.peers;return`
    <div class="chat-container">
      <div class="chat-header">
        <span>Your Conversations</span>
        <button id="new-chat-btn" class="btn-icon" title="New Chat">➕</button>
      </div>
      
      ${t.length===0?`
        <div class="chat-empty">
          <p>No conversations yet</p>
          <p class="chat-hint">Enter a Chat ID to start messaging</p>
        </div>
      `:`
        <div class="conversation-list">
          ${t.map(n=>`
            <div class="conversation-item" data-conv-id="${n.id}" data-peer-id="${n.peer_id}">
              <div class="conv-avatar">👤</div>
              <div class="conv-info">
                <div class="conv-name">${_(n.display_name)}</div>
                <div class="conv-preview">${_(n.last_message||"No messages yet")}</div>
              </div>
              ${n.unread_count>0?`<span class="unread-badge">${n.unread_count}</span>`:""}
            </div>
          `).join("")}
        </div>
      `}
      
      ${a.length>0?`
        <div class="online-peers">
          <div class="peers-header">Online Peers (${a.length})</div>
          <div class="peer-list">
            ${a.slice(0,5).map(n=>`
              <button class="peer-item" data-peer-id="${n}">
                <span class="peer-status">●</span>
                <span class="peer-id">${n.slice(0,12)}...</span>
              </button>
            `).join("")}
          </div>
        </div>
      `:""}
    </div>
  `}function Z(e){const t=e.currentConversation,a=e.messages;return`
    <div class="chat-container conversation-view">
      <div class="chat-header">
        <button id="back-to-list-btn" class="btn-icon">←</button>
        <div class="conv-title">
          <span class="conv-name">${t.display_name}</span>
          <span class="conv-status">● Online</span>
        </div>
      </div>
      
      <div class="messages-container" id="messages-container">
        ${a.length===0?`
          <div class="chat-empty">
            <p>No messages yet</p>
            <p class="chat-hint">Send the first message!</p>
          </div>
        `:a.map(n=>`
          <div class="message ${n.is_outgoing?"outgoing":"incoming"}">
            <div class="message-content">${_(n.content)}</div>
            <div class="message-meta">
              <span class="message-time">${ee(n.timestamp)}</span>
              ${n.is_outgoing?`<span class="message-status">${te(n.status)}</span>`:""}
            </div>
          </div>
        `).join("")}
      </div>
      
      <div class="message-input-container">
        <input type="text" id="message-input" placeholder="Type a message..." autocomplete="off">
        <button id="send-msg-btn" class="btn-send">Send</button>
      </div>
    </div>
  `}function _(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function ee(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function te(e){switch(e){case"Pending":return"⏳";case"Sent":return"✓";case"Delivered":return"✓✓";case"Read":return"✓✓";case"Failed":return"✗";default:return""}}function N(e,t){console.log("attachLandingHandlers called, hasSavedWallet:",e.hasSavedWallet,"walletInitialized:",e.walletInitialized);const a=document.getElementById("connect-btn");console.log("connect-btn element:",a?"FOUND":"NOT FOUND"),a?.addEventListener("click",async()=>{const n=document.getElementById("connect-btn");if(!n){console.error("Connect button not found");return}console.log("Connect button clicked, walletInitialized:",e.walletInitialized),n.disabled=!0,n.textContent="Connecting...";try{console.log("Calling startNode..."),await t.startNode(),console.log("startNode completed successfully")}catch(i){console.error("Failed to connect:",i),n.disabled=!1,n.textContent="Connect to Mesh",alert("Failed to connect: "+(i instanceof Error?i.message:String(i)))}}),document.getElementById("use-different-wallet-btn")?.addEventListener("click",()=>{t.clearSavedWallet()}),document.getElementById("create-wallet-landing-btn")?.addEventListener("click",async()=>{const n=document.getElementById("create-wallet-landing-btn");n.disabled=!0,n.textContent="Creating...";try{console.log("Creating new wallet...");const{mnemonic:i}=await t.initializeNewWallet();console.log("Wallet created, mnemonic received:",i?"yes":"no");const r=document.getElementById("mnemonic-modal"),s=document.getElementById("mnemonic-words");console.log("Modal element:",r?"found":"NOT FOUND"),console.log("Words element:",s?"found":"NOT FOUND"),r&&s?(s.innerHTML=i.split(" ").map((l,c)=>`<span class="word"><span class="num">${c+1}.</span> ${l}</span>`).join(""),r.classList.remove("hidden"),console.log("Modal should now be visible")):alert(`⚠️ SAVE THESE WORDS:

`+i.split(" ").map((l,c)=>`${c+1}. ${l}`).join(`
`)+`

Click OK after saving.`)}catch(i){console.error("Failed to create wallet:",i),n.disabled=!1,n.textContent="Create New Wallet",alert("Failed to create wallet: "+(i instanceof Error?i.message:String(i)))}}),document.getElementById("import-wallet-landing-btn")?.addEventListener("click",()=>{document.getElementById("import-modal")?.classList.remove("hidden")}),document.getElementById("cancel-import-btn")?.addEventListener("click",()=>{document.getElementById("import-modal")?.classList.add("hidden")}),document.getElementById("confirm-import-btn")?.addEventListener("click",async()=>{const i=document.getElementById("mnemonic-input").value.trim().toLowerCase();if(!i||i.split(/\s+/).length!==12){alert("Please enter a valid 12-word mnemonic.");return}const r=document.getElementById("confirm-import-btn");r.disabled=!0,r.textContent="Importing...";try{await t.restoreWallet(i)}catch(s){console.error("Failed to import wallet:",s),r.disabled=!1,r.textContent="Import",alert("Failed to import wallet. Check your mnemonic.")}}),document.getElementById("confirm-saved-btn")?.addEventListener("click",async()=>{document.getElementById("mnemonic-modal")?.classList.add("hidden");try{await t.startNode()}catch(i){console.error("Failed to connect:",i)}})}function ne(e,t){const a=document.getElementById("network-toggle-btn"),n=document.getElementById("network-dropdown");a?.addEventListener("click",()=>{n?.classList.toggle("hidden")}),document.addEventListener("click",s=>{!a?.contains(s.target)&&!n?.contains(s.target)&&n?.classList.add("hidden")},{once:!0}),document.querySelectorAll(".network-option").forEach(s=>{s.addEventListener("click",async()=>{const l=s.dataset.network;if(l===e.network){n?.classList.add("hidden");return}if(l==="mainnet"&&!confirm(`⚠️ Switching to MAINNET will use REAL FUNDS.

Are you sure?`)){n?.classList.add("hidden");return}n?.classList.add("hidden"),h(`Switching to ${l==="mainnet"?"Mainnet":"Orchard Testnet"}...`);try{await t.switchNetwork(l),h(`Connected to ${l==="mainnet"?"Mainnet":"Orchard Testnet"}`)}catch(c){console.error("Failed to switch network:",c),h("Failed to switch network")}})}),document.getElementById("copy-payment-code")?.addEventListener("click",()=>{e.paymentCode&&(navigator.clipboard.writeText(e.paymentCode),h("Payment code copied!"))}),document.getElementById("copy-quai-address")?.addEventListener("click",()=>{e.quaiAddress&&(navigator.clipboard.writeText(e.quaiAddress),h("Quai address copied!"))}),document.getElementById("copy-user-id")?.addEventListener("click",()=>{e.userId&&(navigator.clipboard.writeText(e.userId),h("Chat ID copied! Share it with friends."))}),document.getElementById("view-seed-btn")?.addEventListener("click",()=>{const s=localStorage.getItem("cinq_mnemonic");if(s){const l=document.getElementById("view-seed-modal"),c=document.getElementById("view-mnemonic-words");l&&c&&(c.innerHTML=s.split(" ").map((u,v)=>`<span class="word"><span class="num">${v+1}.</span> ${u}</span>`).join(""),l.classList.remove("hidden"))}else h("No recovery phrase found")}),document.getElementById("close-seed-modal-btn")?.addEventListener("click",()=>{document.getElementById("view-seed-modal")?.classList.add("hidden")}),document.getElementById("refresh-balance-btn")?.addEventListener("click",async()=>{const s=document.getElementById("refresh-balance-btn");s.disabled=!0,s.textContent="Refreshing...";try{await t.refreshBalance()}finally{s.disabled=!1,s.textContent="Refresh Balance"}}),document.getElementById("disconnect-btn")?.addEventListener("click",async()=>{await t.stopNode()}),t.getConversations(),document.querySelectorAll(".conversation-item").forEach(s=>{s.addEventListener("click",()=>{const l=s.dataset.convId;s.dataset.peerId;const c=e.conversations.find(u=>u.id===l);c&&t.openConversation(c)})}),document.querySelectorAll(".peer-item").forEach(s=>{s.addEventListener("click",()=>{const l=s.dataset.peerId;l&&t.startConversation(l)})}),document.getElementById("back-to-list-btn")?.addEventListener("click",()=>{t.backToConversationList()});const i=async()=>{const s=document.getElementById("message-input"),l=s.value.trim();if(!l||!e.currentConversation)return;const c=e.currentConversation.peer_id;s.value="",s.focus(),await t.sendMessage(c,l);const u=document.getElementById("messages-container");u&&(u.scrollTop=u.scrollHeight)};document.getElementById("send-msg-btn")?.addEventListener("click",i),document.getElementById("message-input")?.addEventListener("keypress",s=>{s.key==="Enter"&&i()}),document.getElementById("new-chat-btn")?.addEventListener("click",()=>{const s=prompt("Enter Chat ID (e.g., 555-123-4567):");s&&s.trim()&&t.startConversation(s.trim())});const r=document.getElementById("messages-container");r&&(r.scrollTop=r.scrollHeight)}function h(e){const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.classList.add("show"),10),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},3e3)}const o={nodeRunning:!1,peerId:null,peers:[],userId:null,userIdDisplay:null,walletInitialized:!1,paymentCode:null,quaiAddress:null,balance:0n,quaiBalance:0n,hasSavedWallet:!1,network:localStorage.getItem("cinq_network")||"orchard",currentView:"landing",conversations:[],currentConversation:null,messages:[],chatView:"list"};async function ae(){try{const e=await f("get_user_id");return e.success&&e.data?(o.userId=e.data.user_id,o.userIdDisplay=e.data.display,e.data):null}catch(e){return console.error("Failed to get user ID:",e),null}}async function oe(e){try{const t=await f("lookup_user_id",{userId:e});return t.success?t.data:(console.error("Lookup failed:",t.error),null)}catch(t){return console.error("Failed to lookup user ID:",t),null}}async function $(){try{const e=await f("start_node");if(!e.success||!e.data)throw new Error(e.error||"Failed to start node");o.nodeRunning=!0,o.peerId=e.data,await ae(),p(),console.log("Node started:",e.data),console.log("User ID:",o.userIdDisplay)}catch(e){throw console.error("Failed to start node:",e),e}}async function se(){try{const e=await f("stop_node");e.success||console.warn("Stop node warning:",e.error),o.nodeRunning=!1,o.peerId=null,o.userId=null,o.userIdDisplay=null,o.peers=[],p(),console.log("Node stopped")}catch(e){throw console.error("Failed to stop node:",e),e}}async function ie(){try{const e=await f("get_peers");return e.success&&e.data?(o.peers=e.data.map(t=>t.peer_id),p(),o.peers):[]}catch(e){return console.error("Failed to get peers:",e),[]}}async function P(){try{const e=await f("get_conversations");return e.success&&e.data?(o.conversations=e.data,e.data):[]}catch(e){return console.error("Failed to get conversations:",e),[]}}async function T(e){try{const t=await f("get_messages",{conversationId:e,limit:100});return t.success&&t.data?(o.messages=t.data.reverse(),o.messages):[]}catch(t){return console.error("Failed to get messages:",t),[]}}async function re(e,t){try{const a=await f("send_message",{peerId:e,content:t});return a.success&&a.data?(o.messages.push(a.data),await P(),p(),a.data):(console.error("Send message failed:",a.error),null)}catch(a){return console.error("Failed to send message:",a),null}}async function le(e){let t=e,a=e;const n=e.replace(/-/g,"").replace(/\s/g,"");if(n.length===10&&/^\d+$/.test(n)){const i=await oe(n);if(i)t=i,a=`${n.slice(0,3)}-${n.slice(3,6)}-${n.slice(6)}`;else{console.error("User ID not found:",n),alert(`User ID ${a} not found. They need to be online first.`);return}}else t.length>12&&(a=t.slice(0,12)+"...");await ce(t,a)}async function ce(e,t){const a=t||(e.length>12?e.slice(0,12)+"...":e);try{let n=o.conversations.find(i=>i.peer_id===e);n||(n={id:"new-"+e,peer_id:e,display_name:a,last_message:null,last_message_at:null,unread_count:0},o.conversations.unshift(n)),o.currentConversation=n,o.messages=[],o.chatView="conversation",n.id.startsWith("new-")||await T(n.id),p()}catch(n){console.error("Failed to start conversation:",n)}}function de(e){o.currentConversation=e,o.chatView="conversation",T(e.id).then(()=>p())}function ue(){o.currentConversation=null,o.chatView="list",o.messages=[],p()}async function me(){const e=await R({network:o.network});return o.walletInitialized=!0,o.hasSavedWallet=!0,o.paymentCode=e.paymentCode,o.quaiAddress=e.quaiAddress,localStorage.setItem("cinq_mnemonic",e.mnemonic),localStorage.setItem("cinq_wallet",await S()),localStorage.setItem("cinq_network",o.network),H(t=>{console.log("Received payment:",I(t.amount)),b(),M(`Received ${I(t.amount)}`)}),E(),e}async function pe(e){const{paymentCode:t,quaiAddress:a}=await B(e,{network:o.network});o.walletInitialized=!0,o.hasSavedWallet=!0,o.paymentCode=t,o.quaiAddress=a,localStorage.setItem("cinq_mnemonic",e),localStorage.setItem("cinq_wallet",await S()),localStorage.setItem("cinq_network",o.network),await b(),E(),p()}async function ve(e){if(e===o.network)return;const t=localStorage.getItem("cinq_mnemonic");if(!t){console.error("No mnemonic found");return}Q(),o.network=e,localStorage.setItem("cinq_network",e);try{const{paymentCode:a,quaiAddress:n}=await B(t,{network:e});o.paymentCode=a,o.quaiAddress=n,o.balance=0n,localStorage.setItem("cinq_wallet",await S()),await b(),E(),M(`Switched to ${e==="mainnet"?"Mainnet":"Orchard Testnet"}`)}catch(a){console.error("Failed to switch network:",a),o.network=e==="mainnet"?"orchard":"mainnet",localStorage.setItem("cinq_network",o.network)}p()}function we(){localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic"),o.walletInitialized=!1,o.hasSavedWallet=!1,o.paymentCode=null,o.quaiAddress=null,o.balance=0n,p()}async function b(){if(o.walletInitialized)try{const[e,t]=await Promise.all([q(),z()]);o.balance=e.balance,o.quaiBalance=t,p()}catch(e){console.error("Failed to refresh balance:",e)}}function p(){J(o,{startNode:$,stopNode:se,initializeNewWallet:me,restoreWallet:pe,refreshBalance:b,sendPayment:x,formatQi:I,connectWithSavedWallet:async()=>{await $()},clearSavedWallet:we,switchNetwork:ve,getConversations:P,openConversation:de,backToConversationList:ue,sendMessage:re,startConversation:le})}function M(e){console.log("Notification:",e);const t=document.createElement("div");t.className="notification",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),5e3)}async function ge(){console.log("cinQ initializing...");const e=localStorage.getItem("cinq_wallet"),t=localStorage.getItem("cinq_mnemonic");if(o.hasSavedWallet=!!(e&&t),e&&t)try{await j(e,t,{network:o.network}),o.walletInitialized=!0,o.paymentCode=U(),o.quaiAddress=V(),b().catch(a=>console.warn("Balance refresh failed:",a)),E(),console.log("Restored wallet:",o.paymentCode?.slice(0,20)+"...")}catch(a){console.error("Failed to restore wallet:",a),localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic"),o.hasSavedWallet=!1}p(),setInterval(()=>{o.nodeRunning&&ie()},1e4)}document.addEventListener("DOMContentLoaded",ge);
