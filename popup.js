// Global state
let extractedTokens = null;
let editorEnabled = false;
let globalHoverTimeout = null;
let pendingExport = null;

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

// Initialization
document.addEventListener("DOMContentLoaded", async () => {
  const adPreview = document.getElementById("adPreview");
  const extensionDetails = {
    "https://chromewebstore.google.com/detail/bookmarkitall/maloifpahagnengnobedhammfhhojjie": {
      title: "BookmarkItAll",
      desc: "Transform how you save the web. Visual snapshots, power search, and beautiful organization for all your links.",
      features: ["Visual Snapshots", "Collection Management", "Instant Global Search"],
      badge: "POPULAR"
    },
    "https://chromewebstore.google.com/detail/trevnoctilla-pdf-editor-f/omlefdknpedeaocpmfaikmiplkdiigpm": {
      title: "Trevnoctilla Media & PDF Suite",
      desc: "The ultimate in-browser powerhouse. Convert 2GB videos, edit/sign PDFs, extract text with OCR, and automate with Developer APIs—no software required.",
      features: ["Pro Video & GIF Converter", "OCR & PDF Document Suite", "Developer API & QR Tools"],
      badge: "FREE"
    }
  };

  // Add capture info to extensionDetails if needed for hover, or just stick to existing ones

  // Tab switching
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));
      document.getElementById(tabName).classList.add("active");
    });
  });

  // Extract button
  document.getElementById("extractBtn").addEventListener("click", performExtraction);

  // Featured extension cards (ads)
  document.querySelectorAll(".ad-card").forEach(card => {
    const infoTrigger = card.querySelector(".info-trigger");
    
    card.addEventListener("click", () => {
      chrome.tabs.create({ url: card.dataset.url });
    });

    if (infoTrigger) {
      infoTrigger.addEventListener("mouseenter", () => {
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
            ${data.features.map(f => `
              <div class="ad-preview-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ${f}
              </div>
            `).join('')}
          </div>
          <button class="button" style="padding: 10px; font-size: 12px; height: auto; width: 100%;">
            Visit Chrome Web Store →
          </button>
        `;

        adPreview.querySelector('button').onclick = (e) => {
          e.stopPropagation();
          chrome.tabs.create({ url: card.dataset.url });
        };

        const rect = card.getBoundingClientRect();
        const centerX = rect.left + (rect.width / 2);
        adPreview.style.left = `${Math.max(20, Math.min(centerX - 160, window.innerWidth - 340))}px`;
        adPreview.style.bottom = `${window.innerHeight - rect.top + 8}px`;
        adPreview.classList.add("visible");
      });

      infoTrigger.addEventListener("mouseleave", () => {
        globalHoverTimeout = setTimeout(() => {
          adPreview.classList.remove("visible");
        }, 200);
      });
    }
  });

  // Preview card itself (stay open on hover)
  adPreview.addEventListener("mouseenter", () => clearTimeout(globalHoverTimeout));
  adPreview.addEventListener("mouseleave", () => {
    globalHoverTimeout = setTimeout(() => {
      adPreview.classList.remove("visible");
    }, 200);
  });

  // Smart Capture button
  document.getElementById("smartCaptureBtn").addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !isInjectable(tab.url)) {
        alert("Smart Capture is not available on this page. Please use it on a standard website.");
        return;
      }

      console.log("[TokenExtractor] Injecting Smart Capture engine...");
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["capture.js"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("[TokenExtractor] Injection failed:", chrome.runtime.lastError.message);
          alert("Failed to start Smart Capture: " + chrome.runtime.lastError.message);
        } else {
          // No longer closing the window since it is a persistent side panel
        }
      });
    } catch (err) {
      console.error("[TokenExtractor] Smart Capture error:", err);
    }
  });

  // Editor toggle button
  // Initial check: Hide minimize bubble if it exists when sidebar opens
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab && isInjectable(tab.url)) {
      chrome.tabs.sendMessage(tab.id, { action: "hideMinimizeBubble" }).catch(() => {});
    }
  });

  document.getElementById("toggleEditorBtn").addEventListener("click", toggleLiveEditor);

  // Sidebar Editor Controls
  const sidebarInputs = {
    'sidebar-font-family': 'fontFamily',
    'sidebar-font-size': 'fontSize',
    'sidebar-font-weight': 'fontWeight',
    'sidebar-line-height': 'lineHeight',
    'sidebar-padding': 'padding',
    'sidebar-margin': 'margin'
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

  setupColorPair('sidebar-text-color', 'sidebar-text-color-hex', 'color');
  setupColorPair('sidebar-bg-color', 'sidebar-bg-color-hex', 'backgroundColor');
  setupColorPair('sidebar-border-color', 'sidebar-border-color-hex', 'borderColor');

  document.getElementById("sidebar-reset-btn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, { action: "resetElementStyle" });
    });
  });

  ['sidebar-export-json', 'sidebar-export-css', 'sidebar-export-scss', 'sidebar-export-tw'].forEach(id => {
    document.getElementById(id)?.addEventListener("click", () => {
      const type = id.split("-").pop();
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, { action: "copyElement" + type.toUpperCase() });
      });
    });
  });

  // Minimize to bubble
  document.getElementById("minimizeBtn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab || !isInjectable(tab.url)) return;

      const performMinimize = () => {
        // Disable editor if it was active to remove highlights/crosshairs
        if (typeof editorEnabled !== 'undefined' && editorEnabled) {
          toggleLiveEditor();
        }

        chrome.tabs.sendMessage(tab.id, { action: "showMinimizeBubble" }, (response) => {
          if (chrome.runtime.lastError) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"]
            }, () => {
              chrome.tabs.sendMessage(tab.id, { action: "showMinimizeBubble" });
            });
          }
          
          const btn = document.getElementById("minimizeBtn");
          btn.style.background = "var(--success)";
          btn.innerHTML = "✓";
          
          setTimeout(() => {
            window.close();
          }, 400);
        });
      };

      performMinimize();
    });
  });

  document.getElementById("backToMain").addEventListener("click", () => {
    toggleLiveEditor(); // This will disable it and switch back
  });

  // Buy Coffee button
  document.querySelector(".pay-button").addEventListener("click", () => {
    chrome.tabs.create({ 
      url: "https://payment.payfast.io/eng/process?cmd=_paynow&receiver=23594634&amount=15.00&item_name=Buy+Me+$1+Coffee",
      active: false 
    });
  });

  // Modal actions
  document.getElementById("modalPayBtn").addEventListener("click", () => handleSupportChoice("pay"));
  document.getElementById("modalAdBtn").addEventListener("click", () => handleSupportChoice("ad"));
  document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("supportModal").classList.remove("visible");
    if (typeof pendingExport === "function") {
      pendingExport();
      pendingExport = null;
    }
  });

  // Initialize editor state
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && isInjectable(tab.url)) {
      chrome.tabs.sendMessage(tab.id, { action: "checkEditorState" }, (response) => {
        if (chrome.runtime.lastError) {
          console.log("[TokenExtractor] Content script not ready yet.");
          return;
        }
        if (response && response.enabled) {
          updateEditorUI(true);
          switchView("editor");
        }
      });
    }
  } catch (err) {
    console.warn("[TokenExtractor] Init error:", err);
  }

  // Listen for tab changes while side panel is open
  chrome.tabs.onActivated.addListener(resetSidebar);
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') resetSidebar();
  });
});

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
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !isInjectable(tab.url)) {
      throw new Error("Cannot extract tokens from this page. Please navigate to a regular website.");
    }

    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    await new Promise(r => setTimeout(r, 150));

    const response = await chrome.tabs.sendMessage(tab.id, { action: "extractTokens" });
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
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !isInjectable(tab.url)) {
    alert("Live Editor is not available on this page.");
    return;
  }

  if (!editorEnabled) {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["editor.js"] });
    chrome.tabs.sendMessage(tab.id, { action: "enableEditor" }, (r) => { 
      if (r?.success) {
        updateEditorUI(true);
        switchView("editor");
      }
    });
  } else {
    chrome.tabs.sendMessage(tab.id, { action: "disableEditor" }, (r) => { 
      if (r?.success) {
        updateEditorUI(false);
        switchView("main");
      }
    });
  }
}

function sendStyleUpdate(property, value) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { 
        action: "updateElementStyle", 
        property: property, 
        value: value 
      });
    }
  });
}

function updateEditorUI(enabled) {
  const status = document.getElementById("editorStatus");
  const indicator = document.getElementById("editorIndicator");
  const btn = document.getElementById("toggleEditorBtn");
  editorEnabled = enabled;
  if (status) status.textContent = enabled ? "Disable" : "Enable";
  if (indicator) indicator.style.display = enabled ? "block" : "none";
  if (btn) btn.style.background = enabled ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "rgba(255, 255, 255, 0.05)";
}

// Message Listeners
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "editorClosed") {
    updateEditorUI(false);
    switchView("main");
  } else if (request.action === "elementSelected") {
    populateSidebarEditor(request.styles, request.info);
  }
});

function populateSidebarEditor(styles, info) {
  document.getElementById("sidebar-element-info").textContent = info;
  
  // Typography
  document.getElementById("sidebar-font-family").value = (styles.fontFamily || "").split(",")[0].replace(/['"]/g, "");
  document.getElementById("sidebar-font-size").value = styles.fontSize || "";
  document.getElementById("sidebar-font-weight").value = styles.fontWeight || "";
  document.getElementById("sidebar-line-height").value = styles.lineHeight || "";
  
  // Colors helpers
  const toHex = (rgb) => {
    if (!rgb || rgb === "rgba(0, 0, 0, 0)" || rgb === "transparent") return "#ffffff";
    if (rgb.startsWith("#")) return rgb;
    // Robust regex to handle both comma-separated and space-separated rgb/rgba
    const match = rgb.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s\/]+(\d+(\.\d+)?))?\)$/);
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
  document.getElementById("colorCount").textContent = tokens.colors.unique.length;
  document.getElementById("spacingCount").textContent = tokens.spacing.unique.length;
  document.getElementById("typographyCount").textContent = tokens.typography.fontFamilies.length;
  document.getElementById("shadowCount").textContent = tokens.shadows?.all?.length || 0;

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
  bgs.innerHTML = ""; txts.innerHTML = ""; brds.innerHTML = "";
  colors.background.forEach(c => bgs.appendChild(createColorItem(c)));
  colors.text.forEach(c => txts.appendChild(createColorItem(c)));
  colors.border.forEach(c => brds.appendChild(createColorItem(c)));
}

function createColorItem(color) {
  const item = document.createElement("div");
  item.className = "token-item";
  item.innerHTML = `<div class='color-preview' style='background-color: ${color.value}'></div><div class='token-value'>${color.value}</div>`;
  item.onclick = () => {
    navigator.clipboard.writeText(color.value);
    const original = item.style.borderColor; item.style.borderColor = "var(--primary)";
    setTimeout(() => item.style.borderColor = original, 500);
  };
  return item;
}

function displaySpacing(spacing) {
  const el = document.getElementById("spacingValues");
  el.innerHTML = "";
  const unique = Array.from(new Set((spacing.all || []).map(s => s.value))).slice(0, 15);
  unique.forEach(val => {
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
  fams.innerHTML = ""; sizes.innerHTML = "";
  (typ.combinations || []).slice(0, 8).forEach(combo => {
    const item = document.createElement("div");
    item.className = "typography-item";
    item.innerHTML = `<div class='token-label'>${combo.font}</div><div class='typography-preview' style='font-family: ${combo.font}; font-size: 14px;'>${combo.examples[0] || "Typography"}</div><div class='token-value'>${combo.size}</div>`;
    fams.appendChild(item);
  });
  typ.fontSizes.slice(0, 10).forEach(s => {
    const item = document.createElement("div");
    item.className = "token-item";
    item.innerHTML = `<div class='token-value'>${s}</div><div class='token-label'>Size</div>`;
    sizes.appendChild(item);
  });
}

function displayShadows(sha) {
  const el = document.getElementById("shadowValues");
  el.innerHTML = "";
  (sha?.all || []).slice(0, 10).forEach(s => {
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
  bgs.forEach(bg => {
    txts.forEach(txt => {
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
  const rgb = [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)].map(v => {
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
    extractedTokens.colors.unique.forEach((c, i) => css += `  --color-${i + 1}: ${c.value};\n`);
    css += "}";
    download(css, "tokens.css");
  });
});

document.getElementById("exportSCSS")?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!extractedTokens) return;
  showSupportModal(() => {
    let scss = "";
    extractedTokens.colors.unique.forEach((c, i) => scss += `$color-${i + 1}: ${c.value};\n`);
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
  const restrictedProtocols = ["chrome://", "chrome-extension://", "edge://", "about:", "view-source:"];
  return restrictedProtocols.every(protocol => !url.startsWith(protocol));
}
