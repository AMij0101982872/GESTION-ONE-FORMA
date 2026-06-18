import { useState } from 'react';
import { supabase } from '../lib/supabase';

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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48,
            background: '#111827',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
            boxShadow: '0 4px 14px rgba(0,0,0,.15)',
          }}>
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>B</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>BST</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: '4px 0 0', fontWeight: 500 }}>BAH SERVICES TECH</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '28px 28px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>Connexion</h2>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>Accès réservé à l'administrateur</p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div className="field">
              <label>Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoFocus
              />
            </div>

            <div className="field">
              <label>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 60 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 11,
                    fontWeight: 600, color: 'var(--text2)',
                  }}
                >
                  {showPass ? 'Cacher' : 'Voir'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '9px 12px',
                background: 'var(--red-bg, #fef2f2)',
                border: '1px solid var(--red-border, #fecaca)',
                borderRadius: 'var(--radius)',
                fontSize: 12, fontWeight: 600,
                color: 'var(--red, #dc2626)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: 13, marginTop: 4 }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>

          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text3)' }}>
          Supabase · Cloud · BST v1.0
        </p>
      </div>
    </div>
  );
}
