(function () {
  if (window.__teEditorActive) return;
  window.__teEditorActive = true;

  let editorEnabled = false;
  let selectedElement = null;
  let hoveredElement = null;
  let styleUndoStack = [];
  let styleRedoStack = [];

  function pushStyleUndoSnapshot(el) {
    if (!el) return;
    styleUndoStack.push({ el, cssText: el.style.cssText });
    if (styleUndoStack.length > 100) styleUndoStack.shift();
    styleRedoStack = [];
  }

  function undoStyleChange() {
    const entry = styleUndoStack.pop();
    if (!entry) return false;
    styleRedoStack.push({ el: entry.el, cssText: entry.el.style.cssText });
    entry.el.style.cssText = entry.cssText;
    return true;
  }

  function redoStyleChange() {
    const entry = styleRedoStack.pop();
    if (!entry) return false;
    styleUndoStack.push({ el: entry.el, cssText: entry.el.style.cssText });
    entry.el.style.cssText = entry.cssText;
    return true;
  }

  function getVisibleBackgroundColor(el) {
    const styles = window.getComputedStyle(el);
    const bg = styles.backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
    if (el.parentElement && el.parentElement !== document.documentElement)
      return getVisibleBackgroundColor(el.parentElement);
    return bg || "";
  }

  function handleMouseOver(e) {
    if (!editorEnabled) return;
    e.stopPropagation();
    hoveredElement = e.target;
    e.target.style.outline = "2px solid #6366f1";
    e.target.style.outlineOffset = "2px";
    e.target.style.cursor = "pointer";
  }

  function handleMouseOut(e) {
    if (!editorEnabled) return;
    if (e.target !== selectedElement) {
      e.target.style.outline = "";
      e.target.style.outlineOffset = "";
      e.target.style.cursor = "";
    }
  }

  function handleClick(e) {
    if (!editorEnabled) return;
    e.preventDefault();
    e.stopPropagation();

    const isFloatingMode = !!window.__teFloatingPanel;
    if (isFloatingMode) {
      console.log("[TokenExtractor][Editor][Floating] Click detected", {
        tagName: e.target?.tagName,
        id: e.target?.id || "",
        className: e.target?.className || "",
      });
    }

    if (selectedElement && selectedElement !== e.target) {
      selectedElement.style.outline = "";
      selectedElement.style.boxShadow = "";
    }

    selectedElement = e.target;
    selectedElement.style.outline = "3px solid #10b981";
    selectedElement.style.outlineOffset = "2px";
    selectedElement.style.boxShadow = "0 0 0 4px rgba(16, 185, 129, 0.2)";

    // Send styles to sidebar
    const styles = window.getComputedStyle(selectedElement);
    const tagName = selectedElement.tagName.toLowerCase();
    const className = selectedElement.className
      ? `.${selectedElement.className.split(" ").join(".")}`
      : "";
    const id = selectedElement.id ? `#${selectedElement.id}` : "";
    const elementInfo = `${tagName}${id}${className}`;

    const getShorthand = (prop) => {
      const val = styles[prop];
      if (val && val !== "" && val !== "rgba(0, 0, 0, 0)") return val;
      const t = styles[prop + "Top"] || "0px";
      const r = styles[prop + "Right"] || "0px";
      const b = styles[prop + "Bottom"] || "0px";
      const l = styles[prop + "Left"] || "0px";
      if (t === r && r === b && b === l) return t;
      return `${t} ${r} ${b} ${l}`;
    };

    const payload = {
      action: "elementSelected",
      info: elementInfo,
      styles: {
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        color: styles.color,
        backgroundColor: getVisibleBackgroundColor(selectedElement),
        borderColor: styles.borderColor || styles.borderTopColor || "",
        padding: getShorthand("padding"),
        margin: getShorthand("margin"),
      },
    };

    if (isFloatingMode) {
      console.log("[TokenExtractor][Editor][Floating] Element selected", {
        info: elementInfo,
        fontFamily: payload.styles.fontFamily,
        fontSize: payload.styles.fontSize,
        color: payload.styles.color,
        backgroundColor: payload.styles.backgroundColor,
      });
    }

    chrome.runtime.sendMessage(payload, () => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[TokenExtractor][Editor][Floating] elementSelected delivery failed:",
          chrome.runtime.lastError.message,
        );
        return;
      }

      if (isFloatingMode) {
        console.log(
          "[TokenExtractor][Editor][Floating] elementSelected message delivered",
        );
      }
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Escape" && editorEnabled) {
      if (selectedElement) {
        selectedElement.style.outline = "";
        selectedElement.style.boxShadow = "";
        selectedElement = null;
      } else {
        disableEditor();
        chrome.runtime.sendMessage({
          action: "editorClosed",
        });
      }
      return;
    }
    if (editorEnabled && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redoStyleChange();
      else undoStyleChange();
    }
  }

  function disableEditor() {
    editorEnabled = false;
    document.querySelectorAll("*").forEach((el) => {
      el.style.outline = "";
      el.style.outlineOffset = "";
      el.style.boxShadow = "";
      el.style.cursor = "";
    });
    document.removeEventListener("mouseover", handleMouseOver, true);
    document.removeEventListener("mouseout", handleMouseOut, true);
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("keydown", handleKeyDown);
    selectedElement = null;
    hoveredElement = null;
  }

  // Support Modal Logic (Reused for Copy Action)
  let pendingAction = null;

  function showSupportModal(onComplete) {
    pendingAction = onComplete;
    let modal = document.getElementById("dte-support-modal-wrapper");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "dte-support-modal-wrapper";
      modal.innerHTML = `
      <style>
        #dte-support-modal-wrapper {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(20px); z-index: 2147483647;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', sans-serif; color: #fff;
        }
        .dte-modal-content {
          width: 90%; max-width: 320px; background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px; padding: 32px 24px; text-align: center;
          position: relative; box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5);
        }
        .dte-modal-title { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .dte-modal-desc { font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
        .dte-modal-actions { display: flex; flex-direction: column; gap: 12px; }
        .dte-modal-btn { width: 100%; padding: 14px; border: none; border-radius: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .dte-modal-btn-pay { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #000; }
        .dte-modal-btn-ad { background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
        .dte-modal-close {
          position: absolute; top: -12px; right: -12px;
          width: 32px; height: 32px; background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%; color: #94a3b8; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); font-weight: bold;
        }
      </style>
      <div class="dte-modal-content">
        <button id="dte-modal-close" class="dte-modal-close">✕</button>
        <div class="dte-modal-title">Support Extractor</div>
        <p class="dte-modal-desc">Support our development to copy the generated CSS styles.</p>
        <div class="dte-modal-actions">
          <button id="dte-modal-pay" class="dte-modal-btn dte-modal-btn-pay">☕ Pay $1 (Buy Coffee)</button>
          <button id="dte-modal-ad" class="dte-modal-btn dte-modal-btn-ad">📺 View One Ad</button>
        </div>
      </div>
    `;
      document.body.appendChild(modal);
      document.getElementById("dte-modal-close").onclick = () => {
        modal.style.display = "none";
        if (pendingAction) {
          pendingAction();
          pendingAction = null;
        }
      };
      document.getElementById("dte-modal-pay").onclick = () => {
        handleChoice("pay");
      };
      document.getElementById("dte-modal-ad").onclick = () => {
        handleChoice("ad");
      };
    }
    modal.style.display = "flex";
  }

  function handleChoice(type) {
    if (type === "pay")
      chrome.runtime.sendMessage({
        action: "openPayment",
      });
    else
      chrome.runtime.sendMessage({
        action: "openAd",
      });
    document.getElementById("dte-support-modal-wrapper").style.display = "none";
    if (pendingAction) {
      pendingAction();
      pendingAction = null;
    }
  }

  // Message Listeners
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "enableEditor") {
      editorEnabled = true;
      document.addEventListener("mouseover", handleMouseOver, true);
      document.addEventListener("mouseout", handleMouseOut, true);
      document.addEventListener("click", handleClick, true);
      document.addEventListener("keydown", handleKeyDown);
      sendResponse({
        success: true,
      });
    } else if (request.action === "disableEditor") {
      disableEditor();
      sendResponse({
        success: true,
      });
    } else if (request.action === "checkEditorState") {
      sendResponse({
        enabled: editorEnabled,
      });
    } else if (request.action === "updateElementStyle" && selectedElement) {
      pushStyleUndoSnapshot(selectedElement);
      selectedElement.style[request.property] = request.value;
      sendResponse({
        success: true,
      });
    } else if (request.action === "updateElementStyle") {
      sendResponse({
        success: false,
        error: "No element is selected",
      });
    } else if (request.action === "undoElementStyle") {
      sendResponse({ success: undoStyleChange() });
    } else if (request.action === "redoElementStyle") {
      sendResponse({ success: redoStyleChange() });
    } else if (request.action === "resetElementStyle" && selectedElement) {
      pushStyleUndoSnapshot(selectedElement);
      selectedElement.style.cssText = "";
      sendResponse({
        success: true,
      });
    } else if (request.action === "resetElementStyle") {
      sendResponse({
        success: false,
        error: "No element is selected",
      });
    } else if (request.action.startsWith("copyElement") && selectedElement) {
      showSupportModal(() => {
        const s = window.getComputedStyle(selectedElement);
        const tagName = selectedElement.tagName.toLowerCase();
        let content = "";

        if (request.action.endsWith("CSS")) {
          content = `/* ${tagName} */\nfont-family: ${s.fontFamily};\nfont-size: ${s.fontSize};\nfont-weight: ${s.fontWeight};\ncolor: ${s.color};\nbackground-color: ${s.backgroundColor};\npadding: ${s.padding};\nmargin: ${s.margin};`;
        } else if (request.action.endsWith("JSON")) {
          content = JSON.stringify(
            {
              tagName,
              fontFamily: s.fontFamily,
              fontSize: s.fontSize,
              fontWeight: s.fontWeight,
              color: s.color,
              backgroundColor: s.backgroundColor,
              padding: s.padding,
              margin: s.margin,
            },
            null,
            2,
          );
        } else if (request.action.endsWith("SCSS")) {
          content = `$${tagName}-font-family: ${s.fontFamily};\n$${tagName}-font-size: ${s.fontSize};\n$${tagName}-color: ${s.color};\n$${tagName}-bg: ${s.backgroundColor};`;
        } else if (request.action.endsWith("TW")) {
          content = `className="text-[${s.fontSize}] font-[${s.fontWeight}] text-[${s.color}] bg-[${s.backgroundColor}]"`;
        }

        Promise.resolve(navigator.clipboard.writeText(content))
          .then(() => {
            sendResponse({
              success: true,
            });
          })
          .catch((error) => {
            sendResponse({
              error: error?.message || "Failed to copy element styles",
            });
          });
      });
      return true;
    } else if (request.action.startsWith("copyElement")) {
      sendResponse({
        success: false,
        error: "No element is selected",
      });
      return false;
    }

    sendResponse({
      success: false,
      ignored: true,
    });
    return false;
  });
})();
