'use client';
import { useEffect, useState } from 'react';
import { PROVIDERS, getProvider } from '@/lib/ai/providers';
import { loadAiConfig, loadKeyFor, saveAiConfig } from '@/lib/ai/ai-config-storage';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Popup cấu hình AI: chọn provider + model + nhập API key (lưu localStorage). */
export default function AiSettingsModal({ open, onClose }: Props) {
  const [provider, setProvider] = useState('deepseek');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // Nạp cấu hình đang lưu mỗi lần mở
  useEffect(() => {
    if (!open) return;
    const c = loadAiConfig();
    setProvider(c.provider);
    setModel(c.model);
    setApiKey(c.apiKey);
    setSaved(false);
  }, [open]);

  if (!open) return null;

  const p = getProvider(provider);
  const isCustom = !p.models.includes(model);

  // Đổi provider: nạp key đã lưu của provider đó + đặt model mặc định
  const handleProvider = (id: string) => {
    setProvider(id);
    setModel(getProvider(id).defaultModel);
    setApiKey(loadKeyFor(id));
    setSaved(false);
  };

  const handleSave = () => {
    saveAiConfig(provider, model.trim() || p.defaultModel, apiKey.trim());
    setSaved(true);
    setTimeout(onClose, 500);
  };

  const label = { display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--t-faint)' } as const;
  const field = {
    width: '100%', padding: '9px 11px', borderRadius: 10, fontSize: 13,
    background: 'var(--t-card)', border: '1px solid var(--t-border)', color: 'var(--t-text)',
  } as const;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 440, borderRadius: 16, padding: 22,
          background: 'var(--t-bg)', border: '1px solid var(--t-border)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--t-gold)' }}>⚙️ Cấu hình AI luận</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--t-faint)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Provider */}
        <div style={{ marginBottom: 14 }}>
          <label style={label}>Nhà cung cấp</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PROVIDERS.map(pr => (
              <button
                key={pr.id}
                onClick={() => handleProvider(pr.id)}
                style={{
                  ...field, cursor: 'pointer', textAlign: 'center', fontWeight: 500,
                  borderColor: provider === pr.id ? 'var(--t-gold)' : 'var(--t-border)',
                  color: provider === pr.id ? 'var(--t-gold)' : 'var(--t-text2)',
                  background: provider === pr.id ? 'rgba(212,168,67,0.1)' : 'var(--t-card)',
                }}
              >
                {pr.label}
              </button>
            ))}
          </div>
        </div>

        {/* Model: chọn từ danh sách, hoặc "Khác" để tự nhập ID */}
        <div style={{ marginBottom: 14 }}>
          <label style={label}>Model</label>
          <select
            value={isCustom ? '__custom__' : model}
            onChange={e => { const v = e.target.value; setModel(v === '__custom__' ? '' : v); setSaved(false); }}
            style={field}
          >
            {p.models.map(m => <option key={m} value={m}>{m}</option>)}
            <option value="__custom__">Khác (tự nhập ID)…</option>
          </select>
          {isCustom && (
            <input
              value={model}
              onChange={e => { setModel(e.target.value); setSaved(false); }}
              placeholder="Dán ID model chính xác từ console provider"
              autoFocus
              style={{ ...field, marginTop: 8 }}
            />
          )}
        </div>

        {/* API key */}
        <div style={{ marginBottom: 8 }}>
          <label style={label}>API key</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setSaved(false); }}
              placeholder={p.keyHint}
              autoComplete="off"
              style={{ ...field, flex: 1 }}
            />
            <button onClick={() => setShowKey(s => !s)} style={{ ...field, width: 'auto', cursor: 'pointer' }}>
              {showKey ? 'Ẩn' : 'Hiện'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--t-faint)', marginTop: 6 }}>
            Lấy key tại{' '}
            <a href={p.keyUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--t-gold)' }}>{p.keyUrl}</a>
            . Key lưu trong trình duyệt máy bạn.
          </p>
        </div>

        <button
          onClick={handleSave}
          style={{
            width: '100%', marginTop: 12, padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            background: saved ? 'rgba(74,222,128,0.2)' : 'rgba(212,168,67,0.9)',
            color: saved ? '#4ade80' : '#08080a',
          }}
        >
          {saved ? '✓ Đã lưu' : 'Lưu'}
        </button>
      </div>
    </div>
  );
}
