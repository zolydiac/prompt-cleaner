import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service key for full access
);

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const { data, error } = await supabase
    .from('license_keys')
    .select('license_key')
    .eq('email', email)
    .maybeSingle();

  if (error || !data) {
    return res.status(404).json({ error: 'License not found. Double-check your email.' });
  }

  return res.status(200).json({ licenseKey: data.license_key });
}