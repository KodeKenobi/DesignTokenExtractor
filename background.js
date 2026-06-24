// Background service worker for Design Token Extractor
chrome.runtime.onInstalled.addListener(() => {
  console.log("Design Token Extractor (Smart Capture Edit) installed");
});

function getUiMode() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["uiMode"], (data) => {
      resolve(data?.uiMode || "floating");
    });
  });
}

function setActionPopupForMode(mode) {
  const popup = mode === "popup" ? "popup.html" : "";
  return chrome.action.setPopup({ popup });
}

function setSidePanelBehaviorForMode(mode) {
  if (!chrome.sidePanel?.setPanelBehavior) return Promise.resolve();
  return chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: mode === "sidebar" })
    .catch((error) => {
      console.warn(
        "[TokenExtractor] Failed to set side panel behavior:",
        error,
      );
    });
}

async function showMiniBarInTab(tabId) {
  try {
    await hideFloatingPanelInTab(tabId);
    await chrome.tabs.sendMessage(tabId, { action: "showMinimizeBubble" });
  } catch (error) {
    console.error("[TokenExtractor] Failed to show mini bar:", error);
  }
}

async function openSidePanelInTab(tabId, fromUserGesture = false) {
  if (!chrome.sidePanel) {
    console.warn("[TokenExtractor] sidePanel API unavailable, using floating");
    await toggleFloatingPanelInTab(tabId);
    return false;
  }

  await chrome.sidePanel.setOptions({
    tabId,
    path: "popup.html",
    enabled: true,
  });

  // Prefer panel behavior (open on action click) to avoid gesture-loss edge cases.
  await setSidePanelBehaviorForMode("sidebar");

  // Keep an explicit open attempt for direct click paths only.
  if (fromUserGesture && chrome.sidePanel?.open) {
    try {
      await chrome.sidePanel.open({ tabId });
      return true;
    } catch (error) {
      const message = error?.message || String(error);
      if (message.includes("user gesture")) {
        console.warn(
          "[TokenExtractor] Side panel configured. Click the extension icon again to open it.",
        );
        return false;
      }
      throw error;
    }
  }

  return false;
}

async function closeSidePanelInTab(tabId) {
  if (!chrome.sidePanel) return;

  try {
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false,
    });
  } catch (error) {
    console.warn("[TokenExtractor] Failed to close side panel:", error);
  }
}

async function applyUiModeForTab(tabId, explicitMode, fromUserGesture = false) {
  const mode = explicitMode || (await getUiMode());

  if (mode === "floating") {
    await closeSidePanelInTab(tabId);
    await toggleFloatingPanelInTab(tabId);
    return;
  }

  if (mode === "sidebar") {
    await hideFloatingPanelInTab(tabId).catch(() => {});
    await openSidePanelInTab(tabId, fromUserGesture);
    return;
  }

  if (mode === "minibar") {
    await closeSidePanelInTab(tabId);
    await showMiniBarInTab(tabId);
    return;
  }

  // popup mode is handled by action.default_popup.
  await closeSidePanelInTab(tabId);
  await hideFloatingPanelInTab(tabId).catch(() => {});
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs?.[0] || null;
}

function isInjectableUrl(url) {
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

async function ensureFloatingPanel(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["floating-panel.js"],
  });
}

async function toggleFloatingPanelInTab(tabId) {
  await ensureFloatingPanel(tabId);
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      if (window.__teFloatingPanel?.toggle) {
        window.__teFloatingPanel.toggle();
      }
    },
  });
}

async function hideFloatingPanelInTab(tabId) {
  await ensureFloatingPanel(tabId);
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      if (window.__teFloatingPanel?.hide) {
        window.__teFloatingPanel.hide();
      }
    },
  });
}

// Open/toggle floating panel when extension icon is clicked.
chrome.action.onClicked.addListener(async (tab) => {
  try {
    const mode = await getUiMode();

    await setSidePanelBehaviorForMode(mode);

    // Recovery path: if click event fires while popup mode is selected,
    // re-bind popup and try opening it from this user gesture.
    if (mode === "popup") {
      await setActionPopupForMode("popup");
      if (chrome.action?.openPopup) {
        try {
          await chrome.action.openPopup();
          return;
        } catch (error) {
          console.warn(
            "[TokenExtractor] openPopup failed, falling back to floating:",
            error,
          );
        }
      }
      if (tab?.id && isInjectableUrl(tab.url)) {
        await toggleFloatingPanelInTab(tab.id);
      }
      return;
    }

    if (!tab?.id) return;

    // Side panel does not require script injection path.
    if (mode === "sidebar") {
      await openSidePanelInTab(tab.id, true);
      return;
    }

    // Floating/minibar require injectable pages.
    if (!isInjectableUrl(tab.url)) return;

    await applyUiModeForTab(tab.id, mode, true);
  } catch (error) {
    const message = error?.message || String(error);
    console.warn("[TokenExtractor] Action click mode apply warning:", message);

    // Keep the extension usable if a mode-specific open path fails.
    if (tab?.id && isInjectableUrl(tab.url)) {
      try {
        await toggleFloatingPanelInTab(tab.id);
      } catch (fallbackError) {
        console.error(
          "[TokenExtractor] Fallback floating panel open failed:",
          fallbackError,
        );
      }
    }
  }
});

chrome.runtime.onStartup.addListener(async () => {
  const mode = await getUiMode();
  await setActionPopupForMode(mode);
  await setSidePanelBehaviorForMode(mode);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.uiMode) return;
  const nextMode = changes.uiMode.newValue || "floating";
  setActionPopupForMode(nextMode);
  setSidePanelBehaviorForMode(nextMode);
});

// Listener for capture commands/messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureVisibleTab") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error(
          "[TokenExtractor] Capture failed:",
          chrome.runtime.lastError.message,
        );
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl: dataUrl });
      }
    });
    return true;
  }

  if (request.action === "openAd") {
    chrome.tabs.create({ url: "https://omg10.com/4/10764187", active: true });
    return true;
  }

  if (request.action === "openPayment") {
    chrome.tabs.create({
      url: "https://payment.payfast.io/eng/process?cmd=_paynow&receiver=23594634&amount=15.00&item_name=Buy+Me+$1+Coffee",
      active: false,
    });
    return true;
  }

  if (
    request.action === "elementSelected" ||
    request.action === "editorClosed"
  ) {
    if (sender.tab?.id) {
      try {
        chrome.tabs.sendMessage(sender.tab.id, {
          ...request,
          __teRelay: true,
        });
      } catch (error) {
        console.warn("[TokenExtractor] Relay message warning:", error);
      }
    }

    sendResponse({ success: true });
    return false;
  }

  if (request.action === "bridgeTabsQuery") {
    chrome.tabs.query(request.queryInfo || {}, (tabs) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ tabs: tabs || [] });
    });
    return true;
  }

  if (request.action === "bridgeTabsSendMessage") {
    chrome.tabs.sendMessage(request.tabId, request.message, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ response });
    });
    return true;
  }

  if (request.action === "bridgeTabsCreate") {
    chrome.tabs.create(request.createProperties || {}, (tab) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ tab });
    });
    return true;
  }

  if (request.action === "bridgeExecuteScript") {
    const injection = request.injection || {};
    chrome.scripting.executeScript(injection, (results) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ results: results || [] });
    });
    return true;
  }

  if (request.action === "getPopupHtml") {
    fetch(chrome.runtime.getURL("popup.html"))
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to read popup.html (HTTP ${response.status})`,
          );
        }
        return response.text();
      })
      .then((html) => sendResponse({ html }))
      .catch((err) => {
        console.error("[TokenExtractor] getPopupHtml failed:", err);
        sendResponse({ error: err.message });
      });
    return true;
  }

  if (request.action === "injectPopupScript") {
    if (!sender.tab?.id || !isInjectableUrl(sender.tab.url)) {
      sendResponse({ error: "No active injectable tab" });
      return true;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: sender.tab.id },
        files: ["popup.js"],
      },
      () => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ success: true });
      },
    );
    return true;
  }

  if (request.action === "openFloatingPanel") {
    if (!sender.tab?.id || !isInjectableUrl(sender.tab.url)) {
      sendResponse({ error: "No active injectable tab" });
      return true;
    }

    toggleFloatingPanelInTab(sender.tab.id)
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error("[TokenExtractor] openFloatingPanel failed:", err);
        sendResponse({ error: err.message });
      });
    return true;
  }

  if (request.action === "closeFloatingPanel") {
    if (!sender.tab?.id || !isInjectableUrl(sender.tab.url)) {
      sendResponse({ error: "No active injectable tab" });
      return true;
    }

    hideFloatingPanelInTab(sender.tab.id)
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error("[TokenExtractor] closeFloatingPanel failed:", err);
        sendResponse({ error: err.message });
      });
    return true;
  }

  if (request.action === "applyUiMode") {
    const mode = request.mode || "floating";
    const providedTabId = Number.isInteger(request.tabId)
      ? request.tabId
      : null;

    Promise.resolve()
      .then(async () => {
        let targetTab = sender.tab || null;

        if (!targetTab && providedTabId) {
          targetTab = await chrome.tabs.get(providedTabId);
        }

        if (!targetTab) {
          targetTab = await getActiveTab();
        }

        if (!targetTab?.id) {
          throw new Error("No active tab available");
        }

        return targetTab;
      })
      .then((targetTab) =>
        setActionPopupForMode(mode)
          .then(() => setSidePanelBehaviorForMode(mode))
          .then(() => applyUiModeForTab(targetTab.id, mode))
          .then(() =>
            sendResponse({ success: true, mode, tabId: targetTab.id }),
          ),
      )
      .catch((err) => {
        console.error("[TokenExtractor] applyUiMode failed:", err);
        sendResponse({ error: err.message || String(err) });
      });
    return true;
  }
});

getUiMode()
  .then((mode) =>
    Promise.all([
      setActionPopupForMode(mode),
      setSidePanelBehaviorForMode(mode),
    ]),
  )
  .catch((error) => {
    console.error("[TokenExtractor] Failed to initialize action popup:", error);
  });

// Listener for global hotkey Alt+S
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "triggerCapture") {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab && !tab.url.startsWith("chrome://")) {
      // Inject the capture overlay script instantly
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["capture.js"],
      });
    }
  }
});
