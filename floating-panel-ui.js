// Floating Panel UI - No chrome API calls, just pure UI
(function () {
  try {
    console.log("[TokenExtractor] Floating panel UI script STARTED");
    console.log(
      "[TokenExtractor] window.__teFloatingPanelActive VALUE:",
      window.__teFloatingPanelActive,
    );
    console.log(
      "[TokenExtractor] window.__teFloatingPanelActive TYPE:",
      typeof window.__teFloatingPanelActive,
    );
    console.log(
      "[TokenExtractor] Checking guard: if (window.__teFloatingPanelActive) =",
      !!window.__teFloatingPanelActive,
    );

    if (window.__teFloatingPanelActive) {
      console.log(
        "[TokenExtractor] Floating panel UI already active, skipping",
      );
      console.trace("[TokenExtractor] Trace of early exit");
      return;
    }
    window.__teFloatingPanelActive = true;
    console.log("[TokenExtractor] Flag now set to true");

    console.log("[TokenExtractor] Floating panel UI initializing...");

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
    panelContainer.style.display = "none";
    panelContainer.style.fontFamily = '"Inter", sans-serif';
    panelContainer.style.boxSizing = "border-box";

    const shadow = panelContainer.attachShadow({ mode: "open" });

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

    .panel-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      color: var(--text-main);
      font-family: "Inter", sans-serif;
    }

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

    .panel-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      z-index: 2147483645;
      display: none;
      pointer-events: auto;
    }

    .panel-backdrop.active {
      display: block;
    }
  `;

    shadow.appendChild(styles);

    const wrapper = document.createElement("div");
    wrapper.className = "panel-wrapper";
    wrapper.innerHTML = `
    <div class="panel-header">
      <div class="panel-title">Design Token Extractor</div>
      <button class="panel-close">×</button>
    </div>
    <div class="panel-content" id="te-panel-content">
      <div style="padding: 16px; color: #94a3b8; text-align: center;">Loading...</div>
    </div>
    <div class="resize-handle"></div>
  `;

    shadow.appendChild(wrapper);

    // Create backdrop element (light-weight, no shadow DOM)
    const backdrop = document.createElement("div");
    backdrop.id = "te-floating-panel-backdrop";
    backdrop.style.position = "fixed";
    backdrop.style.top = "0";
    backdrop.style.left = "0";
    backdrop.style.width = "100%";
    backdrop.style.height = "100%";
    backdrop.style.zIndex = "2147483645";
    backdrop.style.display = "none";
    backdrop.style.pointerEvents = "auto";
    backdrop.style.background = "transparent";

    // Add to body instead of documentElement for better compatibility
    if (document.body) {
      document.body.appendChild(backdrop);
      document.body.appendChild(panelContainer);
      console.log("[TokenExtractor] Panel and backdrop appended to body");
    } else {
      // Fallback if body isn't ready yet
      document.documentElement.appendChild(backdrop);
      document.documentElement.appendChild(panelContainer);
      console.log(
        "[TokenExtractor] Panel and backdrop appended to documentElement (body not ready)",
      );
    }

    // Close button
    shadow.querySelector(".panel-close").addEventListener("click", () => {
      panelContainer.style.display = "none";
      backdrop.style.display = "none";
      window.dispatchEvent(
        new CustomEvent("tePanelToggle", { detail: { open: false } }),
      );
    });

    // Backdrop click to close
    backdrop.addEventListener("click", () => {
      panelContainer.style.display = "none";
      backdrop.style.display = "none";
      window.dispatchEvent(
        new CustomEvent("tePanelToggle", { detail: { open: false } }),
      );
    });

    // Dragging
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
    }

    // Resizing
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
    }

    // Global API
    console.log(
      "[TokenExtractor] About to create window.__teFloatingPanel object",
    );

    window.__teFloatingPanel = {
      element: panelContainer,
      shadow: shadow,
      backdrop: backdrop,
      show: () => {
        console.log(
          "[TokenExtractor] Panel show - current display:",
          panelContainer.style.display,
        );
        panelContainer.style.display = "flex";
        backdrop.style.display = "block";
        console.log(
          "[TokenExtractor] Panel show - new display:",
          panelContainer.style.display,
        );
        window.dispatchEvent(
          new CustomEvent("tePanelToggle", { detail: { open: true } }),
        );
      },
      hide: () => {
        console.log("[TokenExtractor] Panel hide");
        panelContainer.style.display = "none";
        backdrop.style.display = "none";
        window.dispatchEvent(
          new CustomEvent("tePanelToggle", { detail: { open: false } }),
        );
      },
      toggle: () => {
        const currentDisplay = panelContainer.style.display;
        const isHidden = !currentDisplay || currentDisplay === "none";
        console.log(
          "[TokenExtractor] Panel toggle - currentDisplay:",
          currentDisplay,
          "isHidden:",
          isHidden,
        );
        if (isHidden) {
          window.__teFloatingPanel.show();
        } else {
          window.__teFloatingPanel.hide();
        }
      },
      getStatus: () => {
        return {
          display: panelContainer.style.display,
          exists: !!panelContainer,
          inDOM: document.body.contains(panelContainer),
        };
      },
    };

    console.log("[TokenExtractor] Floating panel UI ready");
    console.log(
      "[TokenExtractor] Panel status:",
      window.__teFloatingPanel.getStatus(),
    );

    // Listen for toggle requests from content script (cross-context communication)
    window.addEventListener("teTogglePanelRequest", (e) => {
      console.log(
        "[TokenExtractor] [PAGE] Received teTogglePanelRequest event",
      );
      if (window.__teFloatingPanel) {
        window.__teFloatingPanel.toggle();
        console.log("[TokenExtractor] [PAGE] Panel toggled");
      }
    });
    console.log(
      "[TokenExtractor] [PAGE] Added event listener for teTogglePanelRequest",
    );

    // Keyboard shortcut - Escape to close
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape" && panelContainer.style.display !== "none") {
          window.__teFloatingPanel.hide();
        }
      },
      true,
    );

    // Load popup content using chrome.runtime.getURL (this is available in content scripts)
    window.dispatchEvent(
      new CustomEvent("teLoadPopupContent", {
        detail: { container: shadow.querySelector("#te-panel-content") },
      }),
    );

    console.log(
      "[TokenExtractor] Floating panel UI IIFE END - window.__teFloatingPanel is:",
      typeof window.__teFloatingPanel,
    );

    // Signal to content script that panel is ready (cross-context communication)
    window.dispatchEvent(
      new CustomEvent("teFloatingPanelReady", {
        detail: {
          panelExists: true,
          hasToggle: typeof window.__teFloatingPanel !== "undefined",
        },
      }),
    );
    console.log("[TokenExtractor] Dispatched teFloatingPanelReady event");
  } catch (error) {
    console.error("[TokenExtractor] ERROR in Floating panel UI:", error);
    console.error("[TokenExtractor] Error stack:", error.stack);
  }
})();
