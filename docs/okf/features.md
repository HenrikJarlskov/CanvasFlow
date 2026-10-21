# OKF Module 04: Features Technical Specification
## AIdboard — Interactive Collaborative Vector Whiteboard

This specification delivers a technical, functional, and algorithmic breakdown of all capabilities provided by **AIdboard**.

---

## 🎨 1. Infinite Vector Canvas & Rendering Architecture

### 1.1 Vector Coordinate System
AIdboard implements an infinite Cartesian plane represented via an SVG root viewport. Unlike raster canvas approaches that blur when scaled, all strokes, shapes, and icons are native vector objects that retain crisp fidelity at any zoom factor.

- **World Coordinates**: Floating-point values `(x, y)` defining element geometry independent of screen resolution.
- **Screen Viewport Transformation**:
  $$\text{screenX} = \text{worldX} \times \text{zoom} + \text{panX}$$
  $$\text{screenY} = \text{worldY} \times \text{zoom} + \text{panY}$$
- **Inverse Screen-to-Canvas Mapping**:
  $$\text{worldX} = \frac{\text{clientX} - \text{rect.left} - \text{panX}}{\text{zoom}}$$
  $$\text{worldY} = \frac{\text{clientY} - \text{rect.top} - \text{panY}}{\text{zoom}}$$
- **Zoom Extents**: Clamped between `0.2` (20% overview) and `3.5` (350% high-precision detail) with smooth exponential wheel scaling.

### 1.2 Multi-Layer Composition
The canvas is composed of five segregated rendering layers managed in `src/components/canvas/`:
1. **`CanvasBackground`**: SVG patterns for Dots, Line grid, Engineering Blueprint, Blank, and Dark canvas modes.
2. **`CanvasElementsLayer`**: Optimized SVG rendering of saved strokes, geometric shapes, editable text labels, and imported vector images.
3. **`CanvasPreviewsLayer`**: Real-time feedback for active drawing strokes, snapping preview silhouettes, and dashed marquee selection rectangles.
4. **`CanvasRemoteCursors`**: Real-time collaborator pointer arrows with custom user colors, name badges, and pulse beacons.
5. **`CanvasInlineTextEditor`**: Scaled absolute HTML textarea for inline typography editing.

### 1.3 Toolbar Workspace Grid Lines Control (Clean vs Grid-Assisted Workspace)
The primary floating toolbar provides a dedicated toggle control (`data-testid="toggle-grid"`, alias `toggle-grid-lines`) allowing users to switch dynamically between a clean workspace and a grid-assisted workspace:
- **Instant Workspace Toggling**: One-click switching between untextured clean canvas (`blank`) and structured alignment grid (`grid`).
- **Dynamic Badge Feedback**: Visual indicator badge (`data-testid="grid-status"`) displaying localized status (`ON` / `OFF`) in the user's active language.
- **Context Preservation**: Seamlessly restores prior grid texture settings and operates in full synchronization with the Header Background menu.
- **Accessibility**: Equipped with dynamic `aria-pressed`, `aria-label`, and contextual title tooltips.

---

## 📐 2. Intelligent Geometric Auto-Snap Engine

The auto-snap engine (`src/utils/shapeDetection.ts`) transforms raw hand-drawn pencil gestures into mathematical shapes in real-time.

### 2.1 Algorithmic Pipeline
1. **Point Preprocessing**: Raw pointer events are accumulated into an array of `Point { x, y, pressure }`.
2. **Polyline Simplification**: The **Ramer-Douglas-Peucker (RDP)** algorithm eliminates redundant collinear points:
   $$\epsilon = 4.0 \text{ px}$$
3. **Bounding Box & Aspect Ratio Analysis**: Calculates `width`, `height`, and bounding aspect ratio:
   $$\text{aspectRatio} = \frac{\min(w, h)}{\max(w, h)}$$
4. **Shape Classification**:
   - **Line**: Evaluates maximum deviation of all points from the chord connecting start to end. If maximum perpendicular deviation $< 0.1 \times \text{length}$, snaps to a straight vector line.
   - **Arrow**: Evaluates line straightness plus terminal hook geometry (backwards stroke direction change $> 120^\circ$). Snaps to a directional vector arrow with arrowhead geometry.
   - **Circle / Ellipse**: Checks stroke closure ($\text{dist}(\text{start}, \text{end}) < 0.25 \times \text{perimeter}$) and radial variance from center:
     $$\sigma_r = \sqrt{\frac{1}{N} \sum (r_i - \bar{r})^2}$$
     If radial variance $< 0.18$, snaps to a circle.
   - **Rectangle / Square**: Detects 4 dominant directional inflection corners. If corner count is 4 and angles are approximately $90^\circ \pm 20^\circ$, snaps to an aligned rectangle.
   - **Triangle**: Detects 3 dominant inflection points. Snaps to a 3-point closed polygon.

### 2.2 Non-Destructive Snapping
Auto-snapping is **opt-in** (disabled by default) and togglable via the floating toolbar. When enabled, a visual toast confirmation (`✨ Snapped to Circle!`) alerts the user without disrupting flow.

---

## 📥 3. Multi-Content Universal Import Hub

The Import hub (`src/components/ImportModal.tsx`) provides three content channels:

### 3.1 SAP Architecture Icons
Built directly from the official [SAP BTP Solution Diagrams Guidelines](https://sap.github.io/btp-solution-diagrams/docs/btp_guideline/diagr_comp/icons/):
- **Domain Categories**: Integration, Database & Analytics, AI, Security, DevOps, Infrastructure, Compute.
- **Embedded Icons**: SAP Integration Suite, Event Mesh, API Management, SAP HANA Cloud, SAP Datasphere, SAP Analytics Cloud, SAP AI Core, SAP AI Launchpad, Cloud Identity Services, Cloud Foundry Runtime, Kyma Runtime, Private Link, Destination Service, etc.
- **Search Engine**: Fuzzy keyword search across icon title, description, and category.
- **Size Selection**: 5 standardized architecture presets:
  - `S` (32px), `M` (48px), `L` (64px), `XL` (96px), `XXL` (128px).
- **Placement**: Automatically calculates the center of the current canvas viewport and places the vector icon as a selectable `image` element.

### 3.2 Draw.io / Diagrams.net Format Parser (`src/utils/drawioParser.ts`)
- **`<mxlibrary>` Collections**: Decodes embedded JSON arrays containing encoded shapes and SVGs.
- **`<mxfile>` and `<mxGraphModel>`**: Parses standard XML document structures and extracts `<mxCell>` vertices.
- **Style String Decoder**: Translates draw.io styling rules:
  - `fillColor`, `strokeColor`, `strokeWidth`, `rounded`, `opacity`.
  - Geometric primitives: `shape=ellipse` $\to$ circle, `shape=triangle` $\to$ triangle, `shape=flexArrow` $\to$ arrow.
- **One-Click Demo**: Includes the `SAMPLE_SAP_DRAWIO_LIBRARY` for instant demonstration and verification.

### 3.3 Miro-Style Image Import
- **File Upload**: Native file input supporting PNG, JPEG, SVG, WebP, GIF.
- **Drag-and-Drop**: Drop files anywhere on the canvas with automatic cursor coordinate translation.
- **Clipboard Paste**: Listeners for `Ctrl+V` / `Cmd+V` detect clipboard image blobs and instantiate canvas elements immediately.

---

## 👥 4. Real-Time Collaboration & Remote Cursor Tracking

### 4.1 WebSocket Architecture
The collaboration server (`server.ts`) runs on a shared HTTP server port, managing room channels and real-time state broadcasts.

- **Join Handshake**: `join_room` message assigns client metadata (`userId`, `userName`, `userColor`).
- **State Synchronization**: Server sends the full board snapshot (`room_state`) upon joining, followed by incremental operational deltas.
- **Sub-40ms Cursor Sync**:
  - The local pointer movement hook invokes `onCursorMove(worldX, worldY)`.
  - The client throttles transmissions to 40ms batches (`~25 Hz`).
  - Remote clients receive `user_cursor` and update user pointers without triggering expensive full-canvas rerenders.

### 4.2 Collaborator Cursor Rendering
- Rendered via `CanvasRemoteCursors.tsx` with hardware-accelerated CSS `transform`.
- Features an SVG arrow pointer with drop shadow, user nameplate badge, and a pulsing live beacon.
- Transforms seamlessly under pan and zoom operations.

---

## 🔍 5. Dual-Engine OCR Recognition

1. **Client-Side Tesseract.js**:
   - Dynamically lazy-loaded (`await import('tesseract.js')`) only upon initiation, conserving bundle size.
   - Extracts handwriting and text directly in the browser with zero cloud dependencies.
2. **Server-Side Gemini Vision AI**:
   - Encodes selected canvas elements or imported diagrams into PNG buffers and passes them to `gemini-3.8-flash` with vision prompts.
   - Returns structured JSON containing recognized text, confidence scores, and bounding boxes.
3. **Canvas Integration**:
   - **Replace Drawing**: Deletes strokes and inserts an editable vector `text` element in their exact bounding box.
   - **Insert Beside**: Places recognized text adjacent to the drawing to preserve original annotations.

---

## 🤖 6. AI Whiteboard Artist (Gemini Flash)

- **Natural Language Canvas Generation**: Prompts like *"Create a 3-tier microservices architecture on SAP BTP"* generate interconnected vector elements (rectangles, containers, arrows, text labels).
- **Progress Orchestration**: Multi-stage progress indicators (`Connecting` $\to$ `Synthesizing vector geometry` $\to$ `Assembling shapes & colors`).
- **Resilience**: Integrated 503 high-demand handling, automatic backoff, and instant user cancelation.

---

## 📱 7. Responsive Mobile & Tablet Layouts

- **Mobile Portrait (320px – 480px)**: Bottom floating action bar with scrollable tools and 44x44px touch targets; header collapses into an accessible slide-over drawer (`MobileHeaderDrawer.tsx`).
- **Mobile Landscape (844x390)**: Slim top dock preserving maximum vertical drawing space.
- **Tablet (768px – 1024px)**: Hybrid desktop/mobile layout with quick single-tap access.
- **Multi-Touch Gestures**: Dedicated gesture rejection engine (`useTouchGestures.ts`) supporting 2-finger pinch-to-zoom and pan without accidental pencil strokes.

---

## 🌍 8. Multi-Language Internationalization (i18n) Engine

AIdboard implements an enterprise-grade client-side localization system powered by **i18next** and **react-i18next** (`src/i18n/`):

### 8.1 Supported Languages & Locale Dictionaries
- 🇬🇧 **English (`en`)**: Default international base locale.
- 🇫🇷 **Français (`fr`)**: Full French translation.
- 🇩🇪 **Deutsch (`de`)**: Full German translation.
- 🇩🇰 **Dansk (`da`)**: Full Danish translation.

### 8.2 Zero-Hardcoded-Text Architecture
Every user-facing textual label, button, tooltip, modal header, placeholder, hint, status badge, keyboard shortcut description, and error message is managed via translation keys:
- **Header & Navigation**: Board title editing, language switcher, background patterns, export formats, dark mode, board library, share trigger.
- **Primary Toolbar**: Tool tooltips, shape popovers, stroke thickness, color picker swatches, auto-snap toggle, and workspace grid lines toggle.
- **Canvas Overlays**: Inline text editor placeholder and shortcut hint, drop image overlays, and dynamic shape detection toasts (`✨ Snapped to Circle!`).
- **Selection Toolbar**: Floating action toolbar for OCR extraction, shape recoloring, duplicating, and deleting.
- **Modal Dialogs**: Universal Import hub (SAP icons & Draw.io parser), AI Whiteboard Artist modal, OCR Vision recognition, Live Collaboration & Share modal, Boards manager, and Keyboard Shortcuts / Help modal.

### 8.3 Automated Key Parity Verification
Automated test suite (`src/test/i18n.test.ts`) recursively inspects all locale dictionaries to guarantee 100% key parity (295+ keys):
- Rejects missing keys, orphan keys, or schema mismatches across locales.
- Validates parameter interpolation (`{{count}}`, `{{shape}}`, `{{name}}`, `{{status}}`, `{{percent}}`) across all 4 languages.
- Verifies automatic fallback to English when unsupported language codes are requested.

---

## ⚡ 9. High-Performance Caching, Spatial Indexing & Asynchronous Architecture

To maximize perceived speed, eliminate main-thread event loop stutter, and adhere to strict single-responsibility principles, AIdboard incorporates an enterprise multi-tier caching and spatial indexing subsystem:

### 9.1 Adaptive LRU Shape Detection Cache & Non-Blocking Classifier
- **In-Memory Cache (ARC)**: Bounded 256-entry LRU Map in `src/utils/shapeDetection.ts`.
- **Geometric Fingerprint Generation**: Transforms stroke point trajectories into invariant spatial hash keys (`${count}_${start}_${quarter}_${mid}_${threeQuarter}_${end}_${len}`), yielding instantaneous cache lookup ($O(1)$) on repeated or redrawn strokes.
- **Asynchronous Execution (`detectShapeAsync`)**: Uses `queueMicrotask` to yield thread execution to browser rendering frames. Prevents long-running geometric regressions from causing UI frame drops during high-speed drawing.
- **Real-Time Telemetry**: Exposes `getShapeDetectionCacheStats()` (`hits`, `misses`, `size`) for automated CI testing and empirical verification.

### 9.2 Spatial Bounding Box Cache & Viewport AABB Fast-Rejection
- **Spatial Bounds Memoization (`spatialBoundsCache`)**: Caches calculated bounding extrema (`minX`, `minY`, `maxX`, `maxY`, `width`, `height`) keyed by `element.id` and `element.updatedAt`. Avoids re-computing $O(N)$ bounding boxes on static canvas elements.
- **$O(1)$ AABB Fast Rejection**: Pointer hit-testing (`isPointNearElement` in `src/utils/canvasGeometry.ts`) first checks if the test cursor point falls within the element's expanded Axis-Aligned Bounding Box (AABB):
  $$\text{point.x} < \text{minX} - \text{threshold} \lor \text{point.x} > \text{maxX} + \text{threshold}$$
  $$\text{point.y} < \text{minY} - \text{threshold} \lor \text{point.y} > \text{maxY} + \text{threshold}$$
  If the cursor is outside the AABB, the function returns `false` in $O(1)$ time, skipping point-by-point polyline distance loops entirely. This accelerates eraser and selection hit-testing by over **28x**.

### 9.3 Asynchronous Offscreen Image Preloading & Parallel Export
- **Export Asset Cache (`imageCache`)**: Offscreen canvas export in `src/utils/export.ts` pre-fetches and decodes all raster and SVG images in parallel using `preloadBoardImages()`.
- **Zero Canvas Dropouts**: Unlike synchronous exports that fail or drop unrendered image elements, `renderBoardToCanvasAsync()` ensures all external assets are decoded into memory prior to drawing, achieving sub-4ms canvas generation.
- **Shared Path Geometry**: Reuses `renderPointsToSvgPath` as the single canonical source of truth for stroke rendering across both canvas and SVG export.

### 9.4 Centralized Element Duplication & Geometry Reuse
- **Canonical Duplication Routine (`duplicateElements`)**: Centralized in `src/utils/canvasGeometry.ts`. Uses native `structuredClone` for deep copying, assigns fresh cryptographically random IDs, shifts world coordinates by an offset, and resets timestamps.
- **Deduplication**: Replaces fragmented duplicate implementations across `App.tsx` and keyboard shortcut handlers.

### 9.5 Clean Domain Orchestration & Modular View Separation
- **`useBoardOrchestration` Hook (`src/hooks/useBoardOrchestration.ts`)**: Encapsulates board naming, URL room synchronization, JSON import/export, and image file loading. Drops `src/App.tsx` from 468 lines down to a clean coordinator.
- **`WhiteboardNotifications` Component (`src/components/WhiteboardNotifications.tsx`)**: Decouples snap toasts and AI generation progress badges from the root component tree.

---

## 🛠️ 10. Toolbar Ergonomics, Popovers & Stacking Hierarchy (v2.8.0)

### 10.1 Reactive Shape Primitive Selector (`ShapesMenuPopover`)
- **Direct Interactive Switcher**: Replaces static tools with an intuitive shape picker button and dropdown popover (`data-testid="tool-shape"` and `data-testid="shapes-menu-popover"`).
- **Geometric Primitives**: Provides one-click activation for Rectangle, Circle, Diamond, Triangle, Star, and Arrow.
- **State Coupling**: Selecting any variant immediately sets `currentTool = 'shape'`, updates `selectedShape`, highlights the active shape icon, and cleanly closes the popover without event collisions.

### 10.2 Streamlined Color Picker Popover (`ColorPickerPopover`)
- **Single-Indicator Palette Button**: Deprecated the clumsy row of 5 fixed color circles directly on the toolbar, reclaiming over 160px of horizontal space.
- **Dynamic Active Preview**: A single rounded color swatch (`data-testid="active-color-swatch"`) displays the currently active stroke color with high-contrast ring styling.
- **Full-Spectrum & Quick Swatches**: Clicking the color indicator opens an interactive popover featuring:
  - Top curated quick-pick color swatches (`Dark #18181b`, `Blue #2563eb`, `Emerald #059669`, `Red #dc2626`, `Amber #d97706`, `Violet #7c3aed`, `Pink #db2777`).
  - Standard HTML5 native color input (`data-testid="custom-color-input"`) with real-time hex value display and validation.
- **Selection Synchronization**: Modifying the color in the toolbar automatically applies the selected color to all currently selected canvas elements in real-time.

### 10.3 Single-Icon Pen Stroke Width Selector (`StrokeWidthSelector`)
- **Adaptive Single-Icon Gauge**: Replaced static multi-button width selectors with a single dynamic pen thickness button displaying the current stroke width (`data-testid="tool-stroke-width"`).
- **Horizontal Stroke Bars**: The popover dropdown (`data-testid="stroke-width-menu"`) presents clear horizontal stroke weight bars rather than round dots (avoiding visual confusion with color swatches), labeled with localized size descriptions (Thin 2px, Medium 4px, Bold 8px, Extra 16px).

### 10.4 CSS Stacking Order Governance & Header Popover Clearance
- **Header Stacking Level**: The navigation `<header>` element is assigned `relative z-40`, creating an isolated stacking context higher than the floating toolbar.
- **Floating Toolbar Stacking Level**: The primary floating toolbar (`data-testid="primary-toolbar"`) is assigned `z-20` (fixed center viewport).
- **Unobstructed Dropdown Interactions**: All header menus (`BackgroundMenu`, `ExportMenu`, `LanguageMenu`, and `clear-confirm-dialog`) drop downwards unobstructed over the toolbar, eliminating all click-blocking or occlusion anomalies.
- **Modal Dominance**: Fullscreen modal dialogs (`ImportModal`, `AiDrawModal`, `BoardsModal`, `ShareModal`, `HelpModal`) and mobile slide-out drawers remain at `z-50`, with toast notifications at `z-[60]`.

### 10.5 Non-Empty Board "New" Confirmation Guard
- **Zero-Accidental-Loss Guard**: Prevents accidental data destruction when clicking "New" on an active whiteboard.
- **Empty Canvas Fast-Path**: If `elements.length === 0`, `onNewBoard()` is invoked immediately without confirmation.
- **Non-Empty Canvas Confirmation Modal**: If `elements.length > 0`, renders `new-board-confirm-dialog` presenting:
  - **Save & New**: Synchronously flushes the active board elements to IndexedDB, localStorage (`aidboard_saved_boards`), and the backend REST API before creating the new whiteboard.
  - **Discard**: Discards uncommitted board drawings from storage and navigates to the new whiteboard.
  - **Cancel**: Closes the dialog and retains the existing canvas state without loss.


