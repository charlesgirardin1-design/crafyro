# ChainCraft

« Créer ensemble. En chaîne. Sans ego. »

ChainCraft n'est pas un réseau social classique : pas de fil infini, pas de likes publics, pas de profil ego. De petits groupes (2 à 10 personnes) rejoignent ou créent un projet créatif (texte, musique, design, brainstorm, mixte) et construisent une œuvre collective, une contribution versionnée à la fois (V1, V2, V3...), pendant une durée de vie stricte de 30 jours. À l'expiration, le projet est archivé automatiquement (avec notification 48h avant et export possible).

## Stack

- Next.js 14 (App Router, JavaScript)
- Tailwind CSS
- Supabase (Postgres + Auth + Row Level Security)
- Google Gemini (assistant IA de projet)
- jsPDF (export PDF côté client)
- Vercel Cron Jobs (expiration quotidienne des projets)

## Mise en route

### 1. Créer un projet Supabase

1. Créez un compte gratuit sur [supabase.com](https://supabase.com) et un nouveau projet.
2. Dans l'éditeur SQL du projet, collez et exécutez le contenu de `supabase/schema.sql` (tables, contraintes, trigger de création de profil, et policies RLS).
3. Dans **Project Settings > API**, récupérez :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secret, jamais exposé au client)

L'authentification utilise un magic link par email (aucune configuration OAuth requise). Dans **Authentication > URL Configuration**, ajoutez l'URL de votre site (ex. `https://chaincraft.vercel.app`) et `https://chaincraft.vercel.app/auth/callback` aux Redirect URLs.

### 2. Obtenir une clé Gemini (assistant IA)

Créez une clé gratuite sur [Google AI Studio](https://aistudio.google.com/apikey) → `GEMINI_API_KEY`. Modèle par défaut : `gemini-2.5-flash` (modifiable via `GEMINI_MODEL`).

### 3. Variables d'environnement

Créez un fichier `.env.local` (non versionné) à la racine :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
CRON_SECRET=une-chaine-secrete-au-choix
```

`CRON_SECRET` protège la route `/api/cron/expire-projects` ; Vercel Cron l'appelle automatiquement avec l'en-tête approprié, mais vous pouvez aussi la déclencher manuellement avec `Authorization: Bearer <CRON_SECRET>`.

### 4. Lancer en local

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Déploiement (Vercel)

1. Poussez ce dépôt sur GitHub.
2. Importez-le dans Vercel.
3. Ajoutez les variables d'environnement ci-dessus dans **Project Settings > Environment Variables**.
4. Déployez. Le cron d'expiration (`vercel.json`) tourne chaque jour à 3h du matin.

## Structure du projet

```
app/                    routes App Router (pages + API routes)
  api/                  routes API (projects, contributions, feedback, assistant, export, cron)
  login/                connexion par magic link
  auth/callback/        callback Supabase Auth
  projects/new/         création de projet
  projects/[id]/        page projet (timeline, membres, assistant IA)
  profile/              édition du pseudo et des compétences
components/             composants React réutilisables
lib/                    clients Supabase, auth, rôles, types de projet
supabase/schema.sql     schéma complet + RLS
```

## Modèle produit (rappel)

- **Rôles dynamiques** : initiateur, contributeur idée, créateur de contenu, éditeur — recalculés selon l'activité.
- **Feedback qualitatif uniquement** : utile / inspirant / clair / créatif (pas de like classique).
- **Matchmaking** : suggestions de projets actifs basées sur les compétences déclarées dans le profil.
- **Export** : PDF généré côté client (titre, objectif, membres, contributions versionnées) à tout moment, en particulier avant l'expiration.
