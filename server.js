// server.js - ES Module version for production
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.OPENAI_API_KEY
  });
});

// Clean prompt endpoint
app.post('/api/clean-prompt', async (req, res) => {
  try {
    const { prompt, isProUser } = req.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt provided' });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({ error: 'Prompt too long. Maximum 10,000 characters.' });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Log basic request info (for monitoring)
    console.log(`📝 Request: ${prompt.length} chars, Pro: ${isProUser}, ${new Date().toISOString()}`);

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
              ? "You are an expert AI prompt optimizer. Clean, restructure, and enhance the given prompt to make it more effective, clear, and professional. Focus on clarity, specificity, and proper formatting. Remove redundancy and improve structure while maintaining the original intent. Return only the optimized prompt without explanations."
              : "You are an assistant that simplifies and cleans prompts. Make the prompt clearer, more concise, and better structured while keeping the main intent. Return only the cleaned prompt without explanations.",
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

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("❌ JSON parse failed for OpenAI response");
      return res.status(500).json({ 
        error: 'Unable to process AI response. Please try again.'
      });
    }

    if (!openaiRes.ok) {
      console.error("🚨 OpenAI API error:", data.error?.code || 'unknown');
      
      // Handle specific OpenAI errors
      if (data.error?.code === 'rate_limit_exceeded') {
        return res.status(429).json({ error: 'Service temporarily busy. Please try again in a moment.' });
      }
      if (data.error?.code === 'insufficient_quota') {
        return res.status(503).json({ error: 'Service temporarily unavailable. Please try again later.' });
      }
      
      return res.status(500).json({ 
        error: 'AI service error. Please try again.'
      });
    }

    // Validate OpenAI response structure
    const cleanedPrompt = data.choices?.[0]?.message?.content;
    
    if (!cleanedPrompt) {
      console.error("❌ Empty response from OpenAI");
      return res.status(500).json({ error: 'Unable to generate cleaned prompt. Please try again.' });
    }

    // Log success (for monitoring)
    console.log(`✅ Success: ${cleanedPrompt.length} chars output`);

    return res.status(200).json({
      output: cleanedPrompt.trim(),
      model: isProUser ? "gpt-4" : "gpt-3.5-turbo",
      tokens_used: data.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error("❌ Server error:", error.message);
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Service temporarily unavailable. Please try again.' });
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return res.status(503).json({ error: 'Unable to connect to AI service. Please try again.' });
    }

    return res.status(500).json({ 
      error: 'Internal server error. Please try again.'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Prompt Cleaner Server running on http://localhost:${PORT}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured ✅' : 'Missing ❌'}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});