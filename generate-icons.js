/**
 * Generate icons for Design Token Extractor Chrome Extension
 * Requires: npm install canvas (or use the HTML generator instead)
 *
 * Run: node generate-icons.js
 */

const fs = require("fs");
const path = require("path");

// Check if canvas is available
let Canvas;
try {
  Canvas = require("canvas");
} catch (e) {
  console.log("Canvas module not found.");
  console.log("Please use generate-icons.html instead, or install canvas:");
  console.log("  npm install canvas");
  console.log("\nOr use the Python script: python generate-icons.py");
  process.exit(1);
}

function createIcon(size) {
  const canvas = Canvas.createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#667eea");
  gradient.addColorStop(1, "#764ba2");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Draw design token symbol (3 overlapping squares)
  ctx.fillStyle = "white";
  ctx.globalAlpha = 0.9;

  const padding = size * 0.15;
  const squareSize = size * 0.25;

  // Square 1 (top-left)
  ctx.fillRect(padding, padding, squareSize, squareSize);

  // Square 2 (center)
  ctx.fillRect(
    size / 2 - squareSize / 2,
    size / 2 - squareSize / 2,
    squareSize,
    squareSize
  );

  // Square 3 (bottom-right)
  ctx.fillRect(
    size - padding - squareSize,
    size - padding - squareSize,
    squareSize,
    squareSize
  );

  return canvas;
}

function main() {
  const sizes = [16, 32, 48, 128];
  const iconsDir = path.join(__dirname, "icons");

  // Create icons directory if it doesn't exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log("Generating icons...\n");

  sizes.forEach((size) => {
    const icon = createIcon(size);
    const filename = path.join(iconsDir, `icon${size}.png`);
    const buffer = icon.toBuffer("image/png");
    fs.writeFileSync(filename, buffer);
    console.log(`✓ Created ${filename} (${size}x${size})`);
  });

  console.log("\n✅ All icons generated successfully!");
  console.log(`Icons saved in: ${path.resolve(iconsDir)}`);
}

main();
