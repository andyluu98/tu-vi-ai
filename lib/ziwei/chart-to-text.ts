/**
 * lib/ziwei/chart-to-text —— Chuyển ZiweiChart thành văn bản mô tả cho AI đọc.
 *
 * Tách từ app/api/interpret/route.ts để dùng chung cho các route AI khác
 * (interpret, heming...). Giữ nguyên logic gốc, không đổi hành vi.
 */
import { SHICHEN } from '@/lib/ziwei/constants';
import { hanVietStar, hanVietPalace, hanVietStem, hanVietBranch, hanVietSihua, hanVietJu, hanVietBrightness, hanVietPattern } from '@/lib/ziwei/han-viet';
import { detectPatterns } from '@/lib/ziwei/patterns';
import type { ZiweiChart, Palace, Star } from '@/lib/ziwei/types';

// ─── 星曜 → 文本 ────────────────────────────────────────────────
function starToText(s: Star): string {
  const tag =
    s.type === 'major' ? 'chính tinh' :
    s.type === 'lucky' ? 'cát tinh' :
    s.type === 'sha' ? 'sát tinh' : 'tạp diệu';
  const parts = [tag];
  if (s.siHua) parts.push(`hóa ${hanVietSihua(s.siHua)}`);
  if (s.brightnessRaw) {
    const b = hanVietBrightness(s.brightnessRaw);
    if (b) parts.push(b);
  } else if (s.brightness === 'bright') parts.push('miếu vượng');
  else if (s.brightness === 'dim') parts.push('hãm địa');
  return `${hanVietStar(s.name)} (${parts.join(', ')})`;
}

// ─── 单宫 → 文本 ────────────────────────────────────────────────
function palaceToText(p: Palace): string {
  const marks: string[] = [];
  if (p.isMingGong) marks.push('Mệnh');
  if (p.isShenGong) marks.push('Thân');
  if (p.isCurrentDaXian) marks.push('đại hạn hiện tại');
  if (p.isCurrentTieuHan) marks.push('tiểu hạn năm nay');
  if (p.isTuan) marks.push('có Tuần án ngữ');
  if (p.isTriet) marks.push('có Triệt án ngữ');
  const markStr = marks.length ? ` [${marks.join('/')}]` : '';
  const ganzhi = `${hanVietStem(p.stem)} ${hanVietBranch(p.branch)}`;
  const starStr = p.stars.length ? p.stars.map(starToText).join('; ') : '(không sao)';
  let line = `【${hanVietPalace(p.name)}】 ${ganzhi}${markStr}: ${starStr}`;
  if (p.isEmpty && p.borrowedFromName && p.borrowedStars?.length) {
    line += `  (vô chính diệu, mượn chính tinh cung đối 【${hanVietPalace(p.borrowedFromName)}】: ${p.borrowedStars.map(hanVietStar).join(', ')})`;
  }
  return line;
}

// ─── 整张命盘 → 文本 ────────────────────────────────────────────
// ─── 生年四化摘要（宿命轴，倪师体系最重要的四条线）──────────────
function sinhNienTuHoaLine(chart: ZiweiChart): string {
  const bySiHua: Record<string, { star: string; palace: string } | undefined> = {};
  for (const p of chart.palaces) {
    for (const s of p.stars) {
      if (s.siHua && !bySiHua[s.siHua]) {
        bySiHua[s.siHua] = { star: s.name, palace: p.name };
      }
    }
  }
  const order: Array<'禄' | '权' | '科' | '忌'> = ['禄', '权', '科', '忌'];
  const parts = order
    .map(sh => {
      const hit = bySiHua[sh];
      if (!hit) return null;
      return `${hanVietStar(hit.star)} hóa ${hanVietSihua(sh)} (cung ${hanVietPalace(hit.palace)})`;
    })
    .filter(Boolean);
  return parts.length ? `Sinh niên tứ hóa: ${parts.join(', ')}` : '';
}

// ─── 格局识别摘要 ────────────────────────────────────────────────
const PATTERN_LEVEL_VI: Record<string, string> = {
  excellent: '[thượng cách]',
  good: '[trung cách tốt]',
  neutral: '[cách]',
  caution: '[cách xấu, lưu ý]',
};

function patternsToText(chart: ZiweiChart): string {
  const patterns = detectPatterns(chart);
  if (!patterns.length) return '';
  const lines = patterns.map(p => {
    const palaceStr = p.palaces.map(hanVietPalace).join('·');
    return `- ${PATTERN_LEVEL_VI[p.level] ?? ''} ${hanVietPattern(p.name)} (cung: ${palaceStr})`;
  });
  return `\n\n## Cách cục nhận diện\n${lines.join('\n')}`;
}

// ─── 三方四正结构（命理骨架，让 AI 无需自行推地支）──────────────
// Mỗi cung: bộ tam hợp (+4, +8 địa chi) + cung xung chiếu (+6). Ghi sẵn theo
// TÊN cung để AI khỏi phải tự tính địa chi (dễ ghép nhầm). Sao đã liệt kê ở
// mục "Mười hai cung" phía trên, đây chỉ là bản đồ liên kết cung.
function sanFangToText(chart: ZiweiChart): string {
  const byBranch = new Map<number, Palace>();
  for (const p of chart.palaces) byBranch.set(p.branch, p);
  const lines = chart.palaces.map(p => {
    const opp = byBranch.get((p.branch + 6) % 12);
    const t1 = byBranch.get((p.branch + 4) % 12);
    const t2 = byBranch.get((p.branch + 8) % 12);
    const trine = [t1, t2].filter(Boolean).map(q => hanVietPalace(q!.name)).join(', ');
    const oppStr = opp ? hanVietPalace(opp.name) : '(không xác định)';
    return `- ${hanVietPalace(p.name)}: tam hợp với ${trine}; xung chiếu (cung đối) ${oppStr}`;
  });
  return `\n\n## Tam phương tứ chính (bộ khung liên kết cung)
(Khi luận BẤT KỲ cung nào, PHẢI gộp thêm sao ở hai cung tam hợp và cung xung chiếu theo bảng dưới, không chỉ nhìn sao nằm trong cung đó. Đây là gốc luận của Tử Vi.)
${lines.join('\n')}`;
}

export function chartToText(chart: ZiweiChart): string {
  const b = chart.birthInfo;
  const gender = b.gender === 'male' ? 'Nam' : 'Nữ';
  const shichen = SHICHEN.find(s => s.branch === b.hour);
  const gioLabel = `giờ ${hanVietBranch(b.hour)}${shichen ? ' (' + shichen.range + ')' : ''}`;
  const dx = chart.daXians[chart.currentDaXianIndex];
  const tieuHanPalace = chart.palaces.find(p => p.isCurrentTieuHan);

  const header = [
    `Họ tên: ${b.name || '(chưa điền)'}  ·  Giới tính: ${gender}`,
    `Dương lịch: ${b.day}/${b.month}/${b.year}  ·  ${gioLabel}`,
    `Âm lịch: ${chart.lunarInfo.lunarDay}/${chart.lunarInfo.isLeapMonth ? 'nhuận ' : ''}${chart.lunarInfo.lunarMonth}/${chart.lunarInfo.lunarYear}`,
    `Ngũ hành cục: ${hanVietJu(chart.wuxingJuName)}  ·  Mệnh cung: ${hanVietBranch(chart.mingGongBranch)}  ·  Thân cung: ${hanVietBranch(chart.shenGongBranch)}`,
    `Tuổi hiện tại: ${chart.currentAge}${dx ? `  ·  Đại hạn hiện tại: ${dx.startAge}-${dx.endAge} tuổi (${hanVietPalace(dx.palaceName)})` : ''}`,
    ...(tieuHanPalace ? [`Tiểu hạn năm nay: cung ${hanVietPalace(tieuHanPalace.name)}`] : []),
    ...(sinhNienTuHoaLine(chart) ? [sinhNienTuHoaLine(chart)] : []),
  ].join('\n');

  const palaces = [...chart.palaces]
    .sort((a, z) => (a.isMingGong ? -1 : 0) - (z.isMingGong ? -1 : 0))
    .map(palaceToText)
    .join('\n');

  return `# Dữ liệu lá số\n${header}\n\n## Mười hai cung\n${palaces}${sanFangToText(chart)}${patternsToText(chart)}`;
}
