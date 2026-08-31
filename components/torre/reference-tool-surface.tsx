'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, CalendarDays, Grid2X2, Link2, Menu, Target, TowerControl, WandSparkles, X } from 'lucide-react'
import { canAccessWorkspace, signOutWorkspace } from '@/lib/workspace-state'
import { CalendarWorkspacePage, CampaignCopilotPage, CampaignWorkspacePage, FunnelTargetsPage, IntegrationDirectoryPage, LeadsWorkspacePage, MarketingToolsHubPage, RequestsWorkspacePage, SettingsWorkspacePage, SetupWorkspacePage, TemplateLibraryPage, ThisWeekWorkspacePage, useWorkspace, UtmBuilderPage } from './workspace-builder'
import { useEffect, useState } from 'react'

const routes = [
  { href: '/this-week', label: 'This week', icon: BarChart3 },
  { href: '/campaigns', label: 'Campaigns', icon: Grid2X2 },
  { href: '/tools', label: 'Marketing tools', icon: WandSparkles },
  { href: '/tools/utm', label: 'UTM Builder', icon: Link2 },
  { href: '/funnel', label: 'Funnel targets', icon: Target },
  { href: '/leads', label: 'Leads', icon: Target },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/requests', label: 'Requests', icon: BarChart3 },
  { href: '/templates', label: 'Templates', icon: Grid2X2 },
  { href: '/settings', label: 'Settings', icon: TowerControl },
  { href: '/setup', label: 'Setup', icon: TowerControl },
  { href: '/integrations', label: 'Integrations', icon: Link2 },
]

export function ReferenceToolSurface({ route }: { route: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [accessWorkspace, setAccessWorkspace, accessHydrated] = useWorkspace()
  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  useEffect(() => {
    if (accessHydrated && !canAccessWorkspace(accessWorkspace)) {
      router.replace(`/login?mode=signin&redirect=${encodeURIComponent(route)}`)
    }
  }, [accessHydrated, accessWorkspace, route, router])

  const content = route === '/campaigns'
    ? <CampaignWorkspacePage notify={notify} />
    : route === '/this-week'
      ? <ThisWeekWorkspacePage />
    : route === '/tools'
      ? <MarketingToolsHubPage />
    : route === '/tools/utm'
      ? <UtmBuilderPage notify={notify} />
    : route === '/funnel'
      ? <FunnelTargetsPage notify={notify} />
      : route === '/leads'
        ? <LeadsWorkspacePage notify={notify} />
      : route === '/calendar'
        ? <CalendarWorkspacePage notify={notify} />
        : route === '/templates'
          ? <TemplateLibraryPage notify={notify} />
          : route === '/requests'
            ? <RequestsWorkspacePage notify={notify} />
            : route === '/settings'
              ? <SettingsWorkspacePage notify={notify} />
              : route === '/setup'
                ? <SetupWorkspacePage notify={notify} />
          : route === '/integrations'
            ? <IntegrationDirectoryPage notify={notify} />
          : <CampaignCopilotPage notify={notify} />

  if (!accessHydrated || !canAccessWorkspace(accessWorkspace)) return <main className="login-page"><div className="empty-state">Loading workspace...</div></main>

  return <div className="app-frame">
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="sidebar-head">
        <Link href="/" className="brand-lockup"><span className="brand-mark"><TowerControl size={16} /></span><span>Next<span className="accent-text">fly</span> <small>TORRE</small></span></Link>
        <button className="sidebar-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={17} /></button>
      </div>
      <nav className="side-nav">
        <div className="nav-label">Campaign Canvas</div>
        {routes.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return <Link className={`nav-item ${active ? 'active' : ''}`} href={item.href} key={item.href} onClick={() => setMenuOpen(false)}><Icon size={15} />{item.label}</Link>
        })}
        <div className="nav-label">Nextfly</div>
        <Link className="nav-item" href="/torre"><BarChart3 size={15} />Open Torre</Link>
      </nav>
      <div className="workspace-stamp"><span className="status-dot" />Workspace online<br /><span className="mono">local workspace · v0.3</span></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><div style={{ display: 'flex', alignItems: 'center', gap: 13 }}><button className="mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={20} /></button><span className="crumb">Campaign Canvas <strong> / {routes.find((item) => item.href === route)?.label ?? 'Tools'}</strong></span></div><div className="top-actions"><Link href="/setup" className="setup-pill">Setup 0/4 →</Link><div className="user-pill"><span className="avatar">{accessWorkspace.session.displayName.slice(0, 2).toUpperCase() || 'AP'}</span><span>{accessWorkspace.session.displayName || 'Workspace member'}</span><button aria-label="Sign out" onClick={() => setAccessWorkspace((current) => signOutWorkspace(current))}>Sign out</button></div></div></header>
      <main className="workspace-content">{content}</main>
    </div>
    {toast ? <div className="toast">{toast}</div> : null}
  </div>
}
