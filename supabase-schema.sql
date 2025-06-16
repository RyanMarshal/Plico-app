-- Create Plico table
CREATE TABLE IF NOT EXISTS "Plico" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "question" VARCHAR(280) NOT NULL,
  "creatorId" TEXT DEFAULT gen_random_uuid()::text,
  "finalized" BOOLEAN NOT NULL DEFAULT false,
  "finalizedAt" TIMESTAMP(3),
  "closesAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Plico_pkey" PRIMARY KEY ("id")
);

-- Create Option table
CREATE TABLE IF NOT EXISTS "Option" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "text" VARCHAR(80) NOT NULL,
  "voteCount" INTEGER NOT NULL DEFAULT 0,
  "plicoId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- Create index on plicoId
CREATE INDEX IF NOT EXISTS "Option_plicoId_idx" ON "Option"("plicoId");

-- Add foreign key constraint
ALTER TABLE "Option" ADD CONSTRAINT "Option_plicoId_fkey" 
  FOREIGN KEY ("plicoId") REFERENCES "Plico"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt
CREATE TRIGGER update_plico_updated_at BEFORE UPDATE ON "Plico"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_option_updated_at BEFORE UPDATE ON "Option"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();