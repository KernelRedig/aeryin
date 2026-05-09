const supabaseUrl = 'https://utrahbaolwcnyisxiaft.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cmFoYmFvbHdjbnlpc3hpYWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjE5MTcsImV4cCI6MjA5MzgzNzkxN30.wYgWsMdNbi91zAEMivzRPo3raQuExiXTjlfTWYfB860';

function getSupabase() {
  if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    return supabase.createClient(supabaseUrl, supabaseAnonKey);
  }
  return null;
}

async function initSupabase() {
  const client = getSupabase();
  if (!client) {
    console.error('Supabase not loaded');
    return null;
  }
  const { data, error } = await client.auth.getSession();
  if (error) {
    console.error('Supabase init error:', error);
    return null;
  }
  return data.session;
}

function getCurrentUser() {
  const client = getSupabase();
  return client ? client.auth.getUser() : null;
}

async function signOut() {
  const client = getSupabase();
  if (!client) return false;
  const { error } = await client.auth.signOut();
  if (error) console.error('Sign out error:', error);
  return !error;
}

window.supabaseClient = { initSupabase, getCurrentUser, signOut, getSupabase };