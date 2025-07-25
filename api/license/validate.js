import { getLicenseFromDB, markLicenseAsUsed } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { licenseKey } = req.body;
  const license = await getLicenseFromDB(licenseKey);

  if (!license || license.is_used) {
    return res.status(400).json({ valid: false });
  }

  await markLicenseAsUsed(licenseKey);

  res.status(200).json({ valid: true });
}