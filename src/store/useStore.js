import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'tam_v1';

const defaultState = {
  translators: [],
  accounts: [],
  payments: [],
  companies: [],
  rate: 500,
  deduction: 5,
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
  } catch {
    return defaultState;
  }
}

export function useStore() {
  const [state, setState] = useState(loadFromStorage);

  const update = useCallback((fn) => {
    setState(prev => {
      const next = fn(prev);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Translators
  const addTranslator = (tr) => update(s => ({ ...s, translators: [...s.translators, { id: 'tr_' + Date.now(), ...tr }] }));
  const updateTranslator = (id, data) => update(s => ({ ...s, translators: s.translators.map(t => t.id === id ? { ...t, ...data } : t) }));
  const deleteTranslator = (id) => update(s => ({
    ...s,
    translators: s.translators.filter(t => t.id !== id),
    accounts: s.accounts.map(a => a.translatorId === id ? { ...a, translatorId: null, status: 'pending' } : a),
  }));

  // Accounts
  const addAccount = (acc) => update(s => ({ ...s, accounts: [...s.accounts, { id: 'acc_' + Date.now(), username: '', status: acc.translatorId ? 'assigned' : 'pending', createdAt: new Date().toLocaleDateString('fr-FR'), ...acc }] }));
  const updateAccount = (id, data) => update(s => ({ ...s, accounts: s.accounts.map(a => a.id === id ? { ...a, ...data } : a) }));
  const deleteAccount = (id) => update(s => ({
    ...s,
    accounts: s.accounts.filter(a => a.id !== id),
    payments: s.payments.filter(p => p.accountId !== id),
  }));

  // Payments
  const addPayment = (pay) => update(s => ({ ...s, payments: [...s.payments, { id: 'pay_' + Date.now(), paid: false, ...pay }] }));
  const markPaid = (id) => update(s => ({ ...s, payments: s.payments.map(p => p.id === id ? { ...p, paid: true } : p) }));
  const deletePayment = (id) => update(s => ({ ...s, payments: s.payments.filter(p => p.id !== id) }));

  // Companies
  const addCompany    = (c)     => update(s => ({ ...s, companies: [...s.companies, { id: 'co_' + Date.now(), ...c }] }));
  const updateCompany = (id, d) => update(s => ({ ...s, companies: s.companies.map(c => c.id === id ? { ...c, ...d } : c) }));
  const deleteCompany = (id)    => update(s => ({ ...s, companies: s.companies.filter(c => c.id !== id) }));

  // Rate & deduction
  const setRate       = (r) => update(s => ({ ...s, rate:      parseFloat(r) || 500 }));
  const setDeduction  = (d) => update(s => ({ ...s, deduction: parseFloat(d) ?? 5  }));

  return {
    ...state,
    addTranslator, updateTranslator, deleteTranslator,
    addAccount, updateAccount, deleteAccount,
    addPayment, markPaid, deletePayment,
    addCompany, updateCompany, deleteCompany,
    setRate, setDeduction,
  };
}
