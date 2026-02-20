-- 1. Cria a tabela de perfis (se não existir)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'user', -- 'user' ou 'admin'
  is_banned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Habilita RLS (Segurança a nível de linha)
alter table public.profiles enable row level security;
alter table public.deals enable row level security;
alter table public.votes enable row level security;

-- 3. Gatilho para criar perfil automaticamente ao se cadastrar
-- (Isso garante que todo usuário tenha um registro na tabela profiles)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, is_banned)
  values (new.id, new.email, 'user', false);
  return new;
end;
$$ language plpgsql security definer;

-- Remove trigger antigo se existir para evitar duplicação
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. POLÍTICAS DE SEGURANÇA (AQUI ESTÁ A MÁGICA DO BANIMENTO)

-- PERMISSÕES PARA DEALS (OFERTAS)
-- Todo mundo pode ler ofertas aprovadas
create policy "Ofertas públicas são visíveis"
  on public.deals for select
  using (status = 'approved' or auth.uid() = user_id);

-- Apenas Admins podem ver ofertas pendentes (via App logic ou policy separada)
-- Mas para simplificar, permitimos select geral autenticado, filtramos no front/service
-- O insert é o critério critico:

-- *** BLOQUEIO DE BANIDOS NO INSERT DE OFERTAS ***
create policy "Usuários banidos não podem criar ofertas"
  on public.deals for insert
  with check (
    auth.uid() = user_id and
    (select is_banned from public.profiles where id = auth.uid()) = false
  );

-- Admin pode fazer tudo em deals
create policy "Admins total access deals"
  on public.deals for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- PERMISSÕES PARA PROFILES
-- Usuário pode ler seu próprio perfil
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins podem ver todos os perfis
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Admins podem editar perfis (para banir)
create policy "Admins can update profiles"
  on public.profiles for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- 5. Função para deletar oferta e dependencias (Cascade manual)
create or replace function delete_deal_admin(target_deal_id bigint)
returns void as $$
begin
  -- Verifica se quem chama é admin
  if (select role from public.profiles where id = auth.uid()) = 'admin' then
    delete from public.votes where deal_id = target_deal_id;
    delete from public.deals where id = target_deal_id;
  else
    raise exception 'Apenas administradores podem deletar ofertas.';
  end if;
end;
$$ language plpgsql security definer;
