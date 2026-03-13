import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthAPI } from '../utils/api';
import { Brand, Card, Input, PrimaryButton, Alert } from '../components/UI';

function PasswordStep({ onSuccess }) {
  const [email, setEmail]   = useState('');
  const [pass, setPass]     = useState('');
  const [alert, setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!email || !pass) return setAlert({ type: 'error', msg: 'Email and password required.' });
    setAlert(null);
    setLoading(true);
    try {
      const res = await adminAuthAPI.login({ email, password: pass });
      onSuccess(res.data.adminId, email);
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Invalid credentials.' });
    }
    setLoading(false);
  };

  return (
    <>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: 'var(--bright)', marginBottom: 6 }}>Admin Sign In</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 28, lineHeight: 1.7 }}>
        Restricted access — administrators only
      </div>
      {alert && <Alert type={alert.type}>{alert.msg}</Alert>}
      <Input id="adm-email" label="Admin Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@estatevault.com" autoFocus />
      <Input id="adm-pass" label="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Admin password" />
      <PrimaryButton onClick={handle} loading={loading} loadingText="Sending code...">Continue</PrimaryButton>
    </>
  );
}

function OtpStep({ adminId, email, onSuccess }) {
  const [otp, setOtp]       = useState('');
  const [alert, setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);

  const vals = otp.padEnd(6, ' ').split('').slice(0, 6);
  const handleDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const arr = [...vals]; arr[i] = v || ' ';
    setOtp(arr.join('').trimEnd());
    if (v && i < 5) document.getElementById(`adm-otp-${i+1}`)?.focus();
  };
  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && vals[i] === ' ' && i > 0) document.getElementById(`adm-otp-${i-1}`)?.focus();
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    setOtp(p);
    document.getElementById(`adm-otp-${Math.min(p.length,5)}`)?.focus();
  };

  const handleVerify = async () => {
    if (otp.trim().length !== 6) return setAlert({ type: 'error', msg: 'Enter all 6 digits.' });
    setAlert(null);
    setLoading(true);
    try {
      const res = await adminAuthAPI.verifyOtp(adminId, otp.trim());
      onSuccess(res.data.token, res.data.admin);
    } catch (err) {
      setOtp('');
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Invalid code.' });
    }
    setLoading(false);
  };

  return (
    <>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: 'var(--bright)', marginBottom: 6 }}>Admin Verification</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, lineHeight: 1.7 }}>Login code sent to</div>
      <div style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 28 }}>{email}</div>
      {alert && <Alert type={alert.type}>{alert.msg}</Alert>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '0 0 28px 0' }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const filled = vals[i] && vals[i] !== ' ';
          return (
            <input key={i} id={`adm-otp-${i}`} type="text" inputMode="numeric" maxLength={1}
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
        Verify &amp; Enter Admin Panel
      </PrimaryButton>
    </>
  );
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(1);
  const [adminId, setAdminId] = useState(null);
  const [email, setEmail]   = useState('');

  const handleOk = (token, admin) => {
    localStorage.setItem('ev_admin_token', token);
    localStorage.setItem('ev_admin', JSON.stringify(admin));
    navigate('/admin/panel');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Brand subtitle="Administration Portal" />

        {/* Restricted badge */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ padding: '4px 14px', background: 'rgba(196,85,85,0.1)', border: '1px solid rgba(196,85,85,0.3)', borderRadius: 2, fontSize: 9, color: '#c45555', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            Restricted Access
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {[1,2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${s <= step ? 'var(--gold)' : 'var(--border)'}`, background: s < step ? 'var(--gold)' : 'transparent', color: s < step ? '#0a0a0b' : s === step ? 'var(--gold)' : 'var(--muted)', fontSize: 11, fontWeight: 700 }}>
                {s < step ? '✓' : s}
              </div>
              {s < 2 && <div style={{ width: 40, height: 1, background: s < step ? 'var(--gold)' : 'var(--border)' }} />}
            </div>
          ))}
        </div>

        <Card>
          <div style={{ padding: 32 }}>
            {step === 1 && <PasswordStep onSuccess={(id, em) => { setAdminId(id); setEmail(em); setStep(2); }} />}
            {step === 2 && <OtpStep adminId={adminId} email={email} onSuccess={handleOk} />}
          </div>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/login" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>← Back to user login</a>
        </div>
      </div>
    </div>
  );
}
