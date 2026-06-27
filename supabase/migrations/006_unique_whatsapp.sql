-- Normaliza WhatsApp (só dígitos) e impede duplicatas
UPDATE leads
SET whatsapp = regexp_replace(whatsapp, '[^0-9]', '', 'g')
WHERE whatsapp ~ '[^0-9]';

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_whatsapp_unique ON leads (whatsapp);
