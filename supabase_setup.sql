-- ==============================================================================
-- SCRIPT DE CORREÇÃO E CONFIGURAÇÃO DE SEGURANÇA (RLS)
-- Rode este script completo no SQL Editor do Supabase para corrigir o login e banimento.
-- ==============================================================================

-- 1. Garante que as tabelas existem
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'user', -- 'user' ou 'admin'
  is_banned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Limpa policies antigas para evitar conflitos e recursão infinita
DROP POLICY IF EXISTS "Ofertas públicas são visíveis" ON public.deals;
DROP POLICY IF EXISTS "Usuários banidos não podem criar ofertas" ON public.deals;
DROP POLICY IF EXISTS "Admins total access deals" ON public.deals;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Deals are viewable by everyone" ON public.deals;
DROP POLICY IF EXISTS "Authenticated users can insert deals" ON public.deals;

-- 3. Habilita RLS
alter table public.profiles enable row level security;
alter table public.deals enable row level security;
alter table public.votes enable row level security;

-- 4. Função auxiliar para verificar Admin sem causar recursão infinita no RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Security Definer permite que a função rode com permissões elevadas,
  -- lendo a tabela profiles sem disparar as policies do usuário que chamou.
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. POLICIES CORRIGIDAS (PERMISSÕES)

-- --- PROFILES ---
-- Qualquer usuário logado pode ler perfis (necessário para ver autor da oferta e carregar o próprio perfil no login)
CREATE POLICY "Leitura de perfis permitida para autenticados"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Apenas admins podem alterar perfis (para banir/promover)
CREATE POLICY "Admins podem atualizar perfis"
ON public.profiles FOR UPDATE
USING (public.is_admin());

-- Usuário pode editar seu próprio perfil (opcional, mas boa prática)
CREATE POLICY "Usuário edita próprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- --- DEALS (OFERTAS) ---
-- Leitura pública de ofertas (qualquer um vê o site)
CREATE POLICY "Ver ofertas"
ON public.deals FOR SELECT
USING (true);

-- Inserção: Apenas autenticados e NÃO BANIDOS
CREATE POLICY "Criar ofertas (Não banidos)"
ON public.deals FOR INSERT
TO authenticated
WITH CHECK (
   auth.uid() = user_id AND
   (SELECT is_banned FROM public.profiles WHERE id = auth.uid()) = false
);

-- Atualização: Admins total, Usuários seus próprios (se não banidos - opcional, aqui deixamos livre para editar se for dono)
CREATE POLICY "Atualizar ofertas"
ON public.deals FOR UPDATE
USING (
  public.is_admin() OR auth.uid() = user_id
);

-- Deleção: Apenas Admins (ou dono, se quiser permitir)
CREATE POLICY "Deletar ofertas"
ON public.deals FOR DELETE
USING (
  public.is_admin() OR auth.uid() = user_id
);

-- --- VOTES ---
CREATE POLICY "Ver votos" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Votar" ON public.votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Remover voto" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- 6. TRIGGER DE NOVO USUÁRIO
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, is_banned)
  values (new.id, new.email, 'user', false);
  return new;
end;
$$ language plpgsql security definer;

-- Recria o trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. BACKFILL (CORREÇÃO PARA USUÁRIOS ANTIGOS QUE NÃO LOGAM)
-- Insere um perfil para qualquer usuário do Auth que ainda não tenha um na tabela profiles
INSERT INTO public.profiles (id, email, role, is_banned)
SELECT id, email, 'user', false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT DO NOTHING;

-- 8. FUNÇÃO DELETAR ADMIN (Mantida)
create or replace function delete_deal_admin(target_deal_id bigint)
returns void as $$
begin
  if public.is_admin() then
    delete from public.votes where deal_id = target_deal_id;
    delete from public.deals where id = target_deal_id;
  else
    raise exception 'Apenas administradores podem deletar ofertas.';
  end if;
end;
$$ language plpgsql security definer;
