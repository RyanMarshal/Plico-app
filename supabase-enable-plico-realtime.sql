-- Enable real-time for the Plico table to track poll status changes
ALTER publication supabase_realtime ADD TABLE public."Plico";

-- Verify real-time is enabled for both tables
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;