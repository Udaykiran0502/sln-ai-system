## Why

The current empty-state UI of the SLN AI Creative Operating System is too generic and minimal, presenting a basic admin-panel placeholder ("No design loaded") that fails to reflect its powerful evolution into a next-generation "AI-Powered Creative Production Software" (similar to Canva, Figma, or Photoshop). Redesigning this into an immersive, premium, and cinematic "Creative Studio Dashboard" is critical to guide users into the workflow, showcase the platform's unique AI capabilities, and establish a high-end production suite atmosphere from the very first glance.

## What Changes

- **Empty State Redesign**: Replaces the generic and minimal Streamlit empty-state div with a professional, cinematic Creative Studio UI designed with React, TailwindCSS, and Framer Motion.
- **Visual Design Overhaul**: Implements a high-end dark creative studio aesthetic using a navy/slate background, gold accent highlights, glassmorphism, subtle gradients, and smooth hover effects.
- **Workflow Guidance**: Integrates a step-by-step visual workflow guider (Create Design → Upload Assets → Generate Scene Graph → Preview → QA → Export) to transition users smoothly from onboarding to production.
- **CTA Actions**: Provides a large primary "Create New Design" button alongside secondary actions for "Open Existing Project" and "Quick Political Banner".
- **AI Capability Showcase**: Adds animated capability cards highlighting SLN Digitals' key intelligence engines (Telugu Typography, AI Layout Engine, Print QA Validation, Editable Layer System).
- **Recent Projects Carousel**: Adds a sleek placeholder grid/carousel for recent banners/projects, showcasing print-ready statuses (Completed, Failed, Processing).
- **React Standalone Components**: Delivers a full-featured, responsive React component set using Tailwind CSS and Framer Motion for modern frontend integration.

## Capabilities

### New Capabilities
- `creative-studio-empty-state`: The UI specification and layout structure for the cinematic dark-themed empty-state canvas and creative studio dashboard.

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->

## Impact

- `frontend/components/canvas.py`: Refactoring the Streamlit rendering fallback to support the redesigned React asset structure or load a premium HTML mockup block.
- `frontend/views/workspace.py`: Upgrading the workspace onboarding view when no design is currently loaded to show the new creative studio dashboard view.
- Frontend architecture: Adds the standalone React, TailwindCSS, and Framer Motion component files under a new component workspace path (e.g., `frontend/react_components/`) to allow future integration or deployment.
