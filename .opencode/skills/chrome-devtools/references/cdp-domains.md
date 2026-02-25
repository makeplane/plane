# Chrome DevTools Protocol (CDP) Domains Reference

Complete reference of CDP domains and their capabilities for browser automation and debugging.

## Overview

CDP is organized into **47 domains**, each providing specific browser capabilities. Domains are grouped by functionality:

- **Core** - Fundamental browser control
- **DOM & Styling** - Page structure and styling
- **Network & Fetch** - HTTP traffic management
- **Page & Navigation** - Page lifecycle control
- **Storage & Data** - Browser storage APIs
- **Performance & Profiling** - Metrics and analysis
- **Emulation & Simulation** - Device and network emulation
- **Worker & Service** - Background tasks
- **Developer Tools** - Debugging support

---

## Core Domains

### Runtime
**Purpose:** Execute JavaScript, manage objects, handle promises

**Key Commands:**
- `Runtime.evaluate(expression)` - Execute JavaScript
- `Runtime.callFunctionOn(functionDeclaration, objectId)` - Call function on object
- `Runtime.getProperties(objectId)` - Get object properties
- `Runtime.awaitPromise(promiseObjectId)` - Wait for promise resolution

**Key Events:**
- `Runtime.consoleAPICalled` - Console message logged
- `Runtime.exceptionThrown` - Uncaught exception

**Use Cases:**
- Execute custom JavaScript
- Access page data
- Monitor console output
- Handle exceptions

---

### Debugger
**Purpose:** JavaScript debugging, breakpoints, stack traces

**Key Commands:**
- `Debugger.enable()` - Enable debugger
- `Debugger.setBreakpoint(location)` - Set breakpoint
- `Debugger.pause()` - Pause execution
- `Debugger.resume()` - Resume execution
- `Debugger.stepOver/stepInto/stepOut()` - Step through code

**Key Events:**
- `Debugger.paused` - Execution paused
- `Debugger.resumed` - Execution resumed
- `Debugger.scriptParsed` - Script loaded

**Use Cases:**
- Debug JavaScript errors
- Inspect call stacks
- Set conditional breakpoints
- Source map support

---

### Console (Deprecated - Use Runtime/Log)
**Purpose:** Legacy console message access

**Note:** Use `Runtime.consoleAPICalled` event instead for new implementations.

---

## DOM & Styling Domains

### DOM
**Purpose:** Access and manipulate DOM tree

**Key Commands:**
- `DOM.getDocument()` - Get root document node
- `DOM.querySelector(nodeId, selector)` - Query selector
- `DOM.querySelectorAll(nodeId, selector)` - Query all
- `DOM.getAttributes(nodeId)` - Get element attributes
- `DOM.setOuterHTML(nodeId, outerHTML)` - Replace element
- `DOM.getBoxModel(nodeId)` - Get element layout box
- `DOM.focus(nodeId)` - Focus element

**Key Events:**
- `DOM.documentUpdated` - Document changed
- `DOM.setChildNodes` - Child nodes updated

**Use Cases:**
- Navigate DOM tree
- Query elements
- Modify DOM structure
- Get element positions

---

### CSS
**Purpose:** Inspect and modify CSS styles

**Key Commands:**
- `CSS.enable()` - Enable CSS domain
- `CSS.getComputedStyleForNode(nodeId)` - Get computed styles
- `CSS.getInlineStylesForNode(nodeId)` - Get inline styles
- `CSS.getMatchedStylesForNode(nodeId)` - Get matched CSS rules
- `CSS.setStyleTexts(edits)` - Modify styles

**Key Events:**
- `CSS.styleSheetAdded` - Stylesheet added
- `CSS.styleSheetChanged` - Stylesheet modified

**Use Cases:**
- Inspect element styles
- Debug CSS issues
- Modify styles dynamically
- Extract stylesheet data

---

### Accessibility
**Purpose:** Access accessibility tree

**Key Commands:**
- `Accessibility.enable()` - Enable accessibility
- `Accessibility.getFullAXTree()` - Get complete AX tree
- `Accessibility.getPartialAXTree(nodeId)` - Get node subtree
- `Accessibility.queryAXTree(nodeId, role, name)` - Query AX tree

**Use Cases:**
- Accessibility testing
- Screen reader simulation
- ARIA attribute inspection
- AX tree analysis

---

## Network & Fetch Domains

### Network
**Purpose:** Monitor and control HTTP traffic

**Key Commands:**
- `Network.enable()` - Enable network tracking
- `Network.setCacheDisabled(cacheDisabled)` - Disable cache
- `Network.setExtraHTTPHeaders(headers)` - Add custom headers
- `Network.getCookies(urls)` - Get cookies
- `Network.setCookie(name, value, domain)` - Set cookie
- `Network.getResponseBody(requestId)` - Get response body
- `Network.emulateNetworkConditions(offline, latency, downloadThroughput, uploadThroughput)` - Throttle network

**Key Events:**
- `Network.requestWillBeSent` - Request starting
- `Network.responseReceived` - Response received
- `Network.loadingFinished` - Request completed
- `Network.loadingFailed` - Request failed

**Use Cases:**
- Monitor API calls
- Intercept requests
- Analyze response data
- Simulate slow networks
- Manage cookies

---

### Fetch
**Purpose:** Intercept and modify network requests

**Key Commands:**
- `Fetch.enable(patterns)` - Enable request interception
- `Fetch.continueRequest(requestId, url, method, headers)` - Continue/modify request
- `Fetch.fulfillRequest(requestId, responseCode, headers, body)` - Mock response
- `Fetch.failRequest(requestId, errorReason)` - Fail request

**Key Events:**
- `Fetch.requestPaused` - Request intercepted

**Use Cases:**
- Mock API responses
- Block requests
- Modify request/response
- Test error scenarios

---

## Page & Navigation Domains

### Page
**Purpose:** Control page lifecycle and navigation

**Key Commands:**
- `Page.enable()` - Enable page domain
- `Page.navigate(url)` - Navigate to URL
- `Page.reload(ignoreCache)` - Reload page
- `Page.goBack()/goForward()` - Navigate history
- `Page.captureScreenshot(format, quality)` - Take screenshot
- `Page.printToPDF(landscape, displayHeaderFooter)` - Generate PDF
- `Page.getLayoutMetrics()` - Get page dimensions
- `Page.createIsolatedWorld(frameId)` - Create isolated context
- `Page.handleJavaScriptDialog(accept, promptText)` - Handle alerts/confirms

**Key Events:**
- `Page.loadEventFired` - Page loaded
- `Page.domContentEventFired` - DOM ready
- `Page.frameNavigated` - Frame navigated
- `Page.javascriptDialogOpening` - Alert/confirm shown

**Use Cases:**
- Navigate pages
- Capture screenshots
- Generate PDFs
- Handle popups
- Monitor page lifecycle

---

### Target
**Purpose:** Manage browser targets (tabs, workers, frames)

**Key Commands:**
- `Target.getTargets()` - List all targets
- `Target.createTarget(url)` - Open new tab
- `Target.closeTarget(targetId)` - Close tab
- `Target.attachToTarget(targetId)` - Attach debugger
- `Target.detachFromTarget(sessionId)` - Detach debugger
- `Target.setDiscoverTargets(discover)` - Auto-discover targets

**Key Events:**
- `Target.targetCreated` - New target created
- `Target.targetDestroyed` - Target closed
- `Target.targetInfoChanged` - Target updated

**Use Cases:**
- Multi-tab automation
- Service worker debugging
- Frame inspection
- Extension debugging

---

### Input
**Purpose:** Simulate user input

**Key Commands:**
- `Input.dispatchKeyEvent(type, key, code)` - Keyboard input
- `Input.dispatchMouseEvent(type, x, y, button)` - Mouse input
- `Input.dispatchTouchEvent(type, touchPoints)` - Touch input
- `Input.synthesizePinchGesture(x, y, scaleFactor)` - Pinch gesture
- `Input.synthesizeScrollGesture(x, y, xDistance, yDistance)` - Scroll

**Use Cases:**
- Simulate clicks
- Type text
- Drag and drop
- Touch gestures
- Scroll pages

---

## Storage & Data Domains

### Storage
**Purpose:** Manage browser storage

**Key Commands:**
- `Storage.getCookies(browserContextId)` - Get cookies
- `Storage.setCookies(cookies)` - Set cookies
- `Storage.clearCookies(browserContextId)` - Clear cookies
- `Storage.clearDataForOrigin(origin, storageTypes)` - Clear storage
- `Storage.getUsageAndQuota(origin)` - Get storage usage

**Storage Types:**
- appcache, cookies, file_systems, indexeddb, local_storage, shader_cache, websql, service_workers, cache_storage

**Use Cases:**
- Cookie management
- Clear browser data
- Inspect storage usage
- Test quota limits

---

### DOMStorage
**Purpose:** Access localStorage/sessionStorage

**Key Commands:**
- `DOMStorage.enable()` - Enable storage tracking
- `DOMStorage.getDOMStorageItems(storageId)` - Get items
- `DOMStorage.setDOMStorageItem(storageId, key, value)` - Set item
- `DOMStorage.removeDOMStorageItem(storageId, key)` - Remove item

**Key Events:**
- `DOMStorage.domStorageItemsCleared` - Storage cleared
- `DOMStorage.domStorageItemAdded/Updated/Removed` - Item changed

---

### IndexedDB
**Purpose:** Query IndexedDB databases

**Key Commands:**
- `IndexedDB.requestDatabaseNames(securityOrigin)` - List databases
- `IndexedDB.requestDatabase(securityOrigin, databaseName)` - Get DB structure
- `IndexedDB.requestData(securityOrigin, databaseName, objectStoreName)` - Query data

**Use Cases:**
- Inspect IndexedDB data
- Debug database issues
- Extract stored data

---

### CacheStorage
**Purpose:** Manage Cache API

**Key Commands:**
- `CacheStorage.requestCacheNames(securityOrigin)` - List caches
- `CacheStorage.requestCachedResponses(cacheId, securityOrigin)` - List cached responses
- `CacheStorage.deleteCache(cacheId)` - Delete cache

**Use Cases:**
- Service worker cache inspection
- Offline functionality testing

---

## Performance & Profiling Domains

### Performance
**Purpose:** Collect performance metrics

**Key Commands:**
- `Performance.enable()` - Enable performance tracking
- `Performance.disable()` - Disable tracking
- `Performance.getMetrics()` - Get current metrics

**Metrics:**
- Timestamp, Documents, Frames, JSEventListeners, Nodes, LayoutCount, RecalcStyleCount, LayoutDuration, RecalcStyleDuration, ScriptDuration, TaskDuration, JSHeapUsedSize, JSHeapTotalSize

**Use Cases:**
- Monitor page metrics
- Track memory usage
- Measure render times

---

### PerformanceTimeline
**Purpose:** Access Performance Timeline API

**Key Commands:**
- `PerformanceTimeline.enable(eventTypes)` - Subscribe to events

**Event Types:**
- mark, measure, navigation, resource, longtask, paint, layout-shift

**Key Events:**
- `PerformanceTimeline.timelineEventAdded` - New performance entry

---

### Tracing
**Purpose:** Record Chrome trace

**Key Commands:**
- `Tracing.start(categories, options)` - Start recording
- `Tracing.end()` - Stop recording
- `Tracing.requestMemoryDump()` - Capture memory snapshot

**Trace Categories:**
- blink, cc, devtools, gpu, loading, navigation, rendering, v8, disabled-by-default-*

**Key Events:**
- `Tracing.dataCollected` - Trace chunk received
- `Tracing.tracingComplete` - Recording finished

**Use Cases:**
- Deep performance analysis
- Frame rendering profiling
- CPU flame graphs
- Memory profiling

---

### Profiler
**Purpose:** CPU profiling

**Key Commands:**
- `Profiler.enable()` - Enable profiler
- `Profiler.start()` - Start CPU profiling
- `Profiler.stop()` - Stop and get profile

**Use Cases:**
- Find CPU bottlenecks
- Optimize JavaScript
- Generate flame graphs

---

### HeapProfiler (via Memory domain)
**Purpose:** Memory profiling

**Key Commands:**
- `Memory.getDOMCounters()` - Get DOM object counts
- `Memory.prepareForLeakDetection()` - Prepare leak detection
- `Memory.forciblyPurgeJavaScriptMemory()` - Force GC
- `Memory.setPressureNotificationsSuppressed(suppressed)` - Control memory warnings
- `Memory.simulatePressureNotification(level)` - Simulate memory pressure

**Use Cases:**
- Detect memory leaks
- Analyze heap snapshots
- Monitor object counts

---

## Emulation & Simulation Domains

### Emulation
**Purpose:** Emulate device conditions

**Key Commands:**
- `Emulation.setDeviceMetricsOverride(width, height, deviceScaleFactor, mobile)` - Emulate device
- `Emulation.setGeolocationOverride(latitude, longitude, accuracy)` - Fake location
- `Emulation.setEmulatedMedia(media, features)` - Emulate media type
- `Emulation.setTimezoneOverride(timezoneId)` - Override timezone
- `Emulation.setLocaleOverride(locale)` - Override language
- `Emulation.setUserAgentOverride(userAgent)` - Change user agent

**Use Cases:**
- Mobile device testing
- Geolocation testing
- Print media emulation
- Timezone/locale testing

---

### DeviceOrientation
**Purpose:** Simulate device orientation

**Key Commands:**
- `DeviceOrientation.setDeviceOrientationOverride(alpha, beta, gamma)` - Set orientation

**Use Cases:**
- Test accelerometer features
- Orientation-dependent layouts

---

## Worker & Service Domains

### ServiceWorker
**Purpose:** Manage service workers

**Key Commands:**
- `ServiceWorker.enable()` - Enable tracking
- `ServiceWorker.unregister(scopeURL)` - Unregister worker
- `ServiceWorker.startWorker(scopeURL)` - Start worker
- `ServiceWorker.stopWorker(versionId)` - Stop worker
- `ServiceWorker.inspectWorker(versionId)` - Debug worker

**Key Events:**
- `ServiceWorker.workerRegistrationUpdated` - Registration changed
- `ServiceWorker.workerVersionUpdated` - Version updated

---

### WebAuthn
**Purpose:** Simulate WebAuthn/FIDO2

**Key Commands:**
- `WebAuthn.enable()` - Enable virtual authenticators
- `WebAuthn.addVirtualAuthenticator(options)` - Add virtual device
- `WebAuthn.removeVirtualAuthenticator(authenticatorId)` - Remove device
- `WebAuthn.addCredential(authenticatorId, credential)` - Add credential

**Use Cases:**
- Test WebAuthn flows
- Simulate biometric auth
- Test security keys

---

## Developer Tools Support

### Inspector
**Purpose:** Protocol-level debugging

**Key Events:**
- `Inspector.detached` - Debugger disconnected
- `Inspector.targetCrashed` - Target crashed

---

### Log
**Purpose:** Collect browser logs

**Key Commands:**
- `Log.enable()` - Enable log collection
- `Log.clear()` - Clear logs

**Key Events:**
- `Log.entryAdded` - New log entry

**Use Cases:**
- Collect console logs
- Monitor violations
- Track deprecations

---

### DOMDebugger
**Purpose:** DOM-level debugging

**Key Commands:**
- `DOMDebugger.setDOMBreakpoint(nodeId, type)` - Break on DOM changes
- `DOMDebugger.setEventListenerBreakpoint(eventName)` - Break on event
- `DOMDebugger.setXHRBreakpoint(url)` - Break on XHR

**Breakpoint Types:**
- subtree-modified, attribute-modified, node-removed

---

### DOMSnapshot
**Purpose:** Capture complete DOM snapshot

**Key Commands:**
- `DOMSnapshot.captureSnapshot(computedStyles)` - Capture full DOM

**Use Cases:**
- Export page structure
- Offline analysis
- DOM diffing

---

### Audits (Lighthouse Integration)
**Purpose:** Run automated audits

**Key Commands:**
- `Audits.enable()` - Enable audits
- `Audits.getEncodingIssues()` - Check encoding issues

---

### LayerTree
**Purpose:** Inspect rendering layers

**Key Commands:**
- `LayerTree.enable()` - Enable layer tracking
- `LayerTree.compositingReasons(layerId)` - Get why layer created

**Key Events:**
- `LayerTree.layerTreeDidChange` - Layers changed

**Use Cases:**
- Debug rendering performance
- Identify layer creation
- Optimize compositing

---

## Other Domains

### Browser
**Purpose:** Browser-level control

**Key Commands:**
- `Browser.getVersion()` - Get browser info
- `Browser.getBrowserCommandLine()` - Get launch args
- `Browser.setPermission(permission, setting, origin)` - Set permissions
- `Browser.grantPermissions(permissions, origin)` - Grant permissions

**Permissions:**
- geolocation, midi, notifications, push, camera, microphone, background-sync, sensors, accessibility-events, clipboard-read, clipboard-write, payment-handler

---

### IO
**Purpose:** File I/O operations

**Key Commands:**
- `IO.read(handle, offset, size)` - Read stream
- `IO.close(handle)` - Close stream

**Use Cases:**
- Read large response bodies
- Process binary data

---

### Media
**Purpose:** Inspect media players

**Key Commands:**
- `Media.enable()` - Track media players

**Key Events:**
- `Media.playerPropertiesChanged` - Player state changed
- `Media.playerEventsAdded` - Player events

---

### BackgroundService
**Purpose:** Track background services

**Key Commands:**
- `BackgroundService.startObserving(service)` - Track service

**Services:**
- backgroundFetch, backgroundSync, pushMessaging, notifications, paymentHandler, periodicBackgroundSync

---

## Domain Dependencies

Some domains depend on others and must be enabled in order:

```
Runtime (no dependencies)
  ↓
DOM (depends on Runtime)
  ↓
CSS (depends on DOM)

Network (no dependencies)

Page (depends on Runtime)
  ↓
Target (depends on Page)

Debugger (depends on Runtime)
```

## Quick Command Reference

### Most Common Commands

```javascript
// Navigation
Page.navigate(url)
Page.reload()

// JavaScript Execution
Runtime.evaluate(expression)

// DOM Access
DOM.getDocument()
DOM.querySelector(nodeId, selector)

// Screenshots
Page.captureScreenshot(format, quality)

// Network Monitoring
Network.enable()
// Listen for Network.requestWillBeSent events

// Console Messages
// Listen for Runtime.consoleAPICalled events

// Cookies
Network.getCookies(urls)
Network.setCookie(...)

// Device Emulation
Emulation.setDeviceMetricsOverride(width, height, ...)

// Performance
Performance.getMetrics()
Tracing.start(categories)
Tracing.end()
```

---

## Best Practices

1. **Enable domains before use:** Always call `.enable()` for stateful domains
2. **Handle events:** Subscribe to events for real-time updates
3. **Clean up:** Disable domains when done to reduce overhead
4. **Use sessions:** Attach to specific targets for isolated debugging
5. **Handle errors:** Implement proper error handling for command failures
6. **Version awareness:** Check browser version for experimental API support

---

## Additional Resources

- [Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/) - Interactive domain browser
- [Protocol JSON](https://chromedevtools.github.io/devtools-protocol/tot/json) - Machine-readable specification
- [Getting Started with CDP](https://github.com/aslushnikov/getting-started-with-cdp)
- [devtools-protocol NPM](https://www.npmjs.com/package/devtools-protocol) - TypeScript definitions
