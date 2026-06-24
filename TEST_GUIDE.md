# Screen Capture Feature - Diagnostic Test Guide

## How to Test

### Option 1: Quick Console Test (Recommended)
1. Open the website you want to test
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Copy and paste this entire code block:

```javascript
console.log('🧪 QUICK CAPTURE TEST\n');

// Test 1: Screenshot API
console.log('1️⃣ Testing screenshot capture...');
chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (res) => {
  if (chrome.runtime.lastError) {
    console.error('❌ Screenshot Error:', chrome.runtime.lastError.message);
  } else if (res?.dataUrl) {
    console.log('✅ Screenshot works! Data URL length:', res.dataUrl.length);
  } else {
    console.error('❌ No screenshot data returned');
  }
});

// Test 2: Capture script injection
setTimeout(() => {
  console.log('\n2️⃣ Testing capture.js injection...');
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    console.log('- Injecting into tab:', tab.id, tab.url);
    
    if (tab.url.startsWith('chrome://')) {
      console.error('❌ Cannot inject on chrome:// pages');
      return;
    }
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["capture.js"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('❌ Injection Error:', chrome.runtime.lastError.message);
      } else {
        console.log('✅ capture.js injected - look for [TokenExtractor] logs below');
      }
    });
  });
}, 1000);

console.log('⏳ Tests starting... Watch for results\n');
```

5. Press **Enter**
6. Watch the console for:
   - ✅ marks = working
   - ❌ marks = problem

---

### Option 2: Full Diagnostic Test

1. Open DevTools Console
2. Copy and paste **entire content** of `test-capture.js` file
3. Review all test results

---

## What to Look For

### Expected Success Flow:
```
✅ chrome.runtime available
✅ chrome.scripting available
✅ Screenshot received (Data URL length: XXXXX)
✅ capture.js injected
[TokenExtractor] Capture script starting...
[TokenExtractor] Capture flag set to true
[TokenExtractor] Shadow DOM created
[TokenExtractor] Screenshot loaded
✅ Capture script initialized successfully
```

### Common Issues & Fixes

| Error | Cause | Solution |
|-------|-------|----------|
| `❌ Screenshot Error` | Background can't capture | Check manifest.json permissions |
| `❌ Injection Error` | Content script can't inject | Page may be restricted (chrome://, about:, etc.) |
| No `[TokenExtractor]` logs | capture.js didn't run | Check for JavaScript errors above |
| `❌ Shadow DOM not supported` | Browser too old | Update browser |
| Empty console | popup.js not loaded | Click extension icon first |

---

## Detailed Troubleshooting

### Step 1: Is the Extension Installed?
```javascript
console.log(typeof chrome); // Should print "object"
console.log(!!chrome.runtime); // Should print true
```

### Step 2: Can Background Capture?
```javascript
chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (res) => {
  console.log(res?.dataUrl ? "✅ YES" : "❌ NO");
});
```

### Step 3: Can Script Inject?
```javascript
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["capture.js"]
  }, () => {
    console.log(chrome.runtime.lastError ? 
      "❌ " + chrome.runtime.lastError.message : 
      "✅ Injected");
  });
});
```

### Step 4: Check Capture Logs
After injection, search console for:
- `[TokenExtractor] Capture script starting...` → Script ran
- `[TokenExtractor] Screenshot response received: success` → Screenshot loaded
- `[TokenExtractor] Overlay element visible` → UI initialized

---

## If Everything Looks Good But Capture Still Doesn't Work

1. **Clear browser cache** - Ctrl+Shift+Delete
2. **Reload extension** - Go to chrome://extensions, toggle off/on
3. **Hard reload page** - Ctrl+Shift+R
4. **Check for JavaScript errors** - Look for any RED errors in console
5. **Try different website** - Test on simple site (not SPA like Gmail)
6. **Check console for warnings** - Look for ORANGE warnings

---

## Expected Console Output (Full Test)

```
[TokenExtractor] Capture script starting...
[TokenExtractor] Capture flag set to true
[TokenExtractor] Capture container added to DOM
[TokenExtractor] Shadow DOM created
[TokenExtractor] Requesting screenshot from background...
[TokenExtractor] Screenshot response received: success
[TokenExtractor] Loading screenshot image...
[TokenExtractor] Screenshot loaded, drawing background
[TokenExtractor] Overlay mousedown listener attached
[TokenExtractor] Window mousemove listener attached
[TokenExtractor] Window mouseup listener attached
[TokenExtractor] Selection box mousedown
[TokenExtractor] Tool buttons found: 5
[TokenExtractor] Tool button listeners attached
[TokenExtractor] Capture script initialized successfully
[TokenExtractor] Container in DOM: true
[TokenExtractor] Shadow DOM children: 5
[TokenExtractor] Selection box: found
[TokenExtractor] Overlay: found
[TokenExtractor] Canvas elements: 2
```

---

## Report These Results

If tests fail, please share:
1. **Full console output** (screenshot or copy-paste)
2. **Which test fails** (1, 2, 3, 4, etc.)
3. **Website URL** you're testing on
4. **Browser & version** (Chrome/Edge version)
5. **Any RED errors** in console
