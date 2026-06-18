import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Shield, Users, LayoutGrid, CreditCard } from 'lucide-react';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError('Email ou mot de passe incorrect.');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    }}>

      {/* ── Côté gauche — Branding ── */}
      <div style={{
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 52px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Cercles décoratifs */}
        <div style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%', border: '1px solid rgba(255,255,255,.05)',
          top: -100, right: -100, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 280, height: 280,
          borderRadius: '50%', border: '1px solid rgba(255,255,255,.04)',
          bottom: 60, left: -80, pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div style={{
            width: 42, height: 42,
            background: 'white',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: '#0f172a', fontSize: 18, fontWeight: 900 }}>B</span>
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, letterSpacing: '.5px' }}>BST</div>
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase' }}>BAH SERVICES TECH</div>
          </div>
        </div>

        {/* Texte central */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 20, padding: '5px 14px',
            marginBottom: 24,
          }}>
            <Shield size={11} color='rgba(255,255,255,.6)' />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Accès sécurisé</span>
          </div>

          <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 800, lineHeight: 1.2, margin: '0 0 16px' }}>
            Gestion<br />OneForma
          </h2>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            Plateforme de gestion des traducteurs,<br />comptes et paiements.
          </p>

          {/* Features */}
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { Icon: Users,      label: 'Gestion des traducteurs' },
              { Icon: LayoutGrid, label: 'Suivi des comptes' },
              { Icon: CreditCard, label: 'Paiements & commissions' },
            ].map(({ Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,.07)',
                  border: '1px solid rgba(255,255,255,.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={14} color='rgba(255,255,255,.7)' />
                </div>
                <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer gauche */}
        <div style={{ color: 'rgba(255,255,255,.2)', fontSize: 11, position: 'relative' }}>
          BST v1.0 · Supabase Cloud
        </div>
      </div>

      {/* ── Côté droit — Formulaire ── */}
      <div style={{
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 52px',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              Connexion
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Entrez vos identifiants pour accéder à la plateforme
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoFocus
                style={{
                  padding: '11px 14px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 13,
                  color: '#0f172a',
                  background: '#fff',
                  outline: 'none',
                  transition: 'border-color .15s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#111827'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 52px 11px 14px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 10,
                    fontSize: 13,
                    color: '#0f172a',
                    background: '#fff',
                    outline: 'none',
                    transition: 'border-color .15s',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#111827'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 11,
                    fontWeight: 600, color: '#94a3b8',
                    padding: '2px 4px',
                  }}
                >
                  {showPass ? 'Cacher' : 'Voir'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 10,
                fontSize: 12, fontWeight: 600,
                color: '#dc2626',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: loading ? '#94a3b8' : '#0f172a',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '13px',
                fontSize: 13, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background .15s',
                fontFamily: 'inherit',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1e293b'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0f172a'; }}
            >
              {loading ? (
                'Connexion en cours…'
              ) : (
                <><LogIn size={14} /> Se connecter</>
              )}
            </button>

          </form>

          <p style={{ marginTop: 28, fontSize: 11, color: '#cbd5e1', textAlign: 'center' }}>
            Accès réservé à l'administrateur BST
          </p>
        </div>
      </div>
    </div>
  );
}
