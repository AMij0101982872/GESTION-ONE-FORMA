import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AlertTriangle, TrendingUp, Users, LayoutGrid, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
const periodLabel = (ym) => { const [y, m] = ym.split('-'); return `${MONTHS_FR[parseInt(m)-1]} ${y.slice(2)}`; };
const fcfa = (usd, rate, deduction = 0) => Math.round(usd * (1 - deduction / 100) * rate).toLocaleString('fr-FR') + ' FCFA';

const PIE_COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2'];

function KpiCard({ label, value, sub, color, icon: Icon, trend }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>
            {label}
          </div>
          <div className="stat-num" style={{ color: color || 'var(--text)' }}>{value}</div>
          {sub && <div className="stat-label" style={{ marginTop: 5 }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} color="var(--text2)" />
          </div>
        )}
      </div>
      {trend != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 11, fontWeight: 600, color: trend >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}% vs mois dernier
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label, rate }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: 12 }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <span style={{ color: p.color, fontWeight: 600 }}>
            {p.name} : {typeof p.value === 'number' && p.name?.includes('$') ? `$${p.value.toFixed(2)}` : p.value?.toLocaleString('fr-FR')}
          </span>
          {rate && p.name?.includes('$') && p.value > 0 && (
            <span className="fcfa-pill" style={{ marginLeft: 8, fontSize: 11 }}>{fcfa(p.value, rate, deduction)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ accounts, translators, payments, rate, deduction = 0, onNavigate }) {
  const [chartMode, setChartMode] = useState('revenue'); // revenue | words

  const currentPeriod = new Date().toISOString().slice(0, 7);

  // Mois en cours
  const monthPayments = payments.filter(p => (p.period || p.date?.slice(0,7)) === currentPeriod);
  const monthDue      = monthPayments.filter(p => !p.paid).reduce((s,p) => s + p.totalPrice, 0);
  const monthWords    = monthPayments.reduce((s,p) => s + (p.paidWords||0), 0);
  const monthPaid     = monthPayments.filter(p => p.paid).reduce((s,p) => s + p.totalPrice, 0);

  // Mois précédent (pour trend)
  const prevDate = new Date(); prevDate.setMonth(prevDate.getMonth() - 1);
  const prevPeriod = prevDate.toISOString().slice(0, 7);
  const prevMonthDue = payments.filter(p => (p.period||p.date?.slice(0,7)) === prevPeriod && !p.paid).reduce((s,p) => s + p.totalPrice, 0);
  const dueTrend = prevMonthDue > 0 ? Math.round(((monthDue - prevMonthDue) / prevMonthDue) * 100) : null;

  // Alertes
  const noUsername  = accounts.filter(a => (a.status==='assigned'||a.status==='active') && !a.username);
  const unassigned  = accounts.filter(a => a.status==='pending');
  const unpaidCount = payments.filter(p => !p.paid).length;
  const totalDue    = payments.filter(p => !p.paid).reduce((s,p) => s + p.totalPrice, 0);

  // Données graphique mensuel — 6 derniers mois
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return d.toISOString().slice(0, 7);
  });
  const monthlyData = last6.map(period => {
    const mp = payments.filter(p => (p.period||p.date?.slice(0,7)) === period);
    return {
      name: periodLabel(period),
      'Payé ($)': parseFloat(mp.filter(p=>p.paid).reduce((s,p)=>s+p.totalPrice,0).toFixed(2)),
      'Dû ($)':   parseFloat(mp.filter(p=>!p.paid).reduce((s,p)=>s+p.totalPrice,0).toFixed(2)),
      'Mots':     mp.reduce((s,p)=>s+(p.paidWords||0),0),
    };
  });

  // Répartition par traducteur (pie)
  const pieData = translators.map((t, i) => {
    const words = payments.filter(p=>p.translatorId===t.id).reduce((s,p)=>s+(p.paidWords||0),0);
    return { name: t.name.split(' ')[0], value: words, color: PIE_COLORS[i % PIE_COLORS.length] };
  }).filter(d => d.value > 0);

  // Top traducteurs
  const trStats = translators.map(t => ({
    ...t,
    accs:  accounts.filter(a=>a.translatorId===t.id).length,
    words: payments.filter(p=>p.translatorId===t.id).reduce((s,p)=>s+(p.paidWords||0),0),
    due:   payments.filter(p=>p.translatorId===t.id&&!p.paid).reduce((s,p)=>s+p.totalPrice,0),
    paid:  payments.filter(p=>p.translatorId===t.id&&p.paid).reduce((s,p)=>s+p.totalPrice,0),
  })).sort((a,b) => b.words - a.words);

  const maxWords = Math.max(...trStats.map(t => t.words), 1);

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Tableau de bord</h2>
          <p>{new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-row">
        <KpiCard label="Traducteurs" value={translators.length} sub={`${accounts.filter(a=>a.status==='active').length} comptes actifs`} icon={Users} />
        <KpiCard label="À payer ce mois" value={fcfa(monthDue, rate, deduction)} sub={`$${monthDue.toFixed(2)}`} color="var(--amber)" icon={CreditCard} trend={dueTrend} />
        <KpiCard label="Mots ce mois" value={monthWords.toLocaleString('fr-FR')} sub={`$${monthPaid.toFixed(2)} encaissé`} icon={TrendingUp} />
        <KpiCard label="Comptes" value={accounts.length} sub={`${unassigned.length} en attente · ${noUsername.length} sans username`} icon={LayoutGrid} />
      </div>

      {/* Alertes */}
      {(unassigned.length > 0 || noUsername.length > 0 || unpaidCount > 0) && (
        <div className="card" style={{ borderColor: 'var(--amber-border)', background: 'var(--amber-bg)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={14} color="var(--amber)" />
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--amber)' }}>Actions requises</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {unassigned.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}><strong>{unassigned.length}</strong> compte(s) non assigné(s)</span>
                <button className="btn sm" onClick={() => onNavigate('accounts')}>Voir</button>
              </div>
            )}
            {noUsername.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}><strong>{noUsername.length}</strong> compte(s) sans username</span>
                <button className="btn sm" onClick={() => onNavigate('accounts')}>Renseigner</button>
              </div>
            )}
            {unpaidCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}><strong>{unpaidCount}</strong> paiement(s) en attente — <strong style={{ color: 'var(--amber)' }}>{totalDue.toFixed(2)} $</strong></span>
                <button className="btn sm" onClick={() => onNavigate('payments')}>Voir</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Graphiques ligne 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1rem', marginBottom: '1rem' }}>

        {/* Graphique mensuel */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ marginBottom: 0 }}>
              <TrendingUp size={14} color="var(--accent)" />
              Activité mensuelle
            </h3>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['revenue','Revenus'], ['words','Mots']].map(([k, l]) => (
                <button key={k} className="btn sm" onClick={() => setChartMode(k)}
                  style={{ background: chartMode===k ? 'var(--accent)' : 'var(--surface2)', color: chartMode===k ? '#fff' : 'var(--text2)', borderColor: chartMode===k ? 'var(--accent)' : 'var(--border)' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            {chartMode === 'revenue' ? (
              <BarChart data={monthlyData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip rate={rate} />} cursor={{ fill: 'var(--surface2)' }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="Payé ($)" fill="#16a34a" radius={[4,4,0,0]} />
                <Bar dataKey="Dû ($)"   fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            ) : (
              <BarChart data={monthlyData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface2)' }} />
                <Bar dataKey="Mots" fill="#2563eb" radius={[4,4,0,0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Pie chart répartition */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3>
            <Users size={14} color="var(--accent)" />
            Mots par traducteur
          </h3>
          {pieData.length === 0 ? (
            <div className="empty" style={{ padding: '40px 0' }}>Aucune donnée</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                    dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v.toLocaleString('fr-FR') + ' mots', '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text2)' }}>{d.value.toLocaleString('fr-FR')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Graphiques ligne 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Classement traducteurs */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3>
            <TrendingUp size={14} color="var(--accent)" />
            Classement traducteurs
          </h3>
          {trStats.length === 0 ? (
            <div className="empty" style={{ padding: '30px 0' }}>Aucun traducteur</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {trStats.map((t, i) => (
                <div key={t.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: i < 3 ? ['#fbbf24','#94a3b8','#cd7c2e'][i] : 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--text2)' }}>{t.accs} compte{t.accs > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11 }}>
                      <span style={{ fontWeight: 700 }}>{t.words.toLocaleString('fr-FR')}</span>
                      <span style={{ color: 'var(--text2)' }}> mots</span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: PIE_COLORS[i % PIE_COLORS.length], borderRadius: 3, width: `${(t.words / maxWords) * 100}%`, transition: 'width .4s' }} />
                  </div>
                  {(t.paid > 0 || t.due > 0) && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                      {t.paid > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="fcfa-pill" style={{ color: 'var(--green)', background: 'var(--green-bg)', borderColor: 'var(--green-border)', fontSize: 11 }}>{fcfa(t.paid, rate, deduction)}</span>
                          <span style={{ fontSize: 10, color: 'var(--text2)' }}>payé</span>
                        </span>
                      )}
                      {t.due > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="fcfa-pill" style={{ fontSize: 11 }}>{fcfa(t.due, rate, deduction)}</span>
                          <span style={{ fontSize: 10, color: 'var(--text2)' }}>dû</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Évolution ligne (paiements cumulés) */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3>
            <CreditCard size={14} color="var(--accent)" />
            Paiements en attente par mois
          </h3>
          {monthlyData.every(d => d['Dû ($)'] === 0) ? (
            <div className="empty" style={{ padding: '30px 0' }}>Tout est à jour ✓</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip rate={rate} />} />
                <Line dataKey="Dû ($)" stroke="#d97706" strokeWidth={2} dot={{ r: 4, fill: '#d97706', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line dataKey="Payé ($)" stroke="#16a34a" strokeWidth={2} dot={{ r: 4, fill: '#16a34a', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}
