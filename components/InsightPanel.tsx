'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import { type TimeView, buildSiHuaOverlay, getYearStemIndex } from './TimeNav';
import { aiConfigForRequest } from '@/lib/ai/ai-config-storage';
import { hanVietStar, hanVietPalace, hanVietSihua, hanVietPattern } from '@/lib/ziwei/han-viet';
import { detectPatterns, type Pattern } from '@/lib/ziwei/patterns';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean; // don't show user bubble for auto/topic messages
}

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
  view?: TimeView;          // tầng thời gian đang xem (để luận đúng bản mệnh/đại hạn/lưu niên)
  liunianYear?: number;     // năm lưu niên đang chọn
}

/** Tứ hóa overlay (sao→禄/权/科/忌) thành chuỗi tiếng Việt "Sao hóa X, ...". */
function sihuaOverlayToVn(overlay: Record<string, string>): string {
  return (['禄', '权', '科', '忌'] as const)
    .map(sh => {
      const star = Object.keys(overlay).find(k => overlay[k] === sh);
      return star ? `${hanVietStar(star)} hóa ${hanVietSihua(sh)}` : null;
    })
    .filter(Boolean)
    .join(', ');
}

/** Bối cảnh tầng thời gian (đại hạn/lưu niên) để nối vào prompt luận cung. null nếu bản mệnh. */
function buildTierContext(
  chart: ZiweiChart,
  view: TimeView,
  liunianYear: number,
): { label: string; ctx: string } | null {
  if (view === 'daxian') {
    const dx = chart.daXians[chart.currentDaXianIndex];
    if (!dx) return null;
    const dxPalace = chart.palaces.find(p => p.branch === dx.palaceBranch);
    const sihua = dxPalace ? sihuaOverlayToVn(buildSiHuaOverlay(dxPalace.stem)) : '';
    return {
      label: `Đại hạn ${dx.startAge}-${dx.endAge}`,
      ctx: `\n\nBỐI CẢNH THỜI GIAN (QUAN TRỌNG): đang xét DƯỚI ĐẠI HẠN ${dx.startAge}-${dx.endAge} tuổi (đại hạn Mệnh tại cung ${hanVietPalace(dx.palaceName)}), KHÔNG luận chung chung cả đời. Tứ hóa đại hạn: ${sihua}. Hãy luận TRỌNG TÂM vào vận 10 năm đại hạn này (cát hung, mốc then chốt, việc nên và không nên), kết hợp tứ hóa đại hạn. Nếu bố cục có mục về 'đại hạn hiện tại', hãy tập trung đúng đại hạn ${dx.startAge}-${dx.endAge} này.`,
    };
  }
  if (view === 'liunian') {
    const yearSihua = sihuaOverlayToVn(buildSiHuaOverlay(getYearStemIndex(liunianYear)));
    // Lưu niên nằm trong đại hạn: đưa cả tứ hóa đại hạn để luận đủ 3 tầng (sinh niên + đại hạn + lưu niên)
    const dx = chart.daXians[chart.currentDaXianIndex];
    const dxPalace = dx ? chart.palaces.find(p => p.branch === dx.palaceBranch) : undefined;
    const dxSihua = dxPalace ? sihuaOverlayToVn(buildSiHuaOverlay(dxPalace.stem)) : '';
    const dxLine = dx ? ` Đang trong đại hạn ${dx.startAge}-${dx.endAge} tuổi, tứ hóa đại hạn: ${dxSihua}.` : '';
    return {
      label: `Lưu niên ${liunianYear}`,
      ctx: `\n\nBỐI CẢNH THỜI GIAN (QUAN TRỌNG): đang xét TRONG LƯU NIÊN năm ${liunianYear}, KHÔNG luận chung chung cả đời. Năm ${liunianYear} nằm trong đại hạn hiện tại, hãy xét ĐỦ 3 TẦNG: sinh niên tứ hóa (nền, ở phần đầu dữ liệu), tứ hóa đại hạn, và tứ hóa lưu niên.${dxLine} Tứ hóa lưu niên ${liunianYear}: ${yearSihua}. Hãy luận TRỌNG TÂM vào RIÊNG năm ${liunianYear}: cát hung trong năm, thời điểm trong năm, việc nên và không nên làm; ưu tiên tác động tứ hóa lưu niên, đối chiếu với tứ hóa đại hạn và sinh niên. Nếu bố cục có mục 'đại hạn hiện tại', hãy THAY bằng mục luận riêng cho năm ${liunianYear}.`,
    };
  }
  return null;
}

const TOPICS = [
  { key: 'overview',     label: 'Tổng quan' },
  { key: 'love',        label: 'Tình cảm' },
  { key: 'career',      label: 'Sự nghiệp' },
  { key: 'wealth',      label: 'Tài vận' },
  { key: 'health',      label: 'Sức khỏe' },
  { key: 'personality', label: 'Tính cách' },
] as const;

const TOPIC_PROMPTS: Record<string, string> = {
  overview: `Hãy viết TỔNG QUAN MỆNH CỤC bằng tiếng Việt, theo cấu trúc sau:

**【Định tính mệnh cục】**
Một câu khái quát cách cục cốt lõi và khí chất của mệnh chủ.

**【Luận chính tinh】**
Đặc tính cốt lõi của chính tinh cung Mệnh, dẫn quan điểm hệ Nghê Hải Hạ.

**【Tam phương tứ chính】**
Phân tích liên động 3 cung Tài - Quan - Di và cách cục tổng thể.

**【Đại hạn hiện tại】**
Hướng vận đại hạn hiện tại và điều đáng lưu tâm nhất.

**【Ưu thế & Lưu ý】**
Ưu thế thiên phú của lá số, và rủi ro hoặc bài học cần lưu ý.`,

  love: `Hãy phân tích sâu VẬN TÌNH CẢM - HÔN NHÂN bằng tiếng Việt, theo cấu trúc:

**【Cách cục tình cảm】**
Một câu định tính mệnh tình cảm.

**【Phân tích cung Phu Thê】**
Chính tinh, tứ hóa cung Phu Thê và luận giải cụ thể theo hệ Nghê Hải Hạ.

**【Liên động tam phương】**
Ảnh hưởng của các cung liên quan tới tình cảm.

**【Vận tình cảm đại hạn hiện tại】**
Xu hướng tình cảm 10 năm hiện tại và mốc then chốt.

**【Lời khuyên thực tế】**
Lời khuyên tình cảm cụ thể, khả thi.`,

  career: `Hãy phân tích sâu VẬN SỰ NGHIỆP bằng tiếng Việt, theo cấu trúc:

**【Cách cục sự nghiệp】**
Một câu định tính mệnh sự nghiệp; nên làm công hay nên khởi nghiệp.

**【Phân tích cung Quan Lộc】**
Chính tinh, tứ hóa cung Quan Lộc và nhận định của Nghê sư về cấu hình này.

**【Liên động cung Tài Bạch】**
Quan hệ giữa tài vận và sự nghiệp, nguồn tài lộc.

**【Vận sự nghiệp đại hạn hiện tại】**
Xu hướng sự nghiệp 10 năm hiện tại.

**【Lời khuyên thực tế】**
Hướng đi, ngành nghề và chiến lược phù hợp.`,

  wealth: `Hãy phân tích sâu TÀI VẬN bằng tiếng Việt, theo cấu trúc:

**【Cách cục tài vận】**
Một câu định tính kiểu tài vận: tài chủ động hay tài thụ động.

**【Phân tích cung Tài Bạch】**
Chính tinh, tứ hóa cung Tài Bạch; nguồn của cải và cách dòng tiền vận động.

**【Cung Điền Trạch (kho tài)】**
Khả năng tích lũy và vận bất động sản.

**【Tài vận đại hạn hiện tại】**
Xu hướng tài vận hiện tại và điều cần lưu ý.

**【Lời khuyên tài chính】**
Lời khuyên tài chính cụ thể.`,

  health: `Hãy phân tích VẬN SỨC KHỎE bằng tiếng Việt, theo cấu trúc:

**【Chính tinh cung Tật Ách】**
Các sao ở cung Tật Ách và ý nghĩa sức khỏe.

**【Rủi ro chính】**
Kết hợp lý thuyết Tý Ngọ lưu chú của Nghê Hải Hạ, phân tích ẩn họa sức khỏe chính và bộ phận cần chú ý.

**【Xu hướng sức khỏe đại hạn】**
Xu hướng sức khỏe hiện tại và giai đoạn then chốt.

**【Lời khuyên phòng ngừa】**
Điều cần chú ý và hướng dưỡng sinh cụ thể.`,

  personality: `Hãy phân tích sâu TÍNH CÁCH bằng tiếng Việt, theo cấu trúc:

**【Tính cách qua chính tinh cung Mệnh】**
Đặc tính tính cách cốt lõi của chính tinh cung Mệnh, dẫn lời Nghê sư.

**【Tổng hợp tính cách tam phương】**
Ảnh hưởng của 3 cung Tài - Quan - Di lên tính cách, mô tả toàn cảnh.

**【Kiểu quan hệ nhân tế】**
Cách tương tác với người khác, phong cách đối nhân xử thế.

**【Ưu thế & Bài học đời người】**
Ưu thế thiên phú và bài học cần đối mặt.`,
};

/** Prompt luận riêng 1 cách cục, theo hệ Nghê Hải Hạ. */
function buildPatternPrompt(pattern: Pattern): string {
  const nameVn = hanVietPattern(pattern.name);
  const palacesVn = pattern.palaces.map(hanVietPalace).join('·');
  return `Hãy luận riêng về cách cục 【${nameVn}】 (liên quan cung: ${palacesVn}) trong lá số này, theo hệ Nghê Hải Hạ, viết bằng tiếng Việt, theo cấu trúc:

**【Ý nghĩa cách cục】**
Giải thích cách cục ${nameVn} là gì, điều kiện thành cách, và mức độ (tốt/xấu/trung bình) trong lá số cụ thể này.

**【Ảnh hưởng tới mệnh chủ】**
Cách cục này tác động thế nào tới tính cách, sự nghiệp, tài vận của mệnh chủ dựa trên các cung liên quan.

**【Liên hệ đại hạn hiện tại】**
Cách cục này phối hợp với đại hạn hiện tại ra sao.

**【Lời khuyên thực tế】**
Lời khuyên cụ thể để phát huy hoặc hóa giải cách cục này.`;
}

/** Màu chip theo mức độ cách cục. */
const PATTERN_LEVEL_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  excellent: { color: '#d4a843', border: 'rgba(212,168,67,0.5)', bg: 'rgba(212,168,67,0.1)' },
  good:      { color: '#3b82f6', border: 'rgba(59,130,246,0.5)', bg: 'rgba(59,130,246,0.1)' },
  neutral:   { color: '#9ca3af', border: 'rgba(156,163,175,0.5)', bg: 'rgba(156,163,175,0.1)' },
  caution:   { color: '#ef4444', border: 'rgba(239,68,68,0.5)', bg: 'rgba(239,68,68,0.1)' },
};

const PALACE_ROLES: Record<string, string> = {
  '命宫': 'bản thân, tính cách, cách cục tiên thiên',
  '兄弟': 'anh chị em, đối tác hợp tác',
  '夫妻': 'tình cảm, hôn nhân',
  '子女': 'con cái, cấp dưới',
  '财帛': 'nguồn tài lộc, cách kiếm tiền',
  '疾厄': 'sức khỏe, tai nạn bất ngờ',
  '迁移': 'cơ hội xuất ngoại, quan hệ bên ngoài',
  '仆役': 'bạn bè, quý nhân, tiểu nhân',
  '官禄': 'thành tựu sự nghiệp, địa vị xã hội',
  '田宅': 'bất động sản, môi trường gia đình',
  '福德': 'hưởng thụ tinh thần, phúc phần nội tâm',
  '父母': 'quan hệ cha mẹ, văn thư khế ước',
};

/** Render AI markdown dạng THẺ: mỗi mục 【Title】 + đoạn văn theo sau gom vào 1 card. */
function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  // Gom nội dung thành các block: mỗi 【tiêu đề】 mở 1 block, các dòng sau là đoạn văn của block đó.
  const lines = text.split('\n');
  const pre: string[] = [];                                   // đoạn văn trước tiêu đề đầu tiên (hiếm)
  const blocks: { heading: string; paras: string[] }[] = [];
  let cur: { heading: string; paras: string[] } | null = null;
  for (const line of lines) {
    const m = line.match(/^\*\*【(.+?)】\*\*$/);
    if (m) { cur = { heading: m[1], paras: [] }; blocks.push(cur); continue; }
    if (line.trim() === '') continue;
    if (cur) cur.paras.push(line); else pre.push(line);
  }

  const renderPara = (line: string, key: number) => {
    const parts = line.split(/\*\*(.+?)\*\*/);
    return (
      <p key={key} className="text-[13.5px]" style={{ lineHeight: 1.8, color: 'var(--t-text2)', margin: 0 }}>
        {parts.map((part, j) =>
          j % 2 === 0 ? part : <strong key={j} className="font-medium" style={{ color: 'var(--t-text)' }}>{part}</strong>,
        )}
      </p>
    );
  };
  const cursor = (
    <span className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse rounded-sm align-middle"
      style={{ background: 'var(--t-gold)', opacity: 0.6 }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {pre.map((line, i) => renderPara(line, i))}
      {blocks.map((b, bi) => (
        <div key={bi}
          style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 14px rgba(140,100,20,0.05)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--t-gold)', flexShrink: 0 }} />
            <h3 className="text-[12.5px] font-bold" style={{ color: 'var(--t-gold)', letterSpacing: '0.03em', margin: 0 }}>{b.heading}</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {b.paras.map((p, j) => renderPara(p, j))}
            {streaming && bi === blocks.length - 1 && cursor}
          </div>
        </div>
      ))}
      {streaming && blocks.length === 0 && cursor}
    </div>
  );
}

export default function InsightPanel({ chart, selectedPalace, selectedSiHua, view = 'mingpan', liunianYear }: InsightPanelProps) {
  const [title, setTitle] = useState('Tổng quan mệnh');
  const [content, setContent] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>('overview');
  const loadingRef = useRef(false);
  const autoLoaded = useRef(false);
  const lastPalaceKey = useRef<string | undefined>(undefined);
  const lastSiHuaKey = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const patterns = useMemo(() => detectPatterns(chart), [chart]);

  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Luận 1 mục: đặt tiêu đề, xóa nội dung cũ, stream nội dung mới vào (thay thế)
  const runLuan = async (luanTitle: string, prompt: string) => {
    if (!prompt.trim() || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setTitle(luanTitle);
    setContent('');
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, messages: [{ role: 'user', content: prompt }], aiConfig: aiConfigForRequest() }),
      });
      if (!res.ok || !res.body) throw new Error('fail');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            if (delta) { text += delta; setContent(text); }
          } catch { /* skip */ }
        }
      }
    } catch {
      setContent('Luận giải thất bại, vui lòng thử lại.');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // Tự luận tổng quan khi vào lá số
  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    runLuan('Tổng quan mệnh', TOPIC_PROMPTS.overview);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inject palace analysis when palace selected
  useEffect(() => {
    if (!selectedPalace) return;
    const ly = liunianYear ?? new Date().getFullYear();
    const palaceKey = `${selectedPalace.branch}-${view}-${ly}`;
    if (palaceKey === lastPalaceKey.current) return;
    lastPalaceKey.current = palaceKey;

    const majorStars = selectedPalace.stars.filter(s => s.type === 'major');
    const starDesc = majorStars.length > 0
      ? majorStars.map(s => `${hanVietStar(s.name)}${s.siHua ? ' hóa ' + hanVietSihua(s.siHua) : ''}`).join(', ')
      : 'vô chính diệu (mượn sao cung đối)';
    const role = PALACE_ROLES[selectedPalace.name] ?? '';
    const palaceVn = hanVietPalace(selectedPalace.name);

    // Tính sẵn tam phương tứ chính: cung đối (+6), 2 cung tam hợp (+4, +8)
    const b = selectedPalace.branch;
    const relInfo = [
      { rb: (b + 6) % 12, kind: 'cung đối' },
      { rb: (b + 4) % 12, kind: 'tam hợp' },
      { rb: (b + 8) % 12, kind: 'tam hợp' },
    ].map(({ rb, kind }) => {
      const pal = chart.palaces.find(p => p.branch === rb);
      if (!pal) return null;
      const majors = pal.stars.filter(s => s.type === 'major').map(s => hanVietStar(s.name));
      return `${kind} ${hanVietPalace(pal.name)} (${majors.length ? majors.join(', ') : 'vô chính diệu'})`;
    }).filter(Boolean).join('; ');

    const prompt = `Hãy tập trung phân tích cung 【${palaceVn}】 (chủ quản: ${role}), chính tinh của cung là ${starDesc}. Tam phương tứ chính của cung này gồm: ${relInfo}. Viết bằng tiếng Việt theo cấu trúc:

**【Định tính cung vị】**
Ý nghĩa của cung ${palaceVn} trong lá số, và nhận định tổng thể về cấu hình sao này.

**【Luận chính tinh】**
Luận giải chính tinh ở cung này theo hệ Nghê Hải Hạ, dẫn quan điểm cụ thể.

**【Liên động tam phương tứ chính】**
Dựa vào tam phương tứ chính nêu trên, phân tích các cung đó ảnh hưởng thế nào tới cung ${palaceVn}.

**【Lời khuyên thực tế】**
Lời khuyên cụ thể dựa trên cung này.`;

    const tier = buildTierContext(chart, view, ly);
    const finalPrompt = tier ? prompt + tier.ctx : prompt;
    const label = tier ? `Cung ${palaceVn} · ${tier.label}` : `Cung ${palaceVn}`;

    setActiveTopic('');
    runLuan(label, finalPrompt);
  }, [selectedPalace, view, liunianYear]); // eslint-disable-line react-hooks/exhaustive-deps

  // 注入四化飞化分析
  useEffect(() => {
    if (!selectedSiHua) return;
    const key = `${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
    if (key === lastSiHuaKey.current) return;
    lastSiHuaKey.current = key;

    // 找出该星所在宫位
    const palaceOfStar = chart.palaces.find(p =>
      p.stars.some(s => s.name === selectedSiHua.starName)
    );
    const palaceName = palaceOfStar ? hanVietPalace(palaceOfStar.name) : 'cung chưa xác định';
    const viewLabel = selectedSiHua.view === 'daxian' ? 'đại hạn' : 'lưu niên';
    const starVn = hanVietStar(selectedSiHua.starName);
    const huaVn = hanVietSihua(selectedSiHua.siHua);

    const prompt = `Hãy phân tích ảnh hưởng phi hóa của 【${viewLabel} ${starVn} hóa ${huaVn}】, viết bằng tiếng Việt theo cấu trúc:

**【Ý nghĩa cơ bản của hóa ${huaVn}】**
Ý nghĩa cốt lõi của hóa ${huaVn} trong hệ Nghê Hải Hạ, và ý nghĩa đặc biệt của ${starVn} hóa ${huaVn}.

**【Ảnh hưởng lạc cung】**
${starVn} hóa ${huaVn} rơi vào cung 【${palaceName}】, lĩnh vực cung này chủ quản chịu ảnh hưởng thế nào, Nghê sư luận ra sao.

**【Đường phi hóa tam phương tứ chính】**
Sau khi hóa ${huaVn} nhập ${palaceName}, ảnh hưởng liên động tới tam phương tứ chính (cung đối và hai cung tam hợp).

**【Ảnh hưởng vận thế hiện tại】**
Dưới chiều thời gian ${viewLabel}, hóa ${huaVn} này ảnh hưởng cụ thể ra sao tới vận thế gần đây của mệnh chủ.

**【Lời khuyên thực tế】**
Lời khuyên khả thi cụ thể dựa trên tứ hóa này.`;

    setActiveTopic('');
    runLuan(`${starVn} hóa ${huaVn} (${viewLabel})`, prompt);
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTopicClick = (topicKey: string) => {
    if (loadingRef.current) return;
    setActiveTopic(topicKey);
    const baseLabel = TOPICS.find(t => t.key === topicKey)?.label ?? 'Luận giải';
    // Gắn tầng thời gian đang chọn (đại hạn / lưu niên) để luận đúng vận, không chung chung
    const ly = liunianYear ?? new Date().getFullYear();
    const tier = buildTierContext(chart, view, ly);
    const prompt = tier ? TOPIC_PROMPTS[topicKey] + tier.ctx : TOPIC_PROMPTS[topicKey];
    const label = tier ? `${baseLabel} · ${tier.label}` : baseLabel;
    runLuan(label, prompt);
  };

  const handleSend = () => {
    if (!input.trim() || loadingRef.current) return;
    const q = input;
    setInput('');
    setActiveTopic('');
    runLuan('Câu hỏi của bạn', `Dựa trên lá số, trả lời câu hỏi sau bằng tiếng Việt, có căn cứ trên cung/sao: ${q}`);
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden card-glass">

      {/* ── Header: chip tiêu đề + tab chủ đề dạng pill ── */}
      <div className="flex-shrink-0 px-4 pt-3.5 pb-3" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span style={{
            fontSize: 11, color: '#fff8e8', fontWeight: 600, letterSpacing: '0.02em',
            padding: '4px 12px', borderRadius: 20,
            background: 'linear-gradient(135deg,#9a6210,#c88020)',
          }}>{title}</span>
          {loading && <span className="text-[10px] animate-pulse" style={{ color: 'var(--t-faint)' }}>· đang luận…</span>}
        </div>
        {patterns.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {patterns.map((p, i) => {
              const style = PATTERN_LEVEL_STYLES[p.level] ?? PATTERN_LEVEL_STYLES.neutral;
              return (
                <button
                  key={`${p.name}-${i}`}
                  onClick={() => runLuan(`Cách cục: ${hanVietPattern(p.name)}`, buildPatternPrompt(p))}
                  disabled={loading}
                  className="text-[11px] font-medium rounded-full transition-all duration-150 disabled:opacity-40"
                  style={{
                    padding: '3px 10px',
                    color: style.color,
                    border: `1px solid ${style.border}`,
                    background: style.bg,
                  }}
                >
                  {hanVietPattern(p.name)}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex gap-1.5 flex-wrap">
          {TOPICS.map(t => {
            const isActive = activeTopic === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTopicClick(t.key)}
                disabled={loading}
                className="text-[12px] font-medium rounded-full transition-all duration-150 disabled:opacity-40"
                style={{
                  padding: '6px 13px',
                  background: isActive ? 'rgba(212,168,67,0.14)' : 'var(--t-card)',
                  border: `1px solid ${isActive ? 'var(--t-gold)' : 'var(--t-border)'}`,
                  color: isActive ? 'var(--t-gold)' : 'var(--t-faint)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Nội dung luận dạng thẻ (thay theo mục đang chọn) ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 min-h-0">
        {content
          ? <AiContent text={content} streaming={loading} />
          : (
            <div className="text-[13px] leading-relaxed" style={{ color: 'var(--t-faint)', padding: '8px 2px' }}>
              {loading
                ? `Đang luận ${title}…`
                : 'Bấm một cung trên lá số, bấm sao / tứ hóa, chọn tab chủ đề, hoặc gõ câu hỏi bên dưới để AI luận.'}
            </div>
          )}
      </div>

      {/* ── Ô hỏi đáp ── */}
      <div className="flex-shrink-0 px-3.5 pb-3.5 pt-2.5" style={{ borderTop: '1px solid var(--t-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Hỏi tiếp, vd: năm nay có nên đổi việc không?"
            disabled={loading}
            className="flex-1 rounded-lg px-3.5 py-2.5 text-[13px] focus:outline-none transition-colors"
            style={{
              background: 'var(--t-card)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-lg text-[13px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              padding: '10px 22px',
              background: 'linear-gradient(135deg,#9a6210,#c88020)',
              color: '#fff8e8',
            }}
          >
            {loading ? '…' : 'Hỏi'}
          </button>
        </div>
      </div>

    </div>
  );
}
