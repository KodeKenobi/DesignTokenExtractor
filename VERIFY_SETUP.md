# Extension Setup Verification

## ✅ Checklist

### 1. Icons (Required)

- [ ] `icons/icon16.png` exists
- [ ] `icons/icon32.png` exists
- [ ] `icons/icon48.png` exists
- [ ] `icons/icon128.png` exists

**Quick Fix:** Open `generate-icons.html` in your browser and click "Download All Icons"

### 2. Required Files (Should all exist)

- [x] `manifest.json` ✓
- [x] `popup.html` ✓
- [x] `popup.js` ✓
- [x] `content.js` ✓
- [x] `background.js` ✓

### 3. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `design-token-extractor` folder
5. The extension should load without errors

### 4. Test the Extension

1. Navigate to any website (e.g., https://github.com)
2. Click the Design Token Extractor icon in your toolbar
3. Click "Extract Design Tokens"
4. You should see colors, spacing, and typography extracted
5. Try exporting in different formats (JSON, CSS, TS, Tailwind)

## Common Issues

**Error: "Could not load icon"**

- Solution: Generate icons using `generate-icons.html` or one of the scripts

**Error: "Manifest file is missing or unreadable"**

- Solution: Make sure you're selecting the `design-token-extractor` folder, not a parent folder

**Extension loads but doesn't extract tokens**

- Solution: Make sure you're on a valid webpage (not chrome:// pages)
- Check browser console for errors (F12)

## Next Steps

Once the extension loads successfully:

1. Test on different websites
2. Try all export formats
3. Customize the icon design if desired
4. Consider publishing to Chrome Web Store!
