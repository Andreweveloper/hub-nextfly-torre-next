# Nextfy Operational Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Nextfy Hub persist real Cais 47 operations locally, with functional lead management, manual WhatsApp queue, funnels, templates and API-ready integrations.

**Architecture:** Next.js route handlers access a server-only SQLite database. Cais 47 is imported by stable external key; browser pages use JSON routes instead of localStorage as the source of truth. WhatsApp actions record operator intent and return a prefilled URL without sending messages.

**Tech Stack:** Next.js 16, React 19, TypeScript, Node built-in `node:sqlite`, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-30-nextfy-operational-hub-design.md`

## Global Constraints

- Bind the local server to `127.0.0.1` while commercial contact data is present.
- Do not send WhatsApp messages automatically.
- Keep database access server-only and keep secrets out of the browser and Git.
- Use Cais 47 `chave` as the organization-scoped external lead identity.
- Write and run a focused failing test before every data mutation.

---

### Task 1: SQLite Store and Cais 47 Importer

**Files:**
- Create: `lib/server/database.ts`
- Create: `lib/server/cais47-import.ts`
- Create: `lib/server/database.test.ts`
- Modify: `.gitignore`

- [ ] Write failing tests for schema initialization, first import and duplicate-safe reimport.
- [ ] Implement schema migrations for organizations, leads and lead events.
- [ ] Implement Cais 47 upsert by `organizationId + externalKey`.
- [ ] Run focused tests and TypeScript validation.

### Task 2: Lead and WhatsApp APIs

**Files:**
- Create: `app/api/leads/route.ts`
- Create: `app/api/leads/[id]/route.ts`
- Create: `app/api/leads/[id]/whatsapp/route.ts`
- Create: `app/api/cais47/sync/route.ts`
- Test: `lib/server/database.test.ts`

- [ ] Write failing tests for filters, stage updates and WhatsApp event logging.
- [ ] Implement lead query and update handlers.
- [ ] Implement manual WhatsApp URL generation and `whatsapp_opened` events.
- [ ] Implement snapshot sync result counts.
- [ ] Run focused tests and API smoke checks.

### Task 3: Functional Lead Queue

**Files:**
- Modify: `components/torre/workspace-builder.tsx`
- Modify: `components/torre/reference-tool-surface.tsx`

- [ ] Replace local lead state with API reads and mutations.
- [ ] Add lead status, history and manual WhatsApp actions.
- [ ] Add Cais 47 sync control and real summary totals.
- [ ] Verify lead stages persist after reload.

### Task 4: Funnels, Campaigns and Templates

**Files:**
- Modify: `lib/server/database.ts`
- Create: `app/api/funnels/route.ts`
- Create: `app/api/templates/route.ts`
- Create: `app/api/templates/[id]/apply/route.ts`
- Modify: `components/torre/workspace-builder.tsx`

- [ ] Write failing tests for template application and funnel persistence.
- [ ] Add funnels, stages, campaigns and tasks to the schema.
- [ ] Make templates create real campaign records and editable task lists.
- [ ] Make funnel totals derive from database leads.
- [ ] Run focused tests and UI checks.

### Task 5: Integration Readiness and Local Safety

**Files:**
- Create: `app/api/integrations/route.ts`
- Modify: `components/torre/workspace-builder.tsx`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] Add integration readiness records for Cais 47, WhatsApp Cloud API and future connectors.
- [ ] Add non-secret configuration UI and environment-variable documentation.
- [ ] Change local dev startup to bind only to `127.0.0.1`.
- [ ] Run complete tests, TypeScript validation and production build.
