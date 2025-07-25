// Updated PromptCleaner.jsx
import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Crown, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PromptCleaner = () => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [outputPrompt, setOutputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [isProUser, setIsProUser] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const DAILY_LIMIT = 3;

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      supabase
        .from('users')
        .select('is_pro')
        .eq('email', email)
        .single()
        .then(({ data }) => {
          setIsProUser(data?.is_pro === true);
        });
    } else {
      setIsProUser(false);
    }

    const today = new Date().toDateString();
    const lastUsageDate = localStorage.getItem('lastUsageDate');
    const storedCount = parseInt(localStorage.getItem('usageCount') || '0');
    if (lastUsageDate === today) {
      setUsageCount(storedCount);
    } else {
      setUsageCount(0);
      localStorage.setItem('usageCount', '0');
      localStorage.setItem('lastUsageDate', today);
    }
  }, []);

  const cleanPrompt = async () => {
    if (!inputPrompt.trim()) {
      setError('Please enter a prompt to clean');
      return;
    }
    if (!isProUser && usageCount >= DAILY_LIMIT) {
      setError('Daily limit reached. Upgrade to Pro for unlimited usage!');
      return;
    }
    setIsLoading(true);
    setError('');
    setOutputPrompt('');
    try {
      const response = await fetch('/api/clean-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: inputPrompt, isProUser }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to clean prompt.');

      setOutputPrompt(data.output);
      setShowSuccess(true);
      if (!isProUser) {
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('usageCount', newCount.toString());
      }
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(outputPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text');
    }
  };

  return (
    <div className="container">
      <header className="section flex-between">
        <div className="flex-between">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Sparkles className="text-white" />
          </div>
          <div style={{ marginLeft: '1rem' }}>
            <h1 className="section-title">AI Prompt Cleaner</h1>
            <p className="text-sm text-gray-600">Clean, optimize, and enhance your AI prompts</p>
          </div>
        </div>
        <div>
          {isProUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="pro-badge">
                <Crown className="w-4 h-4" /> Pro User
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="text-sm">
                Uses today: {usageCount}/{DAILY_LIMIT}<br />
                <span className="text-xs text-gray-500">Free tier</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {showSuccess && (
        <div className="status success">
          <CheckCircle className="inline mr-2" />
          {isProUser ? '🎉 Pro features unlocked!' : 'Prompt cleaned successfully!'}
        </div>
      )}

      {error && (
        <div className="status error">
          <AlertCircle className="inline mr-2" /> {error}
        </div>
      )}

      <div className="section">
        <label className="label">
          Original Prompt
          {isProUser && <span style={{ color: '#667eea', fontSize: '0.75rem', marginLeft: '0.5rem' }}>✨ Pro Mode</span>}
        </label>
        <textarea
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder={isProUser ?
            'Paste your prompt here for advanced optimization with GPT-4...' :
            'Paste your messy or verbose prompt here...'}
          style={{ height: isProUser ? '250px' : '200px' }}
        />
        <div className="flex-between" style={{ marginTop: '1rem' }}>
          <span className="text-xs text-gray-500">
            {inputPrompt.length} characters
            {isProUser && ' • GPT-4 • Advanced optimization'}
          </span>
          <button onClick={cleanPrompt} disabled={isLoading || (!isProUser && usageCount >= DAILY_LIMIT)}>
            {isLoading ? 'Cleaning...' : (<><Wand2 className="w-4 h-4" /> Clean Prompt</>)}
          </button>
        </div>
      </div>

      <div className="section">
        <label className="label">
          Cleaned Prompt
          {isProUser && <span style={{ color: '#667eea', fontSize: '0.75rem', marginLeft: '0.5rem' }}>✨ Pro Quality</span>}
        </label>
        {outputPrompt && (
          <button onClick={copyToClipboard} className="text-sm" style={{ float: 'right', marginTop: '-1.5rem' }}>
            <Copy className="inline w-4 h-4 mr-1" /> {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
        <textarea
          value={outputPrompt}
          readOnly
          placeholder={isProUser ?
            'Your professionally optimized prompt will appear here...' :
            'Your cleaned and optimized prompt will appear here...'}
          style={{ height: isProUser ? '250px' : '200px' }}
        />
        <div className="text-xs text-gray-500" style={{ marginTop: '0.5rem' }}>
          {outputPrompt.length} characters
        </div>
      </div>

      {!isProUser && (
        <div className="upgrade-box">
          <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
          <h2>Upgrade to Pro</h2>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Pro Features:</h3>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              <li>✨ Unlimited prompt cleaning</li>
              <li>🧠 GPT-4 powered optimization (vs GPT-3.5)</li>
              <li>📝 Advanced prompt structure & formatting</li>
              <li>⚡ Priority processing</li>
              <li>💾 Longer output length (1000 vs 500 tokens)</li>
              <li>🎯 Professional-grade optimization</li>
            </ul>
          </div>
          <div className="flex-between" style={{ justifyContent: 'center', gap: '1rem' }}>
            <a
              href="https://gumroad.com/l/ai-prompt-cleaner-pro"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <button style={{ background: 'white', color: '#667eea' }}>
                Buy Pro - $5
              </button>
            </a>
          </div>
          <p className="text-sm mt-4" style={{ opacity: 0.8 }}>
            One-time payment • Instant upgrade • No subscription
          </p>
        </div>
      )}
    </div>
  );
};

export default PromptCleaner;
