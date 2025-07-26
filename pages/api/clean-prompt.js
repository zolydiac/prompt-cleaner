// Fixed clean-prompt.js API route with proper error handling
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, isProUser } = req.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt provided' });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log('🚀 Starting OpenAI request...');
    console.log('📝 Prompt length:', prompt.length);
    console.log('👑 Pro user:', isProUser);

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: isProUser ? "gpt-4" : "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: isProUser
              ? "You are an expert AI prompt optimizer. Clean, restructure, and enhance the given prompt to make it more effective, clear, and professional. Focus on clarity, specificity, and proper formatting. Remove redundancy and improve structure while maintaining the original intent."
              : "You are an assistant that simplifies and cleans prompts. Make the prompt clearer, more concise, and better structured while keeping the main intent.",
          },
          {
            role: "user",
            content: `Please clean and optimize this prompt:\n\n${prompt}`,
          },
        ],
        max_tokens: isProUser ? 1000 : 500,
        temperature: 0.3,
      }),
    });

    const raw = await openaiRes.text();
    console.log("🔥 Raw OpenAI response status:", openaiRes.status);
    console.log("🔥 Raw OpenAI response (first 200 chars):", raw.substring(0, 200));

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("❌ JSON parse failed:", err.message);
      console.error("❌ Raw response:", raw);
      return res.status(500).json({ 
        error: 'OpenAI returned invalid response format',
        debug: process.env.NODE_ENV === 'development' ? raw.substring(0, 500) : undefined
      });
    }

    if (!openaiRes.ok) {
      console.error("🚨 OpenAI API error:", data);
      return res.status(500).json({ 
        error: data.error?.message || "OpenAI API error",
        code: data.error?.code || 'unknown'
      });
    }

    // Validate OpenAI response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("❌ Invalid OpenAI response structure:", data);
      return res.status(500).json({ error: 'Invalid response from OpenAI' });
    }

    const cleanedPrompt = data.choices[0].message.content;
    
    if (!cleanedPrompt) {
      console.error("❌ Empty response from OpenAI");
      return res.status(500).json({ error: 'Empty response from OpenAI' });
    }

    console.log("✅ Successfully cleaned prompt");
    console.log("📊 Output length:", cleanedPrompt.length);

    return res.status(200).json({
      output: cleanedPrompt,
      model: isProUser ? "gpt-4" : "gpt-3.5-turbo",
      tokens_used: data.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    
    // Handle specific error types
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(500).json({ error: 'Network error connecting to OpenAI' });
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return res.status(500).json({ error: 'Failed to connect to OpenAI API' });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}