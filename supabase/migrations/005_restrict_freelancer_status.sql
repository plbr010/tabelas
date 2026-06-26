-- Apenas administradores podem alterar o status dos leads
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

DROP TRIGGER IF EXISTS leads_protect_fields ON leads;
CREATE TRIGGER leads_protect_fields
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION protect_lead_fields();
