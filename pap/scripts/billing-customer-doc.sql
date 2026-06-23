-- Add customer document info for AFIP invoicing
ALTER TABLE _public.tenant_billing_config
  ADD COLUMN IF NOT EXISTS customer_doc_type INTEGER DEFAULT 80,
  ADD COLUMN IF NOT EXISTS customer_doc_number TEXT;
