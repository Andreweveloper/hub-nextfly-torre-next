import { TorreApp } from '@/components/torre/torre-app'
import { ReferenceToolSurface } from '@/components/torre/reference-tool-surface'
import { LoginWorkspacePage } from '@/components/torre/workspace-builder'

export default async function CatchAllPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolved = await params
  const route = `/${(resolved.slug ?? []).join('/')}`
  if (route === '/login') return <LoginWorkspacePage />
  const workspaceRoute = {
    '/torre': '/this-week',
    '/torre/agentes': '/tools',
    '/torre/prospeccao': '/leads',
    '/torre/crm': '/funnel',
    '/torre/campaigns': '/campaigns',
    '/torre/marketing-tools': '/tools',
    '/torre/site': '/settings',
    '/torre/trafego': '/integrations',
  }[route]
  const resolvedWorkspaceRoute = workspaceRoute ?? route
  if (['/this-week', '/campaigns', '/tools', '/tools/utm', '/tools/copilot', '/funnel', '/leads', '/calendar', '/requests', '/templates', '/settings', '/setup', '/integrations'].includes(resolvedWorkspaceRoute)) {
    return <ReferenceToolSurface route={resolvedWorkspaceRoute} />
  }
  return <TorreApp initialPath={route} />
}
