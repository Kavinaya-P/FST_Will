import { useState, useEffect } from 'react';
import { vaultAPI } from '../utils/api';
import { Alert, PrimaryButton, PageLoader } from '../components/UI';

const ASSET_ICONS = { password: '🔑', document: '📄', crypto: '₿', note: '📝', other: '📦' };
const ASSET_TYPES = ['password', 'document', 'crypto', 'note', 'other'];

export default function Vault() {
  const [vault, setVault]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert]     = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ assetType: 'password', label: '', data: {} });
  const [saving, setSaving]   = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    try {
      const res = await vaultAPI.getVault();
      setVault(res.data.vault);
    } catch {
      setAlert({ type: 'error', msg: 'Failed to load vault.' });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.label.trim()) return setAlert({ type: 'error', msg: 'Label is required.' });
    setSaving(true);
    try {
      await vaultAPI.addAsset(form);
      await load();
      setShowAdd(false);
      setForm({ assetType: 'password', label: '', data: {} });
      setAlert({ type: 'success', msg: 'Asset added and encrypted.' });
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Failed to add asset.' });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset? This cannot be undone.')) return;
    try {
      await vaultAPI.deleteAsset(id);
      await load();
    } catch {
      setAlert({ type: 'error', msg: 'Delete failed.' });
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: 'var(--bright)' }}>
            {vault?.vaultName || 'My Estate Vault'}
          </div>
          <div style={{ fontSize: 11, color: vault?.isLocked ? 'var(--red)' : 'var(--green)', marginTop: 4, letterSpacing: '0.1em' }}>
            {vault?.isLocked ? '🔒 Locked' : '🔓 Active'} · {vault?.assetCount || 0} assets
          </div>
        </div>
        <button onClick={() => setShowAdd(s => !s)}
          style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--gold)', borderRadius: 2, color: 'var(--gold)', fontSize: 11, cursor: 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {showAdd ? 'Cancel' : '+ Add Asset'}
        </button>
      </div>

      {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

      {/* Add asset form */}
      {showAdd && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 2, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>New Asset</div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.2em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ASSET_TYPES.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, assetType: t }))}
                  style={{ padding: '6px 14px', background: form.assetType === t ? 'rgba(201,168,76,0.15)' : 'var(--surface)', border: `1px solid ${form.assetType === t ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 2, color: form.assetType === t ? 'var(--gold)' : 'var(--muted)', fontSize: 11, cursor: 'pointer' }}>
                  {ASSET_ICONS[t]} {t}
                </button>
              ))}
            </div>
          </div>

          {[
            { key: 'label', label: 'Label / Name', placeholder: 'e.g. Gmail account' },
            { key: 'username', label: 'Username / Email', placeholder: 'Optional' },
            { key: 'password', label: 'Password / Value', placeholder: 'The secret value', type: 'password' },
            { key: 'url', label: 'URL', placeholder: 'https://...' },
            { key: 'notes', label: 'Notes', placeholder: 'Additional info' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.15em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
              <input type={type || 'text'}
                value={key === 'label' ? form.label : (form.data[key] || '')}
                onChange={e => key === 'label'
                  ? setForm(f => ({ ...f, label: e.target.value }))
                  : setForm(f => ({ ...f, data: { ...f.data, [key]: e.target.value } }))
                }
                placeholder={placeholder}
                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '10px 12px', fontSize: 12, color: 'var(--bright)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          <PrimaryButton onClick={handleAdd} loading={saving} loadingText="Encrypting & saving...">
            🔒 Encrypt & Save
          </PrimaryButton>
        </div>
      )}

      {/* Asset list */}
      {vault?.assets?.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border)', borderRadius: 2 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: 'var(--bright)', marginBottom: 8 }}>Vault is empty</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Add passwords, documents, crypto keys, and notes — all encrypted at rest</div>
        </div>
      )}

      {vault?.assets?.map(asset => (
        <div key={asset.id}
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer' }}
            onClick={() => setExpanded(expanded === asset.id ? null : asset.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>{ASSET_ICONS[asset.assetType] || '📦'}</span>
              <div>
                <div style={{ fontSize: 13, color: 'var(--bright)' }}>{asset.label}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{asset.assetType}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{expanded === asset.id ? '▲' : '▼'}</span>
              <button onClick={e => { e.stopPropagation(); handleDelete(asset.id); }}
                style={{ padding: '4px 10px', background: 'rgba(196,85,85,0.1)', border: '1px solid rgba(196,85,85,0.3)', borderRadius: 2, color: '#c45555', fontSize: 10, cursor: 'pointer', letterSpacing: '0.08em' }}>
                Delete
              </button>
            </div>
          </div>
          {expanded === asset.id && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px', background: 'var(--surface)' }}>
              {Object.entries(asset).filter(([k]) => !['id','assetType','label','createdAt','error'].includes(k)).map(([k, v]) =>
                v ? (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.1em' }}>{k}</span>
                    <span style={{ color: 'var(--bright)', maxWidth: '65%', wordBreak: 'break-all', textAlign: 'right' }}>{v}</span>
                  </div>
                ) : null
              )}
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>
                Added {new Date(asset.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
