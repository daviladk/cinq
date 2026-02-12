const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-DoSyO7I7.js","assets/_commonjsHelpers-C4iS2aBk.js","assets/index-CSCCMl66.js"])))=>i.map(i=>d[i]);
(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const c of i)if(c.type==="childList")for(const s of c.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function a(i){const c={};return i.integrity&&(c.integrity=i.integrity),i.referrerPolicy&&(c.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?c.credentials="include":i.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function n(i){if(i.ep)return;i.ep=!0;const c=a(i);fetch(i.href,c)}})();async function f(e,t={},a){return window.__TAURI_INTERNALS__.invoke(e,t,a)}const R="modulepreload",z=function(e){return"/"+e},N={},y=function(t,a,n){let i=Promise.resolve();if(a&&a.length>0){document.getElementsByTagName("link");const s=document.querySelector("meta[property=csp-nonce]"),l=s?.nonce||s?.getAttribute("nonce");i=Promise.allSettled(a.map(r=>{if(r=z(r),r in N)return;N[r]=!0;const d=r.endsWith(".css"),v=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${r}"]${v}`))return;const u=document.createElement("link");if(u.rel=d?"stylesheet":R,d||(u.as="script"),u.crossOrigin="",u.href=r,l&&u.setAttribute("nonce",l),document.head.appendChild(u),d)return new Promise((m,w)=>{u.addEventListener("load",m),u.addEventListener("error",()=>w(new Error(`Unable to preload CSS for ${r}`)))})}))}function c(s){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=s,window.dispatchEvent(l),!l.defaultPrevented)throw s}return i.then(s=>{for(const l of s||[])l.status==="rejected"&&c(l.reason);return t().catch(c)})},S={network:"orchard",pollingInterval:3e4};let g={initialized:!1,paymentCode:null,quaiAddress:null,balance:0n,utxoCount:0,zone:"Cyprus1"},A=[],F=[];async function x(e={}){const t={...S,...e};try{const{QiAgentWallet:a}=await y(async()=>{const{QiAgentWallet:u}=await import("./index-DoSyO7I7.js").then(m=>m.i);return{QiAgentWallet:u}},__vite__mapDeps([0,1])),{Mnemonic:n,HDNodeWallet:i}=await y(async()=>{const{Mnemonic:u,HDNodeWallet:m}=await import("./index-CSCCMl66.js");return{Mnemonic:u,HDNodeWallet:m}},__vite__mapDeps([2,1])),{wallet:c,mnemonic:s}=await a.create({network:t.network,pollingInterval:t.pollingInterval}),l=c.getPaymentCode(),r=n.fromPhrase(s),v=i.fromMnemonic(r,"m/44'/994'/0'/0/0").address;return g={initialized:!0,paymentCode:l,quaiAddress:v,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=c,window.__cinqMnemonic=s,c.onPaymentReceived(u=>{const m={amount:u.amount,senderPaymentCode:u.senderPaymentCode,txHash:u.txHash||"",timestamp:Date.now()};A.forEach(w=>w(m))}),c.onSenderDiscovered(u=>{F.forEach(m=>m(u))}),{mnemonic:s,paymentCode:l,quaiAddress:v}}catch(a){throw console.error("Failed to create wallet:",a),new Error(`Wallet creation failed: ${a}`)}}async function M(e,t={}){const a={...S,...t};try{const{QiAgentWallet:n}=await y(async()=>{const{QiAgentWallet:m}=await import("./index-DoSyO7I7.js").then(w=>w.i);return{QiAgentWallet:m}},__vite__mapDeps([0,1])),{Mnemonic:i,HDNodeWallet:c}=await y(async()=>{const{Mnemonic:m,HDNodeWallet:w}=await import("./index-CSCCMl66.js");return{Mnemonic:m,HDNodeWallet:w}},__vite__mapDeps([2,1])),s=await n.fromMnemonic(e,{network:a.network,pollingInterval:a.pollingInterval}),l=s.getPaymentCode(),r=i.fromPhrase(e),v=c.fromMnemonic(r,"m/44'/994'/0'/0/0").address;await s.sync();const u=await s.getBalance();return g={initialized:!0,paymentCode:l,quaiAddress:v,balance:u.balance,utxoCount:u.utxoCount,zone:"Cyprus1"},window.__cinqWallet=s,window.__cinqMnemonic=e,{paymentCode:l,quaiAddress:v}}catch(n){throw console.error("Failed to import wallet:",n),new Error(`Wallet import failed: ${n}`)}}async function $(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=await e.getBalance();return g.balance=t.balance,g.utxoCount=t.utxoCount,t}async function Q(){try{const{JsonRpcProvider:e}=await y(async()=>{const{JsonRpcProvider:s}=await import("./index-CSCCMl66.js");return{JsonRpcProvider:s}},__vite__mapDeps([2,1])),t=g.quaiAddress;if(!t)return 0n;const n=(localStorage.getItem("cinq_network")||"orchard")==="mainnet"?"https://rpc.quai.network":"https://rpc.orchard.quai.network";return await new e(n).getBalance(t)}catch(e){return console.error("Failed to get Quai balance:",e),0n}}async function U(e,t){const a=window.__cinqWallet;if(!a)throw new Error("Wallet not initialized");try{const n=await a.send(e,t);return await $(),{qiTxHash:n.qiTxHash,notifyTxHash:n.notifyTxHash,amount:t,recipient:e}}catch(n){throw console.error("Payment failed:",n),new Error(`Payment failed: ${n}`)}}function E(e){const t=window.__cinqWallet;if(!t)throw new Error("Wallet not initialized");t.startPolling(e)}function H(){const e=window.__cinqWallet;e&&e.stopPolling()}function V(e){A.push(e)}function j(){return g.paymentCode}function Y(){return g.quaiAddress}async function q(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=e.serialize();return JSON.stringify(t)}async function G(e,t,a={}){const n={...S,...a};try{const{QiAgentWallet:i}=await y(async()=>{const{QiAgentWallet:w}=await import("./index-DoSyO7I7.js").then(C=>C.i);return{QiAgentWallet:w}},__vite__mapDeps([0,1])),{Mnemonic:c,HDNodeWallet:s}=await y(async()=>{const{Mnemonic:w,HDNodeWallet:C}=await import("./index-CSCCMl66.js");return{Mnemonic:w,HDNodeWallet:C}},__vite__mapDeps([2,1])),l=JSON.parse(e),r=await i.deserialize(l,t,{network:n.network,pollingInterval:n.pollingInterval}),d=r.getPaymentCode(),v=c.fromPhrase(t),m=s.fromMnemonic(v,"m/44'/994'/0'/0/0").address;return g={initialized:!0,paymentCode:d,quaiAddress:m,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=r,window.__cinqMnemonic=t,await r.sync(),await $(),d}catch(i){throw console.error("Failed to deserialize wallet:",i),new Error(`Wallet restore failed: ${i}`)}}function I(e){const t=e.toString().padStart(19,"0"),a=t.slice(0,-18)||"0",n=t.slice(-18,-14);return`${a}.${n} Qi`}function J(e){return e===0n?"0.00 QUAI":(Number(e)/1e18).toFixed(4)+" QUAI"}function K(e,t){const a=document.getElementById("app");a&&(e.walletInitialized&&e.nodeRunning?(a.innerHTML=X(e),ue(e,t)):(e.walletInitialized&&e.nodeRunning,a.innerHTML=L(e),W(e,t)))}function L(e,t){const a=e.hasSavedWallet;return a&&e.walletInitialized?`
      <div class="landing">
        <div class="landing-content">
          <h1 class="logo">CIN<span>Q</span></h1>
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
          <h1 class="logo">CIN<span>Q</span></h1>
          <p class="tagline">Loading your wallet...</p>
        </div>
      </div>
    `:`
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
    `}function X(e,t){const a=e.peerId?`${e.peerId.slice(0,8)}...`:"Not connected",n=e.network==="mainnet";return`
    <div class="main-app">
      <header class="header">
        <div class="logo-small">CIN<span>Q</span></div>
        <div class="header-right">
          <div class="network-badge ${n?"mainnet":"testnet"}">
            ${n?"🔴 MAINNET":"🧪 TESTNET"}
          </div>
          <div class="status">
            <span class="status-dot ${e.nodeRunning?"online":"offline"}"></span>
            <span>${e.nodeRunning?"Connected":"Offline"}</span>
          </div>
        </div>
      </header>
      
      <div class="dashboard-layout">
        <!-- Left Gauge Panel -->
        <div class="gauge-panel">
          ${ae(e,n)}
          ${Z()}
          ${ee()}
          ${te(e)}
          ${ne()}
          ${se(e,a)}
        </div>
        
        <!-- Main Content - Messages -->
        <div class="main-content">
          <div class="card chat-card">
            <div class="chat-card-header">
              <h3>💬 Messages</h3>
              <div class="chat-id-badge">
                <span>Your ID: </span>
                <code id="user-id-display">${e.userIdDisplay||"Loading..."}</code>
                <button id="copy-user-id" class="btn-icon" title="Copy Chat ID">📋</button>
              </div>
            </div>
            ${ie(e)}
          </div>
        </div>
      </div>
      
      ${oe(e)}
    </div>
  `}function _(e,t){const a=e>80?"red":e>50?"yellow":"green";return`
    <div class="status-bar-row">
      <div class="status-bar-label">
        <span class="label-text">${t}</span>
        <span class="label-value">${e}%</span>
      </div>
      <div class="status-bar">
        <div class="status-bar-fill ${a}" style="width: ${e}%"></div>
      </div>
    </div>
  `}function Z(){return`
    <div class="gauge-card">
      <h4>🖥️ System Monitor</h4>
      ${_(12,"CPU")}
      ${_(38,"RAM")}
      ${_(5,"GPU")}
    </div>
  `}function ee(){return`
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
  `}function te(e){return`
    <div class="gauge-card">
      <h4>🌐 DePIN Network</h4>
      <div class="depin-stat">
        <span class="stat-name">Mesh Nodes</span>
        <span class="stat-value online">${e.peers.length+1}</span>
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
  `}function ne(){return`
    <div class="gauge-card">
      <h4>💰 Today's Earnings</h4>
      <div class="earnings-display">
        <div class="earnings-amount">0.0000 Qi</div>
        <div class="earnings-usd">≈ $0.00 USD</div>
      </div>
    </div>
  `}function ae(e,t){return`
    <div class="gauge-card wallet-card">
      <div class="wallet-header-row">
        <h4>💳 Wallet</h4>
        <div class="network-toggle-wrapper">
          <button id="network-toggle-btn" class="btn-network-toggle ${t?"mainnet":"testnet"}">
            ${t?"🔴 Mainnet":"🧪 Testnet"}
            <span class="toggle-arrow">▼</span>
          </button>
          <div id="network-dropdown" class="network-dropdown hidden">
            <button class="network-option ${t?"":"active"}" data-network="orchard">
              🧪 Orchard (Testnet)
            </button>
            <button class="network-option ${t?"active":""}" data-network="mainnet">
              🔴 Mainnet
            </button>
          </div>
        </div>
      </div>
      <div class="wallet-balances">
        <div class="balance-row">
          <span class="balance-icon">⚡</span>
          <span class="balance-label">Qi</span>
          <span class="balance-amount qi">${I(e.balance)}</span>
        </div>
        <div class="balance-row">
          <span class="balance-icon">💎</span>
          <span class="balance-label">Quai</span>
          <span class="balance-amount quai">${J(e.quaiBalance)}</span>
        </div>
      </div>
      <div class="wallet-actions">
        <button id="refresh-balance-btn" class="btn-mini" title="Refresh">↻</button>
        <button id="view-seed-btn" class="btn-mini" title="Recovery Phrase">🔑</button>
      </div>
    </div>
  `}function se(e,t){return`
    <div class="gauge-card">
      <h4>⛓️ Quai Network</h4>
      <div class="network-info-item">
        <span class="info-label">Chain</span>
        <span class="info-value">${e.network==="mainnet"?"Colosseum":"Orchard"}</span>
      </div>
      <div class="network-info-item">
        <span class="info-label">Mesh ID</span>
        <span class="info-value">${t}</span>
      </div>
      <div class="network-info-item">
        <span class="info-label">Uptime</span>
        <span class="info-value" id="uptime-display">0:00</span>
      </div>
    </div>
  `}function oe(e,t){const a=e.paymentCode?`${e.paymentCode.slice(0,12)}...`:"N/A",n=e.quaiAddress?`${e.quaiAddress.slice(0,10)}...${e.quaiAddress.slice(-6)}`:"N/A";return`
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
            <code id="payment-code" title="${e.paymentCode||""}">${a}</code>
            <button id="copy-payment-code" class="btn-icon" title="Copy Payment Code">📋</button>
          </div>
          <div class="address-row">
            <label>Quai Address:</label>
            <code id="quai-address" title="${e.quaiAddress||""}">${n}</code>
            <button id="copy-quai-address" class="btn-icon" title="Copy Quai Address">📋</button>
          </div>
        </div>
        <div class="modal-buttons">
          <button id="close-wallet-modal-btn" class="btn-primary">Close</button>
        </div>
      </div>
    </div>
  `}function ie(e){return e.chatView==="conversation"&&e.currentConversation?le(e):re(e)}function re(e){const t=e.conversations,a=e.peers;return`
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
                <div class="conv-name">${k(n.display_name)}</div>
                <div class="conv-preview">${k(n.last_message||"No messages yet")}</div>
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
  `}function le(e){const t=e.currentConversation,a=e.messages;return`
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
            <div class="message-content">${k(n.content)}</div>
            <div class="message-meta">
              <span class="message-time">${ce(n.timestamp)}</span>
              ${n.is_outgoing?`<span class="message-status">${de(n.status)}</span>`:""}
            </div>
          </div>
        `).join("")}
      </div>
      
      <div class="message-input-container">
        <input type="text" id="message-input" placeholder="Type a message..." autocomplete="off">
        <button id="send-msg-btn" class="btn-send">Send</button>
      </div>
    </div>
  `}function k(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function ce(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function de(e){switch(e){case"Pending":return"⏳";case"Sent":return"✓";case"Delivered":return"✓✓";case"Read":return"✓✓";case"Failed":return"✗";default:return""}}function W(e,t){console.log("attachLandingHandlers called, hasSavedWallet:",e.hasSavedWallet,"walletInitialized:",e.walletInitialized);const a=document.getElementById("connect-btn");console.log("connect-btn element:",a?"FOUND":"NOT FOUND"),a?.addEventListener("click",async()=>{const n=document.getElementById("connect-btn");if(!n){console.error("Connect button not found");return}console.log("Connect button clicked, walletInitialized:",e.walletInitialized),n.disabled=!0,n.textContent="Connecting...";try{console.log("Calling startNode..."),await t.startNode(),console.log("startNode completed successfully")}catch(i){console.error("Failed to connect:",i),n.disabled=!1,n.textContent="Connect to Mesh",alert("Failed to connect: "+(i instanceof Error?i.message:String(i)))}}),document.getElementById("use-different-wallet-btn")?.addEventListener("click",()=>{t.clearSavedWallet()}),document.getElementById("create-wallet-landing-btn")?.addEventListener("click",async()=>{const n=document.getElementById("create-wallet-landing-btn");n.disabled=!0,n.textContent="Creating...";try{console.log("Creating new wallet...");const{mnemonic:i}=await t.initializeNewWallet();console.log("Wallet created, mnemonic received:",i?"yes":"no");const c=document.getElementById("mnemonic-modal"),s=document.getElementById("mnemonic-words");console.log("Modal element:",c?"found":"NOT FOUND"),console.log("Words element:",s?"found":"NOT FOUND"),c&&s?(s.innerHTML=i.split(" ").map((l,r)=>`<span class="word"><span class="num">${r+1}.</span> ${l}</span>`).join(""),c.classList.remove("hidden"),console.log("Modal should now be visible")):alert(`⚠️ SAVE THESE WORDS:

`+i.split(" ").map((l,r)=>`${r+1}. ${l}`).join(`
`)+`

Click OK after saving.`)}catch(i){console.error("Failed to create wallet:",i),n.disabled=!1,n.textContent="Create New Wallet",alert("Failed to create wallet: "+(i instanceof Error?i.message:String(i)))}}),document.getElementById("import-wallet-landing-btn")?.addEventListener("click",()=>{document.getElementById("import-modal")?.classList.remove("hidden")}),document.getElementById("cancel-import-btn")?.addEventListener("click",()=>{document.getElementById("import-modal")?.classList.add("hidden")}),document.getElementById("confirm-import-btn")?.addEventListener("click",async()=>{const i=document.getElementById("mnemonic-input").value.trim().toLowerCase();if(!i||i.split(/\s+/).length!==12){alert("Please enter a valid 12-word mnemonic.");return}const c=document.getElementById("confirm-import-btn");c.disabled=!0,c.textContent="Importing...";try{await t.restoreWallet(i)}catch(s){console.error("Failed to import wallet:",s),c.disabled=!1,c.textContent="Import",alert("Failed to import wallet. Check your mnemonic.")}}),document.getElementById("confirm-saved-btn")?.addEventListener("click",async()=>{document.getElementById("mnemonic-modal")?.classList.add("hidden");try{await t.startNode()}catch(i){console.error("Failed to connect:",i)}})}let B=!1;function ue(e,t){document.body.dataset.network=e.network;const a=document.getElementById("network-toggle-btn"),n=document.getElementById("network-dropdown");a&&(a.onclick=s=>{s.preventDefault(),s.stopPropagation(),console.log("Network toggle clicked!"),n?.classList.toggle("hidden")}),document.querySelectorAll(".network-option").forEach(s=>{s.onclick=async l=>{l.preventDefault(),l.stopPropagation();const r=s.dataset.network;if(console.log("Network option clicked:",r),r===e.network){n?.classList.add("hidden");return}if(r==="mainnet"&&!confirm(`⚠️ Switching to MAINNET will use REAL FUNDS.

Are you sure?`)){n?.classList.add("hidden");return}n?.classList.add("hidden"),h(`Switching to ${r==="mainnet"?"Mainnet":"Orchard Testnet"}...`);try{await t.switchNetwork(r),h(`Connected to ${r==="mainnet"?"Mainnet":"Orchard Testnet"}`)}catch(d){console.error("Failed to switch network:",d),h("Failed to switch network")}}}),B||(B=!0,document.addEventListener("click",s=>{const l=s.target,r=document.getElementById("network-dropdown"),d=document.getElementById("network-toggle-btn");r&&!r.contains(l)&&!d?.contains(l)&&r.classList.add("hidden")})),document.getElementById("copy-payment-code")?.addEventListener("click",()=>{e.paymentCode&&(navigator.clipboard.writeText(e.paymentCode),h("Payment code copied!"))}),document.getElementById("copy-quai-address")?.addEventListener("click",()=>{e.quaiAddress&&(navigator.clipboard.writeText(e.quaiAddress),h("Quai address copied!"))}),document.getElementById("copy-user-id")?.addEventListener("click",()=>{e.userId&&(navigator.clipboard.writeText(e.userId),h("Chat ID copied! Share it with friends."))}),document.getElementById("view-seed-btn")?.addEventListener("click",()=>{const s=localStorage.getItem("cinq_mnemonic");if(s){const l=document.getElementById("view-seed-modal"),r=document.getElementById("view-mnemonic-words");l&&r&&(r.innerHTML=s.split(" ").map((d,v)=>`<span class="word"><span class="num">${v+1}.</span> ${d}</span>`).join(""),l.classList.remove("hidden"))}else h("No recovery phrase found")}),document.getElementById("close-seed-modal-btn")?.addEventListener("click",()=>{document.getElementById("view-seed-modal")?.classList.add("hidden")}),document.getElementById("refresh-balance-btn")?.addEventListener("click",async()=>{const s=document.getElementById("refresh-balance-btn");s.disabled=!0,s.textContent="Refreshing...";try{await t.refreshBalance()}finally{s.disabled=!1,s.textContent="Refresh Balance"}}),document.getElementById("disconnect-btn")?.addEventListener("click",async()=>{await t.stopNode()}),t.getConversations(),document.querySelectorAll(".conversation-item").forEach(s=>{s.addEventListener("click",()=>{const l=s.dataset.convId;s.dataset.peerId;const r=e.conversations.find(d=>d.id===l);r&&t.openConversation(r)})}),document.querySelectorAll(".peer-item").forEach(s=>{s.addEventListener("click",()=>{const l=s.dataset.peerId;l&&t.startConversation(l)})}),document.getElementById("back-to-list-btn")?.addEventListener("click",()=>{t.backToConversationList()});const i=async()=>{const s=document.getElementById("message-input"),l=s.value.trim();if(!l||!e.currentConversation)return;const r=e.currentConversation.peer_id;s.value="",s.focus(),await t.sendMessage(r,l);const d=document.getElementById("messages-container");d&&(d.scrollTop=d.scrollHeight)};document.getElementById("send-msg-btn")?.addEventListener("click",i),document.getElementById("message-input")?.addEventListener("keypress",s=>{s.key==="Enter"&&i()}),document.getElementById("new-chat-btn")?.addEventListener("click",()=>{const s=prompt("Enter Chat ID (e.g., 555-123-4567):");s&&s.trim()&&t.startConversation(s.trim())});const c=document.getElementById("messages-container");c&&(c.scrollTop=c.scrollHeight)}function h(e){const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.classList.add("show"),10),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},3e3)}const o={nodeRunning:!1,peerId:null,peers:[],userId:null,userIdDisplay:null,walletInitialized:!1,paymentCode:null,quaiAddress:null,balance:0n,quaiBalance:0n,hasSavedWallet:!1,network:localStorage.getItem("cinq_network")||"orchard",currentView:"landing",conversations:[],currentConversation:null,messages:[],chatView:"list"};async function me(){try{const e=await f("get_user_id");return e.success&&e.data?(o.userId=e.data.user_id,o.userIdDisplay=e.data.display,e.data):null}catch(e){return console.error("Failed to get user ID:",e),null}}async function pe(e){try{const t=await f("lookup_user_id",{userId:e});return t.success?t.data:(console.error("Lookup failed:",t.error),null)}catch(t){return console.error("Failed to lookup user ID:",t),null}}async function P(){try{const e=await f("start_node");if(!e.success||!e.data)throw new Error(e.error||"Failed to start node");o.nodeRunning=!0,o.peerId=e.data,await me(),p(),console.log("Node started:",e.data),console.log("User ID:",o.userIdDisplay)}catch(e){throw console.error("Failed to start node:",e),e}}async function ve(){try{const e=await f("stop_node");e.success||console.warn("Stop node warning:",e.error),o.nodeRunning=!1,o.peerId=null,o.userId=null,o.userIdDisplay=null,o.peers=[],p(),console.log("Node stopped")}catch(e){throw console.error("Failed to stop node:",e),e}}async function we(){try{const e=await f("get_peers");return e.success&&e.data?(o.peers=e.data.map(t=>t.peer_id),p(),o.peers):[]}catch(e){return console.error("Failed to get peers:",e),[]}}async function T(){try{const e=await f("get_conversations");return e.success&&e.data?(o.conversations=e.data,e.data):[]}catch(e){return console.error("Failed to get conversations:",e),[]}}async function D(e){try{const t=await f("get_messages",{conversationId:e,limit:100});return t.success&&t.data?(o.messages=t.data.reverse(),o.messages):[]}catch(t){return console.error("Failed to get messages:",t),[]}}async function ge(e,t){try{const a=await f("send_message",{peerId:e,content:t});return a.success&&a.data?(o.messages.push(a.data),await T(),p(),a.data):(console.error("Send message failed:",a.error),null)}catch(a){return console.error("Failed to send message:",a),null}}async function fe(e){let t=e,a=e;const n=e.replace(/-/g,"").replace(/\s/g,"");if(n.length===10&&/^\d+$/.test(n)){const i=await pe(n);if(i)t=i,a=`${n.slice(0,3)}-${n.slice(3,6)}-${n.slice(6)}`;else{console.error("User ID not found:",n),alert(`User ID ${a} not found. They need to be online first.`);return}}else t.length>12&&(a=t.slice(0,12)+"...");await he(t,a)}async function he(e,t){const a=t||(e.length>12?e.slice(0,12)+"...":e);try{let n=o.conversations.find(i=>i.peer_id===e);n||(n={id:"new-"+e,peer_id:e,display_name:a,last_message:null,last_message_at:null,unread_count:0},o.conversations.unshift(n)),o.currentConversation=n,o.messages=[],o.chatView="conversation",n.id.startsWith("new-")||await D(n.id),p()}catch(n){console.error("Failed to start conversation:",n)}}function ye(e){o.currentConversation=e,o.chatView="conversation",D(e.id).then(()=>p())}function be(){o.currentConversation=null,o.chatView="list",o.messages=[],p()}async function Ie(){const e=await x({network:o.network});return o.walletInitialized=!0,o.hasSavedWallet=!0,o.paymentCode=e.paymentCode,o.quaiAddress=e.quaiAddress,localStorage.setItem("cinq_mnemonic",e.mnemonic),localStorage.setItem("cinq_wallet",await q()),localStorage.setItem("cinq_network",o.network),V(t=>{console.log("Received payment:",I(t.amount)),b(),O(`Received ${I(t.amount)}`)}),E(),e}async function Ee(e){const{paymentCode:t,quaiAddress:a}=await M(e,{network:o.network});o.walletInitialized=!0,o.hasSavedWallet=!0,o.paymentCode=t,o.quaiAddress=a,localStorage.setItem("cinq_mnemonic",e),localStorage.setItem("cinq_wallet",await q()),localStorage.setItem("cinq_network",o.network),await b(),E(),p()}async function Ce(e){if(e===o.network)return;const t=localStorage.getItem("cinq_mnemonic");if(!t){console.error("No mnemonic found");return}H(),o.network=e,localStorage.setItem("cinq_network",e);try{const{paymentCode:a,quaiAddress:n}=await M(t,{network:e});o.paymentCode=a,o.quaiAddress=n,o.balance=0n,localStorage.setItem("cinq_wallet",await q()),await b(),E(),O(`Switched to ${e==="mainnet"?"Mainnet":"Orchard Testnet"}`)}catch(a){console.error("Failed to switch network:",a),o.network=e==="mainnet"?"orchard":"mainnet",localStorage.setItem("cinq_network",o.network)}p()}function _e(){localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic"),o.walletInitialized=!1,o.hasSavedWallet=!1,o.paymentCode=null,o.quaiAddress=null,o.balance=0n,p()}async function b(){if(o.walletInitialized)try{const[e,t]=await Promise.all([$(),Q()]);o.balance=e.balance,o.quaiBalance=t,p()}catch(e){console.error("Failed to refresh balance:",e)}}function p(){K(o,{startNode:P,stopNode:ve,initializeNewWallet:Ie,restoreWallet:Ee,refreshBalance:b,sendPayment:U,formatQi:I,connectWithSavedWallet:async()=>{await P()},clearSavedWallet:_e,switchNetwork:Ce,getConversations:T,openConversation:ye,backToConversationList:be,sendMessage:ge,startConversation:fe})}function O(e){console.log("Notification:",e);const t=document.createElement("div");t.className="notification",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),5e3)}async function ke(){console.log("cinQ initializing...");const e=localStorage.getItem("cinq_wallet"),t=localStorage.getItem("cinq_mnemonic");if(o.hasSavedWallet=!!(e&&t),e&&t)try{await G(e,t,{network:o.network}),o.walletInitialized=!0,o.paymentCode=j(),o.quaiAddress=Y(),b().catch(a=>console.warn("Balance refresh failed:",a)),E(),console.log("Restored wallet:",o.paymentCode?.slice(0,20)+"...")}catch(a){console.error("Failed to restore wallet:",a),localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic"),o.hasSavedWallet=!1}p(),setInterval(()=>{o.nodeRunning&&we()},1e4)}document.addEventListener("DOMContentLoaded",ke);
