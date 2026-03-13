import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { nomineesAPI } from '../utils/api';
import { Brand, Card, Alert, PrimaryButton } from '../components/UI';

export default function AcceptNomination() {
  const [params] = useSearchParams();
  const token   = params.get('token');
  const action  = params.get('action') || 'accept'; // 'accept' | 'decline'

  const [step, setStep]     = useState('loading'); // loading | confirm | done | error
  const [alert, setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [nomineeInfo, setNomineeInfo] = useState(null);

  useEffect(() => {
    if (!token) { setStep('error'); setAlert({ type: 'error', msg: 'Invalid or missing invitation token.' }); return; }
    setStep('confirm');
  }, [token, action]);

  const handleAccept = async () => {
    setLoading(true);
    setAlert(null);
    try {
      await nomineesAPI.acceptInvitation(token);
      setStep('done');
      setNomineeInfo({ action: 'accepted' });
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Failed to accept invitation. It may have expired.' });
    }
    setLoading(false);
  };

  const handleDecline = async () => {
    setLoading(true);
    setAlert(null);
    try {
      await nomineesAPI.declineInvitation(token);
      setStep('done');
      setNomineeInfo({ action: 'declined' });
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Failed to process. The invitation may have expired.' });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <Brand />
        <Card>
          <div style={{ padding: 40 }}>

            {step === 'loading' && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ width: 32, height: 32, border: '2px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Loading invitation...</div>
              </div>
            )}

            {step === 'confirm' && (
              <>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: 'var(--bright)', marginBottom: 8 }}>
                  Nominee Invitation
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.8 }}>
                  You have been invited to be a nominee on someone's Digital Estate Vault. As a nominee, you will:<br /><br />
                  • Be notified if the vault owner stops checking in<br />
                  • Be able to submit a death certificate for verification<br />
                  • Receive vault access after confirmed death approval
                </div>

                {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

                <PrimaryButton onClick={handleAccept} loading={loading} loadingText="Accepting...">
                  ✓ Accept Nomination
                </PrimaryButton>

                <button onClick={handleDecline} disabled={loading}
                  style={{ width: '100%', marginTop: 12, padding: '12px 0', background: 'transparent', border: '1px solid var(--border)', borderRadius: 2, color: 'var(--muted)', fontSize: 11, cursor: loading ? 'default' : 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit' }}>
                  Decline
                </button>

                <div style={{ marginTop: 16, fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
                  This invitation expires in 7 days. Your vault owner will be notified of your decision.
                </div>
              </>
            )}

            {step === 'done' && nomineeInfo && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 52, marginBottom: 20 }}>
                  {nomineeInfo.action === 'accepted' ? '✅' : '👋'}
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: nomineeInfo.action === 'accepted' ? '#4caf7d' : 'var(--muted)', marginBottom: 12 }}>
                  {nomineeInfo.action === 'accepted' ? 'Nomination Accepted' : 'Nomination Declined'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.8 }}>
                  {nomineeInfo.action === 'accepted'
                    ? 'You are now registered as a nominee. The vault owner has been notified. You will receive an email if any action is required.'
                    : 'You have declined this nomination. The vault owner has been notified.'}
                </div>
                <div style={{ marginTop: 24, fontSize: 11, color: 'var(--muted)' }}>
                  You may close this window.
                </div>
              </div>
            )}

            {step === 'error' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 42, marginBottom: 16 }}>⚠️</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: '#c45555', marginBottom: 12 }}>Invalid Invitation</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  This invitation link is invalid or has expired. Please contact the vault owner to resend the invitation.
                </div>
              </div>
            )}

          </div>
        </Card>
      </div>
    </div>
  );
}
