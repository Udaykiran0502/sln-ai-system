## Context

The current empty-state UI in SLN Design Studio is built inside a Streamlit application, rendering basic, generic HTML placeholders via `frontend/components/canvas.py` and `frontend/components/cards.py`. To evolve the product into "AI-Powered Creative Production Software" (similar to Canva, Figma, and Photoshop), we need a premium, dark, cinematic Creative Studio Dashboard. The user has requested a modern tech stack (React, TailwindCSS, Framer Motion) to prepare the frontend for React migration, while we must also ensure that the live Streamlit dashboard instantly reflects this new state-of-the-art creative studio aesthetic.

## Goals / Non-Goals

**Goals:**
- Design and implement a full-featured, state-of-the-art React component (`CreativeStudioDashboard.jsx`) with TailwindCSS styling and Framer Motion micro-animations.
- Redesign the Streamlit empty-state fallbacks inside `frontend/components/canvas.py` and `frontend/components/cards.py` to match the custom premium dark cinematic UI (with navy/slate backgrounds, gold accents, glassmorphic cards, and visual pipeline guides).
- Deliver responsive layouts that scale smoothly from large desktop monitors down to mobile viewports.
- Visualise the six-stage creative workflow: Create Design → Upload Assets → Generate Scene Graph → Preview → QA → Export.

**Non-Goals:**
- Setting up a full Node.js build system, Webpack, or Vite compilation pipeline in the Streamlit backend (the React component will be written as a standalone modular React component for immediate integration into the user's React-based client).
- Modifying the core rendering engine or design generation APIs.

## Decisions

### Decision 1: Architectural Separation of Deliverables
- **Option A**: Write only a React component and leave the Streamlit app unchanged.
- **Option B**: Write only a Streamlit HTML fallback and skip the requested React/Tailwind/Framer Motion stack.
- **Option C (Chosen)**: Create a dual-purpose architecture:
  1. Write a premium, production-grade, standalone React component (`CreativeStudioDashboard.jsx`) using standard JSX, Tailwind, and Framer Motion.
  2. Implement an equally stunning visual replica directly in the Streamlit frontend (`canvas.py` and `cards.py`) using custom HTML/Tailwind classes (via Tailwind CDN injection or pure modern inline CSS) so the active Streamlit app is instantly upgraded.
- **Rationale**: This gives the user the best of both worlds: a production-ready component for their React frontend roadmap, and an immediate visual transformation of their current Streamlit-based SLN Design Studio.

### Decision 2: Cinematic Palette & UI Details
- **Chosen**: Slate Navy background (`#0A0B10` to `#12131A`), warm gold borders and accent highlights (`#D4AF37`, `#F3E5AB`, and tailwind `amber-400`), soft translucent glassmorphism with dynamic gold hover borders, and smooth glowing micro-animations.
- **Rationale**: Fits the "creative production software" theme, moving away from dull "admin panels" to professional high-end workspace tools (matching Photoshop, Lightroom, and Figma).

## Risks / Trade-offs

- **[Risk]**: Framer Motion is a React-specific library and won't execute in a pure Streamlit environment.
  - **[Mitigation]**: We will provide the Framer Motion-based React code in a separate React file (`frontend/react_components/CreativeStudioDashboard.jsx`), and implement high-fidelity pure-CSS keyframe transitions/hovers for the Streamlit HTML dashboard.

- **[Risk]**: Streamlit markdown blocks strip out standard `<script>` tags for security.
  - **[Mitigation]**: Ensure all styling in the Streamlit application is self-contained using inline styles or pure CSS declarations inside `<style>` blocks in the dashboard theme.
