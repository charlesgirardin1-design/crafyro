import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../lib/AuthProvider.jsx'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata = {
  title: 'Crafyro — Créer ensemble. En chaîne. Sans ego.',
  description:
    'Crafyro est un réseau social de création collaborative : rejoignez de petits groupes pour construire des projets créatifs à plusieurs mains, sans likes ni ego.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
