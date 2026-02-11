(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function n(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(o){if(o.ep)return;o.ep=!0;const i=n(o);fetch(o.href,i)}})();async function w(e,t={},n){return window.__TAURI_INTERNALS__.invoke(e,t,n)}const S="modulepreload",L=function(e){return"/"+e},C={},h=function(t,n,a){let o=Promise.resolve();if(n&&n.length>0){document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),l=r?.nonce||r?.getAttribute("nonce");o=Promise.allSettled(n.map(s=>{if(s=L(s),s in C)return;C[s]=!0;const m=s.endsWith(".css"),P=m?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${s}"]${P}`))return;const d=document.createElement("link");if(d.rel=m?"stylesheet":S,m||(d.as="script"),d.crossOrigin="",d.href=s,l&&d.setAttribute("nonce",l),document.head.appendChild(d),m)return new Promise((_,W)=>{d.addEventListener("load",_),d.addEventListener("error",()=>W(new Error(`Unable to preload CSS for ${s}`)))})}))}function i(r){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=r,window.dispatchEvent(l),!l.defaultPrevented)throw r}return o.then(r=>{for(const l of r||[])l.status==="rejected"&&i(l.reason);return t().catch(i)})},v={network:"mainnet",pollingInterval:3e4};let p={initialized:!1,paymentCode:null,balance:0n,utxoCount:0,zone:"Cyprus1"},I=[],x=[];async function N(e={}){const t={...v,...e};try{const{QiAgentWallet:n}=await h(async()=>{const{QiAgentWallet:r}=await import("./index-Cdplvtmj.js").then(l=>l.i);return{QiAgentWallet:r}},[]),{wallet:a,mnemonic:o}=await n.create({network:t.network,pollingInterval:t.pollingInterval}),i=a.getPaymentCode();return p={initialized:!0,paymentCode:i,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=a,a.onPaymentReceived(r=>{const l={amount:r.amount,senderPaymentCode:r.senderPaymentCode,txHash:r.txHash||"",timestamp:Date.now()};I.forEach(s=>s(l))}),a.onSenderDiscovered(r=>{x.forEach(l=>l(r))}),{mnemonic:o,paymentCode:i}}catch(n){throw console.error("Failed to create wallet:",n),new Error(`Wallet creation failed: ${n}`)}}async function B(e,t={}){const n={...v,...t};try{const{QiAgentWallet:a}=await h(async()=>{const{QiAgentWallet:l}=await import("./index-Cdplvtmj.js").then(s=>s.i);return{QiAgentWallet:l}},[]),o=await a.fromMnemonic(e,{network:n.network,pollingInterval:n.pollingInterval}),i=o.getPaymentCode();await o.sync();const r=await o.getBalance();return p={initialized:!0,paymentCode:i,balance:r.balance,utxoCount:r.utxoCount,zone:"Cyprus1"},window.__cinqWallet=o,i}catch(a){throw console.error("Failed to import wallet:",a),new Error(`Wallet import failed: ${a}`)}}async function g(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=await e.getBalance();return p.balance=t.balance,p.utxoCount=t.utxoCount,t}async function $(e,t){const n=window.__cinqWallet;if(!n)throw new Error("Wallet not initialized");try{const a=await n.send(e,t);return await g(),{qiTxHash:a.qiTxHash,notifyTxHash:a.notifyTxHash,amount:t,recipient:e}}catch(a){throw console.error("Payment failed:",a),new Error(`Payment failed: ${a}`)}}function b(e){const t=window.__cinqWallet;if(!t)throw new Error("Wallet not initialized");t.startPolling(e)}function z(e){I.push(e)}function T(){return p.paymentCode}async function k(e,t,n={}){const a={...v,...n};try{const{QiAgentWallet:o}=await h(async()=>{const{QiAgentWallet:s}=await import("./index-Cdplvtmj.js").then(m=>m.i);return{QiAgentWallet:s}},[]),i=JSON.parse(e),r=await o.deserialize(i,t,{network:a.network,pollingInterval:a.pollingInterval}),l=r.getPaymentCode();return p={initialized:!0,paymentCode:l,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=r,await r.sync(),await g(),l}catch(o){throw console.error("Failed to deserialize wallet:",o),new Error(`Wallet restore failed: ${o}`)}}function y(e){const t=e.toString().padStart(19,"0"),n=t.slice(0,-18)||"0",a=t.slice(-18,-14);return`${n}.${a} Qi`}function M(e,t){const n=document.getElementById("app");n&&(!e.nodeRunning&&!e.walletInitialized?(n.innerHTML=R(),q(t)):e.walletInitialized?(n.innerHTML=A(e),O(e,t)):(n.innerHTML=Q(),F(t)))}function R(e){return`
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
        
        <button id="connect-btn" class="btn-primary">
          Connect to Mesh
        </button>
      </div>
    </div>
  `}function Q(e){return`
    <div class="wallet-setup">
      <h2>Set Up Your Wallet</h2>
      <p>You need a Qi wallet to use the cinQ mesh.</p>
      
      <div class="wallet-options">
        <div class="wallet-option">
          <h3>Create New Wallet</h3>
          <p>Generate a new wallet with a fresh mnemonic phrase.</p>
          <button id="create-wallet-btn" class="btn-primary">Create Wallet</button>
        </div>
        
        <div class="divider">or</div>
        
        <div class="wallet-option">
          <h3>Import Existing Wallet</h3>
          <p>Restore from your 12-word mnemonic phrase.</p>
          <textarea id="mnemonic-input" placeholder="Enter your 12-word mnemonic..."></textarea>
          <button id="import-wallet-btn" class="btn-secondary">Import Wallet</button>
        </div>
      </div>
      
      <div id="mnemonic-display" class="mnemonic-display hidden">
        <h3>⚠️ Save Your Mnemonic!</h3>
        <p>This is the ONLY way to recover your wallet. Write it down and store it safely.</p>
        <div class="mnemonic-words" id="mnemonic-words"></div>
        <button id="confirm-saved-btn" class="btn-primary">I've Saved It</button>
      </div>
    </div>
  `}function A(e,t){const n=e.peerId?`${e.peerId.slice(0,8)}...`:"Not connected",a=e.paymentCode?`${e.paymentCode.slice(0,12)}...`:"N/A";return`
    <div class="main-app">
      <header class="header">
        <div class="logo-small">cinQ</div>
        <div class="status">
          <span class="status-dot ${e.nodeRunning?"online":"offline"}"></span>
          <span>${e.peers.length} peers</span>
        </div>
      </header>
      
      <div class="dashboard">
        <div class="card wallet-card">
          <h3>💰 Wallet</h3>
          <div class="balance">${y(e.balance)}</div>
          <div class="payment-code">
            <label>Payment Code:</label>
            <code id="payment-code" title="${e.paymentCode||""}">${a}</code>
            <button id="copy-payment-code" class="btn-icon" title="Copy">📋</button>
          </div>
          <button id="refresh-balance-btn" class="btn-secondary">Refresh Balance</button>
        </div>
        
        <div class="card node-card">
          <h3>🌐 Node Status</h3>
          <div class="node-info">
            <div class="info-row">
              <span>Peer ID:</span>
              <code>${n}</code>
            </div>
            <div class="info-row">
              <span>Connected Peers:</span>
              <span class="peer-count">${e.peers.length}</span>
            </div>
          </div>
          <button id="disconnect-btn" class="btn-danger">Disconnect</button>
        </div>
        
        <div class="card peers-card">
          <h3>👥 Connected Peers</h3>
          <div class="peer-list">
            ${e.peers.length>0?e.peers.map(o=>`
                <div class="peer-item">
                  <span class="peer-id">${o.slice(0,16)}...</span>
                  <button class="btn-small btn-send" data-peer="${o}">Send Qi</button>
                </div>
              `).join(""):'<p class="no-peers">No peers connected yet.</p>'}
          </div>
        </div>
        
        <div class="card send-card">
          <h3>📤 Send Payment</h3>
          <div class="send-form">
            <input type="text" id="recipient-input" placeholder="Recipient Payment Code (PM8T...)" />
            <input type="number" id="amount-input" placeholder="Amount in Qi" />
            <button id="send-payment-btn" class="btn-primary">Send</button>
          </div>
        </div>
      </div>
    </div>
  `}function q(e){document.getElementById("connect-btn")?.addEventListener("click",async()=>{const t=document.getElementById("connect-btn");t.disabled=!0,t.textContent="Connecting...";try{await e.startNode()}catch(n){console.error("Failed to connect:",n),t.disabled=!1,t.textContent="Connect to Mesh"}})}function F(e){document.getElementById("create-wallet-btn")?.addEventListener("click",async()=>{const t=document.getElementById("create-wallet-btn");t.disabled=!0,t.textContent="Creating...";try{const{mnemonic:n,paymentCode:a}=await e.initializeNewWallet(),o=document.getElementById("mnemonic-display"),i=document.getElementById("mnemonic-words");o&&i&&(i.innerHTML=n.split(" ").map((r,l)=>`<span class="word"><span class="num">${l+1}.</span> ${r}</span>`).join(""),o.classList.remove("hidden"),localStorage.setItem("cinq_mnemonic",n))}catch(n){console.error("Failed to create wallet:",n),t.disabled=!1,t.textContent="Create Wallet"}}),document.getElementById("import-wallet-btn")?.addEventListener("click",async()=>{const n=document.getElementById("mnemonic-input").value.trim();if(!n||n.split(/\s+/).length!==12){alert("Please enter a valid 12-word mnemonic.");return}const a=document.getElementById("import-wallet-btn");a.disabled=!0,a.textContent="Importing...";try{await e.restoreWallet(n),localStorage.setItem("cinq_mnemonic",n)}catch(o){console.error("Failed to import wallet:",o),a.disabled=!1,a.textContent="Import Wallet",alert("Failed to import wallet. Check your mnemonic.")}}),document.getElementById("confirm-saved-btn")?.addEventListener("click",()=>{window.location.reload()})}function O(e,t){document.getElementById("copy-payment-code")?.addEventListener("click",()=>{e.paymentCode&&(navigator.clipboard.writeText(e.paymentCode),E("Payment code copied!"))}),document.getElementById("refresh-balance-btn")?.addEventListener("click",async()=>{const n=document.getElementById("refresh-balance-btn");n.disabled=!0,n.textContent="Refreshing...";try{await t.refreshBalance()}finally{n.disabled=!1,n.textContent="Refresh Balance"}}),document.getElementById("disconnect-btn")?.addEventListener("click",async()=>{await t.stopNode()}),document.getElementById("send-payment-btn")?.addEventListener("click",async()=>{const n=document.getElementById("recipient-input"),a=document.getElementById("amount-input"),o=n.value.trim(),i=BigInt(Math.floor(parseFloat(a.value)*1e18));if(!o.startsWith("PM8T")){alert("Invalid payment code. Must start with PM8T...");return}if(i<=0n){alert("Please enter a valid amount.");return}const r=document.getElementById("send-payment-btn");r.disabled=!0,r.textContent="Sending...";try{await t.sendPayment(o,i),E(`Sent ${t.formatQi(i)} successfully!`),n.value="",a.value="",await t.refreshBalance()}catch(l){console.error("Payment failed:",l),alert(`Payment failed: ${l}`)}finally{r.disabled=!1,r.textContent="Send"}})}function E(e){const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.classList.add("show"),10),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},3e3)}const c={nodeRunning:!1,peerId:null,peers:[],walletInitialized:!1,paymentCode:null,balance:0n,currentView:"landing"};async function H(){try{const e=await w("start_node");c.nodeRunning=!0,c.peerId=e.peer_id,u(),console.log("Node started:",e.peer_id)}catch(e){throw console.error("Failed to start node:",e),e}}async function D(){try{await w("stop_node"),c.nodeRunning=!1,c.peerId=null,c.peers=[],u(),console.log("Node stopped")}catch(e){throw console.error("Failed to stop node:",e),e}}async function U(){try{const e=await w("get_connected_peers");return c.peers=e,u(),e}catch(e){return console.error("Failed to get peers:",e),[]}}async function V(){const e=await N({network:"mainnet"});return c.walletInitialized=!0,c.paymentCode=e.paymentCode,z(t=>{console.log("Received payment:",y(t.amount)),f(),j(`Received ${y(t.amount)}`)}),b(),u(),e}async function Y(e){const t=await B(e,{network:"mainnet"});c.walletInitialized=!0,c.paymentCode=t,await f(),b(),u()}async function f(){if(c.walletInitialized)try{const{balance:e}=await g();c.balance=e,u()}catch(e){console.error("Failed to refresh balance:",e)}}function u(){M(c,{startNode:H,stopNode:D,initializeNewWallet:V,restoreWallet:Y,refreshBalance:f,sendPayment:$,formatQi:y})}function j(e){console.log("Notification:",e);const t=document.createElement("div");t.className="notification",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),5e3)}async function G(){console.log("cinQ initializing...");const e=localStorage.getItem("cinq_wallet"),t=localStorage.getItem("cinq_mnemonic");if(e&&t)try{await k(e,t),c.walletInitialized=!0,c.paymentCode=T(),await f(),b()}catch(n){console.error("Failed to restore wallet:",n),localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic")}u(),setInterval(U,1e4)}document.addEventListener("DOMContentLoaded",G);
