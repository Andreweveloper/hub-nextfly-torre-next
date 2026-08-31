import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nextfly Torre — Centro de operações',
  description:
    'Planeje, prospecte e acompanhe a operação da Nextfly de ponta a ponta — agentes de IA, prospecção local, site, CRM e tráfego em um único espaço compartilhado.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0e0e12',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background" data-scroll-behavior="smooth">
      <body>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
