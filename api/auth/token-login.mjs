import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://utrahbaolwcnyisxiaft.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cmFoYmFvbHdjbnlpc3hpYWZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI2MTkxNywiZXhwIjoyMDkzODM3OTE3fQ.aI2jFvR0lqQ3lYtCqJ_4V5lZkU8lK4xRvT1oZ3QwYvQ';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;
  if (!token || token.length < 10) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, email')
      .eq('recovery_token', token)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email
    });

    if (authError || !authData) {
      return res.status(500).json({ error: 'Failed to generate login link' });
    }

    res.json({ message: 'Token verified. Check your email for the login link.', email: profile.email, username: profile.username });
  } catch (err) {
    res.status(500).json({ error: 'Token verification failed', details: err.message });
  }
}