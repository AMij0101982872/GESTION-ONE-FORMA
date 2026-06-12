import { useState, useCallback } from 'react';

let toastFn = null;

export function Toast() {
  const [msg, setMsg] = useState('');
  const [visible, setVisible] = useState(false);

  toastFn = useCallback((text) => {
    setMsg(text);
    setVisible(true);
    setTimeout(() => setVisible(false), 2400);
  }, []);

  return <div className={`toast ${visible ? 'show' : ''}`}>{msg}</div>;
}

export function toast(msg) {
  if (toastFn) toastFn(msg);
}
