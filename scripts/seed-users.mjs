import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    env[line.slice(0, i)] = line.slice(i + 1);
  }
  return env;
}

const env = loadEnv();
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!baseUrl || !serviceKey) {
  console.error("Variáveis do Supabase não encontradas no .env.local");
  process.exit(1);
}

const authHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

const users = [];

async function api(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...authHeaders, ...options.headers },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      data?.msg ||
      data?.message ||
      data?.error_description ||
      (typeof data === "string" ? data : JSON.stringify(data)) ||
      text ||
      res.statusText;
    throw new Error(message);
  }

  return data;
}

async function ensureDatabaseReady() {
  const res = await fetch(`${baseUrl}/rest/v1/profiles?select=id&limit=1`, {
    headers: authHeaders,
  });

  if (res.status === 404 || res.status === 400) {
    throw new Error(
      "A tabela 'profiles' não existe. Execute o arquivo supabase/migrations/001_initial_schema.sql no SQL Editor do Supabase."
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Banco indisponível: ${text || res.statusText}`);
  }
}

async function listUsers() {
  const data = await api("/auth/v1/admin/users?page=1&per_page=1000");
  return data.users ?? [];
}

async function upsertProfile(userId, { name, email, role }) {
  const res = await fetch(`${baseUrl}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      ...authHeaders,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      id: userId,
      name,
      email,
      role,
      active: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      message = JSON.parse(text).message || text;
    } catch {}
    throw new Error(`Perfil (${email}): ${message}`);
  }
}

async function createOrUpdateUser({ name, email, password, role }) {
  const existingUsers = await listUsers();
  const existing = existingUsers.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (existing) {
    await api(`/auth/v1/admin/users/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role },
      }),
    });

    await upsertProfile(existing.id, { name, email, role });
    console.log(`✓ Conta atualizada: ${email} (${role})`);
    return;
  }

  const data = await api("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    }),
  }).catch(async (err) => {
    const allUsers = await listUsers();
    const maybeExisting = allUsers.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (maybeExisting) return maybeExisting;

    console.error(`Detalhes (${email}):`, err.message);
    throw new Error(
      `${err.message}. Se o erro persistir, execute supabase/migrations/002_fix_auth.sql no SQL Editor do Supabase.`
    );
  });

  if (!data?.id) {
    throw new Error(`Criar (${email}): resposta inválida`);
  }

  await upsertProfile(data.id, { name, email, role });
  console.log(`✓ Conta criada: ${email} (${role})`);
}

async function main() {
  console.log("Criando contas no Supabase...\n");
  await ensureDatabaseReady();

  for (const user of users) {
    await createOrUpdateUser(user);
  }

  console.log("\nPronto! Conta admin:");
  console.log("  plbrpc@gmail.com / Pedro1p2e@");
}

main().catch((err) => {
  console.error("\nErro:", err.message);
  process.exit(1);
});
