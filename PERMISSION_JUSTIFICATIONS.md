# Chrome Web Store Permission Justifications

## activeTab Justification

The activeTab permission is required to access the content of the currently active browser tab when the user clicks the extension icon. This permission allows Design Extractor to:

1. Extract design tokens (colors, spacing, typography) from the webpage by reading computed styles from DOM elements
2. Enable the live page editor functionality that allows users to click and edit elements on the page
3. Access the page's Document Object Model (DOM) to scan all elements and extract their design properties

The extension only accesses the tab when the user explicitly activates it by clicking the extension icon, ensuring user privacy and control. The extension does not access tabs in the background or without user interaction. This permission is essential for the core functionality of extracting design tokens from webpages, as the extension needs to read the computed styles and structure of elements on the page to identify colors, spacing values, and typography information.

Without this permission, the extension would be unable to analyze webpages and extract design tokens, which is the primary purpose of the extension. The activeTab permission follows the principle of least privilege by only granting access to the currently active tab when the user explicitly requests it, rather than requesting broad access to all tabs or browsing history.

## scripting Justification

The scripting permission is required to inject the live editor script (editor.js) into webpages when users enable the live editing mode. This permission allows Design Extractor to:

1. Inject the editor script into the active tab to enable interactive element selection and editing
2. Execute content scripts that extract design tokens by analyzing the page's computed styles
3. Enable the live page editor functionality that requires script injection to add event listeners and modify page behavior

The scripting permission is used exclusively when the user explicitly enables the live editor mode through the extension popup interface. The extension does not inject scripts automatically or without user consent. When enabled, the injected script allows users to click elements on the page to view and edit their styles in real-time, which requires adding event listeners and modifying the page's interactive behavior.

This permission is essential for the live editor feature, which is a core functionality that differentiates this extension from simple token extractors. The editor script needs to be injected into the page context to access the DOM, add visual overlays, create the editing sidebar panel, and handle user interactions with page elements. Without this permission, the live editor feature would not function, significantly reducing the extension's value to users who want to experiment with design changes in real-time.

## Host Permission Justification (<all_urls>)

The host permission for all URLs is required because Design Extractor is designed to work on any website that users visit. The extension needs this broad permission because:

1. Users may want to extract design tokens from any website they visit, including competitor sites, design inspiration sites, or their own projects
2. The extension must work across all domains and protocols (http, https) to provide universal functionality
3. Design tokens can be found on any type of website, from simple static sites to complex single-page applications built with React, Vue, Angular, or other frameworks
4. The live editor feature must function on any webpage where users want to experiment with design changes

The extension does not collect, store, or transmit any data from visited websites. All processing happens locally in the user's browser. The extension only accesses the current active tab when explicitly activated by the user clicking the extension icon. No background access, data collection, or network requests are made to external servers.

The broad host permission is necessary because it's impossible to predict which websites users will want to analyze. Designers and developers may want to extract tokens from:

- Competitor websites for research
- Design inspiration sites
- Their own development projects
- Client websites
- Open source projects
- Any website with interesting design patterns

Restricting the extension to specific domains would severely limit its usefulness, as users would need to manually add each website they want to analyze, creating a poor user experience. The extension's value proposition is the ability to instantly extract design tokens from any website without configuration or setup.

## tabs Justification

The tabs permission is required to monitor tab navigation and maintain proper extension state when users switch between different types of pages. This permission allows Design Extractor to:

1. Detect when users navigate from regular websites to Chrome system pages (like chrome://extensions, chrome://settings, etc.)
2. Automatically reset the live editor state when navigating to pages where the editor cannot function
3. Provide appropriate user feedback when the extension's functionality is limited by the page type
4. Maintain UI consistency by updating button states and indicators based on the current page context

The tabs permission is used with `chrome.tabs.onUpdated` to listen for tab navigation events. When a user navigates to a Chrome system page where the live editor cannot be enabled, the extension automatically:

- Resets the "Enable Live Editor" button to its default state
- Hides the active indicator
- Prevents the editor from being in an inconsistent enabled state on unsupported pages

This permission does not allow the extension to:

- Read tab content or access browsing history
- Track user navigation patterns
- Access tabs in the background without user interaction

The tabs permission follows the principle of least privilege by only requesting the minimal access needed to provide a smooth user experience. Without this permission, users could end up with the live editor button showing "Disable" even when navigating to pages where the editor cannot function, leading to confusion and poor user experience.

The extension uses Manifest V3 security best practices, including:

- Only accessing the active tab when user explicitly activates the extension
- Processing all data locally without external transmission
- No background scripts that access tabs without user interaction
- Clear user control over when the extension accesses page content

This permission model ensures users have full control over when and which pages the extension accesses, while providing the universal functionality that makes the extension valuable for design system analysis across the entire web.
