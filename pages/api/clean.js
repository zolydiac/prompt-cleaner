// /api/clean.js
export default async function handler(req, res) {
  const { inputPrompt, isPro } = req.body;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: isPro ? 'gpt-4' : 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: isPro
            ? 'Advanced system prompt for GPT-4'
            : 'Simpler system prompt for GPT-3.5',
        },
        { role: 'user', content: `Clean this prompt:\n\n${inputPrompt}` },
      ],
      max_tokens: isPro ? 1000 : 500,
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  if (!response.ok) return res.status(400).json({ error: data.error?.message || 'Error' });

  res.status(200).json({ cleaned: data.choices[0].message.content });
}