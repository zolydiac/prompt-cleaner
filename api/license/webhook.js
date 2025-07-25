// api/license.js - Vercel serverless function
import crypto from 'crypto';

// In production, use a proper database. For now, we'll use a simple JSON storage
// You could use Vercel KV, Supabase, or any database
let usedLicenseKeys = new Set(); // This should be in a database

// Generate a unique license key
function generateLicenseKey() {
  const prefix = 'PC-PRO-2024-';
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${randomPart}`;
}

// Verify webhook signature from Gumroad
function verifyGumroadSignature(body, signature, secret) {
  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return hash === signature;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle Gumroad webhook (when someone purchases)
  if (req.method === 'POST' && req.url === '/api/license/webhook') {
    try {
      const gumroadSecret = process.env.GUMROAD_WEBHOOK_SECRET; // Set this in Vercel
      const signature = req.headers['x-gumroad-signature'];
      
      // Verify webhook is from Gumroad
      if (!verifyGumroadSignature(JSON.stringify(req.body), signature, gumroadSecret)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const { sale_id, purchaser_email, product_name } = req.body;
      
      // Generate unique license key
      let licenseKey;
      do {
        licenseKey = generateLicenseKey();
      } while (usedLicenseKeys.has(licenseKey));

      // Store the license key (in production, save to database)
      usedLicenseKeys.add(licenseKey);

      // Send email with license key (you can use SendGrid, Mailgun, etc.)
      await sendLicenseKeyEmail(purchaser_email, licenseKey, sale_id);

      return res.status(200).json({ 
        success: true, 
        licenseKey,
        message: 'License key generated and sent' 
      });

    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle license key validation
  if (req.method === 'POST' && req.url === '/api/license/validate') {
    try {
      const { licenseKey } = req.body;

      if (!licenseKey) {
        return res.status(400).json({ error: 'License key required' });
      }

      // Check if key is valid format
      if (!licenseKey.startsWith('PC-PRO-2024-')) {
        return res.status(400).json({ error: 'Invalid license key format' });
      }

      // Check if key has been used (in production, check database)
      if (usedLicenseKeys.has(licenseKey)) {
        return res.status(400).json({ error: 'License key already used' });
      }

      // Mark key as used
      usedLicenseKeys.add(licenseKey);

      return res.status(200).json({ 
        valid: true, 
        message: 'License key activated successfully' 
      });

    } catch (error) {
      console.error('Validation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle generating test keys (remove in production)
  if (req.method === 'GET' && req.url === '/api/license/generate-test') {
    const testKey = generateLicenseKey();
    return res.status(200).json({ testKey });
  }

  return res.status(404).json({ error: 'Not found' });
}

// Email function (implement with your preferred email service)
async function sendLicenseKeyEmail(email, licenseKey, saleId) {
  // Example using a simple email service
  // In production, use SendGrid, Mailgun, or similar
  
  const emailData = {
    to: email,
    subject: '🎉 Your AI Prompt Cleaner Pro License Key',
    html: `
      <h2>Thanks for purchasing AI Prompt Cleaner Pro!</h2>
      <p>Your license key is: <strong>${licenseKey}</strong></p>
      <p>To activate:</p>
      <ol>
        <li>Go to your AI Prompt Cleaner app</li>
        <li>Click "Enter License"</li>
        <li>Enter your key: ${licenseKey}</li>
        <li>Enjoy unlimited Pro features!</li>
      </ol>
      <p>Order ID: ${saleId}</p>
      <p>Need help? Reply to this email!</p>
    `
  };

  // Implement your email sending logic here
  console.log('Would send email:', emailData);
  
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send(emailData);
}