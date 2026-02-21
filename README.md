
# InfoGenius Vision

![Status](https://img.shields.io/badge/Status-Beta-orange)
![Tech](https://img.shields.io/badge/Stack-React_|_TypeScript_|_Tailwind-blue)
![AI](https://img.shields.io/badge/AI-Gemini_3_Pro-purple)

**InfoGenius Vision** is an enterprise-grade visual intelligence platform. It leverages Google's Gemini 3 Pro model to transform abstract business objectives and raw data sources into high-fidelity, editable dashboard mockups and infographics.

This application is designed as a **Local-First** Single Page Application (SPA), ensuring data privacy and offline capability by storing sensitive project data within the user's browser (IndexedDB) rather than a central cloud database during the prototype phase.

---

## 🚀 Key Features

### 🧠 Generative Intelligence
- **Prompt-to-Dashboard:** Instantly generate professional UI mockups based on high-level descriptions (e.g., "Q3 Financial Overview for Stakeholders").
- **Visual Refinement:** iteratively edit visuals using natural language (e.g., "Change the charts to be dark mode," "Add a user growth metric").
- **Search Grounding:** (Beta) Synthesizes real-world data to inform visual content.

### 🎨 Creative Control
- **Brand Kit System:** Enforce corporate identity with global settings for logos, color palettes, and typography.
- **Canvas Editor:** Drag-and-drop annotation system, layer management (z-index), and precise grid snapping.
- **Multi-Modal Export:** Export designs as high-res PNG, JPG, or PDF for presentations.

### 🛡️ Enterprise Ready
- **Local Persistence:** Auto-saves work to IndexedDB; no data loss on refresh.
- **Audit Logging:** Tracks all generation, edit, and export events for compliance.
- **Security:** Role-Based Access Control (RBAC) simulation and audit trails.

---

## 🛠️ Technical Stack

- **Frontend:** React 18, TypeScript, Vite (implied structure)
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **AI Integration:** Google GenAI SDK (`@google/genai`)
- **Persistence:** IndexedDB (via custom wrapper)
- **State Management:** React Context + Local State (Lifted)

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- A Google Cloud Project with the Gemini API enabled.
- An API Key with access to `gemini-3-pro` and `gemini-3-pro-image-preview`.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-org/infogenius-vision.git
    cd infogenius-vision
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory (or configure your build tool):
    ```env
    # WARNING: For local development only. Do not commit keys to repo.
    API_KEY="AIzaSy..." 
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

---

## 📂 Project Structure

```
/
├── components/         # React UI Components
│   ├── DashboardCanvas.tsx  # Core visual editor logic
│   ├── Editor.tsx           # Main controller for generation flow
│   ├── Settings.tsx         # User & Workspace configuration
│   └── ...
├── lib/
│   ├── db.ts           # IndexedDB wrapper (Local-First Persistence)
│   ├── gemini.ts       # AI Service Layer (Prompts & API calls)
│   └── ...
├── types.ts            # TypeScript Interfaces (Domain Models)
├── App.tsx             # Root Layout & Routing
└── index.tsx           # Entry Point
```

---

## 📚 Documentation

- **[Architecture Overview](./ARCHITECTURE.md):** Deep dive into the Local-First design and data flow.
- **[Best Practices](./BEST_PRACTICES.md):** Coding standards, accessibility guidelines, and security protocols.
- **[Roadmap](./ROADMAP.md):** Future migration plans to Next.js and Cloud Storage.

---

---

## 🚀 Deployment

This is a **pure static SPA** (Vite build → `dist/`). It deploys identically on both Vercel and Cloudflare Pages. No server or edge functions are required.

### Prerequisites

Set your `GEMINI_API_KEY` as an environment variable **in the platform UI** before deploying. It is embedded in the client bundle at build time by Vite.

> ⚠️ Restrict the API key to your deployed domain(s) in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) to prevent unauthorized use.

Copy `.env.example` to `.env` for local development:
```bash
cp .env.example .env
# then edit .env and fill in GEMINI_API_KEY
```

---

### Vercel

| Setting          | Value                           |
|------------------|---------------------------------|
| Framework Preset | Vite                            |
| Build Command    | `npm run build`                 |
| Output Directory | `dist`                          |
| Install Command  | `npm install`                   |
| Node.js Version  | ≥20.19.x (or 22+)               |
| Env Variable     | `GEMINI_API_KEY` = `<your key>` |

**Deploy via CLI:**
```bash
npx vercel --prod
```

Security headers and SPA routing are configured in `vercel.json` (already in repo).

---

### Cloudflare Pages

| Setting            | Value                           |
|--------------------|---------------------------------|
| Framework Preset   | None (Vite)                     |
| Build Command      | `npm run build`                 |
| Build Output Dir   | `dist`                          |
| Root Directory     | `/` (repo root)                 |
| Node.js Version    | ≥20.19.x (or 22+)               |
| Env Variable       | `GEMINI_API_KEY` = `<your key>` |

**Deploy via CLI:**
```bash
npx wrangler pages deploy dist --project-name=intake-to-insight
```

SPA routing (`public/_redirects`) and security headers (`public/_headers`) are copied into `dist/` automatically by Vite during the build.

---

### Local Smoke Test

Verify both build and preview work before pushing:
```bash
# 1. Install deps
npm install

# 2. Build + preview (serves on http://localhost:4173 by default)
npm run smoke

# 3. In a second terminal, confirm health endpoint responds:
curl http://localhost:4173/health.json
# Expected: {"status":"ok","app":"intake-to-insight"}
```

### Deployment Checklist

- [ ] `GEMINI_API_KEY` set in platform environment variables
- [ ] API key restricted to deployed domain in Google Cloud Console
- [ ] `npm run build` completes without errors locally
- [ ] `/health.json` returns `{"status":"ok"}` after deploy
- [ ] App loads and Gemini API calls succeed in production

### Rollback Plan

Both platforms retain all previous deployments:
- **Vercel**: Deployments tab → select previous deployment → "Promote to Production"
- **Cloudflare Pages**: Pages project → Deployments tab → "Rollback to this deployment"

---

## 🤝 Contributing

We follow a strict "Accessibility First" and "Type Safe" development philosophy. Please ensure all PRs pass linting and include semantic HTML.

**License:** Apache 2.0
