export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_KEY) {
    console.error('GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  const { history, system } = req.body || {};

  if (!history || !Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty history' });
  }

  const SYSTEM = system || 'You are ICT Guru, a helpful A/L ICT study assistant for Sri Lankan students.';

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: history,
        generationConfig: { maxOutputTokens: 1200, temperature: 0.7 }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini error:', JSON.stringify(data));
      return res.status(500).json({ error: data?.error?.message || 'Gemini API error', details: data });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      console.error('No reply:', JSON.stringify(data));
      return res.status(500).json({ error: 'Empty response from Gemini' });
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: 'Failed to reach Gemini: ' + err.message });
  }
}
