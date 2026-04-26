-- 分析记录表
create table analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  resume_text text not null,
  jd_text text not null,
  result jsonb not null,
  created_at timestamp with time zone default now()
);

alter table analyses enable row level security;

create policy "Users can view own analyses"
  on analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on analyses for delete
  using (auth.uid() = user_id);

-- 投递记录表
create table applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  analysis_id uuid references analyses(id) on delete set null,
  company text not null,
  position text not null,
  status text not null default 'applied',
  applied_at date not null default current_date,
  notes text,
  created_at timestamp with time zone default now()
);

alter table applications enable row level security;

create policy "Users can manage own applications"
  on applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 简历存储表
create table resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  filename text not null,
  resume_text text not null,
  created_at timestamp with time zone default now()
);

alter table resumes enable row level security;

create policy "Users can view own resumes"
  on resumes for select
  using (auth.uid() = user_id);

create policy "Users can insert own resumes"
  on resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own resumes"
  on resumes for delete
  using (auth.uid() = user_id);
