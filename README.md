# AIdboard — Interactive Collaborative Vector Whiteboard

AIdboard is an interactive, high-performance vector whiteboard web application built with React, Vite, TypeScript, Tailwind CSS, Express, WebSockets, PostgreSQL (Cloud SQL / Docker), and Google Gemini AI.

---

## 📚 Operational Knowledge Framework (OKF) Bundle

A comprehensive **Operational Knowledge Framework (OKF)** bundle is available in the [`docs/okf/`](docs/okf/index.md) directory:

- 📑 **[OKF Master Index & System Topology](docs/okf/index.md)**: Full bundle manifest, architecture topology diagram, stakeholder matrix, and core system quick-reference.
- 🚀 **[Deployment, Prerequisites & Security](docs/okf/deployment.md)**: Hardware/software prerequisites, deployment options (Docker Compose, Cloud Run, Kubernetes, Linux systemd), CSP/CORS hardening, WebSocket rate-limiting, and operational runbooks.
- 🧪 **[Test Suite, Performance & Scalability Benchmark](docs/okf/testing.md)**: Complete test suite documentation (40 suites, 257 tests, >90% coverage) plus empirical HTTP latency benchmarks (755 req/s, 18.4ms avg), shape snapping throughput (27,675 ops/s), multi-tier caching benchmarks (sub-microsecond LRU hits, 28x AABB hit-test speedup), and real-time WebSocket scalability stress tests (60+ concurrent clients, <3ms broadcast latency).
- 🎨 **[Technical Features Specification](docs/okf/features.md)**: Detailed technical specifications for the infinite vector canvas, toolbar workspace grid toggle, multi-language internationalization (i18n), multi-tier in-memory ARC caching, auto-snap algorithms, multi-content Import hub (SAP BTP architecture icons, Draw.io format parser, Miro-style images), real-time collaborator cursors, dual-engine OCR, and responsive mobile/tablet layouts.
- 📜 **[Operational Log & Architectural Decision Records (ADRs)](docs/okf/log.md)**: Release milestones (v1.0.0 through v2.7.0), formal ADRs (ADR-001 through ADR-008), and incident post-mortems.

### Key References & Conceptual Standards
- **SAP Architecture Icons**: Implemented in compliance with the [SAP BTP Solution Diagrams Component Guidelines](https://sap.github.io/btp-solution-diagrams/docs/btp_guideline/diagr_comp/icons/).
- **Draw.io / Diagrams.net Format**: Built on the [Draw.io Diagram XML & mxlibrary Specification](https://www.diagrams.net/doc/faq/xml-structure).
- **Internationalization (i18n)**: Implemented using [i18next](https://www.i18next.com/) with native support for English, French, German, and Danish.
- **W3C Scalable Vector Graphics (SVG)**: Grounded in the [W3C SVG 2.0 Recommendation](https://www.w3.org/TR/SVG2/).
- **WebSocket Protocol**: Conforms to [IETF RFC 6455](https://datatracker.ietf.org/doc/html/rfc6455).

## 🌟 Key Features

### 1. Vector Drawing, Balanced Shape Snapping & Multi-Touch
- **Precision Drawing Tools**: Freehand pen, highlighter, eraser, text tool, and vector shapes.
- **Color Palette & Stroke Width**: 6 vibrant primary colors plus custom hex selection, adjustable brush thickness.
- **Intelligent Balanced Shape Snapping**:
  - Automatically recognizes hand-drawn circles, squares, rectangles, triangles, lines, and arrows.
  - Calibrated corner-distance thresholds ensure circles and squares/rectangles are never misclassified.
  - **Off by default**: Toggle shape snapping on or off from the floating toolbar.
- **Background Grid Lines Toggle**: Quick one-click toggle in the primary toolbar allowing users to switch effortlessly between a clean workspace (`blank`) and a grid-assisted workspace (`grid`/`dots`/`blueprint`/`dark`).
- **Multiple Canvas Background Styles**: Blank, Dot grid, Line grid, Engineering Blueprint, and Dark canvas modes.
- **Native Multi-Touch Gestures**:
  - Two-finger pinch-to-zoom and two-finger canvas panning.
  - Multi-touch gesture rejection ensures two-finger gestures never leave accidental pencil or highlighter strokes.

### 2. Multi-Element Selection, Movement & Resizing
- **Drag-and-Drop Movement**: Select one or more elements with click or marquee selection and drag anywhere inside the selection box to reposition smoothly.
- **8-Point Interactive Resizing Handles**:
  - Drag corner (`nw`, `ne`, `se`, `sw`) or edge (`n`, `s`, `e`, `w`) handles to scale multiple selected shapes, strokes, images, and text labels simultaneously without numerical drift.
- **Selection Toolbar**: Quick access to duplicate (`Ctrl+D`), delete (`Delete`/`Backspace`), recolor, and OCR.
- **Robust Undo/Redo**: Full history snapshot stack with keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`) powered by `useWhiteboardHistory`.

### 3. Customizable Keyboard Shortcuts & In-App Help
- **In-App Help & Shortcut Guide**: Click the `?` Help icon in the top-right header to view feature explanations and interactive keybinding controls.
- **Configurable Shortcuts**: Rebind key combinations for tools (Pen, Eraser, Select, Text, Shapes), actions (Undo, Redo, Delete, Duplicate, Select All), and modals (AI Artist, Help, Export).
- **Persistent Preferences**: Shortcut modifications persist automatically in localStorage.

### 4. Multi-Content Import (Images, SAP Architecture Icons & Draw.io Libraries)
- **Universal "Import" Hub**: Upgraded from simple image addition to a full-featured content import hub accessible from the top navigation and toolbar:
  - **SAP Architecture Icons**:
    - Embedded comprehensive vector icon set from official [SAP BTP Solution Diagrams Guidelines](https://sap.github.io/btp-solution-diagrams/docs/btp_guideline/diagr_comp/icons/).
    - Searchable by name, service keyword, or domain category (Integration, Database & Analytics, AI, Security, DevOps, Infrastructure, Compute).
    - Customizable icon dimensions (S: 32px, M: 48px, L: 64px, XL: 96px, XXL: 128px) with instant canvas placement.
  - **Draw.io / Diagrams.net Format Parser**:
    - Supports importing icons and diagrams in Draw.io format, including `<mxlibrary>` collections, `<mxfile>`, `<mxGraphModel>`, embedded SVG data URIs, and vector geometries.
    - One-click "Load Sample SAP BTP Library" button for immediate demonstration.
    - Automatic translation of mxCell styles (`fillColor`, `strokeColor`, `strokeWidth`, `ellipse`, `triangle`, `flexArrow`, `text`) into native whiteboard vector elements.
  - **Miro-Style Image Import**:
    - Upload local images (PNG, JPEG, SVG, WebP, GIF).
    - Direct drag-and-drop of image files onto the canvas with automatic cursor positioning.
    - Direct clipboard image pasting (`Ctrl+V` / `Cmd+V`).
- **First-Class Vector Canvas Integration**: Imported images and icons are vector elements that support marquee selection, multi-element dragging, 8-point resizing handles, layer reordering, and export.

### 5. Mobile & Tablet Responsiveness
- **Adaptive Screen Layouts**:
  - **Mobile Portrait (320px – 480px)**: Floating bottom action bar with scrollable tools and 44x44px accessible touch targets; top navigation collapses into an accessible slide-over drawer.
  - **Mobile Landscape (844x390)**: Ultra-compact slim bar docked at the top to preserve maximum vertical canvas height for sketching.
  - **Tablet (768px – 1024px)**: Balanced hybrid layout providing quick single-tap access to all drawing tools, color swatches, and board controls.
- **Orientation Awareness**: Dynamically reacts to screen rotation and window resizing without losing canvas viewport coordinates or scroll position.

### 6. Dark Mode & High-Contrast Visuals
- **One-Click Theme Switcher**: Toggle between clean light mode and immersive dark mode via the header or mobile drawer.
- **Full Theme Coverage**: Configured with Tailwind CSS v4 custom variants (`@variant dark`) for instant styling across canvas, headers, toolbars, overlays, and modals.

### 7. AI Whiteboard Artist & Vision OCR (Gemini 3.8 Flash)
- **AI Whiteboard Artist**:
  - Request diagrams, workflows, mind maps, or wireframes in plain English.
  - Responsive multi-stage progress feedback (`Connecting` → `Synthesizing vector geometry` → `Assembling shapes & colors`).
  - Active canvas floating status indicator.
  - **High Demand (503) Handling & Resilient Timeouts**: Graceful error handling and instant cancelation during generation.
- **Dual-Engine OCR**:
  - **Tesseract.js**: Client-side handwriting and text recognition (dynamically lazy-loaded on demand).
  - **Gemini AI Vision**: Multimodal OCR for complex diagrams and handwriting.
  - Direct actions to replace stroke drawings with editable vector text or place text alongside drawings.

### 8. Real-Time Collaboration & Remote Cursor Tracking
- **Live Multiplayer Collaboration**: Multi-user drawing synchronization via WebSockets with instant state propagation and room isolation.
- **Collaborator Cursor Visualization**:
  - Live cursor tracking broadcasts other users' pointer locations across the whiteboard.
  - Each collaborator is assigned a unique identifiable color and username nameplate badge with active pulse indicator.
  - Automatically translates between canvas world coordinates and viewport zoom/pan transformations so remote cursors align accurately on all screen sizes.
- **PostgreSQL Database Storage**: Boards are stored and retrieved from PostgreSQL using Drizzle ORM, with automatic fallback for offline environments.
- **Export Options**: High-resolution PNG, vector SVG, and multi-page PDF (with lazy-loaded `jsPDF`).

### 9. Multi-Language Internationalization (i18n)
- **4 Fully Supported Languages**:
  - 🇬🇧 **English (`en`)** (Default)
  - 🇫🇷 **Français (`fr`)**
  - 🇩🇪 **Deutsch (`de`)**
  - 🇩🇰 **Dansk (`da`)**
- **100% Zero-Hardcoded Text**: Every single user-visible label, tooltip, placeholder, dialog heading, hint, toast, and error message is internationalized using `react-i18next`.
- **Live Language Switcher**:
  - Top navigation language dropdown menu in the desktop header.
  - Interactive grid switcher with country flags and active selection badges in the mobile drawer.
  - Automatic language detection (`i18next-browser-languagedetector`) with fallback to English.
- **295+ Synchronized Keys**: Perfect dictionary alignment across all locales, validated by automated CI tests (`src/test/i18n.test.ts`).

---

## 🧹 Code Quality, Maintenance & `fallow.js`

To maintain a clean codebase free of technical debt, AIdboard includes a custom static analysis engine: **`fallow.js`**.

### Running `fallow.js`

```bash
npm run fallow
```

### Analysis & Recommendations Implemented
`fallow.js` scans the repository for:
1. **Duplicate Code**: Identifies duplicated geometric math, SVG path conversions, bounding box queries, and hotkey listeners.
2. **Dead Code**: Detects unused exports, orphaned files, and unreferenced variables.
3. **Monolithic Complexity**: Flags oversized files (> 300 lines) and recommends decomposition into modular sub-components.

### 5 Actionable Maintainability & Perceived Speed Improvements Implemented
Following rigorous analysis with `fallow.js` and architectural benchmarking, 5 core maintainability and performance improvements were engineered:

1. **Shape Detection In-Memory LRU Cache & Async Non-Blocking Execution (`src/utils/shapeDetection.ts`)**:
   - Implemented a 256-slot LRU in-memory cache keyed by invariant stroke spatial hashes (`generateStrokeFingerprint`).
   - Added asynchronous, non-blocking shape detection (`detectShapeAsync`) yielding execution via `queueMicrotask` to eliminate long-running lockups during rapid sketching.
   - Accelerates repeated/redrawn shape recognition from 0.036ms to 0.0006ms (**16.5x – 125x faster**).

2. **Offscreen Image Asset Caching & Parallel Preloading (`src/utils/export.ts`)**:
   - Added in-memory image instance cache (`imageCache`) and parallel asynchronous preloader (`preloadBoardImages`).
   - Introduced `renderBoardToCanvasAsync` ensuring zero unrendered image dropouts and sub-4ms canvas generation.
   - Consolidated SVG path generation by importing `renderPointsToSvgPath` from `canvasGeometry.ts` as the single canonical source of truth.

3. **Spatial Indexing & Viewport AABB Fast-Rejection (`src/utils/canvasGeometry.ts`)**:
   - Implemented `spatialBoundsCache` memoizing element bounding boxes indexed by element ID and timestamp.
   - Introduced $O(1)$ Axis-Aligned Bounding Box (AABB) fast-rejection in `isPointNearElement` before polyline distance checks, accelerating eraser and selection hit-testing by **28x**.

4. **Centralized Element Duplication & Geometry Reuse (`src/utils/canvasGeometry.ts`)**:
   - Consolidated element duplication logic into `duplicateElements` using native `structuredClone`.
   - Generates cryptographically unique IDs, applies coordinate offsets, and resets timestamps, removing duplicated logic across `App.tsx` and hotkey handlers.

5. **Modular Domain Orchestration & Notification Subcomponents (`src/hooks/useBoardOrchestration.ts` & `src/components/WhiteboardNotifications.tsx`)**:
   - Extracted board lifecycle, room routing, JSON file import/export, and image loading into `useBoardOrchestration.ts`.
   - Extracted snap toasts and AI generation progress badges into `WhiteboardNotifications.tsx`.
   - Reduced `src/App.tsx` complexity from 468 lines down to a concise, maintainable coordinator.

### Refactored Architecture
Following the `fallow.js` guidelines, components are split into focused, single-responsibility units:
- **`src/utils/canvasGeometry.ts`**: Single source of truth for deep element cloning (`duplicateElements`), SVG path generation (`renderPointsToSvgPath`), spatial bounding box memoization (`getElementBounds`), and $O(1)$ AABB point hit-testing (`isPointNearElement`).
- **`src/utils/shapeDetection.ts` & `src/utils/shapeDetectionMath.ts`**: Modular polyline algorithms, RDP reduction, LRU caching, and async classification.
- **`src/components/WhiteboardNotifications.tsx`**: Modular toast and progress indicator display.
- **`src/hooks/useBoardOrchestration.ts`**: Domain hook orchestrating board lifecycle, room routing, and external I/O.
- **`src/components/header/`**:
  - `BoardTitleEditor.tsx`: Inline title renaming with keyboard triggers.
  - `LanguageMenu.tsx`: Live internationalization language switcher (EN, FR, DE, DA) for header & mobile drawer.
  - `ExportMenu.tsx`: Dropdown for PNG, SVG, and PDF exports.
  - `BackgroundMenu.tsx`: Canvas grid background switcher.
  - `MobileHeaderDrawer.tsx`: Slide-over menu for mobile portrait navigation.
- **`src/components/toolbar/`**:
  - `ColorPickerPopover.tsx`: Palette swatches and custom hex input.
  - `ShapesMenuPopover.tsx`: Shape selector (rectangle, circle, triangle, arrow, line).
  - `StrokeWidthSelector.tsx`: Brush thickness selector.
  - `ZoomControls.tsx`: Zoom in, zoom out, and reset controls.
- **`src/components/canvas/`**:
  - `CanvasBackground.tsx`: SVG background patterns (dots, lines, blueprint grid).
  - `CanvasElementsLayer.tsx`: Optimized SVG rendering of strokes, shapes, text, and images.
  - `CanvasPreviewsLayer.tsx`: Active drawing stroke preview, shape detection hints, and marquee selection box.
  - `CanvasRemoteCursors.tsx`: Live multiplayer cursor badges.
  - `CanvasInlineTextEditor.tsx`: Text editing textarea overlay.
- **`src/hooks/`**:
  - `useBoardOrchestration.ts`: Domain hook orchestrating board persistence, room routing, and external file I/O.
  - `useCanvasGestures.ts`: Pointer event state machine and drawing coordinator.
  - `useTouchGestures.ts`: Dedicated multi-touch gesture tracker for 2-finger pinch-to-zoom and pan.
  - `useWhiteboardHistory.ts`: Centralized undo/redo snapshot stack.
  - `useBoardStorage.ts`: PostgreSQL API synchronization and local storage fallback.
  - `useKeyboardShortcuts.ts`: Centralized hotkey listener with configurable shortcut bindings.
- **`src/components/WhiteboardModals.tsx`**: Centralized wrapper managing lazy-loaded modal dialogs (OCR, AI Artist, Boards, Share, Help).

---

## ⚡ Performance & Lighthouse Optimization

- **Dynamic Code-Splitting**:
  - `jsPDF` is loaded dynamically (`await import('jspdf')`) only when a user triggers PDF export.
  - `Tesseract.js` is loaded dynamically (`await import('tesseract.js')`) only when offline OCR is initiated.
  - Initial JavaScript bundle size is significantly reduced, yielding faster Time to Interactive (TTI).
- **Lighthouse Standards**:
  - Enhanced `index.html` with `viewport-fit=cover`, `theme-color`, meta descriptions, and apple touch tags.
  - Proper ARIA landmarks: `role="toolbar"`, `role="banner"`, `aria-label`, `aria-pressed`, `aria-expanded` across all buttons and menus.
  - High-contrast visual cues and accessible focus rings.

---

## 🏗️ Project Structure

```
aidboard/
├── fallow.js               # Static code quality, duplication & complexity analyzer
├── fallow-guidelines.json  # Generated audit report & architectural recommendations
├── src/
│   ├── components/         # React UI components
│   │   ├── canvas/         # Sub-components for background, elements, cursors & preview
│   │   ├── header/         # Sub-components for title editor, export menu & mobile drawer
│   │   ├── toolbar/        # Sub-components for colors, shapes, stroke width & zoom
│   │   ├── AiDrawModal.tsx      # AI Whiteboard Artist modal
│   │   ├── BoardsModal.tsx      # Whiteboard library manager
│   │   ├── Canvas.tsx           # SVG vector canvas root component
│   │   ├── Header.tsx           # Top navigation with responsive mobile menu
│   │   ├── HelpModal.tsx        # Keyboard shortcuts editor & app feature guide
│   │   ├── ImportModal.tsx      # Universal Import hub (Images, SAP Icons, Draw.io)
│   │   ├── OcrModal.tsx         # OCR recognition interface (Tesseract + Gemini)
│   │   ├── SelectionOverlay.tsx # 8-point resize handles & drag overlay
│   │   ├── ShareModal.tsx       # Live collaboration link sharing
│   │   ├── Toolbar.tsx          # Responsive floating drawing toolbar (with grid toggle)
│   │   ├── okf/                 # In-app Operational Knowledge Framework viewer
│   │   └── WhiteboardModals.tsx # Centralized modals manager
│   ├── hooks/              # Custom React hooks (gestures, touch, history, storage, hotkeys)
│   ├── i18n/               # i18next configuration and complete locale dictionaries (en, fr, de, da)
│   │   └── locales/        # English, French, German, Danish translation files
│   ├── utils/              # Geometry, drawioParser, sapIcons, export, OCR, shape detection, sockets
│   ├── test/               # 39 Vitest unit, component, and end-to-end test suites (243 tests)
│   ├── types/              # Whiteboard TypeScript interfaces
│   ├── App.tsx             # Root application orchestrator
│   └── main.tsx            # Application entry point
├── server.ts               # Express server, WebSocket broker & AI proxy
├── Dockerfile              # Production multi-stage container build
├── docker-compose.yml      # Self-contained app + PostgreSQL stack
└── vite.config.ts          # Vite build configuration
```

---

## 🧪 Testing

The application includes 257 unit, component, performance, and end-to-end tests across 40 test suites written with **Vitest** and **React Testing Library**, achieving >90% code coverage.

### Running Tests

```bash
# Run all tests once
npm test

# Run tests with code coverage report
npm run test:coverage

# Run code analysis with fallow
npm run fallow

# Run TypeScript type check
npm run lint
```

### Key Test Suites
- **`PerformanceAndMaintainability.test.tsx`**: Validates in-memory LRU shape detection cache hit/miss behavior, non-blocking `detectShapeAsync`, stroke fingerprint generation, parallel export image preloading, spatial bounding box caching, $O(1)$ fast AABB rejection for hit-testing, native `structuredClone` element duplication, and modular toast rendering.
- **`i18n.test.ts`**: Validates multi-language translation, 100% dictionary key parity across English, French, German, and Danish, interpolation handling, and fallback behavior.
- **`ImportAndCollab.e2e.test.tsx`**: End-to-end testing for opening the Import modal, searching SAP architecture icons, placing them on canvas, loading draw.io XML libraries, batch importing diagrams, pointer movement transmission, and live collaborator cursor rendering with user nameplate badges.
- **`drawioParser.test.ts` & `sapIcons.test.ts`**: Verifies `<mxlibrary>`, `<mxGraphModel>`, `<mxfile>`, style string decoding, geometry conversions, and SAP BTP icon category filters.
- **`ImportModal.test.tsx`**: Tests category filtering, search queries, icon size presets, draw.io XML parsing, and image file upload triggers.
- **`MobileResponsiveness.e2e.test.tsx`**: Verifies mobile portrait mode (iPhone SE), mobile landscape mode (844x390), dynamic orientation rotation, 2-finger pinch-to-zoom multi-touch gestures, and tablet viewports (768x1024).
- **`App.e2e.test.tsx`**: Comprehensive workflows including freehand drawing, rectangle/circle shape creation, marquee selection, drag-and-drop movement, undo/redo stacks, text editing, and theme switching.
- **`SelectionOverlay.test.tsx`**: Verifies 8-point resize handles (`nw`, `n`, `ne`, `e`, `se`, `s`, `sw`, `w`), scaling calculations, and drag-and-drop.
- **`Toolbar.test.tsx` & `Header.test.tsx`**: Verifies toolbar responsiveness, background grid lines toggle (`toggle-grid` / `toggle-grid-lines`), import triggers, shape submenus, stroke widths, background selection, and mobile drawer toggles.
- **`shapeDetection.test.ts` & `export.test.ts`**: Verifies shape recognition algorithms, PNG, SVG, and lazy-loaded PDF export pipelines.

---

## 🚀 Deployment

### Option 1: Docker Compose (Self-Contained Local or VPS Stack)

Run AIdboard alongside a dedicated PostgreSQL 16 database with a single command:

```bash
# 1. Create .env file with your Gemini API key
echo 'GEMINI_API_KEY="your-api-key-here"' > .env

# 2. Build and launch services
docker compose up -d --build

# 3. Access application
open http://localhost:3000
```

### Option 2: Standalone Docker Container

```bash
docker build -t aidboard:latest .
docker run -p 3000:3000 \
  -e GEMINI_API_KEY="your-gemini-key" \
  -e SQL_HOST="your-postgres-host" \
  -e SQL_PORT="5432" \
  -e SQL_DB_NAME="aidboard" \
  -e SQL_USER="postgres" \
  -e SQL_PASSWORD="your-password" \
  aidboard:latest
```

---

## 🔒 Security & Data Integrity

- **Prompt Injection Defense**: AI prompts are vetted against known jailbreak/hijacking signatures and wrapped in restrictive system instructions.
- **Structured Schema Enforcement**: Gemini responses are strictly constrained to valid JSON geometries; all numerical coordinates and dimensions are sanitized and clamped before rendering.
- **SQL Injection Prevention**: Built entirely with Drizzle ORM parameterized queries.
- **Safe Authentication**: Firebase Auth tokens verified server-side with Firebase Admin SDK.
