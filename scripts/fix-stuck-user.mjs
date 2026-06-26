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

const email = (process.argv[2] ?? "").trim().toLowerCase();

if (!email) {
  console.error("Uso: node scripts/fix-stuck-user.mjs email@exemplo.com");
  process.exit(1);
}

const env = loadEnv();
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

async function listUsers() {
  const res = await fetch(`${baseUrl}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers,
  });
  const data = await res.json();
  return data.users ?? [];
}

async function deleteUser(id) {
  await fetch(`${baseUrl}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers,
  });
}

async function deleteProfile(id) {
  await fetch(`${baseUrl}/rest/v1/profiles?id=eq.${id}`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=minimal" },
  });
}

async function deleteCodes() {
  await fetch(`${baseUrl}/rest/v1/verification_codes?email=eq.${email}`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=minimal" },
  });
}

async function main() {
  const users = await listUsers();
  const user = users.find((u) => u.email?.toLowerCase() === email);

  if (!user) {
    console.log(`Nenhum usuário encontrado para ${email}`);
    return;
  }

  await deleteProfile(user.id);
  await deleteUser(user.id);
  await deleteCodes();

  console.log(`✓ Conta removida: ${email}`);
  console.log("Agora pode criar a conta novamente em /setup");
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
