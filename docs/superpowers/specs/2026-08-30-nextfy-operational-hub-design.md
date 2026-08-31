# Nextfy Operational Hub Design

## Goal

Turn the Nextfy Hub into a local operational workspace backed by SQLite, using
Cais 47 as the lead-discovery source and exposing stable internal APIs for
future external connectors.

## Scope

This phase makes leads, organizations, campaign templates, campaigns, funnel
stages, tasks and integration settings persistent. It adds a manual WhatsApp
queue that opens a prefilled `wa.me` conversation and records the operator's
intent, but never sends a message automatically.

## Architecture

The Next.js application owns a SQLite database at `data/nextfy.db`. Route
handlers provide the single access boundary for browser UI and future API
clients. The Cais 47 JSON snapshot is an import source; its `chave` field is
the external identity used to upsert leads while preserving Hub-owned funnel
status, notes and event history.

The current Cais snapshot import remains available for offline use. A later
sync adapter can call `http://127.0.0.1:8003/api/leads` and pass the same
normalized records through the importer, so the UI does not depend directly on
the Cais 47 process.

## Data Model

### organizations

One local organization record stores `id`, `name`, `slug`, `createdAt` and
`updatedAt`. The initial record is `Cais 47` with slug `cais-47`.

### leads

Each lead has `id`, `organizationId`, `externalKey`, `name`, `segment`, `city`,
`phone`, `hasWhatsapp`, `pain`, `message`, `stage`, `createdAt` and
`updatedAt`. `externalKey` is unique per organization and comes from Cais
47's `chave`.

### lead_events

Append-only operational history: `id`, `leadId`, `type`, `metadata`,
`createdAt`. Initial event types are `imported`, `stage_changed`,
`whatsapp_opened` and `note_added`.

### funnels and funnel_stages

A funnel belongs to one organization. Stages are ordered and store `name`,
`position`, optional `target` and display tone. The default stages are Leads,
MQL, SQL, Opportunities and Won; their values are derived from actual leads.

### templates, campaigns and campaign_tasks

Templates contain an editable campaign shape: name, channel, description,
default funnel and checklist. Applying one creates a persisted campaign and
its tasks, rather than only showing an interface card.

### integration_connections

Integration records store connector name, kind, enabled state and non-secret
configuration. API tokens and secrets stay only in environment variables and
are never sent to the browser or committed to the repository.

## API Contracts

All handlers return JSON with `{ data }` on success and `{ error }` on
failure. Validation errors use HTTP `400`; unavailable local sources use
`503`; unknown IDs use `404`.

- `GET /api/leads`: filtered lead list and stage totals.
- `PATCH /api/leads/:id`: updates stage or operator-owned fields.
- `POST /api/leads/:id/whatsapp`: records `whatsapp_opened` and returns a
  prefilled WhatsApp URL. It does not send any message.
- `POST /api/cais47/sync`: upserts the bundled snapshot or, later, the local
  Cais 47 API source.
- `GET, POST /api/funnels`: lists and creates funnels.
- `PATCH /api/funnels/:id`: updates stages and targets.
- `GET, POST /api/templates`: lists and creates templates.
- `POST /api/templates/:id/apply`: creates a campaign and its tasks.
- `GET, PATCH /api/integrations`: lists integration readiness and saves
  non-secret configuration.

## User Flows

### Lead Queue and WhatsApp

The lead list displays Cais 47 fields, stage and activity history. Selecting
"Open WhatsApp" first calls the event endpoint, then opens the returned
`wa.me` URL in a new tab. The operator reviews and sends from WhatsApp; the
Hub records that a conversation was initiated but cannot claim delivery.

### Cais 47 Sync

The operator selects sync. The importer normalizes the source record,
upserts by `organizationId + externalKey`, creates `imported` events only for
new records and leaves all existing stage/event history untouched. The result
reports inserted, updated and unchanged counts.

### Templates and Funnels

Applying a template creates a campaign plus its task checklist and funnel
stages. Users can add, reorder and target stages. Dashboard metrics are
calculated from persisted leads, campaigns, tasks and events only.

## Constraints

- Database access is server-only; browser components call route handlers.
- The local server must bind to `127.0.0.1` while it exposes commercial phone
  data.
- The SQLite database and integration secret files are ignored by Git.
- No code path sends WhatsApp messages automatically in this phase.
- Cais 47 source data is treated as commercial contact data and is not exposed
  in public routes or client bundles.
- Every database mutation has a focused automated test.

## Acceptance Criteria

- A fresh local database imports all available Cais 47 leads once, without
  duplicates on repeated syncs.
- Lead stage changes and WhatsApp-open events remain after browser reload.
- Applying a template creates editable campaign tasks and a funnel.
- The dashboard displays real SQLite totals, not seeded metrics.
- Integration settings indicate readiness without exposing secrets.
