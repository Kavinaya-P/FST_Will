// ── Shared Design System ───────────────────────────

export const Brand = ({ subtitle }) => (
  <div style={{ textAlign: 'center', marginBottom: 32 }}>
    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, letterSpacing: '4px', color: 'var(--gold)', fontWeight: 300 }}>
      ESTATE VAULT
    </div>
    <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '3px', marginTop: 4, textTransform: 'uppercase' }}>
      {subtitle || 'Secure Digital Legacy Platform'}
    </div>
  </div>
);

export const Card = ({ children, style = {} }) => (
  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 2, ...style }}>
    {children}
  </div>
);

export const Alert = ({ type = 'info', children }) => {
  const colors = {
    success: { bg: 'rgba(76,175,125,0.08)', border: 'rgba(76,175,125,0.3)', color: '#4caf7d' },
    error:   { bg: 'rgba(196,85,85,0.08)',  border: 'rgba(196,85,85,0.3)',  color: '#c45555' },
    info:    { bg: 'rgba(100,140,220,0.08)', border: 'rgba(100,140,220,0.3)', color: '#7799ee' },
    warning: { bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.3)', color: '#c9a84c' },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 2, padding: '12px 16px', marginBottom: 16, fontSize: 12, color: c.color, lineHeight: 1.6 }}>
      {children}
    </div>
  );
};

export const Input = ({ label, type = 'text', value, onChange, placeholder, autoFocus, disabled, id }) => (
  <div style={{ marginBottom: 18 }}>
    {label && (
      <label htmlFor={id} style={{ display: 'block', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
        {label}
      </label>
    )}
    <input
      id={id} type={type} value={value} onChange={onChange}
      placeholder={placeholder} autoFocus={autoFocus} disabled={disabled}
      style={{
        width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2,
        padding: '12px 14px', fontSize: 13, color: 'var(--bright)', outline: 'none', fontFamily: 'inherit',
        boxSizing: 'border-box', transition: 'border-color 0.2s', opacity: disabled ? 0.5 : 1,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--border2)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    />
  </div>
);

export const PrimaryButton = ({ children, onClick, loading, loadingText, disabled, style = {} }) => (
  <button onClick={onClick} disabled={loading || disabled}
    style={{
      width: '100%', padding: '14px 0', background: 'transparent',
      border: '1px solid var(--gold)', borderRadius: 2, color: 'var(--gold)',
      fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
      cursor: (loading || disabled) ? 'default' : 'pointer',
      opacity: (loading || disabled) ? 0.5 : 1, fontFamily: 'inherit', marginTop: 8,
      transition: 'background 0.2s', ...style,
    }}
    onMouseEnter={e => { if (!loading && !disabled) e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    {loading ? (loadingText || 'Loading...') : children}
  </button>
);

export const OtpInput = ({ value, onChange, id }) => {
  const digits = 6;
  const vals = value.padEnd(digits, ' ').split('').slice(0, digits);

  const handleChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const arr = [...vals];
    arr[i] = v || ' ';
    const joined = arr.join('').trimEnd();
    onChange(joined);
    if (v && i < digits - 1) document.getElementById(`${id}-${i + 1}`)?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && vals[i] === ' ' && i > 0) {
      document.getElementById(`${id}-${i - 1}`)?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) document.getElementById(`${id}-${i - 1}`)?.focus();
    if (e.key === 'ArrowRight' && i < digits - 1) document.getElementById(`${id}-${i + 1}`)?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, digits);
    onChange(pasted);
    document.getElementById(`${id}-${Math.min(pasted.length, digits - 1)}`)?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '24px 0' }}>
      {Array.from({ length: digits }).map((_, i) => {
        const filled = vals[i] && vals[i] !== ' ';
        return (
          <input key={i} id={`${id}-${i}`} type="text" inputMode="numeric" maxLength={1}
            value={filled ? vals[i] : ''}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            style={{
              width: 46, height: 58, textAlign: 'center', fontSize: 22, fontWeight: 700,
              background: '#111118', border: `1px solid ${filled ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: 4, color: 'var(--gold)', outline: 'none', fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'}
            onBlur={e => { e.target.style.borderColor = filled ? 'var(--gold)' : 'var(--border)'; }}
          />
        );
      })}
    </div>
  );
};

export const Spinner = ({ size = 24 }) => (
  <span style={{ display: 'inline-block', width: size, height: size, border: '2px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
);

export const PageLoader = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Spinner />
  </div>
);
