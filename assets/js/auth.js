const AuthManager = {
  session: null,
  user: null,

  async init() {
    const { data: { session } } = await window.supabase.auth.getSession();
    this.session = session;
    this.user = session?.user || null;
    
    window.supabase.auth.onAuthStateChange((event, session) => {
      this.session = session;
      this.user = session?.user || null;
      this.updateAuthUI();
      
      if (event === 'SIGNED_IN') {
        this.createOrUpdateProfile(session.user);
      }
      
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('gv_user');
        this.updateAuthUI();
      }
    });
    
    this.updateAuthUI();
    return this.user;
  },

  async createOrUpdateProfile(user) {
    const profile = {
      id: user.id,
      email: user.email,
      username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      avatar_url: user.user_metadata?.avatar_url || null,
      provider: user.app_metadata?.provider || 'email',
      created_at: new Date().toISOString()
    };

    localStorage.setItem('gv_user', JSON.stringify(profile));

    const { data, error } = await window.supabase
      .from('profiles')
      .upsert([profile], { onConflict: 'id' });

    if (error) {
      console.error('Profile creation error:', error);
    }
  },

  updateAuthUI() {
    const authButtons = document.querySelectorAll('.auth-btn');
    const userMenu = document.querySelector('.user-menu');
    
    authButtons?.forEach(btn => {
      if (this.user) {
        btn.style.display = 'none';
      } else {
        btn.style.display = 'flex';
      }
    });

    if (userMenu) {
      if (this.user) {
        userMenu.style.display = 'flex';
        const avatar = userMenu.querySelector('.user-avatar');
        const username = userMenu.querySelector('.user-name');
        if (avatar) avatar.src = this.user.user_metadata?.avatar_url || '/assets/default-avatar.png';
        if (username) username.textContent = this.user.user_metadata?.full_name || this.user.email?.split('@')[0] || 'User';
      } else {
        userMenu.style.display = 'none';
      }
    }
  },

  async signUp(email, password, metadata = {}) {
    const { data, error } = await window.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    if (error) throw error;
    return data;
  },

  async signInWithEmail(email, password) {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  async signInWithDiscord() {
    const { data, error } = await window.supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    const { data, error } = await window.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await window.supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('gv_user');
    window.location.href = '/';
  },

  getUser() {
    return this.user;
  },

  isAuthenticated() {
    return !!this.user;
  }
};

if (typeof window !== 'undefined') {
  window.AuthManager = AuthManager;
}