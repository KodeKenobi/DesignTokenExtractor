// Background service worker for Design Token Extractor
chrome.runtime.onInstalled.addListener(() => {
  console.log("Design Token Extractor (Smart Capture Edit) installed");
  
  // Enable side panel on extension icon click
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});

// Listener for capture commands/messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureVisibleTab") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error("[TokenExtractor] Capture failed:", chrome.runtime.lastError.message);
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
      active: false 
    });
    return true;
  }

  if (request.action === "openSidePanel") {
    // Attempt to open the side panel using both tabId and windowId for maximum compatibility
    if (sender.tab) {
      chrome.sidePanel.open({ tabId: sender.tab.id })
        .then(() => sendResponse({ success: true }))
        .catch((err) => {
          console.error("[TokenExtractor] sidePanel.open (tabId) failed:", err);
          // Fallback to windowId
          chrome.sidePanel.open({ windowId: sender.tab.windowId })
            .then(() => sendResponse({ success: true }))
            .catch((err2) => {
              console.error("[TokenExtractor] sidePanel.open (windowId) failed:", err2);
              sendResponse({ error: err2.message });
            });
        });
    }
    return true;
  }
});

// Listener for global hotkey Alt+S
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "triggerCapture") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && !tab.url.startsWith("chrome://")) {
      // Inject the capture overlay script instantly
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["capture.js"]
      });
    }
  }
});
