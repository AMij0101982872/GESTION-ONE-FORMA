import { useState } from 'react';
import { PlusCircle, Users, CreditCard, LayoutGrid, LayoutDashboard, Building2 } from 'lucide-react';
import { useStore } from './store/useStore';
import { Toast } from './components/Toast';
import Dashboard   from './pages/Dashboard';
import NewAccount  from './pages/NewAccount';
import Translators from './pages/Translators';
import Accounts    from './pages/Accounts';
import Payments    from './pages/Payments';
import Companies   from './pages/Companies';
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

export default function App() {
  const [page, setPage] = useState('dashboard');
  const store = useStore();

  const pages = {
    dashboard:   <Dashboard accounts={store.accounts} translators={store.translators} payments={store.payments} rate={store.rate} deduction={store.deduction} onNavigate={setPage} />,
    new:         <NewAccount translators={store.translators} accounts={store.accounts} companies={store.companies} onAdd={store.addAccount} />,
    companies:   <Companies companies={store.companies} accounts={store.accounts} translators={store.translators} onAdd={store.addCompany} onUpdate={store.updateCompany} onDelete={store.deleteCompany} />,
    translators: <Translators translators={store.translators} accounts={store.accounts} payments={store.payments} onAdd={store.addTranslator} onUpdate={store.updateTranslator} onDelete={store.deleteTranslator} />,
    accounts:    <Accounts accounts={store.accounts} translators={store.translators} onUpdate={store.updateAccount} onDelete={store.deleteAccount} />,
    payments:    <Payments payments={store.payments} accounts={store.accounts} translators={store.translators} onAdd={store.addPayment} onMarkPaid={store.markPaid} onDelete={store.deletePayment} rate={store.rate} deduction={store.deduction} onSetRate={store.setRate} onSetDeduction={store.setDeduction} />,
  };

  if (store.loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, background: '#111827', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>B</span>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: 13, fontWeight: 600 }}>Connexion à la base de données…</p>
    </div>
  );

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

        <div className="sidebar-bottom">
          <p>Supabase · Cloud</p>
        </div>
      </aside>

      <main className="main-content">{pages[page]}</main>
      <Toast />
    </div>
  );
}
