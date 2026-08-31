import snapshot from '@/data/cais47-leads.json'
import { join } from 'node:path'
import { openOperationalStore } from '@/lib/server/database'

export async function GET() {
  const store = openOperationalStore(join(process.cwd(), 'data', 'nextfy.db'))
  try {
    const sync = store.syncCais47(snapshot.leads)
    return Response.json({ data: { organization: snapshot.projeto, sync, leads: store.listLeads() } }, {
    headers: { 'Cache-Control': 'no-store' },
    })
  } finally {
    store.close()
  }
}
