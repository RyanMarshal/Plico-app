-- Check if real-time is enabled on tables
SELECT 
  schemaname,
  tablename 
FROM 
  pg_publication_tables 
WHERE 
  pubname = 'supabase_realtime';

-- If tables are not listed above, enable real-time
-- Note: Run these one at a time and ignore "already member" errors
ALTER PUBLICATION supabase_realtime ADD TABLE "Option";
ALTER PUBLICATION supabase_realtime ADD TABLE "Plico";

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM 
  pg_tables 
WHERE 
  schemaname = 'public' 
  AND tablename IN ('Option', 'Plico');

-- If RLS is enabled (rowsecurity = true), we need policies
-- Create policies for anonymous read access
CREATE POLICY "Enable read access for all users" ON "Option"
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "Plico"
  FOR SELECT USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON "Option" TO anon;
GRANT SELECT ON "Plico" TO anon;

-- Verify the grants
SELECT 
  grantee, 
  table_schema, 
  table_name, 
  privilege_type 
FROM 
  information_schema.role_table_grants 
WHERE 
  table_schema = 'public' 
  AND table_name IN ('Option', 'Plico')
  AND grantee = 'anon';