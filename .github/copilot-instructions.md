# Copilot instructions for this repository

## Project snapshot

This repository is the starter app for the GitHub Dev Days Gdańsk workshop "Mayhem w Stoczni". It is built with Astro and runs as a Node server app via `@astrojs/node`.

The current codebase is intentionally minimal: the main entry point is `src/pages/index.astro`, and the site-wide configuration lives in `astro.config.mjs`. The workshop's README describes this as a scaffold for building a GitHub contribution-comparison app.

## Build, test, and validation commands

Use the scripts defined in `package.json`:

```bash
npm install
npm run dev
npm run build
npm run preview
```

Notes:

- `npm run build` is the canonical validation command for this repo right now. It succeeds in the current state and is the best check before finishing work.
- There are no `test` or `lint` scripts configured in `package.json` yet.
- There is no single-test command in the repository at the moment because no test runner is configured.

## High-level architecture

- `astro.config.mjs` configures Astro with `output: 'server'` and the Node adapter (`@astrojs/node`). This is a server-side Astro app, not a pure static site.
- `src/pages/` is file-based routing for Astro pages. The landing page is currently `src/pages/index.astro`.
- `public/` is for static assets like the favicon; use it for browser-facing files that should be served as-is.
- `tsconfig.json` extends `astro/tsconfigs/strict`, so new TypeScript should follow Astro's strict defaults unless a task explicitly requires a different setup.
- The project is a workshop scaffold rather than a mature application; expect future work to add more Astro pages, components, and likely API routes under the same `src/pages` structure.

## Repository-specific conventions

- Keep user-facing copy in Polish unless the task explicitly requires otherwise. This repo is a Polish-language workshop and the current UI text follows that style.
- Prefer Astro conventions over custom app structure: page files in `src/pages`, file-based routing, and simple static content unless the task introduces a more complex UI.
- Do not add unrelated framework complexity. This repo is intentionally lightweight and educational.
- If a task is about publishing to GitHub Pages, follow the deployment notes in `README.md`: switch from `server` output to `static`, remove the Node adapter, and adjust `site`/`base` configuration as needed.

## Working style for this repo

- Keep changes localized to the relevant Astro page/component and config files.
- When adding new files, prefer the existing structure (`src/pages`, `public`) instead of inventing a different app layout.
- Treat the workshop context as authoritative: this is a starter app for a Copilot-driven coding exercise, so maintain the scaffold and make changes that are easy to understand.
