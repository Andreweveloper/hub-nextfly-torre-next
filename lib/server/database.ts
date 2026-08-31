import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Cais47Lead } from '../cais47'

export type OperationalLeadStage = 'Leads' | 'MQL' | 'SQL' | 'Opps' | 'Won'

export interface OperationalLead {
  id: string
  externalKey: string
  name: string
  segment: string
  city: string
  phone: string
  hasWhatsapp: boolean
  pain: string
  message: string
  stage: OperationalLeadStage
  updatedAt: string
}

export interface SyncResult {
  inserted: number
  updated: number
  unchanged: number
  total: number
}

const organizationId = 'cais-47'
const stages = new Set<OperationalLeadStage>(['Leads', 'MQL', 'SQL', 'Opps', 'Won'])

export class OperationalStore {
  constructor(private readonly database: DatabaseSync) {}

  syncCais47(sourceLeads: Cais47Lead[]): SyncResult {
    let inserted = 0
    let updated = 0
    let unchanged = 0
    const now = new Date().toISOString()
    const seen = new Set<string>()

    this.database.exec('BEGIN IMMEDIATE')
    try {
      for (const source of sourceLeads) {
        const externalKey = source.chave.trim()
        if (!externalKey || seen.has(externalKey)) continue
        seen.add(externalKey)

        const current = this.database.prepare(`SELECT id, name, segment, city, phone, has_whatsapp, pain, message FROM leads WHERE organization_id = ? AND external_key = ?`).get(organizationId, externalKey) as Record<string, unknown> | undefined
        const values = [source.nome, source.segmento, source.cidade, source.telefone_formatado, Number(source.tem_whatsapp), source.dor, source.mensagem]

        if (!current) {
          const id = randomUUID()
          this.database.prepare(`INSERT INTO leads (id, organization_id, external_key, name, segment, city, phone, has_whatsapp, pain, message, stage, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Leads', ?, ?)`).run(id, organizationId, externalKey, ...values, now, now)
          this.addEvent(id, 'imported', { source: 'cais47' }, now)
          inserted += 1
          continue
        }

        const hasChanged = current.name !== source.nome || current.segment !== source.segmento || current.city !== source.cidade || current.phone !== source.telefone_formatado || Number(current.has_whatsapp) !== Number(source.tem_whatsapp) || current.pain !== source.dor || current.message !== source.mensagem
        if (!hasChanged) {
          unchanged += 1
          continue
        }

        this.database.prepare(`UPDATE leads SET name = ?, segment = ?, city = ?, phone = ?, has_whatsapp = ?, pain = ?, message = ?, updated_at = ? WHERE id = ?`).run(...values, now, String(current.id))
        updated += 1
      }
      const total = Number((this.database.prepare('SELECT COUNT(*) AS total FROM leads WHERE organization_id = ?').get(organizationId) as { total: number }).total)
      this.database.exec('COMMIT')
      return { inserted, updated, unchanged, total }
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }

  listLeads(): OperationalLead[] {
    const rows = this.database.prepare(`SELECT id, external_key, name, segment, city, phone, has_whatsapp, pain, message, stage, updated_at FROM leads WHERE organization_id = ? ORDER BY name COLLATE NOCASE`).all(organizationId) as Record<string, unknown>[]
    return rows.map((row) => ({
      id: String(row.id), externalKey: String(row.external_key), name: String(row.name), segment: String(row.segment), city: String(row.city), phone: String(row.phone), hasWhatsapp: Boolean(row.has_whatsapp), pain: String(row.pain), message: String(row.message), stage: row.stage as OperationalLeadStage, updatedAt: String(row.updated_at),
    }))
  }

  setLeadStage(id: string, stage: OperationalLeadStage) {
    if (!stages.has(stage)) throw new Error('Invalid lead stage.')
    const now = new Date().toISOString()
    const result = this.database.prepare('UPDATE leads SET stage = ?, updated_at = ? WHERE id = ?').run(stage, now, id)
    if (result.changes === 0) throw new Error('Lead not found.')
    this.addEvent(id, 'stage_changed', { stage }, now)
  }

  close() { this.database.close() }

  private addEvent(leadId: string, type: string, metadata: Record<string, string>, createdAt: string) {
    this.database.prepare('INSERT INTO lead_events (id, lead_id, type, metadata, created_at) VALUES (?, ?, ?, ?, ?)').run(randomUUID(), leadId, type, JSON.stringify(metadata), createdAt)
  }
}

export function openOperationalStore(filename: string) {
  mkdirSync(dirname(filename), { recursive: true })
  const database = new DatabaseSync(filename)
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), external_key TEXT NOT NULL,
      name TEXT NOT NULL, segment TEXT NOT NULL, city TEXT NOT NULL, phone TEXT NOT NULL, has_whatsapp INTEGER NOT NULL,
      pain TEXT NOT NULL, message TEXT NOT NULL, stage TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      UNIQUE (organization_id, external_key)
    );
    CREATE TABLE IF NOT EXISTS lead_events (
      id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES leads(id), type TEXT NOT NULL, metadata TEXT NOT NULL, created_at TEXT NOT NULL
    );
  `)
  const now = new Date().toISOString()
  database.prepare('INSERT OR IGNORE INTO organizations (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(organizationId, 'Cais 47', 'cais-47', now, now)
  return new OperationalStore(database)
}
