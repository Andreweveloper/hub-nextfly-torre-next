import assert from 'node:assert/strict'
import test from 'node:test'
import { toWorkspaceLeads } from './cais47.js'
import { addCalendarEvent, addCampaign, addVocabularyTerm, addWorkspaceRequest, buildTrackingUrl, canAccessWorkspace, createCampaignFromTemplate, createWorkspace, filterIntegrationDirectory, filterWorkspaceLeads, getIntegrationDirectory, getMarketingToolDestinations, getWorkspaceOverview, resolveWorkspaceRedirect, saveOnboarding, saveTrackingLink, saveWorkspaceSettings, setCampaignStatus, setFunnelTarget, setWorkspaceLeadStage, signInWorkspace, signOutWorkspace, suggestCampaignFromPrompt, syncCais47Leads, toggleIntegration, toggleWorkspaceRequest } from './workspace-state.js'

test('maps Cais 47 leads by stable key without duplicates', () => {
  const leads = toWorkspaceLeads([
    { chave: '5547999999999', nome: 'Empresa Exemplo', segmento: 'Barbearia', cidade: 'Itajaí', telefone: '5547999999999', telefone_formatado: '(47) 99999-9999', tem_whatsapp: true, dor: 'Sem site.', mensagem: 'Olá.' },
    { chave: '5547999999999', nome: 'Empresa Exemplo Atualizada', segmento: 'Barbearia', cidade: 'Itajaí', telefone: '5547999999999', telefone_formatado: '(47) 99999-9999', tem_whatsapp: true, dor: 'Sem site.', mensagem: 'Olá.' },
  ])

  assert.equal(leads.length, 1)
  assert.equal(leads[0]?.id, '5547999999999')
  assert.equal(leads[0]?.source, 'Cais 47')
  assert.equal(leads[0]?.company, 'Barbearia')
  assert.equal(leads[0]?.role, 'Itajaí')
  assert.equal(leads[0]?.email, '(47) 99999-9999')
})

test('syncs Cais 47 leads into the workspace organization', () => {
  const synced = syncCais47Leads(createWorkspace(), [
    { chave: '5547988888888', nome: 'Empresa Local', segmento: 'Estética', cidade: 'Navegantes', telefone: '5547988888888', telefone_formatado: '(47) 98888-8888', tem_whatsapp: true, dor: 'Sem site.', mensagem: 'Olá.' },
  ])

  assert.equal(synced.settings.organizationName, 'Cais 47')
  assert.equal(synced.settings.workspaceSlug, 'cais-47')
  assert.equal(synced.leads.length, 1)
  assert.equal(synced.leads[0]?.id, '5547988888888')
})

test('creates an empty workspace ready for external data', () => {
  const workspace = createWorkspace()

  assert.deepEqual(workspace.campaigns, [])
  assert.deepEqual(workspace.leads, [])
  assert.deepEqual(workspace.events, [])
  assert.deepEqual(workspace.requests, [])
  assert.deepEqual(workspace.trackingLinks, [])
  assert.deepEqual(workspace.funnelTarget, { mql: 0, sqo: 0 })
})

test('adds a draft campaign with a stable generated id', () => {
  const workspace = createWorkspace()
  const next = addCampaign(workspace, {
    name: 'Spring launch',
    channel: 'Paid social',
    owner: 'Andrew Paulo',
  })

  assert.equal(next.campaigns.length, workspace.campaigns.length + 1)
  assert.equal(next.campaigns.at(-1)?.name, 'Spring launch')
  assert.equal(next.campaigns.at(-1)?.status, 'Draft')
  assert.match(next.campaigns.at(-1)?.id ?? '', /^campaign-/)
})

test('builds a UTM URL without losing existing query parameters', () => {
  const result = buildTrackingUrl({
    websiteUrl: 'https://nextfly.com.br/orcamento?ref=home',
    source: 'meta',
    medium: 'paid-social',
    campaign: 'spring_launch',
    term: 'barbearias',
    content: 'video_a',
  })

  assert.equal(result.ok, true)
  assert.equal(
    result.url,
    'https://nextfly.com.br/orcamento?ref=home&utm_source=meta&utm_medium=paid-social&utm_campaign=spring_launch&utm_term=barbearias&utm_content=video_a',
  )
})

test('rejects a UTM draft missing its campaign name', () => {
  const result = buildTrackingUrl({
    websiteUrl: 'https://nextfly.com.br',
    source: 'google',
    medium: 'cpc',
    campaign: '   ',
    term: '',
    content: '',
  })

  assert.deepEqual(result, { ok: false, error: 'Campaign is required.' })
})

test('updates MQL and SQO targets while keeping the remaining funnel data', () => {
  const workspace = createWorkspace()
  const next = setFunnelTarget(workspace, { mql: 72, sqo: 24 })

  assert.equal(next.funnelTarget.mql, 72)
  assert.equal(next.funnelTarget.sqo, 24)
  assert.equal(next.campaigns.length, workspace.campaigns.length)
})

test('adds a calendar event in date order', () => {
  const workspace = createWorkspace()
  const next = addCalendarEvent(workspace, {
    title: 'Launch retrospective',
    date: '2026-08-20',
    kind: 'Review',
  })

  assert.equal(next.events.at(-1)?.title, 'Launch retrospective')
  assert.equal(next.events.at(-1)?.date, '2026-08-20')
  assert.deepEqual(next.events.map((event) => event.date), [...next.events].map((event) => event.date).sort())
})

test('turns a campaign prompt into a usable campaign brief', () => {
  const brief = suggestCampaignFromPrompt('Launch a webinar for local barbershops in September')

  assert.equal(brief.name, 'Webinar - Local barbershops')
  assert.equal(brief.channel, 'Email')
  assert.ok(brief.checklist.includes('Create registration page'))
  assert.match(brief.summary, /September/i)
})

test('creates a draft workspace from the product launch template', () => {
  const workspace = createWorkspace()
  const next = createCampaignFromTemplate(workspace, 'Product launch')

  assert.equal(next.campaigns.at(-1)?.name, 'Product launch')
  assert.equal(next.campaigns.at(-1)?.channel, 'Paid social')
  assert.equal(next.campaigns.at(-1)?.status, 'Draft')
})

test('connects and disconnects an integration without duplicates', () => {
  const workspace = createWorkspace()
  const connected = toggleIntegration(workspace, 'Google Calendar')
  const disconnected = toggleIntegration(connected, 'Google Calendar')

  assert.deepEqual(connected.integrations, ['Google Calendar'])
  assert.deepEqual(disconnected.integrations, [])
})

test('creates and completes a workspace request without losing its metadata', () => {
  const workspace = createWorkspace()
  const added = addWorkspaceRequest(workspace, {
    title: 'Review launch messaging',
    requester: 'Creative',
  })
  const completed = toggleWorkspaceRequest(added, added.requests.at(-1)?.id ?? '')

  assert.equal(added.requests.at(-1)?.title, 'Review launch messaging')
  assert.equal(added.requests.at(-1)?.requester, 'Creative')
  assert.equal(completed.requests.at(-1)?.completed, true)
})

test('saves workspace settings with a safe slug fallback', () => {
  const workspace = createWorkspace()
  const next = saveWorkspaceSettings(workspace, {
    organizationName: 'Nextfly Growth',
    displayName: 'Andrew Paulo',
    workspaceSlug: '  Nextfly Torre  ',
  })

  assert.deepEqual(next.settings, {
    organizationName: 'Nextfly Growth',
    displayName: 'Andrew Paulo',
    workspaceSlug: 'nextfly-torre',
  })
})

test('filters leads and updates an individual lead stage', () => {
  const workspace = {
    ...createWorkspace(),
    leads: [{ id: 'lead-test', name: 'Test Lead', email: 'lead@example.com', company: 'Example', role: 'Owner', source: 'cais-47', channel: 'local', stage: 'Leads' as const, activity: 'now' }],
  }
  const matches = filterWorkspaceLeads(workspace, { query: 'test lead', source: 'All', stage: 'All' })
  const updated = setWorkspaceLeadStage(workspace, matches[0]?.id ?? '', 'SQL')

  assert.equal(matches.length, 1)
  assert.equal(matches[0]?.name, 'Test Lead')
  assert.equal(updated.leads.find((lead) => lead.id === matches[0]?.id)?.stage, 'SQL')
})

test('saves the four-step onboarding profile and marks it complete', () => {
  const workspace = createWorkspace()
  const next = saveOnboarding(workspace, {
    step: 4,
    market: 'Agency',
    channels: ['Paid social', 'Email'],
    teamName: 'Growth team',
    goal: 'Increase qualified pipeline',
  })

  assert.equal(next.onboarding.completed, true)
  assert.equal(next.onboarding.market, 'Agency')
  assert.deepEqual(next.onboarding.channels, ['Paid social', 'Email'])
  assert.equal(next.onboarding.teamName, 'Growth team')
})

test('starts a local email session without persisting a password', () => {
  const workspace = createWorkspace()
  const next = signInWorkspace(workspace, {
    email: 'andrew@nextfly.com.br',
    displayName: 'Andrew Paulo',
    provider: 'email',
  })

  assert.deepEqual(next.session, {
    authenticated: true,
    email: 'andrew@nextfly.com.br',
    displayName: 'Andrew Paulo',
    provider: 'email',
  })
  assert.equal('password' in next.session, false)
})

test('summarizes the live workspace for the weekly dashboard', () => {
  const overview = getWorkspaceOverview(createWorkspace())

  assert.equal(overview.activeCampaigns, 0)
  assert.equal(overview.openRequests, 0)
  assert.equal(overview.connectedIntegrations, 0)
  assert.equal(overview.nextEvent, null)
})

test('saves a generated tracking link once even when it is generated again', () => {
  const workspace = createWorkspace()
  const first = saveTrackingLink(workspace, {
    campaign: 'spring_launch',
    url: 'https://nextfly.com.br/?utm_source=meta&utm_medium=paid-social&utm_campaign=spring_launch',
  })
  const repeated = saveTrackingLink(first, {
    campaign: 'spring_launch',
    url: 'https://nextfly.com.br/?utm_source=meta&utm_medium=paid-social&utm_campaign=spring_launch',
  })

  assert.equal(first.trackingLinks.length, 1)
  assert.equal(repeated.trackingLinks.length, 1)
  assert.equal(repeated.trackingLinks[0]?.campaign, 'spring_launch')
})

test('updates a campaign status without changing the campaign identity', () => {
  const workspace = addCampaign(createWorkspace(), { name: 'Integration check', channel: 'Paid social', owner: 'Operator' })
  const campaign = workspace.campaigns[0]
  const next = setCampaignStatus(workspace, campaign.id, 'Active')

  assert.equal(next.campaigns[0]?.status, 'Active')
  assert.equal(next.campaigns[0]?.id, campaign.id)
  assert.equal(next.campaigns[0]?.name, campaign.name)
})

test('exposes the campaign tool map with routes for each core module', () => {
  const tools = getMarketingToolDestinations()

  assert.deepEqual(tools.map((tool) => tool.href), ['/tools/utm', '/funnel', '/campaigns', '/templates', '/tools/copilot', '/integrations'])
  assert.equal(tools.find((tool) => tool.href === '/tools/copilot')?.name, 'Campaign Copilot')
})

test('adds a normalized vocabulary term without duplicates', () => {
  const workspace = createWorkspace()
  const added = addVocabularyTerm(workspace, 'channels', ' TikTok Ads ')
  const repeated = addVocabularyTerm(added, 'channels', 'tiktok ads')

  assert.ok(added.vocabulary.channels.includes('tiktok-ads'))
  assert.equal(repeated.vocabulary.channels.filter((item) => item === 'tiktok-ads').length, 1)
})

test('requires a local session before a workspace route can be accessed', () => {
  const workspace = createWorkspace()
  const signedIn = signInWorkspace(workspace, { email: 'operator@nextfly.local', displayName: 'Operator', provider: 'email' })

  assert.equal(canAccessWorkspace(workspace), false)
  assert.equal(canAccessWorkspace(signedIn), true)
})

test('filters the integration directory by connection method and category', () => {
  const entries = getIntegrationDirectory()
  const oneClick = filterIntegrationDirectory(entries, { query: '', category: 'All', method: 'One-click connectors' })
  const crm = filterIntegrationDirectory(entries, { query: '', category: 'CRM', method: 'All' })

  assert.equal(oneClick.length, 4)
  assert.deepEqual(crm.map((entry) => entry.name), ['CRM (HubSpot)'])
})

test('keeps login redirects inside the local workspace', () => {
  assert.equal(resolveWorkspaceRedirect('/calendar'), '/calendar')
  assert.equal(resolveWorkspaceRedirect('https://example.com'), '/campaigns')
  assert.equal(resolveWorkspaceRedirect('//example.com'), '/campaigns')
})

test('signs out locally while retaining workspace records', () => {
  const signedIn = signInWorkspace(createWorkspace(), { email: 'operator@nextfly.local', displayName: 'Operator', provider: 'email' })
  const signedOut = signOutWorkspace(signedIn)

  assert.equal(canAccessWorkspace(signedOut), false)
  assert.equal(signedOut.campaigns.length, signedIn.campaigns.length)
  assert.equal(signedOut.session.email, '')
})
