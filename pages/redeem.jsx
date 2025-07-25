import { useState } from 'react';

export default function Redeem() {
  const [email, setEmail] = useState('');
  const [license, setLicense] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLicense(null);
    setError(null);

    const res = await fetch(`/api/lookup?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (res.ok) {
      setLicense(data.licenseKey);
    } else {
      setError(data.error);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Retrieve Your License Key</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your purchase email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Get License</button>
      </form>

      {license && <p>Your license key is: <strong>{license}</strong></p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}