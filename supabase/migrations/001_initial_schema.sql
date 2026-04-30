-- boards: one per user (or shared, in stretch goals)
create table boards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- columns: ordered lanes within a board
create table columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade not null,
  title text not null,
  position integer not null default 0,
  created_at timestamptz default now()
);

-- cards: tasks that live in columns
create table cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid references columns(id) on delete cascade not null,
  title text not null,
  description text,
  priority text check (priority in ('low', 'medium', 'high', 'critical')),
  due_date date,
  assignee_id uuid references auth.users(id) on delete set null,
  position integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: boards
alter table boards enable row level security;

create policy "users can manage their own boards"
  on boards for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- RLS: columns (inherit board ownership)
alter table columns enable row level security;

create policy "users can manage columns on their boards"
  on columns for all
  using (
    exists (
      select 1 from boards
      where boards.id = columns.board_id
      and boards.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from boards
      where boards.id = columns.board_id
      and boards.owner_id = auth.uid()
    )
  );

-- RLS: cards (inherit via column -> board chain)
alter table cards enable row level security;

create policy "users can manage cards on their boards"
  on cards for all
  using (
    exists (
      select 1 from columns
      join boards on boards.id = columns.board_id
      where columns.id = cards.column_id
      and boards.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from columns
      join boards on boards.id = columns.board_id
      where columns.id = cards.column_id
      and boards.owner_id = auth.uid()
    )
  );

-- auto-update updated_at on boards and cards
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger boards_updated_at
  before update on boards
  for each row execute function update_updated_at();

create trigger cards_updated_at
  before update on cards
  for each row execute function update_updated_at();
