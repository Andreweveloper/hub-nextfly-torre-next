import Link from 'next/link'
import { ArrowRight, BarChart3, Bot, Filter, Globe, Radar, TowerControl, WandSparkles } from 'lucide-react'

const setores = [
  { href: '/torre/agentes', icon: Bot, eyebrow: 'Agents', title: 'Agentes', text: 'Frota de agentes de IA com comando, ferramentas e entrega prontos.' },
  { href: '/torre/prospeccao', icon: Radar, eyebrow: 'Pipeline', title: 'Prospecção', text: 'Comércios sem site, mensagens de abordagem e situação de cada lead.' },
  { href: '/torre/site', icon: Globe, eyebrow: 'Presence', title: 'Site', text: 'Estado de cada página do nextfly.com.br em um único quadro.' },
  { href: '/torre/crm', icon: Filter, eyebrow: 'Revenue', title: 'CRM', text: 'Funil do lead encontrado ao contrato fechado, com valor por etapa.' },
  { href: '/torre/trafego', icon: BarChart3, eyebrow: 'Signals', title: 'Tráfego', text: 'Vereditos de campanha guiados pelas regras de escala da casa.' },
  { href: '/this-week', icon: WandSparkles, eyebrow: 'Campaign Canvas', title: 'Marketing tools', text: 'Planejamento, UTMs, playbooks e integrações no workspace compartilhado.' },
]

export default function Home() {
  return <main className="public-home">
    <header className="public-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><TowerControl size={17} /></span><span>Next<span className="accent-text">fly</span> <small>TORRE</small></span></Link><div className="public-actions"><Link href="/login" className="text-link">Sign in</Link><Link href="/torre" className="button button-primary">Entrar na Torre <ArrowRight size={15} /></Link></div></header>
    <section className="public-hero"><div className="eyebrow"><span className="status-dot" /> CENTRO DE OPERAÇÕES NEXTFLY</div><h1>Uma torre para<br /><span>toda a operação.</span></h1><p>Planeje, prospecte e acompanhe a operação de ponta a ponta. Agentes, leads, conteúdo e decisões de tráfego em um só espaço compartilhado.</p><div className="hero-actions"><Link href="/torre" className="button button-primary button-large">Entrar na Torre <ArrowRight size={17} /></Link><Link href="#setores" className="button button-ghost button-large">Ver setores</Link></div><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /></section>
    <section id="setores" className="public-sectors"><div className="section-heading"><div><div className="eyebrow">O QUE TEM DENTRO</div><h2>O mapa da operação.</h2></div><span className="mono-note">06 setores · 01 workspace</span></div><div className="sector-grid">{setores.map((setor) => { const Icon = setor.icon; return <Link key={setor.href} href={setor.href} className="sector-card"><span className="icon-orb"><Icon size={19} /></span><span className="card-eyebrow">{setor.eyebrow}</span><h3>{setor.title}</h3><p>{setor.text}</p><span className="card-arrow"><ArrowRight size={15} /></span></Link> })}</div></section>
    <footer className="public-footer"><span>Nextfly Torre</span><span>Construído para mover o próximo passo.</span><span>© 2026</span></footer>
  </main>
}
