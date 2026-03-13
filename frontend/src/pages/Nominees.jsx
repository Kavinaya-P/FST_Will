import { useState, useEffect } from 'react';
import { nomineesAPI } from '../utils/api';
import { Alert, PrimaryButton, PageLoader, Input } from '../components/UI';

const STATUS_STYLE = {
  pending:  { color: '#e8c96a', label: 'Invite Sent — Awaiting Response' },
  accepted: { color: '#4caf7d', label: 'Active Nominee' },
  declined: { color: '#c45555', label: 'Declined' },
  inactive: { color: 'var(--muted)', label: 'Inactive' },
};

export default function Nominees() {
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [alert, setAlert]       = useState(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ fullName: '', email: '', relationship: '', priorityLevel: 1, phone: '' });
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    try {
      const res = await nomineesAPI.getNominees();
      setNominees(res.data.nominees);
    } catch { setAlert({ type: 'error', msg: 'Failed to load nominees.' }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAdd = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      return setAlert({ type: 'error', msg: 'Full name and email are required.' });
    }
    setSaving(true);
    setAlert(null);
    try {
      const res = await nomineesAPI.addNominee(form);
      setAlert({ type: 'success', msg: res.data.message });
      setShowAdd(false);
      setForm({ fullName: '', email: '', relationship: '', priorityLevel: 1, phone: '' });
      await load();
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Failed to add nominee.' });
    }
    setSaving(false);
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove ${name} as a nominee?`)) return;
    try {
      await nomineesAPI.removeNominee(id);
      await load();
      setAlert({ type: 'info', msg: `${name} has been removed.` });
    } catch { setAlert({ type: 'error', msg: 'Failed to remove nominee.' }); }
  };

  const primary   = nominees.find(n => n.priorityLevel === 1);
  const secondary = nominees.find(n => n.priorityLevel === 2);

  if (loading) return <PageLoader />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: 'var(--bright)' }}>Nominees</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, letterSpacing: '0.08em', lineHeight: 1.6 }}>
            Nominees receive an email invitation they must accept. Once confirmed, they can submit a death certificate via the secure portal.
          </div>
        </div>
        {nominees.length < 2 && (
          <button onClick={() => setShowAdd(s => !s)}
            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--gold)', borderRadius: 2, color: 'var(--gold)', fontSize: 11, cursor: 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {showAdd ? 'Cancel' : '+ Add Nominee'}
          </button>
        )}
      </div>

      {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

      {/* Add form */}
      {showAdd && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 2, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
            Add Nominee
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input id="n-name" label="Full Name" value={form.fullName} onChange={set('fullName')} placeholder="Their full name" autoFocus />
            <Input id="n-email" label="Email Address" type="email" value={form.email} onChange={set('email')} placeholder="their@email.com" />
            <Input id="n-rel" label="Relationship" value={form.relationship} onChange={set('relationship')} placeholder="Spouse, Child, Friend..." />
            <Input id="n-phone" label="Phone (optional)" value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.2em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Priority Level</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: 1, label: 'Primary', desc: 'Notified first' },
                { val: 2, label: 'Secondary', desc: 'Fallback if primary unavailable' },
              ].map(({ val, label, desc }) => (
                <button key={val} onClick={() => setForm(f => ({ ...f, priorityLevel: val }))} disabled={val === 1 ? !!primary : !!secondary}
                  style={{
                    flex: 1, padding: 14, background: form.priorityLevel === val ? 'rgba(201,168,76,0.1)' : 'var(--surface)',
                    border: `1px solid ${form.priorityLevel === val ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: 2, cursor: (val === 1 ? !!primary : !!secondary) ? 'not-allowed' : 'pointer',
                    opacity: (val === 1 ? !!primary : !!secondary) ? 0.4 : 1, textAlign: 'left',
                  }}>
                  <div style={{ fontSize: 12, color: form.priorityLevel === val ? 'var(--gold)' : 'var(--text)' }}>{label}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{desc}</div>
                  {(val === 1 ? !!primary : !!secondary) && <div style={{ fontSize: 9, color: '#c45555', marginTop: 4 }}>Slot taken</div>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: 12, background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 2, fontSize: 11, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
            📧 An invitation email will be sent to this person. <strong style={{ color: 'var(--text)' }}>They must accept the invitation</strong> before they can act as a nominee. You will be notified when they respond.
          </div>

          <PrimaryButton onClick={handleAdd} loading={saving} loadingText="Sending invitation...">
            Add &amp; Send Invitation Email
          </PrimaryButton>
        </div>
      )}

      {/* Nominee cards */}
      {nominees.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border)', borderRadius: 2 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: 'var(--bright)', marginBottom: 8 }}>No nominees yet</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>
            Add up to 2 nominees who will be contacted if you stop checking in<br />and can request vault access after your passing
          </div>
        </div>
      )}

      {nominees.map(n => {
        const s = STATUS_STYLE[n.status] || STATUS_STYLE.inactive;
        return (
          <div key={n._id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 2, padding: '20px 24px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ fontSize: 15, color: 'var(--bright)', fontWeight: 500 }}>{n.fullName}</div>
                  <div style={{ padding: '2px 8px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 2, fontSize: 9, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {n.priorityLevel === 1 ? 'Primary' : 'Secondary'}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                  {n.email}{n.relationship ? ` · ${n.relationship}` : ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 11, color: s.color }}>{s.label}</span>
                </div>

                {n.status === 'pending' && (
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--muted)', padding: '8px 12px', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2, lineHeight: 1.5 }}>
                    ⏳ Invitation sent · Expires {new Date(n.invitationExpiry).toLocaleDateString()}
                  </div>
                )}
                {n.status === 'declined' && (
                  <div style={{ marginTop: 10, fontSize: 11, color: '#c45555', padding: '8px 12px', background: 'rgba(196,85,85,0.05)', border: '1px solid rgba(196,85,85,0.15)', borderRadius: 2 }}>
                    ✗ This person declined the nomination. Consider removing and adding someone else.
                  </div>
                )}
              </div>
              <button onClick={() => handleRemove(n._id, n.fullName)}
                style={{ padding: '6px 14px', background: 'rgba(196,85,85,0.08)', border: '1px solid rgba(196,85,85,0.25)', borderRadius: 2, color: '#c45555', fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: 16 }}>
                Remove
              </button>
            </div>
          </div>
        );
      })}

      {/* Info block */}
      <div style={{ marginTop: 24, padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, fontSize: 11, color: 'var(--muted)', lineHeight: 1.8 }}>
        <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 6 }}>How Nominees Work</strong>
        1. You add a nominee — they receive an invitation email<br />
        2. They accept or decline (you're notified either way)<br />
        3. If your Dead Man's Switch triggers, accepted nominees are emailed a link to the <strong style={{ color: 'var(--text)' }}>Nominee Portal</strong><br />
        4. The nominee uploads a death certificate — admin reviews and approves<br />
        5. Once approved, the nominee is emailed vault access confirmation
      </div>
    </div>
  );
}
