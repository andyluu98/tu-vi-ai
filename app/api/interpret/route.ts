/**
 * app/api/interpret —— AI 命盘解读接口（开源补全版）
 *
 * 开源仓库不含此后端路由，这里按前端 ChatPanel / InsightPanel 约定的契约补全：
 *   请求：POST { chart: ZiweiChart, messages: {role,content}[] }
 *   响应：SSE 流，每行 `data: {"delta":{"text":"..."}}`，结束 `data: [DONE]`
 *
 * LLM 走 OpenAI 兼容协议（默认 DeepSeek），改 provider 只需改 .env.local。
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

const SYSTEM_PROMPT = `Bạn là một thầy Tử Vi Đẩu Số dày dạn, tinh thông hệ thống "Thiên Kỷ" của Nghê Hải Hạ (Ni Haixia).

QUY TẮC NGÔN NGỮ (BẮT BUỘC): Trả lời 100% bằng TIẾNG VIỆT. TUYỆT ĐỐI KHÔNG dùng chữ Hán hay tiếng Trung trong câu trả lời, kể cả ở tiêu đề mục. Thuật ngữ Tử Vi dùng dạng Hán-Việt (Mệnh, Quan Lộc, Tài Bạch, Thiên Di, Tử Vi, Thiên Phủ, Vũ Khúc, hóa Lộc/Quyền/Khoa/Kỵ, miếu vượng, hãm địa...).

Yêu cầu luận giải:
1. Bám sát dữ liệu lá số bên dưới; luận phải có căn cứ (chỉ rõ cung nào, sao nào, hóa gì, sáng hay tối), không nói chung chung.
2. Theo hệ Nghê Hải Hạ (Thiên Kỷ): tứ hóa cố định, trọng cung vị và tam phương tứ chính, xét miếu vượng lợi hãm, cách cục.
3. Giữ đúng cấu trúc tiêu đề mà câu hỏi yêu cầu (các mục đặt trong 【...】). Giọng chuyên nghiệp mà ấm áp, mạch lạc; không lặp lại toàn bộ lá số mỗi lần.
4. Tử Vi là tham khảo văn hóa truyền thống; khi chạm tới sức khỏe hay quyết định lớn, nhắc người xem giữ lý trí, cần thì hỏi chuyên gia.`;

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
  let chart: ZiweiChart;
  let messages: { role: 'user' | 'assistant'; content: string }[];
  let aiConfig: { baseUrl?: string; model?: string; apiKey?: string } | undefined;
  try {
    const body = await req.json();
    chart = body.chart;
    messages = body.messages ?? [];
    aiConfig = body.aiConfig;
  } catch {
    return textStream('Yêu cầu không hợp lệ, vui lòng tạo lại lá số rồi thử lại.');
  }
  if (!chart?.palaces?.length) return textStream('Thiếu dữ liệu lá số, hãy lập lá số trước.');

  // Ưu tiên cấu hình từ trình duyệt (nút ⚙️); fallback về .env.local
  const baseUrl = aiConfig?.baseUrl?.trim() || BASE_URL;
  const apiKey = aiConfig?.apiKey?.trim() || API_KEY;
  const model = aiConfig?.model?.trim() || MODEL;

  if (!apiKey) {
    return textStream(
      '⚠️ Chưa cấu hình khóa AI. Bấm nút ⚙️ ở đầu trang để chọn nhà cung cấp, model và nhập API key (hoặc điền AI_API_KEY trong .env.local rồi khởi động lại dev server).',
    );
  }

  const upstreamMessages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${chartToText(chart)}${buildClassicsContext(chart)}` },
    ...messages.map(m => ({ role: m.role, content: m.content })),
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
