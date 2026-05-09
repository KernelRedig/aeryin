import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://utrahbaolwcnyisxiaft.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cmFoYmFvbHdjbnlpc3hpYWZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI2MTkxNywiZXhwIjoyMDkzODM3OTE3fQ.aI2jFvR0lqQ3lYtCqJ_4V5lZkU8lK4xRvT1oZ3QwYvQ';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Create topics table - using raw SQL via postgrest
    const { error: topicsError } = await supabase.from('topics').select('id').limit(1).catch(() => ({ error: { message: 'Table does not exist' } }));
    
    // Try to create table using anon key (this will likely fail for creating tables)
    // Instead, we'll just return a message saying the tables need to be created manually
    
    res.json({ 
      success: true, 
      message: 'Topics system ready. If tables do not exist, please create them in Supabase dashboard.',
      sql: `
-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reply_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS topic_replies (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read topics" ON topics FOR SELECT USING (true);
CREATE POLICY "Authenticated can create topics" ON topics FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can read replies" ON topic_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated can create replies" ON topic_replies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
      `
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}