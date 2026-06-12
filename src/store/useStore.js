import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../components/Toast';

const defaultState = {
  translators: [],
  accounts:    [],
  payments:    [],
  companies:   [],
  rate:        500,
  deduction:   5,
  loading:     true,
};

/* ── field mappers DB ↔ App ── */
const toApp = (row) => {
  if (!row) return row;
  const { translator_id, account_id, created_at, ...rest } = row;
  return {
    ...rest,
    ...(translator_id !== undefined && { translatorId: translator_id }),
    ...(account_id    !== undefined && { accountId:    account_id    }),
    ...(created_at    !== undefined && { createdAt:    created_at    }),
  };
};

const toDB = (obj) => {
  const { translatorId, accountId, createdAt, ...rest } = obj;
  return {
    ...rest,
    ...(translatorId !== undefined && { translator_id: translatorId ?? null }),
    ...(accountId    !== undefined && { account_id:    accountId    ?? null }),
    ...(createdAt    !== undefined && { created_at:    createdAt            }),
  };
};

const err = (label, error) => {
  console.error(label, error);
  toast(`Erreur : ${error?.message || 'opération échouée'}`);
};

export function useStore() {
  const [state, setState] = useState(defaultState);

  /* ── initial load ── */
  useEffect(() => {
    async function load() {
      try {
        const [t, a, p, c, s] = await Promise.all([
          supabase.from('translators').select('*').order('id'),
          supabase.from('accounts').select('*').order('id'),
          supabase.from('payments').select('*').order('id'),
          supabase.from('companies').select('*').order('id'),
          supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
        ]);
        if (t.error) err('load translators', t.error);
        if (a.error) err('load accounts', a.error);
        if (p.error) err('load payments', p.error);
        if (c.error) err('load companies', c.error);
        setState({
          translators: t.data || [],
          accounts:    (a.data || []).map(toApp),
          payments:    (p.data || []).map(toApp),
          companies:   c.data || [],
          rate:        s.data?.rate      ?? 500,
          deduction:   s.data?.deduction ?? 5,
          loading:     false,
        });
      } catch (e) {
        console.error('load failed', e);
        setState(s => ({ ...s, loading: false }));
      }
    }
    load();
  }, []);

  /* ── translators ── */
  const addTranslator = async (tr) => {
    const row = { id: 'tr_' + Date.now(), ...tr };
    const { error } = await supabase.from('translators').insert(row);
    if (error) { err('addTranslator', error); return; }
    setState(s => ({ ...s, translators: [...s.translators, row] }));
  };

  const updateTranslator = async (id, data) => {
    const { error } = await supabase.from('translators').update(data).eq('id', id);
    if (error) { err('updateTranslator', error); return; }
    setState(s => ({ ...s, translators: s.translators.map(t => t.id === id ? { ...t, ...data } : t) }));
  };

  const deleteTranslator = async (id) => {
    const { error } = await supabase.from('translators').delete().eq('id', id);
    if (error) { err('deleteTranslator', error); return; }
    await supabase.from('accounts')
      .update({ translator_id: null, status: 'pending' })
      .eq('translator_id', id);
    setState(s => ({
      ...s,
      translators: s.translators.filter(t => t.id !== id),
      accounts:    s.accounts.map(a => a.translatorId === id ? { ...a, translatorId: null, status: 'pending' } : a),
    }));
  };

  /* ── accounts ── */
  const addAccount = async (acc) => {
    const appRow = {
      id:          'acc_' + Date.now(),
      username:    '',
      status:      acc.translatorId ? 'assigned' : 'pending',
      createdAt:   new Date().toLocaleDateString('fr-FR'),
      ...acc,
      translatorId: acc.translatorId || null,
    };
    const { error } = await supabase.from('accounts').insert(toDB(appRow));
    if (error) { err('addAccount', error); return; }
    setState(s => ({ ...s, accounts: [...s.accounts, appRow] }));
  };

  const updateAccount = async (id, data) => {
    const { error } = await supabase.from('accounts').update(toDB(data)).eq('id', id);
    if (error) { err('updateAccount', error); return; }
    setState(s => ({ ...s, accounts: s.accounts.map(a => a.id === id ? { ...a, ...data } : a) }));
  };

  const deleteAccount = async (id) => {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) { err('deleteAccount', error); return; }
    setState(s => ({
      ...s,
      accounts: s.accounts.filter(a => a.id !== id),
      payments: s.payments.filter(p => p.accountId !== id),
    }));
  };

  /* ── payments ── */
  const addPayment = async (pay) => {
    const appRow = { id: 'pay_' + Date.now(), paid: false, ...pay };
    const { error } = await supabase.from('payments').insert(toDB(appRow));
    if (error) { err('addPayment', error); return; }
    setState(s => ({ ...s, payments: [...s.payments, appRow] }));
  };

  const markPaid = async (id) => {
    const { error } = await supabase.from('payments').update({ paid: true }).eq('id', id);
    if (error) { err('markPaid', error); return; }
    setState(s => ({ ...s, payments: s.payments.map(p => p.id === id ? { ...p, paid: true } : p) }));
  };

  const deletePayment = async (id) => {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) { err('deletePayment', error); return; }
    setState(s => ({ ...s, payments: s.payments.filter(p => p.id !== id) }));
  };

  /* ── companies ── */
  const addCompany = async (c) => {
    const row = { id: 'co_' + Date.now(), ...c };
    const { error } = await supabase.from('companies').insert(row);
    if (error) { err('addCompany', error); return; }
    setState(s => ({ ...s, companies: [...s.companies, row] }));
  };

  const updateCompany = async (id, d) => {
    const { error } = await supabase.from('companies').update(d).eq('id', id);
    if (error) { err('updateCompany', error); return; }
    setState(s => ({ ...s, companies: s.companies.map(c => c.id === id ? { ...c, ...d } : c) }));
  };

  const deleteCompany = async (id) => {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) { err('deleteCompany', error); return; }
    setState(s => ({ ...s, companies: s.companies.filter(c => c.id !== id) }));
  };

  /* ── settings ── */
  const setRate = async (r) => {
    const val = parseFloat(r) || 500;
    await supabase.from('settings').update({ rate: val }).eq('id', 1);
    setState(s => ({ ...s, rate: val }));
  };

  const setDeduction = async (d) => {
    const val = parseFloat(d) ?? 5;
    await supabase.from('settings').update({ deduction: val }).eq('id', 1);
    setState(s => ({ ...s, deduction: val }));
  };

  return {
    ...state,
    addTranslator, updateTranslator, deleteTranslator,
    addAccount, updateAccount, deleteAccount,
    addPayment, markPaid, deletePayment,
    addCompany, updateCompany, deleteCompany,
    setRate, setDeduction,
  };
}
