
# Developer Best Practices

This document outlines the engineering standards, UX patterns, and security protocols for the InfoGenius Vision codebase. All contributions must adhere to these guidelines to ensure maintainability and accessibility.

---

## 1. Frontend Architecture

### Component Composition
- **Strict Typing:** All components must define a `Props` interface. Never use `any`.
- **Prop Drilling:** Avoid passing props more than 2 levels deep. Use Composition (passing `children`) or Context for global state (Theme, Auth).
- **File Structure:**
    - `components/`: Reusable UI elements.
    - `lib/`: Pure TypeScript business logic (no JSX).
    - `types.ts`: Centralized domain models.

### State Management
- **Lift State Up:** State shared between siblings (e.g., `DashboardCanvas` and `Toolbar`) should live in their common parent (`Editor`).
- **Persistence:** Use `useEffect` to synchronize critical state changes to `lib/db.ts` (IndexedDB). Always debounce high-frequency writes (like dragging elements).

---

## 2. Accessibility (a11y) & UX

We target **WCAG 2.2 AA** compliance.

### Semantic HTML
- Use `<button>` for actions, `<a>` for navigation.
- Use `<main>`, `<aside>`, `<nav>`, and `<header>` regions.

### ARIA & Focus
- **Modals:** Must trap focus within the modal when open. Support `ESC` to close.
- **Icons:** Interactive icons must have `aria-label` or `title` attributes. Decorative icons should be hidden from screen readers.
- **Feedback:** Long-running tasks (AI Generation) must announce status updates to screen readers or use `aria-live="polite"`.

### Visuals
- **Contrast:** Ensure text has a contrast ratio of at least 4.5:1 against the background.
- **Motion:** Respect `prefers-reduced-motion`. Avoid rapid flashing.

---

## 3. AI Integration Patterns

### Prompt Engineering
- **System Instructions:** Always prepend the `BrandKit` and `User Persona` context to generation requests. This ensures consistency.
- **Fallbacks:** AI services can fail. Always wrap calls in `try/catch` blocks and provide human-readable error messages (not raw JSON).
- **Structured Output:** When needing data (not images), force JSON schema responses using the SDK's `responseSchema` configuration.

### Cost Optimization
- **Caching:** Do not re-generate images if the prompt hasn't changed.
- **Thumbnails:** Store and load smaller versions of images for the dashboard grid view.

---

## 4. Security Protocols

### API Key Management
- **Current (Prototyping):** Keys are accessed via `process.env`.
- **Production Rule:** Never commit keys to Git.
- **Hard Requirement:** The application must eventually migrate to a Proxy Server architecture where keys are never exposed to the client browser.

### Data Handling
- **Sanitization:** All user input (prompts, data uploads) must be treated as untrusted.
- **Consent:** Display clear notices about how data is sent to AI models. Implement "Opt-In" flows for sensitive data processing.

---

## 5. Performance

- **Lazy Loading:** Use `React.lazy()` for route-level components (`Dashboard`, `Editor`, `Settings`).
- **Asset Optimization:** Avoid large layout shifts (CLS). Define width/height for image containers.
- **Rendering:** Use `React.memo` for canvas components that re-render frequently during drag operations.

---

## 6. Git Workflow

1.  **Feature Branches:** `feature/feature-name` or `fix/issue-description`.
2.  **Commit Messages:** Use conventional commits (e.g., `feat: add export pdf`, `fix: resolve grid snapping`).
3.  **Review:** All code must be reviewed for type safety and accessibility before merging.
