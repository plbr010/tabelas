# Portal de Indicações

Sistema SaaS completo para gerenciamento de freelancers/comissionados que prospectam clientes para venda de landing pages.

## Funcionalidades

- **Autenticação** com dois perfis: Administrador e Freelancer
- **Dashboard Admin** com métricas, gráficos e KPIs
- **Kanban de Leads** com drag-and-drop entre colunas
- **Cadastro de Leads** com proteção anti-fraude
- **Dashboard Freelancer** com comissões estimadas
- **Sistema de Comissão** automático (R$ 1.250 venda / R$ 250 comissão)
- **Gerenciamento de Freelancers** (criar, editar, desativar)
- **Relatórios** com ranking e taxa de conversão
- **Filtros** avançados por empresa, cidade, WhatsApp, status e freelancer

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Estilização | Tailwind CSS 4 |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) |
| Gráficos | Recharts |
| Kanban | @dnd-kit |
| Formulários | React Hook Form + Zod |
| Notificações | Sonner |

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [Conta no Supabase](https://supabase.com/) (gratuita)
- npm ou yarn

---

## Instalação Passo a Passo

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha um nome (ex: `portal-indicacoes`) e defina uma senha para o banco
4. Aguarde o projeto ser criado (~2 minutos)

### 2. Executar o schema do banco

1. No painel Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie todo o conteúdo de `supabase/migrations/001_initial_schema.sql`
4. Cole no editor e clique em **Run**
5. Verifique se aparece "Success"

### 3. Configurar variáveis de ambiente

1. No Supabase, vá em **Settings > API**
2. Copie a **Project URL** e a **anon public key**
3. Copie também a **service_role key** (mantenha em segredo!)

```bash
cp .env.local.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 4. Instalar dependências e rodar

```bash
cd portal-indicacoes
npm install
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Criar Usuários de Teste

### Via Supabase Dashboard

1. Vá em **Authentication > Users**
2. Clique em **Add User > Create new user**
3. Crie os seguintes usuários:

| E-mail | Senha | Papel |
|--------|-------|-------|
| admin@portal.com | Admin@123 | Admin |
| joao@freelancer.com | Freelancer@123 | Freelancer |
| maria@freelancer.com | Freelancer@123 | Freelancer |
| pedro@freelancer.com | Freelancer@123 | Freelancer |

> Ao criar o admin, adicione em **User Metadata**: `{"name": "Administrador", "role": "admin"}`

### Promover admin e popular dados

No **SQL Editor**, execute:

```sql
-- Promover administrador
UPDATE profiles
SET name = 'Administrador', role = 'admin', phone = '(11) 99999-0000'
WHERE email = 'admin@portal.com';

-- Popular dados de demonstração
SELECT seed_demo_data();
```

---

## Estrutura do Projeto

```
portal-indicacoes/
├── supabase/
│   ├── migrations/001_initial_schema.sql   # Schema + RLS + Triggers
│   └── seed.sql                            # Dados de teste
├── src/
│   ├── app/
│   │   ├── (dashboard)/                    # Rotas autenticadas
│   │   │   ├── dashboard/                  # Painel principal
│   │   │   ├── leads/                      # Kanban + CRUD
│   │   │   ├── freelancers/                # Gestão (admin)
│   │   │   ├── relatorios/                 # Ranking
│   │   │   └── configuracoes/              # Comissões (admin)
│   │   ├── api/admin/freelancers/          # API criação de freelancers
│   │   └── login/                          # Página de login
│   ├── components/                         # Componentes React
│   ├── lib/                                # Actions, Supabase, utils
│   └── types/                              # Tipos TypeScript
└── .env.local.example
```

---

## Regras de Negócio

### Comissão
- Venda padrão: **R$ 1.250,00**
- Comissão padrão: **R$ 250,00**
- Calculada automaticamente ao mover lead para **Fechado**
- Valores configuráveis em **Configurações** (admin)

### Proteção Anti-Fraude
Freelancers **NÃO podem**:
- Excluir leads
- Alterar WhatsApp de leads
- Transferir leads para outro freelancer

Apenas o administrador tem essas permissões.

### Kanban — Colunas
1. Novo Interessado
2. Em Contato
3. Proposta Enviada
4. Fechado
5. Perdido

---

## Deploy (Produção)

### Vercel (recomendado)

1. Faça push do código para GitHub
2. Importe no [vercel.com](https://vercel.com)
3. Adicione as 3 variáveis de ambiente
4. Deploy automático!

### Variáveis necessárias no deploy:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Comandos Úteis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Verificar código
```

---

## Suporte

Em caso de dúvidas sobre configuração do Supabase, consulte a [documentação oficial](https://supabase.com/docs).
