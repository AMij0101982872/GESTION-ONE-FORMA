import { Trash2, X } from 'lucide-react';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 14, width: '100%', maxWidth: 380, boxShadow: '0 16px 48px rgba(0,0,0,.18)', border: '1px solid var(--border)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trash2 size={16} color="#ef4444" />
          </div>
          <div style={{ paddingTop: 2 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Confirmer la suppression</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{message}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 20px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid var(--border)' }}>
          <button
            className="btn"
            onClick={onCancel}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <X size={12} /> Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Trash2 size={12} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
