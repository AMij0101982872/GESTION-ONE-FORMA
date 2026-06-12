import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { X, Download, ImageIcon } from 'lucide-react';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const periodLabel = (ym) => { const [y, m] = ym.split('-'); return `${MONTHS_FR[parseInt(m)-1]} ${y}`; };
const fcfa  = (usd, rate, deduction = 0) => Math.round(usd * (1 - deduction / 100) * rate).toLocaleString('fr-FR') + ' FCFA';
const today = () => { const d = new Date(); return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`; };
const receiptId = (period, name) => 'BST-' + period + '-' + name.slice(0,3).toUpperCase().replace(/\s/g,'');

function ReceiptCard({ translator, rows, period, rate, deduction = 0, accounts }) {
  const totalAmt   = rows.reduce((s, p) => s + p.totalPrice, 0);
  const paid       = rows.filter(p => p.paid).reduce((s, p) => s + p.totalPrice, 0);
  const due        = rows.filter(p => !p.paid).reduce((s, p) => s + p.totalPrice, 0);
  const totalWords = rows.reduce((s, p) => s + (p.paidWords || 0), 0);
  const allPaid    = due === 0;
  const refNum     = receiptId(period, translator.name);

  /* palette douce et professionnelle */
  const C = {
    navy:      '#1e3a5f',   /* header principal */
    navySoft:  '#2c4d7a',   /* variant plus clair */
    gold:      '#b8860b',   /* FCFA — doré sobre */
    goldBg:    '#fef9ec',   /* fond dorée très pâle */
    goldBorder:'#e8d5a0',   /* bordure dorée douce */
    green:     '#2e7d52',
    greenBg:   '#f0faf4',
    greenBorder:'#a8d5b8',
    border:    '#dde3ea',   /* bordure générale */
    bg2:       '#f7f9fb',   /* fond alternance */
    text:      '#1a2a3a',   /* texte principal */
    text2:     '#4a5e72',   /* texte secondaire */
    text3:     '#8a9ab0',   /* texte tertiaire */
  };

  const th = (align = 'left') => ({
    fontSize: 9, fontWeight: 700, color: C.text2,
    textTransform: 'uppercase', letterSpacing: '.5px',
    padding: '8px 12px', textAlign: align,
    background: C.bg2,
    borderTop: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
  });

  const td = (align = 'left', last = false) => ({
    padding: '10px 12px', fontSize: 12, color: C.text,
    borderBottom: last ? 'none' : `1px solid ${C.bg2}`,
    textAlign: align, verticalAlign: 'middle',
  });

  return (
    <div style={{ fontFamily: "'Segoe UI','Inter',sans-serif", background: '#ffffff', width: 780, boxSizing: 'border-box' }}>

      {/* ── HEADER ── */}
      <div style={{ background: C.navy, padding: '24px 32px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,.12)', border: '1.5px solid rgba(255,255,255,.25)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#ffffff', fontSize: 15, fontWeight: 800 }}>T</span>
            </div>
            <div>
              <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 800, letterSpacing: '-.3px', lineHeight: 1.1 }}>BAH SERVICES TECH</div>
              <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 10, marginTop: 2 }}>Translation Account Manager</div>
            </div>
          </div>

          {/* Référence */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 9, letterSpacing: '.6px', textTransform: 'uppercase', marginBottom: 5 }}>Relevé de travail</div>
            <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 700 }}>{periodLabel(period)}</div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, marginTop: 4, fontFamily: 'monospace', letterSpacing: '.5px' }}>{refNum}</div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ padding: '26px 32px' }}>

        {/* Blocs info */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 26 }}>

          {/* Traducteur */}
          <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 10 }}>Traducteur</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: '-.3px', lineHeight: 1.2 }}>{translator.name}</div>
            {translator.contact && (
              <div style={{ fontSize: 12, color: C.text2, marginTop: 5 }}>{translator.contact}</div>
            )}
            <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>
              {rows.length} tâche{rows.length > 1 ? 's' : ''}
              {totalWords > 0 && ` · ${totalWords.toLocaleString('fr-FR')} mots traduits`}
            </div>
          </div>

          {/* Montant */}
          <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', background: C.bg2 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 10 }}>
              {allPaid ? 'Montant total' : 'Montant dû'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.navy, letterSpacing: '-1px', lineHeight: 1.1 }}>
              {fcfa(allPaid ? totalAmt : due, rate, deduction)}
            </div>
            <div style={{ fontSize: 12, color: C.text2, marginTop: 6 }}>
              {(allPaid ? totalAmt : due).toFixed(2)} USD
            </div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>
              {deduction > 0 ? `${(allPaid ? totalAmt : due).toFixed(2)} $ × ${100 - deduction}% × ${rate} = ` : `1 $ = ${rate} FCFA`}
            </div>
          </div>
        </div>

        {/* Séparateur section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 3, height: 14, background: C.navy, borderRadius: 2 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '.6px' }}>Détail des tâches</span>
          <div style={{ flex: 1, borderTop: `1px solid ${C.border}` }} />
        </div>

        {/* Tableau */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 22 }}>
          <thead>
            <tr>
              <th style={th('left')}>Username</th>
              <th style={th('left')}>Tâche</th>
              <th style={th('right')}>Mots</th>
              <th style={th('right')}>QA</th>
              <th style={th('right')}>$/1k</th>
              <th style={th('right')}>Total $</th>
              <th style={th('right')}>FCFA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const acc  = accounts.find(a => a.id === p.accountId);
              const last = i === rows.length - 1;
              return (
                <tr key={i} style={{ background: i % 2 === 1 ? C.bg2 : '#ffffff' }}>
                  <td style={td('left', last)}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, background: C.bg2, padding: '3px 8px', borderRadius: 5, fontWeight: 700, color: C.navySoft, border: `1px solid ${C.border}` }}>
                      {acc?.username || acc?.accid || '—'}
                    </span>
                  </td>
                  <td style={{ ...td('left', last), color: C.navySoft, fontWeight: 600 }}>{p.taskName}</td>
                  <td style={td('right', last)}>{(p.paidWords || 0).toLocaleString('fr-FR')}</td>
                  <td style={td('right', last)}>{((p.qaScore || 1) * 100).toFixed(0)}%</td>
                  <td style={td('right', last)}>{(p.pricePer1k || 10).toFixed(2)}</td>
                  <td style={{ ...td('right', last), color: C.text3, fontSize: 11 }}>{p.totalPrice.toFixed(2)} $</td>
                  <td style={td('right', last)}>
                    <span style={{
                      display: 'inline-block', fontWeight: 800, fontSize: 12,
                      color: p.paid ? C.green : C.gold,
                      background: p.paid ? C.greenBg : C.goldBg,
                      border: `1px solid ${p.paid ? C.greenBorder : C.goldBorder}`,
                      borderRadius: 5, padding: '3px 10px',
                    }}>
                      {fcfa(p.totalPrice, rate, deduction)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Ligne total */}
          <tfoot>
            <tr style={{ background: C.bg2, borderTop: `2px solid ${C.border}` }}>
              <td colSpan={4} style={{ padding: '11px 12px', fontSize: 11, color: C.text3 }}>
                {totalWords.toLocaleString('fr-FR')} mots au total
              </td>
              <td style={{ padding: '11px 12px', fontSize: 12, fontWeight: 700, color: C.text2, textAlign: 'right' }}>Total</td>
              <td style={{ padding: '11px 12px', fontSize: 11, color: C.text3, textAlign: 'right' }}>{totalAmt.toFixed(2)} $</td>
              <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: C.navy, letterSpacing: '-.3px' }}>
                  {fcfa(totalAmt, rate, deduction)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Statut */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: allPaid ? C.greenBg : C.goldBg,
            color:      allPaid ? C.green   : C.gold,
            border:    `1px solid ${allPaid ? C.greenBorder : C.goldBorder}`,
            borderRadius: 7, padding: '7px 16px',
            fontSize: 12, fontWeight: 700,
          }}>
            {allPaid ? '✓  Payé intégralement' : '○  En attente de paiement'}
          </span>

          {!allPaid && paid > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 3 }}>Déjà versé</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{fcfa(paid, rate, deduction)}</div>
            </div>
          )}

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 }}>
              {allPaid ? 'Total payé' : 'Reste à payer'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.navy, letterSpacing: '-.5px' }}>
              {fcfa(allPaid ? totalAmt : due, rate, deduction)}
            </div>
          </div>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <div style={{ background: C.bg2, borderTop: `1px solid ${C.border}`, padding: '11px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: C.text3 }}>Émis le {today()}</span>
        <span style={{ fontSize: 10, color: C.text3, fontFamily: 'monospace', letterSpacing: '.3px' }}>{refNum}</span>
        <span style={{ fontSize: 10, color: C.text3 }}>BAH SERVICES TECH · Confidentiel</span>
      </div>
    </div>
  );
}

/* ── Modal ── */
export default function ReceiptModal({ translator, rows, period, rate, deduction = 0, accounts, onClose }) {
  const cardRef  = useRef();
  const [loading, setLoading] = useState(false);

  const exportPng = async (andCopy = false) => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
      if (andCopy) {
        const blob = await fetch(dataUrl).then(r => r.blob());
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        alert('Image copiée — colle-la dans WhatsApp Web avec Ctrl+V.');
      } else {
        const a = document.createElement('a');
        a.download = `recu_${translator.name.replace(/\s+/g,'_')}_${period}.png`;
        a.href = dataUrl; a.click();
      }
    } catch (e) {
      console.error(e);
      alert('Erreur. Essaie "Télécharger PNG".');
    }
    setLoading(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:24 }}>
      <div style={{ background:'#f7f9fb', borderRadius:14, maxWidth:860, width:'100%', maxHeight:'92vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.2)', border:'1px solid #dde3ea' }}>

        {/* Toolbar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 20px', borderBottom:'1px solid #dde3ea', background:'#ffffff', borderRadius:'14px 14px 0 0' }}>
          <span style={{ fontWeight:700, fontSize:13, color:'#1a2a3a' }}>
            Aperçu du reçu · {translator.name}
          </span>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => exportPng(true)} disabled={loading}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', border:'1px solid #dde3ea', borderRadius:8, background:'#f7f9fb', color:'#4a5e72', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit' }}>
              <ImageIcon size={13} /> Copier l'image
            </button>
            <button onClick={() => exportPng(false)} disabled={loading}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', border:'none', borderRadius:8, background:'#1e3a5f', color:'#ffffff', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit' }}>
              <Download size={13} /> {loading ? 'Génération…' : 'Télécharger PNG'}
            </button>
            <button onClick={onClose}
              style={{ width:34, height:34, border:'1px solid #dde3ea', borderRadius:8, background:'#f7f9fb', color:'#8a9ab0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Aperçu */}
        <div style={{ padding:24 }}>
          <div ref={cardRef} style={{ borderRadius:8, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,.1)', border:'1px solid #dde3ea', display:'inline-block', width:'100%' }}>
            <ReceiptCard translator={translator} rows={rows} period={period} rate={rate} deduction={deduction} accounts={accounts} />
          </div>
        </div>

        <div style={{ padding:'0 24px 14px', fontSize:11, color:'#8a9ab0', textAlign:'center' }}>
          Télécharge le PNG pour l'envoyer, ou copie l'image pour la coller dans WhatsApp Web.
        </div>
      </div>
    </div>
  );
}
