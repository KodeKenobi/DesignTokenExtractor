// Floating Panel - Injects a draggable, closable floating window into the webpage
(function () {
  if (window.__teFloatingPanelActive) return;

  // Only run in floating mode, not in sidebar/popup/minibar contexts
  if (window.__tePopupDomBridged) {
    console.log(
      "[TokenExtractor] Skipping floating panel in non-floating context",
    );
    return;
  }

  window.__teFloatingPanelActive = true;

  function getRuntime() {
    try {
      return globalThis.chrome?.runtime || null;
    } catch (_) {
      return null;
    }
  }

  function isExtensionContextValid() {
    const runtime = getRuntime();
    if (!runtime) return false;

    try {
      return Boolean(runtime.id);
    } catch (_) {
      return false;
    }
  }

  function showContextInvalidatedMessage(message) {
    const contentDiv = shadow.querySelector("#te-panel-content");
    if (!contentDiv) return;

    contentDiv.innerHTML = `<div style="padding: 16px; color: #f8fafc; font-family: Inter, sans-serif; line-height: 1.5;"><div style="font-weight: 700; margin-bottom: 8px; color: #f59e0b;">Extension Reloaded</div><div style="color: #cbd5e1;">${message}</div><div style="margin-top: 10px; color: #94a3b8; font-size: 12px;">Refresh this page, then reopen the floating panel.</div></div>`;
  }

  function safeRuntimeSendMessage(payload, callback) {
    if (!isExtensionContextValid()) {
      callback?.({
        error:
          "Extension context invalidated. Refresh the page and reopen the panel.",
      });
      return;
    }

    try {
      chrome.runtime.sendMessage(payload, callback);
    } catch (error) {
      const message = error?.message || "Extension context invalidated";
      console.warn("[TokenExtractor] Runtime message failed:", message);
      callback?.({ error: message });
      showContextInvalidatedMessage(message);
    }
  }

  function getRuntimeLastErrorMessage() {
    try {
      return chrome.runtime?.lastError?.message || "";
    } catch (_) {
      return "Extension context invalidated. Refresh the page and reopen the panel.";
    }
  }

  function getStorageLocal() {
    try {
      return globalThis.chrome?.storage?.local || null;
    } catch (_) {
      return null;
    }
  }

  function safeStorageSet(value) {
    const storageLocal = getStorageLocal();
    if (!storageLocal) return;
    try {
      storageLocal.set(value);
    } catch (_) {
      // Expected after extension reloads invalidate old page contexts.
    }
  }

  function safeStorageGet(keys, callback) {
    const storageLocal = getStorageLocal();
    if (!storageLocal) {
      callback({});
      return;
    }
    try {
      storageLocal.get(keys, callback);
    } catch (_) {
      callback({});
    }
  }

  // Create floating panel container
  const panelContainer = document.createElement("div");
  panelContainer.id = "te-floating-panel-root";
  panelContainer.style.position = "fixed";
  panelContainer.style.top = "20px";
  panelContainer.style.right = "20px";
  panelContainer.style.width = "380px";
  panelContainer.style.height = "600px";
  panelContainer.style.zIndex = "2147483646";
  panelContainer.style.pointerEvents = "auto";
  panelContainer.style.display = "none"; // Start hidden
  panelContainer.style.fontFamily = '"Inter", sans-serif';

  const shadow = panelContainer.attachShadow({ mode: "open" });

  // Floating panel styles (includes everything from popup.html)
  const styles = document.createElement("style");
  styles.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@300;400;600;700&display=swap');
    
    :host {
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --bg-dark: #0f172a;
      --bg-card: rgba(30, 41, 59, 0.7);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --border: rgba(255, 255, 255, 0.1);
      --glass-bg: rgba(15, 23, 42, 0.8);
      --glass-border: rgba(255, 255, 255, 0.1);
      --success: #10b981;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .panel-wrapper {
      position: absolute;
      top: 0;
      right: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      overflow: hidden;
      pointer-events: auto;
      user-select: none;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      background: rgba(0, 0, 0, 0.3);
      cursor: move;
      flex-shrink: 0;
    }

    .panel-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-main);
      flex: 1;
    }

    .panel-header-buttons {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .panel-settings-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.2s;
      border: none;
      background: none;
      font-size: 18px;
      padding: 0;
      pointer-events: auto;
    }

    .panel-settings-btn:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    .panel-close {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.2s;
      border: none;
      background: none;
      font-size: 18px;
      padding: 0;
      pointer-events: auto;
    }

    .panel-close:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    /* Settings Modal */
    .mode-settings-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      backdrop-filter: blur(4px);
    }

    .mode-settings-overlay.visible {
      display: flex;
    }

    .mode-settings-modal {
      background: var(--glass-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
      color: var(--text-main);
    }

    .mode-settings-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
      color: var(--text-main);
    }

    .mode-option {
      display: flex;
      align-items: center;
      padding: 12px 14px;
      margin-bottom: 10px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .mode-option:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .mode-option.selected {
      background: rgba(99, 102, 241, 0.2);
      border-color: var(--primary);
    }

    .mode-radio {
      width: 18px;
      height: 18px;
      border: 2px solid var(--text-muted);
      border-radius: 50%;
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .mode-option.selected .mode-radio {
      border-color: var(--primary);
      background: var(--primary);
    }

    .mode-radio::after {
      content: '✓';
      color: white;
      font-size: 12px;
      font-weight: bold;
      display: none;
    }

    .mode-option.selected .mode-radio::after {
      display: block;
    }

    .mode-label {
      flex: 1;
    }

    .mode-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);
    }

    .mode-desc {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .mode-close-btn {
      margin-top: 16px;
      padding: 10px 16px;
      background: var(--primary);
      border: none;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s;
    }

    .mode-close-btn:hover {
      background: var(--primary-hover);
    }

    .mode-hint {
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #a7f3d0;
      font-size: 11px;
      line-height: 1.4;
      display: none;
    }

    .mode-hint.visible {
      display: block;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      color: var(--text-main);
      font-family: "Inter", sans-serif;
      display: flex;
      flex-direction: column;
    }

    /* Scrollbar styling */
    .panel-content::-webkit-scrollbar {
      width: 6px;
    }

    .panel-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .panel-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }

    .panel-content::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .resize-handle {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      cursor: se-resize;
      background: linear-gradient(135deg, transparent 0%, rgba(99, 102, 241, 0.1) 100%);
      border-radius: 0 0 12px 0;
      pointer-events: auto;
    }
  `;

  shadow.appendChild(styles);

  // HTML wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "panel-wrapper";
  wrapper.innerHTML = `
    <div class="panel-header">
      <div class="panel-title">Design Token Extractor</div>
      <div class="panel-header-buttons">
        <button class="panel-settings-btn" title="Settings">⚙</button>
        <button class="panel-close">×</button>
      </div>
    </div>
    <div class="panel-content" id="te-panel-content"></div>
    <div class="resize-handle"></div>
    <div class="mode-settings-overlay" id="mode-settings-overlay">
      <div class="mode-settings-modal">
        <div class="mode-settings-title">Interface Mode</div>
        <div class="mode-option" data-mode="floating">
          <div class="mode-radio"></div>
          <div class="mode-label">
            <div class="mode-name">Floating Panel</div>
            <div class="mode-desc">Draggable floating window (current)</div>
          </div>
        </div>
        <div class="mode-option" data-mode="popup">
          <div class="mode-radio"></div>
          <div class="mode-label">
            <div class="mode-name">Popup</div>
            <div class="mode-desc">Extension popup interface</div>
          </div>
        </div>
        <div class="mode-option" data-mode="sidebar">
          <div class="mode-radio"></div>
          <div class="mode-label">
            <div class="mode-name">Side Panel</div>
            <div class="mode-desc">VS Code-style sidebar (experimental)</div>
          </div>
        </div>
        <div class="mode-option" data-mode="minibar">
          <div class="mode-radio"></div>
          <div class="mode-label">
            <div class="mode-name">Mini Bar</div>
            <div class="mode-desc">Compact top toolbar (experimental)</div>
          </div>
        </div>
        <div class="mode-hint" id="mode-hint"></div>
        <button class="mode-close-btn">Close Settings</button>
      </div>
    </div>
  `;

  shadow.appendChild(wrapper);

  // Append to document
  document.documentElement.appendChild(panelContainer);

  // Close button handler
  shadow.querySelector(".panel-close").addEventListener("click", () => {
    panelContainer.style.display = "none";
    safeStorageSet({ floatingPanelOpen: false });
  });

  // Settings button handler
  const settingsBtn = shadow.querySelector(".panel-settings-btn");
  const settingsOverlay = shadow.querySelector("#mode-settings-overlay");
  const modeOptions = shadow.querySelectorAll(".mode-option");
  const modeCloseBtn = shadow.querySelector(".mode-close-btn");
  const modeHint = shadow.querySelector("#mode-hint");

  function showModeHint(text) {
    if (!modeHint) return;
    modeHint.textContent = text;
    modeHint.classList.add("visible");
  }

  function hideModeHint() {
    if (!modeHint) return;
    modeHint.classList.remove("visible");
    modeHint.textContent = "";
  }

  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    safeStorageGet(["uiMode"], (data) => {
      const currentMode = data.uiMode || "floating";
      modeOptions.forEach((opt) => {
        if (opt.dataset.mode === currentMode) {
          opt.classList.add("selected");
        } else {
          opt.classList.remove("selected");
        }
      });
      hideModeHint();
      settingsOverlay.classList.add("visible");
    });
  });

  modeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const mode = option.dataset.mode;
      safeStorageSet({ uiMode: mode });
      modeOptions.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");

      // Log mode selection
      console.log(`[TokenExtractor] UI Mode changed to: ${mode}`);

      if (mode !== "floating") {
        window.__teFloatingPanel.hide();
      }

      if (mode === "sidebar") {
        showModeHint(
          "Side Panel mode set. Click the extension icon to open the side panel.",
        );
      } else if (mode === "popup") {
        showModeHint(
          "Popup mode set. Click the extension icon to open the popup.",
        );
      } else if (mode === "minibar") {
        showModeHint(
          "Mini Bar mode set. A compact bubble will appear on the page.",
        );
      } else {
        hideModeHint();
      }

      safeRuntimeSendMessage({ action: "applyUiMode", mode }, (resp) => {
        if (resp?.error) {
          showModeHint(`Mode apply warning: ${resp.error}`);
        }
      });
    });
  });

  modeCloseBtn.addEventListener("click", () => {
    settingsOverlay.classList.remove("visible");
  });

  settingsOverlay.addEventListener("click", (e) => {
    if (e.target === settingsOverlay) {
      settingsOverlay.classList.remove("visible");
    }
  });

  // Dragging functionality
  let isDragging = false;
  let startX, startY, startLeft, startTop;

  const header = shadow.querySelector(".panel-header");
  header.addEventListener("mousedown", (e) => {
    if (e.target.closest(".panel-close")) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = panelContainer.offsetLeft;
    startTop = panelContainer.offsetTop;
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
  });

  function onDrag(e) {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    panelContainer.style.left = startLeft + deltaX + "px";
    panelContainer.style.right = "auto";
    panelContainer.style.top = startTop + deltaY + "px";
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    // Save position
    safeStorageSet({
      floatingPanelPos: {
        left: panelContainer.style.left,
        top: panelContainer.style.top,
      },
    });
  }

  // Resizing functionality
  const resizeHandle = shadow.querySelector(".resize-handle");
  let isResizing = false;
  let resizeStartX, resizeStartY, resizeStartWidth, resizeStartHeight;

  resizeHandle.addEventListener("mousedown", (e) => {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartWidth = panelContainer.offsetWidth;
    resizeStartHeight = panelContainer.offsetHeight;
    document.addEventListener("mousemove", onResize);
    document.addEventListener("mouseup", stopResize);
    e.preventDefault();
  });

  function onResize(e) {
    if (!isResizing) return;
    const deltaX = e.clientX - resizeStartX;
    const deltaY = e.clientY - resizeStartY;
    const newWidth = Math.max(300, resizeStartWidth + deltaX);
    const newHeight = Math.max(300, resizeStartHeight + deltaY);
    panelContainer.style.width = newWidth + "px";
    panelContainer.style.height = newHeight + "px";
  }

  function stopResize() {
    isResizing = false;
    document.removeEventListener("mousemove", onResize);
    document.removeEventListener("mouseup", stopResize);
    // Save size
    safeStorageSet({
      floatingPanelSize: {
        width: panelContainer.style.width,
        height: panelContainer.style.height,
      },
    });
  }

  // Restore position and size from storage
  safeStorageGet(["floatingPanelPos", "floatingPanelSize"], (data) => {
    if (data.floatingPanelPos) {
      panelContainer.style.left = data.floatingPanelPos.left;
      panelContainer.style.right = "auto";
      panelContainer.style.top = data.floatingPanelPos.top;
    }
    if (data.floatingPanelSize) {
      panelContainer.style.width = data.floatingPanelSize.width;
      panelContainer.style.height = data.floatingPanelSize.height;
    }
  });

  // Store reference globally for access from other scripts
  window.__teFloatingPanel = {
    element: panelContainer,
    shadow: shadow,
    show: () => {
      console.log("[TokenExtractor] Showing floating panel");
      panelContainer.style.display = "flex";
      safeStorageSet({ floatingPanelOpen: true });
    },
    hide: () => {
      console.log("[TokenExtractor] Hiding floating panel");
      panelContainer.style.display = "none";
      safeStorageSet({ floatingPanelOpen: false });
    },
    toggle: () => {
      const isHidden =
        panelContainer.style.display === "none" ||
        panelContainer.style.display === "";
      console.log("[TokenExtractor] Toggle - currently hidden:", isHidden);
      if (isHidden) {
        window.__teFloatingPanel.show();
      } else {
        window.__teFloatingPanel.hide();
      }
    },
    setContent: (html) => {
      const contentDiv = shadow.querySelector("#te-panel-content");
      contentDiv.innerHTML = html;
    },
    getContentElement: () => {
      return shadow.querySelector("#te-panel-content");
    },
  };

  // Listen for messages to show/hide panel
  if (isExtensionContextValid()) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log("[TokenExtractor] Message received:", request.action);
      if (request.action === "toggleFloatingPanel") {
        console.log("[TokenExtractor] Toggling floating panel");
        window.__teFloatingPanel.toggle();
        sendResponse({ success: true });
      } else if (request.action === "hideFloatingPanel") {
        console.log("[TokenExtractor] Hiding floating panel");
        window.__teFloatingPanel.hide();
        sendResponse({ success: true });
      }
    });
  }

  // Log that floating panel is ready
  console.log(
    "[TokenExtractor] Floating panel ready and listening for messages",
  );

  // Mode Manager with Fallback Logic
  function initializeModeManager() {
    safeStorageGet(["uiMode"], (data) => {
      const preferredMode = data.uiMode || "floating";
      console.log(`[TokenExtractor] Preferred UI mode: ${preferredMode}`);

      // Load content
      loadPopupContent(shadow.querySelector("#te-panel-content"), shadow);
    });
  }

  initializeModeManager();
})();

// Load popup content and initialize it
function loadPopupContent(container, shadow) {
  console.log("[TokenExtractor] Loading popup content");

  const getLastErrorMessage = () => {
    try {
      return chrome.runtime?.lastError?.message || "";
    } catch (_) {
      return "Extension context invalidated. Refresh the page and reopen the panel.";
    }
  };

  const sendRuntimeMessage = (payload, callback) => {
    try {
      chrome.runtime.sendMessage(payload, callback);
    } catch (error) {
      callback?.({
        error:
          error?.message ||
          "Extension context invalidated. Refresh the page and reopen the panel.",
      });
    }
  };

  sendRuntimeMessage({ action: "getPopupHtml" }, (response) => {
    const loadError = getLastErrorMessage();
    if (loadError) {
      const msg = loadError;
      console.error("[TokenExtractor] Failed to load popup content:", msg);
      container.innerHTML = `<div style="padding: 16px; color: #ef4444; font-family: Inter, sans-serif;">Failed to load panel: ${msg}</div>`;
      return;
    }

    if (!response || response.error || !response.html) {
      const msg = response?.error || "No popup HTML returned";
      console.error("[TokenExtractor] Failed to load popup content:", msg);
      container.innerHTML = `<div style="padding: 16px; color: #ef4444; font-family: Inter, sans-serif;">Failed to load panel: ${msg}</div>`;
      return;
    }

    try {
      const html = response.html;
      console.log("[TokenExtractor] Popup HTML loaded, length:", html.length);

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const styles = doc.querySelectorAll("style");
      const bodyElements = Array.from(doc.body.children);

      console.log(
        "[TokenExtractor] Found styles:",
        styles.length,
        "elements:",
        bodyElements.length,
      );

      styles.forEach((style) => {
        if (!style.textContent.includes("@import")) {
          const styleClone = document.createElement("style");
          styleClone.textContent = style.textContent;
          shadow.appendChild(styleClone);
        }
      });

      bodyElements.forEach((element) => {
        container.appendChild(element.cloneNode(true));
      });

      console.log("[TokenExtractor] Popup content injected");
      initializePopupUI(container);

      sendRuntimeMessage({ action: "injectPopupScript" }, (injectResponse) => {
        const injectError = getLastErrorMessage();
        if (injectError) {
          const msg = injectError;
          console.error("[TokenExtractor] Popup script inject error:", msg);
          container.innerHTML = `<div style="padding: 16px; color: #ef4444; font-family: Inter, sans-serif;">Failed to initialize panel logic: ${msg}</div>`;
          return;
        }

        if (injectResponse?.error) {
          console.error(
            "[TokenExtractor] Popup script inject error:",
            injectResponse.error,
          );
          container.innerHTML = `<div style="padding: 16px; color: #ef4444; font-family: Inter, sans-serif;">Failed to initialize panel logic: ${injectResponse.error}</div>`;
          return;
        }

        console.log(
          "[TokenExtractor] Popup script injected (content-script context)",
        );
      });
    } catch (err) {
      console.error("[TokenExtractor] Failed to load popup content:", err);
      container.innerHTML = `<div style="padding: 16px; color: #ef4444; font-family: Inter, sans-serif;">Failed to load panel: ${err?.message || "unknown error"}</div>`;
    }
  });
}

// Initialize basic popup UI
function initializePopupUI(container) {
  console.log("[TokenExtractor] Initializing popup UI");
  // This ensures the popup UI is interactive within the floating panel
  // Actual initialization happens when popup.js loads
}
