export type CampaignStatus = 'Active' | 'Draft' | 'Ready'

export interface CampaignWorkspace {
  id: string
  name: string
  owner: string
  channel: string
  progress: number
  status: CampaignStatus
  updatedAt: string
}

export interface UtmDraft {
  websiteUrl: string
  source: string
  medium: string
  campaign: string
  term: string
  content: string
}

export interface FunnelTarget {
  mql: number
  sqo: number
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  kind: string
}

export interface WorkspaceRequest {
  id: string
  title: string
  requester: string
  completed: boolean
}

export interface WorkspaceSettings {
  organizationName: string
  displayName: string
  workspaceSlug: string
}

export interface WorkspaceOnboarding {
  step: 1 | 2 | 3 | 4
  completed: boolean
  market: string
  channels: string[]
  teamName: string
  goal: string
}

export interface WorkspaceSession {
  authenticated: boolean
  email: string
  displayName: string
  provider: 'email' | 'google' | null
}

export interface WorkspaceOverview {
  activeCampaigns: number
  openRequests: number
  connectedIntegrations: number
  nextEvent: CalendarEvent | null
}

export interface TrackingLink {
  id: string
  campaign: string
  url: string
  createdAt: string
}

export interface MarketingToolDestination {
  name: string
  href: string
  category: string
  tone: 'blue' | 'green' | 'cyan'
}

export interface WorkspaceVocabulary {
  channels: string[]
  trackingSources: string[]
  campaignTypes: string[]
}

export type IntegrationMethod = 'One-click connectors' | 'API key' | 'Per-user OAuth' | 'Webhooks'

export interface IntegrationDirectoryEntry {
  name: string
  category: string
  method: IntegrationMethod
  text: string
}

export type VocabularyGroup = keyof WorkspaceVocabulary

export type LeadStage = 'Leads' | 'MQL' | 'SQL' | 'Opps' | 'Won'

export interface WorkspaceLead {
  id: string
  name: string
  email: string
  company: string
  role: string
  source: string
  channel: string
  stage: LeadStage
  activity: string
}

export interface CampaignBrief {
  name: string
  channel: string
  summary: string
  checklist: string[]
}

export interface CampaignTemplate {
  name: string
  channel: string
  description: string
  tags: string[]
}

export interface WorkspaceState {
  campaigns: CampaignWorkspace[]
  funnelTarget: FunnelTarget
  events: CalendarEvent[]
  integrations: string[]
  requests: WorkspaceRequest[]
  settings: WorkspaceSettings
  leads: WorkspaceLead[]
  onboarding: WorkspaceOnboarding
  session: WorkspaceSession
  trackingLinks: TrackingLink[]
  vocabulary: WorkspaceVocabulary
}

export type TrackingUrlResult = { ok: true; url: string } | { ok: false; error: string }

export const campaignTemplates: CampaignTemplate[] = [
  { name: 'Product launch', channel: 'Paid social', description: 'Multi-week launch with teaser, launch day and follow-up.', tags: ['Launch', 'Paid social', 'Email'] },
  { name: 'Webinar', channel: 'Email', description: 'Promotion, registration, live delivery and replay nurture.', tags: ['Event', 'Email', 'LinkedIn'] },
  { name: 'Newsletter send', channel: 'Email', description: 'Single-send recurring template with audience filters and tracking.', tags: ['Recurring', 'Email'] },
  { name: 'Paid acquisition', channel: 'Paid social', description: 'Always-on paid sprint with creative rotation and budget tracking.', tags: ['Paid search', 'Paid social'] },
]

export function createWorkspace(): WorkspaceState {
  return {
    campaigns: [],
    funnelTarget: { mql: 0, sqo: 0 },
    events: [],
    integrations: [],
    requests: [],
    settings: {
      organizationName: 'Nextfy',
      displayName: '',
      workspaceSlug: 'nextfy',
    },
    leads: [],
    onboarding: {
      step: 1,
      completed: false,
      market: '',
      channels: [],
      teamName: '',
      goal: '',
    },
    session: {
      authenticated: false,
      email: '',
      displayName: '',
      provider: null,
    },
    trackingLinks: [],
    vocabulary: {
      channels: ['paid-search', 'paid-social', 'email', 'organic', 'partner', 'display', 'video', 'content', 'events'],
      trackingSources: ['google', 'meta', 'linkedin', 'twitter', 'newsletter', 'partner'],
      campaignTypes: ['launch', 'event', 'customer-success', 'field-event', 'third-party-event', 'webinar'],
    },
  }
}

export function syncCais47Leads(workspace: WorkspaceState, sourceLeads: Cais47Lead[]): WorkspaceState {
  const currentById = new Map(workspace.leads.map((lead) => [lead.id, lead]))
  const leads = toWorkspaceLeads(sourceLeads).map((lead) => {
    const current = currentById.get(lead.id)
    return current ? { ...lead, stage: current.stage, activity: current.activity } : lead
  })

  return {
    ...workspace,
    leads,
    settings: {
      ...workspace.settings,
      organizationName: 'Cais 47',
      workspaceSlug: 'cais-47',
    },
  }
}

export function addCampaign(
  workspace: WorkspaceState,
  input: Pick<CampaignWorkspace, 'name' | 'owner' | 'channel'>,
): WorkspaceState {
  const name = input.name.trim()
  if (!name) return workspace

  const id = `campaign-${slugify(name)}-${workspace.campaigns.length + 1}`
  const campaign: CampaignWorkspace = {
    id,
    name,
    owner: input.owner.trim() || 'Workspace member',
    channel: input.channel.trim() || 'Organic',
    progress: 0,
    status: 'Draft',
    updatedAt: 'Just now',
  }

  return { ...workspace, campaigns: [...workspace.campaigns, campaign] }
}

export function setCampaignStatus(workspace: WorkspaceState, id: string, status: CampaignStatus): WorkspaceState {
  if (!id.trim()) return workspace
  return {
    ...workspace,
    campaigns: workspace.campaigns.map((campaign) => campaign.id === id ? { ...campaign, status, updatedAt: 'Just now' } : campaign),
  }
}

export function createCampaignFromTemplate(workspace: WorkspaceState, templateName: string): WorkspaceState {
  const template = campaignTemplates.find((item) => item.name === templateName)
  if (!template) return workspace
  return addCampaign(workspace, { name: template.name, channel: template.channel, owner: 'Workspace member' })
}

export function setFunnelTarget(workspace: WorkspaceState, target: FunnelTarget): WorkspaceState {
  return {
    ...workspace,
    funnelTarget: {
      mql: clampTarget(target.mql),
      sqo: clampTarget(target.sqo),
    },
  }
}

export function addCalendarEvent(
  workspace: WorkspaceState,
  input: Pick<CalendarEvent, 'title' | 'date' | 'kind'>,
): WorkspaceState {
  const title = input.title.trim()
  const date = input.date.trim()
  if (!title || !date) return workspace

  const event: CalendarEvent = {
    id: `event-${slugify(title)}-${workspace.events.length + 1}`,
    title,
    date,
    kind: input.kind.trim() || 'Campaign',
  }
  const events = [...workspace.events, event].sort((left, right) => left.date.localeCompare(right.date))
  return { ...workspace, events }
}

export function toggleIntegration(workspace: WorkspaceState, name: string): WorkspaceState {
  const integration = name.trim()
  if (!integration) return workspace
  const integrations = workspace.integrations.includes(integration)
    ? workspace.integrations.filter((item) => item !== integration)
    : [...workspace.integrations, integration]
  return { ...workspace, integrations }
}

export function addWorkspaceRequest(
  workspace: WorkspaceState,
  input: Pick<WorkspaceRequest, 'title' | 'requester'>,
): WorkspaceState {
  const title = input.title.trim()
  if (!title) return workspace

  const requester = input.requester.trim() || 'Workspace member'
  const request: WorkspaceRequest = {
    id: `request-${slugify(title)}-${workspace.requests.length + 1}`,
    title,
    requester,
    completed: false,
  }
  return { ...workspace, requests: [...workspace.requests, request] }
}

export function toggleWorkspaceRequest(workspace: WorkspaceState, id: string): WorkspaceState {
  if (!id.trim()) return workspace
  return {
    ...workspace,
    requests: workspace.requests.map((request) => request.id === id ? { ...request, completed: !request.completed } : request),
  }
}

export function saveWorkspaceSettings(workspace: WorkspaceState, input: WorkspaceSettings): WorkspaceState {
  const organizationName = input.organizationName.trim() || workspace.settings.organizationName
  const displayName = input.displayName.trim() || workspace.settings.displayName
  const workspaceSlug = slugify(input.workspaceSlug) || workspace.settings.workspaceSlug
  return { ...workspace, settings: { organizationName, displayName, workspaceSlug } }
}

export function saveOnboarding(workspace: WorkspaceState, input: Omit<WorkspaceOnboarding, 'completed' | 'step'> & { step: number }): WorkspaceState {
  const step = clampOnboardingStep(input.step)
  const channels = [...new Set(input.channels.map((channel) => channel.trim()).filter(Boolean))]
  return {
    ...workspace,
    onboarding: {
      step,
      completed: step === 4,
      market: input.market.trim(),
      channels,
      teamName: input.teamName.trim(),
      goal: input.goal.trim(),
    },
  }
}

export function signInWorkspace(
  workspace: WorkspaceState,
  input: Pick<WorkspaceSession, 'email' | 'displayName' | 'provider'>,
): WorkspaceState {
  const email = input.email.trim().toLowerCase()
  if (!isEmail(email) || input.provider === null) return workspace
  const displayName = input.displayName.trim() || email.split('@')[0]
  return { ...workspace, session: { authenticated: true, email, displayName, provider: input.provider } }
}

export function signOutWorkspace(workspace: WorkspaceState): WorkspaceState {
  return { ...workspace, session: { authenticated: false, email: '', displayName: '', provider: null } }
}

export function canAccessWorkspace(workspace: WorkspaceState) {
  return workspace.session.authenticated && Boolean(workspace.session.email)
}

export function resolveWorkspaceRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/campaigns'
  return value
}

export function getWorkspaceOverview(workspace: WorkspaceState): WorkspaceOverview {
  return {
    activeCampaigns: workspace.campaigns.filter((campaign) => campaign.status === 'Active').length,
    openRequests: workspace.requests.filter((request) => !request.completed).length,
    connectedIntegrations: workspace.integrations.length,
    nextEvent: workspace.events[0] ?? null,
  }
}

export function saveTrackingLink(
  workspace: WorkspaceState,
  input: Pick<TrackingLink, 'campaign' | 'url'>,
): WorkspaceState {
  const campaign = input.campaign.trim()
  const url = input.url.trim()
  if (!campaign || !url || workspace.trackingLinks.some((link) => link.url === url)) return workspace
  return {
    ...workspace,
    trackingLinks: [{ id: `tracking-${slugify(campaign)}-${workspace.trackingLinks.length + 1}`, campaign, url, createdAt: 'Just now' }, ...workspace.trackingLinks],
  }
}

export function getMarketingToolDestinations(): MarketingToolDestination[] {
  return [
    { name: 'UTM Builder', href: '/tools/utm', category: 'tracking', tone: 'blue' },
    { name: 'Funnel targets', href: '/funnel', category: 'analytics', tone: 'cyan' },
    { name: 'Campaign-in-a-box', href: '/campaigns', category: 'workflow', tone: 'green' },
    { name: 'Playbooks', href: '/templates', category: 'templates', tone: 'blue' },
    { name: 'Campaign Copilot', href: '/tools/copilot', category: 'ai assistant', tone: 'blue' },
    { name: 'Connectors', href: '/integrations', category: 'integrations', tone: 'cyan' },
  ]
}

export function addVocabularyTerm(workspace: WorkspaceState, group: VocabularyGroup, term: string): WorkspaceState {
  const normalized = slugify(term)
  if (normalized === 'untitled' || workspace.vocabulary[group].includes(normalized)) return workspace
  return {
    ...workspace,
    vocabulary: { ...workspace.vocabulary, [group]: [...workspace.vocabulary[group], normalized] },
  }
}

export function removeVocabularyTerm(workspace: WorkspaceState, group: VocabularyGroup, term: string): WorkspaceState {
  const normalized = term.trim()
  if (!normalized) return workspace
  return {
    ...workspace,
    vocabulary: { ...workspace.vocabulary, [group]: workspace.vocabulary[group].filter((item) => item !== normalized) },
  }
}

export function getIntegrationDirectory(): IntegrationDirectoryEntry[] {
  return [
    { name: 'CRM (HubSpot)', category: 'CRM', method: 'One-click connectors', text: 'Pull campaign contacts and send qualified handoffs into the workspace.' },
    { name: 'Google Calendar', category: 'Productivity', method: 'One-click connectors', text: 'Sync launch dates and milestones to a shared team calendar.' },
    { name: 'Google Sheets', category: 'Productivity', method: 'One-click connectors', text: 'Mirror campaign status for an operational spreadsheet view.' },
    { name: 'Google Drive', category: 'Storage', method: 'One-click connectors', text: 'Attach briefs, decks and assets to a campaign workspace.' },
    { name: 'Meta Ads', category: 'Ads', method: 'API key', text: 'Bring spend and conversion signals into the traffic decision board.' },
    { name: 'Slack', category: 'Comms', method: 'Webhooks', text: 'Send requests and launch alerts to the team channel.' },
    { name: 'LinkedIn Ads', category: 'Ads', method: 'Per-user OAuth', text: 'Bring account-level campaign activity into the operating workspace.' },
  ]
}

export function filterIntegrationDirectory(
  entries: IntegrationDirectoryEntry[],
  filters: { query: string; category: string; method: 'All' | IntegrationMethod },
): IntegrationDirectoryEntry[] {
  const query = filters.query.trim().toLowerCase()
  return entries.filter((entry) => (!query || `${entry.name} ${entry.category}`.toLowerCase().includes(query))
    && (filters.category === 'All' || entry.category === filters.category)
    && (filters.method === 'All' || entry.method === filters.method))
}

export function filterWorkspaceLeads(
  workspace: WorkspaceState,
  filters: { query: string; source: string; stage: string },
): WorkspaceLead[] {
  const query = filters.query.trim().toLowerCase()
  return workspace.leads.filter((lead) => {
    const haystack = `${lead.name} ${lead.email} ${lead.company} ${lead.role}`.toLowerCase()
    return (!query || haystack.includes(query))
      && (filters.source === 'All' || lead.source === filters.source)
      && (filters.stage === 'All' || lead.stage === filters.stage)
  })
}

export function setWorkspaceLeadStage(workspace: WorkspaceState, id: string, stage: LeadStage): WorkspaceState {
  if (!id.trim()) return workspace
  return { ...workspace, leads: workspace.leads.map((lead) => lead.id === id ? { ...lead, stage } : lead) }
}

export function suggestCampaignFromPrompt(prompt: string): CampaignBrief {
  const normalized = prompt.trim().replace(/\s+/g, ' ')
  const lower = normalized.toLowerCase()
  const isWebinar = /webinar|workshop|live session/.test(lower)
  const isNewsletter = /newsletter|email/.test(lower)
  const isPaid = /paid|ads|meta|google ads/.test(lower)
  const audience = readAudience(normalized) || 'your audience'
  const period = readPeriod(normalized) || 'the next campaign window'
  const format = isWebinar ? 'Webinar' : isNewsletter ? 'Newsletter' : isPaid ? 'Paid acquisition' : 'Campaign'
  const channel = isWebinar || isNewsletter ? 'Email' : isPaid ? 'Paid social' : 'Organic'

  return {
    name: `${format} - ${sentenceCase(audience)}`,
    channel,
    summary: `${format} for ${audience}, planned for ${period}.`,
    checklist: isWebinar
      ? ['Create registration page', 'Write invite email', 'Schedule reminder sequence', 'Prepare replay follow-up']
      : isNewsletter
        ? ['Define audience', 'Write subject line', 'Review tracking link', 'Schedule send']
        : ['Write campaign brief', 'Create tracking link', 'Set launch date', 'Review performance target'],
  }
}

export function buildTrackingUrl(draft: UtmDraft): TrackingUrlResult {
  const required: Array<[string, string]> = [
    ['Website URL', draft.websiteUrl],
    ['Source', draft.source],
    ['Medium', draft.medium],
    ['Campaign', draft.campaign],
  ]
  const missing = required.find(([, value]) => !value.trim())
  if (missing) return { ok: false, error: `${missing[0]} is required.` }

  let url: URL
  try {
    url = new URL(draft.websiteUrl.trim())
  } catch {
    return { ok: false, error: 'Website URL must be valid.' }
  }

  url.searchParams.set('utm_source', draft.source.trim())
  url.searchParams.set('utm_medium', draft.medium.trim())
  url.searchParams.set('utm_campaign', draft.campaign.trim())
  setOptionalParam(url, 'utm_term', draft.term)
  setOptionalParam(url, 'utm_content', draft.content)

  return { ok: true, url: url.toString() }
}

function setOptionalParam(url: URL, name: string, value: string) {
  const trimmed = value.trim()
  if (trimmed) url.searchParams.set(name, trimmed)
  else url.searchParams.delete(name)
}

function clampTarget(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value))
}

function clampOnboardingStep(value: number): WorkspaceOnboarding['step'] {
  return Math.min(4, Math.max(1, Math.round(value))) as WorkspaceOnboarding['step']
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled'
}

function readAudience(prompt: string) {
  const match = prompt.match(/\bfor\s+(.+?)(?=\s+(?:in|on|during|this|next|by)\b|$)/i)
  return match?.[1]?.trim() || ''
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function readPeriod(prompt: string) {
  const month = prompt.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i)
  if (month) return sentenceCase(month[1])
  if (/\bnext month\b/i.test(prompt)) return 'next month'
  if (/\bthis month\b/i.test(prompt)) return 'this month'
  return ''
}

function sentenceCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}
import { toWorkspaceLeads, type Cais47Lead } from './cais47'

export type { Cais47Lead } from './cais47'
