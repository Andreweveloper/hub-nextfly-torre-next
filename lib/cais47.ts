export interface Cais47Lead {
  chave: string
  nome: string
  segmento: string
  cidade: string
  telefone: string
  telefone_formatado: string
  tem_whatsapp: boolean
  dor: string
  mensagem: string
}

export interface Cais47Export {
  projeto: string
  leads: Cais47Lead[]
}

export interface Cais47WorkspaceLead {
  id: string
  name: string
  email: string
  company: string
  role: string
  source: string
  channel: string
  stage: 'Leads'
  activity: string
}

export function toWorkspaceLeads(leads: Cais47Lead[]): Cais47WorkspaceLead[] {
  const unique = new Map<string, Cais47WorkspaceLead>()

  for (const lead of leads) {
    const id = lead.chave.trim()
    if (!id || unique.has(id)) continue

    unique.set(id, {
      id,
      name: lead.nome,
      email: lead.telefone_formatado || 'Sem telefone',
      company: lead.segmento,
      role: lead.cidade,
      source: 'Cais 47',
      channel: lead.tem_whatsapp ? 'WhatsApp' : 'Sem WhatsApp',
      stage: 'Leads',
      activity: 'Importado do Cais 47',
    })
  }

  return [...unique.values()]
}
