(function() {
  if (window.__teCaptureActive) return;
  window.__teCaptureActive = true;

  // 1. Setup Shadow DOM Container
  const container = document.createElement('div');
  container.id = 'te-capture-root';
  Object.assign(container.style, {
    position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
    zIndex: '2147483647', pointerEvents: 'auto', all: 'initial',
    background: 'transparent', cursor: 'crosshair',
    '--accent': '#ef4444' // Default to Red to match state
  });
  
  (document.documentElement || document.body).appendChild(container);
  const shadow = container.attachShadow({ mode: 'open' });

  // 2. CSS - Modern Minimalist (Adaptive Accent)
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
    
    :host {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      cursor: crosshair !important;
      user-select: none;
      font-family: 'Outfit', sans-serif;
      pointer-events: auto;
    }
    
    .overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.65);
      z-index: 1;
      display: flex; align-items: center; justify-content: center;
      cursor: crosshair !important;
    }

    .overlay-tip {
      color: #fff;
      font-size: 16px;
      font-weight: 500;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(20px);
      padding: 12px 28px;
      border-radius: 100px;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 20px 50px rgba(0,0,0,0.4);
      pointer-events: none;
      transition: all 0.5s ease;
      letter-spacing: 0.02em;
    }
    
    .selection-box {
      position: absolute;
      border: 1px solid rgba(255,255,255,0.7);
      box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.65), 
                  0 0 30px rgba(99, 102, 241, 0.4);
      cursor: move;
      display: none;
      z-index: 10;
      box-sizing: border-box;
      pointer-events: auto;
    }
    
    .bracket {
      position: absolute; width: 14px; height: 14px;
      border-color: var(--accent); border-style: solid; 
      z-index: 11; pointer-events: auto;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .bracket.tl { top: -2px; left: -2px; border-width: 2.5px 0 0 2.5px; cursor: nw-resize; }
    .bracket.tr { top: -2px; right: -2px; border-width: 2.5px 2.5px 0 0; cursor: ne-resize; }
    .bracket.bl { bottom: -2px; left: -2px; border-width: 0 0 2.5px 2.5px; cursor: sw-resize; }
    .bracket.br { bottom: -2px; right: -2px; border-width: 0 2.5px 2.5px 0; cursor: se-resize; }
    .bracket:hover { width: 18px; height: 18px; background: rgba(255, 255, 255, 0.1); }

    .unified-pill {
      position: absolute;
      bottom: -64px; left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(30px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      padding: 6px;
      border-radius: 20px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6);
      pointer-events: auto;
      gap: 3px;
      align-items: center;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      z-index: 100;
      justify-content: center;
    }
    .unified-pill.visible { opacity: 1; transform: translateX(-50%) translateY(0); }

    .btn {
      width: 34px; height: 34px;
      display: flex; align-items: center; justify-content: center;
      color: #94a3b8;
      cursor: pointer;
      border-radius: 10px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    .btn:hover { background: rgba(255,255,255,0.08); color: var(--accent); transform: translateY(-1px); }
    .btn.active { background: var(--accent); color: #fff; box-shadow: 0 8px 16px rgba(0,0,0,0.2); }
    .btn svg { width: 17px; height: 17px; stroke-width: 2.2; }
    
    .btn-action { color: #fff; }
    .btn-action:hover { background: rgba(255, 255, 255, 0.08); color: var(--accent); }
    .btn-close:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

    .group-divider {
      width: 1px; height: 18px;
      background: rgba(255,255,255,0.1);
      margin: 0 8px;
    }
    
    .color-grid { display: flex; gap: 5px; padding: 0 4px; align-items: center; }
    .color-square {
      width: 18px; height: 18px;
      border-radius: 4.5px;
      cursor: pointer;
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      transition: all 0.2s;
    }
    .color-square:hover { transform: scale(1.15); border-color: #fff; }
    .color-square.active { border-color: #fff; box-shadow: 0 0 12px rgba(255,255,255,0.3); }

    .custom-color-square {
       position: relative;
       background: linear-gradient(45deg, #ff0000, #ff00ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000);
       background-size: 200% 200%;
       animation: rainbow 5s linear infinite;
    }
    @keyframes rainbow { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
    .custom-color-square input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

    canvas { position: absolute; top: 0; left: 0; pointer-events: none; z-index: 5; }

    .action-feedback {
       position: absolute; top: -45px; left: 50%; transform: translateX(-50%);
       background: var(--accent); color: white; padding: 6px 14px; border-radius: 10px;
       font-size: 11px; font-weight: 700; opacity: 0; transition: all 0.3s;
       box-shadow: 0 8px 16px rgba(0,0,0,0.2); pointer-events: none;
    }
    .action-feedback.show { opacity: 1; transform: translateX(-50%) translateY(-5px); }

    /* Support Modal in Shadow DOM */
    .support-modal-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(20px); z-index: 5000;
      display: none; align-items: center; justify-content: center;
      color: #fff; cursor: default;
    }
    .support-modal-overlay.visible { display: flex; }
    .sm-content {
      width: 300px; background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px; padding: 24px; text-align: center;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
    }
    .sm-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #fff; }
    .sm-desc { font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px; }
    .sm-actions { display: flex; flex-direction: column; gap: 10px; }
    .sm-btn { width: 100%; padding: 12px; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .sm-btn-pay { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #000; }
    .sm-close {
      position: absolute; top: -12px; right: -12px;
      width: 28px; height: 28px; background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%; color: #94a3b8; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); font-size: 14px; font-weight: bold;
    }
    .sm-close:hover { background: #6366f1; color: #fff; }
  `;

  const style = document.createElement('style');
  style.textContent = CSS;
  shadow.appendChild(style);

  // 3. State
  let state = {
    img: null, startX: 0, startY: 0, x: 0, y: 0, w: 0, h: 0,
    isDragging: false, activeHandle: null, mode: 'select', 
    tool: 'rect', color: '#ef4444', 
    history: [], redoStack: [], tempPoints: []
  };

  // 4. Initial Capture
  chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (res) => {
    if (res?.dataUrl) {
      const img = new Image();
      img.onload = () => { state.img = img; drawBackground(); };
      img.src = res.dataUrl;
    }
  });

  // 5. Build UI Structure
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<div class="overlay-tip">Select Area</div>`;
  shadow.appendChild(overlay);

  const selBox = document.createElement('div');
  selBox.className = 'selection-box';
  selBox.innerHTML = `
    <div class="bracket tl" data-handle="tl"></div>
    <div class="bracket tr" data-handle="tr"></div>
    <div class="bracket bl" data-handle="bl"></div>
    <div class="bracket br" data-handle="br"></div>
    
    <div class="unified-pill">
      <div class="btn" title="Pencil" data-tool="pen">${svgPath('pen')}</div>
      <div class="btn" title="Arrow" data-tool="arrow">${svgPath('arrow')}</div>
      <div class="btn active" title="Rectangle" data-tool="rect">${svgPath('rect')}</div>
      <div class="btn" title="Marker" data-tool="marker">${svgPath('marker')}</div>
      <div class="btn" title="Text" data-tool="text">${svgPath('text')}</div>
      
      <div class="group-divider"></div>

      <div class="color-grid">
        <div class="color-square active" style="background:#ef4444" data-color="#ef4444"></div>
        <div class="color-square" style="background:#6366f1" data-color="#6366f1"></div>
        <div class="color-square" style="background:#10b981" data-color="#10b981"></div>
        <div class="color-square" style="background:#fbbf24" data-color="#fbbf24"></div>
        <div class="color-square" style="background:#ffffff" data-color="#ffffff"></div>
        <div class="color-square custom-color-square" title="Custom Color">
           <input type="color" id="nativePicker" value="#ef4444">
        </div>
      </div>
      
      <div class="group-divider"></div>
      
      <button class="btn" title="Undo" id="btn-undo">${svgPath('undo')}</button>
      <button class="btn" title="Redo" id="btn-redo">${svgPath('redo')}</button>
      
      <div class="group-divider"></div>
      
      <div class="btn btn-action" title="Copy" id="btn-copy">
         ${svgPath('copy')}
         <div class="action-feedback">Copied!</div>
      </div>
      <div class="btn btn-action" title="Download" id="btn-save">${svgPath('download')}</div>
      
      <div class="group-divider"></div>
      <div class="btn btn-close" title="Close" id="btn-close">${svgPath('close')}</div>
    </div>

    <!-- Support Modal inside Shadow DOM -->
    <div id="sm-overlay" class="support-modal-overlay">
      <div class="sm-content" style="position: relative;">
        <button id="sm-close-btn" class="sm-close">✕</button>
        <div class="sm-title">Support Extractor</div>
        <p class="sm-desc">Support our development to continue with your capture.</p>
        <div class="sm-actions">
          <button id="sm-pay-btn" class="sm-btn sm-btn-pay">☕ Pay $1 (Buy Coffee)</button>
          <button id="sm-ad-btn" class="sm-btn sm-btn-ad">📺 View One Ad</button>
        </div>
      </div>
    </div>
  `;
  shadow.appendChild(selBox);

  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight;
  shadow.appendChild(bgCanvas);
  const bgCtx = bgCanvas.getContext('2d');

  const drawCanvas = document.createElement('canvas');
  drawCanvas.width = window.innerWidth; drawCanvas.height = window.innerHeight;
  shadow.appendChild(drawCanvas);
  const drawCtx = drawCanvas.getContext('2d');

  // 6. Interaction Logic
  const handleMouseDown = (e) => {
    if (state.mode === 'edit') return;
    state.isDragging = true; state.startX = e.clientX; state.startY = e.clientY; state.mode = 'select';
    selBox.style.display = 'block';
    overlay.querySelector('.overlay-tip').style.opacity = '0';
  };

  const handleMouseMove = (e) => {
    if (!state.isDragging) return;
    if (state.mode === 'select') {
      state.x = Math.min(e.clientX, state.startX); state.y = Math.min(e.clientY, state.startY);
      state.w = Math.abs(e.clientX - state.startX); state.h = Math.abs(e.clientY - state.startY);
    } else if (state.mode === 'resize') {
      const h = state.activeHandle;
      if (h.includes('r')) state.w = Math.max(10, e.clientX - state.x);
      if (h.includes('l')) { const dx = state.x - e.clientX; state.x = e.clientX; state.w += dx; }
      if (h.includes('b')) state.h = Math.max(10, e.clientY - state.y);
      if (h.includes('t')) { const dy = state.y - e.clientY; state.y = e.clientY; state.h += dy; }
    } else if (state.mode === 'move') {
      state.x += (e.clientX - state.startX); state.y += (e.clientY - state.startY);
      state.startX = e.clientX; state.startY = e.clientY;
    } else if (state.mode === 'draw') {
      state.tempPoints.push({ x: e.clientX, y: e.clientY }); renderDrawings();
    }
    updateUI();
  };

  const handleMouseUp = (e) => {
    if (state.mode === 'select' && (state.w < 5 || state.h < 5)) {
      selBox.style.display = 'none'; overlay.querySelector('.overlay-tip').style.opacity = '1';
    } else if (state.mode === 'draw') {
      if (state.tempPoints.length > 0) {
        let textVal = "";
        if (state.tool === 'text') {
           textVal = prompt("Enter annotation text:");
           if (!textVal) { state.tempPoints = []; renderDrawings(); return; }
        }
        state.history.push({ tool: state.tool, color: state.color, points: [...state.tempPoints], text: textVal });
        state.redoStack = []; 
        state.tempPoints = [];
      }
      renderDrawings();
    }
    state.isDragging = false; state.activeHandle = null;
    if (state.w > 5) {
      state.mode = 'edit';
      selBox.querySelector('.unified-pill').classList.add('visible');
    }
  };

  overlay.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);

  selBox.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    if (e.target.classList.contains('bracket')) {
      state.isDragging = true; state.activeHandle = e.target.dataset.handle; state.mode = 'resize';
    } else if (e.target.closest('.unified-pill')) {
      // Ignore
    } else if (state.tool && state.mode === 'edit') {
       state.isDragging = true; state.mode = 'draw';
       state.tempPoints = [{ x: e.clientX, y: e.clientY }];
    } else {
      state.isDragging = true; state.startX = e.clientX; state.startY = e.clientY; state.mode = 'move';
    }
  });

  // 7. Tool Actions
  selBox.querySelectorAll('.btn[data-tool]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      selBox.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.tool = btn.dataset.tool;
    };
  });

  // Update Color & Adaptive UI
  function updateAccent(color) {
    state.color = color;
    container.style.setProperty('--accent', color);
  }

  selBox.querySelectorAll('.color-square[data-color]').forEach(sq => {
    sq.onclick = (e) => {
      e.stopPropagation();
      updateAccent(sq.dataset.color);
      selBox.querySelectorAll('.color-square').forEach(s => s.classList.remove('active'));
      sq.classList.add('active');
    };
  });

  shadow.querySelector('#nativePicker').oninput = (e) => {
    updateAccent(e.target.value);
    selBox.querySelectorAll('.color-square').forEach(s => s.classList.remove('active'));
    shadow.querySelector('.custom-color-square').classList.add('active');
  };

  shadow.querySelector('#btn-undo').onclick = () => { if (state.history.length > 0) { state.redoStack.push(state.history.pop()); renderDrawings(); } };
  shadow.querySelector('#btn-redo').onclick = () => { if (state.redoStack.length > 0) { state.history.push(state.redoStack.pop()); renderDrawings(); } };

  let pendingCaptureAction = null;

  function showCaptureModal(onComplete) {
    pendingCaptureAction = onComplete;
    shadow.getElementById('sm-overlay').classList.add('visible');
  }

  function handleCaptureChoice(type) {
    if (type === "pay") chrome.runtime.sendMessage({ action: "openPayment" });
    else chrome.runtime.sendMessage({ action: "openAd" });
    
    shadow.getElementById('sm-overlay').classList.remove('visible');
    if (pendingCaptureAction) {
      pendingCaptureAction();
      pendingCaptureAction = null;
    }
  }

  shadow.getElementById('sm-pay-btn').onclick = () => handleCaptureChoice("pay");
  shadow.getElementById('sm-ad-btn').onclick = () => handleCaptureChoice("ad");
  shadow.getElementById('sm-close-btn').onclick = () => {
    shadow.getElementById('sm-overlay').classList.remove('visible');
    if (typeof pendingCaptureAction === "function") {
      pendingCaptureAction();
      pendingCaptureAction = null;
    }
  };

  shadow.querySelector('#btn-copy').onclick = async (e) => {
    showCaptureModal(async () => {
      const blob = await getCroppedBlob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      const feedback = shadow.querySelector('.action-feedback');
      feedback.classList.add('show');
      setTimeout(() => { feedback.classList.remove('show'); cleanup(); }, 1200);
    });
  };

  shadow.querySelector('#btn-save').onclick = async () => {
    showCaptureModal(async () => {
      const blob = await getCroppedBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `capture_${Date.now()}.png`; a.click();
      setTimeout(cleanup, 1000);
    });
  };

  shadow.querySelector('#btn-close').onclick = cleanup;

  function updateUI() {
    selBox.style.left = `${state.x}px`; selBox.style.top = `${state.y}px`;
    selBox.style.width = `${state.w}px`; selBox.style.height = `${state.h}px`;
  }

  function drawBackground() { if (!state.img) return; bgCtx.drawImage(state.img, 0, 0, bgCanvas.width, bgCanvas.height); }

  function renderDrawings() {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    state.history.forEach(item => drawItem(item));
    if (state.tempPoints.length > 0) { drawItem({ tool: state.tool, color: state.color, points: state.tempPoints }); }
  }

  function drawItem(item) {
    const ctx = drawCtx; ctx.strokeStyle = item.color; ctx.fillStyle = item.color;
    ctx.lineWidth = item.tool === 'marker' ? 15 : 3;
    ctx.globalAlpha = item.tool === 'marker' ? 0.35 : 1.0;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const p = item.points; if (p.length < 1) return;
    if (item.tool === 'pen' || item.tool === 'marker') {
      ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); p.forEach(pt => ctx.lineTo(pt.x, pt.y)); ctx.stroke();
    } else if (item.tool === 'rect') {
      const last = p[p.length - 1]; ctx.strokeRect(p[0].x, p[0].y, last.x - p[0].x, last.y - p[0].y);
    } else if (item.tool === 'arrow') {
      const start = p[0], end = p[p.length-1]; const headlen = 12; const angle = Math.atan2(end.y - start.y, end.x - start.x);
      ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath(); ctx.fill();
    } else if (item.tool === 'text') {
       ctx.globalAlpha = 1.0; ctx.font = '700 24px Outfit, sans-serif'; ctx.fillText(item.text || "", p[0].x, p[0].y);
    }
  }

  async function getCroppedBlob() {
    const canvas = document.createElement('canvas'); canvas.width = state.w; canvas.height = state.h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(state.img, state.x, state.y, state.w, state.h, 0, 0, state.w, state.h);
    ctx.drawImage(drawCanvas, state.x, state.y, state.w, state.h, 0, 0, state.w, state.h);
    return new Promise(r => canvas.toBlob(r, 'image/png'));
  }

  function cleanup() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    container.remove(); window.__teCaptureActive = false;
  }

  function svgPath(type) {
    const paths = {
      pen: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
      arrow: '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>',
      rect: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>',
      marker: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
      text: '<polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="12" y1="4" x2="12" y2="20"></line>',
      undo: '<path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>',
      redo: '<path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"></path>',
      copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
      download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
      close: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[type]}</svg>`;
  }

  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') cleanup(); });

})();
