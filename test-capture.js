// Test script for Design Token Extractor - Screen Capture feature
// Run this in the browser console to diagnose issues

console.log('=== DESIGN TOKEN EXTRACTOR - CAPTURE TEST SUITE ===\n');

// Test 1: Check if chrome API is available
console.log('TEST 1: Chrome API availability');
console.log('- chrome.runtime:', typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' ? '✅ AVAILABLE' : '❌ NOT AVAILABLE');
console.log('- chrome.tabs:', typeof chrome !== 'undefined' && typeof chrome.tabs !== 'undefined' ? '✅ AVAILABLE' : '❌ NOT AVAILABLE');
console.log('- chrome.scripting:', typeof chrome !== 'undefined' && typeof chrome.scripting !== 'undefined' ? '✅ AVAILABLE' : '❌ NOT AVAILABLE');
console.log('');

// Test 2: Check if capture flag exists
console.log('TEST 2: Capture flag state');
console.log('- window.__teCaptureActive:', window.__teCaptureActive || 'not set');
console.log('');

// Test 3: Check if floating panel exists
console.log('TEST 3: Floating panel state');
console.log('- window.__teFloatingPanel exists:', !!window.__teFloatingPanel ? '✅ YES' : '❌ NO');
if (window.__teFloatingPanel) {
  console.log('- Panel status:', window.__teFloatingPanel.getStatus());
}
console.log('');

// Test 4: Test captureVisibleTab message
console.log('TEST 4: captureVisibleTab API');
chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (res) => {
  if (chrome.runtime.lastError) {
    console.error('- Error:', chrome.runtime.lastError.message);
  } else if (res?.dataUrl) {
    console.log('✅ Screenshot captured successfully');
    console.log('- Data URL length:', res.dataUrl.length);
    console.log('- Preview: ' + res.dataUrl.substring(0, 50) + '...');
  } else {
    console.error('❌ No dataUrl in response:', res);
  }
});
console.log('');

// Test 5: Check if capture container would be created properly
console.log('TEST 5: Shadow DOM Container Creation');
try {
  const testContainer = document.createElement('div');
  testContainer.id = 'test-capture-container';
  Object.assign(testContainer.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '2147483647',
  });
  document.body.appendChild(testContainer);
  console.log('✅ Container created and appended');
  
  const shadow = testContainer.attachShadow({ mode: 'open' });
  console.log('✅ Shadow DOM attached');
  
  const style = document.createElement('style');
  style.textContent = '.test { color: red; }';
  shadow.appendChild(style);
  console.log('✅ Styles applied to shadow DOM');
  
  const div = document.createElement('div');
  div.className = 'test';
  div.textContent = 'Test Content';
  shadow.appendChild(div);
  console.log('✅ Content added to shadow DOM');
  
  // Cleanup
  setTimeout(() => {
    testContainer.remove();
    console.log('✅ Test container cleaned up');
  }, 2000);
} catch (err) {
  console.error('❌ Error creating shadow DOM:', err);
}
console.log('');

// Test 6: Manual capture injection
console.log('TEST 6: Manual Capture Injection');
console.log('To manually test capture injection, run this command:');
console.log(`
chrome.scripting.executeScript({
  target: { tabId: ${(await chrome.tabs.query({active: true, currentWindow: true}))[0].id} },
  files: ["capture.js"]
}, () => {
  if (chrome.runtime.lastError) {
    console.error('Injection failed:', chrome.runtime.lastError);
  } else {
    console.log('Capture.js injected successfully');
  }
});
`);
console.log('');

// Test 7: Check popup container
console.log('TEST 7: Popup Container');
console.log('- window.__popupContainer:', window.__popupContainer ? '✅ EXISTS' : '❌ MISSING');
console.log('');

// Test 8: Get current tab info
console.log('TEST 8: Current Tab Info');
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab) {
    console.log('- Tab ID:', tab.id);
    console.log('- Tab URL:', tab.url);
    console.log('- Is injectable:', !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:') ? '✅ YES' : '❌ NO');
  }
});
console.log('');

// Test 9: Check document ready state
console.log('TEST 9: Document State');
console.log('- document.readyState:', document.readyState);
console.log('- document.body:', document.body ? '✅ EXISTS' : '❌ MISSING');
console.log('');

// Test 10: Direct canvas test
console.log('TEST 10: Canvas Support');
try {
  const testCanvas = document.createElement('canvas');
  testCanvas.width = 100;
  testCanvas.height = 100;
  const ctx = testCanvas.getContext('2d');
  ctx.fillStyle = 'blue';
  ctx.fillRect(0, 0, 100, 100);
  console.log('✅ Canvas 2D context works');
  testCanvas.toBlob((blob) => {
    console.log('✅ Canvas.toBlob() works, blob size:', blob.size);
  });
} catch (err) {
  console.error('❌ Canvas error:', err);
}
console.log('');

console.log('=== TEST SUITE COMPLETE ===');
console.log('');
console.log('NEXT STEPS:');
console.log('1. Check for any ❌ marks above');
console.log('2. If capture.js is not showing logs, check that chrome.scripting is working');
console.log('3. Look for any JavaScript errors in the console (red text)');
console.log('4. Try manually injecting capture.js using Test 6 command');
