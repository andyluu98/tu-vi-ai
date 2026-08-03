/**
 * app/api/heming —— AI hợp lá số (hợp hôn / hợp tác) giữa hai người.
 *
 * Cùng khuôn với app/api/interpret/route.ts: nhận 2 lá số ZiweiChart, dựng
 * context văn bản qua chartToText(), gọi LLM (OpenAI-compatible) theo dạng
 * stream, trả về SSE `data: {"delta":{"text":"..."}}` kết thúc bằng `[DONE]`.
 */
import type { NextRequest } from 'next/server';
import { chartToText } from '@/lib/ziwei/chart-to-text';
import { buildClassicsContext } from '@/lib/ziwei/classics-rag';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── LLM 配置（OpenAI 兼容）──────────────────────────────────────
const BASE_URL = process.env.AI_BASE_URL || 'https://api.deepseek.com/v1';
const API_KEY = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || '';
const MODEL = process.env.AI_MODEL || 'deepseek-v4-pro';

const SYSTEM_PROMPT = `Bạn là một thầy Tử Vi Đẩu Số dày dạn, tinh thông HỢP LÁ SỐ (hợp hôn, hợp tác làm ăn) theo hệ thống "Thiên Kỷ" của Nghê Hải Hạ (Ni Haixia).

QUY TẮC NGÔN NGỮ (BẮT BUỘC): Trả lời 100% bằng TIẾNG VIỆT. TUYỆT ĐỐI KHÔNG dùng chữ Hán hay tiếng Trung trong câu trả lời, kể cả ở tiêu đề mục. Thuật ngữ Tử Vi dùng dạng Hán-Việt (Mệnh, Phu Thê, Quan Lộc, Tài Bạch, Thiên Di, Tử Vi, Thiên Phủ, Vũ Khúc, hóa Lộc/Quyền/Khoa/Kỵ, miếu vượng, hãm địa...).

Yêu cầu luận giải khi hợp lá số hai người (gọi là Người A và Người B):
1. Bám sát dữ liệu hai lá số bên dưới; luận phải có căn cứ (chỉ rõ cung nào, sao nào, hóa gì, sáng hay tối của từng người), không nói chung chung.
2. Trọng tâm: đối chiếu cung Mệnh và cung Phu Thê của hai bên, xem tứ hóa của người này bay vào cung nào của người kia (giao thoa tứ hóa), xét mức độ hợp khắc ngũ hành và tính cách qua chính tinh.
3. Cấu trúc câu trả lời gồm các mục đặt trong 【...】, ví dụ 【Mức độ hợp duyên tổng quan】, 【Đối chiếu cung Phu Thê hai bên】, 【Điểm hợp】, 【Điểm cần lưu ý】, 【Lời khuyên tương xử】. Giọng chuyên nghiệp mà ấm áp, mạch lạc; không lặp lại toàn bộ lá số mỗi lần.
4. Tử Vi là tham khảo văn hóa truyền thống; khi chạm tới quyết định lớn (kết hôn, hợp tác kinh doanh), nhắc người xem giữ lý trí, đây chỉ là một góc tham khảo.`;

// ─── SSE 辅助 ───────────────────────────────────────────────────
function sse(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}
const DONE = new TextEncoder().encode('data: [DONE]\n\n');

// 直接把一段文本作为一个 SSE 流返回（用于报错提示，让前端能显示出来）
function textStream(text: string): Response {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(sse({ delta: { text } }));
      controller.enqueue(DONE);
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}

export async function POST(req: NextRequest) {
  let chartA: ZiweiChart;
  let chartB: ZiweiChart;
  let question: string | undefined;
  let relation: string | undefined;
  let messages: { role: 'user' | 'assistant'; content: string }[] = [];
  let aiConfig: { baseUrl?: string; model?: string; apiKey?: string } | undefined;
  try {
    const body = await req.json();
    chartA = body.chartA;
    chartB = body.chartB;
    question = body.question;
    relation = body.relation;
    messages = Array.isArray(body.messages) ? body.messages : [];
    aiConfig = body.aiConfig;
  } catch {
    return textStream('Yêu cầu không hợp lệ, vui lòng lập lại lá số rồi thử lại.');
  }
  if (!chartA?.palaces?.length || !chartB?.palaces?.length) {
    return textStream('Thiếu dữ liệu lá số, hãy lập lá số cho cả hai người trước.');
  }

  // Ưu tiên cấu hình từ trình duyệt (nút ⚙️); fallback về .env.local
  const baseUrl = aiConfig?.baseUrl?.trim() || BASE_URL;
  const apiKey = aiConfig?.apiKey?.trim() || API_KEY;
  const model = aiConfig?.model?.trim() || MODEL;

  if (!apiKey) {
    return textStream(
      '⚠️ Chưa cấu hình khóa AI. Bấm nút ⚙️ ở đầu trang để chọn nhà cung cấp, model và nhập API key (hoặc điền AI_API_KEY trong .env.local rồi khởi động lại dev server).',
    );
  }

  // Loại quan hệ (do người dùng chọn) quyết định trọng tâm luận.
  const RELATION_HINT: Record<string, string> = {
    tinhcam: 'Loại quan hệ cần xét: TÌNH CẢM / HÔN NHÂN. Trọng tâm cung Phu Thê, Mệnh, Phúc Đức của hai bên.',
    hoptac: 'Loại quan hệ cần xét: HỢP TÁC LÀM ĂN / ĐỐI TÁC. Trọng tâm cung Mệnh, Quan Lộc, Tài Bạch, Nô Bộc (bạn bè cộng sự) của hai bên; xét tin cậy, phân vai, tài lộc chung.',
    chacon: 'Loại quan hệ cần xét: CHA MẸ - CON CÁI. Trọng tâm cung Phụ Mẫu, Tử Nữ, Mệnh của hai bên; xét duyên nợ, cách nuôi dạy, xung hợp thế hệ.',
    banbe: 'Loại quan hệ cần xét: BẠN BÈ / TRI KỶ. Trọng tâm cung Nô Bộc, Mệnh, Phúc Đức của hai bên; xét độ ăn ý, giúp đỡ hay khắc khẩu.',
  };
  const relationLine = relation && RELATION_HINT[relation] ? `\n\n${RELATION_HINT[relation]}` : '';

  const context = `${SYSTEM_PROMPT}${relationLine}\n\n## Người A\n${chartToText(chartA)}\n\n## Người B\n${chartToText(chartB)}${buildClassicsContext(chartA)}${buildClassicsContext(chartB)}`;

  // Ưu tiên lịch sử hội thoại (để hỏi thêm không mất mạch); fallback về 1 câu hỏi.
  const convo = messages.length
    ? messages.map(m => ({ role: m.role, content: m.content }))
    : [{ role: 'user', content: question?.trim() || 'Hãy phân tích tổng quan mức độ hợp lá số giữa Người A và Người B.' }];

  const upstreamMessages = [
    { role: 'system', content: context },
    ...convo,
  ];

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: upstreamMessages, stream: true, temperature: 0.7, max_tokens: Number(process.env.AI_MAX_TOKENS) || 32768 }),
    });
  } catch (e) {
    return textStream(`Gọi mô hình thất bại (lỗi mạng): ${(e as Error).message}`);
  }
  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return textStream(`Mô hình trả về lỗi ${upstream.status}: ${detail.slice(0, 300)}`);
  }

  // ─── 转换上游 OpenAI SSE → 前端约定的 {delta:{text}} SSE ───
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const stream = new ReadableStream({
    async pull(controller) {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(DONE);
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const text = JSON.parse(data).choices?.[0]?.delta?.content ?? '';
            if (text) controller.enqueue(sse({ delta: { text } }));
          } catch {
            /* 跳过心跳/非 JSON 行 */
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
