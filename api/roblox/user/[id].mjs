export default async function handler(req, res) {
  const { id } = req.query;
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
}