-- -----------------------------------------------------------------------------
-- Crafyro — schéma de base de données Supabase (Postgres)
-- À exécuter une fois dans : Supabase Dashboard > SQL Editor > New query.
-- Suppose que l'authentification Supabase (auth.users) est déjà activée
-- (c'est le cas par défaut sur tout projet Supabase).
-- -----------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Utilisateurs (profil applicatif lié à auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text not null default 'Créateur anonyme',
  skills text[] not null default '{}',
  collaboration_score int not null default 0, -- jamais exposé publiquement
  created_at timestamptz not null default now()
);

-- Crée automatiquement une ligne "users" quand quelqu'un s'inscrit via Supabase Auth.
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, pseudo)
  values (new.id, coalesce(split_part(new.email, '@', 1), 'Créateur anonyme'))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Projets
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  type text not null check (type in ('texte', 'musique', 'design', 'brainstorm', 'mixed')),
  objective text not null default '',
  max_participants int not null default 6 check (max_participants between 2 and 10),
  creator_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
  notified_48h boolean not null default false
);

create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_expires_at on public.projects(expires_at);

-- ---------------------------------------------------------------------------
-- Membres d'un projet + rôle dynamique
-- ---------------------------------------------------------------------------
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'contributeur_idee'
    check (role in ('initiateur', 'contributeur_idee', 'createur_contenu', 'editeur')),
  contribution_count int not null default 0,
  joined_at timestamptz not null default now(),
  unique (project_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Contributions (versionnées automatiquement par projet)
-- ---------------------------------------------------------------------------
create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  version int not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_contributions_project on public.contributions(project_id, version);

-- ---------------------------------------------------------------------------
-- Feedback qualitatif (PAS de like classique)
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.contributions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('utile', 'inspirant', 'clair', 'creatif')),
  created_at timestamptz not null default now(),
  unique (contribution_id, user_id, type)
);

-- ---------------------------------------------------------------------------
-- Commentaires sur une contribution
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.contributions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.contributions enable row level security;
alter table public.feedback enable row level security;
alter table public.comments enable row level security;

-- Users : chacun peut lire tous les profils (pseudo/compétences publics),
-- mais ne peut modifier que le sien.
create policy "users_select_all" on public.users for select using (true);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- Projects : tout utilisateur connecté peut voir les projets actifs/archivés
-- (pour le matchmaking et la découverte), seul le créateur peut modifier/supprimer.
create policy "projects_select_all" on public.projects for select using (true);
create policy "projects_insert_own" on public.projects for insert with check (auth.uid() = creator_id);
create policy "projects_update_creator" on public.projects for update using (auth.uid() = creator_id);

-- Project members : visibles par tous (liste des membres publique), mais on ne
-- peut s'ajouter que soi-même (rejoindre un projet).
create policy "members_select_all" on public.project_members for select using (true);
create policy "members_insert_self" on public.project_members for insert with check (auth.uid() = user_id);

-- Contributions : lisibles uniquement par les membres du projet concerné ;
-- écriture réservée aux membres du projet.
create policy "contributions_select_members" on public.contributions for select
  using (exists (
    select 1 from public.project_members pm
    where pm.project_id = contributions.project_id and pm.user_id = auth.uid()
  ));
create policy "contributions_insert_members" on public.contributions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.project_members pm
      where pm.project_id = contributions.project_id and pm.user_id = auth.uid()
    )
  );

-- Feedback : lisible et modifiable par les membres du projet correspondant.
create policy "feedback_select_members" on public.feedback for select
  using (exists (
    select 1 from public.contributions c
    join public.project_members pm on pm.project_id = c.project_id
    where c.id = feedback.contribution_id and pm.user_id = auth.uid()
  ));
create policy "feedback_insert_members" on public.feedback for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.contributions c
      join public.project_members pm on pm.project_id = c.project_id
      where c.id = feedback.contribution_id and pm.user_id = auth.uid()
    )
  );
create policy "feedback_delete_own" on public.feedback for delete using (auth.uid() = user_id);

-- Comments : lisibles/écrits par les membres du projet correspondant.
create policy "comments_select_members" on public.comments for select
  using (exists (
    select 1 from public.contributions c
    join public.project_members pm on pm.project_id = c.project_id
    where c.id = comments.contribution_id and pm.user_id = auth.uid()
  ));
create policy "comments_insert_members" on public.comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.contributions c
      join public.project_members pm on pm.project_id = c.project_id
      where c.id = comments.contribution_id and pm.user_id = auth.uid()
    )
  );
