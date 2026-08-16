import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../api/config';

export default function Register() {
  const [full_name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, password })
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : { message: await res.text() };

      if (!res.ok) throw new Error(data.message || 'Registration failed');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page-shell">
      <div className="floating-orb orb-one" />
      <div className="floating-orb orb-two" />
      <div className="floating-orb orb-three" />

      <div className="row justify-content-center auth-panel-row">
        <div className="col-lg-5 col-md-7">
          <div className="auth-card glass-card">
            <div className="text-center mb-4">
              <span className="eyebrow">Create account</span>
              <h3>Register</h3>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && (
              <div className="alert alert-warning loading-banner" role="status">
                Creating your account... please wait.
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Full name</label>
                <input className="form-control" value={full_name} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button className="btn btn-primary w-100" type="submit" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
