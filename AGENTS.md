# Agent Directives

## Project Context

- Name: Default-fonts-per-OS
- Description: Interactive browser tool to browse and compare default fonts across major operating systems (Windows 11, macOS, iOS, Android, Linux). Vanilla JS SPA with multiple views (list/table/comparison), live font preview, filtering, and persisted settings.
- Tech: Vanilla HTML/CSS/JS (no framework), bun (npx `serve` for local dev), Biome for lint/format, GitHub Pages for deploy.

## Key Files

- `index.html` — entry point
- `js/app.js` — main app logic/state
- `js/constants.js` — named constants
- `js/renderer.js` — view rendering (list/table/comparison)
- `js/font-checker.js` — font availability detection
- `js/storage.js` — settings persistence
- `js/preferences.js` — user preferences
- `js/theme.js` — Light/Dark/Auto themes
- `js/dragdrop.js` — drag and drop interactions
- `js/data.js` — inlined per-OS default font data (single source of truth)
- `.github/workflows/deploy.yml` — CI/CD to GitHub Pages

## Development Workflow

- Install: `bun install` (only dev dependency is `@biomejs/biome`)
- Dev: `bun run dev` (Vercel `serve` static server, http://localhost:9000)
- Test: no test suite configured
- Lint: `bun run lint` (Biome)
- Format: `bun run format` / `bun run format:fix` (Biome)
- Check: `bun run check` (Biome format + lint; config in `biome.json`)
- Build/Deploy: push to main triggers GitHub Pages deploy workflow

## Dev Environment

- CachyOS, Limine bootloader, KDE Plasma 6, Wayland, and Btrfs.
- fish shell, Ghostty terminal, Fresh TUI editor, yay package manager, bun npm manager, Firefox, and Zed code editor.

## File System Access

- Root: `<project root>`
- Allowed: All project files, `/tmp/<project-name>`
- Read-Only: `.env*`, `.git/`
- Disallowed: system dirs, user config, other projects
- Require confirmation: adding/removing dependencies, any operation outside project root

## Rules

- Keep modifications minimal and scoped. Ask before architectural changes.
- Do not delete files or make destructive changes without confirmation.
- Do not create documentation files unless explicitly requested.
- Prefer incremental improvements over rewrites.
- Use explicit types and named constants (no magic numbers).
- Return explicit error types; do not suppress exceptions.
- Follow standard repository linting and formatting configs (Biome, rustfmt, .editorconfig).
- Decompose files over 400 lines if they mix concerns.
- Never run git mutations (commit, push, reset, rebase, amend) unless explicitly asked.
- Self-documenting code via clear naming. Use comments only for complex workarounds or issues that need noting - why, not what.
- Do not run full `bun run check`/`bun run test` on trivial changes (constant tweaks, one-line edits, CSS value changes). Only run the full suite on real logic changes.
- On completion of an update or fix, print a concise conventional commit message in a fenced code block.

## Development Notes

This project leverages modern web APIs. Key considerations:

1. **Web Workers** — Offloads heavy computation to prevent UI blocking

## Communication Style

- Provide concise, actionable responses.
- Ask clarifying questions when requirements are ambiguous.
- Flag potential risks or edge cases proactively.
- Do not pretend to understand how the user feels.
- Be concise, be precise. Answer the question asked; no unsolicited 'helpful' suggestions.

## Definition of Done

- Logic fully implemented.
- `<test>` and `<lint>` pass with zero errors.
- New/modified features have tests.
- Existing docs updated if public interfaces changed.
