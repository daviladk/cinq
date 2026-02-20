const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-DoSyO7I7.js","assets/_commonjsHelpers-C4iS2aBk.js","assets/index-CSCCMl66.js"])))=>i.map(i=>d[i]);
(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const c of o)if(c.type==="childList")for(const u of c.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&n(u)}).observe(document,{childList:!0,subtree:!0});function a(o){const c={};return o.integrity&&(c.integrity=o.integrity),o.referrerPolicy&&(c.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?c.credentials="include":o.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function n(o){if(o.ep)return;o.ep=!0;const c=a(o);fetch(o.href,c)}})();async function g(e,t={},a){return window.__TAURI_INTERNALS__.invoke(e,t,a)}const ee="modulepreload",te=function(e){return"/"+e},P={},b=function(t,a,n){let o=Promise.resolve();if(a&&a.length>0){document.getElementsByTagName("link");const u=document.querySelector("meta[property=csp-nonce]"),l=u?.nonce||u?.getAttribute("nonce");o=Promise.allSettled(a.map(p=>{if(p=te(p),p in P)return;P[p]=!0;const i=p.endsWith(".css"),r=i?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${p}"]${r}`))return;const d=document.createElement("link");if(d.rel=i?"stylesheet":ee,i||(d.as="script"),d.crossOrigin="",d.href=p,l&&d.setAttribute("nonce",l),document.head.appendChild(d),i)return new Promise((m,h)=>{d.addEventListener("load",m),d.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${p}`)))})}))}function c(u){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=u,window.dispatchEvent(l),!l.defaultPrevented)throw u}return o.then(u=>{for(const l of u||[])l.status==="rejected"&&c(l.reason);return t().catch(c)})},x={network:"orchard",pollingInterval:3e4};let y={initialized:!1,paymentCode:null,quaiAddress:null,balance:0n,utxoCount:0,zone:"Cyprus1"},H=[],ae=[];async function ne(e={}){const t={...x,...e};try{const{QiAgentWallet:a}=await b(async()=>{const{QiAgentWallet:d}=await import("./index-DoSyO7I7.js").then(m=>m.i);return{QiAgentWallet:d}},__vite__mapDeps([0,1])),{Mnemonic:n,HDNodeWallet:o}=await b(async()=>{const{Mnemonic:d,HDNodeWallet:m}=await import("./index-CSCCMl66.js");return{Mnemonic:d,HDNodeWallet:m}},__vite__mapDeps([2,1])),{wallet:c,mnemonic:u}=await a.create({network:t.network,pollingInterval:t.pollingInterval}),l=c.getPaymentCode(),p=n.fromPhrase(u),r=o.fromMnemonic(p,"m/44'/994'/0'/0/0").address;return y={initialized:!0,paymentCode:l,quaiAddress:r,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=c,window.__cinqMnemonic=u,c.onPaymentReceived(d=>{const m={amount:d.amount,senderPaymentCode:d.senderPaymentCode,txHash:d.txHash||"",timestamp:Date.now()};H.forEach(h=>h(m))}),c.onSenderDiscovered(d=>{ae.forEach(m=>m(d))}),{mnemonic:u,paymentCode:l,quaiAddress:r}}catch(a){throw console.error("Failed to create wallet:",a),new Error(`Wallet creation failed: ${a}`)}}async function U(e,t={}){const a={...x,...t};try{const{QiAgentWallet:n}=await b(async()=>{const{QiAgentWallet:m}=await import("./index-DoSyO7I7.js").then(h=>h.i);return{QiAgentWallet:m}},__vite__mapDeps([0,1])),{Mnemonic:o,HDNodeWallet:c}=await b(async()=>{const{Mnemonic:m,HDNodeWallet:h}=await import("./index-CSCCMl66.js");return{Mnemonic:m,HDNodeWallet:h}},__vite__mapDeps([2,1])),u=await n.fromMnemonic(e,{network:a.network,pollingInterval:a.pollingInterval}),l=u.getPaymentCode(),p=o.fromPhrase(e),r=c.fromMnemonic(p,"m/44'/994'/0'/0/0").address;await u.sync();const d=await u.getBalance();return y={initialized:!0,paymentCode:l,quaiAddress:r,balance:d.balance,utxoCount:d.utxoCount,zone:"Cyprus1"},window.__cinqWallet=u,window.__cinqMnemonic=e,{paymentCode:l,quaiAddress:r}}catch(n){throw console.error("Failed to import wallet:",n),new Error(`Wallet import failed: ${n}`)}}async function M(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=await e.getBalance();return y.balance=t.balance,y.utxoCount=t.utxoCount,t}async function se(){try{const{JsonRpcProvider:e}=await b(async()=>{const{JsonRpcProvider:u}=await import("./index-CSCCMl66.js");return{JsonRpcProvider:u}},__vite__mapDeps([2,1])),t=y.quaiAddress;if(!t)return 0n;const n=(localStorage.getItem("cinq_network")||"orchard")==="mainnet"?"https://rpc.quai.network":"https://rpc.orchard.quai.network";return await new e(n).getBalance(t)}catch(e){return console.error("Failed to get Quai balance:",e),0n}}async function ie(e,t){const a=window.__cinqWallet;if(!a)throw new Error("Wallet not initialized");try{const n=await a.send(e,t);return await M(),{qiTxHash:n.qiTxHash,notifyTxHash:n.notifyTxHash,amount:t,recipient:e}}catch(n){throw console.error("Payment failed:",n),new Error(`Payment failed: ${n}`)}}function _(e){const t=window.__cinqWallet;if(!t)throw new Error("Wallet not initialized");t.startPolling(e)}function oe(){const e=window.__cinqWallet;e&&e.stopPolling()}function re(e){H.push(e)}function de(){return y.paymentCode}function le(){return y.quaiAddress}async function W(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=e.serialize();return JSON.stringify(t)}async function ce(e,t,a={}){const n={...x,...a};try{const{QiAgentWallet:o}=await b(async()=>{const{QiAgentWallet:h}=await import("./index-DoSyO7I7.js").then(k=>k.i);return{QiAgentWallet:h}},__vite__mapDeps([0,1])),{Mnemonic:c,HDNodeWallet:u}=await b(async()=>{const{Mnemonic:h,HDNodeWallet:k}=await import("./index-CSCCMl66.js");return{Mnemonic:h,HDNodeWallet:k}},__vite__mapDeps([2,1])),l=JSON.parse(e),p=await o.deserialize(l,t,{network:n.network,pollingInterval:n.pollingInterval}),i=p.getPaymentCode(),r=c.fromPhrase(t),m=u.fromMnemonic(r,"m/44'/994'/0'/0/0").address;return y={initialized:!0,paymentCode:i,quaiAddress:m,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=p,window.__cinqMnemonic=t,await p.sync(),await M(),i}catch(o){throw console.error("Failed to deserialize wallet:",o),new Error(`Wallet restore failed: ${o}`)}}function E(e){const t=e.toString().padStart(19,"0"),a=t.slice(0,-18)||"0",n=t.slice(-18,-14);return`${a}.${n} Qi`}const B={tactical:{name:"🎖️ Tactical",gridSize:20,widgets:[{id:"w1",appId:"cinq.chat",x:0,y:0,width:20,height:25,minimized:!1,zIndex:1},{id:"w2",appId:"cinq.wallet",x:20,y:0,width:15,height:10,minimized:!1,zIndex:2},{id:"w3",appId:"cinq.compute",x:20,y:10,width:15,height:15,minimized:!1,zIndex:3},{id:"w4",appId:"system.monitor",x:35,y:0,width:15,height:12,minimized:!1,zIndex:4},{id:"w5",appId:"system.network",x:35,y:12,width:15,height:13,minimized:!1,zIndex:5}]},minimal:{name:"✨ Minimal",gridSize:20,widgets:[{id:"w1",appId:"cinq.chat",x:10,y:2,width:30,height:22,minimized:!1,zIndex:1}]},command:{name:"🖥️ Command Center",gridSize:20,widgets:[{id:"w1",appId:"cinq.chat",x:0,y:0,width:18,height:20,minimized:!1,zIndex:1},{id:"w2",appId:"cinq.voice",x:0,y:20,width:18,height:8,minimized:!1,zIndex:2},{id:"w3",appId:"cinq.grid",x:18,y:0,width:18,height:28,minimized:!1,zIndex:3},{id:"w4",appId:"cinq.compute",x:36,y:0,width:14,height:14,minimized:!1,zIndex:4},{id:"w5",appId:"cinq.wallet",x:36,y:14,width:14,height:14,minimized:!1,zIndex:5}]},ops:{name:"📊 Ops Dashboard",gridSize:20,widgets:[{id:"w1",appId:"system.monitor",x:0,y:0,width:16,height:14,minimized:!1,zIndex:1},{id:"w2",appId:"system.bandwidth",x:16,y:0,width:16,height:14,minimized:!1,zIndex:2},{id:"w3",appId:"system.network",x:32,y:0,width:18,height:14,minimized:!1,zIndex:3},{id:"w4",appId:"cinq.compute",x:0,y:14,width:25,height:14,minimized:!1,zIndex:4},{id:"w5",appId:"cinq.wallet",x:25,y:14,width:25,height:14,minimized:!1,zIndex:5}]}};function N(){return`w${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`}function j(e){const t=localStorage.getItem("cinq_dashboard_layout");if(t)try{return JSON.parse(t)}catch(n){console.error("Failed to parse saved layout:",n)}const a=B.tactical;return{id:N(),...a,createdAt:Date.now(),updatedAt:Date.now()}}function q(e){e.updatedAt=Date.now(),localStorage.setItem("cinq_dashboard_layout",JSON.stringify(e))}function ue(e){const t=B[e];if(!t)return console.error("Unknown preset:",e),j();const a={id:N(),...t,createdAt:Date.now(),updatedAt:Date.now()};return q(a),a}function pe(e,t){const a=Math.max(0,...e.widgets.map(l=>l.zIndex));let n=0,o=0;const c=new Set(e.widgets.map(l=>`${l.x},${l.y}`));for(;c.has(`${n},${o}`);)n+=5,n>40&&(n=0,o+=5);const u={id:N(),appId:t,x:n,y:o,width:15,height:12,minimized:!1,zIndex:a+1};return e.widgets.push(u),q(e),e}function me(e,t){return e.widgets=e.widgets.filter(a=>a.id!==t),q(e),e}function $(e,t,a){const n=e.widgets.find(o=>o.id===t);return n&&(Object.assign(n,a),q(e)),e}function z(e,t){const a=Math.max(...e.widgets.map(o=>o.zIndex)),n=e.widgets.find(o=>o.id===t);return n&&(n.zIndex=a+1,q(e)),e}function ve(e,t){const{layout:a,editMode:n,selectedWidget:o}=e;return`
    <div class="canvas-container ${n?"edit-mode":""}" data-grid-size="${a.gridSize}">
      <!-- Canvas toolbar -->
      <div class="canvas-toolbar">
        <div class="toolbar-left">
          <button class="toolbar-btn" data-action="classic-mode" title="Switch to Classic Mode">
            ◀ Classic
          </button>
          <span class="layout-name">${a.name}</span>
          ${n?'<span class="edit-badge">✏️ Edit Mode</span>':""}
        </div>
        <div class="toolbar-right">
          <button class="toolbar-btn" data-action="toggle-edit" title="${n?"Done Editing":"Edit Layout"}">
            ${n?"✓ Done":"✏️ Edit"}
          </button>
          <button class="toolbar-btn" data-action="add-widget" title="Add Widget">➕</button>
          <div class="preset-dropdown">
            <button class="toolbar-btn" data-action="presets">📐 Layouts</button>
            <div class="preset-menu">
              ${Object.entries(B).map(([c,u])=>`
                <button class="preset-item" data-preset="${c}">${u.name}</button>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Canvas grid -->
      <div class="canvas-grid" id="canvas-grid">
        ${a.widgets.map(c=>ge(c,t,n,o===c.id,a.gridSize)).join("")}
      </div>
      
      <!-- Add widget modal -->
      <div class="add-widget-modal" id="add-widget-modal" style="display: none;">
        <div class="modal-content">
          <h3>Add Widget</h3>
          <div class="widget-options">
            <button class="widget-option" data-app="cinq.chat">💬 Chat</button>
            <button class="widget-option" data-app="cinq.voice">📞 Voice</button>
            <button class="widget-option" data-app="cinq.grid">🌐 Grid</button>
            <button class="widget-option" data-app="cinq.compute">⚡ Compute</button>
            <button class="widget-option" data-app="cinq.wallet">👛 Wallet</button>
            <button class="widget-option" data-app="cinq.files">📁 Files</button>
            <button class="widget-option" data-app="system.monitor">📊 System</button>
            <button class="widget-option" data-app="system.bandwidth">📶 Bandwidth</button>
            <button class="widget-option" data-app="system.network">🔗 Network</button>
          </div>
          <button class="modal-close" data-action="close-modal">Cancel</button>
        </div>
      </div>
    </div>
  `}function ge(e,t,a,n,o){const c=`
    left: ${e.x*o}px;
    top: ${e.y*o}px;
    width: ${e.width*o}px;
    height: ${e.minimized?32:e.height*o}px;
    z-index: ${e.zIndex};
  `,u=he(e.appId),l=we(e.appId);return`
    <div 
      class="canvas-widget ${e.minimized?"minimized":""} ${n?"selected":""} ${a?"editable":""}"
      data-widget-id="${e.id}"
      data-app-id="${e.appId}"
      style="${c}"
    >
      <!-- Widget header (draggable) -->
      <div class="widget-header" data-drag-handle="${e.id}">
        <span class="widget-icon">${l}</span>
        <span class="widget-title">${u}</span>
        <div class="widget-controls">
          <button class="widget-btn" data-action="minimize" data-widget="${e.id}" title="Minimize">─</button>
          <button class="widget-btn" data-action="maximize" data-widget="${e.id}" title="Maximize">□</button>
          ${a?`<button class="widget-btn close" data-action="remove" data-widget="${e.id}" title="Remove">✕</button>`:""}
        </div>
      </div>
      
      <!-- Widget content -->
      ${e.minimized?"":`
        <div class="widget-content">
          ${t(e.appId,e)}
        </div>
      `}
      
      <!-- Resize handles (edit mode only) -->
      ${a&&!e.minimized?`
        <div class="resize-handle n" data-resize="${e.id}" data-handle="n"></div>
        <div class="resize-handle s" data-resize="${e.id}" data-handle="s"></div>
        <div class="resize-handle e" data-resize="${e.id}" data-handle="e"></div>
        <div class="resize-handle w" data-resize="${e.id}" data-handle="w"></div>
        <div class="resize-handle ne" data-resize="${e.id}" data-handle="ne"></div>
        <div class="resize-handle nw" data-resize="${e.id}" data-handle="nw"></div>
        <div class="resize-handle se" data-resize="${e.id}" data-handle="se"></div>
        <div class="resize-handle sw" data-resize="${e.id}" data-handle="sw"></div>
      `:""}
    </div>
  `}function he(e){return{"cinq.chat":"Chat","cinq.voice":"Voice","cinq.grid":"Grid","cinq.compute":"Compute","cinq.wallet":"Wallet","cinq.files":"Files","cinq.settings":"Settings","system.monitor":"System Monitor","system.bandwidth":"Bandwidth","system.network":"Network","system.depin":"DePIN Stats"}[e]||e}function we(e){return{"cinq.chat":"💬","cinq.voice":"📞","cinq.grid":"🌐","cinq.compute":"⚡","cinq.wallet":"👛","cinq.files":"📁","cinq.settings":"⚙️","system.monitor":"📊","system.bandwidth":"📶","system.network":"🔗","system.depin":"🌍"}[e]||"📦"}function fe(e,t){if(!document.getElementById("canvas-grid"))return;const n=e.layout.gridSize;let o=0,c=0,u=null;document.querySelectorAll("[data-drag-handle]").forEach(l=>{l.addEventListener("mousedown",p=>{const i=p,r=l.dataset.dragHandle,d=e.layout.widgets.find(m=>m.id===r);d&&e.editMode&&(i.preventDefault(),e.dragging=r,e.dragOffset={x:i.clientX-d.x*n,y:i.clientY-d.y*n},u={...d},e.layout=z(e.layout,r),t(e))})}),document.querySelectorAll("[data-resize]").forEach(l=>{l.addEventListener("mousedown",p=>{const i=p,r=l,d=r.dataset.resize,m=r.dataset.handle,h=e.layout.widgets.find(k=>k.id===d);h&&e.editMode&&(i.preventDefault(),i.stopPropagation(),e.resizing=d,e.resizeHandle=m,o=i.clientX,c=i.clientY,u={...h},t(e))})}),document.addEventListener("mousemove",l=>{if(e.dragging&&u){const p=Math.max(0,Math.round((l.clientX-e.dragOffset.x)/n)),i=Math.max(0,Math.round((l.clientY-e.dragOffset.y)/n));e.layout=$(e.layout,e.dragging,{x:p,y:i}),t(e)}if(e.resizing&&e.resizeHandle&&u){const p=Math.round((l.clientX-o)/n),i=Math.round((l.clientY-c)/n);let r={};const d=e.resizeHandle;d.includes("e")&&(r.width=Math.max(5,u.width+p)),d.includes("w")&&(r.x=u.x+p,r.width=Math.max(5,u.width-p)),d.includes("s")&&(r.height=Math.max(4,u.height+i)),d.includes("n")&&(r.y=u.y+i,r.height=Math.max(4,u.height-i)),e.layout=$(e.layout,e.resizing,r),t(e)}}),document.addEventListener("mouseup",()=>{(e.dragging||e.resizing)&&(e.dragging=null,e.resizing=null,e.resizeHandle=null,u=null,q(e.layout),t(e))}),document.querySelectorAll('[data-action="toggle-edit"]').forEach(l=>{l.addEventListener("click",()=>{e.editMode=!e.editMode,t(e)})}),document.querySelectorAll('[data-action="add-widget"]').forEach(l=>{l.addEventListener("click",()=>{const p=document.getElementById("add-widget-modal");p&&(p.style.display="flex")})}),document.querySelectorAll('[data-action="close-modal"]').forEach(l=>{l.addEventListener("click",()=>{const p=document.getElementById("add-widget-modal");p&&(p.style.display="none")})}),document.querySelectorAll(".widget-option[data-app]").forEach(l=>{l.addEventListener("click",()=>{const p=l.dataset.app;e.layout=pe(e.layout,p);const i=document.getElementById("add-widget-modal");i&&(i.style.display="none"),t(e)})}),document.querySelectorAll(".preset-item[data-preset]").forEach(l=>{l.addEventListener("click",()=>{const p=l.dataset.preset;e.layout=ue(p),t(e)})}),document.querySelectorAll('[data-action="minimize"]').forEach(l=>{l.addEventListener("click",p=>{p.stopPropagation();const i=l.dataset.widget,r=e.layout.widgets.find(d=>d.id===i);r&&(e.layout=$(e.layout,i,{minimized:!r.minimized}),t(e))})}),document.querySelectorAll('[data-action="maximize"]').forEach(l=>{l.addEventListener("click",p=>{p.stopPropagation();const i=l.dataset.widget;e.layout=$(e.layout,i,{x:0,y:0,width:50,height:28,minimized:!1}),e.layout=z(e.layout,i),t(e)})}),document.querySelectorAll('[data-action="remove"]').forEach(l=>{l.addEventListener("click",p=>{p.stopPropagation();const i=l.dataset.widget;e.layout=me(e.layout,i),t(e)})}),document.querySelectorAll(".canvas-widget").forEach(l=>{l.addEventListener("mousedown",()=>{const p=l.dataset.widgetId;e.selectedWidget=p,e.layout=z(e.layout,p),t(e)})})}function ye(){return{layout:j(),dragging:null,resizing:null,resizeHandle:null,dragOffset:{x:0,y:0},selectedWidget:null,editMode:!1}}function G(e){return e===0n?"0.00 QUAI":(Number(e)/1e18).toFixed(4)+" QUAI"}function be(e,t){const a=document.getElementById("app");a&&(e.walletInitialized&&e.nodeRunning?e.layoutMode==="canvas"?(a.innerHTML=qe(e),Ce(e,t)):(a.innerHTML=Ae(e),je(e,t)):(e.walletInitialized&&e.nodeRunning,a.innerHTML=Q(e),F(e,t)))}function Q(e,t){const a=e.hasSavedWallet;return a&&e.walletInitialized?`
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
    `}function qe(e,t){return ve(e.canvas,(a,n)=>Ie(a,n,e))}function Ie(e,t,a,n){const o=a.peerId?`${a.peerId.slice(0,8)}...`:"N/A",c=a.network==="mainnet";switch(e){case"cinq.chat":return`
        <div class="widget-chat">
          <div class="chat-id-mini">
            <span>ID: </span>
            <code>${a.userIdDisplay||"..."}</code>
          </div>
          ${ke(a)}
        </div>
      `;case"cinq.wallet":return`
        <div class="widget-wallet">
          <div class="wallet-balance-row">
            <span class="label">Qi</span>
            <span class="value">${E(a.balance)}</span>
          </div>
          <div class="wallet-balance-row">
            <span class="label">Quai</span>
            <span class="value">${G(a.quaiBalance)}</span>
          </div>
          <div class="wallet-address">
            <small>${a.quaiAddress?.slice(0,12)}...${a.quaiAddress?.slice(-8)||""}</small>
          </div>
        </div>
      `;case"cinq.compute":return`
        <div class="widget-compute">
          <div class="compute-stat">
            <span class="label">Status</span>
            <span class="value online">● Providing</span>
          </div>
          <div class="compute-stat">
            <span class="label">FLOPs/hr</span>
            <span class="value">2.4M</span>
          </div>
          <div class="compute-stat">
            <span class="label">Earned</span>
            <span class="value">0.0024 Qi</span>
          </div>
        </div>
      `;case"cinq.voice":return`
        <div class="widget-voice">
          <div class="voice-status">No active call</div>
          <button class="btn-call" disabled>📞 Start Call</button>
        </div>
      `;case"cinq.grid":return`
        <div class="widget-grid">
          <div class="grid-placeholder">
            <span>🌐</span>
            <p>Join or create a Grid</p>
          </div>
        </div>
      `;case"cinq.files":return`
        <div class="widget-files">
          <div class="files-placeholder">
            <span>📁</span>
            <p>No files yet</p>
          </div>
        </div>
      `;case"system.monitor":return Ee();case"system.bandwidth":return $e();case"system.network":return`
        <div class="widget-network">
          <div class="net-stat">
            <span class="label">Peer ID</span>
            <code class="value">${o}</code>
          </div>
          <div class="net-stat">
            <span class="label">Peers</span>
            <span class="value">${a.peers.length}</span>
          </div>
          <div class="net-stat">
            <span class="label">Network</span>
            <span class="value ${c?"mainnet":""}">${c?"Mainnet":"Orchard"}</span>
          </div>
        </div>
      `;case"system.depin":return`
        <div class="widget-depin">
          <div class="depin-stat">
            <span class="label">$CINQ Rep</span>
            <span class="value">Tier 1</span>
          </div>
          <div class="depin-stat">
            <span class="label">Uptime</span>
            <span class="value">99.2%</span>
          </div>
          <div class="depin-stat">
            <span class="label">Jobs</span>
            <span class="value">0</span>
          </div>
        </div>
      `;default:return`<div class="widget-empty">Widget: ${e}</div>`}}function ke(e){return e.chatView==="conversation"&&e.currentConversation?`
      <div class="chat-compact">
        <div class="chat-messages-mini">
          ${e.messages.slice(-5).map(t=>`
            <div class="msg-mini ${t.is_outgoing?"out":"in"}">
              <span class="msg-text">${f(t.content).slice(0,50)}${t.content.length>50?"...":""}</span>
            </div>
          `).join("")}
        </div>
        <div class="chat-input-mini">
          <input type="text" class="compact-input" placeholder="Message..." id="widget-chat-input">
          <button class="btn-send-mini">→</button>
        </div>
      </div>
    `:`
    <div class="chat-compact">
      <div class="conv-list-mini">
        ${e.conversations.slice(0,4).map(t=>`
          <div class="conv-mini" data-conv-id="${t.id}">
            <span class="conv-name">${t.display_name.slice(0,15)}</span>
            <span class="conv-preview">${t.last_message?.slice(0,20)||"No messages"}...</span>
          </div>
        `).join("")}
        ${e.conversations.length===0?'<p class="empty">No conversations</p>':""}
      </div>
    </div>
  `}function Ee(){return`
    <div class="widget-monitor">
      <div class="gauge-row">
        <div class="mini-gauge">
          <svg viewBox="0 0 36 36" class="circular-chart">
            <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <path class="circle cpu" stroke-dasharray="45, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
          </svg>
          <span class="gauge-label">CPU</span>
        </div>
        <div class="mini-gauge">
          <svg viewBox="0 0 36 36" class="circular-chart">
            <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <path class="circle ram" stroke-dasharray="62, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
          </svg>
          <span class="gauge-label">RAM</span>
        </div>
        <div class="mini-gauge">
          <svg viewBox="0 0 36 36" class="circular-chart">
            <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <path class="circle gpu" stroke-dasharray="28, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
          </svg>
          <span class="gauge-label">GPU</span>
        </div>
      </div>
    </div>
  `}function $e(){return`
    <div class="widget-bandwidth">
      <div class="bw-stat">
        <span class="arrow up">↑</span>
        <span class="value">1.2 MB/s</span>
      </div>
      <div class="bw-stat">
        <span class="arrow down">↓</span>
        <span class="value">3.4 MB/s</span>
      </div>
      <div class="bw-total">
        <span class="label">Session</span>
        <span class="value">248 MB</span>
      </div>
    </div>
  `}function Ce(e,t){fe(e.canvas,a=>{e.canvas=a,t.updateCanvas(a)}),document.querySelectorAll('[data-action="classic-mode"]').forEach(a=>{a.addEventListener("click",()=>{t.toggleLayoutMode()})}),document.querySelectorAll(".conv-mini[data-conv-id]").forEach(a=>{a.addEventListener("click",()=>{})})}function Ae(e,t){const a=e.peerId?`${e.peerId.slice(0,8)}...`:"Not connected",n=e.network==="mainnet";return`
    <div class="main-app">
      <header class="header">
        <div class="logo-small">CIN<span>Q</span></div>
        <div class="header-right">
          <button class="layout-toggle-btn" id="toggle-layout" title="Switch to Canvas Mode">
            📐 Canvas
          </button>
          <div class="network-badge ${n?"mainnet":"testnet"}">
            ${n?"🔴 MAINNET":"🧪 TESTNET"}
          </div>
          <div class="status">
            <span class="status-dot ${e.nodeRunning?"online":"offline"}"></span>
            <span>${e.nodeRunning?"Connected":"Offline"}</span>
          </div>
        </div>
      </header>
      
      <div class="app-container">
        <!-- App Dock - Left Edge -->
        ${_e(e)}
        
        <div class="dashboard-layout">
          <!-- Left Gauge Panel -->
          <div class="gauge-panel">
            ${Te(e,n)}
            ${Le(e)}
            ${We()}
            ${Be()}
            ${Ne(e)}
            ${Pe(e,a)}
          </div>
          
          <!-- Main Content - Tabbed: Messages / Qora -->
          <div class="main-content">
            <div class="content-tabs">
              <button class="tab-btn ${e.activeTab==="messages"?"active":""}" data-tab="messages">💬 Messages</button>
              <button class="tab-btn ${e.activeTab==="qora"?"active":""}" data-tab="qora">🤖 Qora</button>
            </div>
            
            <!-- Messages Tab -->
            <div class="tab-content ${e.activeTab==="messages"?"active":""}" id="tab-messages">
              <div class="card chat-card">
                <div class="chat-card-header">
                  <h3>💬 Messages</h3>
                  <div class="chat-id-badge">
                    <span>Your ID: </span>
                    <code id="user-id-display">${e.userIdDisplay||"Loading..."}</code>
                    <button id="copy-user-id" class="btn-icon" title="Copy Chat ID">📋</button>
                  </div>
                </div>
                ${De(e)}
              </div>
            </div>
            
            <!-- Qora Tab -->
            <div class="tab-content ${e.activeTab==="qora"?"active":""}" id="tab-qora">
              ${xe(e)}
            </div>
          </div>
        </div>
      </div>
      
      ${Qe(e)}
      ${e.apps.showLauncher?Se(e):""}
    </div>
  `}function _e(e){return`
    <div class="app-dock">
      ${(e.apps.pinnedApps.length>0?e.apps.pinnedApps:e.apps.apps.filter(a=>a.pinned)).map(a=>`
        <button 
          class="dock-item ${e.apps.activeApp?.id===a.id?"active":""} ${V(a.status)}"
          data-app-id="${a.id}"
          title="${a.name}"
        >
          <span class="dock-icon">${a.icon}</span>
          ${a.status==="running"?'<span class="dock-indicator"></span>':""}
        </button>
      `).join("")}
      
      <div class="dock-divider"></div>
      
      <button class="dock-item launcher-btn" data-action="open-launcher" title="All Apps">
        <span class="dock-icon">⊞</span>
      </button>
    </div>
  `}function Se(e){const t=e.apps.apps.filter(n=>n.kind==="builtin"),a=e.apps.apps.filter(n=>n.kind!=="builtin");return`
    <div class="app-launcher-overlay" data-action="close-launcher">
      <div class="app-launcher" onclick="event.stopPropagation()">
        <div class="launcher-header">
          <h2>Apps</h2>
          <button class="launcher-close" data-action="close-launcher">✕</button>
        </div>
        
        <div class="launcher-search">
          <input type="text" id="app-search" placeholder="Search apps..." autocomplete="off">
        </div>
        
        <div class="launcher-grid">
          <div class="app-section">
            <h3>Built-in Apps</h3>
            <div class="app-grid">
              ${t.map(n=>D(n,e.apps.activeApp?.id===n.id)).join("")}
            </div>
          </div>
          
          ${a.length>0?`
            <div class="app-section">
              <h3>Installed Apps</h3>
              <div class="app-grid">
                ${a.map(n=>D(n,e.apps.activeApp?.id===n.id)).join("")}
              </div>
            </div>
          `:""}
          
          <div class="app-section marketplace">
            <h3>Get More Apps</h3>
            <div class="marketplace-cta">
              <span class="marketplace-icon">🏪</span>
              <p>Discover more apps in the cinQ Marketplace</p>
              <button class="btn-secondary" disabled>Coming Soon</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `}function D(e,t){const a=ze(e.status);return`
    <div 
      class="app-tile ${t?"active":""} ${V(e.status)}"
      data-app-id="${e.id}"
    >
      <div class="app-icon">${e.icon}</div>
      <div class="app-name">${e.name}</div>
      ${a?`<div class="app-status">${a}</div>`:""}
    </div>
  `}function V(e){return e==="running"?"running":e==="background"?"background":typeof e=="object"&&"error"in e?"error":""}function ze(e){return e==="running"?"● Running":e==="background"?"○ Background":typeof e=="object"&&"error"in e?"⚠ Error":""}function Le(e){const t=e.qora,a=t.initialized?t.available?"online":"warning":"offline",n=t.initialized?t.available?"Ready":"No Ollama":"Not Init",o=t.tasks.filter(u=>u.status==="Pending").length,c=t.questions.length;return`
    <div class="gauge-card qora-status-card">
      <h4>🤖 Qora Agent</h4>
      <div class="qora-status-row">
        <span class="qora-label">Status</span>
        <span class="qora-value ${a}">${n}</span>
      </div>
      ${t.initialized?`
        <div class="qora-status-row">
          <span class="qora-label">Model</span>
          <span class="qora-value model">${t.model.split(":")[0]||"N/A"}</span>
        </div>
        <div class="qora-status-row">
          <span class="qora-label">Pending</span>
          <span class="qora-value ${o>0?"highlight":""}">${o} tasks</span>
        </div>
        ${c>0?`
          <div class="qora-status-row">
            <span class="qora-label">Questions</span>
            <span class="qora-value urgent">${c} waiting</span>
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
  `}function xe(e){const t=e.qora;return!t.initialized&&t.history.length===0?`
      <div class="card qora-card">
        <div class="qora-init-panel">
          <h3>🤖 Initialize Qora</h3>
          <p>Connect Qora to your local Ollama instance to enable AI-powered development assistance.</p>
          <div class="qora-init-form">
            <div class="form-group">
              <label>Ollama URL</label>
              <input type="text" id="qora-ollama-url" placeholder="http://192.168.4.255:11434" value="http://192.168.4.255:11434">
            </div>
            <div class="form-group">
              <label>Model</label>
              <input type="text" id="qora-model" placeholder="deepseek-coder-v2:16b" value="deepseek-coder-v2:16b">
            </div>
            <button id="qora-init-btn" class="btn-primary">Connect to Ollama</button>
          </div>
        </div>
      </div>
    `:`
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
            `:t.history.map(a=>`
              <div class="qora-message ${a.role}">
                <div class="qora-message-content">${f(a.content)}</div>
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
              ${t.questions.map((a,n)=>`
                <div class="qora-question" data-index="${n}">
                  <div class="question-text">${f(a)}</div>
                  <div class="question-answer">
                    <input type="text" class="question-input" placeholder="Your answer..." data-index="${n}">
                    <button class="btn-answer" data-index="${n}">→</button>
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
                ${t.tasks.map(a=>`
                  <div class="task-item ${a.status.toLowerCase()}">
                    <div class="task-status">${Me(a.status)}</div>
                    <div class="task-info">
                      <div class="task-title">${f(a.title)}</div>
                      <div class="task-desc">${f(a.description.slice(0,50))}${a.description.length>50?"...":""}</div>
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
  `}function Me(e){switch(e){case"Pending":return"⏳";case"InProgress":return"🔄";case"Completed":return"✅";case"Failed":return"❌";case"Blocked":return"🚫";default:return"•"}}function L(e,t){const a=e>80?"red":e>50?"yellow":"green";return`
    <div class="status-bar-row">
      <div class="status-bar-label">
        <span class="label-text">${t}</span>
        <span class="label-value">${e}%</span>
      </div>
      <div class="status-bar">
        <div class="status-bar-fill ${a}" style="width: ${e}%"></div>
      </div>
    </div>
  `}function We(){return`
    <div class="gauge-card">
      <h4>🖥️ System Monitor</h4>
      ${L(12,"CPU")}
      ${L(38,"RAM")}
      ${L(5,"GPU")}
    </div>
  `}function Be(){return`
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
  `}function Ne(e){const t=e.peers.length;return`
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
  `}function Te(e,t){return`
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
          <span class="balance-amount qi">${E(e.balance)}</span>
        </div>
        <div class="balance-row">
          <span class="balance-icon">💎</span>
          <span class="balance-label">Quai</span>
          <span class="balance-amount quai">${G(e.quaiBalance)}</span>
        </div>
      </div>
      <div class="wallet-actions">
        <button id="refresh-balance-btn" class="btn-mini" title="Refresh">↻</button>
        <button id="view-seed-btn" class="btn-mini" title="Recovery Phrase">🔑</button>
      </div>
    </div>
  `}function Pe(e,t){return`
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
  `}function Qe(e,t){const a=e.paymentCode?`${e.paymentCode.slice(0,12)}...`:"N/A",n=e.quaiAddress?`${e.quaiAddress.slice(0,10)}...${e.quaiAddress.slice(-6)}`:"N/A";return`
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
  `}function De(e){return e.chatView==="conversation"&&e.currentConversation?Oe(e):Fe(e)}function Fe(e){const t=e.conversations,a=e.peers;return`
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
                <div class="conv-name">${f(n.display_name)}</div>
                <div class="conv-preview">${f(n.last_message||"No messages yet")}</div>
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
            ${a.slice(0,5).map(n=>{const o=n.chat_id?Re(n.chat_id):"Unknown";return`
              <button class="peer-item" data-peer-id="${n.peer_id}">
                <span class="peer-status">●</span>
                <span class="peer-id">${o}</span>
              </button>
            `}).join("")}
          </div>
        </div>
      `:""}
    </div>
  `}function Oe(e){const t=e.currentConversation,a=e.messages;return`
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
            <div class="message-content">${f(n.content)}</div>
            <div class="message-meta">
              <span class="message-time">${He(n.timestamp)}</span>
              ${n.is_outgoing?`<span class="message-status">${Ue(n.status)}</span>`:""}
            </div>
          </div>
        `).join("")}
      </div>
      
      <div class="message-input-container">
        <input type="text" id="message-input" placeholder="Type a message..." autocomplete="off">
        <button id="send-msg-btn" class="btn-send">Send</button>
      </div>
    </div>
  `}function f(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Re(e){return e.length!==10?e:`${e.slice(0,3)}-${e.slice(3,6)}-${e.slice(6)}`}function He(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function Ue(e){switch(e){case"Pending":return"⏳";case"Sent":return"✓";case"Delivered":return"✓✓";case"Read":return"✓✓";case"Failed":return"✗";default:return""}}function F(e,t){console.log("attachLandingHandlers called, hasSavedWallet:",e.hasSavedWallet,"walletInitialized:",e.walletInitialized);const a=document.getElementById("connect-btn");console.log("connect-btn element:",a?"FOUND":"NOT FOUND"),a?.addEventListener("click",async()=>{const n=document.getElementById("connect-btn");if(!n){console.error("Connect button not found");return}console.log("Connect button clicked, walletInitialized:",e.walletInitialized),n.disabled=!0,n.textContent="Connecting...";try{console.log("Calling startNode..."),await t.startNode(),console.log("startNode completed successfully")}catch(o){console.error("Failed to connect:",o),n.disabled=!1,n.textContent="Connect to Mesh",alert("Failed to connect: "+(o instanceof Error?o.message:String(o)))}}),document.getElementById("use-different-wallet-btn")?.addEventListener("click",async()=>{await t.clearSavedWallet()}),document.getElementById("create-wallet-landing-btn")?.addEventListener("click",async()=>{const n=document.getElementById("create-wallet-landing-btn");n.disabled=!0,n.textContent="Creating...";try{console.log("Creating new wallet...");const{mnemonic:o}=await t.initializeNewWallet();console.log("Wallet created, mnemonic received:",o?"yes":"no");const c=document.getElementById("mnemonic-modal"),u=document.getElementById("mnemonic-words");console.log("Modal element:",c?"found":"NOT FOUND"),console.log("Words element:",u?"found":"NOT FOUND"),c&&u?(u.innerHTML=o.split(" ").map((l,p)=>`<span class="word"><span class="num">${p+1}.</span> ${l}</span>`).join(""),c.classList.remove("hidden"),console.log("Modal should now be visible")):alert(`⚠️ SAVE THESE WORDS:

`+o.split(" ").map((l,p)=>`${p+1}. ${l}`).join(`
`)+`

Click OK after saving.`)}catch(o){console.error("Failed to create wallet:",o),n.disabled=!1,n.textContent="Create New Wallet",alert("Failed to create wallet: "+(o instanceof Error?o.message:String(o)))}}),document.getElementById("import-wallet-landing-btn")?.addEventListener("click",()=>{document.getElementById("import-modal")?.classList.remove("hidden")}),document.getElementById("cancel-import-btn")?.addEventListener("click",()=>{document.getElementById("import-modal")?.classList.add("hidden")}),document.getElementById("confirm-import-btn")?.addEventListener("click",async()=>{const o=document.getElementById("mnemonic-input").value.trim().toLowerCase();if(!o||o.split(/\s+/).length!==12){alert("Please enter a valid 12-word mnemonic.");return}const c=document.getElementById("confirm-import-btn");c.disabled=!0,c.textContent="Importing...";try{await t.restoreWallet(o)}catch(u){console.error("Failed to import wallet:",u),c.disabled=!1,c.textContent="Import",alert("Failed to import wallet. Check your mnemonic.")}}),document.getElementById("confirm-saved-btn")?.addEventListener("click",async()=>{document.getElementById("mnemonic-modal")?.classList.add("hidden");try{await t.startNode()}catch(o){console.error("Failed to connect:",o)}})}let O=!1;function je(e,t){document.body.dataset.network=e.network,document.getElementById("toggle-layout")?.addEventListener("click",()=>{t.toggleLayoutMode()});const a=document.getElementById("network-toggle-btn"),n=document.getElementById("network-dropdown");a&&(a.onclick=i=>{i.preventDefault(),i.stopPropagation(),console.log("Network toggle clicked!"),n?.classList.toggle("hidden")}),document.querySelectorAll(".network-option").forEach(i=>{i.onclick=async r=>{r.preventDefault(),r.stopPropagation();const d=i.dataset.network;if(console.log("Network option clicked:",d),d===e.network){n?.classList.add("hidden");return}if(d==="mainnet"&&!confirm(`⚠️ Switching to MAINNET will use REAL FUNDS.

Are you sure?`)){n?.classList.add("hidden");return}n?.classList.add("hidden"),w(`Switching to ${d==="mainnet"?"Mainnet":"Orchard Testnet"}...`);try{await t.switchNetwork(d),w(`Connected to ${d==="mainnet"?"Mainnet":"Orchard Testnet"}`)}catch(m){console.error("Failed to switch network:",m),w("Failed to switch network")}}}),O||(O=!0,document.addEventListener("click",i=>{const r=i.target,d=document.getElementById("network-dropdown"),m=document.getElementById("network-toggle-btn");d&&!d.contains(r)&&!m?.contains(r)&&d.classList.add("hidden")})),document.getElementById("copy-payment-code")?.addEventListener("click",()=>{e.paymentCode&&(navigator.clipboard.writeText(e.paymentCode),w("Payment code copied!"))}),document.getElementById("copy-quai-address")?.addEventListener("click",()=>{e.quaiAddress&&(navigator.clipboard.writeText(e.quaiAddress),w("Quai address copied!"))}),document.getElementById("copy-user-id")?.addEventListener("click",()=>{e.userId&&(navigator.clipboard.writeText(e.userId),w("Chat ID copied! Share it with friends."))}),document.getElementById("view-seed-btn")?.addEventListener("click",()=>{const i=localStorage.getItem("cinq_mnemonic");if(i){const r=document.getElementById("view-seed-modal"),d=document.getElementById("view-mnemonic-words");r&&d&&(d.innerHTML=i.split(" ").map((m,h)=>`<span class="word"><span class="num">${h+1}.</span> ${m}</span>`).join(""),r.classList.remove("hidden"))}else w("No recovery phrase found")}),document.getElementById("close-seed-modal-btn")?.addEventListener("click",()=>{document.getElementById("view-seed-modal")?.classList.add("hidden")}),document.getElementById("refresh-balance-btn")?.addEventListener("click",async()=>{const i=document.getElementById("refresh-balance-btn");i.disabled=!0,i.textContent="Refreshing...";try{await t.refreshBalance()}finally{i.disabled=!1,i.textContent="Refresh Balance"}}),document.getElementById("disconnect-btn")?.addEventListener("click",async()=>{await t.stopNode()}),t.getConversations(),document.querySelectorAll(".conversation-item").forEach(i=>{i.addEventListener("click",()=>{const r=i.dataset.convId;i.dataset.peerId;const d=e.conversations.find(m=>m.id===r);d&&t.openConversation(d)})}),document.querySelectorAll(".peer-item").forEach(i=>{i.addEventListener("click",()=>{const r=i.dataset.peerId;r&&t.startConversation(r)})}),document.getElementById("back-to-list-btn")?.addEventListener("click",()=>{t.backToConversationList()});const o=async()=>{const i=document.getElementById("message-input"),r=i.value.trim();if(!r||!e.currentConversation)return;const d=e.currentConversation.peer_id;i.value="",i.focus(),await t.sendMessage(d,r);const m=document.getElementById("messages-container");m&&(m.scrollTop=m.scrollHeight)};document.getElementById("send-msg-btn")?.addEventListener("click",o),document.getElementById("message-input")?.addEventListener("keypress",i=>{i.key==="Enter"&&o()}),document.getElementById("new-chat-btn")?.addEventListener("click",()=>{const i=prompt("Enter Chat ID (e.g., 555-123-4567):");i&&i.trim()&&t.startConversation(i.trim())});const c=document.getElementById("messages-container");c&&(c.scrollTop=c.scrollHeight),document.querySelectorAll(".tab-btn").forEach(i=>{i.addEventListener("click",()=>{const r=i.dataset.tab;r&&t.setActiveTab(r)})}),document.querySelectorAll(".dock-item[data-app-id]").forEach(i=>{i.addEventListener("click",()=>{const r=i.getAttribute("data-app-id");r&&t.launchApp(r)})}),document.querySelectorAll('[data-action="open-launcher"]').forEach(i=>{i.addEventListener("click",()=>t.toggleAppLauncher())}),document.querySelectorAll('[data-action="close-launcher"]').forEach(i=>{i.addEventListener("click",r=>{r.target===i&&t.toggleAppLauncher()})}),document.querySelectorAll(".app-tile[data-app-id]").forEach(i=>{i.addEventListener("click",()=>{const r=i.getAttribute("data-app-id");r&&(t.launchApp(r),t.toggleAppLauncher())})});const u=document.getElementById("app-search");u&&u.addEventListener("input",()=>{const i=u.value.toLowerCase();document.querySelectorAll(".app-tile").forEach(r=>{const d=r.querySelector(".app-name")?.textContent?.toLowerCase()||"";r.style.display=d.includes(i)?"":"none"})}),document.getElementById("init-qora-btn")?.addEventListener("click",async()=>{w("Initializing Qora..."),await t.qoraInit(),await t.qoraGetTasks(),await t.qoraGetHistory()}),document.getElementById("qora-init-btn")?.addEventListener("click",async()=>{const i=document.getElementById("qora-ollama-url"),r=document.getElementById("qora-model"),d=document.getElementById("qora-init-btn");d.disabled=!0,d.textContent="Connecting...";try{await t.qoraInit(i.value||void 0,r.value||void 0),await t.qoraGetTasks(),await t.qoraGetHistory(),w("Qora connected!")}catch{w("Failed to connect to Ollama"),d.disabled=!1,d.textContent="Connect to Ollama"}});const l=async()=>{const i=document.getElementById("qora-input"),r=i.value.trim();if(r){i.value="",i.disabled=!0;try{await t.qoraChat(r);const d=document.getElementById("qora-chat-messages");d&&(d.scrollTop=d.scrollHeight)}finally{i.disabled=!1,i.focus()}}};document.getElementById("qora-send-btn")?.addEventListener("click",l),document.getElementById("qora-input")?.addEventListener("keypress",i=>{i.key==="Enter"&&l()}),document.getElementById("qora-work-btn")?.addEventListener("click",async()=>{w("Qora is working..."),await t.qoraWork()&&w("Task completed!")}),document.getElementById("qora-work-all-btn")?.addEventListener("click",async()=>{if(!confirm("Start Qora grinding through all tasks? This may take a while."))return;w("Qora is grinding...");const r=await t.qoraWorkAll();r&&w(r)}),document.getElementById("add-task-btn")?.addEventListener("click",()=>{document.getElementById("add-task-modal")?.classList.remove("hidden")}),document.getElementById("cancel-task-btn")?.addEventListener("click",()=>{document.getElementById("add-task-modal")?.classList.add("hidden")}),document.getElementById("confirm-task-btn")?.addEventListener("click",async()=>{const i=document.getElementById("task-title"),r=document.getElementById("task-description"),d=i.value.trim(),m=r.value.trim();if(!d||!m){w("Please fill in both title and description");return}const h=document.getElementById("confirm-task-btn");h.disabled=!0;try{await t.qoraAddTask(d,m),i.value="",r.value="",document.getElementById("add-task-modal")?.classList.add("hidden"),w("Task added!")}finally{h.disabled=!1}}),document.querySelectorAll(".btn-answer").forEach(i=>{i.addEventListener("click",async()=>{const r=parseInt(i.dataset.index||"0"),m=document.querySelector(`.question-input[data-index="${r}"]`)?.value.trim();if(!m){w("Please enter an answer");return}i.disabled=!0;try{await t.qoraAnswerQuestion(r,m),w("Answer submitted!")}finally{i.disabled=!1}})});const p=document.getElementById("qora-chat-messages");p&&(p.scrollTop=p.scrollHeight)}function w(e){const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.classList.add("show"),10),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},3e3)}const Ge={apps:[],pinnedApps:[],activeApp:null,showLauncher:!1};async function Y(){try{return(await g("apps_list")).data||[]}catch(e){return console.error("Failed to list apps:",e),[]}}async function J(){try{return(await g("apps_pinned")).data||[]}catch(e){return console.error("Failed to get pinned apps:",e),[]}}async function Ve(){try{return(await g("apps_active")).data}catch(e){return console.error("Failed to get active app:",e),null}}async function Ye(e){try{return(await g("apps_launch",{appId:e})).data}catch(t){return console.error("Failed to launch app:",t),null}}const s={nodeRunning:!1,peerId:null,peers:[],userId:null,userIdDisplay:null,walletInitialized:!1,paymentCode:null,quaiAddress:null,balance:0n,quaiBalance:0n,hasSavedWallet:!1,network:localStorage.getItem("cinq_network")||"orchard",currentView:"landing",conversations:[],currentConversation:null,messages:[],chatView:"list",qora:{initialized:!1,available:!1,model:"",tasks:[],questions:[],history:JSON.parse(localStorage.getItem("cinq_qora_history")||"[]"),chatInput:"",isWorking:!1},activeTab:"messages",layoutMode:localStorage.getItem("cinq_layout_mode")||"classic",apps:Ge,canvas:ye()};async function Je(){try{const e=await g("get_user_id");return e.success&&e.data?(s.userId=e.data.user_id,s.userIdDisplay=e.data.display,e.data):null}catch(e){return console.error("Failed to get user ID:",e),null}}async function Xe(e){try{const t=await g("lookup_user_id",{userId:e});return t.success?t.data:(console.error("Lookup failed:",t.error),null)}catch(t){return console.error("Failed to lookup user ID:",t),null}}async function R(){try{const e=localStorage.getItem("cinq_mnemonic")||void 0,t=await g("start_node",{seedPhrase:e});if(!t.success||!t.data)throw new Error(t.error||"Failed to start node");s.nodeRunning=!0,s.peerId=t.data,await Je(),await Ke(),v(),console.log("Node started:",t.data),console.log("User ID:",s.userIdDisplay)}catch(e){throw console.error("Failed to start node:",e),e}}async function Ke(){try{const[e,t,a]=await Promise.all([Y(),J(),Ve()]);s.apps.apps=e,s.apps.pinnedApps=t,s.apps.activeApp=a,console.log("Apps loaded:",e.length,"apps")}catch(e){console.error("Failed to load apps:",e)}}async function Ze(e){const t=await Ye(e);t&&(s.apps.activeApp=t,s.apps.apps=await Y(),s.apps.pinnedApps=await J(),e==="cinq.chat"?s.activeTab="messages":(e==="cinq.qora"||e==="cinq.compute")&&(s.activeTab="qora"),v())}function et(){s.apps.showLauncher=!s.apps.showLauncher,v()}function tt(){s.layoutMode=s.layoutMode==="classic"?"canvas":"classic",localStorage.setItem("cinq_layout_mode",s.layoutMode),v()}function at(e){s.canvas={...s.canvas,...e},v()}async function nt(){try{const e=await g("stop_node");e.success||console.warn("Stop node warning:",e.error),s.nodeRunning=!1,s.peerId=null,s.userId=null,s.userIdDisplay=null,s.peers=[],v(),console.log("Node stopped")}catch(e){throw console.error("Failed to stop node:",e),e}}async function st(){try{const e=await g("get_peers");return e.success&&e.data?(s.peers=e.data,v(),s.peers):[]}catch(e){return console.error("Failed to get peers:",e),[]}}async function X(){try{const e=await g("get_conversations");return e.success&&e.data?(s.conversations=e.data,e.data):[]}catch(e){return console.error("Failed to get conversations:",e),[]}}async function K(e){try{const t=await g("get_messages",{conversationId:e,limit:100});return t.success&&t.data?(s.messages=t.data.reverse(),s.messages):[]}catch(t){return console.error("Failed to get messages:",t),[]}}async function it(e,t){try{const a=await g("worker_send_message",{peerId:e,content:t});a.success&&a.data&&console.log(`Message metered: ${a.data.bytes_processed} bytes, ${a.data.qi_cost} Qi`);const n=await g("send_message",{peerId:e,content:t});return n.success&&n.data?(s.messages.push(n.data),await X(),v(),n.data):(console.error("Send message failed:",n.error),null)}catch(a){return console.error("Failed to send message:",a),null}}async function ot(e){let t=e,a=e;const n=e.replace(/-/g,"").replace(/\s/g,"");if(n.length===10&&/^\d+$/.test(n)){const o=await Xe(n);if(o)t=o,a=`${n.slice(0,3)}-${n.slice(3,6)}-${n.slice(6)}`;else{console.error("User ID not found:",n),alert(`User ID ${a} not found. They need to be online first.`);return}}else t.length>12&&(a=t.slice(0,12)+"...");await rt(t,a)}async function rt(e,t){const a=t||(e.length>12?e.slice(0,12)+"...":e);try{let n=s.conversations.find(o=>o.peer_id===e);n||(n={id:"new-"+e,peer_id:e,display_name:a,last_message:null,last_message_at:null,unread_count:0},s.conversations.unshift(n)),s.currentConversation=n,s.messages=[],s.chatView="conversation",n.id.startsWith("new-")||await K(n.id),v()}catch(n){console.error("Failed to start conversation:",n)}}function dt(e){s.currentConversation=e,s.chatView="conversation",K(e.id).then(()=>v())}function lt(){s.currentConversation=null,s.chatView="list",s.messages=[],v()}async function ct(e,t){try{const a=await g("qora_init",{ollamaUrl:e||null,model:t||null});return a.success&&a.data?(s.qora.initialized=a.data.initialized,s.qora.available=a.data.ollama_available,s.qora.model=a.data.model,s.qora.questions=a.data.pending_questions,console.log("Qora initialized:",a.data),v(),a.data):(console.error("Qora init failed:",a.error),null)}catch(a){return console.error("Failed to initialize Qora:",a),null}}async function ut(){try{const e=await g("qora_status");return e.success&&e.data?(s.qora.initialized=e.data.initialized,s.qora.available=e.data.ollama_available,s.qora.model=e.data.model,s.qora.questions=e.data.pending_questions,e.data):null}catch(e){return console.error("Failed to get Qora status:",e),null}}function C(){const e=s.qora.history.slice(-100);localStorage.setItem("cinq_qora_history",JSON.stringify(e))}async function pt(e){try{s.qora.chatInput="",s.qora.history.push({role:"user",content:e}),C(),v();const t=await g("qora_chat",{message:e});return t.success&&t.data?(s.qora.history.push({role:"assistant",content:t.data}),C(),v(),t.data):(console.error("Qora chat failed:",t.error),s.qora.history.pop(),C(),v(),null)}catch(t){return console.error("Failed to chat with Qora:",t),s.qora.history.pop(),C(),v(),null}}async function mt(e,t){try{const a=await g("qora_add_task",{title:e,description:t});return a.success&&a.data?(s.qora.tasks.push(a.data),v(),a.data):(console.error("Add task failed:",a.error),null)}catch(a){return console.error("Failed to add task:",a),null}}async function T(){try{const e=await g("qora_get_tasks");return e.success&&e.data?(s.qora.tasks=e.data,e.data):[]}catch(e){return console.error("Failed to get tasks:",e),[]}}async function vt(){try{s.qora.isWorking=!0,v();const e=await g("qora_work");return s.qora.isWorking=!1,e.success?(await T(),await S(),v(),e.data):(console.error("Work failed:",e.error),v(),null)}catch(e){return console.error("Failed to work:",e),s.qora.isWorking=!1,v(),null}}async function gt(){try{s.qora.isWorking=!0,v(),A("Qora is grinding through tasks...");const e=await g("qora_work_all");return s.qora.isWorking=!1,e.success&&e.data?(await T(),await S(),v(),A("Qora finished working!"),e.data):(console.error("Work all failed:",e.error),v(),null)}catch(e){return console.error("Failed to work all:",e),s.qora.isWorking=!1,v(),null}}async function S(){try{const e=await g("qora_get_questions");return e.success&&e.data?(s.qora.questions=e.data,e.data):[]}catch(e){return console.error("Failed to get questions:",e),[]}}async function ht(e,t){try{const a=await g("qora_answer_question",{questionIndex:e,answer:t});return a.success&&a.data?(await S(),v(),a.data):(console.error("Answer failed:",a.error),null)}catch(a){return console.error("Failed to answer question:",a),null}}async function wt(){try{const e=await g("qora_get_history");return e.success&&e.data?(s.qora.history=e.data.filter(t=>t.role!=="system"),s.qora.history):[]}catch(e){return console.error("Failed to get history:",e),[]}}async function Z(e){try{const t=await g("qora_process",{input:e});return t.success&&t.data?(console.log("Qora processed:",t.data.intent,"->",t.data.message),t.data):(console.error("Qora process failed:",t.error),null)}catch(t){return console.error("Failed to process with Qora:",t),null}}async function ft(e,t){const a=await Z(e);if(!a)return null;if(a.suggested_action&&a.confidence>.7)switch(a.intent){case"SendMessage":break;case"CheckBalance":await I();break;case"CheckUsage":console.log("Usage check requested");break}return a.message}function yt(e){s.activeTab=e,v()}async function bt(){try{(await g("reset_identity")).success&&console.log("Identity reset - new Chat ID and Mesh ID will be generated")}catch(t){console.warn("Could not reset identity (node may need to be stopped first):",t)}const e=await ne({network:s.network});return s.walletInitialized=!0,s.hasSavedWallet=!0,s.paymentCode=e.paymentCode,s.quaiAddress=e.quaiAddress,localStorage.setItem("cinq_mnemonic",e.mnemonic),localStorage.setItem("cinq_wallet",await W()),localStorage.setItem("cinq_network",s.network),re(t=>{console.log("Received payment:",E(t.amount)),I(),A(`Received ${E(t.amount)}`)}),_(),e}async function qt(e){const{paymentCode:t,quaiAddress:a}=await U(e,{network:s.network});s.walletInitialized=!0,s.hasSavedWallet=!0,s.paymentCode=t,s.quaiAddress=a,localStorage.setItem("cinq_mnemonic",e),localStorage.setItem("cinq_wallet",await W()),localStorage.setItem("cinq_network",s.network),await I(),_(),v()}async function It(e){if(e===s.network)return;const t=localStorage.getItem("cinq_mnemonic");if(!t){console.error("No mnemonic found");return}oe(),s.network=e,localStorage.setItem("cinq_network",e);try{const{paymentCode:a,quaiAddress:n}=await U(t,{network:e});s.paymentCode=a,s.quaiAddress=n,s.balance=0n,localStorage.setItem("cinq_wallet",await W()),await I(),_(),A(`Switched to ${e==="mainnet"?"Mainnet":"Orchard Testnet"}`)}catch(a){console.error("Failed to switch network:",a),s.network=e==="mainnet"?"orchard":"mainnet",localStorage.setItem("cinq_network",s.network)}v()}async function kt(){try{(await g("reset_identity")).success&&console.log("Identity reset with wallet clear")}catch(e){console.warn("Could not reset identity:",e)}localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic"),s.walletInitialized=!1,s.hasSavedWallet=!1,s.paymentCode=null,s.quaiAddress=null,s.balance=0n,v()}async function I(){if(s.walletInitialized)try{const[e,t]=await Promise.all([M(),se()]);s.balance=e.balance,s.quaiBalance=t,v()}catch(e){console.error("Failed to refresh balance:",e)}}function v(){const e=document.getElementById("qora-input");e&&(s.qora.chatInput=e.value);const a=document.getElementById("chat-input")?.value||"";be(s,{startNode:R,stopNode:nt,initializeNewWallet:bt,restoreWallet:qt,refreshBalance:I,sendPayment:ie,formatQi:E,connectWithSavedWallet:async()=>{await R()},clearSavedWallet:kt,switchNetwork:It,getConversations:X,openConversation:dt,backToConversationList:lt,sendMessage:it,startConversation:ot,qoraInit:ct,qoraStatus:ut,qoraChat:pt,qoraAddTask:mt,qoraGetTasks:T,qoraWork:vt,qoraWorkAll:gt,qoraGetQuestions:S,qoraAnswerQuestion:ht,qoraGetHistory:wt,qoraProcess:Z,processWithQora:ft,setActiveTab:yt,launchApp:Ze,toggleAppLauncher:et,toggleLayoutMode:tt,updateCanvas:at});const n=document.getElementById("qora-input");n&&s.qora.chatInput&&(n.value=s.qora.chatInput);const o=document.getElementById("chat-input");o&&a&&(o.value=a)}function A(e){console.log("Notification:",e);const t=document.createElement("div");t.className="notification",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),5e3)}async function Et(){console.log("cinQ initializing...");const e=localStorage.getItem("cinq_wallet"),t=localStorage.getItem("cinq_mnemonic");if(s.hasSavedWallet=!!(e&&t),e&&t)try{await ce(e,t,{network:s.network}),s.walletInitialized=!0,s.paymentCode=de(),s.quaiAddress=le(),I().catch(a=>console.warn("Balance refresh failed:",a)),_(),console.log("Restored wallet:",s.paymentCode?.slice(0,20)+"...")}catch(a){console.error("Failed to restore wallet:",a),localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic"),s.hasSavedWallet=!1}v(),setInterval(()=>{s.nodeRunning&&st()},1e4)}document.addEventListener("DOMContentLoaded",Et);
