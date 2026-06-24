(function () {
  if (window.__teCaptureActive) return;
  window.__teCaptureActive = true;

  // 1. Setup Shadow DOM Container
  const container = document.createElement("div");
  container.id = "te-capture-root";
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "2147483647",
    pointerEvents: "auto",
    all: "initial",
    background: "transparent",
    cursor: "crosshair",
    "--accent": "#ef4444", // Default to Red to match state
  });

  (document.documentElement || document.body).appendChild(container);
  const shadow = container.attachShadow({ mode: "open" });

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
      background: rgba(15, 23, 42, 0.2);
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
      border: 2px solid rgba(99, 102, 241, 0.8);
      box-shadow: 0 0 30px rgba(99, 102, 241, 0.4),
                  inset 0 0 0 1px rgba(99, 102, 241, 0.3);
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
      position: fixed;
      bottom: 20px; left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(30px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      padding: 8px 12px;
      border-radius: 20px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6);
      pointer-events: auto;
      gap: 3px;
      align-items: center;
      opacity: 0;
      transition: opacity 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      z-index: 100;
      justify-content: center;
      cursor: grab;
      user-select: none;
    }
    .unified-pill.visible { opacity: 1; }
    .unified-pill:active { cursor: grabbing; }

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

    .pill-drag-handle {
      width: 8px; height: 24px;
      background: rgba(255,255,255,0.3);
      border-radius: 4px;
      cursor: grab;
      margin-right: 6px;
      flex-shrink: 0;
      pointer-events: auto;
    }
    .pill-drag-handle:active { cursor: grabbing; }

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

  const style = document.createElement("style");
  style.textContent = CSS;
  shadow.appendChild(style);

  // 3. State
  let state = {
    img: null,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    isDragging: false,
    activeHandle: null,
    mode: "select",
    tool: "rect",
    color: "#ef4444",
    history: [],
    redoStack: [],
    undoStack: [[]],
    tempPoints: [],
    activeItemIndex: -1,
    selectedItemIndex: -1,
    draggedItemChanged: false,
    textInput: null,
    resizeHandle: null,
    resizeStartItem: null,
    resizeStartBounds: null,
    itemResizedChanged: false,
    snapToGrid: false,
    gridSize: 10,
    textSize: 24,
    textBold: true,
  };

  // 4. Initial Capture
  chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (res) => {
    if (res?.dataUrl) {
      const img = new Image();
      img.onload = () => {
        state.img = img;
        drawBackground();
      };
      img.src = res.dataUrl;
    }
  });

  // 5. Build UI Structure
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.innerHTML = `<div class="overlay-tip">Select Area</div>`;
  shadow.appendChild(overlay);

  const selBox = document.createElement("div");
  selBox.className = "selection-box";
  selBox.innerHTML = `
    <div class="bracket tl" data-handle="tl"></div>
    <div class="bracket tr" data-handle="tr"></div>
    <div class="bracket bl" data-handle="bl"></div>
    <div class="bracket br" data-handle="br"></div>
    
    <div class="unified-pill">
      <div class="pill-drag-handle" title="Drag to move toolbar"></div>
      <div class="btn" title="Pencil" data-tool="pen">${svgPath("pen")}</div>
      <div class="btn" title="Arrow" data-tool="arrow">${svgPath("arrow")}</div>
      <div class="btn active" title="Rectangle" data-tool="rect">${svgPath("rect")}</div>
      <div class="btn" title="Marker" data-tool="marker">${svgPath("marker")}</div>
      <div class="btn" title="Redact" data-tool="redact">${svgPath("redact")}</div>
      <div class="btn" title="Text" data-tool="text">${svgPath("text")}</div>
      
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
      
      <button class="btn" title="Undo" id="btn-undo">${svgPath("undo")}</button>
      <button class="btn" title="Redo" id="btn-redo">${svgPath("redo")}</button>
      <button class="btn" title="Layer Down" id="btn-layer-down">${svgPath("layerDown")}</button>
      <button class="btn" title="Layer Up" id="btn-layer-up">${svgPath("layerUp")}</button>
      <button class="btn" title="Delete (Del)" id="btn-delete">${svgPath("trash")}</button>
      <button class="btn" title="Duplicate (Ctrl+D)" id="btn-duplicate">${svgPath("duplicate")}</button>
      <button class="btn" title="Lock/Unlock" id="btn-lock">${svgPath("lock")}</button>
      
      <div class="group-divider"></div>
      
      <button class="btn" title="Snap to Grid" id="btn-grid-toggle">${svgPath("grid")}</button>
      <button class="btn" title="Text Size +" id="btn-text-size-up">A+</button>
      <button class="btn" title="Text Size -" id="btn-text-size-down">A-</button>
      <button class="btn" title="Toggle Bold" id="btn-text-bold" style="font-weight: 700;">B</button>
      
      <div class="group-divider"></div>
      
      <div class="btn btn-action" title="Copy" id="btn-copy">
         ${svgPath("copy")}
         <div class="action-feedback">Copied!</div>
      </div>
      <div class="btn btn-action" title="Download" id="btn-save">${svgPath("download")}</div>
      
      <div class="group-divider"></div>
      <div class="btn btn-close" title="Close" id="btn-close">${svgPath("close")}</div>
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

  const bgCanvas = document.createElement("canvas");
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  shadow.appendChild(bgCanvas);
  const bgCtx = bgCanvas.getContext("2d");

  const drawCanvas = document.createElement("canvas");
  drawCanvas.width = window.innerWidth;
  drawCanvas.height = window.innerHeight;
  shadow.appendChild(drawCanvas);
  const drawCtx = drawCanvas.getContext("2d");

  // 6. Interaction Logic
  const handleMouseDown = (e) => {
    if (state.textInput) commitTextInput();
    if (state.mode === "edit") return;
    state.isDragging = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.mode = "select";
    selBox.style.display = "block";
    overlay.querySelector(".overlay-tip").style.opacity = "0";
  };

  const handleMouseMove = (e) => {
    if (!state.isDragging) return;
    if (state.mode === "select") {
      state.x = Math.min(e.clientX, state.startX);
      state.y = Math.min(e.clientY, state.startY);
      state.w = Math.abs(e.clientX - state.startX);
      state.h = Math.abs(e.clientY - state.startY);
    } else if (state.mode === "resize") {
      const h = state.activeHandle;
      if (h.includes("r")) state.w = Math.max(10, e.clientX - state.x);
      if (h.includes("l")) {
        const dx = state.x - e.clientX;
        state.x = e.clientX;
        state.w += dx;
      }
      if (h.includes("b")) state.h = Math.max(10, e.clientY - state.y);
      if (h.includes("t")) {
        const dy = state.y - e.clientY;
        state.y = e.clientY;
        state.h += dy;
      }
    } else if (state.mode === "move") {
      state.x += e.clientX - state.startX;
      state.y += e.clientY - state.startY;
      state.startX = e.clientX;
      state.startY = e.clientY;
    } else if (state.mode === "draw") {
      state.tempPoints.push({ x: e.clientX, y: e.clientY });
      renderDrawings();
    } else if (state.mode === "drag-item") {
      const item = state.history[state.activeItemIndex];
      if (!item || item.locked) return;
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      translateItem(item, dx, dy);
      clampItemToSelection(item);
      state.startX = e.clientX;
      state.startY = e.clientY;
      state.draggedItemChanged = true;
      renderDrawings();
    } else if (state.mode === "resize-item") {
      const item = state.history[state.selectedItemIndex];
      if (
        !item ||
        !state.resizeStartItem ||
        !state.resizeStartBounds ||
        !state.resizeHandle
      )
        return;
      resizeItemFromHandle(
        item,
        state.resizeStartItem,
        state.resizeStartBounds,
        state.resizeHandle,
        e.clientX,
        e.clientY,
      );
      clampItemToSelection(item);
      state.itemResizedChanged = true;
      renderDrawings();
    }
    updateUI();
  };

  const handleMouseUp = (e) => {
    if (state.mode === "select" && (state.w < 5 || state.h < 5)) {
      selBox.style.display = "none";
      overlay.querySelector(".overlay-tip").style.opacity = "1";
    } else if (state.mode === "draw") {
      if (state.tempPoints.length > 0) {
        if (state.tool === "text") {
          const p0 = state.tempPoints[0];
          state.tempPoints = [];
          renderDrawings();
          openTextInput(p0.x, p0.y);
        } else {
          state.history.push({
            tool: state.tool,
            color: state.color,
            points: [...state.tempPoints],
          });
          state.redoStack = [];
          pushUndoSnapshot();
          state.tempPoints = [];
          renderDrawings();
        }
      }
    } else if (state.mode === "drag-item") {
      if (state.draggedItemChanged) {
        state.redoStack = [];
        pushUndoSnapshot();
      }
      state.activeItemIndex = -1;
      state.draggedItemChanged = false;
    } else if (state.mode === "resize-item") {
      if (state.itemResizedChanged) {
        state.redoStack = [];
        pushUndoSnapshot();
      }
      state.resizeHandle = null;
      state.resizeStartItem = null;
      state.resizeStartBounds = null;
      state.itemResizedChanged = false;
    }
    state.isDragging = false;
    state.activeHandle = null;
    if (state.w > 5) {
      state.mode = "edit";
      selBox.querySelector(".unified-pill").classList.add("visible");
    }
  };

  overlay.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  selBox.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    if (state.textInput) commitTextInput();
    if (e.target.classList.contains("bracket")) {
      state.isDragging = true;
      state.activeHandle = e.target.dataset.handle;
      state.mode = "resize";
    } else if (e.target.closest(".unified-pill")) {
      // Ignore
    } else if (state.mode === "edit") {
      const handleHit = findResizeHandleHit(e.clientX, e.clientY);
      if (handleHit && state.selectedItemIndex !== -1) {
        state.isDragging = true;
        state.mode = "resize-item";
        state.resizeHandle = handleHit;
        state.resizeStartItem = cloneItem(
          state.history[state.selectedItemIndex],
        );
        state.resizeStartBounds = getItemBounds(state.resizeStartItem);
        state.itemResizedChanged = false;
        return;
      }

      const hitIndex = findHitItem(e.clientX, e.clientY);
      if (hitIndex !== -1) {
        const item = state.history[hitIndex];

        // Select the item
        state.selectedItemIndex = hitIndex;
        state.activeItemIndex = hitIndex;
        state.isDragging = true;
        state.mode = "drag-item";
        state.startX = e.clientX;
        state.startY = e.clientY;
        state.draggedItemChanged = false;
        renderDrawings();
      } else if (state.tool === "text") {
        state.selectedItemIndex = -1;
        renderDrawings();
        openTextInput(e.clientX, e.clientY);
      } else if (state.tool) {
        state.selectedItemIndex = -1;
        renderDrawings();
        state.isDragging = true;
        state.mode = "draw";
        state.tempPoints = [{ x: e.clientX, y: e.clientY }];
      } else {
        state.isDragging = true;
        state.startX = e.clientX;
        state.startY = e.clientY;
        state.mode = "move";
      }
    } else {
      state.isDragging = true;
      state.startX = e.clientX;
      state.startY = e.clientY;
      state.mode = "move";
    }
  });

  selBox.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    const hitIndex = findHitItem(e.clientX, e.clientY);
    if (hitIndex === -1) return;
    const item = state.history[hitIndex];
    if (!item || item.tool !== "text") return;
    state.selectedItemIndex = hitIndex;
    openTextInput(item.points[0].x, item.points[0].y, hitIndex);
  });

  // Toolbar Drag Handler
  let pillDragging = false;
  let pillStartX = 0;
  let pillStartY = 0;
  let pillStartLeft = 0;
  let pillStartBottom = 0;

  const dragHandle = shadow.querySelector(".pill-drag-handle");
  const pill = shadow.querySelector(".unified-pill");

  dragHandle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    pillDragging = true;
    pillStartX = e.clientX;
    pillStartY = e.clientY;
    pillStartLeft = parseInt(pill.style.left || "50%");
    pillStartBottom = parseInt(pill.style.bottom || "20");
    dragHandle.style.cursor = "grabbing";
    pill.style.transition = "none"; // Disable animation while dragging
  });

  window.addEventListener("mousemove", (e) => {
    if (!pillDragging) return;
    const deltaX = e.clientX - pillStartX;
    const deltaY = e.clientY - pillStartY;
    pill.style.left = pillStartLeft + deltaX + "px";
    pill.style.transform = "none";
    pill.style.bottom = pillStartBottom - deltaY + "px";
  });

  window.addEventListener("mouseup", () => {
    if (pillDragging) {
      pillDragging = false;
      dragHandle.style.cursor = "grab";
      pill.style.transition =
        "opacity 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)";
    }
  });

  // 7. Tool Actions
  selBox.querySelectorAll(".btn[data-tool]").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      selBox
        .querySelectorAll(".btn[data-tool]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.tool = btn.dataset.tool;
    };
  });

  // Update Color & Adaptive UI
  function updateAccent(color) {
    state.color = color;
    container.style.setProperty("--accent", color);
  }

  selBox.querySelectorAll(".color-square[data-color]").forEach((sq) => {
    sq.onclick = (e) => {
      e.stopPropagation();
      updateAccent(sq.dataset.color);
      selBox
        .querySelectorAll(".color-square")
        .forEach((s) => s.classList.remove("active"));
      sq.classList.add("active");
    };
  });

  shadow.querySelector("#nativePicker").oninput = (e) => {
    updateAccent(e.target.value);
    selBox
      .querySelectorAll(".color-square")
      .forEach((s) => s.classList.remove("active"));
    shadow.querySelector(".custom-color-square").classList.add("active");
  };

  shadow.querySelector("#btn-undo").onclick = () => {
    if (state.undoStack.length <= 1) return;
    const current = cloneHistory(state.undoStack.pop());
    state.redoStack.push(current);
    state.history = cloneHistory(state.undoStack[state.undoStack.length - 1]);
    renderDrawings();
  };

  shadow.querySelector("#btn-redo").onclick = () => {
    if (state.redoStack.length <= 0) return;
    const restored = cloneHistory(state.redoStack.pop());
    state.undoStack.push(cloneHistory(restored));
    state.history = cloneHistory(restored);
    if (state.selectedItemIndex >= state.history.length)
      state.selectedItemIndex = state.history.length - 1;
    if (state.selectedItemIndex < 0) state.selectedItemIndex = -1;
    renderDrawings();
  };

  shadow.querySelector("#btn-layer-up").onclick = () => {
    const i = state.selectedItemIndex;
    if (i < 0 || i >= state.history.length - 1) return;
    [state.history[i], state.history[i + 1]] = [
      state.history[i + 1],
      state.history[i],
    ];
    state.selectedItemIndex = i + 1;
    state.redoStack = [];
    pushUndoSnapshot();
    renderDrawings();
  };

  shadow.querySelector("#btn-layer-down").onclick = () => {
    const i = state.selectedItemIndex;
    if (i <= 0) return;
    [state.history[i], state.history[i - 1]] = [
      state.history[i - 1],
      state.history[i],
    ];
    state.selectedItemIndex = i - 1;
    state.redoStack = [];
    pushUndoSnapshot();
    renderDrawings();
  };

  let pendingCaptureAction = null;

  function showCaptureModal(onComplete) {
    pendingCaptureAction = onComplete;
    shadow.getElementById("sm-overlay").classList.add("visible");
  }

  function handleCaptureChoice(type) {
    if (type === "pay") chrome.runtime.sendMessage({ action: "openPayment" });
    else chrome.runtime.sendMessage({ action: "openAd" });

    shadow.getElementById("sm-overlay").classList.remove("visible");
    if (pendingCaptureAction) {
      pendingCaptureAction();
      pendingCaptureAction = null;
    }
  }

  shadow.getElementById("sm-pay-btn").onclick = () =>
    handleCaptureChoice("pay");
  shadow.getElementById("sm-ad-btn").onclick = () => handleCaptureChoice("ad");
  shadow.getElementById("sm-close-btn").onclick = () => {
    shadow.getElementById("sm-overlay").classList.remove("visible");
    if (typeof pendingCaptureAction === "function") {
      pendingCaptureAction();
      pendingCaptureAction = null;
    }
  };

  shadow.querySelector("#btn-copy").onclick = async (e) => {
    showCaptureModal(async () => {
      const blob = await getCroppedBlob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      const feedback = shadow.querySelector(".action-feedback");
      feedback.classList.add("show");
      setTimeout(() => {
        feedback.classList.remove("show");
        cleanup();
      }, 1200);
    });
  };

  shadow.querySelector("#btn-save").onclick = async () => {
    showCaptureModal(async () => {
      const blob = await getCroppedBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `capture_${Date.now()}.png`;
      a.click();
      setTimeout(cleanup, 1000);
    });
  };

  shadow.querySelector("#btn-close").onclick = cleanup;

  function updateUI() {
    selBox.style.left = `${state.x}px`;
    selBox.style.top = `${state.y}px`;
    selBox.style.width = `${state.w}px`;
    selBox.style.height = `${state.h}px`;
  }

  function drawBackground() {
    if (!state.img) return;
    bgCtx.drawImage(state.img, 0, 0, bgCanvas.width, bgCanvas.height);
  }

  function renderDrawings() {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    state.history.forEach((item) => drawItem(item));
    if (state.tempPoints.length > 0) {
      drawItem({
        tool: state.tool,
        color: state.color,
        points: state.tempPoints,
      });
    }
    drawSelectedItemHandles();
  }

  function drawItem(item) {
    const ctx = drawCtx;
    ctx.save();
    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = item.tool === "marker" ? 15 : 3;
    ctx.globalAlpha = item.tool === "marker" ? 0.35 : 1.0;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const p = item.points;
    if (p.length < 1) {
      ctx.restore();
      return;
    }
    if (item.tool === "pen" || item.tool === "marker") {
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      p.forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    } else if (item.tool === "rect") {
      const last = p[p.length - 1];
      ctx.strokeRect(p[0].x, p[0].y, last.x - p[0].x, last.y - p[0].y);
    } else if (item.tool === "arrow") {
      const start = p[0],
        end = p[p.length - 1];
      const headlen = 12;
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headlen * Math.cos(angle - Math.PI / 6),
        end.y - headlen * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        end.x - headlen * Math.cos(angle + Math.PI / 6),
        end.y - headlen * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fill();
    } else if (item.tool === "text") {
      console.log(
        "[TextTool] Drawing text:",
        item.text,
        "at",
        p[0],
        "color:",
        item.color,
      );
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = item.color || "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const weight = item.bold ? "700" : "400";
      const size = item.size || 24;
      ctx.font = `${weight} ${size}px Outfit, sans-serif`;
      ctx.fillText(item.text || "", p[0].x, p[0].y);
    } else if (item.tool === "redact") {
      const last = p[p.length - 1];
      const x = Math.min(p[0].x, last.x);
      const y = Math.min(p[0].y, last.y);
      const w = Math.abs(last.x - p[0].x);
      const h = Math.abs(last.y - p[0].y);
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = "#000000";
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  }

  function cloneHistory(history) {
    return (history || []).map((item) => ({
      ...item,
      points: (item.points || []).map((pt) => ({ x: pt.x, y: pt.y })),
    }));
  }

  function cloneItem(item) {
    return {
      ...item,
      points: (item.points || []).map((pt) => ({ x: pt.x, y: pt.y })),
    };
  }

  function pushUndoSnapshot() {
    state.undoStack.push(cloneHistory(state.history));
    if (state.undoStack.length > 200) state.undoStack.shift();
  }

  function openTextInput(x, y, existingIndex = -1) {
    console.log("[TextTool] openTextInput called at", x, y);
    if (state.textInput) commitTextInput();

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type text...";
    input.setAttribute("autocomplete", "off");
    Object.assign(input.style, {
      position: "fixed",
      left: `${x}px`,
      top: `${y}px`,
      minWidth: "220px",
      height: "36px",
      padding: "8px 12px",
      borderRadius: "8px",
      border: `2px solid ${state.color}`,
      background: "rgba(30, 30, 40, 0.99)",
      color: "#ffffff",
      font: "700 16px Outfit, sans-serif",
      outline: "none",
      zIndex: "10001",
      boxShadow: `0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px ${state.color}44`,
      fontSize: "16px",
      caretColor: state.color,
    });

    // Add to document body (not shadow DOM) for proper keyboard input
    document.body.appendChild(input);

    if (existingIndex !== -1) {
      input.value = state.history[existingIndex]?.text || "";
    }

    // Define handlers and store them for later removal
    const handleKeyDown = (ev) => {
      if (ev.key === "Enter") {
        console.log("[TextTool] Enter pressed, value:", input.value);
        ev.preventDefault();
        ev.stopPropagation();
        commitTextInput();
      } else if (ev.key === "Escape") {
        console.log("[TextTool] Escape pressed");
        ev.preventDefault();
        ev.stopPropagation();
        commitTextInput(true);
      }
    };

    const handleBlur = () => {
      console.log("[TextTool] Input blur");
      commitTextInput();
    };

    const handleMouseDown = (e) => e.stopPropagation();
    const handleMouseUp = (e) => e.stopPropagation();
    const handleClick = (e) => e.stopPropagation();

    state.textInput = {
      el: input,
      x,
      y,
      existingIndex,
      handleKeyDown,
      handleBlur,
      handleMouseDown,
      handleMouseUp,
      handleClick,
    };

    // Attach event listeners
    input.addEventListener("mousedown", handleMouseDown);
    input.addEventListener("mouseup", handleMouseUp);
    input.addEventListener("click", handleClick);
    input.addEventListener("keydown", handleKeyDown);
    input.addEventListener("blur", handleBlur);

    // Use setTimeout to ensure focus happens after current event loop finishes
    setTimeout(() => {
      input.focus();
      input.select();
      console.log("[TextTool] Input created and focused (delayed)");
    }, 0);
  }

  function commitTextInput(cancel = false) {
    if (!state.textInput) return;
    const { el, x, y, existingIndex } = state.textInput;
    const value = (el.value || "").trim();
    console.log(
      "[TextTool] commitTextInput - cancel:",
      cancel,
      "value:",
      value,
    );

    // Remove all event listeners to prevent cascading events
    el.removeEventListener("keydown", state.textInput.handleKeyDown);
    el.removeEventListener("blur", state.textInput.handleBlur);
    el.removeEventListener("mousedown", state.textInput.handleMouseDown);
    el.removeEventListener("mouseup", state.textInput.handleMouseUp);
    el.removeEventListener("click", state.textInput.handleClick);

    // Safely remove element from DOM
    if (el.parentNode) {
      try {
        el.remove();
      } catch (e) {
        console.log("[TextTool] Error removing input element:", e);
      }
    }

    state.textInput = null;

    if (!cancel && value) {
      if (existingIndex !== -1 && state.history[existingIndex]) {
        state.history[existingIndex].text = value;
        state.history[existingIndex].color = state.color;
        state.history[existingIndex].size = state.textSize;
        state.history[existingIndex].bold = state.textBold;
        state.selectedItemIndex = existingIndex;
      } else {
        const textItem = {
          tool: "text",
          color: state.color,
          points: [{ x, y }],
          text: value,
          size: state.textSize,
          bold: state.textBold,
        };
        console.log("[TextTool] Adding text item:", textItem);
        state.history.push(textItem);
        state.selectedItemIndex = state.history.length - 1;
      }
      state.redoStack = [];
      pushUndoSnapshot();
      console.log(
        "[TextTool] Calling renderDrawings with history:",
        state.history,
      );
      renderDrawings();
    }
  }

  function translateItem(item, dx, dy) {
    item.points = item.points.map((pt) => {
      let nx = pt.x + dx;
      let ny = pt.y + dy;
      if (state.snapToGrid) {
        nx = Math.round(nx / state.gridSize) * state.gridSize;
        ny = Math.round(ny / state.gridSize) * state.gridSize;
      }
      return { x: nx, y: ny };
    });
  }

  function isPointInsideSelection(x, y) {
    return (
      x >= state.x &&
      x <= state.x + state.w &&
      y >= state.y &&
      y <= state.y + state.h
    );
  }

  function getItemBounds(item) {
    const pts = item.points || [];
    if (pts.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    if (item.tool === "text") {
      const weight = item.bold ? "700" : "400";
      const size = item.size || 24;
      drawCtx.font = `${weight} ${size}px Outfit, sans-serif`;
      const width = drawCtx.measureText(item.text || "").width;
      return {
        minX: pts[0].x,
        minY: pts[0].y,
        maxX: pts[0].x + width,
        maxY: pts[0].y + size,
      };
    }

    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    };
  }

  function clampItemToSelection(item) {
    const b = getItemBounds(item);
    const sx1 = state.x;
    const sy1 = state.y;
    const sx2 = state.x + state.w;
    const sy2 = state.y + state.h;
    let dx = 0;
    let dy = 0;

    if (b.minX < sx1) dx = sx1 - b.minX;
    else if (b.maxX > sx2) dx = sx2 - b.maxX;
    if (b.minY < sy1) dy = sy1 - b.minY;
    else if (b.maxY > sy2) dy = sy2 - b.maxY;

    if (dx || dy) translateItem(item, dx, dy);
  }

  function findHitItem(x, y) {
    for (let i = state.history.length - 1; i >= 0; i--) {
      if (isPointOnItem(state.history[i], x, y)) return i;
    }
    return -1;
  }

  function drawSelectedItemHandles() {
    if (
      state.selectedItemIndex < 0 ||
      state.selectedItemIndex >= state.history.length
    )
      return;
    const item = state.history[state.selectedItemIndex];
    if (!item) return;

    const b = getItemBounds(item);
    drawCtx.save();
    drawCtx.globalAlpha = 1;
    drawCtx.strokeStyle = item.locked ? "#ef4444" : "#60a5fa";
    drawCtx.lineWidth = item.locked ? 2.5 : 1.5;
    drawCtx.setLineDash(item.locked ? [10, 4] : [6, 4]);
    drawCtx.strokeRect(
      b.minX,
      b.minY,
      Math.max(1, b.maxX - b.minX),
      Math.max(1, b.maxY - b.minY),
    );
    drawCtx.setLineDash([]);

    if (!item.locked) {
      getResizeHandlesFromBounds(b).forEach((h) => {
        drawCtx.fillStyle = "#ffffff";
        drawCtx.strokeStyle = item.tool === "text" ? "#fbbf24" : "#2563eb";
        drawCtx.lineWidth = 1;
        drawCtx.fillRect(h.x - 4, h.y - 4, 8, 8);
        drawCtx.strokeRect(h.x - 4, h.y - 4, 8, 8);
      });
    } else if (item.locked) {
      drawCtx.fillStyle = "#ef4444";
      drawCtx.font = "600 12px Outfit, sans-serif";
      drawCtx.fillText("LOCKED", b.minX + 4, b.minY - 4);
    }
    drawCtx.restore();
  }

  function getResizeHandlesFromBounds(b) {
    return [
      { id: "tl", x: b.minX, y: b.minY },
      { id: "tr", x: b.maxX, y: b.minY },
      { id: "bl", x: b.minX, y: b.maxY },
      { id: "br", x: b.maxX, y: b.maxY },
    ];
  }

  function findResizeHandleHit(x, y) {
    if (
      state.selectedItemIndex < 0 ||
      state.selectedItemIndex >= state.history.length
    )
      return null;
    const item = state.history[state.selectedItemIndex];
    if (!item) return null;
    const bounds = getItemBounds(item);
    const handles = getResizeHandlesFromBounds(bounds);
    for (const h of handles) {
      if (Math.abs(x - h.x) <= 8 && Math.abs(y - h.y) <= 8) return h.id;
    }
    return null;
  }

  function resizeItemFromHandle(
    item,
    startItem,
    startBounds,
    handle,
    mouseX,
    mouseY,
  ) {
    const minSize = 10;
    let left = startBounds.minX;
    let right = startBounds.maxX;
    let top = startBounds.minY;
    let bottom = startBounds.maxY;

    if (handle.includes("l")) left = Math.min(mouseX, right - minSize);
    if (handle.includes("r")) right = Math.max(mouseX, left + minSize);
    if (handle.includes("t")) top = Math.min(mouseY, bottom - minSize);
    if (handle.includes("b")) bottom = Math.max(mouseY, top + minSize);

    const srcW = Math.max(1, startBounds.maxX - startBounds.minX);
    const srcH = Math.max(1, startBounds.maxY - startBounds.minY);
    const dstW = Math.max(1, right - left);
    const dstH = Math.max(1, bottom - top);

    // For text items, scale the font size instead of moving points
    if (item.tool === "text") {
      const scaleH = dstH / srcH;
      const newSize = Math.max(8, Math.round((startItem.size || 24) * scaleH));
      item.size = newSize;
      item.points[0] = { x: left, y: top };
    } else {
      item.points = startItem.points.map((pt) => {
        const rx = (pt.x - startBounds.minX) / srcW;
        const ry = (pt.y - startBounds.minY) / srcH;
        return { x: left + rx * dstW, y: top + ry * dstH };
      });
    }
  }

  function isPointOnItem(item, x, y) {
    const p = item.points || [];
    if (p.length === 0) return false;

    if (item.tool === "text") {
      const b = getItemBounds(item);
      return x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY;
    }

    if (item.tool === "rect" || item.tool === "redact") {
      const b = getItemBounds(item);
      return (
        x >= b.minX - 8 && x <= b.maxX + 8 && y >= b.minY - 8 && y <= b.maxY + 8
      );
    }

    if (p.length === 1) return Math.hypot(x - p[0].x, y - p[0].y) <= 8;
    const tolerance = item.tool === "marker" ? 14 : 10;
    for (let i = 0; i < p.length - 1; i++) {
      if (pointToSegmentDistance(x, y, p[i], p[i + 1]) <= tolerance)
        return true;
    }
    return false;
  }

  function pointToSegmentDistance(px, py, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (dx === 0 && dy === 0) return Math.hypot(px - a.x, py - a.y);
    const t = Math.max(
      0,
      Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy)),
    );
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  async function getCroppedBlob() {
    const canvas = document.createElement("canvas");
    canvas.width = state.w;
    canvas.height = state.h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      state.img,
      state.x,
      state.y,
      state.w,
      state.h,
      0,
      0,
      state.w,
      state.h,
    );
    ctx.drawImage(
      drawCanvas,
      state.x,
      state.y,
      state.w,
      state.h,
      0,
      0,
      state.w,
      state.h,
    );
    return new Promise((r) => canvas.toBlob(r, "image/png"));
  }

  function cleanup() {
    if (state.textInput) commitTextInput(true);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    container.remove();
    window.__teCaptureActive = false;
  }

  function svgPath(type) {
    const paths = {
      pen: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
      arrow:
        '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>',
      rect: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>',
      marker:
        '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
      redact:
        '<rect x="4" y="5" width="16" height="14" rx="2" ry="2"></rect><line x1="4" y1="10" x2="20" y2="10"></line><line x1="4" y1="14" x2="20" y2="14"></line>',
      text: '<polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="12" y1="4" x2="12" y2="20"></line>',
      undo: '<path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>',
      redo: '<path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"></path>',
      layerUp: '<path d="M12 5l5 5H7l5-5z"></path><path d="M12 19V10"></path>',
      layerDown:
        '<path d="M12 19l-5-5h10l-5 5z"></path><path d="M12 5v9"></path>',
      copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
      download:
        '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
      close:
        '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
      trash:
        '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>',
      duplicate:
        '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>',
      lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
      grid: '<line x1="3" y1="3" x2="21" y2="3"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="3" y1="21" x2="21" y2="21"></line><line x1="3" y1="3" x2="3" y2="21"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="21" y1="3" x2="21" y2="21"></line>',
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[type]}</svg>`;
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cleanup();

    // Edit selected text with Enter
    if (e.key === "Enter" && state.selectedItemIndex >= 0 && !state.textInput) {
      const item = state.history[state.selectedItemIndex];
      if (item && item.tool === "text") {
        e.preventDefault();
        openTextInput(
          item.points[0].x,
          item.points[0].y,
          state.selectedItemIndex,
        );
        return;
      }
    }

    // Delete selected item with Delete or Backspace
    if (
      (e.key === "Delete" || e.key === "Backspace") &&
      state.selectedItemIndex >= 0
    ) {
      e.preventDefault();
      const item = state.history[state.selectedItemIndex];
      if (item && !item.locked) {
        state.history.splice(state.selectedItemIndex, 1);
        state.selectedItemIndex = -1;
        state.redoStack = [];
        pushUndoSnapshot();
        renderDrawings();
      }
    }

    // Duplicate with Ctrl+D or Cmd+D
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "d" &&
      state.selectedItemIndex >= 0
    ) {
      e.preventDefault();
      const item = state.history[state.selectedItemIndex];
      if (item) {
        const dup = cloneItem(item);
        dup.points = dup.points.map((pt) => ({ x: pt.x + 10, y: pt.y + 10 }));
        state.history.push(dup);
        state.selectedItemIndex = state.history.length - 1;
        state.redoStack = [];
        pushUndoSnapshot();
        renderDrawings();
      }
    }
  });

  // Button handlers for delete, duplicate, lock, grid, text controls
  shadow.querySelector("#btn-delete").onclick = () => {
    if (state.selectedItemIndex >= 0) {
      state.history.splice(state.selectedItemIndex, 1);
      state.selectedItemIndex = -1;
      state.redoStack = [];
      pushUndoSnapshot();
      renderDrawings();
    }
  };

  shadow.querySelector("#btn-duplicate").onclick = () => {
    if (state.selectedItemIndex >= 0) {
      const item = state.history[state.selectedItemIndex];
      if (item) {
        const dup = cloneItem(item);
        dup.points = dup.points.map((pt) => ({ x: pt.x + 10, y: pt.y + 10 }));
        state.history.push(dup);
        state.selectedItemIndex = state.history.length - 1;
        state.redoStack = [];
        pushUndoSnapshot();
        renderDrawings();
      }
    }
  };

  shadow.querySelector("#btn-lock").onclick = () => {
    if (state.selectedItemIndex >= 0) {
      const item = state.history[state.selectedItemIndex];
      if (item) {
        item.locked = !item.locked;
        state.redoStack = [];
        pushUndoSnapshot();
        renderDrawings();
      }
    }
  };

  shadow.querySelector("#btn-grid-toggle").onclick = () => {
    state.snapToGrid = !state.snapToGrid;
    shadow.querySelector("#btn-grid-toggle").classList.toggle("active");
  };

  shadow.querySelector("#btn-text-size-up").onclick = () => {
    state.textSize = Math.min(48, state.textSize + 2);
    if (
      state.selectedItemIndex >= 0 &&
      state.history[state.selectedItemIndex]?.tool === "text"
    ) {
      state.history[state.selectedItemIndex].size = state.textSize;
      state.redoStack = [];
      pushUndoSnapshot();
      renderDrawings();
    }
  };

  shadow.querySelector("#btn-text-size-down").onclick = () => {
    state.textSize = Math.max(8, state.textSize - 2);
    if (
      state.selectedItemIndex >= 0 &&
      state.history[state.selectedItemIndex]?.tool === "text"
    ) {
      state.history[state.selectedItemIndex].size = state.textSize;
      state.redoStack = [];
      pushUndoSnapshot();
      renderDrawings();
    }
  };

  shadow.querySelector("#btn-text-bold").onclick = () => {
    state.textBold = !state.textBold;
    shadow.querySelector("#btn-text-bold").classList.toggle("active");
    if (
      state.selectedItemIndex >= 0 &&
      state.history[state.selectedItemIndex]?.tool === "text"
    ) {
      state.history[state.selectedItemIndex].bold = state.textBold;
      state.redoStack = [];
      pushUndoSnapshot();
      renderDrawings();
    }
  };
})();
