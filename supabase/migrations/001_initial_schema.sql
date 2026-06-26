-- Portal de Indicações - Schema inicial
-- Execute no SQL Editor do Supabase

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum de papéis
CREATE TYPE user_role AS ENUM ('admin', 'freelancer');

-- Enum de status do lead
CREATE TYPE lead_status AS ENUM (
  'novo',
  'contato',
  'proposta',
  'fechado',
  'perdido'
);

-- Perfis de usuário (vinculado ao auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'freelancer',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurações do sistema
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  default_sale_value NUMERIC(10, 2) NOT NULL DEFAULT 1250.00,
  default_commission NUMERIC(10, 2) NOT NULL DEFAULT 250.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO system_settings (default_sale_value, default_commission) VALUES (1250.00, 250.00);

-- Leads
CREATE TABLE leads (
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

-- Índices para performance
CREATE INDEX idx_leads_freelancer_id ON leads(freelancer_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_company_name ON leads(company_name);
CREATE INDEX idx_leads_whatsapp ON leads(whatsapp);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(active);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter role do usuário
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger: calcular comissão ao fechar lead
CREATE OR REPLACE FUNCTION calculate_commission_on_close()
RETURNS TRIGGER AS $$
DECLARE
  settings RECORD;
BEGIN
  IF NEW.status = 'fechado' AND (OLD.status IS DISTINCT FROM 'fechado') THEN
    SELECT default_sale_value, default_commission INTO settings
    FROM system_settings LIMIT 1;

    IF NEW.sale_value IS NULL THEN
      NEW.sale_value := settings.default_sale_value;
    END IF;

    NEW.commission_value := settings.default_commission;
    NEW.closed_at := NOW();
  END IF;

  IF NEW.status != 'fechado' AND OLD.status = 'fechado' THEN
    NEW.closed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_commission_trigger
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION calculate_commission_on_close();

-- Trigger: proteger campos sensíveis para freelancers
CREATE OR REPLACE FUNCTION protect_lead_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_admin() THEN
    IF OLD.whatsapp IS DISTINCT FROM NEW.whatsapp THEN
      RAISE EXCEPTION 'Freelancers não podem alterar o WhatsApp do lead';
    END IF;
    IF OLD.freelancer_id IS DISTINCT FROM NEW.freelancer_id THEN
      RAISE EXCEPTION 'Freelancers não podem transferir leads para outro freelancer';
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar o status do lead';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_protect_fields
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION protect_lead_fields();

-- Trigger: criar perfil ao registrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'freelancer')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policies: profiles
CREATE POLICY "Admins veem todos os perfis"
  ON profiles FOR SELECT
  USING (is_admin() OR id = auth.uid());

CREATE POLICY "Admins gerenciam perfis"
  ON profiles FOR ALL
  USING (is_admin());

CREATE POLICY "Usuários veem próprio perfil"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Usuários atualizam próprio perfil"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Policies: leads
CREATE POLICY "Admins veem todos os leads"
  ON leads FOR SELECT
  USING (is_admin());

CREATE POLICY "Freelancers veem próprios leads"
  ON leads FOR SELECT
  USING (freelancer_id = auth.uid());

CREATE POLICY "Usuários autenticados criam leads"
  ON leads FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      is_admin()
      OR freelancer_id = auth.uid()
    )
  );

CREATE POLICY "Admins atualizam qualquer lead"
  ON leads FOR UPDATE
  USING (is_admin());

CREATE POLICY "Freelancers atualizam próprios leads"
  ON leads FOR UPDATE
  USING (freelancer_id = auth.uid());

CREATE POLICY "Apenas admins deletam leads"
  ON leads FOR DELETE
  USING (is_admin());

-- Policies: system_settings
CREATE POLICY "Todos autenticados leem configurações"
  ON system_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins atualizam configurações"
  ON system_settings FOR UPDATE
  USING (is_admin());
