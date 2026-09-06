# Implementation Plan: F01. Landing Page

**Prerequisites:**
- Node.js 20+ and npm 10+ installed
- No environment variables required (the placeholder session cookie name is a code-level constant, not a runtime config value)
- No external accounts or API keys required

### Stage 1: Frontend App Scaffolding

**1. Monorepo and Workspace Setup** - Initialize the repository root as an npm workspace and scaffold the `apps/web/` Next.js (App Router, TypeScript) application inside it. Reference the spec's Component Overview for the full manifest and configuration file list.

**2. Styling and Design Tokens** - Configure Tailwind CSS and a small design-token layer (accent color, typography scale, spacing) that will support the minimalist, HubSpot-inspired visual identity described in the PRD.

**3. Root Layout and Global Styles** - Implement the root layout shared by every future page in `apps/web`: the HTML/body shell, font loading, and global stylesheet import, per the spec's Technical Decisions.

**4. Tooling and Quality Gates** - Configure ESLint, TypeScript strict settings, Vitest (component tests), and Playwright (end-to-end tests), and wire the npm scripts that back this feature's quality gates.

### Stage 2: Landing Page Implementation

**5. Site Header and Navigation** - Build the top navigation bar showing the product logo and a "Log in" link routing to `/login`, per the spec's Component Overview.

**6. Hero Section** - Build the hero section with the product name, one-sentence value proposition, supporting paragraph, and the "Create account" call-to-action routing to `/register`.

**7. How It Works Strip and Footer** - Build the three-step "how it works" strip (Upload → Transcribe → Summarize) and the page footer described in the PRD's Capabilities.

**8. Landing Page Composition** - Assemble the site header, hero, how-it-works strip, and footer into the `/` route, matching the architecture described in the spec.

### Stage 3: Authenticated Redirect and Verification

**9. Session Cookie Helper** - Implement the placeholder session-check helper that reads the session cookie defined in the spec's Technical Decisions, documenting the contract that the future authentication feature is expected to formalize.

**10. Authenticated-Visitor Redirect** - Wire the `/` route to redirect already-authenticated visitors to `/app`, per the spec's architecture and the PRD's Experience description.

**11. Automated Test Coverage** - Write the unit/component tests and the end-to-end test covering the landing page's rendering, navigation links, and redirect behavior, per the spec's Testing Strategy.
