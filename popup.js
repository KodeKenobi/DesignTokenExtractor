// Global state
let extractedTokens = null;
let editorEnabled = false;
let globalHoverTimeout = null;
let pendingExport = null;

function getRuntimeLastErrorMessage() {
  try {
    return chrome.runtime?.lastError?.message || "";
  } catch (_) {
    return "Extension context invalidated.";
  }
}

function sendRuntimeRequest(payload) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(payload, (response) => {
        const lastErrorMessage = getRuntimeLastErrorMessage();
        if (lastErrorMessage) {
          reject(new Error(lastErrorMessage));
          return;
        }
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response || {});
      });
    } catch (error) {
      reject(new Error(error?.message || "Extension context invalidated."));
    }
  });
}

// In floating panel injection mode, chrome.tabs/chrome.scripting may be unavailable.
// Bridge those calls through the background worker while keeping popup.js logic unchanged.
if (!chrome.tabs) {
  chrome.tabs = {
    query: (queryInfo, callback) => {
      // Support both callback and promise patterns
      const promise = sendRuntimeRequest({
        action: "bridgeTabsQuery",
        queryInfo,
      })
        .then((response) => response.tabs || [])
        .catch(() => []);

      if (typeof callback === "function") {
        promise.then((tabs) => callback(tabs));
        return undefined;
      }
      return promise;
    },
    sendMessage: (tabId, message, callback) => {
      // Support both callback and promise patterns
      const promise = sendRuntimeRequest({
        action: "bridgeTabsSendMessage",
        tabId,
        message,
      })
        .then((response) => response.response)
        .catch((error) => {
          console.warn("[TokenExtractor] Tab message failed:", error);
          return undefined;
        });

      if (typeof callback === "function") {
        promise.then((response) => callback(response));
        return undefined;
      }
      return promise;
    },
    create: (createProperties, callback) => {
      sendRuntimeRequest({ action: "bridgeTabsCreate", createProperties })
        .then((response) => callback?.(response.tab))
        .catch((error) => {
          console.warn("[TokenExtractor] Tab create failed:", error);
          callback?.();
        });
    },
    onActivated: { addListener: () => {} },
    onUpdated: { addListener: () => {} },
  };
}

if (!chrome.scripting) {
  chrome.scripting = {
    executeScript: (injection, callback) => {
      const promise = sendRuntimeRequest({
        action: "bridgeExecuteScript",
        injection,
      })
        .then((response) => response.results || [])
        .catch((error) => {
          console.warn("[TokenExtractor] Execute script failed:", error);
          return [];
        });

      if (typeof callback === "function") {
        promise.then((results) => callback(results));
        return undefined;
      }

      return promise;
    },
  };
}

// In floating mode the UI is mounted inside a shadow root.
// Bridge common document selectors so existing popup logic keeps working.
(function bridgeFloatingPanelDom() {
  const floatingShadow = window.__teFloatingPanel?.shadow;
  if (!floatingShadow || window.__tePopupDomBridged) return;
  window.__tePopupDomBridged = true;

  const originalGetById = document.getElementById.bind(document);
  const originalQuerySelector = document.querySelector.bind(document);
  const originalQuerySelectorAll = document.querySelectorAll.bind(document);

  document.getElementById = (id) => {
    return originalGetById(id) || floatingShadow.getElementById(id);
  };

  document.querySelector = (selector) => {
    return (
      originalQuerySelector(selector) || floatingShadow.querySelector(selector)
    );
  };

  document.querySelectorAll = (selector) => {
    const matches = originalQuerySelectorAll(selector);
    return matches.length > 0
      ? matches
      : floatingShadow.querySelectorAll(selector);
  };
})();

function showSupportModal(onComplete) {
  pendingExport = onComplete;
  document.getElementById("supportModal").classList.add("visible");
}

function switchView(view) {
  const main = document.getElementById("mainView");
  const editor = document.getElementById("editorView");
  if (view === "editor") {
    main.style.display = "none";
    editor.style.display = "block";
  } else {
    main.style.display = "block";
    editor.style.display = "none";
  }
}

function handleSupportChoice(action) {
  if (action === "pay") {
    chrome.runtime.sendMessage({ action: "openPayment" });
  } else if (action === "ad") {
    chrome.runtime.sendMessage({ action: "openAd" });
  }

  document.getElementById("supportModal").classList.remove("visible");

  if (typeof pendingExport === "function") {
    pendingExport();
    pendingExport = null;
  }
}

function resetSidebar() {
  extractedTokens = null;
  document.getElementById("results").style.display = "none";
  document.getElementById("empty").style.display = "block";
  document.getElementById("loadingOverlay").style.display = "none";
  document.getElementById("extractBtn").disabled = false;
  updateEditorUI(false);
  switchView("main");
}

function isFloatingContext() {
  return !!window.__teFloatingPanel;
}

function showModeHint(text) {
  const existing = document.getElementById("te-mode-hint");
  if (existing) existing.remove();

  const hint = document.createElement("div");
  hint.id = "te-mode-hint";
  hint.textContent = text;
  Object.assign(hint.style, {
    position: "fixed",
    top: "12px",
    right: "12px",
    zIndex: "999999",
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.45)",
    color: "#a7f3d0",
    padding: "10px 12px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "600",
    maxWidth: "260px",
    lineHeight: "1.4",
    backdropFilter: "blur(8px)",
  });

  document.body.appendChild(hint);
  setTimeout(() => hint.remove(), 2600);
}

async function openModeSettingsOverlay() {
  const oldOverlay = document.getElementById("te-mode-settings-overlay");
  if (oldOverlay) oldOverlay.remove();

  const data = await chrome.storage.local.get(["uiMode"]);
  const currentMode = data?.uiMode || "floating";

  const overlay = document.createElement("div");
  overlay.id = "te-mode-settings-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "999998",
    background: "rgba(2, 6, 23, 0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
  });

  const modal = document.createElement("div");
  Object.assign(modal.style, {
    width: "min(360px, calc(100% - 24px))",
    background: "rgba(15, 23, 42, 0.92)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "14px",
    padding: "16px",
    color: "#f8fafc",
  });

  modal.innerHTML = `
    <div style="font-size:14px;font-weight:700;margin-bottom:12px;">Interface Mode</div>
    <div data-mode-list style="display:flex;flex-direction:column;gap:8px;">
      ${[
        ["floating", "Floating Panel", "Draggable on-page window"],
        ["popup", "Popup", "Classic extension popup"],
        ["sidebar", "Side Panel", "Open with extension icon"],
        ["minibar", "Mini Bar", "Compact in-page bubble"],
      ]
        .map(
          ([id, name, desc]) => `
        <button type="button" data-mode="${id}" style="text-align:left;padding:10px 12px;border-radius:10px;border:1px solid ${
          currentMode === id ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.12)"
        };background:${
          currentMode === id
            ? "rgba(99,102,241,0.18)"
            : "rgba(255,255,255,0.03)"
        };color:#fff;cursor:pointer;">
          <div style="font-size:13px;font-weight:700;">${name}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${desc}</div>
        </button>`,
        )
        .join("")}
    </div>
    <button type="button" data-close style="margin-top:12px;width:100%;height:36px;border:0;border-radius:10px;background:#4f46e5;color:#fff;font-weight:700;cursor:pointer;">Close</button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  modal
    .querySelector("[data-close]")
    .addEventListener("click", () => overlay.remove());

  modal.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const mode = btn.getAttribute("data-mode");
      await chrome.storage.local.set({ uiMode: mode });

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      await sendRuntimeRequest({
        action: "applyUiMode",
        mode,
        tabId: tab?.id,
      }).catch(() => {});

      if (mode === "sidebar") {
        showModeHint("Side Panel set. Click the extension icon to open it.");
      } else if (mode === "popup") {
        showModeHint("Popup mode set.");
      } else if (mode === "minibar") {
        showModeHint("Mini Bar mode set.");
      } else {
        showModeHint("Floating mode set.");
      }

      overlay.remove();
    });
  });
}

// Initialization
async function initializePopup() {
  if (window.__tePopupInitialized) return;
  window.__tePopupInitialized = true;

  const adPreview = document.getElementById("adPreview");
  const hasAdPreview = !!adPreview;
  const extensionDetails = {
    "https://apps.microsoft.com/detail/9nkv7chs7v73?hl=en-US&gl=US": {
      title: "ActiveDesk",
      desc: "Automatically keeps your status active in Slack, Teams, Discord, Zoom, and more—so you're never marked Away or Idle while working.",
      features: [
        "Auto Activity Pulses",
        "15+ Platforms Supported",
        "Lightweight Background Toggle",
      ],
      badge: "NEW",
    },
    "https://chromewebstore.google.com/detail/bookmarkitall/maloifpahagnengnobedhammfhhojjie":
      {
        title: "BookmarkItAll",
        desc: "Transform how you save the web. Visual snapshots, power search, and beautiful organization for all your links.",
        features: [
          "Visual Snapshots",
          "Collection Management",
          "Instant Global Search",
        ],
        badge: "POPULAR",
      },
  };


  // Add capture info to extensionDetails if needed for hover, or just stick to existing ones

  // Tab switching
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      document
        .querySelectorAll(".tab-content")
        .forEach((content) => content.classList.remove("active"));
      document.getElementById(tabName).classList.add("active");
    });
  });

  // Extract button
  document
    .getElementById("extractBtn")
    .addEventListener("click", performExtraction);

  // Featured extension cards (ads)
  document.querySelectorAll(".ad-card").forEach((card) => {
    const infoTrigger = card.querySelector(".info-trigger");

    card.addEventListener("click", () => {
      chrome.tabs.create({ url: card.dataset.url });
    });

    if (infoTrigger) {
      infoTrigger.addEventListener("mouseenter", () => {
        if (!hasAdPreview) return;
        clearTimeout(globalHoverTimeout);
        const data = extensionDetails[card.dataset.url];
        if (!data) return;

        adPreview.innerHTML = `
          <div class="ad-preview-title" style="margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
            <span style="font-size: 16px;">${data.title}</span>
            <span style="font-size: 10px; color: #fbbf24; background: rgba(251, 191, 36, 0.1); padding: 4px 10px; border-radius: 8px; font-weight: 800;">${data.badge}</span>
          </div>
          <div class="ad-preview-desc">${data.desc}</div>
          <div style="margin-top: 12px; margin-bottom: 16px;">
            ${data.features
              .map(
                (f) => `
              <div class="ad-preview-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ${f}
              </div>
            `,
              )
              .join("")}
          </div>
          <button class="button" style="padding: 10px; font-size: 12px; height: auto; width: 100%;">
            Visit Chrome Web Store →
          </button>
        `;

        adPreview.querySelector("button").onclick = (e) => {
          e.stopPropagation();
          chrome.tabs.create({ url: card.dataset.url });
        };

        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        adPreview.style.left = `${Math.max(20, Math.min(centerX - 160, window.innerWidth - 340))}px`;
        adPreview.style.bottom = `${window.innerHeight - rect.top + 8}px`;
        adPreview.classList.add("visible");
      });

      infoTrigger.addEventListener("mouseleave", () => {
        if (!hasAdPreview) return;
        globalHoverTimeout = setTimeout(() => {
          adPreview?.classList.remove("visible");
        }, 200);
      });
    }
  });

  // Preview card itself (stay open on hover)
  if (hasAdPreview) {
    adPreview.addEventListener("mouseenter", () =>
      clearTimeout(globalHoverTimeout),
    );
    adPreview.addEventListener("mouseleave", () => {
      globalHoverTimeout = setTimeout(() => {
        adPreview?.classList.remove("visible");
      }, 200);
    });
  }

  // Smart Capture button
  document
    .getElementById("smartCaptureBtn")
    .addEventListener("click", async () => {
      try {
        // Hide floating panel before taking screenshot so it is not baked into the capture.
        try {
          window.__teFloatingPanel?.hide?.();
          await sendRuntimeRequest({ action: "closeFloatingPanel" });
        } catch (_) {
          // Ignore: this request may fail in non-floating contexts.
        }

        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tab || !isInjectable(tab.url)) {
          alert(
            "Smart Capture is not available on this page. Please use it on a standard website.",
          );
          return;
        }

        console.log("[TokenExtractor] Injecting Smart Capture engine...");
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            files: ["capture.js"],
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error(
                "[TokenExtractor] Injection failed:",
                chrome.runtime.lastError.message,
              );
              alert(
                "Failed to start Smart Capture: " +
                  chrome.runtime.lastError.message,
              );
            } else {
              // No longer closing the window since it is a persistent side panel
            }
          },
        );
      } catch (err) {
        console.error("[TokenExtractor] Smart Capture error:", err);
      }
    });

  // Editor toggle button
  // Initial check: Hide minimize bubble if it exists when sidebar opens
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab && isInjectable(tab.url)) {
      chrome.tabs
        .sendMessage(tab.id, { action: "hideMinimizeBubble" })
        .catch(() => {});
    }
  });

  document
    .getElementById("toggleEditorBtn")
    .addEventListener("click", toggleLiveEditor);

  // Sidebar Editor Controls
  const sidebarInputs = {
    "sidebar-font-family": "fontFamily",
    "sidebar-font-size": "fontSize",
    "sidebar-font-weight": "fontWeight",
    "sidebar-line-height": "lineHeight",
    "sidebar-padding": "padding",
    "sidebar-margin": "margin",
  };

  Object.entries(sidebarInputs).forEach(([id, prop]) => {
    document.getElementById(id).addEventListener("input", (e) => {
      sendStyleUpdate(prop, e.target.value);
    });
  });

  // Color inputs (dual input: color picker + hex text)
  const setupColorPair = (pickerId, hexId, prop) => {
    const picker = document.getElementById(pickerId);
    const hex = document.getElementById(hexId);

    picker.addEventListener("input", (e) => {
      hex.value = e.target.value;
      sendStyleUpdate(prop, e.target.value);
    });

    hex.addEventListener("input", (e) => {
      picker.value = e.target.value;
      sendStyleUpdate(prop, e.target.value);
    });
  };

  setupColorPair("sidebar-text-color", "sidebar-text-color-hex", "color");
  setupColorPair("sidebar-bg-color", "sidebar-bg-color-hex", "backgroundColor");
  setupColorPair(
    "sidebar-border-color",
    "sidebar-border-color-hex",
    "borderColor",
  );

  document
    .getElementById("sidebar-reset-btn")
    .addEventListener("click", async () => {
      try {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const tab = tabs?.[0];
        if (tab) {
          await chrome.tabs.sendMessage(tab.id, {
            action: "resetElementStyle",
          });
        }
      } catch (error) {
        console.warn("[TokenExtractor] Reset style error:", error);
      }
    });

  const sendEditorAction = async (action) => {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs?.[0];
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, { action });
      }
    } catch (error) {
      console.warn(`[TokenExtractor] ${action} error:`, error);
    }
  };

  document
    .getElementById("sidebar-undo-btn")
    .addEventListener("click", () => sendEditorAction("undoElementStyle"));
  document
    .getElementById("sidebar-redo-btn")
    .addEventListener("click", () => sendEditorAction("redoElementStyle"));

  [
    "sidebar-export-json",
    "sidebar-export-css",
    "sidebar-export-scss",
    "sidebar-export-tw",
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", async () => {
      try {
        const type = id.split("-").pop();
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const tab = tabs?.[0];
        if (tab) {
          await chrome.tabs.sendMessage(tab.id, {
            action: "copyElement" + type.toUpperCase(),
          });
        }
      } catch (error) {
        console.warn("[TokenExtractor] Export action error:", error);
      }
    });
  });

  const minimizeBtn = document.getElementById("minimizeBtn");
  if (!isFloatingContext()) {
    minimizeBtn.title = "Interface Mode Settings";
    minimizeBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    `;
    minimizeBtn.addEventListener("click", openModeSettingsOverlay);
  } else {
    // Minimize to bubble (floating panel context only)
    minimizeBtn.addEventListener("click", async () => {
      try {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const tab = tabs?.[0];
        if (!tab || !isInjectable(tab.url)) return;

        // Disable editor if it was active to remove highlights/crosshairs
        if (typeof editorEnabled !== "undefined" && editorEnabled) {
          toggleLiveEditor();
        }

        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: "showMinimizeBubble",
          });
        } catch (error) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"],
            });
            await chrome.tabs.sendMessage(tab.id, {
              action: "showMinimizeBubble",
            });
          } catch (fallbackError) {
            console.warn(
              "[TokenExtractor] Failed to show minimize bubble:",
              fallbackError,
            );
          }
        }

        const btn = document.getElementById("minimizeBtn");
        btn.style.background = "var(--success)";
        btn.innerHTML = "✓";

        // Hide the floating panel (if active). In side panel mode this is a no-op.
        try {
          await chrome.runtime.sendMessage({ action: "closeFloatingPanel" });
        } catch (e) {
          // Expected in non-floating contexts
        }

        setTimeout(() => {
          window.close();
        }, 400);
      } catch (error) {
        console.warn("[TokenExtractor] Minimize action error:", error);
      }
    });
  }

  document.getElementById("backToMain").addEventListener("click", () => {
    toggleLiveEditor(); // This will disable it and switch back
  });

  // Buy Coffee button
  document.querySelector(".pay-button").addEventListener("click", () => {
    chrome.tabs.create({
      url: "https://payment.payfast.io/eng/process?cmd=_paynow&receiver=23594634&amount=15.00&item_name=Buy+Me+$1+Coffee",
      active: false,
    });
  });

  // Modal actions
  document
    .getElementById("modalPayBtn")
    .addEventListener("click", () => handleSupportChoice("pay"));
  document
    .getElementById("modalAdBtn")
    .addEventListener("click", () => handleSupportChoice("ad"));
  document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("supportModal").classList.remove("visible");
    if (typeof pendingExport === "function") {
      pendingExport();
      pendingExport = null;
    }
  });

  // Keyboard shortcuts cheat sheet
  document.getElementById("shortcutsBtn").addEventListener("click", () => {
    document.getElementById("shortcutsModal").classList.add("visible");
  });
  document
    .getElementById("closeShortcutsModal")
    .addEventListener("click", () => {
      document.getElementById("shortcutsModal").classList.remove("visible");
    });

  // Initialize editor state
  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const tab = tabs?.[0];
    if (tab && isInjectable(tab.url)) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "checkEditorState",
        });
        if (response && response.enabled) {
          updateEditorUI(true);
          switchView("editor");
        }
      } catch (error) {
        console.log("[TokenExtractor] Content script not ready yet.");
      }
    }
  } catch (err) {
    console.warn("[TokenExtractor] Init error:", err);
  }

  // Listen for tab changes while side panel is open
  chrome.tabs.onActivated.addListener(resetSidebar);
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "loading") resetSidebar();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePopup);
} else {
  initializePopup();
}

// Extraction Logic
async function performExtraction() {
  const btn = document.getElementById("extractBtn");
  const loading = document.getElementById("loadingOverlay");
  const results = document.getElementById("results");
  const empty = document.getElementById("empty");

  btn.disabled = true;
  loading.style.display = "flex";
  results.style.display = "none";
  empty.style.display = "none";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab || !isInjectable(tab.url)) {
      throw new Error(
        "Cannot extract tokens from this page. Please navigate to a regular website.",
      );
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    await new Promise((r) => setTimeout(r, 150));

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "extractTokens",
    });
    if (response && response.tokens) {
      displayTokens(response.tokens);
      loading.style.display = "none";
      results.style.display = "block";
    } else {
      throw new Error(response?.error || "No tokens extracted");
    }
  } catch (error) {
    console.error("Error:", error);
    loading.style.display = "none";
    empty.style.display = "block";
    empty.innerHTML = `<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/></svg><p>${error.message}</p>`;
  } finally {
    btn.disabled = false;
  }
}

// Live Editor Toggle
async function toggleLiveEditor() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs?.[0];
    if (!tab || !isInjectable(tab.url)) {
      alert("Live Editor is not available on this page.");
      return;
    }

    const sendEditorMessageWithRetry = async (message) => {
      const retryablePattern =
        /message port closed|could not establish connection|receiv|context invalidated/i;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          return await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          const errorMessage = error?.message || String(error);
          if (attempt === 0 && retryablePattern.test(errorMessage)) {
            await new Promise((resolve) => setTimeout(resolve, 75));
            continue;
          }
          throw error;
        }
      }
      return undefined;
    };

    if (!editorEnabled) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["editor.js"],
      });
      const response = await sendEditorMessageWithRetry({
        action: "enableEditor",
      });
      if (response?.success) {
        updateEditorUI(true);
        switchView("editor");
      }
    } else {
      const response = await sendEditorMessageWithRetry({
        action: "disableEditor",
      });
      if (response?.success) {
        updateEditorUI(false);
        switchView("main");
      }
    }
  } catch (error) {
    console.warn("[TokenExtractor] Toggle editor error:", error);
  }
}

async function sendStyleUpdate(property, value) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs?.[0];
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, {
        action: "updateElementStyle",
        property: property,
        value: value,
      });
    }
  } catch (error) {
    console.warn("[TokenExtractor] Style update error:", error);
  }
}

function updateEditorUI(enabled) {
  const status = document.getElementById("editorStatus");
  const indicator = document.getElementById("editorIndicator");
  const btn = document.getElementById("toggleEditorBtn");
  editorEnabled = enabled;
  if (status) status.textContent = enabled ? "Disable" : "Enable";
  if (indicator) indicator.style.display = enabled ? "block" : "none";
  if (btn)
    btn.style.background = enabled
      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
      : "rgba(255, 255, 255, 0.05)";
}

// Message Listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "editorClosed") {
    updateEditorUI(false);
    switchView("main");
    sendResponse?.({ success: true });
  } else if (request.action === "elementSelected") {
    if (isFloatingContext()) {
      console.log(
        "[TokenExtractor][Popup][Floating] Received elementSelected",
        {
          info: request.info,
          relayed: !!request.__teRelay,
        },
      );
    }
    populateSidebarEditor(request.styles, request.info);
    sendResponse?.({ success: true });
  } else {
    return false;
  }

  return false;
});

function populateSidebarEditor(styles, info) {
  document.getElementById("sidebar-element-info").textContent = info;

  // Typography
  document.getElementById("sidebar-font-family").value = (
    styles.fontFamily || ""
  )
    .split(",")[0]
    .replace(/['"]/g, "");
  document.getElementById("sidebar-font-size").value = styles.fontSize || "";
  document.getElementById("sidebar-font-weight").value =
    styles.fontWeight || "";
  document.getElementById("sidebar-line-height").value =
    styles.lineHeight || "";

  // Colors helpers
  const toHex = (rgb) => {
    if (!rgb || rgb === "rgba(0, 0, 0, 0)" || rgb === "transparent")
      return "#ffffff";
    if (rgb.startsWith("#")) return rgb;
    // Robust regex to handle both comma-separated and space-separated rgb/rgba
    const match = rgb.match(
      /^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s\/]+(\d+(\.\d+)?))?\)$/,
    );
    if (!match) return "#000000";
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const a = match[4] ? parseFloat(match[4]) : 1;
    if (a === 0) return "#ffffff"; // Default for transparent
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Colors
  const textColor = toHex(styles.color);
  document.getElementById("sidebar-text-color").value = textColor;
  document.getElementById("sidebar-text-color-hex").value = textColor;

  const bgColor = toHex(styles.backgroundColor);
  document.getElementById("sidebar-bg-color").value = bgColor;
  document.getElementById("sidebar-bg-color-hex").value = bgColor;

  const borderColor = toHex(styles.borderColor);
  document.getElementById("sidebar-border-color").value = borderColor;
  document.getElementById("sidebar-border-color-hex").value = borderColor;

  // Spacing
  document.getElementById("sidebar-padding").value = styles.padding || "";
  document.getElementById("sidebar-margin").value = styles.margin || "";
}

// Display functions
function displayTokens(tokens) {
  document.getElementById("colorCount").textContent =
    tokens.colors.unique.length;
  document.getElementById("spacingCount").textContent =
    tokens.spacing.unique.length;
  document.getElementById("typographyCount").textContent =
    tokens.typography.fontFamilies.length;
  document.getElementById("shadowCount").textContent =
    tokens.shadows?.all?.length || 0;

  displayColors(tokens.colors);
  displaySpacing(tokens.spacing);
  displayTypography(tokens.typography);
  displayShadows(tokens.shadows);
  displayAccessibility(tokens);
  extractedTokens = tokens;
}

function displayColors(colors) {
  const bgs = document.getElementById("bgColors");
  const txts = document.getElementById("textColors");
  const brds = document.getElementById("borderColors");
  bgs.innerHTML = "";
  txts.innerHTML = "";
  brds.innerHTML = "";
  colors.background.forEach((c) => bgs.appendChild(createColorItem(c)));
  colors.text.forEach((c) => txts.appendChild(createColorItem(c)));
  colors.border.forEach((c) => brds.appendChild(createColorItem(c)));
}

function createColorItem(color) {
  const item = document.createElement("div");
  item.className = "token-item";
  item.innerHTML = `<div class='color-preview' style='background-color: ${color.value}'></div><div class='token-value'>${color.value}</div>`;
  item.onclick = () => {
    navigator.clipboard.writeText(color.value);
    const original = item.style.borderColor;
    item.style.borderColor = "var(--primary)";
    setTimeout(() => (item.style.borderColor = original), 500);
  };
  return item;
}

function displaySpacing(spacing) {
  const el = document.getElementById("spacingValues");
  el.innerHTML = "";
  const unique = Array.from(
    new Set((spacing.all || []).map((s) => s.value)),
  ).slice(0, 15);
  unique.forEach((val) => {
    const item = document.createElement("div");
    item.className = "spacing-item";
    item.innerHTML = `<div><div class='token-label'>SPACING</div><div class='token-value'>${val}</div></div><div class='spacing-visual' style='width: ${Math.min(parseInt(val), 100)}px'></div>`;
    item.onclick = () => navigator.clipboard.writeText(val);
    el.appendChild(item);
  });
}

function displayTypography(typ) {
  const fams = document.getElementById("fontFamilies");
  const sizes = document.getElementById("fontSizes");
  fams.innerHTML = "";
  sizes.innerHTML = "";
  (typ.combinations || []).slice(0, 8).forEach((combo) => {
    const item = document.createElement("div");
    item.className = "typography-item";
    item.innerHTML = `<div class='token-label'>${combo.font}</div><div class='typography-preview' style='font-family: ${combo.font}; font-size: 14px;'>${combo.examples[0] || "Typography"}</div><div class='token-value'>${combo.size}</div>`;
    fams.appendChild(item);
  });
  typ.fontSizes.slice(0, 10).forEach((s) => {
    const item = document.createElement("div");
    item.className = "token-item";
    item.innerHTML = `<div class='token-value'>${s}</div><div class='token-label'>Size</div>`;
    sizes.appendChild(item);
  });
}

function displayShadows(sha) {
  const el = document.getElementById("shadowValues");
  el.innerHTML = "";
  (sha?.all || []).slice(0, 10).forEach((s) => {
    const item = document.createElement("div");
    item.className = "spacing-item";
    item.innerHTML = `<div style='flex:1'><div class='token-label'>SHADOW</div><div class='token-value' style='font-size:10px'>${s.value.substring(0, 30)}...</div></div><div style='width:24px;height:24px;background:white;box-shadow:${s.value}'></div>`;
    item.onclick = () => navigator.clipboard.writeText(s.value);
    el.appendChild(item);
  });
}

function displayAccessibility(tokens) {
  const el = document.getElementById("contrastResults");
  el.innerHTML = "";
  const bgs = tokens.colors.background.slice(0, 3);
  const txts = tokens.colors.text.slice(0, 3);
  bgs.forEach((bg) => {
    txts.forEach((txt) => {
      const ratio = calculateContrast(bg.value, txt.value);
      const pass = ratio >= 4.5;
      const item = document.createElement("div");
      item.className = "stat-card";
      item.style.marginBottom = "8px";
      item.innerHTML = `<div style='display:flex;justify-content:space-between;font-size:10px'><span>CONTRAST</span><span class='contrast-badge ${pass ? "contrast-pass" : "contrast-fail"}'>${ratio.toFixed(2)}:1</span></div><div style='background:${bg.value};color:${txt.value};padding:8px;margin-top:8px;border-radius:4px;font-weight:700'>Preview Text</div>`;
      el.appendChild(item);
    });
  });
}

function calculateContrast(c1, c2) {
  const l1 = getLuminance(c1);
  const l2 = getLuminance(c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function getLuminance(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0;
  const rgb = [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

// Export logic
document.getElementById("exportJson")?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!extractedTokens) return;
  showSupportModal(() => {
    download(JSON.stringify(extractedTokens, null, 2), "tokens.json");
  });
});

document.getElementById("exportCSS")?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!extractedTokens) return;
  showSupportModal(() => {
    let css = ":root {\n";
    extractedTokens.colors.unique.forEach(
      (c, i) => (css += `  --color-${i + 1}: ${c.value};\n`),
    );
    css += "}";
    download(css, "tokens.css");
  });
});

document.getElementById("exportSCSS")?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!extractedTokens) return;
  showSupportModal(() => {
    let scss = "";
    extractedTokens.colors.unique.forEach(
      (c, i) => (scss += `$color-${i + 1}: ${c.value};\n`),
    );
    download(scss, "tokens.scss");
  });
});

document.getElementById("exportTailwind")?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!extractedTokens) return;
  showSupportModal(() => {
    const colors = extractedTokens.colors.unique.reduce((acc, c, i) => {
      acc[`color-${i + 1}`] = c.value;
      return acc;
    }, {});
    const config = { theme: { extend: { colors } } };
    const content = `module.exports = ${JSON.stringify(config, null, 2)};`;
    download(content, "tailwind.config.tokens.js");
  });
});

function download(content, name) {
  if (!content || content === "null") return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  a.download = name;
  a.click();
}

function isInjectable(url) {
  if (!url) return false;
  const restrictedProtocols = [
    "chrome://",
    "chrome-extension://",
    "edge://",
    "about:",
    "view-source:",
  ];
  return restrictedProtocols.every((protocol) => !url.startsWith(protocol));
}
