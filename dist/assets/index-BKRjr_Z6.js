const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-DdWtFa2V.js","assets/index-HKvGY2Qw.js"])))=>i.map(i=>d[i]);
(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const u of o)if(u.type==="childList")for(const d of u.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&n(d)}).observe(document,{childList:!0,subtree:!0});function a(o){const u={};return o.integrity&&(u.integrity=o.integrity),o.referrerPolicy&&(u.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?u.credentials="include":o.crossOrigin==="anonymous"?u.credentials="omit":u.credentials="same-origin",u}function n(o){if(o.ep)return;o.ep=!0;const u=a(o);fetch(o.href,u)}})();async function g(e,t={},a){return window.__TAURI_INTERNALS__.invoke(e,t,a)}const te="modulepreload",ae=function(e){return"/"+e},P={},q=function(t,a,n){let o=Promise.resolve();if(a&&a.length>0){document.getElementsByTagName("link");const d=document.querySelector("meta[property=csp-nonce]"),c=d?.nonce||d?.getAttribute("nonce");o=Promise.allSettled(a.map(p=>{if(p=ae(p),p in P)return;P[p]=!0;const i=p.endsWith(".css"),r=i?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${p}"]${r}`))return;const l=document.createElement("link");if(l.rel=i?"stylesheet":te,i||(l.as="script"),l.crossOrigin="",l.href=p,c&&l.setAttribute("nonce",c),document.head.appendChild(l),i)return new Promise((m,h)=>{l.addEventListener("load",m),l.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${p}`)))})}))}function u(d){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=d,window.dispatchEvent(c),!c.defaultPrevented)throw d}return o.then(d=>{for(const c of d||[])c.status==="rejected"&&u(c.reason);return t().catch(u)})},x={network:"orchard",pollingInterval:3e4};let y={initialized:!1,paymentCode:null,quaiAddress:null,balance:0n,utxoCount:0,zone:"Cyprus1"},H=[],ne=[];async function se(e={}){const t={...x,...e};try{const{QiAgentWallet:a}=await q(async()=>{const{QiAgentWallet:l}=await import("./index-DdWtFa2V.js").then(m=>m.i);return{QiAgentWallet:l}},__vite__mapDeps([0,1])),{Mnemonic:n,HDNodeWallet:o}=await q(async()=>{const{Mnemonic:l,HDNodeWallet:m}=await import("./index-HKvGY2Qw.js").then(h=>h.e);return{Mnemonic:l,HDNodeWallet:m}},[]),{wallet:u,mnemonic:d}=await a.create({network:t.network,pollingInterval:t.pollingInterval}),c=u.getPaymentCode(),p=n.fromPhrase(d),r=o.fromMnemonic(p,"m/44'/994'/0'/0/0").address;return y={initialized:!0,paymentCode:c,quaiAddress:r,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=u,window.__cinqMnemonic=d,u.onPaymentReceived(l=>{const m={amount:l.amount,senderPaymentCode:l.senderPaymentCode,txHash:l.txHash||"",timestamp:Date.now()};H.forEach(h=>h(m))}),u.onSenderDiscovered(l=>{ne.forEach(m=>m(l))}),{mnemonic:d,paymentCode:c,quaiAddress:r}}catch(a){throw console.error("Failed to create wallet:",a),new Error(`Wallet creation failed: ${a}`)}}async function U(e,t={}){const a={...x,...t};try{const{QiAgentWallet:n}=await q(async()=>{const{QiAgentWallet:m}=await import("./index-DdWtFa2V.js").then(h=>h.i);return{QiAgentWallet:m}},__vite__mapDeps([0,1])),{Mnemonic:o,HDNodeWallet:u}=await q(async()=>{const{Mnemonic:m,HDNodeWallet:h}=await import("./index-HKvGY2Qw.js").then(b=>b.e);return{Mnemonic:m,HDNodeWallet:h}},[]),d=await n.fromMnemonic(e,{network:a.network,pollingInterval:a.pollingInterval}),c=d.getPaymentCode(),p=o.fromPhrase(e),r=u.fromMnemonic(p,"m/44'/994'/0'/0/0").address;await d.sync();const l=await d.getBalance();return y={initialized:!0,paymentCode:c,quaiAddress:r,balance:l.balance,utxoCount:l.utxoCount,zone:"Cyprus1"},window.__cinqWallet=d,window.__cinqMnemonic=e,{paymentCode:c,quaiAddress:r}}catch(n){throw console.error("Failed to import wallet:",n),new Error(`Wallet import failed: ${n}`)}}async function M(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=await e.getBalance();return y.balance=t.balance,y.utxoCount=t.utxoCount,t}async function ie(){try{const{JsonRpcProvider:e}=await q(async()=>{const{JsonRpcProvider:d}=await import("./index-HKvGY2Qw.js").then(c=>c.e);return{JsonRpcProvider:d}},[]),t=y.quaiAddress;if(!t)return 0n;const n=(localStorage.getItem("cinq_network")||"orchard")==="mainnet"?"https://rpc.quai.network":"https://rpc.orchard.quai.network";return await new e(n).getBalance(t)}catch(e){return console.error("Failed to get Quai balance:",e),0n}}async function oe(e,t){const a=window.__cinqWallet;if(!a)throw new Error("Wallet not initialized");try{const n=await a.send(e,t);return await M(),{qiTxHash:n.qiTxHash,notifyTxHash:n.notifyTxHash,amount:t,recipient:e}}catch(n){throw console.error("Payment failed:",n),new Error(`Payment failed: ${n}`)}}function _(e){const t=window.__cinqWallet;if(!t)throw new Error("Wallet not initialized");t.startPolling(e)}function re(){const e=window.__cinqWallet;e&&e.stopPolling()}function le(e){H.push(e)}function de(){return y.paymentCode}function ce(){return y.quaiAddress}async function B(){const e=window.__cinqWallet;if(!e)throw new Error("Wallet not initialized");const t=e.serialize();return JSON.stringify(t)}async function ue(e,t,a={}){const n={...x,...a};try{const{QiAgentWallet:o}=await q(async()=>{const{QiAgentWallet:h}=await import("./index-DdWtFa2V.js").then(b=>b.i);return{QiAgentWallet:h}},__vite__mapDeps([0,1])),{Mnemonic:u,HDNodeWallet:d}=await q(async()=>{const{Mnemonic:h,HDNodeWallet:b}=await import("./index-HKvGY2Qw.js").then(ee=>ee.e);return{Mnemonic:h,HDNodeWallet:b}},[]),c=JSON.parse(e),p=await o.deserialize(c,t,{network:n.network,pollingInterval:n.pollingInterval}),i=p.getPaymentCode(),r=u.fromPhrase(t),m=d.fromMnemonic(r,"m/44'/994'/0'/0/0").address;return y={initialized:!0,paymentCode:i,quaiAddress:m,balance:0n,utxoCount:0,zone:"Cyprus1"},window.__cinqWallet=p,window.__cinqMnemonic=t,await p.sync(),await M(),i}catch(o){throw console.error("Failed to deserialize wallet:",o),new Error(`Wallet restore failed: ${o}`)}}function E(e){const t=e.toString().padStart(19,"0"),a=t.slice(0,-18)||"0",n=t.slice(-18,-14);return`${a}.${n} Qi`}const W={tactical:{name:"🎖️ Tactical",gridSize:20,widgets:[{id:"w1",appId:"cinq.chat",x:0,y:0,width:20,height:25,minimized:!1,zIndex:1},{id:"w2",appId:"cinq.wallet",x:20,y:0,width:15,height:10,minimized:!1,zIndex:2},{id:"w3",appId:"cinq.compute",x:20,y:10,width:15,height:15,minimized:!1,zIndex:3},{id:"w4",appId:"system.monitor",x:35,y:0,width:15,height:12,minimized:!1,zIndex:4},{id:"w5",appId:"system.network",x:35,y:12,width:15,height:13,minimized:!1,zIndex:5}]},minimal:{name:"✨ Minimal",gridSize:20,widgets:[{id:"w1",appId:"cinq.chat",x:10,y:2,width:30,height:22,minimized:!1,zIndex:1}]},command:{name:"🖥️ Command Center",gridSize:20,widgets:[{id:"w1",appId:"cinq.chat",x:0,y:0,width:18,height:20,minimized:!1,zIndex:1},{id:"w2",appId:"cinq.voice",x:0,y:20,width:18,height:8,minimized:!1,zIndex:2},{id:"w3",appId:"cinq.grid",x:18,y:0,width:18,height:28,minimized:!1,zIndex:3},{id:"w4",appId:"cinq.compute",x:36,y:0,width:14,height:14,minimized:!1,zIndex:4},{id:"w5",appId:"cinq.wallet",x:36,y:14,width:14,height:14,minimized:!1,zIndex:5}]},ops:{name:"📊 Ops Dashboard",gridSize:20,widgets:[{id:"w1",appId:"system.monitor",x:0,y:0,width:16,height:14,minimized:!1,zIndex:1},{id:"w2",appId:"system.bandwidth",x:16,y:0,width:16,height:14,minimized:!1,zIndex:2},{id:"w3",appId:"system.network",x:32,y:0,width:18,height:14,minimized:!1,zIndex:3},{id:"w4",appId:"cinq.compute",x:0,y:14,width:25,height:14,minimized:!1,zIndex:4},{id:"w5",appId:"cinq.wallet",x:25,y:14,width:25,height:14,minimized:!1,zIndex:5}]}};function N(){return`w${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`}function j(e){const t=localStorage.getItem("cinq_dashboard_layout");if(t)try{return JSON.parse(t)}catch(n){console.error("Failed to parse saved layout:",n)}const a=W.tactical;return{id:N(),...a,createdAt:Date.now(),updatedAt:Date.now()}}function I(e){e.updatedAt=Date.now(),localStorage.setItem("cinq_dashboard_layout",JSON.stringify(e))}function pe(e){const t=W[e];if(!t)return console.error("Unknown preset:",e),j();const a={id:N(),...t,createdAt:Date.now(),updatedAt:Date.now()};return I(a),a}function me(e,t){const a=Math.max(0,...e.widgets.map(c=>c.zIndex));let n=0,o=0;const u=new Set(e.widgets.map(c=>`${c.x},${c.y}`));for(;u.has(`${n},${o}`);)n+=5,n>40&&(n=0,o+=5);const d={id:N(),appId:t,x:n,y:o,width:15,height:12,minimized:!1,zIndex:a+1};return e.widgets.push(d),I(e),e}function ve(e,t){return e.widgets=e.widgets.filter(a=>a.id!==t),I(e),e}function $(e,t,a){const n=e.widgets.find(o=>o.id===t);return n&&(Object.assign(n,a),I(e)),e}function z(e,t){const a=Math.max(...e.widgets.map(o=>o.zIndex)),n=e.widgets.find(o=>o.id===t);return n&&(n.zIndex=a+1,I(e)),e}function ge(e,t){const{layout:a,editMode:n,selectedWidget:o}=e;return`
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
              ${Object.entries(W).map(([u,d])=>`
                <button class="preset-item" data-preset="${u}">${d.name}</button>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Canvas grid -->
      <div class="canvas-grid" id="canvas-grid">
        ${a.widgets.map(u=>he(u,t,n,o===u.id,a.gridSize)).join("")}
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
  `}function he(e,t,a,n,o){const u=`
    left: ${e.x*o}px;
    top: ${e.y*o}px;
    width: ${e.width*o}px;
    height: ${e.minimized?32:e.height*o}px;
    z-index: ${e.zIndex};
  `,d=we(e.appId),c=fe(e.appId);return`
    <div 
      class="canvas-widget ${e.minimized?"minimized":""} ${n?"selected":""} ${a?"editable":""}"
      data-widget-id="${e.id}"
      data-app-id="${e.appId}"
      style="${u}"
    >
      <!-- Widget header (draggable) -->
      <div class="widget-header" data-drag-handle="${e.id}">
        <span class="widget-icon">${c}</span>
        <span class="widget-title">${d}</span>
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
  `}function we(e){return{"cinq.chat":"Chat","cinq.voice":"Voice","cinq.grid":"Grid","cinq.compute":"Compute","cinq.wallet":"Wallet","cinq.files":"Files","cinq.settings":"Settings","system.monitor":"System Monitor","system.bandwidth":"Bandwidth","system.network":"Network","system.depin":"DePIN Stats"}[e]||e}function fe(e){return{"cinq.chat":"💬","cinq.voice":"📞","cinq.grid":"🌐","cinq.compute":"⚡","cinq.wallet":"👛","cinq.files":"📁","cinq.settings":"⚙️","system.monitor":"📊","system.bandwidth":"📶","system.network":"🔗","system.depin":"🌍"}[e]||"📦"}function ye(e,t){if(!document.getElementById("canvas-grid"))return;const n=e.layout.gridSize;let o=0,u=0,d=null;document.querySelectorAll("[data-drag-handle]").forEach(c=>{c.addEventListener("mousedown",p=>{const i=p,r=c.dataset.dragHandle,l=e.layout.widgets.find(m=>m.id===r);l&&e.editMode&&(i.preventDefault(),e.dragging=r,e.dragOffset={x:i.clientX-l.x*n,y:i.clientY-l.y*n},d={...l},e.layout=z(e.layout,r),t(e))})}),document.querySelectorAll("[data-resize]").forEach(c=>{c.addEventListener("mousedown",p=>{const i=p,r=c,l=r.dataset.resize,m=r.dataset.handle,h=e.layout.widgets.find(b=>b.id===l);h&&e.editMode&&(i.preventDefault(),i.stopPropagation(),e.resizing=l,e.resizeHandle=m,o=i.clientX,u=i.clientY,d={...h},t(e))})}),document.addEventListener("mousemove",c=>{if(e.dragging&&d){const p=Math.max(0,Math.round((c.clientX-e.dragOffset.x)/n)),i=Math.max(0,Math.round((c.clientY-e.dragOffset.y)/n));e.layout=$(e.layout,e.dragging,{x:p,y:i}),t(e)}if(e.resizing&&e.resizeHandle&&d){const p=Math.round((c.clientX-o)/n),i=Math.round((c.clientY-u)/n);let r={};const l=e.resizeHandle;l.includes("e")&&(r.width=Math.max(5,d.width+p)),l.includes("w")&&(r.x=d.x+p,r.width=Math.max(5,d.width-p)),l.includes("s")&&(r.height=Math.max(4,d.height+i)),l.includes("n")&&(r.y=d.y+i,r.height=Math.max(4,d.height-i)),e.layout=$(e.layout,e.resizing,r),t(e)}}),document.addEventListener("mouseup",()=>{(e.dragging||e.resizing)&&(e.dragging=null,e.resizing=null,e.resizeHandle=null,d=null,I(e.layout),t(e))}),document.querySelectorAll('[data-action="toggle-edit"]').forEach(c=>{c.addEventListener("click",()=>{e.editMode=!e.editMode,t(e)})}),document.querySelectorAll('[data-action="add-widget"]').forEach(c=>{c.addEventListener("click",()=>{const p=document.getElementById("add-widget-modal");p&&(p.style.display="flex")})}),document.querySelectorAll('[data-action="close-modal"]').forEach(c=>{c.addEventListener("click",()=>{const p=document.getElementById("add-widget-modal");p&&(p.style.display="none")})}),document.querySelectorAll(".widget-option[data-app]").forEach(c=>{c.addEventListener("click",()=>{const p=c.dataset.app;e.layout=me(e.layout,p);const i=document.getElementById("add-widget-modal");i&&(i.style.display="none"),t(e)})}),document.querySelectorAll(".preset-item[data-preset]").forEach(c=>{c.addEventListener("click",()=>{const p=c.dataset.preset;e.layout=pe(p),t(e)})}),document.querySelectorAll('[data-action="minimize"]').forEach(c=>{c.addEventListener("click",p=>{p.stopPropagation();const i=c.dataset.widget,r=e.layout.widgets.find(l=>l.id===i);r&&(e.layout=$(e.layout,i,{minimized:!r.minimized}),t(e))})}),document.querySelectorAll('[data-action="maximize"]').forEach(c=>{c.addEventListener("click",p=>{p.stopPropagation();const i=c.dataset.widget;e.layout=$(e.layout,i,{x:0,y:0,width:50,height:28,minimized:!1}),e.layout=z(e.layout,i),t(e)})}),document.querySelectorAll('[data-action="remove"]').forEach(c=>{c.addEventListener("click",p=>{p.stopPropagation();const i=c.dataset.widget;e.layout=ve(e.layout,i),t(e)})}),document.querySelectorAll(".canvas-widget").forEach(c=>{c.addEventListener("mousedown",()=>{const p=c.dataset.widgetId;e.selectedWidget=p,e.layout=z(e.layout,p),t(e)})})}function be(){return{layout:j(),dragging:null,resizing:null,resizeHandle:null,dragOffset:{x:0,y:0},selectedWidget:null,editMode:!1}}function G(e){return e===0n?"0.00 QUAI":(Number(e)/1e18).toFixed(4)+" QUAI"}function qe(e,t){const a=document.getElementById("app");a&&(e.walletInitialized&&e.nodeRunning?e.layoutMode==="canvas"?(a.innerHTML=Ie(e),Ae(e,t)):(a.innerHTML=_e(e),Ge(e,t)):(e.walletInitialized&&e.nodeRunning,a.innerHTML=Q(e),F(e,t)))}function Q(e,t){const a=e.hasSavedWallet;return a&&e.walletInitialized?`
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
    `}function Ie(e,t){return ge(e.canvas,(a,n)=>ke(a,n,e))}function ke(e,t,a,n){const o=a.peerId?`${a.peerId.slice(0,8)}...`:"N/A",u=a.network==="mainnet";switch(e){case"cinq.chat":return`
        <div class="widget-chat">
          <div class="chat-id-mini">
            <span>ID: </span>
            <code>${a.userIdDisplay||"..."}</code>
          </div>
          ${Ee(a)}
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
      `;case"system.monitor":return $e();case"system.bandwidth":return Ce();case"system.network":return`
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
            <span class="value ${u?"mainnet":""}">${u?"Mainnet":"Orchard"}</span>
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
      `;default:return`<div class="widget-empty">Widget: ${e}</div>`}}function Ee(e){return e.chatView==="conversation"&&e.currentConversation?`
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
  `}function $e(){return`
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
  `}function Ce(){return`
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
  `}function Ae(e,t){ye(e.canvas,a=>{e.canvas=a,t.updateCanvas(a)}),document.querySelectorAll('[data-action="classic-mode"]').forEach(a=>{a.addEventListener("click",()=>{t.toggleLayoutMode()})}),document.querySelectorAll(".conv-mini[data-conv-id]").forEach(a=>{a.addEventListener("click",()=>{})})}function _e(e,t){const a=e.peerId?`${e.peerId.slice(0,8)}...`:"Not connected",n=e.network==="mainnet";return`
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
        ${Se(e)}
        
        <div class="dashboard-layout">
          <!-- Left Gauge Panel -->
          <div class="gauge-panel">
            ${Pe(e,n)}
            ${xe(e)}
            ${We()}
            ${Ne()}
            ${Te(e)}
            ${Qe(e,a)}
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
                ${Fe(e)}
              </div>
            </div>
            
            <!-- Qora Tab -->
            <div class="tab-content ${e.activeTab==="qora"?"active":""}" id="tab-qora">
              ${Me(e)}
            </div>
          </div>
        </div>
      </div>
      
      ${De(e)}
      ${e.apps.showLauncher?ze(e):""}
    </div>
  `}function Se(e){return`
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
  `}function ze(e){const t=e.apps.apps.filter(n=>n.kind==="builtin"),a=e.apps.apps.filter(n=>n.kind!=="builtin");return`
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
  `}function D(e,t){const a=Le(e.status);return`
    <div 
      class="app-tile ${t?"active":""} ${V(e.status)}"
      data-app-id="${e.id}"
    >
      <div class="app-icon">${e.icon}</div>
      <div class="app-name">${e.name}</div>
      ${a?`<div class="app-status">${a}</div>`:""}
    </div>
  `}function V(e){return e==="running"?"running":e==="background"?"background":typeof e=="object"&&"error"in e?"error":""}function Le(e){return e==="running"?"● Running":e==="background"?"○ Background":typeof e=="object"&&"error"in e?"⚠ Error":""}function xe(e){const t=e.qora,a=t.initialized?t.available?"online":"warning":"offline",n=t.initialized?t.available?"Ready":"No Ollama":"Not Init",o=t.tasks.filter(d=>d.status==="Pending").length,u=t.questions.length;return`
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
        ${u>0?`
          <div class="qora-status-row">
            <span class="qora-label">Questions</span>
            <span class="qora-value urgent">${u} waiting</span>
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
  `}function Me(e){const t=e.qora;return!t.initialized&&t.history.length===0?`
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
                    <div class="task-status">${Be(a.status)}</div>
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
  `}function Be(e){switch(e){case"Pending":return"⏳";case"InProgress":return"🔄";case"Completed":return"✅";case"Failed":return"❌";case"Blocked":return"🚫";default:return"•"}}function L(e,t){const a=e>80?"red":e>50?"yellow":"green";return`
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
  `}function Ne(){return`
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
  `}function Te(e){const t=e.peers.length;return`
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
  `}function Pe(e,t){return`
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
  `}function Qe(e,t){return`
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
  `}function De(e,t){const a=e.paymentCode?`${e.paymentCode.slice(0,12)}...`:"N/A",n=e.quaiAddress?`${e.quaiAddress.slice(0,10)}...${e.quaiAddress.slice(-6)}`:"N/A";return`
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
  `}function Fe(e){return e.chatView==="conversation"&&e.currentConversation?Re(e):Oe(e)}function Oe(e){const t=e.conversations,a=e.peers;return`
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
            ${a.slice(0,5).map(n=>{const o=n.chat_id?He(n.chat_id):"Unknown";return`
              <button class="peer-item" data-peer-id="${n.peer_id}">
                <span class="peer-status">●</span>
                <span class="peer-id">${o}</span>
              </button>
            `}).join("")}
          </div>
        </div>
      `:""}
    </div>
  `}function Re(e){const t=e.currentConversation,a=e.messages,{sessionCost:n}=e,o=d=>d<1024?`${d} B`:d<1024*1024?`${(d/1024).toFixed(2)} KB`:`${(d/(1024*1024)).toFixed(2)} MB`,u=d=>d.toFixed(6);return`
    <div class="chat-container conversation-view">
      <div class="chat-header">
        <button id="back-to-list-btn" class="btn-icon">←</button>
        <div class="conv-title">
          <span class="conv-name">${t.display_name}</span>
          <span class="conv-status">● Online</span>
        </div>
      </div>
      
      <!-- Session Cost Bar - Shows relay economics -->
      <div class="session-cost-bar">
        <div class="cost-item">
          <span class="cost-label">📤 Sent</span>
          <span class="cost-value">${o(n.totalBytesSent)}</span>
        </div>
        <div class="cost-item">
          <span class="cost-label">💬 Messages</span>
          <span class="cost-value">${n.messageCount}</span>
        </div>
        <div class="cost-item highlight">
          <span class="cost-label">⚡ Relay Cost</span>
          <span class="cost-value qi-amount">${u(n.totalQiCost)} Qi</span>
        </div>
        ${n.lastMessageCost?`
          <div class="cost-item last-msg">
            <span class="cost-label">Last msg</span>
            <span class="cost-value">${o(n.lastMessageCost.bytes)} → ${u(n.lastMessageCost.qi)} Qi</span>
          </div>
        `:""}
      </div>
      
      <div class="messages-container" id="messages-container">
        ${a.length===0?`
          <div class="chat-empty">
            <p>No messages yet</p>
            <p class="chat-hint">Send the first message!</p>
          </div>
        `:a.map(d=>`
          <div class="message ${d.is_outgoing?"outgoing":"incoming"}">
            <div class="message-content">${f(d.content)}</div>
            <div class="message-meta">
              <span class="message-time">${Ue(d.timestamp)}</span>
              ${d.is_outgoing?`<span class="message-status">${je(d.status)}</span>`:""}
            </div>
          </div>
        `).join("")}
      </div>
      
      <div class="message-input-container">
        <input type="text" id="message-input" placeholder="Type a message..." autocomplete="off">
        <button id="send-msg-btn" class="btn-send">Send</button>
      </div>
    </div>
  `}function f(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function He(e){return e.length!==10?e:`${e.slice(0,3)}-${e.slice(3,6)}-${e.slice(6)}`}function Ue(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}function je(e){switch(e){case"Pending":return"⏳";case"Sent":return"✓";case"Delivered":return"✓✓";case"Read":return"✓✓";case"Failed":return"✗";default:return""}}function F(e,t){console.log("attachLandingHandlers called, hasSavedWallet:",e.hasSavedWallet,"walletInitialized:",e.walletInitialized);const a=document.getElementById("connect-btn");console.log("connect-btn element:",a?"FOUND":"NOT FOUND"),a?.addEventListener("click",async()=>{const n=document.getElementById("connect-btn");if(!n){console.error("Connect button not found");return}console.log("Connect button clicked, walletInitialized:",e.walletInitialized),n.disabled=!0,n.textContent="Connecting...";try{console.log("Calling startNode..."),await t.startNode(),console.log("startNode completed successfully")}catch(o){console.error("Failed to connect:",o),n.disabled=!1,n.textContent="Connect to Mesh",alert("Failed to connect: "+(o instanceof Error?o.message:String(o)))}}),document.getElementById("use-different-wallet-btn")?.addEventListener("click",async()=>{await t.clearSavedWallet()}),document.getElementById("create-wallet-landing-btn")?.addEventListener("click",async()=>{const n=document.getElementById("create-wallet-landing-btn");n.disabled=!0,n.textContent="Creating...";try{console.log("Creating new wallet...");const{mnemonic:o}=await t.initializeNewWallet();console.log("Wallet created, mnemonic received:",o?"yes":"no");const u=document.getElementById("mnemonic-modal"),d=document.getElementById("mnemonic-words");console.log("Modal element:",u?"found":"NOT FOUND"),console.log("Words element:",d?"found":"NOT FOUND"),u&&d?(d.innerHTML=o.split(" ").map((c,p)=>`<span class="word"><span class="num">${p+1}.</span> ${c}</span>`).join(""),u.classList.remove("hidden"),console.log("Modal should now be visible")):alert(`⚠️ SAVE THESE WORDS:

`+o.split(" ").map((c,p)=>`${p+1}. ${c}`).join(`
`)+`

Click OK after saving.`)}catch(o){console.error("Failed to create wallet:",o),n.disabled=!1,n.textContent="Create New Wallet",alert("Failed to create wallet: "+(o instanceof Error?o.message:String(o)))}}),document.getElementById("import-wallet-landing-btn")?.addEventListener("click",()=>{document.getElementById("import-modal")?.classList.remove("hidden")}),document.getElementById("cancel-import-btn")?.addEventListener("click",()=>{document.getElementById("import-modal")?.classList.add("hidden")}),document.getElementById("confirm-import-btn")?.addEventListener("click",async()=>{const o=document.getElementById("mnemonic-input").value.trim().toLowerCase();if(!o||o.split(/\s+/).length!==12){alert("Please enter a valid 12-word mnemonic.");return}const u=document.getElementById("confirm-import-btn");u.disabled=!0,u.textContent="Importing...";try{await t.restoreWallet(o)}catch(d){console.error("Failed to import wallet:",d),u.disabled=!1,u.textContent="Import",alert("Failed to import wallet. Check your mnemonic.")}}),document.getElementById("confirm-saved-btn")?.addEventListener("click",async()=>{document.getElementById("mnemonic-modal")?.classList.add("hidden");try{await t.startNode()}catch(o){console.error("Failed to connect:",o)}})}let O=!1;function Ge(e,t){document.body.dataset.network=e.network,document.getElementById("toggle-layout")?.addEventListener("click",()=>{t.toggleLayoutMode()});const a=document.getElementById("network-toggle-btn"),n=document.getElementById("network-dropdown");a&&(a.onclick=i=>{i.preventDefault(),i.stopPropagation(),console.log("Network toggle clicked!"),n?.classList.toggle("hidden")}),document.querySelectorAll(".network-option").forEach(i=>{i.onclick=async r=>{r.preventDefault(),r.stopPropagation();const l=i.dataset.network;if(console.log("Network option clicked:",l),l===e.network){n?.classList.add("hidden");return}if(l==="mainnet"&&!confirm(`⚠️ Switching to MAINNET will use REAL FUNDS.

Are you sure?`)){n?.classList.add("hidden");return}n?.classList.add("hidden"),w(`Switching to ${l==="mainnet"?"Mainnet":"Orchard Testnet"}...`);try{await t.switchNetwork(l),w(`Connected to ${l==="mainnet"?"Mainnet":"Orchard Testnet"}`)}catch(m){console.error("Failed to switch network:",m),w("Failed to switch network")}}}),O||(O=!0,document.addEventListener("click",i=>{const r=i.target,l=document.getElementById("network-dropdown"),m=document.getElementById("network-toggle-btn");l&&!l.contains(r)&&!m?.contains(r)&&l.classList.add("hidden")})),document.getElementById("copy-payment-code")?.addEventListener("click",()=>{e.paymentCode&&(navigator.clipboard.writeText(e.paymentCode),w("Payment code copied!"))}),document.getElementById("copy-quai-address")?.addEventListener("click",()=>{e.quaiAddress&&(navigator.clipboard.writeText(e.quaiAddress),w("Quai address copied!"))}),document.getElementById("copy-user-id")?.addEventListener("click",()=>{e.userId&&(navigator.clipboard.writeText(e.userId),w("Chat ID copied! Share it with friends."))}),document.getElementById("view-seed-btn")?.addEventListener("click",()=>{const i=localStorage.getItem("cinq_mnemonic");if(i){const r=document.getElementById("view-seed-modal"),l=document.getElementById("view-mnemonic-words");r&&l&&(l.innerHTML=i.split(" ").map((m,h)=>`<span class="word"><span class="num">${h+1}.</span> ${m}</span>`).join(""),r.classList.remove("hidden"))}else w("No recovery phrase found")}),document.getElementById("close-seed-modal-btn")?.addEventListener("click",()=>{document.getElementById("view-seed-modal")?.classList.add("hidden")}),document.getElementById("refresh-balance-btn")?.addEventListener("click",async()=>{const i=document.getElementById("refresh-balance-btn");i.disabled=!0,i.textContent="Refreshing...";try{await t.refreshBalance()}finally{i.disabled=!1,i.textContent="Refresh Balance"}}),document.getElementById("disconnect-btn")?.addEventListener("click",async()=>{await t.stopNode()}),t.getConversations(),document.querySelectorAll(".conversation-item").forEach(i=>{i.addEventListener("click",()=>{const r=i.dataset.convId;i.dataset.peerId;const l=e.conversations.find(m=>m.id===r);l&&t.openConversation(l)})}),document.querySelectorAll(".peer-item").forEach(i=>{i.addEventListener("click",()=>{const r=i.dataset.peerId;r&&t.startConversation(r)})}),document.getElementById("back-to-list-btn")?.addEventListener("click",()=>{t.backToConversationList()});const o=async()=>{const i=document.getElementById("message-input"),r=i.value.trim();if(!r||!e.currentConversation)return;const l=e.currentConversation.peer_id;i.value="",i.focus(),await t.sendMessage(l,r);const m=document.getElementById("messages-container");m&&(m.scrollTop=m.scrollHeight)};document.getElementById("send-msg-btn")?.addEventListener("click",o),document.getElementById("message-input")?.addEventListener("keypress",i=>{i.key==="Enter"&&o()}),document.getElementById("new-chat-btn")?.addEventListener("click",()=>{const i=prompt("Enter Chat ID (e.g., 555-123-4567):");i&&i.trim()&&t.startConversation(i.trim())});const u=document.getElementById("messages-container");u&&(u.scrollTop=u.scrollHeight),document.querySelectorAll(".tab-btn").forEach(i=>{i.addEventListener("click",()=>{const r=i.dataset.tab;r&&t.setActiveTab(r)})}),document.querySelectorAll(".dock-item[data-app-id]").forEach(i=>{i.addEventListener("click",()=>{const r=i.getAttribute("data-app-id");r&&t.launchApp(r)})}),document.querySelectorAll('[data-action="open-launcher"]').forEach(i=>{i.addEventListener("click",()=>t.toggleAppLauncher())}),document.querySelectorAll('[data-action="close-launcher"]').forEach(i=>{i.addEventListener("click",r=>{r.target===i&&t.toggleAppLauncher()})}),document.querySelectorAll(".app-tile[data-app-id]").forEach(i=>{i.addEventListener("click",()=>{const r=i.getAttribute("data-app-id");r&&(t.launchApp(r),t.toggleAppLauncher())})});const d=document.getElementById("app-search");d&&d.addEventListener("input",()=>{const i=d.value.toLowerCase();document.querySelectorAll(".app-tile").forEach(r=>{const l=r.querySelector(".app-name")?.textContent?.toLowerCase()||"";r.style.display=l.includes(i)?"":"none"})}),document.getElementById("init-qora-btn")?.addEventListener("click",async()=>{w("Initializing Qora..."),await t.qoraInit(),await t.qoraGetTasks(),await t.qoraGetHistory()}),document.getElementById("qora-init-btn")?.addEventListener("click",async()=>{const i=document.getElementById("qora-ollama-url"),r=document.getElementById("qora-model"),l=document.getElementById("qora-init-btn");l.disabled=!0,l.textContent="Connecting...";try{await t.qoraInit(i.value||void 0,r.value||void 0),await t.qoraGetTasks(),await t.qoraGetHistory(),w("Qora connected!")}catch{w("Failed to connect to Ollama"),l.disabled=!1,l.textContent="Connect to Ollama"}});const c=async()=>{const i=document.getElementById("qora-input"),r=i.value.trim();if(r){i.value="",i.disabled=!0;try{await t.qoraChat(r);const l=document.getElementById("qora-chat-messages");l&&(l.scrollTop=l.scrollHeight)}finally{i.disabled=!1,i.focus()}}};document.getElementById("qora-send-btn")?.addEventListener("click",c),document.getElementById("qora-input")?.addEventListener("keypress",i=>{i.key==="Enter"&&c()}),document.getElementById("qora-work-btn")?.addEventListener("click",async()=>{w("Qora is working..."),await t.qoraWork()&&w("Task completed!")}),document.getElementById("qora-work-all-btn")?.addEventListener("click",async()=>{if(!confirm("Start Qora grinding through all tasks? This may take a while."))return;w("Qora is grinding...");const r=await t.qoraWorkAll();r&&w(r)}),document.getElementById("add-task-btn")?.addEventListener("click",()=>{document.getElementById("add-task-modal")?.classList.remove("hidden")}),document.getElementById("cancel-task-btn")?.addEventListener("click",()=>{document.getElementById("add-task-modal")?.classList.add("hidden")}),document.getElementById("confirm-task-btn")?.addEventListener("click",async()=>{const i=document.getElementById("task-title"),r=document.getElementById("task-description"),l=i.value.trim(),m=r.value.trim();if(!l||!m){w("Please fill in both title and description");return}const h=document.getElementById("confirm-task-btn");h.disabled=!0;try{await t.qoraAddTask(l,m),i.value="",r.value="",document.getElementById("add-task-modal")?.classList.add("hidden"),w("Task added!")}finally{h.disabled=!1}}),document.querySelectorAll(".btn-answer").forEach(i=>{i.addEventListener("click",async()=>{const r=parseInt(i.dataset.index||"0"),m=document.querySelector(`.question-input[data-index="${r}"]`)?.value.trim();if(!m){w("Please enter an answer");return}i.disabled=!0;try{await t.qoraAnswerQuestion(r,m),w("Answer submitted!")}finally{i.disabled=!1}})});const p=document.getElementById("qora-chat-messages");p&&(p.scrollTop=p.scrollHeight)}function w(e){const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.classList.add("show"),10),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},3e3)}const Ve={apps:[],pinnedApps:[],activeApp:null,showLauncher:!1};async function Y(){try{return(await g("apps_list")).data||[]}catch(e){return console.error("Failed to list apps:",e),[]}}async function J(){try{return(await g("apps_pinned")).data||[]}catch(e){return console.error("Failed to get pinned apps:",e),[]}}async function Ye(){try{return(await g("apps_active")).data}catch(e){return console.error("Failed to get active app:",e),null}}async function Je(e){try{return(await g("apps_launch",{appId:e})).data}catch(t){return console.error("Failed to launch app:",t),null}}const s={nodeRunning:!1,peerId:null,peers:[],userId:null,userIdDisplay:null,walletInitialized:!1,paymentCode:null,quaiAddress:null,balance:0n,quaiBalance:0n,hasSavedWallet:!1,network:localStorage.getItem("cinq_network")||"orchard",currentView:"landing",conversations:[],currentConversation:null,messages:[],chatView:"list",sessionCost:{totalBytesSent:0,totalBytesReceived:0,totalQiCost:0,messageCount:0,lastMessageCost:null},qora:{initialized:!1,available:!1,model:"",tasks:[],questions:[],history:JSON.parse(localStorage.getItem("cinq_qora_history")||"[]"),chatInput:"",isWorking:!1},activeTab:"messages",layoutMode:localStorage.getItem("cinq_layout_mode")||"classic",apps:Ve,canvas:be()};async function Xe(){try{const e=await g("get_user_id");return e.success&&e.data?(s.userId=e.data.user_id,s.userIdDisplay=e.data.display,e.data):null}catch(e){return console.error("Failed to get user ID:",e),null}}async function Ke(e){try{const t=await g("lookup_user_id",{userId:e});return t.success?t.data:(console.error("Lookup failed:",t.error),null)}catch(t){return console.error("Failed to lookup user ID:",t),null}}async function R(){try{const e=localStorage.getItem("cinq_mnemonic")||void 0,t=await g("start_node",{seedPhrase:e});if(!t.success||!t.data)throw new Error(t.error||"Failed to start node");s.nodeRunning=!0,s.peerId=t.data,await Xe(),await Ze(),v(),console.log("Node started:",t.data),console.log("User ID:",s.userIdDisplay)}catch(e){throw console.error("Failed to start node:",e),e}}async function Ze(){try{const[e,t,a]=await Promise.all([Y(),J(),Ye()]);s.apps.apps=e,s.apps.pinnedApps=t,s.apps.activeApp=a,console.log("Apps loaded:",e.length,"apps")}catch(e){console.error("Failed to load apps:",e)}}async function et(e){const t=await Je(e);t&&(s.apps.activeApp=t,s.apps.apps=await Y(),s.apps.pinnedApps=await J(),e==="cinq.chat"?s.activeTab="messages":(e==="cinq.qora"||e==="cinq.compute")&&(s.activeTab="qora"),v())}function tt(){s.apps.showLauncher=!s.apps.showLauncher,v()}function at(){s.layoutMode=s.layoutMode==="classic"?"canvas":"classic",localStorage.setItem("cinq_layout_mode",s.layoutMode),v()}function nt(e){s.canvas={...s.canvas,...e},v()}async function st(){try{const e=await g("stop_node");e.success||console.warn("Stop node warning:",e.error),s.nodeRunning=!1,s.peerId=null,s.userId=null,s.userIdDisplay=null,s.peers=[],v(),console.log("Node stopped")}catch(e){throw console.error("Failed to stop node:",e),e}}async function it(){try{const e=await g("get_peers");return e.success&&e.data?(s.peers=e.data,v(),s.peers):[]}catch(e){return console.error("Failed to get peers:",e),[]}}async function X(){try{const e=await g("get_conversations");return e.success&&e.data?(s.conversations=e.data,e.data):[]}catch(e){return console.error("Failed to get conversations:",e),[]}}async function K(e){try{const t=await g("get_messages",{conversationId:e,limit:100});return t.success&&t.data?(s.messages=t.data.reverse(),s.messages):[]}catch(t){return console.error("Failed to get messages:",t),[]}}async function ot(e,t){try{const a=await g("worker_send_message",{peerId:e,content:t});if(a.success&&a.data){const{bytes_processed:o,qi_cost:u}=a.data;console.log(`Message metered: ${o} bytes, ${u} Qi`),s.sessionCost.totalBytesSent+=o,s.sessionCost.totalQiCost+=u,s.sessionCost.messageCount+=1,s.sessionCost.lastMessageCost={bytes:o,qi:u}}const n=await g("send_message",{peerId:e,content:t});return n.success&&n.data?(s.messages.push(n.data),await X(),v(),n.data):(console.error("Send message failed:",n.error),null)}catch(a){return console.error("Failed to send message:",a),null}}async function rt(e){let t=e,a=e;const n=e.replace(/-/g,"").replace(/\s/g,"");if(n.length===10&&/^\d+$/.test(n)){const o=await Ke(n);if(o)t=o,a=`${n.slice(0,3)}-${n.slice(3,6)}-${n.slice(6)}`;else{console.error("User ID not found:",n),alert(`User ID ${a} not found. They need to be online first.`);return}}else t.length>12&&(a=t.slice(0,12)+"...");await lt(t,a)}async function lt(e,t){const a=t||(e.length>12?e.slice(0,12)+"...":e);try{let n=s.conversations.find(o=>o.peer_id===e);n||(n={id:"new-"+e,peer_id:e,display_name:a,last_message:null,last_message_at:null,unread_count:0},s.conversations.unshift(n)),s.currentConversation=n,s.messages=[],s.chatView="conversation",n.id.startsWith("new-")||await K(n.id),v()}catch(n){console.error("Failed to start conversation:",n)}}function dt(e){s.currentConversation=e,s.chatView="conversation",K(e.id).then(()=>v())}function ct(){s.currentConversation=null,s.chatView="list",s.messages=[],v()}async function ut(e,t){try{const a=await g("qora_init",{ollamaUrl:e||null,model:t||null});return a.success&&a.data?(s.qora.initialized=a.data.initialized,s.qora.available=a.data.ollama_available,s.qora.model=a.data.model,s.qora.questions=a.data.pending_questions,console.log("Qora initialized:",a.data),v(),a.data):(console.error("Qora init failed:",a.error),null)}catch(a){return console.error("Failed to initialize Qora:",a),null}}async function pt(){try{const e=await g("qora_status");return e.success&&e.data?(s.qora.initialized=e.data.initialized,s.qora.available=e.data.ollama_available,s.qora.model=e.data.model,s.qora.questions=e.data.pending_questions,e.data):null}catch(e){return console.error("Failed to get Qora status:",e),null}}function C(){const e=s.qora.history.slice(-100);localStorage.setItem("cinq_qora_history",JSON.stringify(e))}async function mt(e){try{s.qora.chatInput="",s.qora.history.push({role:"user",content:e}),C(),v();const t=await g("qora_chat",{message:e});return t.success&&t.data?(s.qora.history.push({role:"assistant",content:t.data}),C(),v(),t.data):(console.error("Qora chat failed:",t.error),s.qora.history.pop(),C(),v(),null)}catch(t){return console.error("Failed to chat with Qora:",t),s.qora.history.pop(),C(),v(),null}}async function vt(e,t){try{const a=await g("qora_add_task",{title:e,description:t});return a.success&&a.data?(s.qora.tasks.push(a.data),v(),a.data):(console.error("Add task failed:",a.error),null)}catch(a){return console.error("Failed to add task:",a),null}}async function T(){try{const e=await g("qora_get_tasks");return e.success&&e.data?(s.qora.tasks=e.data,e.data):[]}catch(e){return console.error("Failed to get tasks:",e),[]}}async function gt(){try{s.qora.isWorking=!0,v();const e=await g("qora_work");return s.qora.isWorking=!1,e.success?(await T(),await S(),v(),e.data):(console.error("Work failed:",e.error),v(),null)}catch(e){return console.error("Failed to work:",e),s.qora.isWorking=!1,v(),null}}async function ht(){try{s.qora.isWorking=!0,v(),A("Qora is grinding through tasks...");const e=await g("qora_work_all");return s.qora.isWorking=!1,e.success&&e.data?(await T(),await S(),v(),A("Qora finished working!"),e.data):(console.error("Work all failed:",e.error),v(),null)}catch(e){return console.error("Failed to work all:",e),s.qora.isWorking=!1,v(),null}}async function S(){try{const e=await g("qora_get_questions");return e.success&&e.data?(s.qora.questions=e.data,e.data):[]}catch(e){return console.error("Failed to get questions:",e),[]}}async function wt(e,t){try{const a=await g("qora_answer_question",{questionIndex:e,answer:t});return a.success&&a.data?(await S(),v(),a.data):(console.error("Answer failed:",a.error),null)}catch(a){return console.error("Failed to answer question:",a),null}}async function ft(){try{const e=await g("qora_get_history");return e.success&&e.data?(s.qora.history=e.data.filter(t=>t.role!=="system"),s.qora.history):[]}catch(e){return console.error("Failed to get history:",e),[]}}async function Z(e){try{const t=await g("qora_process",{input:e});return t.success&&t.data?(console.log("Qora processed:",t.data.intent,"->",t.data.message),t.data):(console.error("Qora process failed:",t.error),null)}catch(t){return console.error("Failed to process with Qora:",t),null}}async function yt(e,t){const a=await Z(e);if(!a)return null;if(a.suggested_action&&a.confidence>.7)switch(a.intent){case"SendMessage":break;case"CheckBalance":await k();break;case"CheckUsage":console.log("Usage check requested");break}return a.message}function bt(e){s.activeTab=e,v()}async function qt(){try{(await g("reset_identity")).success&&console.log("Identity reset - new Chat ID and Mesh ID will be generated")}catch(t){console.warn("Could not reset identity (node may need to be stopped first):",t)}const e=await se({network:s.network});return s.walletInitialized=!0,s.hasSavedWallet=!0,s.paymentCode=e.paymentCode,s.quaiAddress=e.quaiAddress,localStorage.setItem("cinq_mnemonic",e.mnemonic),localStorage.setItem("cinq_wallet",await B()),localStorage.setItem("cinq_network",s.network),le(t=>{console.log("Received payment:",E(t.amount)),k(),A(`Received ${E(t.amount)}`)}),_(),e}async function It(e){const{paymentCode:t,quaiAddress:a}=await U(e,{network:s.network});s.walletInitialized=!0,s.hasSavedWallet=!0,s.paymentCode=t,s.quaiAddress=a,localStorage.setItem("cinq_mnemonic",e),localStorage.setItem("cinq_wallet",await B()),localStorage.setItem("cinq_network",s.network),await k(),_(),v()}async function kt(e){if(e===s.network)return;const t=localStorage.getItem("cinq_mnemonic");if(!t){console.error("No mnemonic found");return}re(),s.network=e,localStorage.setItem("cinq_network",e);try{const{paymentCode:a,quaiAddress:n}=await U(t,{network:e});s.paymentCode=a,s.quaiAddress=n,s.balance=0n,localStorage.setItem("cinq_wallet",await B()),await k(),_(),A(`Switched to ${e==="mainnet"?"Mainnet":"Orchard Testnet"}`)}catch(a){console.error("Failed to switch network:",a),s.network=e==="mainnet"?"orchard":"mainnet",localStorage.setItem("cinq_network",s.network)}v()}async function Et(){try{(await g("reset_identity")).success&&console.log("Identity reset with wallet clear")}catch(e){console.warn("Could not reset identity:",e)}localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic"),s.walletInitialized=!1,s.hasSavedWallet=!1,s.paymentCode=null,s.quaiAddress=null,s.balance=0n,v()}async function k(){if(s.walletInitialized)try{const[e,t]=await Promise.all([M(),ie()]);s.balance=e.balance,s.quaiBalance=t,v()}catch(e){console.error("Failed to refresh balance:",e)}}function v(){const e=document.getElementById("qora-input");e&&(s.qora.chatInput=e.value);const a=document.getElementById("chat-input")?.value||"";qe(s,{startNode:R,stopNode:st,initializeNewWallet:qt,restoreWallet:It,refreshBalance:k,sendPayment:oe,formatQi:E,connectWithSavedWallet:async()=>{await R()},clearSavedWallet:Et,switchNetwork:kt,getConversations:X,openConversation:dt,backToConversationList:ct,sendMessage:ot,startConversation:rt,qoraInit:ut,qoraStatus:pt,qoraChat:mt,qoraAddTask:vt,qoraGetTasks:T,qoraWork:gt,qoraWorkAll:ht,qoraGetQuestions:S,qoraAnswerQuestion:wt,qoraGetHistory:ft,qoraProcess:Z,processWithQora:yt,setActiveTab:bt,launchApp:et,toggleAppLauncher:tt,toggleLayoutMode:at,updateCanvas:nt});const n=document.getElementById("qora-input");n&&s.qora.chatInput&&(n.value=s.qora.chatInput);const o=document.getElementById("chat-input");o&&a&&(o.value=a)}function A(e){console.log("Notification:",e);const t=document.createElement("div");t.className="notification",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),5e3)}async function $t(){console.log("cinQ initializing...");const e=localStorage.getItem("cinq_wallet"),t=localStorage.getItem("cinq_mnemonic");if(s.hasSavedWallet=!!(e&&t),e&&t)try{await ue(e,t,{network:s.network}),s.walletInitialized=!0,s.paymentCode=de(),s.quaiAddress=ce(),k().catch(a=>console.warn("Balance refresh failed:",a)),_(),console.log("Restored wallet:",s.paymentCode?.slice(0,20)+"...")}catch(a){console.error("Failed to restore wallet:",a),localStorage.removeItem("cinq_wallet"),localStorage.removeItem("cinq_mnemonic"),s.hasSavedWallet=!1}v(),setInterval(()=>{s.nodeRunning&&it()},1e4)}document.addEventListener("DOMContentLoaded",$t);
