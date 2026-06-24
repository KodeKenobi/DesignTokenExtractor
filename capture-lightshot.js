(function() {
  console.log("[TokenExtractor] ✓ Capture script loaded - Lightshot-style selection");

  if (window.__teCaptureActive) {
    console.warn("[TokenExtractor] Capture already active");
    return;
  }
  window.__teCaptureActive = true;

  // State
  const state = {
    screenshotDataUrl: null,
    isSelecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    canvasWidth: 0,
    canvasHeight: 0
  };

  // 1. Request full page screenshot
  console.log("[TokenExtractor] Requesting full page screenshot...");
  chrome.runtime.sendMessage({ action: "captureFullPage" }, handleScreenshot);

  function handleScreenshot(res) {
    if (chrome.runtime.lastError) {
      console.error("[TokenExtractor] ✗ Capture failed:", chrome.runtime.lastError.message);
      showError("Screenshot failed: " + chrome.runtime.lastError.message);
      return;
    }

    if (!res.dataUrl) {
      console.error("[TokenExtractor] ✗ No screenshot data");
      showError("Failed to capture screenshot");
      return;
    }

    console.log("[TokenExtractor] ✓ Screenshot received");
    state.screenshotDataUrl = res.dataUrl;
    createCaptureUI();
  }

  function createCaptureUI() {
    // Create root container
    const container = document.createElement('div');
    container.id = 'te-capture-root';
    Object.assign(container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '2147483647',
      margin: '0',
      padding: '0',
      border: 'none'
    });

    // Shadow DOM for isolation
    const shadow = container.attachShadow({ mode: 'open' });

    // CSS
    const style = document.createElement('style');
    style.textContent = `
      :host {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        cursor: crosshair;
      }

      .capture-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
      }

      .capture-container {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      }

      canvas {
        display: block;
        cursor: crosshair;
        user-select: none;
      }

      .selection-box {
        position: absolute;
        border: 2px solid #4f46e5;
        background: rgba(79, 70, 229, 0.1);
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
        cursor: move;
        display: none;
        z-index: 10;
      }

      .toolbar {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        background: rgba(15, 23, 42, 0.95);
        padding: 12px 20px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        z-index: 100;
        backdrop-filter: blur(10px);
      }

      button {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        color: white;
      }

      .btn-confirm {
        background: #10b981;
      }

      .btn-confirm:hover {
        background: #059669;
      }

      .btn-cancel {
        background: rgba(255, 255, 255, 0.2);
      }

      .btn-cancel:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .info-text {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-size: 14px;
        background: rgba(15, 23, 42, 0.9);
        padding: 10px 20px;
        border-radius: 8px;
        z-index: 99;
        backdrop-filter: blur(10px);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
    `;

    // HTML
    const overlay = document.createElement('div');
    overlay.className = 'capture-overlay';
    overlay.innerHTML = `
      <div class="capture-container">
        <canvas id="capture-canvas"></canvas>
        <div class="selection-box" id="selection-box"></div>
      </div>
    `;

    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.innerHTML = `
      <button class="btn-cancel" id="btn-cancel">Cancel</button>
      <button class="btn-confirm" id="btn-confirm" disabled>Extract Tokens</button>
    `;

    const infoText = document.createElement('div');
    infoText.className = 'info-text';
    infoText.textContent = 'Click and drag to select area';

    shadow.appendChild(style);
    shadow.appendChild(infoText);
    shadow.appendChild(overlay);
    shadow.appendChild(toolbar);

    // Add to DOM
    document.documentElement.appendChild(container);

    // Get canvas and render screenshot
    setTimeout(() => {
      const canvas = shadow.getElementById('capture-canvas');
      const selectionBox = shadow.getElementById('selection-box');
      const btnConfirm = shadow.getElementById('btn-confirm');
      const btnCancel = shadow.getElementById('btn-cancel');

      if (!canvas) {
        console.error("[TokenExtractor] Canvas element not found");
        return;
      }

      const img = new Image();
      img.onload = () => {
        console.log("[TokenExtractor] Screenshot loaded, size:", img.width, "x", img.height);
        canvas.width = img.width;
        canvas.height = img.height;
        state.canvasWidth = img.width;
        state.canvasHeight = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Enable selection
        setupSelection(canvas, selectionBox, btnConfirm, btnCancel, container);
      };

      img.onerror = () => {
        console.error("[TokenExtractor] Failed to load screenshot image");
        showError("Failed to load screenshot");
      };

      img.src = state.screenshotDataUrl;
    }, 0);
  }

  function setupSelection(canvas, selectionBox, btnConfirm, btnCancel, rootContainer) {
    const shadowRoot = rootContainer.shadowRoot;
    let isDrawing = false;
    let startX = 0;
    let startY = 0;

    // Get canvas position relative to viewport
    const getCanvasOffset = () => {
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    };

    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      const offset = getCanvasOffset();
      startX = e.clientX - offset.x;
      startY = e.clientY - offset.y;

      // Clamp to canvas
      startX = Math.max(0, Math.min(startX, state.canvasWidth));
      startY = Math.max(0, Math.min(startY, state.canvasHeight));

      state.startX = startX;
      state.startY = startY;

      selectionBox.style.display = 'block';
      selectionBox.style.left = startX + 'px';
      selectionBox.style.top = startY + 'px';
      selectionBox.style.width = '0px';
      selectionBox.style.height = '0px';

      console.log("[TokenExtractor] Selection started at", startX, startY);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;

      const offset = getCanvasOffset();
      let currentX = e.clientX - offset.x;
      let currentY = e.clientY - offset.y;

      // Clamp to canvas
      currentX = Math.max(0, Math.min(currentX, state.canvasWidth));
      currentY = Math.max(0, Math.min(currentY, state.canvasHeight));

      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);

      selectionBox.style.left = left + 'px';
      selectionBox.style.top = top + 'px';
      selectionBox.style.width = width + 'px';
      selectionBox.style.height = height + 'px';

      state.currentX = currentX;
      state.currentY = currentY;

      // Enable confirm button only if area selected
      if (width > 10 && height > 10) {
        btnConfirm.disabled = false;
      }
    });

    canvas.addEventListener('mouseup', () => {
      isDrawing = false;
    });

    // Buttons
    btnCancel.addEventListener('click', () => {
      console.log("[TokenExtractor] Capture cancelled");
      rootContainer.remove();
      window.__teCaptureActive = false;
    });

    btnConfirm.addEventListener('click', () => {
      const width = Math.abs(state.currentX - state.startX);
      const height = Math.abs(state.currentY - state.startY);

      if (width < 10 || height < 10) {
        alert('Please select a larger area');
        return;
      }

      extractSelection(canvas, btnConfirm, rootContainer);
    });
  }

  function extractSelection(canvas, btnConfirm, rootContainer) {
    const width = Math.abs(state.currentX - state.startX);
    const height = Math.abs(state.currentY - state.startY);
    const left = Math.min(state.startX, state.currentX);
    const top = Math.min(state.startY, state.currentY);

    console.log("[TokenExtractor] Extracting selection:", left, top, width, height);

    // Create crop canvas
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = width;
    cropCanvas.height = height;

    const ctx = cropCanvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, -left, -top);
      const croppedDataUrl = cropCanvas.toDataURL('image/png');

      console.log("[TokenExtractor] Cropped image created, sending to extraction");

      // Disable button and show processing
      btnConfirm.disabled = true;
      btnConfirm.textContent = 'Extracting...';

      // Send for token extraction
      chrome.runtime.sendMessage(
        { action: 'extractTokensFromImage', imageData: croppedDataUrl },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("[TokenExtractor] Extraction error:", chrome.runtime.lastError.message);
            alert('Extraction failed: ' + chrome.runtime.lastError.message);
          } else {
            console.log("[TokenExtractor] ✓ Tokens extracted:", response);
            // Send to sidebar or show results
            chrome.runtime.sendMessage({ action: 'showExtractedTokens', tokens: response.tokens });
          }

          rootContainer.remove();
          window.__teCaptureActive = false;
        }
      );
    };

    img.src = state.screenshotDataUrl;
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    Object.assign(errorDiv.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#ef4444',
      color: 'white',
      padding: '15px 25px',
      borderRadius: '8px',
      zIndex: '9999',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    });
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => errorDiv.remove(), 5000);
  }
})();
