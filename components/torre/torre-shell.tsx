'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TowerControl } from 'lucide-react'
import { cn } from '@/lib/utils'

const setores = [
  { href: '/torre', cod: 'T', nome: 'Torre' },
  { href: '/torre/agentes', cod: 'AG', nome: 'Agentes' },
  { href: '/torre/prospeccao', cod: 'PR', nome: 'Prospecção' },
  { href: '/torre/site', cod: 'ST', nome: 'Site' },
  { href: '/torre/crm', cod: 'CR', nome: 'CRM' },
  { href: '/torre/trafego', cod: 'TF', nome: 'Tráfego' },
]

export function TorreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-6 py-4 backdrop-blur md:px-10">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <TowerControl className="size-5 text-primary" aria-hidden="true" />
          <span>
            Next<em className="not-italic text-primary">fly</em>
          </span>
          <span className="hidden text-xs uppercase tracking-widest text-muted-foreground sm:inline">Torre</span>
        </Link>
        <span className="font-mono text-xs text-muted-foreground">litoral de SC · v0.2</span>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <nav
          aria-label="Setores do Hub"
          className="sticky top-[57px] z-10 flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-background/90 px-4 py-2 backdrop-blur md:top-auto md:w-52 md:flex-col md:border-b-0 md:border-r md:px-4 md:py-6"
        >
          <span className="hidden px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground md:block">
            Setores
          </span>
          {setores.map((s) => {
            const ativo = pathname === s.href
            return (
              <Link
                key={s.href}
                href={s.href}
                aria-current={ativo ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors md:rounded-xl',
                  ativo
                    ? 'bg-primary/15 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <span className="hidden w-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:inline">
                  {s.cod}
                </span>
                {s.nome}
              </Link>
            )
          })}
        </nav>

        <main className="min-w-0 flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  )
}
