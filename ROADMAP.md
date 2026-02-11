# InfoGenius Vision - Strategic Roadmap

This document outlines the development phases required to transition InfoGenius Vision from a client-side prototype to a persistent, enterprise-grade internal tool.

## 🟢 Phase 1: Interactive MVP (Current Status)
**Goal:** Enhance the frontend user experience to support complex interactions and enterprise customization.
- [x] **Basic Image Generation:** Gemini 3 Pro integration.
- [x] **Search Grounding:** Integration with Google Search tool.
- [x] **Session History:** In-memory undo/redo and project history navigation.
- [x] **Local Persistence:** `localStorage` for theme and IndexedDB for projects.
- [x] **Interactivity:** Draggable text annotations and comment pins.
- [x] **Brand Kit System:** Local-first Brand Kit editor with live preview (moved from Phase 5).
- [x] **Canvas Stacking:** Granular layer management (Bring to Front, Send to Back).
- [x] **Data Connectors:** Initial UI for CSV, API, and Cloud Storage integration.
- [ ] **Canvas Engine:** Full migration to `react-konva` or `fabric.js` for complex vector management.

---

## 🟡 Phase 2: Core Migration (Next.js & Infrastructure)
**Goal:** Establish a secure, scalable Backend-for-Frontend (BFF) architecture to handle data persistence and API security.

### Description
The current SPA architecture exposes API keys and relies on browser memory. In this phase, we migrate to a server-side framework. This allows us to proxy all GenAI calls through a secure backend, manage database connections efficiently, and store heavy media assets in cloud object storage rather than expensive database rows.

### Technical Implementation
1.  **Framework Migration (Next.js App Router)**
    *   Initialize a new Next.js project structure.
    *   Migrate `App.tsx` state logic to Server Components and Client Components.
    *   **Action:** Move `geminiService.ts` to `app/actions/generate.ts` using `"use server"`.
    *   **Benefit:** API Keys (`GOOGLE_API_KEY`) are never sent to the client bundle.

2.  **Database Provisioning (PostgreSQL + Prisma)**
    *   Set up a managed PostgreSQL instance (e.g., Supabase, Neon, or AWS RDS).
    *   Initialize Prisma ORM.
    *   **Schema:** Create initial tables: `User`, `Workspace`, `Project` (stores canvas JSON), `Asset` (stores image URLs).
    *   **Benefit:** Relational data integrity and type-safe database queries.

3.  **Object Storage Strategy (S3/R2)**
    *   **Problem:** Storing Base64 images in Postgres bloats the DB and slows down queries.
    *   **Solution:** Implement an S3-compatible storage provider (AWS S3, Cloudflare R2, or Google Cloud Storage).
    *   **Workflow:**
        1.  Server generates image via Gemini.
        2.  Server uploads stream directly to S3 bucket.
        3.  Server saves the S3 public URL to the `Asset` table.
        4.  Client receives the URL, not the raw data.

### Practical Utility
*   **Security:** Eliminates the risk of API key leakage.
*   **Performance:** Faster initial page loads (SSR) and lighter database payloads.
*   **Scalability:** Object storage allows for virtually infinite image history without degrading database performance.

---

## 🔴 Phase 3: Persistence & Synchronization
**Goal:** Enable "Local-First" editing with robust cloud synchronization to prevent data loss.

### Description
Enterprise users often work on unstable connections (VPNs, travel). We need a "Local-First" architecture where the app works perfectly offline, saving drafts to the browser's IndexedDB, and synchronizes with the Postgres database transparently when the connection is restored.

### Technical Implementation
1.  **Async State Management (TanStack Query)**
    *   Replace `useEffect` data fetching with React Query.
    *   Implement `useMutation` for optimistic UI updates (showing the "Saved" checkmark instantly before the server confirms).

2.  **Offline Storage Layer (IndexedDB)**
    *   **Library:** Use `idb` or `Dexie.js` wrapper.
    *   **Logic:** Every canvas change (drag, resize, text edit) writes to a local `drafts` store.
    *   **Schema:** `id`, `lastModified`, `dirty` (boolean), `canvasState` (JSON blob).

3.  **Synchronization Engine**
    *   Implement a background sync hook that listens for `window.online` events.
    *   **Conflict Resolution:** Implement a "Last Write Wins" strategy initially.
    *   **Workflow:** On reconnect -> Fetch latest server state -> Compare timestamps -> Push local `dirty` records -> Pull server updates.

### Practical Utility
*   **Reliability:** Users never lose work if they accidentally close a tab or lose Wi-Fi.
*   **Speed:** UI interactions feel instant because they don't wait for a server round-trip.
*   **Workflow:** Users can switch devices (Desktop to Laptop) and resume work seamlessly once synced.

---

## 🟣 Phase 4: Enterprise Governance
**Goal:** Multi-user management, security compliance, and organizational hierarchy.

### Description
To sell this internally to IT/Security teams, the tool must integrate with existing identity providers and provide granular control over who can create, edit, or view sensitive visual assets.

### Technical Implementation
1.  **Authentication (Auth.js / NextAuth)**
    *   **Providers:** Configure OIDC/SAML providers (Okta, Azure AD, Google Workspace).
    *   **Session Strategy:** JSON Web Tokens (JWT) stored in secure, HTTP-only cookies.
    *   **Middleware:** Protect `/dashboard` and `/editor` routes at the edge.

2.  **Multi-Tenancy & RBAC**
    *   **Schema Update:** Add `Organization` table and `Membership` join table with `role` enum (`OWNER`, `ADMIN`, `EDITOR`, `VIEWER`).
    *   **Logic:** Ensure every database query includes a `where: { orgId: currentOrgId }` clause to prevent data leakage between teams.

3.  **Audit Logging System**
    *   **Schema:** Create `AuditLog` table: `id`, `userId`, `action` (GENERATE, EXPORT, DELETE), `resourceId`, `timestamp`, `cost` (token count).
    *   **Dashboard:** Create an Admin View to visualize token usage and monthly costs per department.

### Practical Utility
*   **Compliance:** Meets SOC2/ISO requirements for access control and activity tracking.
*   **Cost Control:** Admins can see which teams are using the most API credits and set limits.
*   **Collaboration:** Enables "Team Folders" where assets are shared by default within a department.

---

## 🔵 Phase 5: Advanced Intelligence & Integrations
**Goal:** Deep integration with enterprise data and automated brand compliance.

### Description
Transform the tool from a generic image generator into a specialized business intelligence visualizer. This involves injecting company-specific context (Data + Branding) into the GenAI context window.

### Technical Implementation
1.  **Enhanced Context Injection**
    *   **Refinement:** Expand the Brand Kit system to include specific CSS/SVG style guides beyond colors and fonts.
    *   **Prompt Engineering:** Middleware that appends specific instructions to *every* Gemini call: "Use the color palette: #FF5733, #33FF57. Use 'Inter' font. Place logo in bottom right."

2.  **Data Connectors (RAG-Lite)**
    *   **CSV/Excel Import:** Server-side parsing (e.g., `papaparse`) to convert spreadsheet rows into a JSON summary.
    *   **CRM Integration:** API connectors for Salesforce/HubSpot to fetch live metrics (e.g., "Q3 Revenue").
    *   **Workflow:** User selects "Connect Data" -> Gemini prompt receives: "Visualize this data: {JSON_DATA} as a bar chart."

3.  **Vector/SVG Output**
    *   **Model Config:** Instruct Gemini 3 Pro to generate SVG code blocks rather than pixel data for charts and diagrams.
    *   **Rendering:** Sanitize the SVG string on the server and render it as a scalable component on the canvas.
    *   **Export:** Allow users to download `.svg` files for use in Adobe Illustrator or Figma.

### Practical Utility
*   **Consistency:** All generated assets automatically look like they came from the company Design Team.
*   **Accuracy:** Visuals represent real, live business data rather than hallucinated numbers.
*   **Versatility:** SVG exports allow designers to fine-tune the AI output in professional design tools.
