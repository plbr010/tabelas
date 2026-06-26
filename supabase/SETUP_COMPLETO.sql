-- ============================================================
-- PORTAL DE INDICAÇÕES — SETUP COMPLETO DO BANCO
-- Cole TUDO no SQL Editor do Supabase e clique em RUN
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'freelancer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('novo', 'contato', 'proposta', 'fechado', 'perdido');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Perfis
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'freelancer',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurações
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  default_sale_value NUMERIC(10, 2) NOT NULL DEFAULT 1250.00,
  default_commission NUMERIC(10, 2) NOT NULL DEFAULT 250.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (default_sale_value, default_commission)
SELECT 1250.00, 250.00
WHERE NOT EXISTS (SELECT 1 FROM system_settings LIMIT 1);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  city TEXT NOT NULL,
  niche TEXT,
  notes TEXT,
  sale_value NUMERIC(10, 2),
  commission_value NUMERIC(10, 2),
  status lead_status NOT NULL DEFAULT 'novo',
  freelancer_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Trigger: criar perfil ao registrar usuário (sempre freelancer; admin definido pelo servidor)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'freelancer'::user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;
  RETURN NEW;
EXCEPTION WHEN others THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Funções auxiliares
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND active = true
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins veem todos os perfis" ON profiles;
CREATE POLICY "Admins veem todos os perfis" ON profiles FOR SELECT USING (is_admin() OR id = auth.uid());

DROP POLICY IF EXISTS "Admins gerenciam perfis" ON profiles;
CREATE POLICY "Admins gerenciam perfis" ON profiles FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Usuários veem próprio perfil" ON profiles;
CREATE POLICY "Usuários veem próprio perfil" ON profiles FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Usuários atualizam próprio perfil" ON profiles;
CREATE POLICY "Usuários atualizam próprio perfil" ON profiles FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins veem todos os leads" ON leads;
CREATE POLICY "Admins veem todos os leads" ON leads FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Freelancers veem próprios leads" ON leads;
CREATE POLICY "Freelancers veem próprios leads" ON leads FOR SELECT USING (freelancer_id = auth.uid());

DROP POLICY IF EXISTS "Usuários autenticados criam leads" ON leads;
CREATE POLICY "Usuários autenticados criam leads" ON leads FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (is_admin() OR freelancer_id = auth.uid()));

DROP POLICY IF EXISTS "Admins atualizam qualquer lead" ON leads;
CREATE POLICY "Admins atualizam qualquer lead" ON leads FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Freelancers atualizam próprios leads" ON leads;
CREATE POLICY "Freelancers atualizam próprios leads" ON leads FOR UPDATE USING (freelancer_id = auth.uid());

DROP POLICY IF EXISTS "Apenas admins deletam leads" ON leads;
CREATE POLICY "Apenas admins deletam leads" ON leads FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "Todos autenticados leem configurações" ON system_settings;
CREATE POLICY "Todos autenticados leem configurações" ON system_settings FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins atualizam configurações" ON system_settings;
CREATE POLICY "Admins atualizam configurações" ON system_settings FOR UPDATE USING (is_admin());

-- Códigos de verificação de cadastro
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Pronto!
SELECT 'Banco configurado com sucesso!' AS status;
