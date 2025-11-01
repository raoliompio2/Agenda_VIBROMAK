import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Header } from '@/components/layout/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vibromak - Recepção Vibromak',
  description: 'Sistema de agendamento online para reuniões executivas da Vibromak',
  keywords: 'vibromak, agenda, agendamento, reuniões, executivo, painel',
  authors: [{ name: 'Vibromak' }],
  robots: 'index, follow',
  icons: {
    icon: [
      { url: '/Favicon.svg', type: 'image/svg+xml' },
      { url: '/Favicon.svg' }, // Fallback
    ],
    shortcut: '/Favicon.svg',
    apple: '/Favicon.svg',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-vibromak-light min-h-screen`}>
        <Providers>
          <Header />
          <main className="pt-4">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
