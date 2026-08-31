export type EstadoAgente = 'ativo' | 'espera' | 'parado'
export type EstadoLead = 'novo' | 'enviado' | 'respondeu' | 'fechado'

export interface Agente {
  id: string
  codigo: string
  nome: string
  papel: string
  estado: EstadoAgente
  tarefa: string
  tempo: string
  metrica: string
  ferramentas: string[]
  entrega: string
  pontos: [string, string][]
  pedeAntes: string
  comando: string
}

export const agentes: Agente[] = [
  {
    id: 'spy',
    codigo: 'SPY-01',
    nome: 'Spy',
    papel: 'Inteligência competitiva de anúncios',
    estado: 'espera',
    tarefa: 'Aguardando integração',
    tempo: '--:--',
    metrica: 'Sem dados',
    ferramentas: ['Read', 'Write', 'Bash', 'Grep', 'Glob', 'WebSearch', 'WebFetch'],
    entrega:
      'Um mapa de ofertas, ângulos de copy e formatos que os concorrentes de um nicho estão validando agora — gravado em SQLite, uma linha por ad_id.',
    pontos: [
      ['Coleta', 'Meta Ad Library por API oficial quando há token; Playwright como fallback.'],
      ['Classifica', 'cada anúncio por ângulo (dor / desejo / prova / mecanismo / urgência), formato e estágio de funil.'],
      ['Sinaliza', 'repetição sustentada — anúncio que fica no ar é o sinal mais forte de que algo funciona.'],
    ],
    pedeAntes: 'Nicho, produto ou página do anunciante, e o país.',
    comando: 'Use o agente spy para mapear os ângulos e ofertas em circulação no nicho de [NICHO] no Brasil.',
  },
  {
    id: 'traffic',
    codigo: 'TRF-02',
    nome: 'Traffic',
    papel: 'Matemática de escala e decisão de budget',
    estado: 'espera',
    tarefa: 'Aguardando integração',
    tempo: '--:--',
    metrica: 'Sem dados',
    ferramentas: ['Read', 'Write', 'Bash', 'Grep'],
    entrega:
      'Um veredito por adset — escalar, manter, cortar ou matar — sempre com a justificativa numérica explícita.',
    pontos: [
      ['Piso de 50 conv.', 'abaixo disso a variância separa mal sinal de ruído. Recomendação padrão: aguardar.'],
      ['Teto de 20%', 'salto maior reinicia o aprendizado da Meta e degrada performance.'],
      ['Cooldown de 48h', 'entre qualquer alteração de budget no mesmo adset.'],
      ['Intervalo de Wilson', 'só declara vencedor quando os intervalos de 95% não se sobrepõem.'],
    ],
    pedeAntes: 'Gasto, conversões, CPA, CVR e período de veiculação do adset.',
    comando:
      'Use o agente traffic para decidir o que fazer com o adset [NOME]: gasto R$ [X], [N] conversões, CPA R$ [Y], rodando há [D] dias.',
  },
  {
    id: 'creative',
    codigo: 'CRE-03',
    nome: 'Creative',
    papel: 'Roteiros de alta retenção e diagnóstico de criativo',
    estado: 'espera',
    tarefa: 'Aguardando integração',
    tempo: '--:--',
    metrica: 'Sem dados',
    ferramentas: ['Read', 'Write', 'Bash', 'Grep'],
    entrega:
      'Roteiro em Hook / Body / CTA com marcação de tempo e nota de direção — ou o diagnóstico de em qual etapa um criativo está falhando.',
    pontos: [
      ['Hook (0–3s)', 'a tensão que impede o scroll. Sempre 3 variações, para teste A/B.'],
      ['Body', 'dor → agita → mecanismo único → prova. Cada frase justifica a permanência.'],
      ['CTA', 'uma instrução só, alinhada ao estágio de funil.'],
      ['Diagnóstico', 'hook rate baixo culpa a abertura; queda entre 25–50% culpa o corpo; CTR baixo culpa a oferta.'],
    ],
    pedeAntes: 'Produto, avatar, dor principal e oferta. Para diagnóstico: hook rate e hold rate reais.',
    comando: 'Use o agente creative para escrever um roteiro de Reels para [PRODUTO], avatar [QUEM], dor principal [DOR].',
  },
  {
    id: 'prospector-local',
    codigo: 'PRO-04',
    nome: 'Prospector Local',
    papel: 'Varredura de comércios sem site no litoral de SC',
    estado: 'espera',
    tarefa: 'Aguardando conexão com o Cais 47',
    tempo: '--:--',
    metrica: 'Sem dados',
    ferramentas: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Artifact'],
    entrega:
      'Uma lista de comércios que atendem hoje, aparecem no Maps e não têm site — cada um com a mensagem de WhatsApp já escrita.',
    pontos: [
      ['Varre', 'a matriz nicho × cidade no Maps, extrai nome, telefone e site.'],
      ['Descarta', 'quem já tem site — o produto é justamente quem não tem.'],
      ['Escreve', 'a copy de abordagem por ramo e injeta no painel.'],
      ['Publica', 'no Cais 47, a bancada onde a situação de cada lead é marcada.'],
    ],
    pedeAntes: 'O nicho e a cidade. Ex.: "acha pet shops em Navegantes".',
    comando: 'Use o agente prospector-local para varrer [NICHO] em [CIDADE] e publicar no Cais 47.',
  },
]

export const cidades: { nome: string; leads: number; semSite: number }[] = []

export interface Lead {
  nome: string
  ramo: string
  cidade: string
  fone: string
  estado: EstadoLead
}

export const leads: Lead[] = []

export const site = {
  dominio: 'nextfly.com.br',
  hospedagem: 'Aguardando conexão',
  ultimoDeploy: '—',
  paginas: [] as { rota: string; nome: string; estado: EstadoAgente }[],
}

export const funil: { etapa: string; qtd: number; valor: number }[] = []

export type Veredito = 'escalar' | 'manter' | 'aguardar' | 'matar'

export const campanhas: {
  nome: string
  gasto: number
  conv: number
  cpa: number
  cvr: number
  dias: number
  veredito: Veredito
}[] = []

export const regrasTrafego = [
  {
    n: '50',
    nome: 'Piso de significância',
    texto:
      'Nenhuma decisão de escalar ou matar sai com menos de 50 conversões acumuladas. Abaixo disso, a recomendação padrão é aguardar mais dados.',
  },
  {
    n: '20%',
    nome: 'Teto por passo de escala',
    texto:
      'O aumento máximo de budget é 20% do valor atual. Dobrar budget reinicia o aprendizado da Meta e degrada a performance.',
  },
  {
    n: '48h',
    nome: 'Cooldown entre alterações',
    texto: 'Depois de qualquer mudança de budget, 48h de espera antes da próxima alteração no mesmo adset.',
  },
  {
    n: '95%',
    nome: 'Intervalo de Wilson',
    texto:
      'Taxas brutas não se comparam. Só há vencedor quando os intervalos de confiança de 95% não se sobrepõem.',
  },
]

export function fmt(n: number) {
  return n.toLocaleString('pt-BR')
}

export function fmtBRL(n: number) {
  return n > 0 ? 'R$ ' + fmt(n) : '—'
}
