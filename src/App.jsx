import { useState, useEffect } from 'react';
import { PlusCircle, Users, CreditCard, LayoutGrid, LayoutDashboard, Building2, LogOut } from 'lucide-react';
import { useStore } from './store/useStore';
import { Toast } from './components/Toast';
import { supabase } from './lib/supabase';
import Dashboard   from './pages/Dashboard';
import NewAccount  from './pages/NewAccount';
import Translators from './pages/Translators';
import Accounts    from './pages/Accounts';
import Payments    from './pages/Payments';
import Companies   from './pages/Companies';
import Login       from './pages/Login';
import './index.css';

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { id: 'dashboard',   label: 'Vue d\'ensemble', Icon: LayoutDashboard },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { id: 'new',         label: 'Nouveau compte', Icon: PlusCircle  },
      { id: 'translators', label: 'Traducteurs',     Icon: Users       },
      { id: 'accounts',    label: 'Comptes',         Icon: LayoutGrid  },
      { id: 'companies',   label: 'Sociétés',        Icon: Building2   },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'payments', label: 'Paiements', Icon: CreditCard },
    ],
  },
];

const LoadingScreen = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 12 }}>
    <div style={{ width: 36, height: 36, background: '#111827', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>B</span>
    </div>
    <p style={{ color: 'var(--text2)', fontSize: 13, fontWeight: 600 }}>Connexion à la base de données…</p>
  </div>
);

/* ── App principale — useStore monté UNIQUEMENT après session confirmée ── */
function MainApp({ session }) {
  const [page, setPage] = useState('dashboard');
  const store = useStore();

  const logout = () => supabase.auth.signOut();

  if (store.loading) return <LoadingScreen />;

  const pages = {
    dashboard:   <Dashboard accounts={store.accounts} translators={store.translators} payments={store.payments} rate={store.rate} deduction={store.deduction} onNavigate={setPage} />,
    new:         <NewAccount translators={store.translators} accounts={store.accounts} companies={store.companies} onAdd={store.addAccount} />,
    companies:   <Companies companies={store.companies} accounts={store.accounts} translators={store.translators} onAdd={store.addCompany} onUpdate={store.updateCompany} onDelete={store.deleteCompany} />,
    translators: <Translators translators={store.translators} accounts={store.accounts} payments={store.payments} onAdd={store.addTranslator} onUpdate={store.updateTranslator} onDelete={store.deleteTranslator} />,
    accounts:    <Accounts accounts={store.accounts} translators={store.translators} companies={store.companies} onAdd={store.addAccount} onUpdate={store.updateAccount} onDelete={store.deleteAccount} />,
    payments:    <Payments payments={store.payments} accounts={store.accounts} translators={store.translators} onAdd={store.addPayment} onMarkPaid={store.markPaid} onDelete={store.deletePayment} rate={store.rate} deduction={store.deduction} onSetRate={store.setRate} onSetDeduction={store.setDeduction} />,
  };

  const pendingAccounts = store.accounts.filter(a => a.status === 'pending').length;
  const pendingPayments = store.payments.filter(p => !p.paid).length;
  const badges = { accounts: pendingAccounts || null, payments: pendingPayments || null };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ width: 30, height: 30, background: '#111827', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>B</span>
          </div>
          <div>
            <h1>BST</h1>
            <p>BAH SERVICES TECH</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={`nav-item ${page === id ? 'active' : ''}`}
                  onClick={() => setPage(id)}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                  {badges[id] && (
                    <span style={{
                      marginLeft: 'auto',
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: 10,
                      padding: '1px 7px',
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1.6,
                    }}>
                      {badges[id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.user.email}
          </div>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 8, padding: '7px 10px',
              fontSize: 12, fontWeight: 600,
              color: 'var(--text2)', cursor: 'pointer',
              fontFamily: 'inherit', width: '100%',
              transition: 'all .12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
          >
            <LogOut size={13} /> Déconnexion
          </button>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--text3)' }}>Supabase · Cloud</p>
        </div>
      </aside>

      <main className="main-content">{pages[page]}</main>
      <Toast />
    </div>
  );
}

/* ── Point d'entrée — gère uniquement l'auth ── */
export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <><LoadingScreen /><Toast /></>;
  if (!session)              return <><Login /><Toast /></>;
  return <MainApp session={session} />;
}
