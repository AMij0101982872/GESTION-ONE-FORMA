import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Globe } from 'lucide-react';
import { LANG_PAIRS } from '../constants/langs';

export default function LangSelect({ value, onChange, placeholder = '— Choisir une paire —' }) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const ref                   = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = LANG_PAIRS.filter(l => l.toLowerCase().includes(query.toLowerCase()));

  const select = (lang) => {
    onChange(lang);
    setOpen(false);
    setQuery('');
  };

  const [src, tgt] = value ? value.split(' → ') : [];

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>

      {/* Bouton trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          padding: '9px 12px',
          border: `1.5px solid ${value ? 'var(--green-border)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          background: value ? 'var(--green-bg)' : 'var(--surface)',
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'border-color .15s',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = value ? 'var(--green-border)' : 'var(--border)'; }}
      >
        {value ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={13} color="var(--green)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{src}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>→</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{tgt}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Globe size={13} color="var(--text3)" />
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{placeholder}</span>
          </div>
        )}
        <ChevronDown size={14} color="var(--text3)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
      </button>

      {/* Menu déroulant */}
      {open && (
        <div style={{
          position: 'absolute', zIndex: 100, top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,.12)',
          overflow: 'hidden',
        }}>

          {/* Recherche */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Search size={12} color="var(--text3)" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher une paire…"
              style={{
                flex: 1, border: 'none', background: 'none', outline: 'none',
                fontSize: 12, color: 'var(--text)', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Options */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {value && (
              <div
                onClick={() => select('')}
                style={{ padding: '8px 14px', fontSize: 11, color: 'var(--text3)', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                — Effacer la sélection
              </div>
            )}
            {filtered.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>Aucun résultat</div>
            )}
            {filtered.map(l => {
              const [s, t] = l.split(' → ');
              const isSelected = l === value;
              return (
                <div
                  key={l}
                  onClick={() => select(l)}
                  style={{
                    padding: '9px 14px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer',
                    background: isSelected ? 'var(--green-bg)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--green)' : '3px solid transparent',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface2)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', minWidth: 80 }}>{s}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>→</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{t}</span>
                  {isSelected && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
