-- Add adminKey column to Plico table for secure poll management
ALTER TABLE "Plico" ADD COLUMN IF NOT EXISTS "adminKey" VARCHAR(64);

-- Create index for faster admin key lookups
CREATE INDEX IF NOT EXISTS idx_plico_admin_key ON "Plico"("adminKey");