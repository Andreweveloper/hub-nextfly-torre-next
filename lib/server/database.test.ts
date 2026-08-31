import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { openOperationalStore } from './database.js'

const sourceLeads = [
  { chave: '5547999999999', nome: 'Empresa Exemplo', segmento: 'Barbearia', cidade: 'Itajaí', telefone: '5547999999999', telefone_formatado: '(47) 99999-9999', tem_whatsapp: true, dor: 'Sem site.', mensagem: 'Olá.' },
  { chave: 'n:empresa sem telefone|navegantes', nome: 'Empresa sem telefone', segmento: 'Estética', cidade: 'Navegantes', telefone: '', telefone_formatado: '', tem_whatsapp: false, dor: 'Sem site.', mensagem: 'Olá.' },
]

test('imports Cais 47 leads once and preserves the local funnel stage on reimport', () => {
  const directory = mkdtempSync(join(tmpdir(), 'nextfy-store-'))
  const store = openOperationalStore(join(directory, 'nextfy.db'))

  try {
    assert.deepEqual(store.syncCais47(sourceLeads), { inserted: 2, updated: 0, unchanged: 0, total: 2 })
    const imported = store.listLeads()
    assert.equal(imported[0]?.externalKey, '5547999999999')
    assert.equal(imported[0]?.stage, 'Leads')

    store.setLeadStage(imported[0]?.id ?? '', 'MQL')
    assert.deepEqual(store.syncCais47(sourceLeads), { inserted: 0, updated: 0, unchanged: 2, total: 2 })
    assert.equal(store.listLeads()[0]?.stage, 'MQL')
  } finally {
    store.close()
    rmSync(directory, { recursive: true, force: true })
  }
})
