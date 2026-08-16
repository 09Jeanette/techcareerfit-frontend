import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BASE_URL } from '../api/config';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('request');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function requestReset(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${BASE_URL}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : { message: await res.text() };

      if (!res.ok) throw new Error(data.message || 'Unable to request password reset');

      setMessage(
        data.reset_token
          ? `Reset token generated. Copy this token for testing: ${data.reset_token}`
          : 'A reset link has been sent. Check your email and continue.'
      );

      if (data.reset_token) {
        setResetToken(data.reset_token);
      }

      setStep('confirm');
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmReset(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword })
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : { message: await res.text() };

      if (!res.ok) throw new Error(data.message || 'Password reset failed');

      setMessage(data.message || 'Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
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
              <span className="eyebrow">Password reset</span>
              <h3>{step === 'request' ? 'Reset your password' : 'Enter new password'}</h3>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            {step === 'request' ? (
              <form onSubmit={requestReset}>
                <div className="mb-3">
                  <label className="form-label">Email address</label>
                  <input
                    className="form-control"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary w-100" type="submit">Send reset code</button>
              </form>
            ) : (
              <form onSubmit={confirmReset}>
                <div className="mb-3">
                  <label className="form-label">Reset token</label>
                  <input
                    className="form-control"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste the reset token here"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">New password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm new password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary w-100" type="submit">Update password</button>
              </form>
            )}

            <div className="mt-3 text-center">
              <Link to="/login">Back to login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
