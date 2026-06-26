-- Seed de dados para testes
-- IMPORTANTE: Crie os usuários no Supabase Auth primeiro, depois execute este script
-- substituindo os UUIDs pelos IDs reais dos usuários criados.

-- Exemplo de criação de usuários via Supabase Dashboard > Authentication > Users:
-- Admin: admin@portal.com / Admin@123
-- Freelancer 1: joao@freelancer.com / Freelancer@123
-- Freelancer 2: maria@freelancer.com / Freelancer@123
-- Freelancer 3: pedro@freelancer.com / Freelancer@123

-- Após criar os usuários, atualize os perfis com dados corretos:
-- UPDATE profiles SET name = 'Administrador', role = 'admin', phone = '(11) 99999-0000' WHERE email = 'admin@portal.com';
-- UPDATE profiles SET name = 'João Silva', phone = '(11) 98888-1111' WHERE email = 'joao@freelancer.com';
-- UPDATE profiles SET name = 'Maria Santos', phone = '(21) 97777-2222' WHERE email = 'maria@freelancer.com';
-- UPDATE profiles SET name = 'Pedro Oliveira', phone = '(31) 96666-3333' WHERE email = 'pedro@freelancer.com';

-- Script de seed de leads (substitua os UUIDs dos freelancers):
/*
INSERT INTO leads (company_name, contact_name, whatsapp, city, niche, notes, status, freelancer_id, sale_value, commission_value, closed_at) VALUES
('Tech Solutions Ltda', 'Carlos Mendes', '(11) 91234-5678', 'São Paulo', 'Tecnologia', 'Interessado em landing page para SaaS', 'fechado', 'UUID_JOAO', 1250.00, 250.00, NOW() - INTERVAL '5 days'),
('Padaria Delícia', 'Ana Paula', '(21) 92345-6789', 'Rio de Janeiro', 'Alimentação', 'Quer página para delivery', 'fechado', 'UUID_MARIA', 1250.00, 250.00, NOW() - INTERVAL '3 days'),
('Clínica Saúde+', 'Dr. Roberto', '(31) 93456-7890', 'Belo Horizonte', 'Saúde', 'Landing para captura de pacientes', 'proposta', 'UUID_JOAO', NULL, NULL, NULL),
('Academia FitPro', 'Lucas Ferreira', '(11) 94567-8901', 'São Paulo', 'Fitness', 'Precisa de página para planos', 'contato', 'UUID_PEDRO', NULL, NULL, NULL),
('Consultoria ABC', 'Fernanda Lima', '(41) 95678-9012', 'Curitiba', 'Consultoria', 'Aguardando retorno da proposta', 'proposta', 'UUID_MARIA', NULL, NULL, NULL),
('Restaurante Sabor', 'Marcos Alves', '(51) 96789-0123', 'Porto Alegre', 'Alimentação', 'Não respondeu mais', 'perdido', 'UUID_PEDRO', NULL, NULL, NULL),
('Escola Futuro', 'Patricia Souza', '(11) 97890-1234', 'São Paulo', 'Educação', 'Lead novo, aguardando contato', 'novo', 'UUID_JOAO', NULL, NULL, NULL),
('Loja de Roupas Style', 'Juliana Costa', '(21) 98901-2345', 'Rio de Janeiro', 'Moda', 'Cadastrado hoje', 'novo', 'UUID_MARIA', NULL, NULL, NULL),
('Escritório Advocacia', 'Dr. Paulo', '(31) 99012-3456', 'Belo Horizonte', 'Jurídico', 'Interessado em página institucional', 'contato', 'UUID_JOAO', NULL, NULL, NULL),
('Pet Shop Amigo', 'Ricardo Gomes', '(11) 90123-4567', 'São Paulo', 'Pet', 'Venda fechada semana passada', 'fechado', 'UUID_MARIA', 1500.00, 250.00, NOW() - INTERVAL '10 days');
*/

-- Função auxiliar para seed automático (execute após criar usuários)
CREATE OR REPLACE FUNCTION seed_demo_data()
RETURNS void AS $$
DECLARE
  admin_id UUID;
  joao_id UUID;
  maria_id UUID;
  pedro_id UUID;
BEGIN
  SELECT id INTO admin_id FROM profiles WHERE email = 'admin@portal.com';
  SELECT id INTO joao_id FROM profiles WHERE email = 'joao@freelancer.com';
  SELECT id INTO maria_id FROM profiles WHERE email = 'maria@freelancer.com';
  SELECT id INTO pedro_id FROM profiles WHERE email = 'pedro@freelancer.com';

  IF admin_id IS NULL THEN
    RAISE NOTICE 'Usuário admin@portal.com não encontrado. Crie os usuários no Auth primeiro.';
    RETURN;
  END IF;

  UPDATE profiles SET name = 'Administrador', role = 'admin', phone = '(11) 99999-0000' WHERE id = admin_id;
  UPDATE profiles SET name = 'João Silva', phone = '(11) 98888-1111' WHERE id = joao_id;
  UPDATE profiles SET name = 'Maria Santos', phone = '(21) 97777-2222' WHERE id = maria_id;
  UPDATE profiles SET name = 'Pedro Oliveira', phone = '(31) 96666-3333' WHERE id = pedro_id;

  IF EXISTS (SELECT 1 FROM leads LIMIT 1) THEN
    RAISE NOTICE 'Leads já existem. Seed ignorado.';
    RETURN;
  END IF;

  INSERT INTO leads (company_name, contact_name, whatsapp, city, niche, notes, status, freelancer_id, sale_value, commission_value, closed_at, created_at) VALUES
  ('Tech Solutions Ltda', 'Carlos Mendes', '(11) 91234-5678', 'São Paulo', 'Tecnologia', 'Interessado em landing page para SaaS', 'fechado', joao_id, 1250.00, 250.00, NOW() - INTERVAL '5 days', NOW() - INTERVAL '15 days'),
  ('Padaria Delícia', 'Ana Paula', '(21) 92345-6789', 'Rio de Janeiro', 'Alimentação', 'Quer página para delivery', 'fechado', maria_id, 1250.00, 250.00, NOW() - INTERVAL '3 days', NOW() - INTERVAL '12 days'),
  ('Clínica Saúde+', 'Dr. Roberto', '(31) 93456-7890', 'Belo Horizonte', 'Saúde', 'Landing para captura de pacientes', 'proposta', joao_id, NULL, NULL, NULL, NOW() - INTERVAL '8 days'),
  ('Academia FitPro', 'Lucas Ferreira', '(11) 94567-8901', 'São Paulo', 'Fitness', 'Precisa de página para planos', 'contato', pedro_id, NULL, NULL, NULL, NOW() - INTERVAL '6 days'),
  ('Consultoria ABC', 'Fernanda Lima', '(41) 95678-9012', 'Curitiba', 'Consultoria', 'Aguardando retorno da proposta', 'proposta', maria_id, NULL, NULL, NULL, NOW() - INTERVAL '10 days'),
  ('Restaurante Sabor', 'Marcos Alves', '(51) 96789-0123', 'Porto Alegre', 'Alimentação', 'Não respondeu mais', 'perdido', pedro_id, NULL, NULL, NULL, NOW() - INTERVAL '20 days'),
  ('Escola Futuro', 'Patricia Souza', '(11) 97890-1234', 'São Paulo', 'Educação', 'Lead novo, aguardando contato', 'novo', joao_id, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),
  ('Loja Style', 'Juliana Costa', '(21) 98901-2345', 'Rio de Janeiro', 'Moda', 'Cadastrado hoje', 'novo', maria_id, NULL, NULL, NULL, NOW()),
  ('Escritório Advocacia', 'Dr. Paulo', '(31) 99012-3456', 'Belo Horizonte', 'Jurídico', 'Página institucional', 'contato', joao_id, NULL, NULL, NULL, NOW() - INTERVAL '4 days'),
  ('Pet Shop Amigo', 'Ricardo Gomes', '(11) 90123-4567', 'São Paulo', 'Pet', 'Venda fechada', 'fechado', maria_id, 1500.00, 250.00, NOW() - INTERVAL '10 days', NOW() - INTERVAL '25 days');

  RAISE NOTICE 'Seed concluído com sucesso!';
END;
$$ LANGUAGE plpgsql;

-- Execute: SELECT seed_demo_data();
