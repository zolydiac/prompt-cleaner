import { randomUUID } from 'crypto';
import { insertLicenseKey } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { purchase } = req.body;
  const { email, id: saleId } = purchase;

  const licenseKey = randomUUID();

  try {
    await insertLicenseKey({ key: licenseKey, email, saleId });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving to DB:', error);
    res.status(500).json({ success: false, error: 'Failed to save key' });
  }
}