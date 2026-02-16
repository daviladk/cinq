const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-DoSyO7I7.js","assets/_commonjsHelpers-C4iS2aBk.js","assets/index-CSCCMl66.js"])))=>i.map(i=>d[i]);
(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const d of r)if(d.type==="childList")for(const u of d.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&a(u)}).observe(document,{childList:!0,subtree:!0});function n(r){const d={};return r.integrity&&(d.integrity=r.integrity),r.referrerPolicy&&(d.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?d.credentials="include":r.crossOrigin==="anonymous"?d.credentials="omit":d.credentials="same-origin",d}function a(r){if(r.ep)return;r.ep=!0;const d=n(r);fetch(r.href,d)}})();async function g(e,t={},n){return window.__TAURI_INTERNALS__.invoke(e,t,n)}const F="modulepreload",R=function(e){return"/"+e},B={},b=function(t,n,a){let r=Promise.resolve();if(n&&n.length>0){document.getElementsByTagName("link");const u=document.querySelector("meta[property=csp-nonce]"),p=u?.nonce||u?.getAttribute("nonce");r=Promise.allSettled(n.map(o=>{if(o=R(o),o in B)return;B[o]=!0;const l=o.endsWith(".css"),i=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${o}"]${i}`))return;const c=document.createElement("link");if(c.rel=l?"stylesheet":F,l||(c.as="script"),c.crossOrigin="",c.href=o,p&&c.setAttribute("nonce",p),document.head.appendChild(c),l)return new Promise((v,h)=>{c.addEventListener("load",v),c.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${o}`)))})}))}function d(u){const p=new Event("vite:preloadError",{cancelable:!0});if(p.payload=u,window.dispatchEvent(p),!p.defaultPrevented)throw u}return r.then(u=>{for(const p of u||[])p.status==="rejected"&&d(p.reason);return t().catch(d)})},L={network:"orchard",pollingInterval:3e4};let f={initialized:!1,paymentCode:null,quaiAddress:null,balance:0n,utxoCount:0,zone:"Cyprus1"},M=[],O=[];async function H(e={}){const t={...L,...e};try{const{QiAgentWallet:n}=await b(async()=>{const{QiAgentWallet:c}=await import("./index-DoSyO7I7.js").then(v=>v.i);return{QiAgentWallet:c}},__vite__mapDeps([0,1])),{Mnemonic:a,HDNodeWallet:r}=await b(async()=>{const{Mnemonic:c,HDNodeWallet:v}=await import("./index-CSCCMl66.js");return{Mnemonic:c,HDNodeWallet:v}},__vite__mapDeps([2,1])),{wallet:d,mnemonic:u}=await n.create({network:t.network,pollingInterval:t.pollingInterval}),p=d.getPaymentCode(),o=a.fromPhrase(u),i=r.fromMnemonic(o,"m/44'/994'/0'/0/0").address;return f={initialized:!0,paymentCode:p,quaiAddress:i,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=d,window.__cinqMnemonic=u,d.onPaymentReceived(c=>{const v={amount:c.amount,senderPaymentCode:c.senderPaymentCode,txHash:c.txHash||"",timestamp:Date.now()};M.forEach(h=>h(v))}),d.onSenderDiscovered(c=>{O.forEach(v=>v(c))}),{mnemonic:u,paymentCode:p,quaiAddress:i}}catch(n){throw console.error("Failed to create wallet:",n),new Error(`Wallet creation failed: ${n}`)}}async function D(e,t={}){const n={...L,...t};try{const{QiAgentWallet:a}=await b(async()=>{const{QiAgentWallet:v}=await import("./index-DoSyO7I7.js").then(h=>h.i);return{QiAgentWallet:v}},__vite__mapDeps([0,1])),{Mnemonic:r,HDNodeWallet:d}=await b(async()=>{const{Mnemonic:v,HDNodeWallet:h}=await import("./index-CSCCMl66.js");return{Mnemonic:v,HDNodeWallet:h}},__vite__mapDeps([2,1])),u=await a.fromMnemonic(e,{network:n.network,pollingInterval:n.pollingInterval}),p=u.getPaymentCode(),o=r.fromPhrase(e),i=d.fromMnemonic(o,"m/44'/994'/0'/0/0").address;await u.sync();const c=await u.getBalance();return f={initialized:!0,paymentCode:p,quaiAddress:i,balance:c.balance,utxoCount:c.utxoCount,zone:"Cyprus1"},window.__cinqWallet=u,window.__cinqMnemonic=e,{paymentCode:p,quaiAddress:i}}catch(a){throw console.error("Failed to import wallet:",a),new Error(`Wallet import failed: ${a}`)}}async function S(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=await e.getBalance();return f.balance=t.balance,f.utxoCount=t.utxoCount,t}async function U(){try{const{JsonRpcProvider:e}=await b(async()=>{const{JsonRpcProvider:u}=await import("./index-CSCCMl66.js");return{JsonRpcProvider:u}},__vite__mapDeps([2,1])),t=f.quaiAddress;if(!t)return 0n;const a=(localStorage.getItem("cinq_network")||"orchard")==="mainnet"?"https://rpc.quai.network":"https://rpc.orchard.quai.network";return await new e(a).getBalance(t)}catch(e){return console.error("Failed to get Quai balance:",e),0n}}async function j(e,t){const n=window.__cinqWallet;if(!n)throw new Error("Wallet not initialized");try{const a=await n.send(e,t);return await S(),{qiTxHash:a.qiTxHash,notifyTxHash:a.notifyTxHash,amount:t,recipient:e}}catch(a){throw console.error("Payment failed:",a),new Error(`Payment failed: ${a}`)}}function E(e){const t=window.__cinqWallet;if(!t)throw new Error("Wallet not initialized");t.startPolling(e)}function V(){const e=window.__cinqWallet;e&&e.stopPolling()}function G(e){M.push(e)}function Y(){return f.paymentCode}function J(){return f.quaiAddress}async function W(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=e.serialize();return JSON.stringify(t)}async function K(e,t,n={}){const a={...L,...n};try{const{QiAgentWallet:r}=await b(async()=>{const{QiAgentWallet:h}=await import("./index-DoSyO7I7.js").then(_=>_.i);return{QiAgentWallet:h}},__vite__mapDeps([0,1])),{Mnemonic:d,HDNodeWallet:u}=await b(async()=>{const{Mnemonic:h,HDNodeWallet:_}=await import("./index-CSCCMl66.js");return{Mnemonic:h,HDNodeWallet:_}},__vite__mapDeps([2,1])),p=JSON.parse(e),o=await r.deserialize(p,t,{network:a.network,pollingInterval:a.pollingInterval}),l=o.getPaymentCode(),i=d.fromPhrase(t),v=u.fromMnemonic(i,"m/44'/994'/0'/0/0").address;return f={initialized:!0,paymentCode:l,quaiAddress:v,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=o,window.__cinqMnemonic=t,await o.sync(),await S(),l}catch(r){throw console.error("Failed to deserialize wallet:",r),new Error(`Wallet restore failed: ${r}`)}}function k(e){const t=e.toString().padStart(19,"0"),n=t.slice(0,-18)||"0",a=t.slice(-18,-14);return`${n}.${a} Qi`}function X(e){return e===0n?"0.00 QUAI":(Number(e)/1e18).toFixed(4)+" QUAI"}function Z(e,t){const n=document.getElementById("app");n&&(e.walletInitialized&&e.nodeRunning?(n.innerHTML=ee(e),we(e,t)):(e.walletInitialized&&e.nodeRunning,n.innerHTML=N(e),T(e,t)))}function N(e,t){const n=e.hasSavedWallet;return n&&e.walletInitialized?`
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
    `:n&&!e.walletInitialized?`
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
    `}function ee(e,t){const n=e.peerId?`${e.peerId.slice(0,8)}...`:"Not connected",a=e.network==="mainnet";return`
    <div class="main-app">
      <header class="header">
        <div class="logo-small">CIN<span>Q</span></div>
        <div class="header-right">
          <div class="network-badge ${a?"mainnet":"testnet"}">
            ${a?"🔴 MAINNET":"🧪 TESTNET"}
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
          ${ie(e,a)}
          ${te(e)}
          ${se()}
          ${oe()}
          ${re(e)}
          ${le(e,n)}
        </div>
        
        <!-- Main Content - Tabbed: Messages / Qora -->
        <div class="main-content">
          <div class="content-tabs">
            <button class="tab-btn active" data-tab="messages">💬 Messages</button>
            <button class="tab-btn" data-tab="qora">🤖 Qora</button>
          </div>
          
          <!-- Messages Tab -->
          <div class="tab-content active" id="tab-messages">
            <div class="card chat-card">
              <div class="chat-card-header">
                <h3>💬 Messages</h3>
                <div class="chat-id-badge">
                  <span>Your ID: </span>
                  <code id="user-id-display">${e.userIdDisplay||"Loading..."}</code>
                  <button id="copy-user-id" class="btn-icon" title="Copy Chat ID">📋</button>
                </div>
              </div>
              ${de(e)}
            </div>
          </div>
          
          <!-- Qora Tab -->
          <div class="tab-content" id="tab-qora">
            ${ne(e)}
          </div>
        </div>
      </div>
      
      ${ce(e)}
    </div>
  `}function te(e){const t=e.qora,n=t.initialized?t.available?"online":"warning":"offline",a=t.initialized?t.available?"Ready":"No Ollama":"Not Init",r=t.tasks.filter(u=>u.status==="Pending").length,d=t.questions.length;return`
    <div class="gauge-card qora-status-card">
      <h4>🤖 Qora Agent</h4>
      <div class="qora-status-row">
        <span class="qora-label">Status</span>
        <span class="qora-value ${n}">${a}</span>
      </div>
      ${t.initialized?`
        <div class="qora-status-row">
          <span class="qora-label">Model</span>
          <span class="qora-value model">${t.model.split(":")[0]||"N/A"}</span>
        </div>
        <div class="qora-status-row">
          <span class="qora-label">Pending</span>
          <span class="qora-value ${r>0?"highlight":""}">${r} tasks</span>
        </div>
        ${d>0?`
          <div class="qora-status-row">
            <span class="qora-label">Questions</span>
            <span class="qora-value urgent">${d} waiting</span>
          </div>
        `:""}
        ${t.isWorking?`
          <div class="qora-working">
            <span class="spinner">⏳</span> Working...
          </div>
        `:""}
      `:`
        <button id="init-qora-btn" class="btn-mini qora-init">Initialize</button>
      `}
    </div>
  `}function ne(e){const t=e.qora;return t.initialized?`
    <div class="card qora-card">
      <div class="qora-header">
        <h3>🤖 Qora</h3>
        <div class="qora-controls">
          ${t.isWorking?`
            <span class="qora-working-badge">⏳ Working...</span>
          `:`
            <button id="qora-work-btn" class="btn-mini" title="Work on next task">▶️ Work</button>
            <button id="qora-work-all-btn" class="btn-mini" title="Grind through all tasks">⚡ Grind</button>
          `}
        </div>
      </div>
      
      <div class="qora-layout">
        <!-- Left: Chat -->
        <div class="qora-chat-section">
          <div class="qora-chat-messages" id="qora-chat-messages">
            ${t.history.length===0?`
              <div class="qora-empty">
                <p>👋 Hey! I'm Qora, your AI dev assistant.</p>
                <p>Ask me anything or add tasks for me to work on!</p>
              </div>
            `:t.history.map(n=>`
              <div class="qora-message ${n.role}">
                <div class="qora-message-content">${y(n.content)}</div>
              </div>
            `).join("")}
          </div>
          <div class="qora-chat-input">
            <input type="text" id="qora-input" placeholder="Ask Qora anything..." autocomplete="off">
            <button id="qora-send-btn" class="btn-send">Send</button>
          </div>
        </div>
        
        <!-- Right: Tasks & Questions -->
        <div class="qora-sidebar">
          <!-- Questions (urgent!) -->
          ${t.questions.length>0?`
            <div class="qora-questions">
              <h4>❓ Qora Needs Your Input</h4>
              ${t.questions.map((n,a)=>`
                <div class="qora-question" data-index="${a}">
                  <div class="question-text">${y(n)}</div>
                  <div class="question-answer">
                    <input type="text" class="question-input" placeholder="Your answer..." data-index="${a}">
                    <button class="btn-answer" data-index="${a}">→</button>
                  </div>
                </div>
              `).join("")}
            </div>
          `:""}
          
          <!-- Tasks -->
          <div class="qora-tasks">
            <div class="qora-tasks-header">
              <h4>📋 Task Queue</h4>
              <button id="add-task-btn" class="btn-icon" title="Add task">➕</button>
            </div>
            ${t.tasks.length===0?`
              <div class="qora-empty-tasks">No tasks yet. Add one!</div>
            `:`
              <div class="task-list">
                ${t.tasks.map(n=>`
                  <div class="task-item ${n.status.toLowerCase()}">
                    <div class="task-status">${ae(n.status)}</div>
                    <div class="task-info">
                      <div class="task-title">${y(n.title)}</div>
                      <div class="task-desc">${y(n.description.slice(0,50))}${n.description.length>50?"...":""}</div>
                    </div>
                  </div>
                `).join("")}
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
  `:`
      <div class="card qora-card">
        <div class="qora-init-panel">
          <h3>🤖 Initialize Qora</h3>
          <p>Connect Qora to your local Ollama instance to enable AI-powered development assistance.</p>
          <div class="qora-init-form">
            <div class="form-group">
              <label>Ollama URL</label>
              <input type="text" id="qora-ollama-url" placeholder="http://localhost:11434" value="http://localhost:11434">
            </div>
            <div class="form-group">
              <label>Model</label>
              <input type="text" id="qora-model" placeholder="deepseek-coder-v2:16b" value="deepseek-coder-v2:16b">
            </div>
            <button id="qora-init-btn" class="btn-primary">Connect to Ollama</button>
          </div>
        </div>
      </div>
    `}function ae(e){switch(e){case"Pending":return"⏳";case"InProgress":return"🔄";case"Completed":return"✅";case"Failed":return"❌";case"Blocked":return"🚫";default:return"•"}}function $(e,t){const n=e>80?"red":e>50?"yellow":"green";return`
    <div class="status-bar-row">
      <div class="status-bar-label">
        <span class="label-text">${t}</span>
        <span class="label-value">${e}%</span>
      </div>
      <div class="status-bar">
        <div class="status-bar-fill ${n}" style="width: ${e}%"></div>
      </div>
    </div>
  `}function se(){return`
    <div class="gauge-card">
      <h4>🖥️ System Monitor</h4>
      ${$(12,"CPU")}
      ${$(38,"RAM")}
      ${$(5,"GPU")}
    </div>
  `}function oe(){return`
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
  `}function re(e){const t=e.peers.length;return`
    <div class="gauge-card">
      <h4>🌐 DePIN Network</h4>
      <div class="depin-stat">
        <span class="stat-name">Peers</span>
        <span class="stat-value ${t>0?"online":"offline"}">${t}</span>
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
  `}function ie(e,t){return`
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
          <span class="balance-amount qi">${k(e.balance)}</span>
        </div>
        <div class="balance-row">
          <span class="balance-icon">💎</span>
          <span class="balance-label">Quai</span>
          <span class="balance-amount quai">${X(e.quaiBalance)}</span>
        </div>
      </div>
      <div class="wallet-actions">
        <button id="refresh-balance-btn" class="btn-mini" title="Refresh">↻</button>
        <button id="view-seed-btn" class="btn-mini" title="Recovery Phrase">🔑</button>
      </div>
    </div>
  `}function le(e,t){return`
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
  `}function ce(e,t){const n=e.paymentCode?`${e.paymentCode.slice(0,12)}...`:"N/A",a=e.quaiAddress?`${e.quaiAddress.slice(0,10)}...${e.quaiAddress.slice(-6)}`:"N/A";return`
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
            <code id="payment-code" title="${e.paymentCode||""}">${n}</code>
            <button id="copy-payment-code" class="btn-icon" title="Copy Payment Code">📋</button>
          </div>
          <div class="address-row">
            <label>Quai Address:</label>
            <code id="quai-address" title="${e.quaiAddress||""}">${a}</code>
            <button id="copy-quai-address" class="btn-icon" title="Copy Quai Address">📋</button>
          </div>
        </div>
        <div class="modal-buttons">
          <button id="close-wallet-modal-btn" class="btn-primary">Close</button>
        </div>
      </div>
    </div>
  `}function de(e){return e.chatView==="conversation"&&e.currentConversation?me(e):ue(e)}function ue(e){const t=e.conversations,n=e.peers;return`
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
          ${t.map(a=>`
            <div class="conversation-item" data-conv-id="${a.id}" data-peer-id="${a.peer_id}">
              <div class="conv-avatar">👤</div>
              <div class="conv-info">
                <div class="conv-name">${y(a.display_name)}</div>
                <div class="conv-preview">${y(a.last_message||"No messages yet")}</div>
              </div>
              ${a.unread_count>0?`<span class="unread-badge">${a.unread_count}</span>`:""}
            </div>
          `).join("")}
        </div>
      `}
      
      ${n.length>0?`
        <div class="online-peers">
          <div class="peers-header">Online Peers (${n.length})</div>
          <div class="peer-list">
            ${n.slice(0,5).map(a=>{const r=a.chat_id?pe(a.chat_id):"Unknown";return`
              <button class="peer-item" data-peer-id="${a.peer_id}">
                <span class="peer-status">●</span>
                <span class="peer-id">${r}</span>
              </button>
            `}).join("")}
          </div>
        </div>
      `:""}
    </div>
  `}function me(e){const t=e.currentConversation,n=e.messages;return`
    <div class="chat-container conversation-view">
      <div class="chat-header">
        <button id="back-to-list-btn" class="btn-icon">←</button>
        <div class="conv-title">
          <span class="conv-name">${t.display_name}</span>
          <span class="conv-status">● Online</span>
        </div>
      </div>
      
      <div class="messages-container" id="messages-container">
        ${n.length===0?`
          <div class="chat-empty">
            <p>No messages yet</p>
            <p class="chat-hint">Send the first message!</p>
          </div>
        `:n.map(a=>`
          <div class="message ${a.is_outgoing?"outgoing":"incoming"}">
            <div class="message-content">${y(a.content)}</div>
            <div class="message-meta">
              <span class="message-time">${ve(a.timestamp)}</span>
              ${a.is_outgoing?`<span class="message-status">${ge(a.status)}</span>`:""}
            </div>
          </div>
        `).join("")}
      </div>
      
      <div class="message-input-container">
        <input type="text" id="message-input" placeholder="Type a message..." autocomplete="off">
        <button id="send-msg-btn" class="btn-send">Send</button>
      </div>
    </div>
  `}function y(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function pe(e){return e.length!==10?e:`${e.slice(0,3)}-${e.slice(3,6)}-${e.slice(6)}`}function ve(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function ge(e){switch(e){case"Pending":return"⏳";case"Sent":return"✓";case"Delivered":return"✓✓";case"Read":return"✓✓";case"Failed":return"✗";default:return""}}function T(e,t){console.log("attachLandingHandlers called, hasSavedWallet:",e.hasSavedWallet,"walletInitialized:",e.walletInitialized);const n=document.getElementById("connect-btn");console.log("connect-btn element:",n?"FOUND":"NOT FOUND"),n?.addEventListener("click",async()=>{const a=document.getElementById("connect-btn");if(!a){console.error("Connect button not found");return}console.log("Connect button clicked, walletInitialized:",e.walletInitialized),a.disabled=!0,a.textContent="Connecting...";try{console.log("Calling startNode..."),await t.startNode(),console.log("startNode completed successfully")}catch(r){console.error("Failed to connect:",r),a.disabled=!1,a.textContent="Connect to Mesh",alert("Failed to connect: "+(r instanceof Error?r.message:String(r)))}}),document.getElementById("use-different-wallet-btn")?.addEventListener("click",async()=>{await t.clearSavedWallet()}),document.getElementById("create-wallet-landing-btn")?.addEventListener("click",async()=>{const a=document.getElementById("create-wallet-landing-btn");a.disabled=!0,a.textContent="Creating...";try{console.log("Creating new wallet...");const{mnemonic:r}=await t.initializeNewWallet();console.log("Wallet created, mnemonic received:",r?"yes":"no");const d=document.getElementById("mnemonic-modal"),u=document.getElementById("mnemonic-words");console.log("Modal element:",d?"found":"NOT FOUND"),console.log("Words element:",u?"found":"NOT FOUND"),d&&u?(u.innerHTML=r.split(" ").map((p,o)=>`<span class="word"><span class="num">${o+1}.</span> ${p}</span>`).join(""),d.classList.remove("hidden"),console.log("Modal should now be visible")):alert(`⚠️ SAVE THESE WORDS:

`+r.split(" ").map((p,o)=>`${o+1}. ${p}`).join(`
`)+`

Click OK after saving.`)}catch(r){console.error("Failed to create wallet:",r),a.disabled=!1,a.textContent="Create New Wallet",alert("Failed to create wallet: "+(r instanceof Error?r.message:String(r)))}}),document.getElementById("import-wallet-landing-btn")?.addEventListener("click",()=>{document.getElementById("import-modal")?.classList.remove("hidden")}),document.getElementById("cancel-import-btn")?.addEventListener("click",()=>{document.getElementById("import-modal")?.classList.add("hidden")}),document.getElementById("confirm-import-btn")?.addEventListener("click",async()=>{const r=document.getElementById("mnemonic-input").value.trim().toLowerCase();if(!r||r.split(/\s+/).length!==12){alert("Please enter a valid 12-word mnemonic.");return}const d=document.getElementById("confirm-import-btn");d.disabled=!0,d.textContent="Importing...";try{await t.restoreWallet(r)}catch(u){console.error("Failed to import wallet:",u),d.disabled=!1,d.textContent="Import",alert("Failed to import wallet. Check your mnemonic.")}}),document.getElementById("confirm-saved-btn")?.addEventListener("click",async()=>{document.getElementById("mnemonic-modal")?.classList.add("hidden");try{await t.startNode()}catch(r){console.error("Failed to connect:",r)}})}let P=!1;function we(e,t){document.body.dataset.network=e.network;const n=document.getElementById("network-toggle-btn"),a=document.getElementById("network-dropdown");n&&(n.onclick=o=>{o.preventDefault(),o.stopPropagation(),console.log("Network toggle clicked!"),a?.classList.toggle("hidden")}),document.querySelectorAll(".network-option").forEach(o=>{o.onclick=async l=>{l.preventDefault(),l.stopPropagation();const i=o.dataset.network;if(console.log("Network option clicked:",i),i===e.network){a?.classList.add("hidden");return}if(i==="mainnet"&&!confirm(`⚠️ Switching to MAINNET will use REAL FUNDS.

Are you sure?`)){a?.classList.add("hidden");return}a?.classList.add("hidden"),w(`Switching to ${i==="mainnet"?"Mainnet":"Orchard Testnet"}...`);try{await t.switchNetwork(i),w(`Connected to ${i==="mainnet"?"Mainnet":"Orchard Testnet"}`)}catch(c){console.error("Failed to switch network:",c),w("Failed to switch network")}}}),P||(P=!0,document.addEventListener("click",o=>{const l=o.target,i=document.getElementById("network-dropdown"),c=document.getElementById("network-toggle-btn");i&&!i.contains(l)&&!c?.contains(l)&&i.classList.add("hidden")})),document.getElementById("copy-payment-code")?.addEventListener("click",()=>{e.paymentCode&&(navigator.clipboard.writeText(e.paymentCode),w("Payment code copied!"))}),document.getElementById("copy-quai-address")?.addEventListener("click",()=>{e.quaiAddress&&(navigator.clipboard.writeText(e.quaiAddress),w("Quai address copied!"))}),document.getElementById("copy-user-id")?.addEventListener("click",()=>{e.userId&&(navigator.clipboard.writeText(e.userId),w("Chat ID copied! Share it with friends."))}),document.getElementById("view-seed-btn")?.addEventListener("click",()=>{const o=localStorage.getItem("cinq_mnemonic");if(o){const l=document.getElementById("view-seed-modal"),i=document.getElementById("view-mnemonic-words");l&&i&&(i.innerHTML=o.split(" ").map((c,v)=>`<span class="word"><span class="num">${v+1}.</span> ${c}</span>`).join(""),l.classList.remove("hidden"))}else w("No recovery phrase found")}),document.getElementById("close-seed-modal-btn")?.addEventListener("click",()=>{document.getElementById("view-seed-modal")?.classList.add("hidden")}),document.getElementById("refresh-balance-btn")?.addEventListener("click",async()=>{const o=document.getElementById("refresh-balance-btn");o.disabled=!0,o.textContent="Refreshing...";try{await t.refreshBalance()}finally{o.disabled=!1,o.textContent="Refresh Balance"}}),document.getElementById("disconnect-btn")?.addEventListener("click",async()=>{await t.stopNode()}),t.getConversations(),document.querySelectorAll(".conversation-item").forEach(o=>{o.addEventListener("click",()=>{const l=o.dataset.convId;o.dataset.peerId;const i=e.conversations.find(c=>c.id===l);i&&t.openConversation(i)})}),document.querySelectorAll(".peer-item").forEach(o=>{o.addEventListener("click",()=>{const l=o.dataset.peerId;l&&t.startConversation(l)})}),document.getElementById("back-to-list-btn")?.addEventListener("click",()=>{t.backToConversationList()});const r=async()=>{const o=document.getElementById("message-input"),l=o.value.trim();if(!l||!e.currentConversation)return;const i=e.currentConversation.peer_id;o.value="",o.focus(),await t.sendMessage(i,l);const c=document.getElementById("messages-container");c&&(c.scrollTop=c.scrollHeight)};document.getElementById("send-msg-btn")?.addEventListener("click",r),document.getElementById("message-input")?.addEventListener("keypress",o=>{o.key==="Enter"&&r()}),document.getElementById("new-chat-btn")?.addEventListener("click",()=>{const o=prompt("Enter Chat ID (e.g., 555-123-4567):");o&&o.trim()&&t.startConversation(o.trim())});const d=document.getElementById("messages-container");d&&(d.scrollTop=d.scrollHeight),document.querySelectorAll(".tab-btn").forEach(o=>{o.addEventListener("click",()=>{const l=o.dataset.tab;l&&(document.querySelectorAll(".tab-btn").forEach(i=>i.classList.remove("active")),o.classList.add("active"),document.querySelectorAll(".tab-content").forEach(i=>i.classList.remove("active")),document.getElementById(`tab-${l}`)?.classList.add("active"))})}),document.getElementById("init-qora-btn")?.addEventListener("click",async()=>{w("Initializing Qora..."),await t.qoraInit(),await t.qoraGetTasks(),await t.qoraGetHistory()}),document.getElementById("qora-init-btn")?.addEventListener("click",async()=>{const o=document.getElementById("qora-ollama-url"),l=document.getElementById("qora-model"),i=document.getElementById("qora-init-btn");i.disabled=!0,i.textContent="Connecting...";try{await t.qoraInit(o.value||void 0,l.value||void 0),await t.qoraGetTasks(),await t.qoraGetHistory(),w("Qora connected!")}catch{w("Failed to connect to Ollama"),i.disabled=!1,i.textContent="Connect to Ollama"}});const u=async()=>{const o=document.getElementById("qora-input"),l=o.value.trim();if(l){o.value="",o.disabled=!0;try{await t.qoraChat(l);const i=document.getElementById("qora-chat-messages");i&&(i.scrollTop=i.scrollHeight)}finally{o.disabled=!1,o.focus()}}};document.getElementById("qora-send-btn")?.addEventListener("click",u),document.getElementById("qora-input")?.addEventListener("keypress",o=>{o.key==="Enter"&&u()}),document.getElementById("qora-work-btn")?.addEventListener("click",async()=>{w("Qora is working..."),await t.qoraWork()&&w("Task completed!")}),document.getElementById("qora-work-all-btn")?.addEventListener("click",async()=>{if(!confirm("Start Qora grinding through all tasks? This may take a while."))return;w("Qora is grinding...");const l=await t.qoraWorkAll();l&&w(l)}),document.getElementById("add-task-btn")?.addEventListener("click",()=>{document.getElementById("add-task-modal")?.classList.remove("hidden")}),document.getElementById("cancel-task-btn")?.addEventListener("click",()=>{document.getElementById("add-task-modal")?.classList.add("hidden")}),document.getElementById("confirm-task-btn")?.addEventListener("click",async()=>{const o=document.getElementById("task-title"),l=document.getElementById("task-description"),i=o.value.trim(),c=l.value.trim();if(!i||!c){w("Please fill in both title and description");return}const v=document.getElementById("confirm-task-btn");v.disabled=!0;try{await t.qoraAddTask(i,c),o.value="",l.value="",document.getElementById("add-task-modal")?.classList.add("hidden"),w("Task added!")}finally{v.disabled=!1}}),document.querySelectorAll(".btn-answer").forEach(o=>{o.addEventListener("click",async()=>{const l=parseInt(o.dataset.index||"0"),c=document.querySelector(`.question-input[data-index="${l}"]`)?.value.trim();if(!c){w("Please enter an answer");return}o.disabled=!0;try{await t.qoraAnswerQuestion(l,c),w("Answer submitted!")}finally{o.disabled=!1}})});const p=document.getElementById("qora-chat-messages");p&&(p.scrollTop=p.scrollHeight)}function w(e){const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.classList.add("show"),10),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},3e3)}const s={nodeRunning:!1,peerId:null,peers:[],userId:null,userIdDisplay:null,walletInitialized:!1,paymentCode:null,quaiAddress:null,balance:0n,quaiBalance:0n,hasSavedWallet:!1,network:localStorage.getItem("cinq_network")||"orchard",currentView:"landing",conversations:[],currentConversation:null,messages:[],chatView:"list",qora:{initialized:!1,available:!1,model:"",tasks:[],questions:[],history:[],chatInput:"",isWorking:!1}};async function he(){try{const e=await g("get_user_id");return e.success&&e.data?(s.userId=e.data.user_id,s.userIdDisplay=e.data.display,e.data):null}catch(e){return console.error("Failed to get user ID:",e),null}}async function fe(e){try{const t=await g("lookup_user_id",{userId:e});return t.success?t.data:(console.error("Lookup failed:",t.error),null)}catch(t){return console.error("Failed to lookup user ID:",t),null}}async function Q(){try{const e=localStorage.getItem("cinq_mnemonic")||void 0,t=await g("start_node",{seedPhrase:e});if(!t.success||!t.data)throw new Error(t.error||"Failed to start node");s.nodeRunning=!0,s.peerId=t.data,await he(),m(),console.log("Node started:",t.data),console.log("User ID:",s.userIdDisplay)}catch(e){throw console.error("Failed to start node:",e),e}}async function ye(){try{const e=await g("stop_node");e.success||console.warn("Stop node warning:",e.error),s.nodeRunning=!1,s.peerId=null,s.userId=null,s.userIdDisplay=null,s.peers=[],m(),console.log("Node stopped")}catch(e){throw console.error("Failed to stop node:",e),e}}async function be(){try{const e=await g("get_peers");return e.success&&e.data?(s.peers=e.data,m(),s.peers):[]}catch(e){return console.error("Failed to get peers:",e),[]}}async function x(){try{const e=await g("get_conversations");return e.success&&e.data?(s.conversations=e.data,e.data):[]}catch(e){return console.error("Failed to get conversations:",e),[]}}async function z(e){try{const t=await g("get_messages",{conversationId:e,limit:100});return t.success&&t.data?(s.messages=t.data.reverse(),s.messages):[]}catch(t){return console.error("Failed to get messages:",t),[]}}async function qe(e,t){try{const n=await g("send_message",{peerId:e,content:t});return n.success&&n.data?(s.messages.push(n.data),await x(),m(),n.data):(console.error("Send message failed:",n.error),null)}catch(n){return console.error("Failed to send message:",n),null}}async function ke(e){let t=e,n=e;const a=e.replace(/-/g,"").replace(/\s/g,"");if(a.length===10&&/^\d+$/.test(a)){const r=await fe(a);if(r)t=r,n=`${a.slice(0,3)}-${a.slice(3,6)}-${a.slice(6)}`;else{console.error("User ID not found:",a),alert(`User ID ${n} not found. They need to be online first.`);return}}else t.length>12&&(n=t.slice(0,12)+"...");await Ie(t,n)}async function Ie(e,t){const n=t||(e.length>12?e.slice(0,12)+"...":e);try{let a=s.conversations.find(r=>r.peer_id===e);a||(a={id:"new-"+e,peer_id:e,display_name:n,last_message:null,last_message_at:null,unread_count:0},s.conversations.unshift(a)),s.currentConversation=a,s.messages=[],s.chatView="conversation",a.id.startsWith("new-")||await z(a.id),m()}catch(a){console.error("Failed to start conversation:",a)}}function Ee(e){s.currentConversation=e,s.chatView="conversation",z(e.id).then(()=>m())}function Ce(){s.currentConversation=null,s.chatView="list",s.messages=[],m()}async function _e(e,t){try{const n=await g("qora_init",{ollamaUrl:e||null,model:t||null});return n.success&&n.data?(s.qora.initialized=n.data.initialized,s.qora.available=n.data.ollama_available,s.qora.model=n.data.model,s.qora.questions=n.data.pending_questions,console.log("Qora initialized:",n.data),m(),n.data):(console.error("Qora init failed:",n.error),null)}catch(n){return console.error("Failed to initialize Qora:",n),null}}async function $e(){try{const e=await g("qora_status");return e.success&&e.data?(s.qora.initialized=e.data.initialized,s.qora.available=e.data.ollama_available,s.qora.model=e.data.model,s.qora.questions=e.data.pending_questions,e.data):null}catch(e){return console.error("Failed to get Qora status:",e),null}}async function Le(e){try{s.qora.history.push({role:"user",content:e}),m();const t=await g("qora_chat",{message:e});return t.success&&t.data?(s.qora.history.push({role:"assistant",content:t.data}),m(),t.data):(console.error("Qora chat failed:",t.error),s.qora.history.pop(),m(),null)}catch(t){return console.error("Failed to chat with Qora:",t),s.qora.history.pop(),m(),null}}async function Se(e,t){try{const n=await g("qora_add_task",{title:e,description:t});return n.success&&n.data?(s.qora.tasks.push(n.data),m(),n.data):(console.error("Add task failed:",n.error),null)}catch(n){return console.error("Failed to add task:",n),null}}async function A(){try{const e=await g("qora_get_tasks");return e.success&&e.data?(s.qora.tasks=e.data,e.data):[]}catch(e){return console.error("Failed to get tasks:",e),[]}}async function We(){try{s.qora.isWorking=!0,m();const e=await g("qora_work");return s.qora.isWorking=!1,e.success?(await A(),await C(),m(),e.data):(console.error("Work failed:",e.error),m(),null)}catch(e){return console.error("Failed to work:",e),s.qora.isWorking=!1,m(),null}}async function Ae(){try{s.qora.isWorking=!0,m(),I("Qora is grinding through tasks...");const e=await g("qora_work_all");return s.qora.isWorking=!1,e.success&&e.data?(await A(),await C(),m(),I("Qora finished working!"),e.data):(console.error("Work all failed:",e.error),m(),null)}catch(e){return console.error("Failed to work all:",e),s.qora.isWorking=!1,m(),null}}async function C(){try{const e=await g("qora_get_questions");return e.success&&e.data?(s.qora.questions=e.data,e.data):[]}catch(e){return console.error("Failed to get questions:",e),[]}}async function Be(e,t){try{const n=await g("qora_answer_question",{questionIndex:e,answer:t});return n.success&&n.data?(await C(),m(),n.data):(console.error("Answer failed:",n.error),null)}catch(n){return console.error("Failed to answer question:",n),null}}async function Ne(){try{const e=await g("qora_get_history");return e.success&&e.data?(s.qora.history=e.data.filter(t=>t.role!=="system"),s.qora.history):[]}catch(e){return console.error("Failed to get history:",e),[]}}async function Te(){try{(await g("reset_identity")).success&&console.log("Identity reset - new Chat ID and Mesh ID will be generated")}catch(t){console.warn("Could not reset identity (node may need to be stopped first):",t)}const e=await H({network:s.network});return s.walletInitialized=!0,s.hasSavedWallet=!0,s.paymentCode=e.paymentCode,s.quaiAddress=e.quaiAddress,localStorage.setItem("cinq_mnemonic",e.mnemonic),localStorage.setItem("cinq_wallet",await W()),localStorage.setItem("cinq_network",s.network),G(t=>{console.log("Received payment:",k(t.amount)),q(),I(`Received ${k(t.amount)}`)}),E(),e}async function Pe(e){const{paymentCode:t,quaiAddress:n}=await D(e,{network:s.network});s.walletInitialized=!0,s.hasSavedWallet=!0,s.paymentCode=t,s.quaiAddress=n,localStorage.setItem("cinq_mnemonic",e),localStorage.setItem("cinq_wallet",await W()),localStorage.setItem("cinq_network",s.network),await q(),E(),m()}async function Qe(e){if(e===s.network)return;const t=localStorage.getItem("cinq_mnemonic");if(!t){console.error("No mnemonic found");return}V(),s.network=e,localStorage.setItem("cinq_network",e);try{const{paymentCode:n,quaiAddress:a}=await D(t,{network:e});s.paymentCode=n,s.quaiAddress=a,s.balance=0n,localStorage.setItem("cinq_wallet",await W()),await q(),E(),I(`Switched to ${e==="mainnet"?"Mainnet":"Orchard Testnet"}`)}catch(n){console.error("Failed to switch network:",n),s.network=e==="mainnet"?"orchard":"mainnet",localStorage.setItem("cinq_network",s.network)}m()}async function Me(){try{(await g("reset_identity")).success&&console.log("Identity reset with wallet clear")}catch(e){console.warn("Could not reset identity:",e)}localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic"),s.walletInitialized=!1,s.hasSavedWallet=!1,s.paymentCode=null,s.quaiAddress=null,s.balance=0n,m()}async function q(){if(s.walletInitialized)try{const[e,t]=await Promise.all([S(),U()]);s.balance=e.balance,s.quaiBalance=t,m()}catch(e){console.error("Failed to refresh balance:",e)}}function m(){Z(s,{startNode:Q,stopNode:ye,initializeNewWallet:Te,restoreWallet:Pe,refreshBalance:q,sendPayment:j,formatQi:k,connectWithSavedWallet:async()=>{await Q()},clearSavedWallet:Me,switchNetwork:Qe,getConversations:x,openConversation:Ee,backToConversationList:Ce,sendMessage:qe,startConversation:ke,qoraInit:_e,qoraStatus:$e,qoraChat:Le,qoraAddTask:Se,qoraGetTasks:A,qoraWork:We,qoraWorkAll:Ae,qoraGetQuestions:C,qoraAnswerQuestion:Be,qoraGetHistory:Ne})}function I(e){console.log("Notification:",e);const t=document.createElement("div");t.className="notification",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),5e3)}async function De(){console.log("cinQ initializing...");const e=localStorage.getItem("cinq_wallet"),t=localStorage.getItem("cinq_mnemonic");if(s.hasSavedWallet=!!(e&&t),e&&t)try{await K(e,t,{network:s.network}),s.walletInitialized=!0,s.paymentCode=Y(),s.quaiAddress=J(),q().catch(n=>console.warn("Balance refresh failed:",n)),E(),console.log("Restored wallet:",s.paymentCode?.slice(0,20)+"...")}catch(n){console.error("Failed to restore wallet:",n),localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic"),s.hasSavedWallet=!1}m(),setInterval(()=>{s.nodeRunning&&be()},1e4)}document.addEventListener("DOMContentLoaded",De);
