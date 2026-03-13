import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Card, Brand, PrimaryButton, Alert, OtpInput } from '../components/UI';

export default function Setup2FA() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();

  const [qrCode, setQrCode]     = useState(null);
  const [manualKey, setManualKey] = useState('');
  const [otp, setOtp]           = useState('');
  const [alert, setAlert]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authAPI.setup2FA();
        setQrCode(res.data.qrCode);
        setManualKey(res.data.manualKey);
      } catch (err) {
        setAlert({ type: 'error', msg: err.response?.data?.error || 'Failed to load 2FA setup.' });
      }
      setFetching(false);
    };
    load();
  }, []);

  const handleConfirm = async () => {
    if (otp.length !== 6) return setAlert({ type: 'error', msg: 'Enter all 6 digits.' });
    setAlert(null);
    setLoading(true);
    try {
      const res = await authAPI.verify2FA(otp);
      if (res.data.success) {
        saveSession(res.data.token, res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setOtp('');
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Invalid code. Try again.' });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <Brand />
        <Card>
          <div style={{ padding: 32 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: 'var(--bright)', marginBottom: 6 }}>Secure your vault</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 28, lineHeight: 1.7 }}>
              2FA is required to access vault features. Scan with Google Authenticator or Authy.
            </div>

            {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

            {/* QR Code */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 28 }}>
              {fetching ? (
                <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: 4 }}>
                  <span style={{ display: 'inline-block', width: 24, height: 24, border: '2px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : qrCode ? (
                <img src={qrCode} alt="2FA QR Code" style={{ width: 180, height: 180, borderRadius: 4, background: 'white', padding: 8, border: '1px solid var(--border2)' }} />
              ) : null}

              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Manual entry key</label>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '10px 14px', fontSize: 12, color: 'var(--gold)', letterSpacing: '0.1em', textAlign: 'center', wordBreak: 'break-all' }}>
                  {manualKey || '—'}
                </div>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 0 }}>
              Enter 6-digit code from app
            </label>
            <OtpInput id="setup-otp" value={otp} onChange={setOtp} />

            <PrimaryButton onClick={handleConfirm} loading={loading} loadingText="Confirming..." disabled={otp.length !== 6}>
              Confirm & Enable 2FA
            </PrimaryButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
