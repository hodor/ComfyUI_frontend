# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

```bash
# Development
pnpm dev                          # Start Vite dev server (needs ComfyUI backend at localhost:8188)
pnpm dev:electron                 # Dev server with Electron API mocks
pnpm dev:cloud                    # Dev server against cloud backend

# Quality checks (run before committing)
pnpm typecheck                    # Vue TSC type checking
pnpm lint                         # ESLint (uses oxlint + eslint)
pnpm format                       # Prettier formatting
pnpm knip                         # Dead code detection

# Testing
pnpm test:unit                    # Run all Vitest unit tests
pnpm test:unit -- path/to/file    # Run specific test file
pnpm test:unit -- --watch         # Watch mode
pnpm test:browser                 # Run Playwright E2E tests
pnpm test:browser -- --ui         # Playwright interactive UI mode

# Build
pnpm build                        # Production build to dist/
```

## Architecture Overview

### Monorepo Structure (Nx-managed)

```
├── src/                    # Main frontend application
│   ├── components/         # Vue 3 components
│   ├── views/              # Route-level views
│   ├── stores/             # Pinia state management
│   ├── composables/        # Vue composition functions
│   ├── services/           # Business logic services
│   ├── lib/litegraph/      # Integrated graph editor (formerly separate package)
│   ├── platform/           # Platform-specific code (cloud, desktop, web)
│   └── locales/            # i18n translations
├── packages/               # Shared workspace packages
│   ├── design-system/      # UI components, icons, Tailwind theme
│   ├── shared-frontend-utils/
│   ├── registry-types/
│   └── tailwind-utils/
├── apps/
│   └── desktop-ui/         # Electron desktop app
├── browser_tests/          # Playwright E2E tests
└── docs/
    ├── guidance/           # File-type-specific conventions (auto-loaded)
    └── testing/            # Testing patterns documentation
```

### Key Architectural Decisions

1. **Litegraph Integration**: The graph editor (litegraph.js) is merged directly into `src/lib/litegraph/` - all modifications happen here, not a separate package.

2. **Platform Abstraction**: Code in `src/platform/` handles differences between web, cloud, and desktop (Electron) builds.

3. **State Management**: Pinia stores in `src/stores/` follow domain-driven design with clear public interfaces.

### Tech Stack

- Vue 3.5+ with Composition API (`<script setup lang="ts">`)
- TypeScript (strict, no `any`)
- Tailwind 4 (semantic tokens from design-system, no `dark:` variant)
- Pinia for state management
- vue-i18n for internationalization
- Vitest + Vue Test Utils for unit tests
- Playwright for E2E tests

## Code Conventions

### Vue Components

```typescript
// Props with Vue 3.5 destructuring defaults
const { nodes, showTotal = true } = defineProps<{
  nodes: ApiNodeCost[]
  showTotal?: boolean
}>()

// Use defineModel for v-model bindings
const selected = defineModel<string>('selected')
```

- Use `cn()` from `@/utils/tailwindUtil` for conditional classes
- Prefer VueUse composables over manual event handling
- No `<style>` blocks - inline Tailwind only

### Imports

```typescript
// Separate type imports
import type { Foo } from './foo'
import { bar } from './foo'

// NOT: import { bar, type Foo } from './foo'
```

### Litegraph Tests - Critical

Always use barrel imports for subgraph code to avoid circular dependencies:

```typescript
// ✅ Correct
import { LGraph, Subgraph } from '@/lib/litegraph/src/litegraph'

// ❌ Wrong - causes circular dependency
import { LGraph } from '@/lib/litegraph/src/LGraph'
```

## Testing Patterns

### Unit Tests (Vitest)

- Colocated: `MyComponent.test.ts` next to `MyComponent.vue`
- Focus on behavioral coverage, not change detection
- Use `vi.hoisted()` for per-test mock manipulation

### E2E Tests (Playwright)

- Tests in `browser_tests/tests/`
- Requires ComfyUI backend with `--multi-user` flag
- Use `ComfyPage` fixture for canvas interaction
- Use node references over coordinates for stability
- Call `nextFrame()` after actions that trigger animations

## Common Pitfalls

- **Never** use `any` or `as any` - fix the underlying type
- **Never** use `dark:` Tailwind variant - use semantic tokens (e.g., `bg-node-component-surface`)
- **Never** use `:class="[]"` - use `cn()` utility
- **Never** use `!important` in Tailwind classes
- **Never** use `withDefaults` - use Vue 3.5 destructuring defaults
- **Never** use barrel files (`index.ts`) for re-exports within `/src`

## i18n

- All user-facing strings must use vue-i18n
- Add translations to `src/locales/en/main.json`
- Other locales are auto-generated on release

## Git Conventions

- Commit format: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`
- Never mention Claude/AI in commits
- PRs reference issues with "Fixes #n"

## Additional Documentation

- `docs/guidance/*.md` - File-type-specific conventions (auto-loaded by glob)
- `docs/testing/*.md` - Detailed testing patterns
- `docs/adr/` - Architecture Decision Records
- `browser_tests/README.md` - E2E testing setup and patterns
