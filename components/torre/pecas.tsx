import { cn } from '@/lib/utils'
import type { EstadoAgente, EstadoLead, Veredito } from '@/lib/data'

const estadoAgenteStyle: Record<EstadoAgente, string> = {
  ativo: 'text-success border-success/40 bg-success/10',
  espera: 'text-warning border-warning/40 bg-warning/10',
  parado: 'text-muted-foreground border-border bg-muted',
}

export function SeloEstado({ estado }: { estado: EstadoAgente }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest',
        estadoAgenteStyle[estado],
      )}
    >
      {estado}
    </span>
  )
}

export const estadoLeadStyle: Record<EstadoLead, string> = {
  novo: 'text-muted-foreground border-border',
  enviado: 'text-primary border-primary/50',
  respondeu: 'text-warning border-warning/50',
  fechado: 'text-success border-success/50',
}

const vereditoStyle: Record<Veredito, string> = {
  escalar: 'text-success border-success/40 bg-success/10',
  manter: 'text-primary border-primary/40 bg-primary/10',
  aguardar: 'text-warning border-warning/40 bg-warning/10',
  matar: 'text-destructive border-destructive/40 bg-destructive/10',
}

export function SeloVeredito({ veredito }: { veredito: Veredito }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest',
        vereditoStyle[veredito],
      )}
    >
      {veredito}
    </span>
  )
}

export function Placa({
  titulo,
  children,
  className,
}: {
  titulo?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card p-5', className)}>
      {titulo ? (
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">{titulo}</h2>
      ) : null}
      {children}
    </section>
  )
}

export function Proa({
  sobre,
  titulo,
  texto,
  acoes,
}: {
  sobre: string
  titulo: string
  texto: string
  acoes?: React.ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.3em] text-primary">{sobre}</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{titulo}</h1>
        <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{texto}</p>
      </div>
      {acoes ? <div className="flex gap-2">{acoes}</div> : null}
    </header>
  )
}

export function Instrumento({ rotulo, valor, nota }: { rotulo: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{rotulo}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{valor}</p>
      {nota ? <p className="mt-1 text-xs text-muted-foreground">{nota}</p> : null}
    </div>
  )
}
