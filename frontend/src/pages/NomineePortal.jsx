import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Brand, Card, Alert, PrimaryButton } from '../components/UI';

// ── Public Nominee Portal ───────────────────────────
// Accessible via /nominee-portal?token=xxx&owner=email@example.com
// No login required — uses nomineeAccessToken from the email link

export default function NomineePortal() {
  const [params] = useSearchParams();
  const tokenFromUrl = params.get('token') || '';
  const ownerFromUrl = params.get('owner') || '';

  const [step, setStep]             = useState('form'); // form | uploading | submitted | status
  const [nomineeToken, setToken]    = useState(tokenFromUrl);
  const [ownerEmail, setOwnerEmail] = useState(ownerFromUrl);
  const [file, setFile]             = useState(null);
  const [alert, setAlert]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [requestStatus, setStatus]  = useState(null);
  const [dragOver, setDragOver]     = useState(false);

  // If token+owner in URL, check status automatically
  useEffect(() => {
    if (tokenFromUrl && ownerFromUrl) checkStatus(tokenFromUrl, ownerFromUrl);
  }, []);

  const checkStatus = async (tok, owner) => {
    try {
      const res = await axios.get('/api/death/nominee-status', { params: { nomineeToken: tok, vaultOwnerEmail: owner } });
      if (res.data.request) {
        setStatus(res.data.request);
        setStep('status');
      }
    } catch { /* No existing request — show upload form */ }
  };

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(f.type)) return setAlert({ type: 'error', msg: 'Only PDF, JPG, or PNG files are accepted.' });
    if (f.size > 10 * 1024 * 1024) return setAlert({ type: 'error', msg: 'File must be under 10MB.' });
    setFile(f);
    setAlert(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!nomineeToken.trim()) return setAlert({ type: 'error', msg: 'Nominee token is required.' });
    if (!ownerEmail.trim())   return setAlert({ type: 'error', msg: 'Vault owner email is required.' });
    if (!file)                return setAlert({ type: 'error', msg: 'Please attach the death certificate.' });

    setAlert(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('nomineeToken', nomineeToken.trim());
    formData.append('vaultOwnerEmail', ownerEmail.trim());
    formData.append('certificate', file);

    try {
      await axios.post('/api/death/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStep('submitted');
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Submission failed. Please check your details.' });
    }
    setLoading(false);
  };

  const statusColors = {
    pending:      { color: '#e8c96a', label: 'Pending Review',  icon: '⏳' },
    under_review: { color: '#8899ee', label: 'Under Review',    icon: '🔍' },
    approved:     { color: '#4caf7d', label: 'Approved',        icon: '✅' },
    rejected:     { color: '#c45555', label: 'Rejected',        icon: '❌' },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <Brand subtitle="Nominee Death Verification Portal" />

        {/* Status indicator banner */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ padding: '4px 14px', background: 'rgba(100,140,220,0.1)', border: '1px solid rgba(100,140,220,0.3)', borderRadius: 2, fontSize: 9, color: '#7799ee', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            Public Portal — No Login Required
          </span>
        </div>

        <Card>
          <div style={{ padding: 32 }}>

            {/* ── Form Step ─────────────────────── */}
            {step === 'form' && (
              <>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: 'var(--bright)', marginBottom: 8 }}>
                  Submit Death Certificate
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.8 }}>
                  As a nominated beneficiary, you may submit a death certificate for verification. An admin will review it and you will be notified by email.
                </div>

                {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                    Your Nominee Access Token
                  </label>
                  <input value={nomineeToken} onChange={e => setToken(e.target.value)} placeholder="Paste your token from the email..."
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '12px 14px', fontSize: 12, color: 'var(--bright)', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', letterSpacing: '0.05em' }}
                    onFocus={e => e.target.style.borderColor = 'var(--border2)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>This token was included in the email you received when you were added as a nominee.</div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                    Vault Owner's Email Address
                  </label>
                  <input value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} placeholder="The email of the deceased..."
                    type="email"
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '12px 14px', fontSize: 13, color: 'var(--bright)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = 'var(--border2)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>

                {/* File upload area */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                    Death Certificate
                  </label>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('cert-file').click()}
                    style={{
                      border: `2px dashed ${dragOver ? 'var(--gold)' : file ? 'rgba(76,175,125,0.5)' : 'var(--border)'}`,
                      borderRadius: 4, padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
                      background: dragOver ? 'rgba(201,168,76,0.04)' : file ? 'rgba(76,175,125,0.04)' : 'var(--surface)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input id="cert-file" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                      onChange={e => handleFile(e.target.files[0])} />
                    {file ? (
                      <>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                        <div style={{ fontSize: 13, color: '#4caf7d', marginBottom: 4, fontWeight: 600 }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB — click to change</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                        <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>Drag &amp; drop or click to browse</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>PDF, JPG or PNG · Max 10MB</div>
                      </>
                    )}
                  </div>
                </div>

                <PrimaryButton onClick={handleSubmit} loading={loading} loadingText="Submitting..." disabled={!file || !nomineeToken || !ownerEmail}>
                  Submit for Admin Review
                </PrimaryButton>

                <div style={{ marginTop: 20, padding: 14, background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 2, fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>
                  ⚠️ Submitting a false death certificate is a serious offence. Only submit if you have a verified official document.
                </div>
              </>
            )}

            {/* ── Submitted Step ─────────────────── */}
            {step === 'submitted' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: '#4caf7d', marginBottom: 12 }}>
                  Submitted Successfully
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 24 }}>
                  Your death certificate has been securely uploaded and is now pending admin review.<br /><br />
                  <strong style={{ color: 'var(--text)' }}>You will receive an email notification</strong> once the admin has made a decision — either approving vault access or rejecting the request with a reason.
                </div>
                <div style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, fontSize: 11, color: 'var(--muted)' }}>
                  Please allow 1–3 business days for review. You may close this window.
                </div>
              </div>
            )}

            {/* ── Status Step ────────────────────── */}
            {step === 'status' && requestStatus && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 42, marginBottom: 16 }}>{statusColors[requestStatus.status]?.icon || '📋'}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: statusColors[requestStatus.status]?.color, marginBottom: 12 }}>
                  {statusColors[requestStatus.status]?.label || requestStatus.status}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
                  Submitted: {new Date(requestStatus.submittedAt).toLocaleDateString()}
                </div>
                {requestStatus.adminNotes && (
                  <div style={{ padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, fontSize: 12, color: 'var(--text)', textAlign: 'left', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Admin Notes:</strong>
                    <div style={{ marginTop: 6 }}>{requestStatus.adminNotes}</div>
                  </div>
                )}
                {requestStatus.status === 'rejected' && (
                  <button onClick={() => { setStep('form'); setStatus(null); setFile(null); }}
                    style={{ marginTop: 20, padding: '10px 24px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 2, color: 'var(--text)', fontSize: 11, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Submit New Certificate
                  </button>
                )}
              </div>
            )}

          </div>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--muted)' }}>
          Having trouble? Contact support at <span style={{ color: 'var(--gold)' }}>support@estatevault.com</span>
        </div>
      </div>
    </div>
  );
}
