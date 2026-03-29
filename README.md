# Design Token Extractor

> Extract design system tokens (colors, spacing, typography) from any website and export them in multiple formats.

![Version](https://img.shields.io/badge/version-1.1.0-6366f1) ![Manifest](https://img.shields.io/badge/manifest-v3-10b981) ![License](https://img.shields.io/badge/license-MIT-f59e0b)

---

## What's New in v1.1.0

- **Side Panel Architecture** — The entire extension now runs inside Chrome's native Side Panel for a seamless, persistent workflow alongside any webpage.
- **Live Page Editor** — Select any element on the page and edit its typography, colors, and spacing in real time from the sidebar. Changes apply instantly.
- **Minimize to Bubble** — Collapse the sidebar into a tiny, draggable glassmorphic overlay so you can view the full-width page (great for screenshots). Click the bubble to reopen instantly.
- **Smart Capture (Alt+S)** — One-click intelligent page capture with Shadow DOM encapsulation for zero style conflicts.
- **Tailwind Export** — New fourth export format generates Tailwind CSS utility classes for any extracted token set.
- **Improved Color Detection** — Robust background and border color extraction that walks the DOM tree to find the true visible color, even on transparent elements.
- **Improved Spacing Detection** — Shorthand reconstruction logic ensures accurate padding and margin values even when browsers report empty shorthands.
- **Interactive Info Buttons** — Pulsating info indicators on token cards guide users to deeper context and usage details.

---

## Features



## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `design-token-extractor` folder
5. The extension icon will appear in your toolbar

## Usage

1. Navigate to any website you want to analyze
2. Click the Design Token Extractor icon in your toolbar
3. Click "Extract Design Tokens"
4. Browse the extracted tokens in the popup
5. Export in your preferred format (JSON, CSS, or TypeScript)

## Export Formats

### JSON

```json
{
  "colors": {
    "unique": [{ "value": "#667eea", "rgb": { "r": 102, "g": 126, "b": 234 } }]
  },
  "spacing": {
    "unique": ["8px", "16px", "24px"]
  },
  "typography": {
    "fontFamilies": ["Inter", "Arial"],
    "fontSizes": ["12px", "16px", "24px"]
  }
}
```

### CSS Variables

```css
:root {
  --color-1: #667eea;
  --spacing-1: 8px;
  --font-family-1: Inter;
}
```

### TypeScript

```typescript
export const designTokens = {
  colors: {
    color1: "#667eea",
  },
  spacing: {
    spacing1: "8px",
  },
  typography: {
    fontFamilies: ["Inter"],
    fontSizes: ["16px"],
  },
} as const;
```

## How It Works

The extension uses a content script to:

1. Scan all elements on the page
2. Extract computed styles for colors, spacing, and typography
3. Deduplicate and organize the tokens
4. Present them in an easy-to-use interface

## Use Cases

- **Design System Analysis**: Understand the design tokens used by popular websites
- **Competitive Research**: Extract color palettes and spacing systems from competitors
- **Migration Projects**: Capture design tokens before migrating to a new system
- **Learning**: Study how professional design systems are structured
- **Inspiration**: Get color and typography ideas for your own projects

## Privacy

- All processing happens locally in your browser
- No data is sent to external servers
- No tracking or analytics
- Works entirely offline after installation

## Future Enhancements

- [ ] Export to Figma tokens format
- [ ] Export to Tailwind config
- [ ] Export to Style Dictionary
- [ ] Visual spacing overlay on page
- [ ] Color palette generator
- [ ] Typography scale detection
- [ ] Shadow and border radius extraction
- [ ] Animation timing extraction

## License

MIT


## Overview

Overview
Extract design system tokens (colors, spacing, typography) from any website

### Core Features

**Comprehensive Token Extraction**

The extension automatically scans every element on a webpage to extract three primary categories of design tokens:

1. **Color Tokens**: The extension identifies and extracts all color values used throughout the page, including background colors, text colors, and border colors. Each color is presented in both hexadecimal and RGB formats, with visual color swatches for easy identification. The system automatically deduplicates colors, showing only unique values to help you understand the complete color palette of any website.

2. **Spacing Tokens**: All spacing values are extracted and categorized by type, including margins, padding, and gap values. The extension provides contextual information showing which HTML elements use specific spacing values, making it easy to understand how spacing is applied throughout the design. This helps identify spacing systems, rhythm patterns, and design consistency.

3. **Typography Tokens**: Complete typography analysis includes font families, font sizes, font weights, and line heights. The extension groups typography combinations together, showing which font families are paired with specific sizes and weights. Additionally, it displays actual text samples from the page, allowing you to see typography in context and understand how different type combinations are used.

**Live Page Editor**

Beyond extraction, Design Extractor includes a professional live editing mode that functions similarly to WordPress page builders. When enabled, you can:

- Click any element on the page to select it
- View all computed styles in a dedicated sidebar panel
- Edit typography properties including font family, font size, font weight, line height, and text color in real-time
- Modify background colors and border colors with a visual color picker
- Adjust spacing values including padding and margin
- See changes applied instantly to the page
- Copy the complete CSS for any edited element
- Reset changes to restore original styles

The live editor provides visual feedback with hover highlights and selection indicators, making it easy to identify and modify specific elements. This feature is invaluable for prototyping, testing design variations, and understanding how design tokens work together in practice.

**Multiple Export Formats**

Design Extractor supports exporting extracted tokens in four industry-standard formats:

1. **JSON Export**: Complete token data in structured JSON format, perfect for importing into design tools, documentation systems, or custom applications. The JSON includes all color values with RGB breakdowns, all spacing values, and complete typography information.

2. **CSS Variables Export**: Generates CSS custom properties (CSS variables) that can be directly integrated into your stylesheets. This format is ideal for maintaining design tokens in CSS-based design systems and ensures compatibility with modern CSS workflows.

3. **TypeScript Export**: Type-safe TypeScript constants that can be imported directly into TypeScript or JavaScript projects. The exported code includes proper type definitions and follows TypeScript best practices, making it easy to integrate tokens into React, Vue, Angular, or any TypeScript-based application.

4. **Tailwind Config Export**: Generates a complete Tailwind CSS configuration file with all extracted tokens properly formatted for Tailwind's design system. This includes color palettes, spacing scales, and typography settings, allowing you to quickly bootstrap a Tailwind project based on any website's design tokens.

**User Interface**

The extension features a clean, dark-themed interface organized into intuitive tabs:

- **Colors Tab**: Displays all extracted colors organized by type (background, text, border) with visual color swatches, hexadecimal values, and RGB values. Click any color to copy its value to your clipboard.

- **Spacing Tab**: Shows all spacing values grouped by type (margin, padding, gap) with contextual information about which elements use each spacing value. This helps identify spacing patterns and design system consistency.

- **Typography Tab**: Presents font families, font sizes, and font weights in organized sections. Typography combinations are grouped together with text samples, showing how different type combinations appear in context.

- **Live Editor Tab**: Provides controls to enable or disable the live editing mode, with status indicators showing the current editor state.

**Privacy and Security**

Design Extractor operates entirely locally within your browser. All token extraction and processing happens on your device, with no data transmitted to external servers. The extension requires only the "activeTab" permission, meaning it can only access the current tab you're viewing, not your browsing history or other tabs. No tracking, analytics, or data collection occurs. The extension works completely offline after installation, ensuring your privacy and security.

**Technical Implementation**

The extension uses advanced browser APIs to extract computed styles from every element on a page. It analyzes the Document Object Model (DOM) comprehensively, processing all visible and hidden elements to ensure complete token extraction. The extraction algorithm handles edge cases including transparent colors, inherited styles, and dynamically generated content. The extension is built using Manifest V3, the latest Chrome extension standard, ensuring compatibility and security.

**Use Cases**

Design Extractor serves multiple professional use cases:

- **Design System Analysis**: Understand how leading websites structure their design systems by extracting and analyzing their design tokens. Learn from industry best practices and identify patterns used by successful design teams.

- **Competitive Research**: Extract color palettes, spacing systems, and typography choices from competitor websites. Understand their design language and use this information to inform your own design decisions.

- **Migration Projects**: When migrating from one design system to another, extract existing tokens to ensure consistency and identify all design values that need to be mapped or updated.

- **Design Inspiration**: Discover color combinations, typography pairings, and spacing patterns from websites you admire. Use extracted tokens as starting points for your own design projects.

- **Educational Purposes**: Learn how professional design systems are structured by examining real-world implementations. Understand the relationship between design tokens and visual design.

- **Rapid Prototyping**: Use the live editor to quickly test design variations and see how different token values affect the visual appearance of elements.

- **Design System Documentation**: Export tokens to create comprehensive documentation of existing design systems, making it easier to maintain consistency across teams and projects.

**Performance and Reliability**

The extension is optimized for performance, handling large and complex websites efficiently. The extraction process runs asynchronously to prevent browser freezing, and the interface provides clear feedback during extraction. Error handling ensures the extension gracefully handles edge cases and provides helpful error messages when extraction cannot be performed on certain page types.

**Compatibility**

Design Extractor works on all websites accessible through Chrome, including static websites, single-page applications, and dynamically generated content. The extension is compatible with modern web technologies including React, Vue, Angular, and other JavaScript frameworks. It can extract tokens from websites using CSS-in-JS, CSS modules, or traditional stylesheets.

**Getting Started**

Using Design Extractor is straightforward:

1. Install the extension from the Chrome Web Store
2. Navigate to any website you want to analyze
3. Click the Design Extractor icon in your Chrome toolbar
4. Click the "Extract Design Tokens" button
5. Browse the extracted tokens in the organized tabs
6. Export tokens in your preferred format (JSON, CSS, TypeScript, or Tailwind)
7. Optionally enable Live Editor mode to interactively edit page elements

**For Developers**

The extension is particularly valuable for front-end developers working with design systems. The exported formats are production-ready and can be directly integrated into build processes. The TypeScript export includes proper type definitions, and the Tailwind config export follows Tailwind's official configuration format. Developers can use extracted tokens to quickly bootstrap new projects, maintain design consistency, and ensure alignment between design and implementation.

**For Designers**

Designers can use this extension to analyze design systems, extract color palettes for mood boards, understand typography hierarchies, and study spacing systems. The live editor allows designers to experiment with design variations without needing to modify source code, making it an excellent tool for rapid iteration and client presentations.

**Regular Updates**

The extension is actively maintained with regular updates that add new features, improve extraction accuracy, and enhance export formats. User feedback drives development priorities, ensuring the tool continues to meet the needs of the design and development community.

**Support and Documentation**

Comprehensive documentation is available, and the extension includes helpful tooltips and status messages to guide users. The interface is designed to be intuitive, requiring no technical knowledge to extract and export design tokens.

Design Extractor transforms the way you work with design systems, making it easy to extract, analyze, and export design tokens from any website. Whether you're a designer, developer, or design system architect, this tool provides the insights and exports you need to work more efficiently and maintain design consistency across your projects.

---

## What's New in v1.1.0

- **Side Panel Architecture** — The entire extension now runs inside Chrome's native Side Panel for a seamless, persistent workflow alongside any webpage.
- **Live Page Editor** — Select any element on the page and edit its typography, colors, and spacing in real time from the sidebar. Changes apply instantly.
- **Minimize to Bubble** — Collapse the sidebar into a tiny, draggable glassmorphic overlay so you can view the full-width page (great for screenshots). Click the bubble to reopen instantly.
- **Smart Capture (Alt+S)** — One-click intelligent page capture with Shadow DOM encapsulation for zero style conflicts.
- **Tailwind Export** — New fourth export format generates Tailwind CSS utility classes for any extracted token set.
- **Improved Color Detection** — Robust background and border color extraction that walks the DOM tree to find the true visible color, even on transparent elements.
- **Improved Spacing Detection** — Shorthand reconstruction logic ensures accurate padding and margin values even when browsers report empty shorthands.
- **Interactive Info Buttons** — Pulsating info indicators on token cards guide users to deeper context and usage details.

---

## Chrome Web Store Description

> **Copy the text below for your Chrome Web Store listing:**

**Design Token Extractor — Extract, Edit & Export Design Tokens from Any Website**

The most powerful design token tool for Chrome. Extract colors, spacing, typography, and shadows from any website and export them in JSON, CSS, SCSS, or Tailwind format — all from Chrome's native Side Panel.

**🆕 NEW IN v1.1.0:**

✅ Side Panel Architecture — The extension now runs persistently inside Chrome's Side Panel, so you can browse and extract tokens side-by-side with any webpage. No more popup windows that close when you click away.

✅ Live Page Editor — Select any element on the page and edit its styles in real time. Change fonts, colors, spacing, and see results instantly. Functions like a lightweight page builder right in your browser.

✅ Minimize to Bubble — Need to see the full page? Collapse the sidebar into a tiny, draggable floating overlay. Click it to reopen instantly. Perfect for taking full-width screenshots while keeping your workspace one click away.

✅ Tailwind Export — New fourth export format generates Tailwind CSS utility classes and config values from any extracted token set.

✅ Improved Color & Spacing Detection — Smarter algorithms walk the DOM tree to find true visible colors (even on transparent elements) and reconstruct accurate spacing values.

**CORE FEATURES:**

🎨 Color Extraction — Automatically extracts background, text, and border colors with hex values, RGB breakdowns, and visual swatches. Deduplicates for a clean palette view.

📐 Spacing Analysis — Identifies all margin, padding, and gap values with contextual information about which elements use each value.

🔤 Typography Detection — Captures font families, sizes, weights, and line heights. Groups typography combinations with real text samples from the page.

✏️ Live Editor — Click any element to select it, then edit typography, colors, and spacing from the sidebar. Changes apply instantly. Copy the full CSS for any element in JSON, CSS, SCSS, or Tailwind format.

📦 4 Export Formats — JSON (for design tools), CSS Variables (for stylesheets), SCSS Variables (for Sass projects), Tailwind Config (for utility-first workflows).

📸 Smart Capture — Trigger with Alt+S for intelligent page capture with zero style conflicts.

🫧 Minimize to Bubble — Collapse to a draggable floating overlay for full-screen visibility. One click to reopen.

**PRIVACY:**
All processing happens locally in your browser. No data is sent to external servers. No tracking. No analytics. Works completely offline. Built on Manifest V3.

**FOR DEVELOPERS:**
Exported formats are production-ready. JSON includes complete token data. CSS Variables drop directly into stylesheets. SCSS Variables integrate with Sass pipelines. Tailwind Config follows the official format. The Live Editor lets you prototype changes without touching source code.

**FOR DESIGNERS:**
Extract color palettes, study typography hierarchies, and analyze spacing systems from any website. Use the Live Editor to experiment with design variations and present alternatives to clients — no code required.#   D e s i g n T o k e n E x t r a c t o r  
 #   D e s i g n T o k e n E x t r a c t o r  
 