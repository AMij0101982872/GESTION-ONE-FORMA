import { useState } from 'react';
import { Check, Trash2, Search, LayoutGrid, AlertCircle, UserCheck, Activity, Building2, ClipboardPaste, X } from 'lucide-react';
import { toast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

function parseUsernamePaste(text) {
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
  return lines.reduce((acc, line) => {
    const emailMatch = line.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (!emailMatch) return acc;
    const email    = emailMatch[0];
    const username = line.replace(email, '').replace(/^[\s:|\-]+|[\s:|\-]+$/g, '').trim();
    if (username) acc.push({ email, username });
    return acc;
  }, []);
}

const STATUS_TABS = [
  { key: 'all',      label: 'Tous',        color: null },
  { key: 'pending',  label: 'En attente',  color: 'var(--amber)' },
  { key: 'assigned', label: 'Assignés',    color: 'var(--blue)'  },
  { key: 'active',   label: 'Actifs',      color: 'var(--green)' },
];

const STATUS_LABEL = { pending: 'En attente', assigned: 'Assigné', active: 'Actif' };
const STATUS_ICON  = { pending: AlertCircle, assigned: UserCheck, active: Activity };

export default function Accounts({ accounts, translators, onUpdate, onDelete }) {
  const [usernames, setUsernames]   = useState({});
  const [filter, setFilter]         = useState('all');
  const [company, setCompany]       = useState('all');
  const [search, setSearch]         = useState('');
  const [confirmId, setConfirmId]   = useState(null);
  const [showPaste, setShowPaste]   = useState(false);
  const [pasteText, setPasteText]   = useState('');
  const [pasteMatches, setPasteMatches] = useState(null);

  const setUn = (id, val) => setUsernames(u => ({ ...u, [id]: val }));

  const saveUsername = (acc) => {
    const val = (usernames[acc.id] ?? acc.username ?? '').trim();
    if (!val) return;
    onUpdate(acc.id, { username: val, status: 'active' });
    setUsernames(u => { const n = { ...u }; delete n[acc.id]; return n; });
    toast('Username enregistré ✓');
  };

  const reassign = (id, tid) => {
    onUpdate(id, { translatorId: tid || null, status: tid ? 'assigned' : 'pending' });
    toast(tid ? 'Compte assigné ✓' : 'Désassigné');
  };

  const analyzePaste = () => {
    const pairs = parseUsernamePaste(pasteText);
    const results = pairs.map(({ email, username }) => {
      const acc = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
      return { email, username, account: acc || null };
    });
    setPasteMatches(results);
  };

  const applyUsernames = () => {
    const matched = pasteMatches.filter(r => r.account);
    matched.forEach(r => onUpdate(r.account.id, { username: r.username, status: 'active' }));
    toast(`${matched.length} username${matched.length > 1 ? 's' : ''} mis à jour ✓`);
    setPasteText(''); setPasteMatches(null); setShowPaste(false);
  };

  const pending  = accounts.filter(a => a.status === 'pending').length;
  const assigned = accounts.filter(a => a.status === 'assigned').length;
  const active   = accounts.filter(a => a.status === 'active').length;

  // Sociétés connues
  const companies = [...new Set(accounts.map(a => a.company).filter(Boolean))].sort();

  const filtered = [...accounts].reverse().filter(a => {
    const matchFilter  = filter === 'all' || a.status === filter;
    const matchCompany = company === 'all' || (a.company || '') === company;
    const q = search.toLowerCase();
    const matchSearch  = !q || a.email?.toLowerCase().includes(q) || a.accid?.toLowerCase().includes(q) || a.username?.toLowerCase().includes(q) || a.lang?.toLowerCase().includes(q) || a.company?.toLowerCase().includes(q);
    return matchFilter && matchCompany && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Comptes</h2>
          <p>Gestion des comptes, assignations et usernames</p>
        </div>
      </div>

      {/* Zone collage usernames */}
      {!showPaste ? (
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => setShowPaste(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClipboardPaste size={13} /> Coller usernames WhatsApp
          </button>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--blue-border)', background: 'var(--blue-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ marginBottom: 0, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <ClipboardPaste size={14} /> Mise à jour groupée des usernames
            </h3>
            <button className="btn sm icon" onClick={() => { setShowPaste(false); setPasteText(''); setPasteMatches(null); }}><X size={13} /></button>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
            Demande aux traducteurs d'envoyer leur <strong>email : username</strong> dans le groupe WhatsApp, puis colle tout ici.
          </p>
          <div style={{ background: 'var(--surface2)', border: '1px dashed var(--blue-border)', borderRadius: 7, padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text2)', marginBottom: 12 }}>
            Exemple :<br/>
            john@gmail.com : john_doe_123<br/>
            marie@outlook.com : marie_tr456
          </div>

          {!pasteMatches ? (
            <>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={"Colle ici les réponses du groupe WhatsApp..."}
                style={{ width: '100%', minHeight: 100, fontFamily: 'ui-monospace, monospace', fontSize: 12, padding: '10px 12px', borderRadius: 'var(--radius)', border: '1.5px solid var(--border2)', background: 'var(--surface)', color: 'var(--text)', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn primary" onClick={analyzePaste} disabled={!pasteText.trim()}>
                  <Check size={13} /> Analyser
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {pasteMatches.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: r.account ? 'var(--green-bg)' : '#fff7ed', border: `1px solid ${r.account ? 'var(--green-border)' : 'var(--amber-border)'}` }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{r.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                        → <span style={{ fontFamily: 'monospace', fontWeight: 700, color: r.account ? 'var(--green)' : 'var(--amber)' }}>{r.username}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: r.account ? 'var(--green-bg)' : 'var(--amber-bg)', color: r.account ? 'var(--green)' : 'var(--amber)', border: `1px solid ${r.account ? 'var(--green-border)' : 'var(--amber-border)'}` }}>
                      {r.account ? '✓ Trouvé' : '✗ Inconnu'}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {pasteMatches.filter(r => r.account).length} correspondance{pasteMatches.filter(r => r.account).length > 1 ? 's' : ''} sur {pasteMatches.length}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={() => setPasteMatches(null)}>Recoller</button>
                  <button className="btn primary" onClick={applyUsernames} disabled={!pasteMatches.some(r => r.account)}>
                    <Check size={13} /> Appliquer
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="stats-row">
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-num">{accounts.length}</div>
              <div className="stat-label">Total comptes</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutGrid size={16} color="var(--text2)" />
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter('pending')}>
          <div className="stat-num text-amber">{pending}</div>
          <div className="stat-label">En attente d'assignation</div>
          {pending > 0 && <div style={{ marginTop: 8, fontSize: 10, color: 'var(--amber)', fontWeight: 600 }}>Cliquer pour filtrer →</div>}
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter('assigned')}>
          <div className="stat-num text-blue">{assigned}</div>
          <div className="stat-label">Assignés — username manquant</div>
          {assigned > 0 && <div style={{ marginTop: 8, fontSize: 10, color: 'var(--blue)', fontWeight: 600 }}>Cliquer pour filtrer →</div>}
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter('active')}>
          <div className="stat-num text-green">{active}</div>
          <div className="stat-label">Actifs — username renseigné</div>
          {active > 0 && <div style={{ marginTop: 8, fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>Cliquer pour filtrer →</div>}
        </div>
      </div>

      {/* Tableau */}
      <div className="card">

        {/* Barre de filtre + recherche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Tabs statut */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', padding: 3, borderRadius: 10, border: '1px solid var(--border)' }}>
              {STATUS_TABS.map(tab => {
                const count = tab.key === 'all' ? accounts.length : accounts.filter(a => a.status === tab.key).length;
                return (
                  <button key={tab.key} onClick={() => setFilter(tab.key)}
                    style={{ padding: '5px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .12s', background: filter === tab.key ? 'var(--surface)' : 'transparent', color: filter === tab.key ? (tab.color || 'var(--text)') : 'var(--text2)', boxShadow: filter === tab.key ? 'var(--shadow)' : 'none', fontFamily: 'inherit' }}>
                    {tab.label}<span style={{ marginLeft: 6, fontSize: 10, opacity: .7 }}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Recherche */}
            <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher email, ID, username, société…"
                style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, background: 'var(--surface2)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          {/* Filtre par société */}
          {companies.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginRight: 2 }}>
                <Building2 size={11} /> Société :
              </div>
              <button onClick={() => setCompany('all')}
                style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: company === 'all' ? 'var(--text)' : 'var(--surface)', color: company === 'all' ? '#fff' : 'var(--text2)' }}>
                Toutes <span style={{ opacity: .6 }}>{accounts.length}</span>
              </button>
              {companies.map(c => {
                const count = accounts.filter(a => a.company === c).length;
                return (
                  <button key={c} onClick={() => setCompany(c)}
                    style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid var(--blue-border)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: company === c ? 'var(--blue)' : 'var(--blue-bg)', color: company === c ? '#fff' : 'var(--blue)', transition: 'all .12s' }}>
                    {c} <span style={{ opacity: .7 }}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {accounts.length === 0 ? (
          <div className="empty">Aucun compte — utilise "Nouveau compte" pour en ajouter</div>
        ) : filtered.length === 0 ? (
          <div className="empty">Aucun résultat pour cette recherche</div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Compte</th>
                  <th>Société</th>
                  <th>Langue</th>
                  <th>Traducteur</th>
                  <th>Username</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(acc => {
                  const Icon = STATUS_ICON[acc.status];
                  const hasUsername = !!(acc.username);
                  const isDirty = usernames[acc.id] !== undefined && usernames[acc.id] !== (acc.username ?? '');

                  return (
                    <tr key={acc.id}>
                      {/* Compte */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            background: acc.status === 'active' ? 'var(--green-bg)' : acc.status === 'assigned' ? 'var(--blue-bg)' : 'var(--amber-bg)',
                            border: `1px solid ${acc.status === 'active' ? 'var(--green-border)' : acc.status === 'assigned' ? 'var(--blue-border)' : 'var(--amber-border)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon size={13} color={acc.status === 'active' ? 'var(--green)' : acc.status === 'assigned' ? 'var(--blue)' : 'var(--amber)'} />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 1 }}>
                              {acc.email}
                            </div>
                            {acc.accid && <span className="mono">{acc.accid}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Société */}
                      <td>
                        {acc.company
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: 5, padding: '2px 8px' }}>
                              <Building2 size={10} />{acc.company}
                            </span>
                          : <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>
                        }
                      </td>

                      {/* Langue */}
                      <td>
                        {acc.lang
                          ? <span className="lang-tag">{acc.lang}</span>
                          : <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>
                        }
                      </td>

                      {/* Traducteur */}
                      <td>
                        <select
                          value={acc.translatorId || ''}
                          onChange={e => reassign(acc.id, e.target.value)}
                          style={{
                            fontSize: 12, padding: '5px 8px', width: 160,
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            background: 'var(--surface2)',
                            color: acc.translatorId ? 'var(--text)' : 'var(--text2)',
                            outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
                          }}
                        >
                          <option value="">Non assigné</option>
                          {[...translators].sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Username */}
                      <td style={{ minWidth: 200 }}>
                        {acc.status === 'assigned' || acc.status === 'active' ? (
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input
                                value={usernames[acc.id] ?? acc.username ?? ''}
                                onChange={e => setUn(acc.id, e.target.value)}
                                placeholder="Entrer le username…"
                                onKeyDown={e => e.key === 'Enter' && saveUsername(acc)}
                                style={{
                                  width: '100%', padding: '5px 9px',
                                  fontSize: 12, fontFamily: 'ui-monospace, monospace',
                                  border: `1.5px solid ${hasUsername ? 'var(--green-border)' : 'var(--amber-border)'}`,
                                  borderRadius: 'var(--radius)',
                                  background: hasUsername ? 'var(--green-bg)' : 'var(--amber-bg)',
                                  color: 'var(--text)', outline: 'none',
                                  fontWeight: hasUsername ? 600 : 400,
                                  transition: 'border-color .12s',
                                }}
                                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'var(--surface)'; }}
                                onBlur={e => {
                                  e.target.style.borderColor = hasUsername ? 'var(--green-border)' : 'var(--amber-border)';
                                  e.target.style.background = hasUsername ? 'var(--green-bg)' : 'var(--amber-bg)';
                                }}
                              />
                            </div>
                            {isDirty && (
                              <button className="btn sm green" onClick={() => saveUsername(acc)} title="Enregistrer">
                                <Check size={11} />
                              </button>
                            )}
                            {hasUsername && !isDirty && (
                              <div style={{ color: 'var(--green)', flexShrink: 0 }}>
                                <Check size={13} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: 'var(--text2)' }}>En attente d'assignation</span>
                          </div>
                        )}
                      </td>

                      {/* Statut */}
                      <td>
                        <span className={`badge ${acc.status}`}>
                          {STATUS_LABEL[acc.status]}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                        {acc.createdAt || '—'}
                      </td>

                      {/* Actions */}
                      <td>
                        <button className="btn sm danger icon" title="Supprimer" onClick={() => {
                          setConfirmId(acc.id)
                        }}>
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>
            {filtered.length} compte{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
            {filter !== 'all' || search ? ` · ` : ''}
            {(filter !== 'all' || company !== 'all' || search) && (
              <button onClick={() => { setFilter('all'); setCompany('all'); setSearch(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {confirmId && (
        <ConfirmModal
          message="Supprimer ce compte définitivement ?"
          onConfirm={() => { onDelete(confirmId); toast('Compte supprimé'); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
