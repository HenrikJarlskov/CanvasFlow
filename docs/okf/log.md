# OKF Module 05: Operational Log & Architectural Decision Records (ADRs)
## AIdboard — Interactive Collaborative Vector Whiteboard

This document maintains the operational change log, release milestones, incident post-mortems, and formal Architectural Decision Records (ADRs) for **AIdboard**.

---

## 📜 1. Version Release History

### Release v2.9.0 — Google Login Board Isolation, Full 226 SAP Architecture Icons & AI Vector Precision
- **Google Authentication & Multi-Tenant Whiteboard Isolation**:
  - Integrated Firebase Authentication with Google Login provider, allowing users to securely sign in via Google.
  - Eliminated the global shared board exposure where any user could view and edit every other user's saved boards.
  - Whiteboard persistence now strictly scopes boards by `userId` matching `auth.currentUser.uid`.
  - Configured Cloud Firestore security rules guaranteeing read, write, and delete permissions strictly to the authenticating user.
  - Added unit and security test suites in `src/test/FirebaseAuthAndBoardIsolation.test.ts`.
- **Full SAP BTP Architecture Icons Library (226 Icons)**:
  - Harvested the complete 226-icon vector suite from official SAP BTP Solution Diagrams repositories (`src/utils/sapIconsAll.json`).
  - Categorized into 100 BTP Service Icons (Integration Suite, HANA Cloud, Event Mesh, API Management, etc.) and 126 Generic Architecture Icons (Actors, Cloud Connector, Enterprise Systems, Infrastructure).
  - Standardized all 226 icons to valid base64-encoded SVG data URIs (`data:image/svg+xml;base64,...`).
  - Updated `drawioParser.ts` style string tokenizer to preserve semicolons inside base64 data URIs.
  - Enhanced `CanvasElementsLayer.tsx` with dual `href` and `xlinkHref` fallbacks and aspect ratio preservation.
- **AI Whiteboard Artist & SAP Architecture Icon Integration**:
  - AI Whiteboard Artist schema updated to support `type: 'image'`, `iconKey`, and `src` attributes.
  - Added backend SAP vector icon cache in `server.ts` mapping 226 icons with alias keywords.
  - Implemented automatic server-side SAP architecture enricher that inspects generated diagram nodes and injects official SVG icons for Integration Suite (CPI), HANA Cloud, API Management, Cloud Identity Services, Event Mesh, Cloud Connector, and S/4HANA.
- **AI Drawing Assistant Geometric Precision (Kanban & Mindmaps)**:
  - Re-engineered Kanban board vector synthesis to produce 3 strictly aligned orthogonal lanes ("To Do", "In Progress", "Done") with distinct column bounding boxes, padded inner cards, and clean typography placement without overlapping lines or text collisions.
  - Re-engineered Mindmap vector synthesis to generate orthogonal radial trees with centered nodes, perimeter-docked branch connectors, and non-colliding geometric margins.
- **Smooth Monotonic AI Drawing Progress**:
  - Resolved progress bar oscillation where percentages jumped back and forth between 95% and 97% before completing.
  - Enforced strictly monotonic progression curves with bounded phase limits, ensuring smooth and realistic movement towards 100%.
- **Dark Mode High-Contrast Accessibility Hardening**:
  - Audited and updated Help feature guide tiles, OKF tabs, and modal surfaces with high-contrast text and border pairings (`dark:text-zinc-100`, `dark:bg-zinc-800`, `dark:border-zinc-700/80`).
  - Purged invalid Tailwind classes (`dark:bg-zinc-850`) that broke dark styling and caused white text on light backgrounds.
- **Automated Test Coverage**:
  - Expanded test suite to **43 test files and 278 automated passing tests** (>90% coverage), adding `FirebaseAuthAndBoardIsolation.test.ts` and `AiDrawingQuality.test.ts`.

### Release v2.8.1 — Infinite Drawing Space, Saved Boards Recency Sorting & Responsive Toolbar Overflow Menu
- **True Infinite Drawing Space Across Full 2D Viewport**:
  - Identified and eliminated SVG bounding box clipping on `<svg data-testid="whiteboard-svg">` by setting both `className="... overflow-visible"` and explicit `style={{ ..., overflow: 'visible' }}`.
  - Resolved the viewport constraint where panning away from the initial window origin prevented drawing or clipped vector strokes and shape previews outside the initial screen rectangle. The drawing canvas now represents an unbounded infinite 2D plane in all directions with continuous panning and pinch-to-zoom.
- **Saved Boards Sorting by Change Date (Latest Changed at Top)**:
  - Updated `BoardsModal` to sort boards descending by timestamp (`(b.updatedAt || 0) - (a.updatedAt || 0)`), ensuring the most recently edited boards always appear first.
  - Hardened `useBoardStorage` (`loadSavedBoards` and `executeSave`) to keep the persisted metadata array sorted by recency in IndexedDB and LocalStorage.
- **Responsive Toolbar Overflow Menu for Reduced Window Widths**:
  - Addressed the issue where reducing window width clipped controls on the right side of the floating toolbar (Auto-Snap, Grid, Undo, Redo).
  - Maintained core drawing tools (Select, Pan, Pen, Highlighter, Eraser, Shapes, Text, Color Picker, Stroke Width) on the compact bar.
  - Desktop viewports (`lg+`) render all secondary controls inline (`hidden lg:flex`).
  - Reduced viewports and mobile devices seamlessly present an overflow menu button (`tool-overflow-menu`, `MoreHorizontal` icon).
  - Clicking the overflow button toggles an accessible popover (`toolbar-overflow-popover`) providing direct access to Grid toggle (`overflow-toggle-grid`), Shape Snap toggle (`overflow-toggle-auto-snap`), Undo (`overflow-btn-undo`), and Redo (`overflow-btn-redo`) with live status indicators.
- **Full Internationalization (i18n)**:
  - Added new localized translation strings (`moreTools`, `moreToolsTitle`, `quickSettings`) across all 4 supported languages (English, French, German, Danish) with 100% key parity.
- **Automated Test Coverage**:
  - Expanded test suites in `BoardsModal.test.tsx`, `Toolbar.test.tsx`, and `Canvas.test.tsx` verifying infinite SVG overflow visibility, recency sorting of saved boards, and responsive overflow interactions.

### Release v2.8.0 — Floating Toolbar Refactoring, Stacking Order Hardening & Header Dropdown Fixes
- **Header Dropdown Stacking Context & Z-Index Resolution**:
  - Elevated the main `<header>` container to `relative z-40`, ensuring all child popovers and dropdown menus (`BackgroundMenu`, `ExportMenu`, `LanguageMenu`, and `clear-confirm-dialog`) construct a stacking context that renders strictly above the floating canvas toolbar.
  - Positioned the primary floating drawing toolbar at `z-20` (above the interactive canvas `z-0` and beneath header menus), completely resolving the UI obstruction anomaly where header menus opened behind toolbar tool buttons.
  - Verified modal dialogs and drawers (`z-50`) and system notifications (`z-[60]`) continue to layer cleanly over both the header and toolbar.
- **Select Shape Menu Reactivity & Popover Fix**:
  - Hardened `ShapesMenuPopover` click interaction and state delegation, ensuring selecting any primitive (rectangle, circle, diamond, triangle, star, arrow) immediately activates the shape tool, updates the canvas active shape variant, and smoothly dismisses the popover.
- **Compact Color Picker & Custom Palette Overhaul**:
  - Deprecated the clumsy row of 5 fixed color swatches directly on the toolbar that made the bar unnecessarily long and rigid.
  - Implemented a unified single-button active color preview indicator (`ColorPickerPopover`) that opens an interactive popover with both curated quick-pick color swatches and standard full-spectrum RGB/Hex picker controls.
  - Integrated bidirectional color synchronization with selected canvas elements.
- **Single-Icon Pen Stroke Width Selector**:
  - Replaced the multi-button static thickness strip with a single responsive stroke width indicator button.
  - Clicking the indicator displays the thickness menu popover with clear horizontal stroke weight bars and numeric gauge labels, keeping the primary toolbar clean and focused.
- **Language Switcher Localization & Clarity**:
  - Standardized the language menu display in `LanguageMenu.tsx` to display full descriptive endonyms and names (e.g. "Dansk (Danish)", "English", "Français", "Deutsch") rather than cryptic 2-letter codes ("DA").
- **Non-Empty Whiteboard "New" Confirmation Guard (Save vs Discard)**:
  - Added safety guard when creating a new board: if the active whiteboard is empty (`elements.length === 0`), clicking "New" creates a fresh board immediately without prompting.
  - If the whiteboard contains drawings (`elements.length > 0`), opens an accessible confirmation modal dialog (`new-board-confirm-dialog`) with three clear options:
    - **Save & New**: Immediately flushes and persists the current board (name, elements, timestamp) to the user's permanent Boards library (`savedBoards`, IndexedDB, and REST API) before creating the new whiteboard.
    - **Discard**: Drops the uncommitted board from storage and transitions directly to a clean whiteboard.
    - **Cancel**: Dismisses the modal and remains on the active whiteboard without modification.
  - Implemented synchronously across desktop Header and touch Mobile Header Drawer with full i18n localization in English, French, German, and Danish.
- **UI Deduplication & Toolbar Cleanup**:
  - Removed duplicate "Import" and "AI Whiteboard Artist" action buttons from the drawing toolbar, leaving them logically organized in the top navigation header where global board actions belong.

### Release v2.7.0 — Performance, Multi-Tier Caching & Architecture Maintainability
- **Suggestion 1: Shape Detection Caching (LRU 256) & Async Non-Blocking Execution**:
  - Implemented bounded 256-slot LRU in-memory cache in `src/utils/shapeDetection.ts`.
  - Added spatial trajectory fingerprint generator (`generateStrokeFingerprint`) delivering sub-microsecond cache lookups on repeated or redrawn strokes.
  - Implemented `detectShapeAsync` with non-blocking microtask yielding, eliminating main-thread event loop stalls during intense drawing sessions.
  - Added cache observability metrics (`getShapeDetectionCacheStats`, `clearShapeDetectionCache`).
- **Suggestion 2: Offscreen Image Asset Caching & Parallel Preloading**:
  - Implemented `imageCache` in `src/utils/export.ts` with parallel asset preloading (`preloadBoardImages`).
  - Added `renderBoardToCanvasAsync` eliminating synchronous blocking and preventing unrendered image drops during high-res PNG/PDF export.
  - Consolidated SVG path conversion to use `renderPointsToSvgPath` from `canvasGeometry.ts` as the single source of truth.
- **Suggestion 3: Spatial Indexing & Viewport AABB Fast-Rejection**:
  - Implemented `spatialBoundsCache` memoizing element bounding boxes keyed by ID and timestamp.
  - Added $O(1)$ fast AABB pre-check in `isPointNearElement` before polyline distance scans, accelerating eraser and selection hit-testing by **28x**.
- **Suggestion 4: Centralized Element Duplication & Geometry Reuse**:
  - Extracted canonical `duplicateElements` into `src/utils/canvasGeometry.ts` utilizing native `structuredClone`.
  - Eliminated fragmented duplicated logic across `App.tsx` and keyboard shortcut dispatchers.
- **Suggestion 5: Modular Orchestration Hook & Notification Subcomponents**:
  - Extracted board identity, room routing, and file I/O into `useBoardOrchestration.ts`.
  - Extracted toast notifications and AI progress indicators into `WhiteboardNotifications.tsx`.
  - Decomposed `src/App.tsx` from 468 lines down to a concise top-level coordinator.
- **Expanded Test Coverage**: Added `src/test/PerformanceAndMaintainability.test.tsx` (14 tests), bringing the automated test suite to **40 test files and 257 passing tests** with 100% test pass rate.

### Release v2.6.1 — Responsive Viewport Optimization & Zero-Slider Discipline
- **Toolbar Viewport Adaptability**: Re-engineered the floating drawing toolbar layout to prevent unwanted horizontal scrollbars ("sliders") across laptops, tablets, and resized viewports. Dynamically hides redundant text labels below `xl` while preserving intuitive icon cues and dynamic status badges (`ON` / `OFF`), compacting the full toolbar into ~680px so all tools fit cleanly without horizontal scrolling on screens with available width.
- **Responsive Modal Expansion**: Upgraded `HelpModal`, `OkfViewer`, and `ImportModal` to fluid responsive widths (`max-w-[96vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl`), actively utilizing screen width on desktop and tablet displays rather than constraining content within a narrow 768px frame.
- **Adaptive Wrap for Sub-Navigation & Chips**: Transformed sub-navigation tabs in `OkfViewer`, keyboard shortcut categories in `HelpModal`, and icon filters in `ImportModal` to responsive `flex-wrap`, ensuring buttons wrap naturally and never generate an unwanted horizontal scroll slider.
- **Cross-Browser Scrollbar Suppression**: Hardened `.no-scrollbar` and `.scrollbar-none` styles with `!important` declarations across WebKit, Blink, Gecko, and Trident engines.

### Release v2.6.0 — Multi-Language Support (i18n) & Toolbar Grid Lines Control
- **Full Internationalization (i18n)**: Integrated `i18next` and `react-i18next` supporting 4 languages:
  - 🇬🇧 English (`en`) — Default
  - 🇫🇷 Français (`fr`) — French
  - 🇩🇪 Deutsch (`de`) — German
  - 🇩🇰 Dansk (`da`) — Danish
- **100% Zero-Hardcoded Text**: Extracted all user-facing strings into synchronized JSON dictionaries (295+ keys) covering Header, Navigation Drawer, Primary Toolbar, Quick Selection Overlays, Canvas Inline Text, Toasts, Import Hub, OCR, AI Artist, Collaboration, and Help/Shortcuts.
- **Header & Mobile Language Switchers**: Integrated desktop language selector dropdown in `Header.tsx` and interactive grid selector in `MobileHeaderDrawer.tsx` with country flag indicators.
- **Toolbar Background Grid Lines Toggle**: Added dedicated one-click control (`toggle-grid` / `toggle-grid-lines`) on the floating toolbar with localized status badges (`ON` / `OFF`) to toggle between clean workspace (`blank`) and grid-assisted workspace (`grid`/`dots`/`blueprint`/`dark`).
- **Expanded Test Suite**: Grew test coverage to 39 test suites and 243 automated passing tests, adding `src/test/i18n.test.ts` to ensure 100% key parity across all four locale dictionaries.

### Release v2.5.0 — Operational Knowledge Framework (OKF) Bundle
- **OKF Bundle Addition**: Added complete Operational Knowledge Framework documentation suite (`docs/okf/`) covering Master Index, Deployment & Security, Test Suite & Benchmarks, Technical Features, and ADRs.
- **Performance & Scalability Benchmark**: Executed automated benchmark suite testing HTTP latency (755.3 req/s, 18.4ms avg), shape snapping math (27,675 ops/s), Draw.io parsing (37,020 ops/s), and WebSocket concurrency (60 clients, 1.94ms broadcast latency).
- **In-App OKF Viewer**: Integrated direct access to the OKF documentation bundle inside the application navigation and help interface.

### Release v2.4.0 — Real-Time Collaborator Cursors & Collaboration Hardening
- **Live Multiplayer Cursors**: Implemented WebSocket cursor tracking broadcasting sub-40ms pointer coordinates across room participants.
- **Cursor Pointer UI**: Designed custom SVG cursor arrows with individual collaborator colors, username nameplates, and live pulse beacons.
- **Viewport Transformation**: Synchronized remote cursor rendering with canvas pan and zoom scale matrices.
- **End-to-End Test Suite**: Added `src/test/ImportAndCollab.e2e.test.tsx` testing the entire live collaborator cursor and import workflow.

### Release v2.3.0 — Multi-Content Universal Import Hub & SAP Architecture Icons
- **Import Hub**: Upgraded "Add Image" feature into a unified **Import** dialog accessible via Header, Toolbar, and Mobile Drawer.
- **SAP BTP Architecture Icons**: Integrated vector icon library following official [SAP BTP Solution Diagrams Guidelines](https://sap.github.io/btp-solution-diagrams/docs/btp_guideline/diagr_comp/icons/) across 7 categories with real-time keyword search and size presets.
- **Draw.io XML Parser**: Added native support for Diagrams.net (`<mxlibrary>`, `<mxfile>`, `<mxGraphModel>`) format with one-click sample loader.
- **Clipboard & Drag-and-Drop**: Maintained image pasting and direct file dropzone onto the canvas.

### Release v2.2.0 — Code Quality & `fallow.js` Architectural Refactor
- **Static Analysis Engine**: Developed `fallow.js` to detect duplicate geometric logic, orphaned exports, and monolithic files.
- **Single Responsibility Refactoring**: Decomposed large files into subcomponents under `src/components/canvas/`, `src/components/header/`, and `src/components/toolbar/`.
- **Canvas Geometry Centralization**: Unified vector math and bounding box routines into `src/utils/canvasGeometry.ts`.

### Release v2.1.0 — Responsive Mobile & Tablet Layouts
- **Adaptive Screen Layouts**: Tailored UI for Mobile Portrait (375x667 iPhone SE), Mobile Landscape (844x390), and Tablet (768x1024).
- **Mobile Header Drawer**: Accessible slide-over menu for small screens.
- **2-Finger Touch Gestures**: Multi-touch pinch-to-zoom and pan with gesture conflict prevention.

### Release v2.0.0 — Production Backend & Full-Stack Deployment
- **PostgreSQL Persistence**: Integrated Cloud SQL / PostgreSQL storage with Drizzle ORM.
- **Express + WebSocket Server**: Single-port multiplexed backend architecture (`server.ts`).
- **Dockerization**: Production multi-stage Dockerfile and Docker Compose stack.

### Release v1.0.0 — Initial MVP
- Infinite vector SVG canvas, freehand pen, highlighter, eraser, shapes, and color picker.

---

## 🏛️ 2. Architectural Decision Records (ADRs)

### ADR-001: SVG-based Vector Canvas vs HTML5 Canvas / WebGL
- **Status**: Accepted
- **Context**: Whiteboards can be implemented with HTML5 2D Canvas (raster pixel buffer), WebGL, or SVG DOM nodes.
- **Decision**: Adopt pure SVG DOM elements for canvas rendering.
- **Rationale**:
  - SVG elements are inherently resolution-independent (retina/4K zoom produces zero pixelation).
  - Individual SVG elements can be selected, animated, styled via Tailwind CSS, and interacted with using standard DOM event listeners.
  - Native DOM tree enables straightforward testing via Vitest and React Testing Library without complex canvas pixel mocking.

### ADR-002: Server-Authoritative WebSocket Room Broker vs P2P WebRTC DataChannels
- **Status**: Accepted
- **Context**: Real-time collaboration can be implemented via Peer-to-Peer WebRTC DataChannels or client-server WebSockets.
- **Decision**: Implement a centralized Express + WebSocket (`ws`) room broker.
- **Rationale**:
  - WebRTC requires complex STUN/TURN infrastructure that frequently fails in enterprise firewalls and corporate VPNs.
  - Centralized server enables instant room persistence, snapshot recovery, and access control.
  - Benchmark tests confirmed sub-2ms broadcast latencies, making server latency negligible.

### ADR-003: Sub-40ms Client-Side Pointer Throttling for Real-Time Cursors
- **Status**: Accepted
- **Context**: High-frequency mouse events trigger up to 120-240 events per second, which would overwhelm network bandwidth if transmitted raw.
- **Decision**: Throttle outbound cursor packets to 40ms intervals (~25 updates/second).
- **Rationale**:
  - 25 Hz cursor movement provides smooth visual tracking to human observers.
  - Reduces outbound WebSocket traffic by >80%, enabling seamless scaling to 60+ concurrent collaborators per room without frame drops.

### ADR-004: Dual-Engine OCR Strategy (Client Tesseract.js + Server Gemini AI)
- **Status**: Accepted
- **Context**: Users need OCR for handwriting and diagram annotations. Cloud AI has API quotas and costs, while local OCR runs client-side.
- **Decision**: Provide both engines: Tesseract.js (free, offline, client-side) and Gemini Vision AI (cloud multimodal intelligence for complex handwriting).
- **Rationale**:
  - Tesseract.js is dynamically imported (`await import('tesseract.js')`) to prevent bundle bloat.
  - Gemini AI serves as a high-accuracy fallback when offline OCR confidence is insufficient.

### ADR-005: Client-Side Draw.io XML Parsing
- **Status**: Accepted
- **Context**: Importing Draw.io diagrams could be handled server-side or client-side.
- **Decision**: Perform Draw.io XML parsing directly in the browser via regex and DOM parsing in `src/utils/drawioParser.ts`.
- **Rationale**:
  - Eliminates server roundtrips and allows offline diagram import.
  - Benchmark confirmed client parsing throughput of >37,000 documents/second, requiring less than 0.03ms per import.

### ADR-006: Client-Side i18next Multi-Language Architecture
- **Status**: Accepted
- **Context**: Global enterprise architectural teams operate across multiple geographies, requiring full interface localization in English, French, German, and Danish without performance regressions.
- **Decision**: Adopt `i18next` and `react-i18next` with bundled TypeScript locale definitions (`src/i18n/locales/en.ts`, `fr.ts`, `de.ts`, `da.ts`).
- **Rationale**:
  - Bundled strongly-typed locale objects eliminate asynchronous HTTP network requests for translation JSONs on initial page render.
  - Eliminates UI flash of untranslated text (FOUT).
  - Enforced via CI test `src/test/i18n.test.ts` to ensure 100% synchronized key parity.

### ADR-007: Toolbar Grid Toggle UX State Pattern
- **Status**: Accepted
- **Context**: Architects frequently switch between diagram precision drawing (assisted by grid lines) and clean presentations/readability (uncluttered blank background). Navigating through the Header background menu disrupts drawing flow.
- **Decision**: Provide a dedicated one-touch toggle control (`toggle-grid` / `toggle-grid-lines`) on the primary floating toolbar.
- **Rationale**:
  - Toggles between `blank` and the user's active/last-used grid texture (`grid`, `dots`, `blueprint`, `dark`).
  - Preserves user texture preference without permanently overwriting it.
  - Accessible directly in the user's active drawing viewport with dynamic `ON` / `OFF` badges.

### ADR-008: Multi-Tiered In-Memory Caching & AABB Spatial Indexing
- **Status**: Accepted
- **Context**: Point hit-testing on complex polyline strokes, eraser drag operations, offscreen export rendering, and repetitive shape detection caused high CPU cycles and occasional main thread frame drops during rapid canvas sketching.
- **Decision**:
  1. Implement a 256-entry LRU shape detection cache indexed by spatial point trajectory hashes (`generateStrokeFingerprint`), accompanied by a non-blocking asynchronous classifier (`detectShapeAsync`).
  2. Implement an in-memory spatial bounding box cache (`spatialBoundsCache`) with $O(1)$ Axis-Aligned Bounding Box (AABB) fast-rejection before iterating individual stroke points in `isPointNearElement`.
  3. Preload all board images in parallel via `preloadBoardImages` and cache image DOM instances (`imageCache`) in `src/utils/export.ts` before triggering canvas rendering.
  4. Centralize element duplication via native `structuredClone` in `src/utils/canvasGeometry.ts`.
- **Rationale**:
  - Point hit-testing speedup exceeded 28x because over 90% of non-matching elements are rejected in $O(1)$ by the AABB pre-check.
  - Shape recognition for recurring strokes drops from 0.036ms down to sub-microsecond retrieval (0.0006ms), saving CPU cycles.
  - Offscreen export avoids broken image renders and executes in parallel in sub-4ms.
  - All caches include bounded capacity limits and automated cleanup hooks (`clearShapeDetectionCache`, `clearSpatialBoundsCache`, `clearImageCache`) preventing memory leaks.

### ADR-009: Stacking Context Hierarchy & Popover Z-Index Governance
- **Status**: Accepted
- **Context**: The whiteboard UI features multiple floating, positioned, and fixed overlays: the top navigation header bar (56px high), the floating primary drawing toolbar (fixed at `top-16 sm:top-18 left-1/2`), toolbar tool popovers (shapes, color palette, stroke width), header dropdowns (background grid menu, export format options, language selector, clear confirmation dialog), floating selection actions, and full-screen modal overlays (import hub, AI artist, boards manager, share). When header dropdowns were triggered, their menus visually opened behind the primary toolbar due to the toolbar's higher stacking context (`z-40` vs header `z-30`), rendering menu items unclickable.
- **Decision**: Establish an authoritative, project-wide CSS stacking hierarchy:
  1. **Base Interactive Canvas**: `z-0` (SVG elements layer, gestures layer, background patterns).
  2. **Canvas Selection & In-Canvas Transform Overlays**: `z-30` (selection bounding boxes, transform handles, inline text editor).
  3. **Primary Floating Drawing Toolbar**: `z-20` (fixed center viewport below header, tool popovers dropping downward into canvas area).
  4. **Top Navigation Header & Dropdown Popovers**: `relative z-40` (header background menus, export options, language selector, clear-board dialog drop downwards and float in front of the toolbar).
  5. **Application Modal Dialogs & Mobile Slide-Out Drawers**: `fixed inset-0 z-50` (Import hub, AI artist, Share modal, Boards library, OCR modal, mobile drawer, dim backdrop overlays).
  6. **Ephemeral System Notifications & Toasts**: `z-[60]` (shape snapping feedback, connection toasts).
- **Rationale**:
  - Eliminates visual overlap clipping where header dropdowns open behind the drawing toolbar.
  - Keeps toolbar popovers visible above canvas elements.
  - Ensures modal dialogs and alert dialogs maintain complete dominance over all underlying controls.

### ADR-010: AI Whiteboard Vector Illustration Prompting & Model Failover Architecture
- **Status**: Accepted
- **Context**: Users requesting creative illustrations received generic flowchart diagrams whenever the model timed out or failed to decompose characters into shapes.
- **Decision**: Adopt composite vector prompt directives, hierarchical model failover (`gemini-3.1-flash-lite` -> `gemini-3.8-flash`), and semantic procedural fallback templates.
- **Rationale**: Guarantees rich, modern whiteboard graphics and 100% uptime with zero freezes.

### ADR-011: Firebase User Authentication & Per-User Multi-Tenant Board Isolation
- **Status**: Accepted
- **Context**: Whiteboards were historically saved to a shared central store, allowing any user to view, edit, or delete any other user's whiteboards.
- **Decision**:
  1. Integrate Firebase Authentication with Google Login provider (`src/firebase.ts`, `AuthContext.tsx`, `AuthButton.tsx`).
  2. Require board documents to record immutable `userId: auth.currentUser.uid`.
  3. Restrict board queries to `where('userId', '==', user.uid)`.
  4. Enforce Cloud Firestore security rules granting read, write, and delete permissions only to the owner matching `request.auth.uid`.
  5. Partition offline local storage per user (`aidboard_boards_${userId}`).
- **Rationale**:
  - Delivers complete privacy and security isolation for personal and enterprise whiteboards.
  - Seamless one-click Google Login UX with persistent session recovery.
  - Validated with automated unit and security tests in `src/test/FirebaseAuthAndBoardIsolation.test.ts`.

### ADR-012: Official SAP BTP Vector Icon Integration & AI Auto-Enrichment Pipeline
- **Status**: Accepted
- **Context**: Architects designing SAP enterprise solutions needed official SAP BTP architecture icons both in the import hub and directly within AI-synthesized architecture diagrams, ensuring brand and architectural consistency.
- **Decision**:
  1. Harvest the complete 226-icon library from the official SAP BTP Solution Diagrams repository (`src/utils/sapIconsAll.json`).
  2. Reformat all 226 SVGs to standard base64 data URIs (`data:image/svg+xml;base64,...`), preventing XML entity escaping collisions and browser image decoding drops.
  3. Update `drawioParser.ts` style string parsing to preserve semicolons inside base64 data URIs.
  4. Extend Gemini AI diagram JSON schema with `type: 'image'`, `iconKey`, and `src` attributes.
  5. Implement backend SAP architecture enricher in `server.ts` that matches component names (Integration Suite, HANA Cloud, API Management, Cloud Identity, Event Mesh, Cloud Connector, S/4HANA) and embeds the official SVG vector icon directly into generated diagram cards.
- **Rationale**:
  - Ensures visual fidelity matching official SAP Solution Diagrams guidelines.
  - Whiteboard users can import from 226 icons or ask the AI assistant to draw SAP architectures and receive official icons automatically.

---

## 🔍 3. Incident Post-Mortems & Resolved Anomalies

### Incident INC-2026-10-28-A: AI Whiteboard Artist Progress Oscillation Between 95% and 97%
- **Summary**: When generating AI diagrams, the progress percentage counter repeatedly fluctuated back and forth between 95% and 97% before abruptly completing.
- **Root Cause**: Two competing asynchronous progress streams were updating the progress state simultaneously: an interval timer on the client that ticked up to 95%, and simulated progress events from the server stream that repeatedly reported values around 97%, 95%, and 96% due to non-monotonic progress calculations during the final shape validation phase.
- **Resolution**: Implemented strictly monotonic progress calculation `Math.max(prevProgress, nextProgress)` in `AiDrawModal.tsx` and bounded progress phases on the backend, guaranteeing the percentage moves strictly forwards towards 100%.

### Incident INC-2026-10-28-B: Corrupted SVG Preview Icons in Import Dialog and Blank Canvas Selections
- **Summary**: In the Import dialog, SAP architecture icons rendered with broken image placeholders, and adding them to the board created blank selection boxes.
- **Root Cause**:
  1. The raw JSON icon dataset contained percent-encoded SVGs with bare XML markup that failed browser `<img>` decoding when rendered in Vite/React.
  2. The Draw.io XML parser split style strings on semicolons (`style.split(';')`), which severed base64 data URIs at the embedded `;base64,` boundary.
  3. `CanvasElementsLayer.tsx` used only `xlinkHref` without modern SVG2 `href` fallback.
- **Resolution**:
  1. Standardized all 226 icons to valid `data:image/svg+xml;base64,...` payloads.
  2. Updated `parseStyleString` in `drawioParser.ts` with regex that protects semicolons inside data URIs.
  3. Updated `CanvasElementsLayer.tsx` with dual `href` and `xlinkHref` attributes and `preserveAspectRatio="xMidYMid meet"`. Added automated unit tests in `AiDrawingQuality.test.ts`.

### Incident INC-2026-10-23-B: Low Contrast on Help Feature Tiles in Dark Mode
- **Summary**: In dark mode, HelpModal feature guide tiles rendered with white-on-light-grey text, making them illegible until hovered.
- **Root Cause**: The tile container applied `dark:bg-zinc-850/70`, which is not a valid Tailwind color step (Tailwind provides zinc-800, zinc-900, etc., but not 850). Consequently, the dark background class was ignored by the CSS compiler, causing the tile to fall back to the light-mode `bg-slate-50/70` surface while text styling activated dark-mode white/light-grey text (`dark:text-zinc-100` and `dark:text-zinc-200`). When hovered, `dark:hover:bg-zinc-800` was valid, making the tile readable only on hover.
- **Resolution**: Replaced invalid `dark:bg-zinc-850/70` with valid `dark:bg-zinc-800` (hover `dark:hover:bg-zinc-700/80`), `dark:border-zinc-700/80` (hover `dark:hover:border-zinc-600`), and enhanced text contrast with `dark:text-zinc-100` for titles and `dark:text-zinc-300` for descriptions. Audited and corrected other invalid 50-step zinc classes across `BoardsModal`, `ShareModal`, and `OkfViewer`. Added automated regression test in `src/test/HelpModal.test.tsx`.

### Incident INC-2026-10-23: Generic Flowchart Returned for "Cute AI Robot" Drawing Prompt
- **Summary**: Requesting the AI Whiteboard Artist to draw "cute AI robot smiling with speech bubbles" produced a generic "Step 1 -> Step 2 -> Step 3" flowchart instead of any robot or speech bubbles.
- **Root Cause**:
  1. The API request in `server.ts` had an overly short 5,000ms timeout that aborted Gemini during model demand spikes, silently triggering the catch block.
  2. The procedural fallback generator only matched `login`, `architecture`, `kanban`, and `mind map`, falling back to `Step 1 -> Step 2 -> Step 3` for any other prompt.
  3. The system prompt and response schema lacked character decomposition guidance (head, eyes, smile, limbs, speech bubbles, color fills).
- **Resolution**:
  1. Overhauled the system instruction and prompt template with clear decomposition guidelines for characters, robots, smiling expressions, speech bubbles, and pastel color palettes.
  2. Integrated `gemini-3.1-flash-lite` with a 12-second timeout and fallback to `gemini-3.8-flash`.
  3. Added a dedicated 24-element vector robot procedural template with antenna, smiling face, chest screen, waving arm, and speech bubble ("Hello human! Beep boop! ✨").
  4. Added element sanitization for flexible schema properties.

### Incident INC-2026-10-21: Header Dropdown Menus Obstructed Behind Floating Drawing Toolbar
- **Summary**: Clicking header action dropdowns (Background grid texture selector, Export format menu, Language options, Clear board confirmation dialog) opened the options list behind the floating drawing toolbar, preventing users from selecting menu items.
- **Root Cause**: The `<header>` element was configured with `z-30` while the `<Toolbar>` element had `fixed ... z-40`. Because `<header>` had a lower stacking level than the toolbar, all child absolute popovers (`z-50` within the header context) were constrained to the header's effective stacking layer of 30, causing them to render visually beneath the toolbar at layer 40.
- **Resolution**: Updated `<header>` to `relative z-40` and the primary floating toolbar to `z-20`. Verified that header dropdowns now open smoothly in front of the toolbar, fully interactive on all desktop, tablet, and mobile viewports.

### Incident INC-2026-10-09: Regex Backtracking on Self-Closing `<mxCell/>` Tags
- **Summary**: When parsing `<mxGraphModel>` containing self-closing cells (`<mxCell id="0"/>`), greedy regex matching combined self-closing tags with subsequent cells, dropping geometric vertices from parsed output.
- **Root Cause**: `/<mxCell\s+([^>]+)(?:\/>|>([\s\S]*?)<\/mxCell>)/gi` matched `id="0"/` within `[^>]+`, skipping `\/>` and capturing subsequent tags until `</mxCell>`.
- **Resolution**: Updated pattern to `/<mxCell\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/mxCell>)/gi`. Added automated test cases in `src/test/drawioParser.test.ts`.

### Incident INC-2026-10-08: Gemini API 503 High-Demand Spikes
- **Summary**: Spikes in AI Whiteboard Artist requests occasionally returned HTTP 503 `UNAVAILABLE` during peak model hours.
- **Resolution**: Added structured 503 detection in `server.ts` with friendly user notification (`"The AI model is currently experiencing high demand. Please try again in a few moments."`), automatic retry flags, and non-blocking client toast notifications.
