import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Card, Brand, PrimaryButton, Alert, OtpInput } from '../components/UI';

export default function Verify2FA() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();

  const [otp, setOtp]         = useState('');
  const [alert, setAlert]     = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) return setAlert({ type: 'error', msg: 'Enter all 6 digits.' });
    setAlert(null);
    setLoading(true);
    try {
      const res = await authAPI.authenticate2FA(otp);
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
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Brand />
        <Card>
          <div style={{ padding: 32 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: 'var(--bright)', marginBottom: 6 }}>Two-factor auth</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 28, lineHeight: 1.7 }}>
              Open your authenticator app and enter the 6-digit code
            </div>

            {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

            <OtpInput id="verify-otp" value={otp} onChange={setOtp} />

            <PrimaryButton onClick={handleVerify} loading={loading} loadingText="Verifying..." disabled={otp.length !== 6}>
              Verify Code
            </PrimaryButton>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link to="/login" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em' }}>← Back to login</Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
