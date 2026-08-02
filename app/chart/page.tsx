'use client';
import { useState } from 'react';
import BirthForm from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import TimeNav, { type TimeView } from '@/components/TimeNav';
import AiSettingsModal from '@/components/AiSettingsModal';
import { useTheme } from '@/components/ThemeProvider';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart, Palace } from '@/lib/ziwei/types';

/**
 * Trang lá số —— bản mở "Demo engine lập lá số".
 *
 * Nhập ngày giờ sinh -> generateChart() dựng lá số + panel AI luận. Nút ⚙️ mở
 * popup chọn provider/model + nhập API key (lưu trình duyệt).
 */
export default function ChartPage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [selectedSiHua, setSelectedSiHua] = useState<{ starName: string; siHua: string; view: TimeView } | null>(null);
  const [view, setView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState(() => new Date().getFullYear());
  const [showSettings, setShowSettings] = useState(false);
  const { theme, toggle } = useTheme();

  const ctrlStyle = {
    padding: '6px 14px', cursor: 'pointer', fontSize: 13,
    border: '1px solid var(--t-border)', borderRadius: 8, background: 'transparent',
    color: 'var(--t-text2)',
  } as const;

  const controls = (
    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
      <button type="button" onClick={toggle} style={ctrlStyle} title="Chuyển sáng/tối">
        {theme === 'dark' ? '☀️ Sáng' : '🌙 Tối'}
      </button>
      <button type="button" onClick={() => setShowSettings(true)} style={ctrlStyle}>
        ⚙️ Cấu hình AI
      </button>
    </div>
  );

  // ── Chưa lập: form nhập ──
  if (!chart) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
        <AiSettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Lập lá số Tử Vi</h1>
          {controls}
        </div>
        <p style={{ color: '#888', marginBottom: 32, fontSize: 14, lineHeight: 1.7 }}>
          Nhập ngày giờ sinh, engine mã nguồn mở dựng lá số ngay lập tức.
          <br />
          (Trang này là Demo engine; giao diện bản thương mại đầy đủ không nằm trong mã nguồn mở, nhưng lõi lập lá số thì mở hoàn toàn.)
        </p>
        <BirthForm onSubmit={(info: BirthInfo) => setChart(generateChart(info))} />
      </main>
    );
  }

  // ── Đã lập: lá số + AI luận ──
  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
      <AiSettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => { setChart(null); setSelectedPalace(null); }}
          style={{
            padding: '6px 14px', cursor: 'pointer',
            border: '1px solid #ccc', borderRadius: 8, background: 'transparent',
          }}
        >
          ← Lập lá số khác
        </button>
        {controls}
      </div>

      <TimeNav
        chart={chart}
        view={view}
        liunianYear={liunianYear}
        onViewChange={setView}
        onYearChange={setLiunianYear}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 42fr) minmax(0, 58fr)',
          gap: 20, marginTop: 16, alignItems: 'start',
        }}
      >
        <ChartBoard
          chart={chart}
          view={view}
          liunianYear={liunianYear}
          onPalaceSelect={setSelectedPalace}
          onSiHuaClick={(starName, siHua, v) => setSelectedSiHua({ starName, siHua, view: v })}
        />
        <InsightPanel
          chart={chart}
          selectedPalace={selectedPalace}
          selectedSiHua={selectedSiHua}
          view={view}
          liunianYear={liunianYear}
        />
      </div>
    </main>
  );
}
