/**
 * Generate icons immediately using canvas (if available) or provide alternative
 */

const fs = require("fs");
const path = require("path");

// Try to use canvas if available
let Canvas;
try {
  Canvas = require("canvas");
  console.log("✓ Canvas library found - generating icons...\n");
} catch (e) {
  console.log("Canvas not available. Installing...\n");
  console.log("Please run: npm install canvas");
  console.log("Or use: node generate-icons.js (after installing canvas)");
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

  // Draw design token symbol
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

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log("Generating icons...\n");

  sizes.forEach((size) => {
    const icon = createIcon(size);
    const filename = path.join(iconsDir, `icon${size}.png`);
    const buffer = icon.toBuffer("image/png");
    fs.writeFileSync(filename, buffer);
    console.log(`✓ Created ${path.basename(filename)} (${size}x${size})`);
  });

  console.log("\n✅ All icons generated successfully!");
  console.log(`Icons saved in: ${path.resolve(iconsDir)}\n`);
  console.log("You can now load the extension in Chrome!");
}

main();
