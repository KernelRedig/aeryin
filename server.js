const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Force Vercel to bundle these directories into the serverless function
try {
  fs.readdirSync(path.join(__dirname, 'auth'));
  fs.readdirSync(path.join(__dirname, 'mm2', 'values'));
  fs.readdirSync(path.join(__dirname, 'blox-fruits', 'values'));
  fs.readdirSync(path.join(__dirname, 'assets', 'images'));
  fs.readFileSync(path.join(__dirname, 'create-account.html'));
  fs.readFileSync(path.join(__dirname, 'inventory-calculator.html'));
  fs.readFileSync(path.join(__dirname, 'trade-checker.html'));
  fs.readFileSync(path.join(__dirname, 'watchlist.html'));
  fs.readFileSync(path.join(__dirname, 'terms.html'));
  fs.readFileSync(path.join(__dirname, '404.html'));
  fs.readFileSync(path.join(__dirname, 'mm2', 'index.html'));
} catch (e) {}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  
  // Clean URL to remove trailing slash if present (for logic only)
  let requestPath = req.path.endsWith('/') && req.path.length > 1 ? req.path.slice(0, -1) : req.path;
  
  // 1. Try exact path (if it has extension like .css, .png, etc.)
  let exactPath = path.join(__dirname, requestPath);
  if (fs.existsSync(exactPath) && fs.statSync(exactPath).isFile()) {
    return res.sendFile(exactPath);
  }
  
  // 2. Try .html extension (clean URLs)
  let htmlPath = path.join(__dirname, requestPath + '.html');
  if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
    return res.sendFile(htmlPath);
  }
  
  // 3. Try index.html in directory
  let indexPath = path.join(__dirname, requestPath, 'index.html');
  if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
    return res.sendFile(indexPath);
  }
  
  next();
});

app.use(express.static(__dirname, { extensions: ['html'] }));
app.use(express.urlencoded({ extended: true }));

// Profile routes (@username)
app.get('/@:username', (req, res) => {
  res.sendFile(path.join(__dirname, 'profile', 'index.html'));
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((req, res, next) => {
  if (!req.headers['authorization']) {
    const authHeader = req.headers['cookie'] || '';
    if (authHeader.includes('oauth_state=')) {
      const match = authHeader.match(/oauth_state=([^;]+)/);
      if (match) req.headers['authorization'] = match[1];
    }
  }
  next();
});

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD_FILE = path.join(__dirname, 'admin_password.txt');
const BACKUP_DIR = path.join(__dirname, 'backups');

const MM2_CATEGORIES = {
  'common-values.json': 'Common Tier',
  'uncommon-values.json': 'Uncommon Tier',
  'rares-values.json': 'Rares Tier',
  'legendaries-values.json': 'Legendaries Tier',
  'godly-values.json': 'Godly Tier',
  'unique-values.json': 'Unique Tier',
  'ancients-values.json': 'Ancients Tier',
  'vintages-values.json': 'Vintages Tier',
  'evos-values.json': 'Evos Tier',
  'chromas-values.json': 'Chromas Tier'
};

const BLOX_CATEGORIES = {
  'common-values.json': 'Common Tier',
  'uncommon-values.json': 'Uncommon Tier',
  'rares-values.json': 'Rares Tier',
  'legendaries-values.json': 'Legendaries Tier',
  'mythicals-values.json': 'Mythicals Tier',
  'ancients-values.json': 'Ancients Tier',
  'godlies-values.json': 'Godlies Tier',
  'chromas-values.json': 'Chromas Tier',
  'sets-values.json': 'Sets'
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getPassword() {
  if (fs.existsSync(ADMIN_PASSWORD_FILE)) {
    return fs.readFileSync(ADMIN_PASSWORD_FILE, 'utf8').trim();
  }
  return 'admin123';
}

function setPassword(password) {
  fs.writeFileSync(ADMIN_PASSWORD_FILE, password);
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyToken(token) {
  const tokenHash = hashToken(token);
  const validHashesFile = path.join(__dirname, 'valid_tokens.txt');
  if (fs.existsSync(validHashesFile)) {
    const hashes = fs.readFileSync(validHashesFile, 'utf8').split('\n').filter(Boolean);
    return hashes.includes(tokenHash);
  }
  return false;
}

function saveToken(token) {
  const tokenHash = hashToken(token);
  const validHashesFile = path.join(__dirname, 'valid_tokens.txt');
  fs.appendFileSync(validHashesFile, tokenHash + '\n');
}

function readJSONFile(filepath) {
  try {
    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function writeJSONFile(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function getCategories(game) {
  const gamePath = path.join(__dirname, game === 'mm2' ? 'mm2/values' : 'blox-fruits/values');
  const categories = game === 'mm2' ? MM2_CATEGORIES : BLOX_CATEGORIES;
  return Object.keys(categories).map(file => categories[file]);
}

function getItems(game, category) {
  const gamePath = game === 'mm2' ? 'mm2/values' : 'blox-fruits/values';
  const categories = game === 'mm2' ? MM2_CATEGORIES : BLOX_CATEGORIES;
  const filename = Object.keys(categories).find(f => categories[f] === category);
  if (!filename) return [];
  
  const filepath = path.join(__dirname, gamePath, filename);
  const data = readJSONFile(filepath);
  if (!data) return [];
  
  let items = [];
  Object.values(data).forEach(tier => {
    if (Array.isArray(tier)) {
      items = items.concat(tier);
    }
  });
  return items;
}

function getAllItems(game) {
  const categories = game === 'mm2' ? MM2_CATEGORIES : BLOX_CATEGORIES;
  let allItems = [];
  Object.keys(categories).forEach(cat => {
    allItems = allItems.concat(getItems(game, categories[cat]));
  });
  return allItems;
}

function updateItem(game, category, item, index) {
  const gamePath = game === 'mm2' ? 'mm2/values' : 'blox-fruits/values';
  const categories = game === 'mm2' ? MM2_CATEGORIES : BLOX_CATEGORIES;
  const filename = Object.keys(categories).find(f => categories[f] === category);
  if (!filename) return false;
  
  const filepath = path.join(__dirname, gamePath, filename);
  const data = readJSONFile(filepath);
  if (!data) return false;
  
  const tierKeys = Object.keys(data);
  if (tierKeys.length > 0) {
    const tierKey = tierKeys[0];
    if (data[tierKey][index]) {
      data[tierKey][index] = item;
      writeJSONFile(filepath, data);
      return true;
    }
  }
  return false;
}

function addNewItem(game, category, item) {
  const gamePath = game === 'mm2' ? 'mm2/values' : 'blox-fruits/values';
  const categories = game === 'mm2' ? MM2_CATEGORIES : BLOX_CATEGORIES;
  const filename = Object.keys(categories).find(f => categories[f] === category);
  if (!filename) return false;
  
  const filepath = path.join(__dirname, gamePath, filename);
  let data = readJSONFile(filepath);
  if (!data) {
    data = {};
  }
  
  const tierKeys = Object.keys(data);
  if (tierKeys.length > 0) {
    const tierKey = tierKeys[0];
    if (!Array.isArray(data[tierKey])) {
      data[tierKey] = [];
    }
    data[tierKey].push(item);
    writeJSONFile(filepath, data);
    return true;
  }
  return false;
}

function deleteItem(game, category, index) {
  const gamePath = game === 'mm2' ? 'mm2/values' : 'blox-fruits/values';
  const categories = game === 'mm2' ? MM2_CATEGORIES : BLOX_CATEGORIES;
  const filename = Object.keys(categories).find(f => categories[f] === category);
  if (!filename) return false;
  
  const filepath = path.join(__dirname, gamePath, filename);
  const data = readJSONFile(filepath);
  if (!data) return false;
  
  const tierKeys = Object.keys(data);
  if (tierKeys.length > 0) {
    const tierKey = tierKeys[0];
    if (data[tierKey][index]) {
      data[tierKey].splice(index, 1);
      writeJSONFile(filepath, data);
      return true;
    }
  }
  return false;
}

function getStats() {
  const mm2Items = getAllItems('mm2');
  const bloxItems = getAllItems('blox-fruits');
  const totalItems = mm2Items.length + bloxItems.length;
  
  const mm2Categories = {};
  Object.values(MM2_CATEGORIES).forEach(cat => {
    mm2Categories[cat] = getItems('mm2', cat).length;
  });
  
  const bfCategories = {};
  Object.values(BLOX_CATEGORIES).forEach(cat => {
    bfCategories[cat] = getItems('blox-fruits', cat).length;
  });
  
  return {
    totalItems,
    totalFiles: Object.keys(MM2_CATEGORIES).length + Object.keys(BLOX_CATEGORIES).length,
    lastUpdate: new Date().toLocaleDateString('pt-BR'),
    byCategory: { ...mm2Categories, ...bfCategories }
  };
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `backup_${timestamp}.zip`;
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  const { execSync } = require('child_process');
  
  try {
    const mm2Path = path.join(__dirname, 'mm2/values');
    const bfPath = path.join(__dirname, 'blox-fruits/values');
    
    const tempDir = path.join(__dirname, 'temp_backup_' + timestamp);
    ensureDir(tempDir);
    
    fs.cpSync(mm2Path, path.join(tempDir, 'mm2-values'), { recursive: true });
    fs.cpSync(bfPath, path.join(tempDir, 'blox-fruits-values'), { recursive: true });
    
    execSync(`powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${backupPath}' -Force"`, { cwd: __dirname });
    
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    const stats = fs.statSync(backupPath);
    const size = (stats.size / 1024).toFixed(1) + ' KB';
    
    return { name: backupName, date: new Date().toLocaleString('pt-BR'), size };
  } catch (e) {
    console.error('Backup error:', e);
    return null;
  }
}

function getBackups() {
  ensureDir(BACKUP_DIR);
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.zip'));
  
  return files.map(f => {
    const filepath = path.join(BACKUP_DIR, f);
    const stats = fs.statSync(filepath);
    const date = stats.mtime.toLocaleString('pt-BR');
    const size = (stats.size / 1024).toFixed(1) + ' KB';
    return { name: f, date, size };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function restoreBackup(name) {
  const backupPath = path.join(BACKUP_DIR, name);
  if (!fs.existsSync(backupPath)) return false;
  
  const { execSync } = require('child_process');
  const tempDir = path.join(__dirname, 'temp_restore');
  
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
    ensureDir(tempDir);
    
    execSync(`powershell -Command "Expand-Archive -Path '${backupPath}' -DestinationPath '${tempDir}' -Force"`, { cwd: __dirname });
    
    const mm2Backup = path.join(tempDir, 'mm2-values');
    const bfBackup = path.join(tempDir, 'blox-fruits-values');
    
    if (fs.existsSync(mm2Backup)) {
      fs.cpSync(mm2Backup, path.join(__dirname, 'mm2/values'), { recursive: true });
    }
    if (fs.existsSync(bfBackup)) {
      fs.cpSync(bfBackup, path.join(__dirname, 'blox-fruits/values'), { recursive: true });
    }
    
    fs.rmSync(tempDir, { recursive: true, force: true });
    return true;
  } catch (e) {
    console.error('Restore error:', e);
    return false;
  }
}

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === getPassword()) {
    const token = generateToken();
    saveToken(token);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.get('/api/admin/check', (req, res) => {
  const token = req.headers.authorization;
  if (token && verifyToken(token)) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.get('/api/admin/categories', (req, res) => {
  const token = req.headers.authorization;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { game } = req.query;
  const categories = getCategories(game || 'mm2');
  res.json({ categories });
});

app.get('/api/admin/items', (req, res) => {
  const token = req.headers.authorization;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { game, category } = req.query;
  const items = getItems(game || 'mm2', category);
  res.json({ items });
});

app.put('/api/admin/item', (req, res) => {
  const token = req.headers.authorization;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { game, category, item, index } = req.body;
  const success = updateItem(game, category, item, index);
  res.json({ success });
});

app.post('/api/admin/item', (req, res) => {
  const token = req.headers.authorization;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { game, category, item } = req.body;
  const success = addNewItem(game, category, item);
  res.json({ success });
});

app.delete('/api/admin/item', (req, res) => {
  const token = req.headers.authorization;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { game, category, index } = req.query;
  const success = deleteItem(game, category, parseInt(index));
  res.json({ success });
});

app.get('/api/admin/stats', (req, res) => {
  const token = req.headers.authorization;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({ stats: getStats() });
});

app.post('/api/admin/password', (req, res) => {
  const token = req.headers.authorization;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { password } = req.body;
  setPassword(password);
  res.json({ success: true });
});

app.post('/api/admin/backup', (req, res) => {
  const token = req.headers.authorization;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const backup = createBackup();
  res.json({ success: !!backup, backup });
});

app.get('/api/admin/backups', (req, res) => {
  const token = req.headers.authorization;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const backups = getBackups();
  res.json({ backups });
});

app.post('/api/admin/restore', (req, res) => {
  const { name } = req.body;
  const success = restoreBackup(name);
  res.json({ success });
});

app.get('/oauth/callback', async (req, res) => {
  res.sendFile(path.join(__dirname, 'oauth', 'callback.html'));
});

app.get('/auth/callback', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth', 'callback.html'));
});

app.post('/api/verify', (req, res) => {
  const { username, userId } = req.body;
  
  if (!username || !userId) {
    return res.json({ success: false, error: 'Missing parameters' });
  }

  let profiles = {};
  try {
    profiles = JSON.parse(fs.readFileSync(path.join(__dirname, 'profiles.json'), 'utf8'));
  } catch (e) {}

  profiles[username.toLowerCase()] = {
    username: username,
    userId: parseInt(userId),
    verifiedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(path.join(__dirname, 'profiles.json'), JSON.stringify(profiles, null, 2));
    res.json({ success: true, username: username });
  } catch (e) {
    res.json({ success: false, error: 'Failed to save profile' });
  }
});

app.get('/api/user/:username', (req, res) => {
  const { username } = req.params;
  let profiles = {};
  try {
    profiles = JSON.parse(fs.readFileSync(path.join(__dirname, 'profiles.json'), 'utf8'));
  } catch (e) {}
  
  const profile = profiles[username.toLowerCase()];
  
  if (profile) {
    res.json({ verified: true, profile });
  } else {
    res.json({ verified: false });
  }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

app.get('/@:username', (req, res) => {
  const { username } = req.params;
  res.sendFile(path.join(__dirname, 'profile', 'index.html'));
});

app.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  const savedState = sessionStorage.getItem('oauth_state');
  
  if (!savedState || savedState !== state) {
    return res.redirect('/create-account.html?error=invalid_state');
  }

  const username = sessionStorage.getItem('oauth_username');
  const userId = sessionStorage.getItem('oauth_userId');

  if (!code || !username) {
    return res.redirect('/create-account.html?error=missing_params');
  }

  const profiles = JSON.parse(fs.readFileSync(path.join(__dirname, 'profiles.json'), 'utf8') || '{}');
  profiles[username.toLowerCase()] = {
    username: username,
    userId: userId,
    verifiedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(__dirname, 'profiles.json'), JSON.stringify(profiles, null, 2));

  res.redirect('/@' + username + '?verified=true');
});

app.get('/api/user/:username', (req, res) => {
  const { username } = req.params;
  const profiles = JSON.parse(fs.readFileSync(path.join(__dirname, 'profiles.json'), 'utf8') || '{}');
  const profile = profiles[username.toLowerCase()];
  
  if (profile) {
    res.json({ verified: true, profile });
  } else {
    res.json({ verified: false });
  }
});

// Roblox API routes (backend proxy)
app.get('/api/roblox/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });
  
  try {
    const response = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(q)}&limit=10`, {
      headers: { 'User-Agent': 'GoldenValues/1.0' }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search Roblox', details: err.message });
  }
});

app.get('/api/roblox/user/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });
  
  try {
    const response = await fetch(`https://users.roblox.com/v1/users/${id}`, {
      headers: { 'User-Agent': 'GoldenValues/1.0' }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get Roblox user', details: err.message });
  }
});

app.get('/api/roblox/avatar/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });
  
  try {
    const response = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png`, {
      headers: { 'User-Agent': 'GoldenValues/1.0' }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get avatar', details: err.message });
  }
});

// Token login - verify token and get session
app.post('/api/auth/token-login', async (req, res) => {
  const { token } = req.body;
  if (!token || token.length < 10) return res.status(400).json({ error: 'Invalid token' });

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    'https://utrahbaolwcnyisxiaft.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cmFoYmFvbHdjbnlpc3hpYWZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI2MTkxNywiZXhwIjoyMDkzODM3OTE3fQ.aI2jFvR0lqQ3lYtCqJ_4V5lZkU8lK4xRvT1oZ3QwYvQ'
  );

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
});

// Topics page routes - order matters! /topics must come before /topics/:id
app.get('/topics', (req, res) => {
  res.sendFile(path.join(__dirname, 'topics', 'index.html'));
});

app.get('/topics/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'topics', 'view.html'));
});

module.exports = app;