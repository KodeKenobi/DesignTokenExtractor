# Quick Icon Setup

## Option 1: Use the HTML Generator (Easiest)

1. Open `generate-icons.html` in your browser
2. Click "Download All Icons"
3. Move the 4 downloaded PNG files to the `icons` folder

## Option 2: Use Python Script

If you have Python installed:

```bash
pip install Pillow
python generate-icons.py
```

## Option 3: Create Simple Placeholders

Create 4 PNG files manually:

- `icon16.png` - 16x16 pixels
- `icon32.png` - 32x32 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

You can use any image editor or even online tools like:

- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

Just use a simple design with colors #667eea and #764ba2 (purple gradient).

## After Creating Icons

Once the icons are in the `icons` folder, reload the extension in Chrome:

1. Go to `chrome://extensions/`
2. Click the reload icon on the Design Token Extractor extension
