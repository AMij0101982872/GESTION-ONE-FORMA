import { useState } from 'react';
import { PlusCircle, ClipboardPaste, CheckCircle, RefreshCw, Building2 } from 'lucide-react';
import { toast } from '../components/Toast';

const empty = { email: '', pass: '', key: '', lang: '', accid: '', notes: '', translatorId: '', company: '' };

function parseCredentials(raw) {
  const result = { email: '', pass: '', key: '', lang: '' };
  let text = raw;
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) { result.email = emailMatch[0]; text = text.replace(result.email, '\n'); }
  const keyMatch = text.match(/[A-Z2-7]{16,}/);
  if (keyMatch) { result.key = keyMatch[0]; text = text.replace(result.key, '\n'); }
  const lines = text.split(/[\n\r\t]+/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (!result.lang && /\s/.test(line) && line.length > 3) result.lang = line;
    else if (!result.pass && line.length >= 4) result.pass = line;
  }
  return result;
}

function Field({ label, required, children }) {
  return (
    <div className="field">
      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {required && <span style={{ color: '#dc2626', fontSize: 10 }}>•</span>}
      </label>
      {children}
    </div>
  );
}

export default function NewAccount({ translators, accounts, companies = [], onAdd }) {
  const [form, setForm]         = useState(empty);
  const [pasteText, setPasteText] = useState('');
  const [parsed, setParsed]     = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [companySuggestion, setCompanySuggestion] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Noms des sociétés connues pour les suggestions manuelles
  const knownCompanies = companies.map(c => c.name);

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text');
    const result = parseCredentials(text);
    setPasteText(text);
    setParsed(result);

    // Détection automatique via la table Sociétés
    let detectedCompany = '';
    let suggestion = null;
    if (result.pass) {
      const match = companies.find(c => c.password === result.pass);
      if (match) {
        detectedCompany = match.name;
        suggestion = match.name;
      }
    }
    setCompanySuggestion(suggestion);

    setForm(f => ({
      ...f,
      email:   result.email   || f.email,
      pass:    result.pass    || f.pass,
      key:     result.key     || f.key,
      lang:    result.lang    || f.lang,
      company: detectedCompany || f.company,
    }));

    toast(suggestion
      ? `Credentials détectés · Société : ${suggestion} ✓`
      : 'Credentials détectés et remplis ✓'
    );
    e.preventDefault();
  };

  const reset = () => { setForm(empty); setPasteText(''); setParsed(null); setCompanySuggestion(null); };

  const submit = () => {
    if (!form.email || !form.pass) { toast('Email et mot de passe obligatoires'); return; }
    onAdd({ ...form, translatorId: form.translatorId || null });
    reset();
    toast('Compte enregistré' + (form.translatorId ? ' et assigné ✓' : ''));
  };

  const detectedCount = parsed ? [parsed.email, parsed.pass, parsed.key, parsed.lang].filter(Boolean).length : 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Nouveau compte</h2>
          <p>Colle les credentials reçus — les champs se remplissent automatiquement</p>
        </div>
        {(form.email || parsed) && (
          <button className="btn" onClick={reset} style={{ marginTop: 4 }}>
            <RefreshCw size={12} /> Réinitialiser
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', alignItems: 'start' }}>

        {/* Colonne principale */}
        <div>

          {/* Zone collage */}
          <div className="card" style={{
            borderColor: parsed ? 'var(--green-border)' : 'var(--border)',
            background: parsed ? 'var(--green-bg)' : 'var(--surface)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ marginBottom: 0, color: parsed ? 'var(--green)' : 'var(--text)' }}>
                {parsed ? <CheckCircle size={14} /> : <ClipboardPaste size={14} />}
                {parsed ? `${detectedCount} champ(s) détecté(s)` : 'Collage rapide'}
              </h3>
              {parsed && (
                <button className="btn sm" onClick={() => { setParsed(null); setPasteText(''); setCompanySuggestion(null); }}>
                  Recoller
                </button>
              )}
            </div>

            {!parsed ? (
              <div style={{ position: 'relative' }}>
                <textarea
                  style={{
                    width: '100%', minHeight: 110,
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 12, padding: '10px 12px',
                    borderRadius: 'var(--radius)',
                    border: '1.5px dashed var(--border2)',
                    background: 'var(--surface2)',
                    color: 'var(--text)',
                    boxSizing: 'border-box', resize: 'none', outline: 'none', lineHeight: 1.6,
                  }}
                  placeholder={'Ctrl+V — exemple :\ngreat30.web@outlook.com\nGreat@2026@\nDutch and Ukrainian\n\nGY3WMMRZMY2W...'}
                  onPaste={handlePaste}
                  value={pasteText}
                  onChange={() => {}}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Email',        value: parsed.email },
                    { label: 'Mot de passe', value: parsed.pass ? '••••••••' : null },
                    { label: 'Langue',       value: parsed.lang },
                    { label: 'Clé auth',     value: parsed.key ? parsed.key.slice(0,12) + '…' : null },
                  ].map(f => (
                    <div key={f.label} style={{ padding: '8px 12px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 3 }}>{f.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: f.value ? 'var(--text)' : 'var(--text3)' }}>{f.value || '—'}</div>
                    </div>
                  ))}
                </div>

                {/* Badge société détectée */}
                {companySuggestion && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: 'var(--radius)' }}>
                    <Building2 size={13} color="var(--blue)" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>
                      Société détectée automatiquement : {companySuggestion}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Formulaire */}
          <div className="card">
            <h3>Informations du compte</h3>

            <div className="row2">
              <Field label="Email" required>
                <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="user@platform.com" />
              </Field>
              <Field label="Mot de passe" required>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.pass}
                    onChange={e => set('pass', e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingRight: 60 }}
                  />
                  <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600, color: 'var(--text2)' }}>
                    {showPass ? 'Cacher' : 'Voir'}
                  </button>
                </div>
              </Field>
            </div>

            {/* Société — champ clé */}
            <Field label="Société / Source">
              <div style={{ position: 'relative' }}>
                <Building2 size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                <input
                  value={form.company}
                  onChange={e => set('company', e.target.value)}
                  placeholder="ex: Société A, Transperfect, RWS…"
                  list="company-list"
                  style={{ paddingLeft: 30 }}
                />
                <datalist id="company-list">
                  {knownCompanies.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              {knownCompanies.length > 0 && !form.company && (
                <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                  {knownCompanies.map(c => (
                    <button key={c} onClick={() => set('company', c)}
                      style={{ fontSize: 10, padding: '2px 8px', border: '1px solid var(--blue-border)', borderRadius: 5, background: 'var(--blue-bg)', color: 'var(--blue)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </Field>

            <div className="row2">
              <Field label="Paire de langue">
                <input value={form.lang} onChange={e => set('lang', e.target.value)} placeholder="ex: Dutch → Ukrainian" />
              </Field>
              <Field label="Clé d'authentification">
                <input value={form.key} onChange={e => set('key', e.target.value)} placeholder="token / 2FA key" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }} />
              </Field>
            </div>

            <div className="row2">
              <Field label="Account ID">
                <input value={form.accid} onChange={e => set('accid', e.target.value)} placeholder="ex: JA636101" />
              </Field>
              <Field label="Assigner à un traducteur">
                {translators.length === 0 ? (
                  <input disabled placeholder="Aucun traducteur enregistré" />
                ) : (
                  <select value={form.translatorId} onChange={e => set('translatorId', e.target.value)}>
                    <option value="">— Non assigné —</option>
                    {translators.map(t => (
                      <option key={t.id} value={t.id}>{t.name}{t.contact ? ` · ${t.contact}` : ''}</option>
                    ))}
                  </select>
                )}
              </Field>
            </div>

            <Field label="Notes">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Informations supplémentaires..." style={{ minHeight: 52 }} />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
              <button className="btn" onClick={reset}>Effacer</button>
              <button className="btn primary" onClick={submit}>
                <PlusCircle size={13} /> Enregistrer
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite — aide */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '2rem' }}>
            <h3 style={{ fontSize: 12 }}>Format WhatsApp attendu</h3>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 12px', fontFamily: 'ui-monospace, monospace', fontSize: 11, lineHeight: 1.8, color: 'var(--text2)', marginBottom: 14 }}>
              <span style={{ color: 'var(--accent)' }}>user@platform.com</span><br />
              <span style={{ color: 'var(--text)' }}>MotDePasse@2026</span><br />
              <span style={{ color: 'var(--green)' }}>Dutch and Ukrainian</span><br />
              <br />
              <span style={{ color: 'var(--amber)', fontSize: 10 }}>GY3WMMRZMY2WIMB…</span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 10, minWidth: 16 }}>①</span>
                <span>Email détecté par le <code style={{ fontSize: 10 }}>@</code></span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 10, minWidth: 16 }}>②</span>
                <span>Mot de passe — sans espace</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 10, minWidth: 16 }}>③</span>
                <span>Langue — contient des espaces</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 10, minWidth: 16 }}>④</span>
                <span>Clé — longue chaîne majuscules</span>
              </div>
            </div>

            {knownCompanies.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={11} /> Sociétés connues
                </div>
                {knownCompanies.map(c => (
                  <div key={c} style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }} />
                    {c}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)' }}>
              La langue et la clé sont optionnelles. La société est détectée automatiquement si le mot de passe est connu.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
