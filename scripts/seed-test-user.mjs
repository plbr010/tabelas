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

const testUser = {
  name: "Freelancer Teste",
  email: "teste@portal.com",
  password: "Teste@123",
  role: "freelancer",
};

const authHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

async function api(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...authHeaders, ...options.headers },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.msg || data?.message || text || res.statusText);
  }
  return data;
}

async function main() {
  const listed = await api("/auth/v1/admin/users?page=1&per_page=1000");
  const existing = listed.users?.find(
    (u) => u.email?.toLowerCase() === testUser.email
  );

  let userId = existing?.id;

  if (existing) {
    await api(`/auth/v1/admin/users/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: { name: testUser.name, role: testUser.role },
      }),
    });
    console.log("✓ Conta de teste atualizada");
  } else {
    const created = await api("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: { name: testUser.name, role: testUser.role },
      }),
    });
    userId = created.id;
    console.log("✓ Conta de teste criada");
  }

  await fetch(`${baseUrl}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      ...authHeaders,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      id: userId,
      name: testUser.name,
      email: testUser.email,
      role: testUser.role,
      active: true,
    }),
  });

  console.log("\nConta de teste (freelancer):");
  console.log("  E-mail: teste@portal.com");
  console.log("  Senha:  Teste@123");
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
