/**
 * lib/ziwei/classics-rag —— RAG nhẹ: chọn đoạn cổ tịch liên quan để neo luận AI.
 *
 * Tìm theo chính tinh cung Mệnh + Thân (và sao bổ sung nếu có), lấy tối đa 8 đoạn
 * ngắn từ kho cổ tịch (Cốt Tủy Phú, Toàn Thư, Toàn Tập). Giới hạn để chặn token.
 * Cổ văn là chữ Hán -> dặn AI diễn giải + dịch, không chép chữ Hán vào câu trả lời.
 */
import { searchClassics } from '@/lib/classics';
import type { ZiweiChart } from './types';
import { hanVietStar } from './han-viet';

const BOOK_VI: Record<string, string> = {
  gusuifu: 'Cốt Tủy Phú',
  guisuifu: 'Cốt Tủy Phú',
  quanji: 'Tử Vi Đẩu Số Toàn Tập',
  quanshu: 'Tử Vi Đẩu Số Toàn Thư',
};

const MAX_PASSAGES = 8;
const MAX_TEXT_LEN = 160;

export function buildClassicsContext(chart: ZiweiChart, extraStarNames: string[] = []): string {
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  const than = chart.palaces.find(p => p.branch === chart.shenGongBranch);

  const starNames: string[] = [];
  [ming, than].forEach(p =>
    p?.stars.filter(s => s.type === 'major').forEach(s => starNames.push(s.name)),
  );
  extraStarNames.forEach(n => starNames.push(n));
  const uniqueStars = [...new Set(starNames)];
  if (uniqueStars.length === 0) return '';

  const seenPara = new Set<string>();
  const lines: string[] = [];
  for (const star of uniqueStars) {
    if (lines.length >= MAX_PASSAGES) break;
    for (const h of searchClassics(star, 3)) {
      if (lines.length >= MAX_PASSAGES) break;
      if (seenPara.has(h.paragraphId)) continue;
      seenPara.add(h.paragraphId);
      const src = BOOK_VI[h.bookSlug] ?? h.bookTitle;
      const text = h.text.length > MAX_TEXT_LEN ? h.text.slice(0, MAX_TEXT_LEN) + '…' : h.text;
      lines.push(`- [${src}] (liên quan ${hanVietStar(star)}): ${text}`);
    }
  }
  if (lines.length === 0) return '';

  return `\n\n## Trích cổ tịch liên quan (tư liệu chữ Hán để neo luận)
(Đây là nguyên văn cổ tịch để bạn luận cho chính xác. Hãy DIỄN GIẢI và DỊCH sang tiếng Việt, GHI RÕ tên sách khi dẫn. TUYỆT ĐỐI KHÔNG chép chữ Hán vào câu trả lời. KHÔNG bịa câu không có trong danh sách dưới.)
${lines.join('\n')}`;
}
