import { useState } from 'react';
import { Building2, Plus, Pencil, Trash2, Eye, EyeOff, X, Check, Users, ChevronDown, ChevronRight, Phone, UserCircle } from 'lucide-react';
import { toast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const empty = { name: '', password: '' };

const AVATAR_COLORS = [
  ['#dbeafe','#1d4ed8'], ['#dcfce7','#15803d'], ['#fef9c3','#a16207'],
  ['#fce7f3','#be185d'], ['#ede9fe','#6d28d9'], ['#ffedd5','#c2410c'],
];
function Avatar({ name, size = 26 }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const [bg, color] = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * .34, flexShrink: 0, fontFamily: 'inherit' }}>
      {initials || '?'}
    </div>
  );
}

/* ── Modal détail société ── */
function CompanyDetail({ company, accounts, translators, onClose }) {
  const compAccounts       = accounts.filter(a => a.company === company.name);
  const translatorIds      = [...new Set(compAccounts.map(a => a.translatorId).filter(Boolean))];
  const compTranslators    = translatorIds.map(id => translators.find(t => t.id === id)).filter(Boolean);
  const unassignedAccounts = compAccounts.filter(a => !a.translatorId);

  const STATUS_COLOR = { pending: 'var(--amber)', assigned: 'var(--blue)', active: 'var(--green)' };
  const STATUS_LABEL = { pending: 'En attente', assigned: 'Assigné', active: 'Actif' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.2)', border: '1px solid var(--border)' }}>

        {/* Header modal */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color="var(--blue)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: '-.3px' }}>{company.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                {compAccounts.length} compte{compAccounts.length > 1 ? 's' : ''} · {compTranslators.length} traducteur{compTranslators.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color="var(--text2)" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Traducteurs */}
          {compTranslators.length > 0 ? compTranslators.map(t => {
            const tAccounts = compAccounts.filter(a => a.translatorId === t.id);
            return (
              <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>

                {/* Header traducteur */}
                <div style={{ background: 'var(--surface2)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={t.name} size={36} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{t.name}</div>
                      {t.contact && (
                        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={10} /> {t.contact}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>
                    {tAccounts.length} compte{tAccounts.length > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Comptes du traducteur */}
                <div style={{ padding: '0 16px 12px' }}>
                  {tAccounts.map((acc, i) => (
                    <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < tAccounts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Username */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <UserCircle size={12} color="var(--text3)" />
                          {acc.username
                            ? <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{acc.username}</span>
                            : <span style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>Username non renseigné</span>
                          }
                        </div>
                        {/* Email */}
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginLeft: 18 }}>{acc.email}</div>
                        {/* Lang */}
                        {acc.lang && (
                          <div style={{ marginLeft: 18 }}>
                            <span className="lang-tag">{acc.lang}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {acc.accid && <span className="mono">{acc.accid}</span>}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, background: acc.status === 'active' ? 'var(--green-bg)' : acc.status === 'assigned' ? 'var(--blue-bg)' : 'var(--amber-bg)', color: STATUS_COLOR[acc.status], border: `1px solid ${acc.status === 'active' ? 'var(--green-border)' : acc.status === 'assigned' ? 'var(--blue-border)' : 'var(--amber-border)'}`, borderRadius: 5, padding: '2px 8px' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_COLOR[acc.status] }} />
                          {STATUS_LABEL[acc.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text2)', fontSize: 13 }}>
              Aucun traducteur assigné pour cette société encore.
            </div>
          )}

          {/* Comptes non assignés */}
          {unassignedAccounts.length > 0 && (
            <div style={{ border: '1px solid var(--amber-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ background: 'var(--amber-bg)', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚠ {unassignedAccounts.length} compte{unassignedAccounts.length > 1 ? 's' : ''} non assigné{unassignedAccounts.length > 1 ? 's' : ''}
              </div>
              <div style={{ padding: '0 16px 12px' }}>
                {unassignedAccounts.map((acc, i) => (
                  <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < unassignedAccounts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{acc.email}</div>
                      {acc.lang && <span className="lang-tag" style={{ marginTop: 3 }}>{acc.lang}</span>}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 600 }}>Non assigné</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Companies({ companies, accounts, translators = [], onAdd, onUpdate, onDelete }) {
  const [form, setForm]         = useState(empty);
  const [editId, setEditId]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPass, setShowPass] = useState({});
  const [showFormPass, setShowFormPass] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected]   = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const toggleExpand = (id) => setExpanded(s => ({ ...s, [id]: !s[id] }));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const togglePass = (id) => setShowPass(s => ({ ...s, [id]: !s[id] }));

  const submit = () => {
    if (!form.name.trim())     { toast('Le nom est obligatoire'); return; }
    if (!form.password.trim()) { toast('Le mot de passe est obligatoire'); return; }

    // Vérifier si le mot de passe est déjà utilisé par une autre société
    const conflict = companies.find(c => c.password === form.password.trim() && c.id !== editId);
    if (conflict) { toast(`Ce mot de passe appartient déjà à "${conflict.name}"`); return; }

    if (editId) {
      onUpdate(editId, { name: form.name.trim(), password: form.password.trim() });
      toast('Société modifiée ✓');
    } else {
      onAdd({ name: form.name.trim(), password: form.password.trim() });
      toast('Société ajoutée ✓');
    }
    cancel();
  };

  const startEdit = (c) => {
    setForm({ name: c.name, password: c.password });
    setEditId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancel = () => { setForm(empty); setEditId(null); setShowForm(false); setShowFormPass(false); };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Sociétés</h2>
          <p>Enregistre chaque société avec son mot de passe — la détection sera automatique à l'ajout de compte</p>
        </div>
        <button className="btn primary" style={{ marginTop: 4 }} onClick={() => { cancel(); setShowForm(s => !s); }}>
          <Plus size={13} /> Ajouter
        </button>
      </div>

      {/* KPIs */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{companies.length}</div>
          <div className="stat-label">Sociétés enregistrées</div>
        </div>
        <div className="stat-card">
          <div className="stat-num text-blue">
            {accounts.filter(a => a.company).length}
          </div>
          <div className="stat-label">Comptes avec société assignée</div>
        </div>
        <div className="stat-card">
          <div className="stat-num text-amber">
            {accounts.filter(a => !a.company).length}
          </div>
          <div className="stat-label">Comptes sans société</div>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card" style={{ borderColor: 'var(--accent-border)', background: 'var(--accent-light)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ marginBottom: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Building2 size={14} />
              {editId ? 'Modifier la société' : 'Nouvelle société'}
            </h3>
            <button className="btn sm icon" onClick={cancel}><X size={13} /></button>
          </div>

          <div className="row2">
            <div className="field">
              <label>Nom de la société *</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="ex: Transperfect, RWS, Lionbridge…"
                onKeyDown={e => e.key === 'Enter' && submit()}
                autoFocus
              />
            </div>
            <div className="field">
              <label>Mot de passe commun *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showFormPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Mot de passe utilisé pour tous leurs comptes"
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  style={{ paddingRight: 60, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
                />
                <button
                  onClick={() => setShowFormPass(s => !s)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center' }}
                >
                  {showFormPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn" onClick={cancel}>Annuler</button>
            <button className="btn primary" onClick={submit}>
              <Check size={13} /> {editId ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Liste vide */}
      {companies.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Building2 size={22} color="var(--text3)" />
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 5 }}>Aucune société</p>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 18 }}>
            Ajoute tes sociétés partenaires avec leur mot de passe commun.<br />
            Lors de l'ajout d'un compte, la société sera détectée automatiquement.
          </p>
          <button className="btn primary" onClick={() => setShowForm(true)}>
            <Plus size={13} /> Ajouter une société
          </button>
        </div>
      )}

      {/* Cartes sociétés */}
      {companies.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {companies.map(c => {
            const compAccounts = accounts.filter(a => a.company === c.name);
            const isVisible    = showPass[c.id];
            const isExpanded   = expanded[c.id];

            // Traducteurs qui ont au moins un compte de cette société
            const compTranslatorIds = [...new Set(compAccounts.map(a => a.translatorId).filter(Boolean))];
            const compTranslators   = compTranslatorIds.map(id => translators.find(t => t.id === id)).filter(Boolean);

            return (
              <div key={c.id} className="card" style={{ marginBottom: 0, padding: '1.1rem', cursor: 'pointer' }}
                onClick={() => setSelected(c)}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={18} color="var(--blue)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', letterSpacing: '-.2px' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                        {compAccounts.length} compte{compAccounts.length > 1 ? 's' : ''} associé{compAccounts.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                    <button className="btn sm icon" onClick={() => startEdit(c)}><Pencil size={12} /></button>
                    <button className="btn sm danger icon" onClick={() => setConfirmId(c.id)}><Trash2 size={12} /></button>
                  </div>
                </div>

                {/* Mot de passe */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
                    Mot de passe commun
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px' }}>
                    <code style={{ flex: 1, fontSize: 12, color: 'var(--text)', fontFamily: 'ui-monospace, monospace', letterSpacing: isVisible ? '.3px' : '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isVisible ? c.password : '••••••••••••'}
                    </code>
                    <button onClick={e => { e.stopPropagation(); togglePass(c.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0 }}>
                      {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                {/* Stats ligne */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{compAccounts.length}</div>
                    <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1, fontWeight: 500 }}>Comptes</div>
                  </div>
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: compTranslators.length > 0 ? 'var(--blue)' : 'var(--text3)' }}>{compTranslators.length}</div>
                    <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1, fontWeight: 500 }}>Traducteurs</div>
                  </div>
                </div>

                {/* Liste traducteurs — expandable */}
                {compTranslators.length > 0 ? (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <button onClick={e => { e.stopPropagation(); toggleExpand(c.id); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: isExpanded ? 10 : 0 }}>
                      {isExpanded ? <ChevronDown size={12} color="var(--text2)" /> : <ChevronRight size={12} color="var(--text2)" />}
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Users size={11} />
                        {compTranslators.length} traducteur{compTranslators.length > 1 ? 's' : ''} assigné{compTranslators.length > 1 ? 's' : ''}
                      </span>
                    </button>

                    {isExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {compTranslators.map(t => {
                          const tAccounts = compAccounts.filter(a => a.translatorId === t.id);
                          return (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar name={t.name} />
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{t.name}</div>
                                  {t.contact && <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1 }}>{t.contact}</div>}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{tAccounts.length}</div>
                                <div style={{ fontSize: 10, color: 'var(--text2)' }}>compte{tAccounts.length > 1 ? 's' : ''}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>
                    Aucun traducteur assigné pour cette société
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal détail société */}
      {selected && (
        <CompanyDetail
          company={selected}
          accounts={accounts}
          translators={translators}
          onClose={() => setSelected(null)}
        />
      )}

      {confirmId && (
        <ConfirmModal
          message={`Supprimer cette société ? Les comptes associés ne seront pas supprimés.`}
          onConfirm={() => { onDelete(confirmId); toast('Société supprimée'); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
