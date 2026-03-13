import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Brand, Card, Input, PrimaryButton, Alert } from '../components/UI';

// ── Step 1: Password entry
function PasswordStep({ onSuccess }) {
  const [email, setEmail]   = useState('');
  const [pass, setPass]     = useState('');
  const [alert, setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !pass) return setAlert({ type: 'error', msg: 'Email and password are required.' });
    setAlert(null);
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password: pass });
      onSuccess(res.data.userId, email);
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Login failed.' });
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: 'var(--bright)', marginBottom: 6 }}>Sign In</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 28, lineHeight: 1.7 }}>
        Enter your credentials — a verification code will be sent to your email
      </div>

      {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

      <Input id="login-email" label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" autoFocus />
      <Input id="login-pass" label="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Your password" />

      <div onKeyDown={handleKeyDown}>
        <PrimaryButton onClick={handleLogin} loading={loading} loadingText="Sending code...">
          Continue
        </PrimaryButton>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--muted)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Create one</Link>
      </div>
    </>
  );
}

// ── Step 2: Email OTP entry
function OtpStep({ userId, email, onSuccess }) {
  const [otp, setOtp]       = useState('');
  const [alert, setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);

  const vals = otp.padEnd(6, ' ').split('').slice(0, 6);

  const handleDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const arr = [...vals]; arr[i] = v || ' ';
    setOtp(arr.join('').trimEnd());
    if (v && i < 5) document.getElementById(`login-otp-${i + 1}`)?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && vals[i] === ' ' && i > 0) document.getElementById(`login-otp-${i - 1}`)?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    setOtp(p);
    document.getElementById(`login-otp-${Math.min(p.length, 5)}`)?.focus();
  };

  const handleVerify = async () => {
    if (otp.trim().length !== 6) return setAlert({ type: 'error', msg: 'Enter all 6 digits.' });
    setAlert(null);
    setLoading(true);
    try {
      const res = await authAPI.verifyLoginOtp(userId, otp.trim());
      onSuccess(res.data.token, res.data.user);
    } catch (err) {
      setOtp('');
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Invalid code. Try again.' });
    }
    setLoading(false);
  };

  return (
    <>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: 'var(--bright)', marginBottom: 6 }}>Check Your Email</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 6, lineHeight: 1.7 }}>
        A 6-digit login code was sent to
      </div>
      <div style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 28 }}>{email}</div>

      {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '0 0 28px 0' }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const filled = vals[i] && vals[i] !== ' ';
          return (
            <input key={i} id={`login-otp-${i}`} type="text" inputMode="numeric" maxLength={1}
              value={filled ? vals[i] : ''}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              onPaste={handlePaste}
              autoFocus={i === 0}
              style={{ width: 46, height: 58, textAlign: 'center', fontSize: 22, fontWeight: 700, background: '#111118', border: `1px solid ${filled ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 4, color: 'var(--gold)', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'}
              onBlur={e => { e.target.style.borderColor = filled ? 'var(--gold)' : 'var(--border)'; }}
            />
          );
        })}
      </div>

      <PrimaryButton onClick={handleVerify} loading={loading} loadingText="Verifying..." disabled={otp.trim().length !== 6}>
        Verify &amp; Sign In
      </PrimaryButton>

      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--muted)' }}>
        Code expires in 10 minutes. <Link to="/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Start over</Link>
      </div>
    </>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const [step, setStep]   = useState(1);
  const [userId, setUserId] = useState(null);
  const [email, setEmail]  = useState('');

  const handlePasswordOk = (uid, em) => {
    setUserId(uid);
    setEmail(em);
    setStep(2);
  };

  const handleOtpOk = (token, user) => {
    saveSession(token, user);
    navigate('/vault');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Brand />

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${s <= step ? 'var(--gold)' : 'var(--border)'}`,
                background: s < step ? 'var(--gold)' : 'transparent',
                color: s < step ? '#0a0a0b' : s === step ? 'var(--gold)' : 'var(--muted)',
                fontSize: 11, fontWeight: 700,
              }}>{s < step ? '✓' : s}</div>
              {s < 2 && <div style={{ width: 40, height: 1, background: s < step ? 'var(--gold)' : 'var(--border)' }} />}
            </div>
          ))}
        </div>

        <Card>
          <div style={{ padding: 32 }}>
            {step === 1 && <PasswordStep onSuccess={handlePasswordOk} />}
            {step === 2 && <OtpStep userId={userId} email={email} onSuccess={handleOtpOk} />}
          </div>
        </Card>
      </div>
    </div>
  );
}
