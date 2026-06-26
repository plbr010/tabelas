import nodemailer from "nodemailer";
import { Resend } from "resend";

function buildEmailContent(code: string, name: string) {
  return {
    subject: `${code} — Código de verificação`,
    text: `Olá ${name},\n\nSeu código de verificação é: ${code}\n\nVálido por 15 minutos.\n\nSe você não solicitou, ignore este e-mail.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">Portal de Indicações</h2>
        <p>Olá <strong>${name}</strong>,</p>
        <p>Use o código abaixo para confirmar seu cadastro:</p>
        <div style="background:#f1f5f9;border-radius:12px;padding:20px;text-align:center;margin:24px 0">
          <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0f172a">${code}</span>
        </div>
        <p style="color:#64748b;font-size:14px">Válido por 15 minutos. Não compartilhe este código.</p>
      </div>
    `,
  };
}

function translateEmailError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("only send testing emails to your own")) {
    return (
      "No modo teste do Resend, o código só chega em plbrpc@gmail.com. " +
      "Para enviar a outros e-mails, configure o Gmail SMTP no .env.local " +
      "ou verifique um domínio em resend.com/domains."
    );
  }

  if (lower.includes("verify a domain")) {
    return (
      "Verifique um domínio no Resend (resend.com/domains) ou use Gmail SMTP no .env.local."
    );
  }

  return message;
}

async function sendViaResend(
  to: string,
  code: string,
  name: string
): Promise<{ ok: true } | { ok: false; error: string } | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const from =
    process.env.EMAIL_FROM ?? "Portal de Indicações <onboarding@resend.dev>";
  const content = buildEmailContent(code, name);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });

    if (error) {
      return { ok: false, error: translateEmailError(error.message) };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao enviar e-mail";
    return { ok: false, error: message };
  }
}

async function sendViaSmtp(
  to: string,
  code: string,
  name: string
): Promise<{ ok: true } | { ok: false; error: string } | null> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const from =
    process.env.EMAIL_FROM ?? `"Portal de Indicações" <${user}>`;
  const content = buildEmailContent(code, name);

  try {
    await transporter.sendMail({
      from,
      to,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao enviar e-mail";
    return { ok: false, error: message };
  }
}

export async function sendVerificationCodeEmail(
  to: string,
  code: string,
  name: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resendResult = await sendViaResend(to, code, name);

  if (resendResult?.ok) return resendResult;

  const smtpResult = await sendViaSmtp(to, code, name);
  if (smtpResult?.ok) return smtpResult;

  if (resendResult && !resendResult.ok) {
    return resendResult;
  }

  if (smtpResult && !smtpResult.ok) {
    return smtpResult;
  }

  return {
    ok: false,
    error:
      "E-mail não configurado. Use RESEND_API_KEY ou Gmail SMTP no .env.local",
  };
}

export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
