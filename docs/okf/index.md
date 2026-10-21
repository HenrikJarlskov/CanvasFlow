# Operational Knowledge Framework (OKF) Bundle
## AIdboard — Interactive Collaborative Vector Whiteboard

Welcome to the **Operational Knowledge Framework (OKF)** bundle for **AIdboard**. This bundle provides a complete operational, architectural, deployment, testing, and lifecycle documentation suite for engineers, DevOps operators, cloud architects, security auditors, and product teams.

---

## 📑 Bundle Navigation & Index

The OKF bundle consists of four core operational modules plus this master index:

| Module | File | Primary Stakeholders | Scope & Contents |
| :--- | :--- | :--- | :--- |
| **01. Index & Overview** | [`docs/okf/index.md`](./index.md) | All Roles | Bundle manifesto, system topology, core conventions, quick reference matrix |
| **02. Features Deep-Dive** | [`docs/okf/features.md`](./features.md) | Engineers, Architects, PMs | Deep-dive functional and technical specification: vector engine, toolbar grid lines toggle, i18n multi-language engine (EN/FR/DE/DA), shape detection, multi-content Import (SAP Icons & Draw.io), real-time collaborator cursors, OCR, AI artist, and responsive layouts |
| **03. Deployment & Security** | [`docs/okf/deployment.md`](./deployment.md) | DevOps, SRE, SecOps | Pre-requisites, deployment strategies (Docker, Cloud Run, Kubernetes, Node.js systemd), security hardening, CSP, WebSocket security, and operational runbooks |
| **04. Testing, Performance & Scalability** | [`docs/okf/testing.md`](./testing.md) | QA, DevOps, Performance Engineers | 40 test suites (257 tests, >90% coverage), E2E workflows, empirical HTTP performance benchmarks, real-time WebSocket scalability stress tests (60+ concurrent clients, <3ms broadcast latency), geometry math throughput, and multi-tier caching benchmarks |
| **05. Operational Log & ADRs** | [`docs/okf/log.md`](./log.md) | Architects, Tech Leads, SRE | Version release history (v1.0.0 through v2.8.0), formal ADRs (ADR-001 through ADR-009), operational audit history, and incident post-mortems |
| **06. Review & Improvements** | [`docs/okf/improvements.md`](./improvements.md) | Architects, SecOps, Lead Engineers | Full-stack engineering, architectural & security review: findings sorted by impact, attack vectors, and 3-phase remediation roadmap |

---

## 🏛️ System Architecture Topology

```
                                  [ HTTPS / WSS : 443 ]
                                           │
                                    Reverse Proxy /
                                  Cloud Load Balancer
                                           │
                           ┌───────────────┴───────────────┐
                           ▼                               ▼
                 [ Express HTTP Server ]         [ WebSocket Server ]
                   - Vite SPA Middlewares          - Real-Time Room Broker
                   - Gemini AI REST Proxy          - Sub-40ms Cursor Sync
                   - Vision OCR Endpoints          - Element Delta Broadcast
                   - Health Checks (:3000)         - Presence Tracking
                           │                               │
            ┌──────────────┴──────────────┐                │
            ▼                             ▼                │
   [ Google Gemini AI ]          [ Cloud SQL / PG ]        │
   - gemini-3.8-flash            - Board Metadata          │
   - Vision Multimodal OCR       - Element Persistence     │
   - AI Diagram Generation       - Drizzle ORM             │
            │                                              │
            └──────────────────────────────┬───────────────┘
                                           ▼
                             [ Client Browser / SPA ]
                             - React 19 + TypeScript + Vite
                             - SVG Vector Drawing Engine
                             - Multi-Tier In-Memory LRU & Spatial Caching
                             - Auto-Snap Corner Detection & Async Classifier
                             - Fast AABB Bounding Box Rejection
                             - Toolbar Workspace Grid Switcher
                             - Multi-Language i18n Engine (EN/FR/DE/DA)
                             - Universal Import Hub (SAP/Draw.io)
                             - Real-Time Collaborator Cursors
                             - Client Tesseract.js Worker
                             - Responsive Layouts (Mobile/Desktop)
                             - Z-Index Stacking Hierarchy Governance
```

---

## 🎯 System Quick Reference Matrix

- **Application Name**: AIdboard (`react-example`)
- **Runtime Environment**: Node.js v22.x LTS, Express 4.21, TypeScript 7.0, React 19, Tailwind CSS v4, Vite 8.3
- **Primary Service Port**: `3000` (HTTP and WebSocket multiplexed on single HTTP server instance)
- **Persistent Storage**: PostgreSQL (production) with automatic SQLite / LocalStorage offline resilience
- **AI Integrations**: Google Gemini API (`@google/genai` SDK), Gemini 3.8 Flash (`gemini-2.5-flash`), Gemini Vision OCR
- **Real-Time Protocol**: Native WebSockets (`ws` protocol) with JSON messaging, room isolation, and heartbeat reconnection
- **Internationalization (i18n)**: i18next & react-i18next with 4 supported locales (English, French, German, Danish), 295+ keys with 100% translatable zero-hardcoded string coverage
- **Workspace Canvas Control**: Floating toolbar toggle between clean workspace (`blank`) and grid-assisted workspace (`grid`/`dots`/`blueprint`/`dark`)
- **High-Performance Caching & Spatial Indexing**: Multi-tier in-memory ARC caches: LRU shape detection cache (256 entries), spatial bounds cache with $O(1)$ AABB fast rejection, preloaded export image cache, and async non-blocking execution
- **Testing Framework**: Vitest 5.0, JSDOM 30.1, React Testing Library 16.3 (262 automated tests across 41 suites)
- **Static Code Analysis**: Custom `fallow.js` architectural complexity and anti-duplication engine

---

## 🔗 External Concepts & References

- **SAP BTP Solution Diagrams Guidelines**: [Official Diagram Component & Icons Guide](https://sap.github.io/btp-solution-diagrams/docs/btp_guideline/diagr_comp/icons/)
- **Diagrams.net (Draw.io) Format**: [Draw.io Diagram XML & Library Structure Specification](https://www.diagrams.net/doc/faq/xml-structure)
- **Internationalization (i18n)**: [i18next Documentation](https://www.i18next.com/) & [react-i18next](https://react.i18next.com/)
- **Google Gen AI TypeScript SDK**: [Official SDK Docs & Reference](https://github.com/google-gemini/generative-ai-js)
- **W3C Scalable Vector Graphics (SVG) 2.0**: [W3C Recommendation](https://www.w3.org/TR/SVG2/)
- **IETF RFC 6455 The WebSocket Protocol**: [RFC 6455 Specification](https://datatracker.ietf.org/doc/html/rfc6455)
- **Main Project README**: [`../../README.md`](../../README.md)
