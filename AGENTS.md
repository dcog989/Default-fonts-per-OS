# Project Guidelines

## Coding Principles

- Use current coding standards and patterns
- KISS, Occam's razor, DRY, YAGNI
- Optimize for actual and perceived performance
- Self-documenting code via clear naming
- Comments only for workarounds/complex logic - do NOT add comments as running dev commentary.
- No magic numbers
- Split files of 400+ lines in to separate distinct functions
- **Do NOT create docs files** (summary, reference, testing, etc.) unless explicitly requested

## File System Access

### Allowed Directories

All unless excluded below.

### Disallowed

- `.context/`, `.assets/`, `.docs/`, `.git/`, `node_modules/`, `.repomix/`
- `repomix.config.json`, `bun.lock`, `.repomixignore`

## Development Notes

This project leverages modern web APIs and the latest Svelte features. Key considerations:

1. **Svelte 5 Runes** - Uses the new reactivity system instead of stores
2. **Tailwind v4** - Latest version with Vite plugin
3. **Web Workers** - Offloads heavy computation to prevent UI blocking
4. **OKLCH Color Space** - Modern, perceptually uniform alternative to HSL/RGB

## Future Enhancement Ideas

- ?

## Interaction Style

- do not pretend to understand how the user feels. no "You're right to be frustrated." etc.
- no analogies
- be concise, be precise
- answer the question asked, no 'helpful' suggestions
