import { useState } from 'react';
import { UserPlus, Pencil, Trash2, X, Users, Search, ChevronDown, ChevronRight, Activity } from 'lucide-react';
import { toast } from '../components/Toast';

const empty = { name: '', contact: '' };

const AVATAR_COLORS = [
  ['#dbeafe','#1d4ed8'], ['#dcfce7','#15803d'], ['#fef9c3','#a16207'],
  ['#fce7f3','#be185d'], ['#ede9fe','#6d28d9'], ['#ffedd5','#c2410c'],
];

function Avatar({ name, size = 40 }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const [bg, color] = AVATAR_COLORS[idx];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * .33, flexShrink: 0,
      letterSpacing: '-.5px', fontFamily: 'inherit',
    }}>
      {initials || '?'}
    </div>
  );
}

const STATUS_LABEL = { pending: 'En attente', assigned: 'Assigné', active: 'Actif' };
const STATUS_DOT   = { pending: 'var(--amber)', assigned: 'var(--blue)', active: 'var(--green)' };

export default function Translators({ translators, accounts, payments, onAdd, onUpdate, onDelete }) {
  const [form, setForm]       = useState(empty);
  const [editId, setEditId]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch]   = useState('');
  const [expanded, setExpanded] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleExpand = (id) => setExpanded(s => ({ ...s, [id]: !s[id] }));

  const submit = () => {
    if (!form.name.trim()) { toast('Le nom est requis'); return; }
    if (editId) {
      onUpdate(editId, { name: form.name.trim(), contact: form.contact.trim() });
      toast('Modifié ✓');
    } else {
      onAdd({ name: form.name.trim(), contact: form.contact.trim() });
      toast('Traducteur ajouté ✓');
    }
    setForm(empty); setEditId(null); setShowForm(false);
  };

  const startEdit = (t) => {
    setForm({ name: t.name, contact: t.contact || '' });
    setEditId(t.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancel = () => { setForm(empty); setEditId(null); setShowForm(false); };

  // KPIs globaux
  const totalAccounts = accounts.filter(a => a.translatorId).length;
  const totalWords    = payments.reduce((s, p) => s + (p.paidWords || 0), 0);
  const totalDue      = payments.filter(p => !p.paid).reduce((s, p) => s + p.totalPrice, 0);
  const maxWords      = Math.max(...translators.map(t => payments.filter(p => p.translatorId === t.id).reduce((s, p) => s + (p.paidWords || 0), 0)), 1);

  const filtered = translators.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.contact?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Traducteurs</h2>
          <p>Les paires de langues sont déduites des comptes assignés</p>
        </div>
        <button className="btn primary" style={{ marginTop: 4 }} onClick={() => { cancel(); setShowForm(s => !s); }}>
          <UserPlus size={13} /> Ajouter
        </button>
      </div>

      {/* KPIs */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{translators.length}</div>
          <div className="stat-label">Traducteurs</div>
        </div>
        <div className="stat-card">
          <div className="stat-num text-blue">{totalAccounts}</div>
          <div className="stat-label">Comptes assignés</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{totalWords.toLocaleString('fr-FR')}</div>
          <div className="stat-label">Mots traduits (total)</div>
        </div>
        <div className="stat-card">
          <div className="stat-num text-amber">${totalDue.toFixed(2)}</div>
          <div className="stat-label">Montant total dû</div>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card" style={{ borderColor: 'var(--accent-border)', background: 'var(--accent-light)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ marginBottom: 0, color: 'var(--accent)' }}>
              <UserPlus size={14} />
              {editId ? 'Modifier le traducteur' : 'Nouveau traducteur'}
            </h3>
            <button className="btn sm icon" onClick={cancel}><X size={13} /></button>
          </div>
          <div className="row2">
            <div className="field">
              <label>Nom complet *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Prénom Nom" onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
            </div>
            <div className="field">
              <label>Contact WhatsApp / Telegram</label>
              <input value={form.contact} onChange={e => set('contact', e.target.value)}
                placeholder="+212 6xx xx xx xx" onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn" onClick={cancel}>Annuler</button>
            <button className="btn primary" onClick={submit}>
              <UserPlus size={13} /> {editId ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Recherche */}
      {translators.length > 0 && (
        <div style={{ position: 'relative', marginBottom: '1rem', maxWidth: 320 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un traducteur…"
            style={{ width: '100%', paddingLeft: 30, padding: '8px 10px 8px 30px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      )}

      {/* Empty state */}
      {translators.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Users size={22} color="var(--text3)" />
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 5 }}>Aucun traducteur</p>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 18 }}>Commence par ajouter ton premier traducteur</p>
          <button className="btn primary" onClick={() => setShowForm(true)}>
            <UserPlus size={13} /> Ajouter un traducteur
          </button>
        </div>
      )}

      {/* Grille */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {filtered.map(t => {
          const accs          = accounts.filter(a => a.translatorId === t.id);
          const activeAccs    = accs.filter(a => a.status === 'active');
          const assignedLangs = [...new Set(accs.map(a => a.lang).filter(Boolean))];
          const due           = payments.filter(p => p.translatorId === t.id && !p.paid).reduce((s, p) => s + p.totalPrice, 0);
          const words         = payments.filter(p => p.translatorId === t.id).reduce((s, p) => s + (p.paidWords || 0), 0);
          const wordsPct      = Math.round((words / maxWords) * 100);
          const isExpanded    = expanded[t.id];

          return (
            <div key={t.id} className="card" style={{ marginBottom: 0, padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* Header carte */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                  <Avatar name={t.name} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', letterSpacing: '-.2px', lineHeight: 1.2 }}>
                      {t.name}
                    </div>
                    {t.contact
                      ? <a href={`tel:${t.contact}`} style={{ fontSize: 11, color: 'var(--accent)', marginTop: 3, display: 'block', textDecoration: 'none' }}>{t.contact}</a>
                      : <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, fontStyle: 'italic' }}>Sans contact</div>
                    }
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button className="btn sm icon" onClick={() => startEdit(t)}><Pencil size={12} /></button>
                  <button className="btn sm danger icon" onClick={() => {
                    if (confirm('Supprimer ce traducteur ? Ses comptes seront désassignés.')) { onDelete(t.id); toast('Traducteur supprimé'); }
                  }}><Trash2 size={12} /></button>
                </div>
              </div>

              {/* Langues */}
              <div style={{ minHeight: 20, marginBottom: 14 }}>
                {assignedLangs.length > 0
                  ? assignedLangs.map(l => <span key={l} className="lang-tag">{l}</span>)
                  : <span style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>Aucune langue assignée</span>
                }
              </div>

              {/* Stats 2 colonnes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', paddingTop: 12, borderTop: '1px solid var(--border)', marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.5px', color: 'var(--text)' }}>{accs.length}</div>
                  <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2, fontWeight: 500 }}>Comptes</div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.5px', color: due > 0 ? 'var(--amber)' : 'var(--text3)' }}>
                    {due > 0 ? `$${due.toFixed(0)}` : '—'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2, fontWeight: 500 }}>Dû</div>
                </div>
              </div>

              {/* Barre de progression mots */}
              {words > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Activity size={11} /> {words.toLocaleString('fr-FR')} mots traduits
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{wordsPct}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div style={{ height: '100%', width: `${wordsPct}%`, background: AVATAR_COLORS[t.name.charCodeAt(0) % AVATAR_COLORS.length][1], borderRadius: 4, transition: 'width .4s' }} />
                  </div>
                </div>
              )}

              {/* Comptes assignés (expandable) */}
              {accs.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <button
                    onClick={() => toggleExpand(t.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      {accs.length} compte{accs.length > 1 ? 's' : ''} assigné{accs.length > 1 ? 's' : ''}
                      {activeAccs.length > 0 && (
                        <span style={{ background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                          {activeAccs.length} actif{activeAccs.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                  </button>

                  {isExpanded && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {accs.map(acc => (
                        <div key={acc.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '6px 10px', borderRadius: 7,
                          background: 'var(--surface2)', border: '1px solid var(--border)',
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {acc.username
                                ? <span style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--accent)' }}>{acc.username}</span>
                                : <span style={{ color: 'var(--text2)', fontStyle: 'italic' }}>{acc.email}</span>
                              }
                            </div>
                            {acc.lang && <span className="lang-tag" style={{ marginTop: 2 }}>{acc.lang}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[acc.status] }} />
                            <span style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 500 }}>{STATUS_LABEL[acc.status]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No accounts */}
              {accs.length === 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>
                  Aucun compte assigné
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && translators.length > 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Aucun résultat pour "<strong>{search}</strong>"</p>
          <button className="btn sm" style={{ marginTop: 10 }} onClick={() => setSearch('')}>Effacer la recherche</button>
        </div>
      )}
    </div>
  );
}
