'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Check, Clipboard, Link2, Plus, Search, Target } from 'lucide-react'
import {
  addCalendarEvent,
  addCampaign,
  addVocabularyTerm,
  addWorkspaceRequest,
  buildTrackingUrl,
  campaignTemplates,
  createCampaignFromTemplate,
  createWorkspace,
  filterWorkspaceLeads,
  filterIntegrationDirectory,
  getIntegrationDirectory,
  getWorkspaceOverview,
  getMarketingToolDestinations,
  removeVocabularyTerm,
  resolveWorkspaceRedirect,
  saveOnboarding,
  saveTrackingLink,
  saveWorkspaceSettings,
  setCampaignStatus,
  setFunnelTarget,
  setWorkspaceLeadStage,
  signInWorkspace,
  syncCais47Leads,
  suggestCampaignFromPrompt,
  toggleIntegration,
  toggleWorkspaceRequest,
  type FunnelTarget,
  type IntegrationMethod,
  type CampaignStatus,
  type Cais47Lead,
  type LeadStage,
  type UtmDraft,
  type VocabularyGroup,
  type WorkspaceState,
} from '@/lib/workspace-state'

const storageKey = 'nextfy-hub:workspace-v3'
const legacyStorageKey = 'nextfly-torre:workspace-v1'
const previousStorageKey = 'nextfy-hub:workspace-v2'

function Button({ children, primary = false, onClick, type = 'button' }: { children: React.ReactNode; primary?: boolean; onClick?: () => void; type?: 'button' | 'submit' }) {
  return <button className={`button button-${primary ? 'primary' : 'ghost'}`} type={type} onClick={onClick}>{children}</button>
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`panel panel-pad ${className}`}>{children}</section>
}

function PageTitle({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: React.ReactNode }) {
  return <header className="page-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div>{action ? <div className="title-actions">{action}</div> : null}</header>
}

function formatVocabularyTerm(value: string) {
  return value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(createWorkspace)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      // Discard the previous demo workspace before the external source is connected.
      window.localStorage.removeItem(legacyStorageKey)
      window.localStorage.removeItem(previousStorageKey)
      const saved = window.localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<WorkspaceState>
        if (Array.isArray(parsed.campaigns) && parsed.funnelTarget) {
          setWorkspace({
            campaigns: parsed.campaigns,
            funnelTarget: parsed.funnelTarget,
            events: Array.isArray(parsed.events) ? parsed.events : createWorkspace().events,
            integrations: Array.isArray(parsed.integrations) ? parsed.integrations : [],
            requests: Array.isArray(parsed.requests) ? parsed.requests : createWorkspace().requests,
            settings: parsed.settings ?? createWorkspace().settings,
            leads: Array.isArray(parsed.leads) ? parsed.leads : createWorkspace().leads,
            onboarding: parsed.onboarding ?? createWorkspace().onboarding,
            session: parsed.session ?? createWorkspace().session,
            trackingLinks: Array.isArray(parsed.trackingLinks) ? parsed.trackingLinks : createWorkspace().trackingLinks,
            vocabulary: parsed.vocabulary ?? createWorkspace().vocabulary,
          })
        }
      }
    } catch {
      window.localStorage.removeItem(storageKey)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void fetch('/api/cais47/leads', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load Cais 47 leads.')))
      .then((payload: { leads?: Cais47Lead[] }) => {
        if (!cancelled && Array.isArray(payload.leads)) {
          setWorkspace((current) => syncCais47Leads(current, payload.leads ?? []))
        }
      })
      .catch(() => undefined)

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(storageKey, JSON.stringify(workspace))
  }, [hydrated, workspace])

  return [workspace, setWorkspace, hydrated] as const
}

export function CampaignWorkspacePage({ notify }: { notify: (message: string) => void }) {
  const [workspace, setWorkspace] = useWorkspace()
  const [composerOpen, setComposerOpen] = useState(false)
  const [name, setName] = useState('')
  const [channel, setChannel] = useState('Paid social')
  const [owner, setOwner] = useState('')

  const createCampaign = () => {
    if (!name.trim()) {
      notify('Campaign name is required.')
      return
    }

    setWorkspace((current) => addCampaign(current, { name, channel, owner }))
    setName('')
    setComposerOpen(false)
    notify('Campaign workspace created.')
  }

  return <>
    <PageTitle eyebrow="CAMPAIGNS / WORKSPACE" title="Campaigns that stay connected." text="Create a workspace, give it a channel and keep its progress visible from the first brief to launch." action={<Button primary onClick={() => setComposerOpen((open) => !open)}><Plus size={15} /> New campaign</Button>} />
    {composerOpen ? <Panel className="campaign-composer"><div className="panel-heading"><div><div className="panel-kicker">NEW WORKSPACE</div><h2>Name the campaign</h2></div><Button onClick={() => setComposerOpen(false)}>Cancel</Button></div><form className="form-stack" onSubmit={(event) => { event.preventDefault(); createCampaign() }}><label className="form-label">Campaign name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Spring launch" /></label><div className="two-col"><label className="form-label">Channel<select className="select-control" value={channel} onChange={(event) => setChannel(event.target.value)}>{workspace.vocabulary.channels.map((item) => <option key={item}>{formatVocabularyTerm(item)}</option>)}</select></label><label className="form-label">Owner<input value={owner} onChange={(event) => setOwner(event.target.value)} /></label></div><div className="modal-actions"><Button primary type="submit">Create workspace <ArrowRight size={14} /></Button></div></form></Panel> : null}
    <Panel><div className="panel-heading"><div><div className="panel-kicker">ALL CAMPAIGNS</div><h2>{workspace.campaigns.length} campaign workspaces</h2><p>Stored locally in this browser until a backend is connected.</p></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Campaign</th><th>Owner</th><th>Channel</th><th>Progress</th><th>Status</th></tr></thead><tbody>{workspace.campaigns.map((campaign) => <tr key={campaign.id}><td><strong>{campaign.name}</strong><small>Updated {campaign.updatedAt} · launch checklist</small></td><td>{campaign.owner}</td><td>{campaign.channel}</td><td><div className="progress"><span style={{ width: `${campaign.progress}%` }} /></div></td><td><select aria-label={`Status for ${campaign.name}`} className="select-control" value={campaign.status} onChange={(event) => { setWorkspace((current) => setCampaignStatus(current, campaign.id, event.target.value as CampaignStatus)); notify(`${campaign.name} marked as ${event.target.value}.`) }}><option>Draft</option><option>Active</option><option>Ready</option></select></td></tr>)}</tbody></table></div></Panel>
  </>
}

export function ThisWeekWorkspacePage() {
  const [workspace] = useWorkspace()
  const overview = getWorkspaceOverview(workspace)
  const currentLeads = workspace.leads.filter((lead) => lead.stage === 'MQL' || lead.stage === 'SQL').length

  return <>
    <PageTitle eyebrow="WORKSPACE / THIS WEEK" title="The operating week at a glance." text="The next useful campaign, handoff and workspace decision, gathered in one place." />
    <div className="stat-grid"><div className="stat-card"><div className="stat-label"><span>Active campaigns</span><span className="color-blue">●</span></div><div className="stat-value">{overview.activeCampaigns}</div><div className="stat-note">Workspaces in motion</div></div><div className="stat-card"><div className="stat-label"><span>Qualified leads</span><span className="color-emerald">●</span></div><div className="stat-value">{currentLeads}</div><div className="stat-note">MQL and SQL pipeline</div></div><div className="stat-card"><div className="stat-label"><span>Open requests</span><span className="color-pink">●</span></div><div className="stat-value">{overview.openRequests}</div><div className="stat-note">Need a decision</div></div><div className="stat-card"><div className="stat-label"><span>Integrations</span><span className="color-amber">●</span></div><div className="stat-value">{overview.connectedIntegrations}</div><div className="stat-note">Connected locally</div></div></div>
    <div className="two-col"><Panel><div className="panel-heading"><div><div className="panel-kicker">NEXT UP</div><h2>{overview.nextEvent?.title ?? 'No events scheduled'}</h2><p>{overview.nextEvent ? `${overview.nextEvent.date} · ${overview.nextEvent.kind}` : 'Create an event to anchor the campaign timeline.'}</p></div><a href="/calendar" className="button button-ghost">Open calendar <ArrowRight size={14} /></a></div><div className="list">{workspace.events.slice(0, 3).map((event) => <div className="list-row" key={event.id}><span className="list-icon"><span className="mono">{event.date.slice(8)}</span></span><div className="list-main"><strong>{event.title}</strong><span>{event.kind} · {event.date}</span></div></div>)}</div></Panel><Panel><div className="panel-heading"><div><div className="panel-kicker">QUICK ACTIONS</div><h2>Pick up where work is moving.</h2></div></div><div className="quick-grid"><a className="quick-action" href="/campaigns"><Target size={17} className="color-blue" /><span>Campaigns<small>{workspace.campaigns.length} workspaces</small></span></a><a className="quick-action" href="/leads"><Target size={17} className="color-emerald" /><span>Review leads<small>{currentLeads} qualified</small></span></a><a className="quick-action" href="/requests"><Check size={17} className="color-pink" /><span>Requests<small>{overview.openRequests} open</small></span></a><a className="quick-action" href="/setup"><Check size={17} className="color-amber" /><span>Workspace setup<small>{workspace.onboarding.completed ? 'Complete' : `Step ${workspace.onboarding.step} of 4`}</small></span></a></div></Panel></div>
  </>
}

const emptyUtm: UtmDraft = { websiteUrl: 'https://nextfly.com.br/orcamento', source: 'meta', medium: 'paid-social', campaign: '', term: '', content: '' }

export function UtmBuilderPage({ notify }: { notify: (message: string) => void }) {
  const [workspace, setWorkspace] = useWorkspace()
  const [draft, setDraft] = useState<UtmDraft>(emptyUtm)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const update = (field: keyof UtmDraft, value: string) => setDraft((current) => ({ ...current, [field]: value }))
  const build = () => {
    const result = buildTrackingUrl(draft)
    if (!result.ok) {
      setOutput('')
      setError(result.error)
      return
    }
    setError('')
    setOutput(result.url)
    setWorkspace((current) => saveTrackingLink(current, { campaign: draft.campaign, url: result.url }))
  }
  const copy = async () => {
    if (!output) return
    await navigator.clipboard?.writeText(output)
    notify('Tracking link copied.')
  }

  return <>
    <PageTitle eyebrow="MARKETING TOOLS / UTM BUILDER" title="Tracking, without drift." text="Generate taxonomy-checked campaign links that preserve the existing destination URL and make every source legible." action={<Button primary onClick={build}><Link2 size={15} /> Build link</Button>} />
    <div className="two-col"><Panel><div className="panel-heading"><div><div className="panel-kicker">LINK INPUTS</div><h2>Campaign parameters</h2><p>Source, medium and campaign are required.</p></div></div><div className="form-stack"><label className="form-label">Website URL<input value={draft.websiteUrl} onChange={(event) => update('websiteUrl', event.target.value)} placeholder="https://example.com" /></label><div className="two-col"><label className="form-label">Source<input value={draft.source} onChange={(event) => update('source', event.target.value)} placeholder="meta" /></label><label className="form-label">Medium<input value={draft.medium} onChange={(event) => update('medium', event.target.value)} placeholder="paid-social" /></label></div><label className="form-label">Campaign<input value={draft.campaign} onChange={(event) => update('campaign', event.target.value)} placeholder="spring_launch" /></label><div className="two-col"><label className="form-label">Term<input value={draft.term} onChange={(event) => update('term', event.target.value)} placeholder="Optional" /></label><label className="form-label">Content<input value={draft.content} onChange={(event) => update('content', event.target.value)} placeholder="Optional" /></label></div><Button primary onClick={build}>Generate tracking URL <ArrowRight size={14} /></Button></div></Panel><Panel><div className="panel-heading"><div><div className="panel-kicker">OUTPUT</div><h2>Ready to share</h2><p>The builder keeps any existing query string intact.</p></div></div>{error ? <div className="empty-state" role="alert">{error}</div> : output ? <><p className="mono" style={{ color: 'var(--blue-bright)', lineHeight: 1.7, overflowWrap: 'anywhere' }}>{output}</p><div className="modal-actions"><Button onClick={() => { setOutput(''); setError('') }}>Reset</Button><Button primary onClick={() => void copy()}><Clipboard size={14} /> Copy link</Button></div></> : <div className="empty-state"><Link2 size={30} className="color-blue" /><p>Complete the fields and generate a link to see it here.</p></div>}<div className="detail-block"><h3>Recent tracking links</h3>{workspace.trackingLinks.length ? <div className="list">{workspace.trackingLinks.slice(0, 3).map((link) => <div className="list-row" key={link.id}><span className="list-icon"><Link2 size={14} /></span><div className="list-main"><strong>{link.campaign}</strong><span className="mono">{link.url}</span></div></div>)}</div> : <p className="stat-note">Generated links are saved here for this local workspace.</p>}</div></Panel></div>
  </>
}

export function FunnelTargetsPage({ notify }: { notify: (message: string) => void }) {
  const [workspace, setWorkspace] = useWorkspace()
  const [target, setTarget] = useState<FunnelTarget>(workspace.funnelTarget)

  useEffect(() => setTarget(workspace.funnelTarget), [workspace.funnelTarget])
  const save = () => {
    setWorkspace((current) => setFunnelTarget(current, target))
    notify('Funnel targets saved.')
  }

  return <>
    <PageTitle eyebrow="FUNNEL / TARGETS" title="Set the pace." text="Keep MQL and SQO targets close to the pipeline so the team can see whether campaign output is moving fast enough." action={<Button primary onClick={save}><Check size={15} /> Save targets</Button>} />
    <div className="stat-grid"><div className="stat-card"><div className="stat-label"><span>Current MQL</span><span className="color-blue">●</span></div><div className="stat-value">48</div><div className="stat-note">{Math.round(48 / Math.max(1, workspace.funnelTarget.mql) * 100)}% of target</div></div><div className="stat-card"><div className="stat-label"><span>Current SQO</span><span className="color-pink">●</span></div><div className="stat-value">24</div><div className="stat-note">{Math.round(24 / Math.max(1, workspace.funnelTarget.sqo) * 100)}% of target</div></div><div className="stat-card"><div className="stat-label"><span>MQL target</span><span className="color-emerald">●</span></div><div className="stat-value">{workspace.funnelTarget.mql}</div><div className="stat-note">This campaign period</div></div><div className="stat-card"><div className="stat-label"><span>SQO target</span><span className="color-amber">●</span></div><div className="stat-value">{workspace.funnelTarget.sqo}</div><div className="stat-note">This campaign period</div></div></div>
    <div className="two-col"><Panel><div className="panel-heading"><div><div className="panel-kicker">TARGETS</div><h2>Set funnel goals</h2><p>Targets are stored locally and carried across app routes.</p></div></div><div className="form-stack"><label className="form-label">MQL target<input type="number" min="0" value={target.mql} onChange={(event) => setTarget((current) => ({ ...current, mql: Number(event.target.value) }))} /></label><label className="form-label">SQO target<input type="number" min="0" value={target.sqo} onChange={(event) => setTarget((current) => ({ ...current, sqo: Number(event.target.value) }))} /></label><Button primary onClick={save}>Save targets <ArrowRight size={14} /></Button></div></Panel><Panel><div className="panel-heading"><div><div className="panel-kicker">PACING</div><h2>Where the pressure is</h2></div></div><div className="list"><div className="list-row"><span className="list-icon"><Target size={15} /></span><div className="list-main"><strong>MQL target</strong><span>48 current / {workspace.funnelTarget.mql} target</span><div className="progress" style={{ marginTop: 8 }}><span style={{ width: `${Math.min(100, 48 / Math.max(1, workspace.funnelTarget.mql) * 100)}%` }} /></div></div></div><div className="list-row"><span className="list-icon"><Target size={15} /></span><div className="list-main"><strong>SQO target</strong><span>24 current / {workspace.funnelTarget.sqo} target</span><div className="progress" style={{ marginTop: 8 }}><span style={{ width: `${Math.min(100, 24 / Math.max(1, workspace.funnelTarget.sqo) * 100)}%` }} /></div></div></div></div></Panel></div>
  </>
}

export function CalendarWorkspacePage({ notify }: { notify: (message: string) => void }) {
  const [workspace, setWorkspace] = useWorkspace()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('2026-08-18')
  const [kind, setKind] = useState('Campaign')

  const createEvent = () => {
    if (!title.trim()) {
      notify('Event title is required.')
      return
    }
    setWorkspace((current) => addCalendarEvent(current, { title, date, kind }))
    setTitle('')
    notify('Calendar event added.')
  }

  return <>
    <PageTitle eyebrow="CALENDAR / SHARED WORKSPACE" title="Every launch has a place." text="Keep launches, reviews and sends in one calendar so campaign timing stays visible to the whole workspace." action={<Button primary onClick={createEvent}><Plus size={15} /> New event</Button>} />
    <div className="two-col"><Panel><div className="panel-heading"><div><div className="panel-kicker">ADD EVENT</div><h2>Put the next moment on the board</h2></div></div><form className="form-stack" onSubmit={(event) => { event.preventDefault(); createEvent() }}><label className="form-label">Event title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Campaign kickoff" /></label><div className="two-col"><label className="form-label">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="form-label">Type<select className="select-control" value={kind} onChange={(event) => setKind(event.target.value)}><option>Campaign</option><option>Launch</option><option>Review</option><option>Email</option></select></label></div><Button primary type="submit">Add to calendar <ArrowRight size={14} /></Button></form></Panel><Panel><div className="panel-heading"><div><div className="panel-kicker">UP NEXT</div><h2>Shared calendar</h2><p>{workspace.events.length} events currently scheduled.</p></div></div><div className="list">{workspace.events.map((event) => <div className="list-row" key={event.id}><span className="list-icon"><span className="mono">{event.date.slice(8)}</span></span><div className="list-main"><strong>{event.title}</strong><span>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${event.date}T12:00:00`))}</span></div><span className={`badge ${event.kind === 'Launch' ? 'badge-green' : event.kind === 'Review' ? 'badge-pink' : 'badge-blue'}`}>{event.kind}</span></div>)}</div></Panel></div>
  </>
}

export function CampaignCopilotPage({ notify }: { notify: (message: string) => void }) {
  const [workspace, setWorkspace] = useWorkspace()
  const [prompt, setPrompt] = useState('Launch a webinar for local barbershops in September')
  const [brief, setBrief] = useState(() => suggestCampaignFromPrompt(prompt))

  const generate = () => {
    if (!prompt.trim()) {
      notify('Describe the campaign first.')
      return
    }
    setBrief(suggestCampaignFromPrompt(prompt))
  }

  const createCampaign = () => {
    setWorkspace((current) => addCampaign(current, { name: brief.name, channel: brief.channel, owner: 'Andrew Paulo' }))
    notify('Copilot brief created as a campaign workspace.')
  }

  return <>
    <PageTitle eyebrow="AI TOOLS / CAMPAIGN COPILOT" title="Turn a request into a campaign." text="Describe the audience and moment. The local copilot gives you a campaign name, channel and starter checklist you can turn into a workspace." />
    <div className="two-col"><Panel><div className="panel-heading"><div><div className="panel-kicker">YOUR REQUEST</div><h2>What do you want to launch?</h2></div></div><label className="form-label">Campaign brief<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe a campaign, audience and timing" /></label><div className="modal-actions"><Button primary onClick={generate}>Generate brief <ArrowRight size={14} /></Button></div></Panel><Panel><div className="panel-heading"><div><div className="panel-kicker">CAMPAIGN BRIEF</div><h2>{brief.name}</h2><p>{brief.summary}</p></div></div><div className="metric-line"><span>Suggested channel</span><strong>{brief.channel}</strong></div><div className="detail-block"><h3>Starter checklist</h3><ul className="detail-list">{brief.checklist.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="modal-actions"><span className="stat-note">{workspace.campaigns.length} workspaces stored locally</span><Button primary onClick={createCampaign}><Plus size={14} /> Create workspace</Button></div></Panel></div>
  </>
}

export function MarketingToolsHubPage() {
  const tools = getMarketingToolDestinations()
  const positions = ['node-one', 'node-two', 'center', 'node-four', 'node-five', 'node-six']

  return <>
    <PageTitle eyebrow="MARKETING TOOLS / MAP" title="Find the next useful tool." text="The workspace map keeps campaign creation, tracking, playbooks and connected operations in one visual surface." />
    <section className="hex-zone" aria-label="Marketing tools map">{tools.map((tool, index) => <a className={`hex-node ${positions[index]} ${tool.tone === 'green' ? 'green' : tool.tone === 'cyan' ? 'cyan' : ''}`} href={tool.href} key={tool.href}><Target size={19} /><strong>{tool.name}</strong><small>{tool.category}</small></a>)}</section>
    <div className="tool-list">{tools.map((tool) => <a className="tool-chip" href={tool.href} key={tool.href}>{tool.name} <ArrowRight size={11} /></a>)}</div>
  </>
}

export function TemplateLibraryPage({ notify }: { notify: (message: string) => void }) {
  const [workspace, setWorkspace] = useWorkspace()
  const useTemplate = (name: string) => {
    setWorkspace((current) => createCampaignFromTemplate(current, name))
    notify(`${name} created as a draft workspace.`)
  }

  return <>
    <PageTitle eyebrow="TEMPLATES / PLAYBOOKS" title="Start from a playbook." text="Skip the blank page. Each template creates a campaign workspace with a suggested channel and a clean starting point." />
    <div className="template-grid">{campaignTemplates.map((template) => <article className="template-card" key={template.name}><div className="template-top"><span className="agent-avatar"><Target size={19} /></span><span className="badge badge-blue">Starter</span></div><h3>{template.name}</h3><p>{template.description}</p><div className="tool-list">{template.tags.map((tag) => <span className="tool-chip" key={tag}>{tag}</span>)}</div><div className="card-footer"><span className="stat-note">{workspace.campaigns.length} active local workspaces</span><button onClick={() => useTemplate(template.name)}>Use this template <ArrowRight size={13} /></button></div></article>)}</div>
  </>
}

export function IntegrationDirectoryPage({ notify }: { notify: (message: string) => void }) {
  const [workspace, setWorkspace] = useWorkspace()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [method, setMethod] = useState<'All' | IntegrationMethod>('All')
  const directory = getIntegrationDirectory()
  const filtered = filterIntegrationDirectory(directory, { query, category, method })
  const categories = ['All', ...new Set(directory.map((item) => item.category))]
  const methods: Array<'All' | IntegrationMethod> = ['All', 'One-click connectors', 'API key', 'Per-user OAuth', 'Webhooks']

  return <>
    <PageTitle eyebrow="INTEGRATIONS / CONNECTORS" title="Wire up the workspace." text="Keep a local record of the connectors your operating system depends on. OAuth and API credentials can be added later without changing this flow." />
    <div className="tabs">{methods.map((item) => <button className={`tab ${method === item ? 'active' : ''}`} onClick={() => setMethod(item)} key={item}>{item}</button>)}</div>
    <div className="toolbar"><div className="search-box"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search integrations" /></div>{categories.map((item) => <button className={`tab ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
    <div className="integration-grid">{filtered.map((integration) => { const connected = workspace.integrations.includes(integration.name); return <article className="integration-card" key={integration.name}><div className="integration-top"><span className="agent-avatar"><Link2 size={19} /></span><span className={`badge ${connected ? 'badge-green' : 'badge-blue'}`}>{connected ? 'Connected' : integration.method}</span></div><h3>{integration.name}</h3><div className="card-eyebrow">{integration.category}</div><p style={{ marginTop: 12 }}>{integration.text}</p><div className="card-footer"><span className="stat-note">{connected ? 'Saved locally' : integration.method}</span><button onClick={() => { setWorkspace((current) => toggleIntegration(current, integration.name)); notify(connected ? `${integration.name} disconnected.` : `${integration.name} connected locally.`) }}>{connected ? 'Disconnect' : 'Connect'} <ArrowRight size={13} /></button></div></article> })}</div>{filtered.length === 0 ? <div className="empty-state">No connectors match these filters.</div> : null}
  </>
}

export function RequestsWorkspacePage({ notify }: { notify: (message: string) => void }) {
  const [workspace, setWorkspace] = useWorkspace()
  const [title, setTitle] = useState('')
  const [requester, setRequester] = useState('')
  const openRequests = workspace.requests.filter((request) => !request.completed)

  const createRequest = () => {
    if (!title.trim()) {
      notify('Request title is required.')
      return
    }
    setWorkspace((current) => addWorkspaceRequest(current, { title, requester }))
    setTitle('')
    notify('Request added to the workspace.')
  }

  return <>
    <PageTitle eyebrow="REQUESTS / INBOX" title="A quiet inbox for useful asks." text="Requests are visible, assignable and easy to close. Nothing useful should disappear in a chat thread." />
    <div className="two-col"><Panel><div className="panel-heading"><div><div className="panel-kicker">NEW REQUEST</div><h2>Put the work on the board</h2></div></div><form className="form-stack" onSubmit={(event) => { event.preventDefault(); createRequest() }}><label className="form-label">Request title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Review landing page copy" /></label><label className="form-label">Requester<input value={requester} onChange={(event) => setRequester(event.target.value)} placeholder="Andrew" /></label><Button primary type="submit"><Plus size={14} /> Add request</Button></form></Panel><Panel><div className="panel-heading"><div><div className="panel-kicker">INBOX</div><h2>{openRequests.length} open requests</h2><p>Completion state is stored locally and shared across the functional routes.</p></div></div><div className="checklist">{workspace.requests.map((request) => <label className={`check-item ${request.completed ? 'done' : ''}`} key={request.id}><input type="checkbox" checked={request.completed} onChange={() => { setWorkspace((current) => toggleWorkspaceRequest(current, request.id)); notify(request.completed ? 'Request reopened.' : 'Request completed.') }} /><span style={{ flex: 1 }}>{request.title}<small style={{ display: 'block', marginTop: 4, color: 'var(--muted)', fontSize: 10 }}>{request.requester}</small></span><Check size={15} /></label>)}</div></Panel></div>
  </>
}

function VocabularyEditor({ label, group, terms, onAdd, onRemove }: { label: string; group: VocabularyGroup; terms: string[]; onAdd: (group: VocabularyGroup, value: string) => void; onRemove: (group: VocabularyGroup, value: string) => void }) {
  const [term, setTerm] = useState('')
  const add = () => {
    if (!term.trim()) return
    onAdd(group, term)
    setTerm('')
  }

  return <div className="settings-section"><div className="panel-heading"><div><h3>{label}</h3><p>{terms.length} configured values for this workspace.</p></div><span className="badge badge-blue">{terms.length}</span></div><div className="tool-list">{terms.map((item) => <button className="tool-chip" type="button" onClick={() => onRemove(group, item)} aria-label={`Remove ${formatVocabularyTerm(item)}`} key={item}>{formatVocabularyTerm(item)} ×</button>)}</div><form className="toolbar" style={{ marginTop: 14 }} onSubmit={(event) => { event.preventDefault(); add() }}><div className="search-box"><input aria-label={`Add ${label}`} value={term} onChange={(event) => setTerm(event.target.value)} placeholder={`Add ${label.toLowerCase()}`} /></div><Button primary type="submit"><Plus size={14} /> Add</Button></form></div>
}

export function SettingsWorkspacePage({ notify }: { notify: (message: string) => void }) {
  const [workspace, setWorkspace] = useWorkspace()
  const [tab, setTab] = useState('Organization')
  const [organizationName, setOrganizationName] = useState(workspace.settings.organizationName)
  const [displayName, setDisplayName] = useState(workspace.settings.displayName)
  const [workspaceSlug, setWorkspaceSlug] = useState(workspace.settings.workspaceSlug)

  useEffect(() => {
    setOrganizationName(workspace.settings.organizationName)
    setDisplayName(workspace.settings.displayName)
    setWorkspaceSlug(workspace.settings.workspaceSlug)
  }, [workspace.settings])

  const save = () => {
    setWorkspace((current) => saveWorkspaceSettings(current, { organizationName, displayName, workspaceSlug }))
    notify('Workspace settings saved locally.')
  }

  return <>
    <PageTitle eyebrow="SETTINGS / WORKSPACE" title="The operating vocabulary." text="Standardize the small details so campaign names, tracking and handoffs stay legible across the workspace." action={<Button primary onClick={save}><Check size={15} /> Save changes</Button>} />
    <div className="settings-layout"><Panel className="settings-nav"><div className="eyebrow" style={{ padding: '8px 11px' }}>WORKSPACE</div>{['Organization', 'Team', 'Account'].map((item) => <button className={tab === item ? 'active' : ''} onClick={() => setTab(item)} key={item}>{item}</button>)}</Panel><Panel><div className="panel-kicker">{tab.toUpperCase()}</div>{tab === 'Organization' ? <><div className="settings-section"><h3>Vocabulary</h3><p>Settings applied to every local campaign workspace.</p><label className="form-label">Organization name<input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} /></label></div><VocabularyEditor label="Campaign channels" group="channels" terms={workspace.vocabulary.channels} onAdd={(group, value) => { setWorkspace((current) => addVocabularyTerm(current, group, value)); notify('Channel added.') }} onRemove={(group, value) => { setWorkspace((current) => removeVocabularyTerm(current, group, value)); notify('Channel removed.') }} /><VocabularyEditor label="UTM sources" group="trackingSources" terms={workspace.vocabulary.trackingSources} onAdd={(group, value) => { setWorkspace((current) => addVocabularyTerm(current, group, value)); notify('UTM source added.') }} onRemove={(group, value) => { setWorkspace((current) => removeVocabularyTerm(current, group, value)); notify('UTM source removed.') }} /><VocabularyEditor label="Campaign types" group="campaignTypes" terms={workspace.vocabulary.campaignTypes} onAdd={(group, value) => { setWorkspace((current) => addVocabularyTerm(current, group, value)); notify('Campaign type added.') }} onRemove={(group, value) => { setWorkspace((current) => removeVocabularyTerm(current, group, value)); notify('Campaign type removed.') }} /></> : tab === 'Team' ? <div className="settings-section"><h3>People and roles</h3><p>Keep ownership visible while the workspace grows.</p><div className="token-row"><span>{displayName}</span><span className="badge badge-green">Owner</span></div><div className="token-row"><span>Creative operator</span><span className="badge badge-blue">Ready to invite</span></div></div> : <div className="settings-section"><h3>Your account</h3><p>Local profile settings for this browser session.</p><label className="form-label">Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label><label className="form-label" style={{ marginTop: 12 }}>Workspace slug<input value={workspaceSlug} onChange={(event) => setWorkspaceSlug(event.target.value)} /></label><p className="mono" style={{ marginTop: 14 }}>nextfly.local/{workspace.settings.workspaceSlug}</p></div>}<div className="modal-actions"><Button primary onClick={save}>Save changes <ArrowRight size={14} /></Button></div></Panel></div>
  </>
}

export function LeadsWorkspacePage({ notify }: { notify: (message: string) => void }) {
  const [workspace, setWorkspace] = useWorkspace()
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('All')
  const [stage, setStage] = useState('All')
  const filtered = filterWorkspaceLeads(workspace, { query, source, stage })
  const stageCounts = ['Leads', 'MQL', 'SQL', 'Opps', 'Won'].map((item) => ({ label: item, value: workspace.leads.filter((lead) => lead.stage === item).length }))

  return <>
    <PageTitle eyebrow="LEADS / PIPELINE" title="Every handoff stays legible." text="Search the local lead list, review source context and move each contact through the funnel without losing their activity trail." />
    <div className="stat-grid">{stageCounts.map((item) => <div className="stat-card" key={item.label}><div className="stat-label"><span>{item.label}</span><span className="color-blue">●</span></div><div className="stat-value">{item.value}</div><div className="stat-note">Local workspace</div></div>)}</div>
    <Panel><div className="toolbar"><div className="search-box"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, company" /></div><select className="select-control" value={source} onChange={(event) => setSource(event.target.value)}><option>All</option><option>meta</option><option>google</option><option>partner</option><option>event</option><option>organic</option></select><select className="select-control" value={stage} onChange={(event) => setStage(event.target.value)}><option>All</option><option>Leads</option><option>MQL</option><option>SQL</option><option>Opps</option><option>Won</option></select></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Company</th><th>Source</th><th>Stage</th><th>Activity</th></tr></thead><tbody>{filtered.map((lead) => <tr key={lead.id}><td><strong>{lead.name}</strong><small>{lead.email}</small></td><td><strong>{lead.company}</strong><small>{lead.role}</small></td><td>{lead.source} · {lead.channel}</td><td><select aria-label={`Stage for ${lead.name}`} className="select-control" value={lead.stage} onChange={(event) => { setWorkspace((current) => setWorkspaceLeadStage(current, lead.id, event.target.value as LeadStage)); notify(`${lead.name} moved to ${event.target.value}.`) }}><option>Leads</option><option>MQL</option><option>SQL</option><option>Opps</option><option>Won</option></select></td><td>{lead.activity}</td></tr>)}</tbody></table></div>{filtered.length === 0 ? <div className="empty-state">No leads match these filters.</div> : null}</Panel>
  </>
}

export function SetupWorkspacePage({ notify }: { notify: (message: string) => void }) {
  const [workspace, setWorkspace] = useWorkspace()
  const [step, setStep] = useState(workspace.onboarding.step)
  const [market, setMarket] = useState(workspace.onboarding.market)
  const [channels, setChannels] = useState<string[]>(workspace.onboarding.channels)
  const [teamName, setTeamName] = useState(workspace.onboarding.teamName)
  const [goal, setGoal] = useState(workspace.onboarding.goal)
  const markets = ['SaaS / Software', 'E-commerce', 'Agency', 'Media / Publisher', 'Fintech', 'Healthcare', 'Education', 'Nonprofit', 'Other']
  const channelOptions = ['Paid social', 'Email', 'Organic', 'Partners', 'Events', 'Paid search']

  useEffect(() => {
    setStep(workspace.onboarding.step)
    setMarket(workspace.onboarding.market)
    setChannels(workspace.onboarding.channels)
    setTeamName(workspace.onboarding.teamName)
    setGoal(workspace.onboarding.goal)
  }, [workspace.onboarding])

  const persist = (nextStep: number) => {
    setWorkspace((current) => saveOnboarding(current, { step: nextStep, market, channels, teamName, goal }))
    setStep(Math.min(4, Math.max(1, nextStep)) as 1 | 2 | 3 | 4)
  }
  const toggleChannel = (channel: string) => setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel])
  const continueSetup = () => {
    if (step === 1 && !market) {
      notify('Choose the market you serve first.')
      return
    }
    if (step === 2 && channels.length === 0) {
      notify('Choose at least one channel.')
      return
    }
    if (step === 4) {
      persist(4)
      notify('Workspace setup completed.')
      return
    }
    persist(step + 1)
  }

  return <>
    <PageTitle eyebrow="SETUP / WORKSPACE" title={workspace.onboarding.completed ? 'Your workspace is ready.' : 'Tune the workspace to your operation.'} text="Four small decisions shape the defaults used across campaign planning, tracking and handoffs." />
    <Panel className="setup-panel"><div className="panel-heading"><div><div className="panel-kicker">STEP {step} OF 4 · ABOUT 60 SECONDS</div><h2>{step === 1 ? 'What do you market?' : step === 2 ? 'Which channels matter?' : step === 3 ? 'Who is on the team?' : 'Review your workspace defaults.'}</h2><p>{step === 1 ? 'We will tune naming and tagging so they feel native.' : step === 2 ? 'Select the channels that should shape your campaign playbooks.' : step === 3 ? 'Add a team label and the most important outcome for this workspace.' : 'You can update these choices from Settings at any time.'}</p></div><span className={`badge ${workspace.onboarding.completed ? 'badge-green' : 'badge-blue'}`}>{workspace.onboarding.completed ? 'Complete' : `${step}/4`}</span></div>{step === 1 ? <div className="choice-grid">{markets.map((item) => <button className={`quick-action ${market === item ? 'active' : ''}`} key={item} onClick={() => { setMarket(item); setWorkspace((current) => saveOnboarding(current, { step: 2, market: item, channels, teamName, goal })); setStep(2) }}>{item}<ArrowRight size={14} /></button>)}</div> : null}{step === 2 ? <div className="tool-list">{channelOptions.map((item) => <button className={`tool-chip ${channels.includes(item) ? 'selected' : ''}`} key={item} onClick={() => toggleChannel(item)}>{channels.includes(item) ? '✓ ' : ''}{item}</button>)}</div> : null}{step === 3 ? <div className="form-stack"><label className="form-label">Team name<input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="e.g. Growth team" /></label><label className="form-label">Workspace goal<textarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="What should move this quarter?" /></label></div> : null}{step === 4 ? <div className="detail-block"><h3>Workspace profile</h3><div className="metric-line"><span>Market</span><strong>{market || 'Not selected'}</strong></div><div className="metric-line"><span>Channels</span><strong>{channels.join(', ') || 'Not selected'}</strong></div><div className="metric-line"><span>Team</span><strong>{teamName || 'Not selected'}</strong></div><div className="metric-line"><span>Goal</span><strong>{goal || 'Not selected'}</strong></div></div> : null}<div className="modal-actions"><Button onClick={() => step > 1 ? persist(step - 1) : undefined}>Back</Button><Button primary onClick={continueSetup}>{step === 4 ? 'Finish setup' : 'Continue'} <ArrowRight size={14} /></Button></div></Panel>
  </>
}

export function LoginWorkspacePage({ nextPath }: { nextPath?: string }) {
  const [, setWorkspace] = useWorkspace()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [signedIn, setSignedIn] = useState(false)
  const continuationPath = nextPath ?? resolveWorkspaceRedirect(searchParams.get('redirect'))

  const signIn = (provider: 'email' | 'google') => {
    const sessionEmail = provider === 'google' ? 'andrew@nextfly.local' : email
    const sessionName = provider === 'google' ? 'Workspace member' : email.split('@')[0] || 'Workspace member'
    if (provider === 'email' && !password) {
      setError('Password is required to continue locally.')
      return
    }
    if (!sessionEmail.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    setWorkspace((current) => signInWorkspace(current, { email: sessionEmail, displayName: sessionName, provider }))
    setPassword('')
    setError('')
    setSignedIn(true)
  }

  return <main className="login-page"><section className="login-card"><a className="brand-lockup" href="/"><span className="brand-mark"><Target size={17} /></span><span>Next<span className="accent-text">fly</span> <small>TORRE</small></span></a><h1>Welcome back.</h1><p>Sign in to your shared Campaign Canvas workspace.</p><Button onClick={() => signIn('google')}><span style={{ color: '#4285f4', fontWeight: 700 }}>G</span> Continue with Google</Button><div className="divider">or with email</div><form className="form-stack" onSubmit={(event) => { event.preventDefault(); signIn('email') }}><label className="form-label">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label><label className="form-label">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required /></label>{error ? <p role="alert" className="stat-note">{error}</p> : null}<Button primary type="submit">Sign in <ArrowRight size={14} /></Button></form>{signedIn ? <div className="detail-block"><strong>Local session started.</strong><p>Passwords are never stored in this local copy.</p><a href={continuationPath} className="button button-primary">Continue to workspace <ArrowRight size={14} /></a></div> : null}<div className="login-footer">New here? A local workspace session is created after you continue.</div><div className="secure-note">SECURED · LOCAL · YOURS</div></section></main>
}
