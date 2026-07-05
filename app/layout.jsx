import './globals.css'
import { AuthProvider } from '../lib/AuthProvider.jsx'

export const metadata = {
  title: 'Crafyro — Créer ensemble. En chaîne. Sans ego.',
  description:
    'Crafyro est un réseau social de création collaborative : rejoignez de petits groupes pour construire des projets créatifs à plusieurs mains, sans likes ni ego.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
