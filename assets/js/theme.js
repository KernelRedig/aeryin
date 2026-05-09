const ThemeManager = {
  STORAGE_KEY: 'gv_theme',
  DARK_THEME: 'dark',
  LIGHT_THEME: 'light',
  currentTheme: null,

  init() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.currentTheme = savedTheme || (prefersDark ? this.DARK_THEME : this.LIGHT_THEME);
    this.applyTheme(this.currentTheme);
    
    this.addToggleButton();
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.setTheme(e.matches ? this.DARK_THEME : this.LIGHT_THEME);
      }
    });
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.updateToggleIcon(theme);
    this.currentTheme = theme;
  },

  toggleTheme() {
    const newTheme = this.currentTheme === this.DARK_THEME ? this.LIGHT_THEME : this.DARK_THEME;
    this.setTheme(newTheme);
  },

  setTheme(theme) {
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.applyTheme(theme);
  },

  getTheme() {
    return this.currentTheme;
  },

  isDark() {
    return this.currentTheme === this.DARK_THEME;
  },

  addToggleButton() {
    const existingToggle = document.querySelector('.theme-toggle');
    if (existingToggle) return;

    const navbar = document.querySelector('.topbar');
    if (!navbar) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle';
    toggleBtn.setAttribute('aria-label', 'Alternar tema');
    toggleBtn.innerHTML = this.currentTheme === this.DARK_THEME ? this.getSunIcon() : this.getMoonIcon();
    toggleBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 8px 12px;
      cursor: pointer;
      color: white;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    toggleBtn.addEventListener('mouseenter', () => {
      toggleBtn.style.background = 'rgba(255, 255, 255, 0.2)';
      toggleBtn.style.transform = 'scale(1.05)';
    });
    
    toggleBtn.addEventListener('mouseleave', () => {
      toggleBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      toggleBtn.style.transform = 'scale(1)';
    });
    
    toggleBtn.addEventListener('click', () => this.toggleTheme());
    
    const navRight = navbar.querySelector('.nav-right') || this.createNavRight(navbar);
    navRight.appendChild(toggleBtn);
  },

  createNavRight(navbar) {
    const navRight = document.createElement('div');
    navRight.className = 'nav-right';
    navRight.style.cssText = 'display: flex; align-items: center; gap: 16px;';
    navbar.appendChild(navRight);
    return navRight;
  },

  updateToggleIcon(theme) {
    const toggleBtn = document.querySelector('.theme-toggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = theme === this.DARK_THEME ? this.getSunIcon() : this.getMoonIcon();
    }
  },

  getSunIcon() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>`;
  },

  getMoonIcon() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>`;
  }
};

if (typeof window !== 'undefined') {
  window.ThemeManager = ThemeManager;
}