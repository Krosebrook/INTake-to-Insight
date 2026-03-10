
# INTake to Insight

![Status](https://img.shields.io/badge/Status-Beta-orange)
![Tech](https://img.shields.io/badge/Stack-React_|_TypeScript_|_Tailwind-blue)
![AI](https://img.shields.io/badge/AI-Gemini_3_Pro-purple)

**INTake to Insight** is an enterprise-grade visual intelligence platform. It leverages Google's Gemini 3 Pro model to transform abstract business objectives and raw data sources into high-fidelity, editable dashboard mockups and infographics.

This application is designed as a **Local-First** Single Page Application (SPA), ensuring data privacy and offline capability by storing sensitive project data within the user's browser (IndexedDB) rather than a central cloud database during the prototype phase.

---

## 🚀 Key Features

### 🧠 Generative Intelligence
- **Prompt-to-Dashboard:** Instantly generate professional UI mockups based on high-level descriptions (e.g., "Q3 Financial Overview for Stakeholders").
- **Audience-Tailored Output:** Specify a target audience (e.g., "Executives", "Data Scientists") to automatically adjust the visual complexity, terminology, and KPI selection of the generated dashboard.
- **Visual Refinement:** iteratively edit visuals using natural language (e.g., "Change the charts to be dark mode," "Add a user growth metric").
- **Search Grounding:** (Beta) Synthesizes real-world data to inform visual content.

### 🎨 Creative Control
- **Brand Kit System:** Enforce corporate identity with global settings for logos, color palettes, and typography.
- **Interactive Canvas Editor:** Add text annotations, pin comments, manage layers (z-index), and use precise grid snapping directly on the generated dashboards.
- **Multi-Modal Export:** Export designs as high-res PNG, JPG, or PDF for presentations.

### 🛡️ Enterprise Ready
- **Robust Local Persistence:** Auto-saves projects, generated history, and all canvas annotations/comments to IndexedDB with debouncing to prevent data loss.
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

## 🤝 Contributing

We follow a strict "Accessibility First" and "Type Safe" development philosophy. Please ensure all PRs pass linting and include semantic HTML.

**License:** Apache 2.0
