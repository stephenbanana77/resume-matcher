-- 分析记录表
create table analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  resume_text text not null,
  jd_text text not null,
  result jsonb not null,
  created_at timestamp with time zone default now()
);

-- 只允许用户访问自己的数据
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
