(function () {
  if (window.__teContentActive) return;
  window.__teContentActive = true;

  function extractDesignTokens() {
    const tokens = {
      colors: {
        background: [],
        text: [],
        border: [],
        unique: [],
      },
      spacing: {
        all: [],
        unique: [],
      },
      typography: {
        fontFamilies: [],
        fontSizes: [],
        fontWeights: [],
        lineHeights: [],
        combinations: [],
      },
      shadows: {
        all: [],
        unique: [],
      },
    };

    const allElements = document.querySelectorAll("*");
    const colorSet = new Set();
    const spacingSet = new Set();
    const shadowSet = new Set();
    const fontFamilySet = new Set();
    const fontSizeSet = new Set();
    const fontWeightSet = new Set();

    allElements.forEach((element) => {
      const styles = window.getComputedStyle(element);

      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      const borderColor = styles.borderColor;

      if (
        bgColor &&
        bgColor !== "rgba(0, 0, 0, 0)" &&
        bgColor !== "transparent"
      ) {
        const rgb = parseColor(bgColor);
        if (rgb) {
          const hex = rgbToHex(rgb);
          if (!colorSet.has(hex)) {
            colorSet.add(hex);
            tokens.colors.background.push({ value: hex, rgb: rgb });
          }
        }
      }

      if (textColor && textColor !== "rgba(0, 0, 0, 0)") {
        const rgb = parseColor(textColor);
        if (rgb) {
          const hex = rgbToHex(rgb);
          if (!colorSet.has(hex)) {
            colorSet.add(hex);
            tokens.colors.text.push({ value: hex, rgb: rgb });
          }
        }
      }

      const boxShadow = styles.boxShadow;
      if (boxShadow && boxShadow !== "none" && !shadowSet.has(boxShadow)) {
        shadowSet.add(boxShadow);
        tokens.shadows.all.push({
          value: boxShadow,
          element: element.tagName?.toLowerCase() || "unknown",
          context:
            element.textContent?.trim().substring(0, 50) ||
            element.tagName?.toLowerCase() ||
            "unknown",
        });
      }

      const margin = styles.margin;
      const padding = styles.padding;
      const gap = styles.gap;
      const tagName = element.tagName?.toLowerCase() || "unknown";
      const elementText = element.textContent?.trim().substring(0, 50) || "";

      [
        {
          value: margin,
          type: "margin",
        },
        {
          value: padding,
          type: "padding",
        },
        {
          value: gap,
          type: "gap",
        },
      ].forEach(({ value, type }) => {
        if (value && value !== "0px" && value !== "normal") {
          const values = value.split(" ").filter((v) => v && v !== "auto");
          values.forEach((val) => {
            if (val && !spacingSet.has(val)) {
              spacingSet.add(val);
              tokens.spacing.all.push({
                value: val,
                type,
                element: tagName,
                context: elementText || tagName,
              });
            }
          });
        }
      });

      const fontFamily = styles.fontFamily;
      const fontSize = styles.fontSize;
      const fontWeight = styles.fontWeight;
      const lineHeight = styles.lineHeight;

      if (fontFamily && fontSize && fontSize !== "0px") {
        const fontName = fontFamily.split(",")[0].trim().replace(/['"]/g, "");
        const textSample = elementText || tagName;
        const existingCombo = tokens.typography.combinations.find(
          (c) =>
            c.font === fontName &&
            c.size === fontSize &&
            c.weight === (fontWeight || "normal"),
        );

        if (!existingCombo) {
          tokens.typography.combinations.push({
            font: fontName,
            size: fontSize,
            weight: fontWeight || "normal",
            lineHeight,
            examples: [textSample || tagName],
            element: tagName,
          });
        } else if (textSample && !existingCombo.examples.includes(textSample)) {
          existingCombo.examples.push(textSample);
        }

        if (!fontFamilySet.has(fontFamily)) {
          fontFamilySet.add(fontFamily);
          tokens.typography.fontFamilies.push(fontName);
        }
        if (!fontSizeSet.has(fontSize)) {
          fontSizeSet.add(fontSize);
          tokens.typography.fontSizes.push(fontSize);
        }
        if (
          fontWeight &&
          fontWeight !== "normal" &&
          fontWeight !== "400" &&
          !fontWeightSet.has(fontWeight)
        ) {
          fontWeightSet.add(fontWeight);
          tokens.typography.fontWeights.push(fontWeight);
        }
      }
    });

    tokens.colors.unique = Array.from(colorSet).map((hex) => ({
      value: hex,
      rgb: hexToRgb(hex),
    }));
    tokens.spacing.unique = Array.from(spacingSet).sort(
      (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0),
    );
    tokens.typography.fontFamilies = [
      ...new Set(tokens.typography.fontFamilies),
    ];
    tokens.typography.fontSizes = [
      ...new Set(tokens.typography.fontSizes),
    ].sort((a, b) => parseFloat(a) - parseFloat(b));
    tokens.typography.fontWeights = [
      ...new Set(tokens.typography.fontWeights),
    ].sort((a, b) => parseInt(a) - parseInt(b));

    return tokens;
  }

  function parseColor(color) {
    if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)")
      return null;
    const rgbMatch = color.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (rgbMatch)
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3]),
      };
    const hexMatch = color.match(/#([0-9a-f]{3}|[0-9a-f]{6})/i);
    if (hexMatch) return hexToRgb(hexMatch[0]);
    return null;
  }

  function rgbToHex(rgb) {
    return (
      "#" +
      [rgb.r, rgb.g, rgb.b].map((x) => x.toString(16).padStart(2, "0")).join("")
    );
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  // Bubble logic (DRAGGABLE & TOGGLEABLE)
  function showMinimizeBubble() {
    if (document.getElementById("dte-minimize-bubble")) return;
    const bubble = document.createElement("div");
    bubble.id = "dte-minimize-bubble";
    bubble.innerHTML = `
      <style>
        #dte-minimize-bubble {
          position: fixed; bottom: 30px; right: 30px; 
          width: 38px; height: 38px; 
          background: rgba(255, 255, 255, 0.03); 
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-radius: 50%; cursor: grab; z-index: 2147483647;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.5);
        }
        #dte-minimize-bubble:active { cursor: grabbing; scale: 0.95; }
        #dte-minimize-bubble:hover { 
          background: rgba(255, 255, 255, 0.08); 
          color: #6366f1;
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
        }
        #dte-minimize-bubble svg { width: 18px; height: 18px; pointer-events: none; opacity: 0.8; }
      </style>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
      </svg>
    `;

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    let moved = false;

    bubble.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);

    function dragStart(e) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      if (e.target === bubble) isDragging = true;
      moved = false;
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        bubble.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        moved = true;
      }
    }

    function dragEnd(e) {
      isDragging = false;
    }

    bubble.onclick = (e) => {
      if (moved) return; // Don't trigger if it was a drag
      chrome.runtime.sendMessage({ action: "openFloatingPanel" });
      bubble.remove();
    };

    document.body.appendChild(bubble);
  }

  function hideMinimizeBubble() {
    const bubble = document.getElementById("dte-minimize-bubble");
    if (bubble) bubble.remove();
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractTokens") {
      try {
        sendResponse({ tokens: extractDesignTokens() });
      } catch (error) {
        sendResponse({ error: error.message });
      }
      return false;
    } else if (request.action === "showMinimizeBubble") {
      showMinimizeBubble();
      sendResponse({ success: true });
      return false;
    } else if (request.action === "hideMinimizeBubble") {
      hideMinimizeBubble();
      sendResponse({ success: true });
      return false;
    } else if (request.action === "checkEditorState") {
      // editor.js isn't injected until the user enables it, so answer here
      // to avoid an unanswered message port closing with an error.
      sendResponse({ enabled: false });
      return false;
    }

    return false;
  });
})();
