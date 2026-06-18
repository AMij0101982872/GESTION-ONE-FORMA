import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Shield, Users, LayoutGrid, CreditCard, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

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
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,.05)', top: -100, right: -100, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(255,255,255,.04)', bottom: 60, left: -80, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div style={{ width: 42, height: 42, background: 'white', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#0f172a', fontSize: 18, fontWeight: 900 }}>B</span>
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, letterSpacing: '.5px' }}>BST</div>
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase' }}>BAH SERVICES TECH</div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '5px 14px', marginBottom: 24 }}>
            <Shield size={11} color='rgba(255,255,255,.6)' />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Accès sécurisé</span>
          </div>
          <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 800, lineHeight: 1.2, margin: '0 0 16px' }}>
            Gestion<br />OneForma
          </h2>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            Plateforme de gestion des traducteurs,<br />comptes et paiements.
          </p>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { Icon: Users,      label: 'Gestion des traducteurs' },
              { Icon: LayoutGrid, label: 'Suivi des comptes' },
              { Icon: CreditCard, label: 'Paiements & commissions' },
            ].map(({ Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color='rgba(255,255,255,.7)' />
                </div>
                <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

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

          {/* En-tête formulaire */}
          <div style={{ marginBottom: 32 }}>
            {/* Mini logo */}
            <div style={{
              width: 48, height: 48,
              background: '#0f172a',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              boxShadow: '0 4px 16px rgba(15,23,42,.18)',
            }}>
              <span style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>B</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-.3px' }}>
              Bon retour 👋
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Connectez-vous pour accéder à votre espace de gestion
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Champ email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '.2px' }}>
                Adresse email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="admin@example.com"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 10,
                    fontSize: 13,
                    color: '#0f172a',
                    background: '#fff',
                    outline: 'none',
                    transition: 'border-color .15s, box-shadow .15s',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.boxShadow = '0 0 0 3px rgba(15,23,42,.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Champ mot de passe */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '.2px' }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 38px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 10,
                    fontSize: 13,
                    color: '#0f172a',
                    background: '#fff',
                    outline: 'none',
                    transition: 'border-color .15s, box-shadow .15s',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.boxShadow = '0 0 0 3px rgba(15,23,42,.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: '#94a3b8',
                    padding: 2, display: 'flex', alignItems: 'center',
                    borderRadius: 4,
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '11px 14px',
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: 10,
                fontSize: 12, fontWeight: 600,
                color: '#dc2626',
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Bouton */}
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
                transition: 'background .15s, transform .1s, box-shadow .15s',
                fontFamily: 'inherit',
                marginTop: 6,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(15,23,42,.25)',
                letterSpacing: '.2px',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(15,23,42,.3)'; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(15,23,42,.25)'; } }}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                  Connexion en cours…
                </>
              ) : (
                <><LogIn size={14} /> Se connecter</>
              )}
            </button>

          </form>

          {/* Séparateur + footer */}
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 500 }}>Accès réservé à l'administrateur</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

        </div>
      </div>

      {/* Animation spinner */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
