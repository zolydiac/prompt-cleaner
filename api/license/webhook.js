// File: /api/license/webhook.js

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const purchase = req.body?.purchase;

  // ✅ OPTIONAL: Check the product ID
  const knownProductId = 'YOUR_PRODUCT_ID_HERE'; // Replace with your actual Gumroad product ID
  if (purchase?.product_id !== knownProductId) {
    return res.status(403).end('Invalid product');
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    'https://iemzhaorklxvzmaenmvr.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY // Must be set in Vercel/Env
  );

  // ✅ Upsert user with Pro status
  const { error } = await supabase
    .from('users')
    .upsert(
      { email: purchase?.email, is_pro: true },
      { onConflict: ['email'] } // Ensures existing users are updated
    );

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(200).json({ success: true });
}