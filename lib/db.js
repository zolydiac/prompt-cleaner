import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

export async function insertLicenseKey({ key, email, saleId }) {
  await pool.query(
    `INSERT INTO license_keys (license_key, email, gumroad_sale_id)
     VALUES ($1, $2, $3)`,
    [key, email, saleId]
  );
}

export async function getLicenseFromDB(key) {
  const res = await pool.query(`SELECT * FROM license_keys WHERE license_key = $1`, [key]);
  return res.rows[0];
}

export async function markLicenseAsUsed(key) {
  await pool.query(
    `UPDATE license_keys SET is_used = true, activated_date = NOW()
     WHERE license_key = $1`,
    [key]
  );
}