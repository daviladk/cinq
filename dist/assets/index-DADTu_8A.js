const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-DoSyO7I7.js","assets/_commonjsHelpers-C4iS2aBk.js","assets/index-CSCCMl66.js"])))=>i.map(i=>d[i]);
(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function n(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(a){if(a.ep)return;a.ep=!0;const o=n(a);fetch(a.href,o)}})();async function C(e,t={},n){return window.__TAURI_INTERNALS__.invoke(e,t,n)}const A="modulepreload",L=function(e){return"/"+e},W={},f=function(t,n,r){let a=Promise.resolve();if(n&&n.length>0){document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),s=i?.nonce||i?.getAttribute("nonce");a=Promise.allSettled(n.map(d=>{if(d=L(d),d in W)return;W[d]=!0;const p=d.endsWith(".css"),w=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${w}`))return;const l=document.createElement("link");if(l.rel=p?"stylesheet":A,p||(l.as="script"),l.crossOrigin="",l.href=d,s&&l.setAttribute("nonce",s),document.head.appendChild(l),p)return new Promise((u,m)=>{l.addEventListener("load",u),l.addEventListener("error",()=>m(new Error(`Unable to preload CSS for ${d}`)))})}))}function o(i){const s=new Event("vite:preloadError",{cancelable:!0});if(s.payload=i,window.dispatchEvent(s),!s.defaultPrevented)throw i}return a.then(i=>{for(const s of i||[])s.status==="rejected"&&o(s.reason);return t().catch(o)})},I={network:"mainnet",pollingInterval:3e4};let v={initialized:!1,paymentCode:null,quaiAddress:null,balance:0n,utxoCount:0,zone:"Cyprus1"},q=[],N=[];async function S(e={}){const t={...I,...e};try{const{QiAgentWallet:n}=await f(async()=>{const{QiAgentWallet:l}=await import("./index-DoSyO7I7.js").then(u=>u.i);return{QiAgentWallet:l}},__vite__mapDeps([0,1])),{Mnemonic:r,HDNodeWallet:a}=await f(async()=>{const{Mnemonic:l,HDNodeWallet:u}=await import("./index-CSCCMl66.js");return{Mnemonic:l,HDNodeWallet:u}},__vite__mapDeps([2,1])),{wallet:o,mnemonic:i}=await n.create({network:t.network,pollingInterval:t.pollingInterval}),s=o.getPaymentCode(),d=r.fromPhrase(i),w=a.fromMnemonic(d,"m/44'/994'/0'/0/0").address;return v={initialized:!0,paymentCode:s,quaiAddress:w,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=o,window.__cinqMnemonic=i,o.onPaymentReceived(l=>{const u={amount:l.amount,senderPaymentCode:l.senderPaymentCode,txHash:l.txHash||"",timestamp:Date.now()};q.forEach(m=>m(u))}),o.onSenderDiscovered(l=>{N.forEach(u=>u(l))}),{mnemonic:i,paymentCode:s,quaiAddress:w}}catch(n){throw console.error("Failed to create wallet:",n),new Error(`Wallet creation failed: ${n}`)}}async function M(e,t={}){const n={...I,...t};try{const{QiAgentWallet:r}=await f(async()=>{const{QiAgentWallet:u}=await import("./index-DoSyO7I7.js").then(m=>m.i);return{QiAgentWallet:u}},__vite__mapDeps([0,1])),{Mnemonic:a,HDNodeWallet:o}=await f(async()=>{const{Mnemonic:u,HDNodeWallet:m}=await import("./index-CSCCMl66.js");return{Mnemonic:u,HDNodeWallet:m}},__vite__mapDeps([2,1])),i=await r.fromMnemonic(e,{network:n.network,pollingInterval:n.pollingInterval}),s=i.getPaymentCode(),d=a.fromPhrase(e),w=o.fromMnemonic(d,"m/44'/994'/0'/0/0").address;await i.sync();const l=await i.getBalance();return v={initialized:!0,paymentCode:s,quaiAddress:w,balance:l.balance,utxoCount:l.utxoCount,zone:"Cyprus1"},window.__cinqWallet=i,window.__cinqMnemonic=e,{paymentCode:s,quaiAddress:w}}catch(r){throw console.error("Failed to import wallet:",r),new Error(`Wallet import failed: ${r}`)}}async function _(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=await e.getBalance();return v.balance=t.balance,v.utxoCount=t.utxoCount,t}async function x(e,t){const n=window.__cinqWallet;if(!n)throw new Error("Wallet not initialized");try{const r=await n.send(e,t);return await _(),{qiTxHash:r.qiTxHash,notifyTxHash:r.notifyTxHash,amount:t,recipient:e}}catch(r){throw console.error("Payment failed:",r),new Error(`Payment failed: ${r}`)}}function P(e){const t=window.__cinqWallet;if(!t)throw new Error("Wallet not initialized");t.startPolling(e)}function B(e){q.push(e)}function $(){return v.paymentCode}async function T(e,t,n={}){const r={...I,...n};try{const{QiAgentWallet:a}=await f(async()=>{const{QiAgentWallet:m}=await import("./index-DoSyO7I7.js").then(g=>g.i);return{QiAgentWallet:m}},__vite__mapDeps([0,1])),{Mnemonic:o,HDNodeWallet:i}=await f(async()=>{const{Mnemonic:m,HDNodeWallet:g}=await import("./index-CSCCMl66.js");return{Mnemonic:m,HDNodeWallet:g}},__vite__mapDeps([2,1])),s=JSON.parse(e),d=await a.deserialize(s,t,{network:r.network,pollingInterval:r.pollingInterval}),p=d.getPaymentCode(),w=o.fromPhrase(t),u=i.fromMnemonic(w,"m/44'/994'/0'/0/0").address;return v={initialized:!0,paymentCode:p,quaiAddress:u,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=d,window.__cinqMnemonic=t,await d.sync(),await _(),p}catch(a){throw console.error("Failed to deserialize wallet:",a),new Error(`Wallet restore failed: ${a}`)}}function h(e){const t=e.toString().padStart(19,"0"),n=t.slice(0,-18)||"0",r=t.slice(-18,-14);return`${n}.${r} Qi`}function z(e,t){const n=document.getElementById("app");n&&(!e.nodeRunning&&!e.walletInitialized?(n.innerHTML=k(),D(t)):e.walletInitialized?(n.innerHTML=R(e),H(e,t)):(n.innerHTML=Q(),O(t)))}function k(e){return`
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
  `}function R(e,t){const n=e.peerId?`${e.peerId.slice(0,8)}...`:"Not connected",r=e.paymentCode?`${e.paymentCode.slice(0,12)}...`:"N/A",a=e.quaiAddress?`${e.quaiAddress.slice(0,10)}...${e.quaiAddress.slice(-6)}`:"N/A";return`
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
          <div class="balance">${h(e.balance)}</div>
          <div class="wallet-addresses">
            <div class="address-row">
              <label>Qi Payment Code:</label>
              <code id="payment-code" title="${e.paymentCode||""}">${r}</code>
              <button id="copy-payment-code" class="btn-icon" title="Copy Payment Code">📋</button>
            </div>
            <div class="address-row">
              <label>Quai Address (DeFi):</label>
              <code id="quai-address" title="${e.quaiAddress||""}">${a}</code>
              <button id="copy-quai-address" class="btn-icon" title="Copy Quai Address">📋</button>
            </div>
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
  `}function D(e){document.getElementById("connect-btn")?.addEventListener("click",async()=>{const t=document.getElementById("connect-btn");t.disabled=!0,t.textContent="Connecting...";try{await e.startNode()}catch(n){console.error("Failed to connect:",n),t.disabled=!1,t.textContent="Connect to Mesh"}})}function O(e){document.getElementById("create-wallet-btn")?.addEventListener("click",async()=>{const t=document.getElementById("create-wallet-btn");t.disabled=!0,t.textContent="Creating...";try{const{mnemonic:n,paymentCode:r}=await e.initializeNewWallet(),a=document.getElementById("mnemonic-display"),o=document.getElementById("mnemonic-words");a&&o&&(o.innerHTML=n.split(" ").map((i,s)=>`<span class="word"><span class="num">${s+1}.</span> ${i}</span>`).join(""),a.classList.remove("hidden"),localStorage.setItem("cinq_mnemonic",n))}catch(n){console.error("Failed to create wallet:",n),t.disabled=!1,t.textContent="Create Wallet"}}),document.getElementById("import-wallet-btn")?.addEventListener("click",async()=>{const n=document.getElementById("mnemonic-input").value.trim();if(!n||n.split(/\s+/).length!==12){alert("Please enter a valid 12-word mnemonic.");return}const r=document.getElementById("import-wallet-btn");r.disabled=!0,r.textContent="Importing...";try{await e.restoreWallet(n),localStorage.setItem("cinq_mnemonic",n)}catch(a){console.error("Failed to import wallet:",a),r.disabled=!1,r.textContent="Import Wallet",alert("Failed to import wallet. Check your mnemonic.")}}),document.getElementById("confirm-saved-btn")?.addEventListener("click",()=>{window.location.reload()})}function H(e,t){document.getElementById("copy-payment-code")?.addEventListener("click",()=>{e.paymentCode&&(navigator.clipboard.writeText(e.paymentCode),E("Payment code copied!"))}),document.getElementById("copy-quai-address")?.addEventListener("click",()=>{e.quaiAddress&&(navigator.clipboard.writeText(e.quaiAddress),E("Quai address copied!"))}),document.getElementById("refresh-balance-btn")?.addEventListener("click",async()=>{const n=document.getElementById("refresh-balance-btn");n.disabled=!0,n.textContent="Refreshing...";try{await t.refreshBalance()}finally{n.disabled=!1,n.textContent="Refresh Balance"}}),document.getElementById("disconnect-btn")?.addEventListener("click",async()=>{await t.stopNode()}),document.getElementById("send-payment-btn")?.addEventListener("click",async()=>{const n=document.getElementById("recipient-input"),r=document.getElementById("amount-input"),a=n.value.trim(),o=BigInt(Math.floor(parseFloat(r.value)*1e18));if(!a.startsWith("PM8T")){alert("Invalid payment code. Must start with PM8T...");return}if(o<=0n){alert("Please enter a valid amount.");return}const i=document.getElementById("send-payment-btn");i.disabled=!0,i.textContent="Sending...";try{await t.sendPayment(a,o),E(`Sent ${t.formatQi(o)} successfully!`),n.value="",r.value="",await t.refreshBalance()}catch(s){console.error("Payment failed:",s),alert(`Payment failed: ${s}`)}finally{i.disabled=!1,i.textContent="Send"}})}function E(e){const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.classList.add("show"),10),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},3e3)}const c={nodeRunning:!1,peerId:null,peers:[],walletInitialized:!1,paymentCode:null,quaiAddress:null,balance:0n,currentView:"landing"};async function F(){try{const e=await C("start_node");if(!e.success||!e.data)throw new Error(e.error||"Failed to start node");c.nodeRunning=!0,c.peerId=e.data,y(),console.log("Node started:",e.data)}catch(e){throw console.error("Failed to start node:",e),e}}async function U(){try{const e=await C("stop_node");e.success||console.warn("Stop node warning:",e.error),c.nodeRunning=!1,c.peerId=null,c.peers=[],y(),console.log("Node stopped")}catch(e){throw console.error("Failed to stop node:",e),e}}async function V(){try{const e=await C("get_peers");return e.success&&e.data?(c.peers=e.data.map(t=>t.peer_id),y(),c.peers):[]}catch(e){return console.error("Failed to get peers:",e),[]}}async function j(){const e=await S({network:"mainnet"});return c.walletInitialized=!0,c.paymentCode=e.paymentCode,c.quaiAddress=e.quaiAddress,B(t=>{console.log("Received payment:",h(t.amount)),b(),G(`Received ${h(t.amount)}`)}),P(),y(),e}async function Y(e){const{paymentCode:t,quaiAddress:n}=await M(e,{network:"mainnet"});c.walletInitialized=!0,c.paymentCode=t,c.quaiAddress=n,await b(),P(),y()}async function b(){if(c.walletInitialized)try{const{balance:e}=await _();c.balance=e,y()}catch(e){console.error("Failed to refresh balance:",e)}}function y(){z(c,{startNode:F,stopNode:U,initializeNewWallet:j,restoreWallet:Y,refreshBalance:b,sendPayment:x,formatQi:h})}function G(e){console.log("Notification:",e);const t=document.createElement("div");t.className="notification",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),5e3)}async function J(){console.log("cinQ initializing...");const e=localStorage.getItem("cinq_wallet"),t=localStorage.getItem("cinq_mnemonic");if(e&&t)try{await T(e,t),c.walletInitialized=!0,c.paymentCode=$(),await b(),P()}catch(n){console.error("Failed to restore wallet:",n),localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic")}y(),setInterval(V,1e4)}document.addEventListener("DOMContentLoaded",J);
