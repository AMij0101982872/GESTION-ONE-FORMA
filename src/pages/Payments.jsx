import { useState, useRef } from 'react';
import { Check, Trash2, Upload, AlertCircle, ChevronDown, ChevronRight, Receipt } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from '../components/Toast';
import ReceiptModal from '../components/ReceiptModal';
import ConfirmModal from '../components/ConfirmModal';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const periodLabel = (ym) => { const [y, m] = ym.split('-'); return `${MONTHS_FR[parseInt(m) - 1]} ${y}`; };
const currentPeriod = () => new Date().toISOString().slice(0, 7);
const fcfa = (usd, rate, deduction = 0) => Math.round(usd * (1 - deduction / 100) * rate).toLocaleString('fr-FR') + ' FCFA';

const emptyForm = {
  accountId: '', taskName: '', totalHits: '', paidWords: '',
  timeSpent: '', qaScore: '1', pricePer1k: '10', totalPrice: '',
  period: currentPeriod(),
};

function extractLangPair(taskName) {
  const m = String(taskName || '').match(/([A-Z][a-z]+)To([A-Z][a-z]+)/);
  return m ? `${m[1]} → ${m[2]}` : null;
}

function matchAccount(accounts, val) {
  const v = val.toLowerCase();
  return accounts.find(a =>
    (a.username && a.username.toLowerCase() === v) ||
    (a.accid    && a.accid.toLowerCase()    === v)
  );
}

function num(val) {
  if (typeof val === 'number') return val;
  return parseFloat(String(val ?? '0').replace(/[$\s]/g, '').replace(',', '.')) || 0;
}

function findHeaderIdx(matrix, testFn) {
  const idx = matrix.findIndex(row => testFn(row.map(c => String(c || '').trim().toLowerCase())));
  return idx === -1 ? 0 : idx;
}

function rowsFromMatrix(matrix, accounts, fixedAccount = null) {
  if (!matrix.length) return [];

  // ── Format SOCIETE 1 : colonnes Task + Hits détectées ET compte pré-sélectionné ──
  const s1Idx = matrix.findIndex(row => {
    const cells = row.map(c => String(c || '').trim().toLowerCase());
    return cells.some(c => /^task/i.test(c)) && cells.some(c => /hit/i.test(c));
  });

  if (s1Idx !== -1 && fixedAccount) {
    const header       = matrix[s1Idx].map(c => String(c || '').trim().toLowerCase());
    const taskCol      = header.findIndex(h => /^task/i.test(h));
    const hitsCol      = header.findIndex(h => /hit/i.test(h));
    const paidWCol     = header.findIndex(h => /paid.word/i.test(h));
    const totalWCol    = header.findIndex(h => /total.word/i.test(h));
    const timeCol      = header.findIndex(h => /time/i.test(h));
    const qaCol        = header.findIndex(h => /qa|score/i.test(h));
    const price1kCol   = header.findIndex(h => /price.*1|per.*1/i.test(h));
    const totalPriceCol= header.findIndex(h => /total.price|total.*usd/i.test(h));

    console.log('Format S1 — headerIdx:', s1Idx, 'cols:', { taskCol, hitsCol, paidWCol, timeCol, qaCol, price1kCol, totalPriceCol });

    let lastTask = '';
    const results = [];
    matrix.slice(s1Idx + 1).forEach((row, i) => {
      const rawTask = String(row[taskCol] ?? '').trim();
      if (rawTask) {
        if (/^total/i.test(rawTask)) return; // ligne pied de tableau
        lastTask = rawTask;
      }
      if (!lastTask) return;
      const paidWords  = paidWCol  >= 0 ? num(row[paidWCol])   : (totalWCol >= 0 ? num(row[totalWCol]) : 0);
      const totalPrice = totalPriceCol >= 0 ? num(row[totalPriceCol]) : 0;
      // ignorer lignes entièrement vides (séparateurs)
      const totalHits = hitsCol >= 0 ? (parseInt(row[hitsCol]) || 0) : 0;
      if (!totalHits && !paidWords && !totalPrice && !rawTask) return;

      const timeSpent  = timeCol    >= 0 ? num(row[timeCol])    : 0;
      const qaRaw      = qaCol      >= 0 ? num(row[qaCol])      : 100;
      const qaScore    = qaRaw > 1 ? qaRaw / 100 : qaRaw;
      const pricePer1k = price1kCol >= 0 ? num(row[price1kCol]) : 10;
      console.log(`  S1 ligne ${s1Idx + 1 + i}: task="${lastTask}" hits=${totalHits} paidW=${paidWords} price=${totalPrice}`);
      results.push({ accountVal: fixedAccount.username || fixedAccount.email, taskName: lastTask, totalHits, timeSpent, qaScore, paidWords, pricePer1k, totalPrice, acc: fixedAccount });
    });
    return results;
  }

  // ── Format SOCIETE 3 : Username | Contractor ID | Taskgroup | Submitted Hits | % to pay | WC after discount | Price/1k | Total Price ──
  const s3Idx = matrix.findIndex(row => {
    const cells = row.map(c => String(c || '').trim().toLowerCase());
    return cells.some(c => /taskgroup/i.test(c)) && cells.some(c => /wc.+discount|wc after/i.test(c));
  });

  if (s3Idx !== -1) {
    const header        = matrix[s3Idx].map(c => String(c || '').trim().toLowerCase());
    const userCol       = header.findIndex(h => /^username$/i.test(h));
    const taskCol       = header.findIndex(h => /taskgroup/i.test(h));
    const hitsCol       = header.findIndex(h => /submitted.hit|^hits$/i.test(h));
    const paidWCol      = header.findIndex(h => /wc.+discount|wc after/i.test(h));
    const price1kCol    = header.findIndex(h => /price.*1000|per.*1000/i.test(h));
    const totalPriceCol = header.findIndex(h => /^total price$/i.test(h));

    console.log('Format S3 — headerIdx:', s3Idx, 'cols:', { userCol, taskCol, hitsCol, paidWCol, price1kCol, totalPriceCol });

    const results = [];
    matrix.slice(s3Idx + 1).forEach((row, i) => {
      const username = userCol >= 0 ? String(row[userCol] || '').trim() : '';
      const taskName = taskCol >= 0 ? String(row[taskCol] || '').trim() : '';

      if (!username || /^total/i.test(username)) return;

      const paidWords  = paidWCol      >= 0 ? num(row[paidWCol])      : 0;
      const pricePer1k = price1kCol    >= 0 ? num(row[price1kCol])    : 10;
      const totalPrice = totalPriceCol >= 0 ? num(row[totalPriceCol]) : parseFloat((paidWords / 1000 * pricePer1k).toFixed(5));
      const totalHits  = hitsCol       >= 0 ? (parseInt(row[hitsCol]) || 0) : 0;

      if (!paidWords && !totalPrice) return;

      const acc = matchAccount(accounts, username);
      console.log(`  S3 ligne ${s3Idx + 1 + i}: user="${username}" task="${taskName}" paidW=${paidWords} total=${totalPrice}`);
      results.push({ accountVal: username, taskName, totalHits, timeSpent: 0, qaScore: 1, paidWords, pricePer1k, totalPrice, acc });
    });
    return results;
  }

  // ── Format SOCIETE 2 (OneForma) : Email | Webapp | Username | Contractor ID | % to pay | WC after discount | Price/1k | Total Price ──
  const s2Idx = matrix.findIndex(row => {
    const cells = row.map(c => String(c || '').trim().toLowerCase());
    return cells.some(c => c === 'email') && cells.some(c => /wc.+discount|wc after/i.test(c));
  });

  if (s2Idx !== -1) {
    const header        = matrix[s2Idx].map(c => String(c || '').trim().toLowerCase());
    const emailCol      = header.findIndex(h => h === 'email');
    const webappCol     = header.findIndex(h => /webapp/i.test(h));
    const userCol       = header.findIndex(h => /^username$/i.test(h));
    const paidWCol      = header.findIndex(h => /wc.+discount|wc after/i.test(h));
    const price1kCol    = header.findIndex(h => /price.*1000|per.*1000/i.test(h));
    const totalPriceCol = header.findIndex(h => /^total price$/i.test(h));

    console.log('Format S2 — headerIdx:', s2Idx, 'cols:', { emailCol, webappCol, userCol, paidWCol, price1kCol, totalPriceCol });

    const results = [];
    matrix.slice(s2Idx + 1).forEach((row, i) => {
      const email    = String(row[emailCol] || '').trim();
      const username = userCol >= 0 ? String(row[userCol] || '').trim() : '';
      const taskName = webappCol >= 0 ? String(row[webappCol] || '').trim() : '';

      // Arrêter à la ligne TOTAL ou ligne vide
      if (!email || /^total/i.test(email)) return;

      const paidWords  = paidWCol      >= 0 ? num(row[paidWCol])      : 0;
      const pricePer1k = price1kCol    >= 0 ? num(row[price1kCol])    : 10;
      const totalPrice = totalPriceCol >= 0 ? num(row[totalPriceCol]) : parseFloat((paidWords / 1000 * pricePer1k).toFixed(5));

      // Ignorer lignes à 0 mots ET 0 total
      if (!paidWords && !totalPrice) return;

      const accountVal = username || email;
      // Chercher par username d'abord, puis par email
      let acc = username ? matchAccount(accounts, username) : null;
      if (!acc) acc = accounts.find(a => a.email && a.email.toLowerCase().trim() === email.toLowerCase().trim());

      console.log(`  S2 ligne ${s2Idx + 1 + i}: email="${email}" user="${username}" task="${taskName}" paidW=${paidWords} total=${totalPrice}`);
      results.push({ accountVal, taskName, totalHits: 0, timeSpent: 0, qaScore: 1, paidWords, pricePer1k, totalPrice, acc });
    });
    return results;
  }

  // ── Format OneForma (legacy) : colonnes Username + Discount ──
  const s2LegacyIdx = matrix.findIndex(row => {
    const cells = row.map(c => String(c || '').trim().toLowerCase());
    return cells.some(c => /user/i.test(c)) && cells.some(c => /discount/i.test(c));
  });

  if (s2LegacyIdx !== -1) {
    const header    = matrix[s2LegacyIdx].map(c => String(c || '').trim().toLowerCase());
    const userCol   = header.findIndex(h => /user/i.test(h));
    const discCol   = header.findIndex(h => /discount/i.test(h));
    const webappCol = header.findIndex(h => /webapp|app/i.test(h));
    const hitsCol   = header.findIndex(h => /hit|submit/i.test(h));

    console.log('Format S2-legacy — headerIdx:', s2LegacyIdx, 'cols:', { userCol, discCol, webappCol, hitsCol });

    let lastUser = '';
    const results = [];
    matrix.slice(s2LegacyIdx + 1).forEach(row => {
      const rawUser = String(row[userCol] || '').trim();
      if (rawUser) lastUser = rawUser;
      if (!lastUser) return;
      const taskName  = webappCol >= 0 ? String(row[webappCol] || '').trim() : '';
      const paidWords = num(row[discCol]);
      const totalHits = hitsCol >= 0 ? parseInt(row[hitsCol]) || 0 : 0;
      const acc = matchAccount(accounts, lastUser);
      results.push({ accountVal: lastUser, taskName, totalHits, timeSpent: 0, qaScore: 1, paidWords, pricePer1k: 10, totalPrice: 0, acc });
    });
    return results;
  }

  // ── Format standard ──
  const hIdx = findHeaderIdx(matrix, cells => cells.some(c => /user|webapp|account|translator/i.test(c)));
  const header = matrix[hIdx].map(c => String(c || '').trim().toLowerCase());
  const off = /translator/.test(header[0]) ? 1 : 0;
  return matrix.slice(hIdx + 1)
    .filter(row => { const f = String(row[off] || '').trim(); return f && !/^total/i.test(f); })
    .map(row => {
      const c = (i) => String(row[off + i] ?? '').trim();
      const accountVal = c(0);
      const taskName   = c(1);
      const totalHits  = parseInt(c(2))  || 0;
      const timeSpent  = num(c(4));
      const qaRaw      = num(c(5)) || 100;
      const qaScore    = qaRaw > 1 ? qaRaw / 100 : qaRaw;
      const paidWords  = parseInt(c(6)) || parseInt(c(3)) || 0;
      const pricePer1k = num(c(8)) || 10;
      const totalPrice = num(c(9));
      const acc        = matchAccount(accounts, accountVal);
      return { accountVal, taskName, totalHits, timeSpent, qaScore, paidWords, pricePer1k, totalPrice, acc };
    })
    .filter(r => r.accountVal && r.taskName);
}

export default function Payments({ payments, accounts, translators, companies, onAdd, onUpdate, onUpdateAccount, onMarkPaid, onMarkAllPaid, onDelete, onDeletePeriod, rate, deduction, onSetRate, onSetDeduction }) {
  const [form, setForm]           = useState(emptyForm);
  const [preview, setPreview]     = useState(null);
  const [importPeriod, setImportPeriod] = useState(currentPeriod());
  const [importCompany, setImportCompany] = useState('');
  const [importAccountId, setImportAccountId] = useState('');
  const [rateInput, setRateInput]           = useState(String(rate));
  const [deductionInput, setDeductionInput] = useState(String(deduction));
  const [openPeriods, setOpenPeriods] = useState({});
  const [rawCount, setRawCount]         = useState(0);
  const [receipt, setReceipt]           = useState(null);
  const [confirmId, setConfirmId]       = useState(null);
  const [confirmPeriod, setConfirmPeriod] = useState(null);
  const fileRef = useRef();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const togglePeriod = (p) => setOpenPeriods(s => ({ ...s, [p]: !s[p] }));

  const activeAccounts = accounts.filter(a => a.status === 'active');

  // Stats globales
  const totalPaid  = payments.filter(p => p.paid).reduce((s, p) => s + p.totalPrice, 0);
  const totalDue   = payments.filter(p => !p.paid).reduce((s, p) => s + p.totalPrice, 0);
  const totalWords = payments.reduce((s, p) => s + (p.paidWords || 0), 0);

  // Mois en cours
  const cp = currentPeriod();
  const monthPayments = payments.filter(p => (p.period || p.date?.slice(0,7)) === cp);
  const monthDue = monthPayments.filter(p => !p.paid).reduce((s, p) => s + p.totalPrice, 0);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      console.log('=== DEBUG EXCEL ===');
      console.log('Lignes brutes :', matrix.length);
      console.log('10 premières lignes :', matrix.slice(0, 10));
      const scopedAccounts = importCompany
        ? accounts.filter(a => a.company === importCompany)
        : accounts;
      const fixedAccount = importAccountId
        ? accounts.find(a => a.id === importAccountId) || null
        : null;
      const rows = rowsFromMatrix(matrix, scopedAccounts, fixedAccount);
      console.log('Lignes parsées :', rows.length);
      if (!rows.length) { toast(`Aucune ligne trouvée (${matrix.length} lignes brutes)`); return; }
      setRawCount(matrix.length);
      setPreview(rows);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const confirmImport = () => {
    const matched = preview.filter(r => r.acc);
    if (!matched.length) { toast('Aucune ligne reconnue'); return; }

    // Mettre à jour la paire de langue sur chaque compte (si pas encore définie)
    const seen = new Set();
    matched.forEach(r => {
      if (!seen.has(r.acc.id)) {
        seen.add(r.acc.id);
        const langPair = extractLangPair(r.taskName);
        if (langPair && !r.acc.languagePair) {
          onUpdateAccount(r.acc.id, { languagePair: langPair });
        }
      }
    });

    matched.forEach(r => {
      onAdd({
        accountId: r.acc.id, translatorId: r.acc.translatorId,
        taskName: r.taskName, totalHits: r.totalHits,
        paidWords: r.paidWords, timeSpent: r.timeSpent,
        qaScore: r.qaScore, pricePer1k: r.pricePer1k,
        totalPrice: r.totalPrice,
        period: importPeriod,
        date: importPeriod + '-01',
      });
    });
    toast(`${matched.length} ligne(s) importée(s) — ${periodLabel(importPeriod)} ✓`);
    setPreview(null);
    setOpenPeriods(s => ({ ...s, [importPeriod]: true }));
  };

  const submit = () => {
    const words = parseInt(form.paidWords);
    const price1k = parseFloat(form.pricePer1k) || 10;
    if (!form.accountId || !form.taskName || !words) { toast('Remplis les champs obligatoires'); return; }
    const acc = accounts.find(a => a.id === form.accountId);
    if (!acc) return;
    const totalPrice = form.totalPrice ? parseFloat(form.totalPrice) : parseFloat((words / 1000 * price1k).toFixed(2));
    onAdd({
      accountId: form.accountId, translatorId: acc.translatorId,
      taskName: form.taskName, totalHits: parseInt(form.totalHits) || 0,
      paidWords: words, timeSpent: parseFloat(form.timeSpent) || 0,
      qaScore: parseFloat(form.qaScore) || 1, pricePer1k: price1k,
      totalPrice, period: form.period, date: form.period + '-01',
    });
    setForm(emptyForm);
    toast('Ligne ajoutée ✓');
  };

  // Grouper par (période + société) → traducteur
  const byBlock = {}; // clé = "period||company"
  payments.forEach(p => {
    const period  = p.period || p.date?.slice(0, 7) || 'inconnu';
    const acc     = accounts.find(a => a.id === p.accountId);
    const company = acc?.company || 'Autre';
    const key     = `${period}||${company}`;
    const trKey   = p.translatorId || '__none__';
    if (!byBlock[key])        byBlock[key] = { period, company, byTr: {} };
    if (!byBlock[key].byTr[trKey]) byBlock[key].byTr[trKey] = { paid: 0, due: 0, rows: [] };
    if (p.paid) byBlock[key].byTr[trKey].paid += p.totalPrice;
    else        byBlock[key].byTr[trKey].due  += p.totalPrice;
    byBlock[key].byTr[trKey].rows.push(p);
  });
  // Trier : période desc, puis société asc
  const sortedBlocks = Object.keys(byBlock).sort((a, b) => {
    const [pa, ca] = a.split('||'); const [pb, cb] = b.split('||');
    return pb.localeCompare(pa) || ca.localeCompare(cb);
  });

  const CO_STYLE = {
    'SOCIETE 1': { background: '#eef2ff', color: '#4338ca', border: '1px solid #a5b4fc' },
    'SOCIETE 2': { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
    'SOCIETE 3': { background: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74' },
  };
  const coStyle = (name) => CO_STYLE[name] || { background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' };

  return (
    <div>
      <div className="page-header">
        <h2>Paiements</h2>
        <p>Suivi mensuel des paiements — importe le rapport Excel de la plateforme</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="fcfa-big">{fcfa(monthDue, rate, deduction)}</div>
          <div className="fcfa-sub">{monthDue.toFixed(2)} $ · Dû ce mois</div>
        </div>
        <div className="stat-card">
          <div className="fcfa-big" style={{ color: 'var(--green)' }}>{fcfa(totalPaid, rate, deduction)}</div>
          <div className="fcfa-sub">{totalPaid.toFixed(2)} $ · Total payé</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{totalWords.toLocaleString('fr-FR')}</div>
          <div className="stat-label">Mots traduits (total)</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text2)', width: 56 }}>1 $ =</span>
              <input
                type="number" value={rateInput}
                onChange={e => setRateInput(e.target.value)}
                onBlur={() => onSetRate(rateInput)}
                onKeyDown={e => e.key === 'Enter' && onSetRate(rateInput)}
                style={{ width: 70, fontWeight: 700, fontSize: 14, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'inherit' }}
              />
              <span style={{ fontSize: 11, color: 'var(--text2)' }}>FCFA</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text2)', width: 56 }}>Déduct.</span>
              <input
                type="number" value={deductionInput} min="0" max="100"
                onChange={e => setDeductionInput(e.target.value)}
                onBlur={() => onSetDeduction(deductionInput)}
                onKeyDown={e => e.key === 'Enter' && onSetDeduction(deductionInput)}
                style={{ width: 70, fontWeight: 700, fontSize: 14, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'inherit', color: 'var(--amber)' }}
              />
              <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 700 }}>%</span>
            </div>
          </div>
          <div className="stat-label" style={{ marginTop: 4 }}>
            Net traducteur : <strong>{(100 - deduction)}%</strong> × {rate} FCFA/$
          </div>
        </div>
      </div>

      {/* Import rapport */}
      <div className="card" style={{ borderColor: preview ? '#2980b9' : '#c0d9f0', background: '#f0f7ff' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2980b9' }}>
          <Upload size={16} /> Importer le rapport mensuel (.xlsx)
        </h3>

        {!preview ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }}>
                  Société
                </label>
                <select
                  value={importCompany}
                  onChange={e => setImportCompany(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, minWidth: 140 }}
                >
                  <option value=''>Toutes</option>
                  {(companies || []).map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              {importCompany && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }}>
                    Compte (si 1 seul fichier par compte)
                  </label>
                  <select
                    value={importAccountId}
                    onChange={e => setImportAccountId(e.target.value)}
                    style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, minWidth: 200 }}
                  >
                    <option value=''>Détection auto (multi-comptes)</option>
                    {accounts
                      .filter(a => a.company === importCompany)
                      .sort((a, b) => (a.username || a.email || '').localeCompare(b.username || b.email || ''))
                      .map(a => (
                        <option key={a.id} value={a.id}>
                          {a.username || a.email}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }}>
                  Mois concerné
                </label>
                <input
                  type="month" value={importPeriod}
                  onChange={e => setImportPeriod(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}
                />
              </div>
              <div style={{ alignSelf: 'flex-end' }}>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFile} />
                <button
                  className="btn primary"
                  onClick={() => { if (!importCompany) { toast('Sélectionne une société d\'abord'); return; } fileRef.current.click(); }}
                >
                  <Upload size={14} /> Choisir le fichier Excel
                </button>
              </div>
              {importCompany && importPeriod && (
                <div style={{ alignSelf: 'flex-end', fontSize: 12, color: '#2980b9', fontWeight: 600 }}>
                  {importCompany} · {periodLabel(importPeriod)}
                </div>
              )}
            </div>
            <p style={{ fontSize: 11, color: '#888' }}>
              Sélectionne la société dont tu importes le fichier — seuls ses comptes seront utilisés pour la correspondance.
            </p>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 8, fontSize: 12 }}>
              Rapport pour <strong>{periodLabel(importPeriod)}</strong> —{' '}
              <strong>{preview.length}</strong> lignes parsées sur <strong>{rawCount}</strong> brutes dans le fichier ·{' '}
              <strong style={{ color: '#27ae60' }}>{preview.filter(r => r.acc).length}</strong> reconnues,{' '}
              <span style={{ color: '#e74c3c' }}><strong>{preview.filter(r => !r.acc).length}</strong> inconnues</span>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Traducteur</th>
                    <th>Tâche</th>
                    <th>Mots</th>
                    <th>Total $</th>
                    <th>FCFA</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => {
                    const tr = r.acc ? translators.find(t => t.id === r.acc.translatorId) : null;
                    return (
                      <tr key={i} style={{ background: r.acc ? '#f0fff4' : '#fff8f0' }}>
                        <td><span className="mono">{r.accountVal}</span></td>
                        <td>
                          {tr ? <strong style={{ color: '#27ae60' }}>{tr.name}</strong>
                              : <span style={{ color: '#e74c3c', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Inconnu</span>}
                        </td>
                        <td style={{ fontSize: 11 }}>{r.taskName}</td>
                        <td className="text-right">{r.paidWords.toLocaleString()}</td>
                        <td className="text-right fw-bold">{r.totalPrice.toFixed(2)} $</td>
                        <td className="text-right"><span className="fcfa-pill">{fcfa(r.totalPrice, rate, deduction)}</span></td>
                        <td><span className={`badge ${r.acc ? 'active' : 'pending'}`}>{r.acc ? 'OK' : 'Inconnu'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {preview.filter(r => !r.acc).length > 0 && (
              <p style={{ fontSize: 11, color: '#e67e22', marginTop: 8 }}>
                Lignes inconnues : va dans Comptes et renseigne le username correspondant.
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setPreview(null)}>Annuler</button>
              <button className="btn primary" onClick={confirmImport} disabled={!preview.filter(r => r.acc).length}>
                <Check size={14} /> Importer {preview.filter(r => r.acc).length} ligne(s) — {periodLabel(importPeriod)}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Formulaire manuel */}
      <details>
        <summary style={{ cursor: 'pointer', padding: '10px 0', fontWeight: 600, color: '#555', fontSize: 13 }}>
          + Ajouter une ligne manuellement
        </summary>
        <div className="card" style={{ marginTop: 8 }}>
          <div className="row2">
            <div className="field">
              <label>Mois *</label>
              <input type="month" value={form.period} onChange={e => set('period', e.target.value)} />
            </div>
            <div className="field">
              <label>Compte *</label>
              {activeAccounts.length === 0 ? (
                <input disabled placeholder="Aucun compte actif" />
              ) : (
                <select value={form.accountId} onChange={e => set('accountId', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {activeAccounts.map(a => {
                    const tr = translators.find(t => t.id === a.translatorId);
                    return <option key={a.id} value={a.id}>[{tr?.name || '?'}] {a.username || a.accid || a.email}</option>;
                  })}
                </select>
              )}
            </div>
          </div>
          <div className="row2">
            <div className="field"><label>Nom de la tâche *</label><input value={form.taskName} onChange={e => set('taskName', e.target.value)} placeholder="HT_New_ArabicToRussian" /></div>
            <div className="field"><label>Mots payés *</label><input type="number" value={form.paidWords} onChange={e => set('paidWords', e.target.value)} /></div>
          </div>
          <div className="row4">
            <div className="field"><label>Total Hits</label><input type="number" value={form.totalHits} onChange={e => set('totalHits', e.target.value)} /></div>
            <div className="field"><label>Temps (hrs)</label><input type="number" step="0.01" value={form.timeSpent} onChange={e => set('timeSpent', e.target.value)} /></div>
            <div className="field"><label>Prix / 1k mots ($)</label><input type="number" step="0.01" value={form.pricePer1k} onChange={e => set('pricePer1k', e.target.value)} /></div>
            <div className="field"><label>Total $ (vide = auto)</label><input type="number" step="0.01" value={form.totalPrice} onChange={e => set('totalPrice', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn primary" onClick={submit}>Ajouter</button>
          </div>
        </div>
      </details>

      {/* Liste par période + société */}
      {sortedBlocks.length === 0 && (
        <div className="card"><div className="empty">Aucun paiement enregistré</div></div>
      )}

      {sortedBlocks.map(key => {
        const { period, company, byTr } = byBlock[key];
        const trData    = Object.values(byTr);
        const bDue      = trData.reduce((s, d) => s + d.due,  0);
        const bPaid     = trData.reduce((s, d) => s + d.paid, 0);
        const lineCount = trData.reduce((s, d) => s + d.rows.length, 0);
        const isOpen    = openPeriods[key] !== false && (period === cp || openPeriods[key]);
        const cs        = coStyle(company);

        return (
          <div key={key} className="card" style={{ borderLeft: `4px solid ${cs.color}` }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: isOpen ? '1rem' : 0 }}
              onClick={() => setOpenPeriods(s => ({ ...s, [key]: !isOpen }))}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <strong style={{ fontSize: 14 }}>{periodLabel(period)}</strong>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 10, ...cs }}>{company}</span>
                {period === cp && <span className="badge assigned" style={{ fontSize: 10 }}>Mois en cours</span>}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, alignItems: 'center' }}>
                {bPaid > 0 && <span className="text-green fw-bold">{bPaid.toFixed(2)} $ payé</span>}
                {bDue > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span className="fcfa-pill">{fcfa(bDue, rate, deduction)}</span>
                    <span style={{ color: 'var(--text2)', fontSize: 11 }}>{bDue.toFixed(2)} $ dû</span>
                  </span>
                )}
                <span style={{ color: '#aaa', fontSize: 11 }}>{lineCount} ligne(s)</span>
                <button
                  className="btn sm danger icon"
                  title={`Supprimer ${periodLabel(period)} — ${company}`}
                  onClick={e => { e.stopPropagation(); setConfirmPeriod(key); }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>

            {isOpen && translators.filter(t => byTr[t.id]).map(t => {
              const d = byTr[t.id];
              return (
                <div key={t.id} style={{ marginBottom: '1rem' }}>
                  <div className="card-header" style={{ background: 'var(--surface2)', padding: '8px 12px', borderRadius: 8, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 13 }}>{t.name}</strong>
                      <span style={{ fontSize: 11, color: 'var(--text2)' }}>{d.rows.length} tâche(s)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {d.paid > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span className="fcfa-pill" style={{ color: 'var(--green)', background: 'var(--green-bg)', borderColor: 'var(--green-border)' }}>{fcfa(d.paid, rate, deduction)}</span>
                          <span style={{ fontSize: 11, color: 'var(--text2)' }}>{d.paid.toFixed(2)} $ payé</span>
                        </span>
                      )}
                      {d.due > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span className="fcfa-pill">{fcfa(d.due, rate, deduction)}</span>
                          <span style={{ fontSize: 11, color: 'var(--text2)' }}>{d.due.toFixed(2)} $ dû</span>
                        </span>
                      )}
                      {d.due > 0 && (
                        <button
                          className="btn sm green"
                          onClick={() => { const ids = d.rows.filter(p => !p.paid).map(p => p.id); onMarkAllPaid(ids); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}
                        >
                          <Check size={11} /> Tout payer
                        </button>
                      )}
                      <button
                        className="btn sm"
                        onClick={() => setReceipt({ translator: t, rows: d.rows, period })}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}
                      >
                        <Receipt size={11} /> Reçu image
                      </button>
                    </div>
                  </div>
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Username</th><th>Tâche</th><th>Hits</th><th>Mots</th>
                          <th>Temps</th><th>QA</th><th>$/1k</th><th>Total $</th>
                          <th>FCFA</th><th>Statut</th><th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.rows.map(p => {
                          const acc = accounts.find(a => a.id === p.accountId);
                          return (
                            <tr key={p.id}>
                              <td><span className="mono">{acc?.username || acc?.accid || '—'}</span></td>
                              <td style={{ fontSize: 11 }}>{p.taskName}</td>
                              <td className="text-right">{p.totalHits}</td>
                              <td className="text-right">{(p.paidWords || 0).toLocaleString()}</td>
                              <td className="text-right">{p.timeSpent}h</td>
                              <td className="text-right">{((p.qaScore || 1) * 100).toFixed(0)}%</td>
                              <td className="text-right">
                                <input
                                  type="number" step="0.01" min="0"
                                  defaultValue={(p.pricePer1k || 10).toFixed(2)}
                                  onBlur={e => {
                                    const val = parseFloat(e.target.value) || 10;
                                    const newTotal = parseFloat(((p.paidWords || 0) / 1000 * val).toFixed(5));
                                    onUpdate(p.id, { pricePer1k: val, totalPrice: newTotal });
                                  }}
                                  onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                                  style={{ width: 60, textAlign: 'right', border: '1px solid transparent', borderRadius: 4, padding: '2px 4px', fontSize: 'inherit', fontFamily: 'inherit', background: 'transparent', cursor: 'text' }}
                                  onFocus={e => e.target.style.borderColor = 'var(--blue, #2980b9)'}
                                  onBlurCapture={e => e.target.style.borderColor = 'transparent'}
                                />
                              </td>
                              <td className="text-right" style={{ fontSize: 11, color: 'var(--text2)' }}>{p.totalPrice.toFixed(2)} $</td>
                              <td className="text-right"><span className="fcfa-pill">{fcfa(p.totalPrice, rate, deduction)}</span></td>
                              <td><span className={`badge ${p.paid ? 'paid' : 'unpaid'}`}>{p.paid ? 'Payé' : 'En attente'}</span></td>
                              <td>
                                <div className="btn-group">
                                  {!p.paid && (
                                    <button className="btn sm green" onClick={() => { onMarkPaid(p.id); toast('Marqué payé ✓'); }}>
                                      <Check size={11} /> Payé
                                    </button>
                                  )}
                                  <button className="btn sm danger icon" onClick={() => setConfirmId(p.id)}>
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {receipt && (
        <ReceiptModal
          translator={receipt.translator}
          rows={receipt.rows}
          period={receipt.period}
          rate={rate}
          deduction={deduction}
          accounts={accounts}
          onClose={() => setReceipt(null)}
        />
      )}

      {confirmId && (
        <ConfirmModal
          message="Supprimer cette ligne de paiement ?"
          onConfirm={async () => { await onDelete(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {confirmPeriod && (() => {
        const [p, co] = confirmPeriod.split('||');
        return (
          <ConfirmModal
            message={`Supprimer tous les paiements de ${periodLabel(p)} — ${co} ?`}
            onConfirm={async () => { await onDeletePeriod(p, co); setConfirmPeriod(null); }}
            onCancel={() => setConfirmPeriod(null)}
          />
        );
      })()}
    </div>
  );
}
