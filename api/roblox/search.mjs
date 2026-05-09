export default async function handler(req, res) {
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
}