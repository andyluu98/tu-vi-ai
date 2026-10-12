/**
 * lib/ai/safe-upstream —— Chốt an toàn dùng chung cho /api/interpret và /api/heming.
 *
 * Chống 3 lỗi:
 *  1. Lộ khóa server: khi route dùng khóa server (AI_API_KEY / DEEPSEEK_API_KEY),
 *     baseUrl do client gửi bị bỏ qua, chỉ gọi tới URL cấu hình ở server.
 *  2. SSRF: baseUrl của client chỉ được dùng cùng với apiKey của client, bắt buộc
 *     https, hostname nằm trong allowlist dựng từ providers.ts (không IP, không localhost).
 *  3. Lạm dụng: rate limit theo IP (in-memory) và trần max_tokens.
 */
import { PROVIDERS } from '@/lib/ai/providers';

// ─── Cấu hình server ─────────────────────────────────────────────
const DEFAULT_BASE_URL = PROVIDERS[0].baseUrl;
const DEFAULT_MODEL = PROVIDERS[0].defaultModel;

export interface ResolvedUpstream {
  baseUrl: string;
  apiKey: string;
  model: string;
  usingServerKey: boolean;
}

export type ResolveResult = { ok: true; value: ResolvedUpstream } | { ok: false; error: string };

// ─── Allowlist hostname (từ providers.ts) ────────────────────────
const ALLOWED_HOSTS: ReadonlySet<string> = new Set(
  PROVIDERS.map(p => new URL(p.baseUrl).hostname.toLowerCase()),
);

function isIpOrLocal(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, '');
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h.startsWith('[') || h.includes(':')) return true; // IPv6
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return true; // IPv4
  if (/^(0x[0-9a-f]+|\d+)$/i.test(h)) return true; // IP dạng số nguyên / hex
  return false;
}

/** Trả về baseUrl đã chuẩn hóa nếu hợp lệ, ngược lại null. */
function validateClientBaseUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  if (u.username || u.password) return null;
  if (u.port) return null; // chỉ cổng 443 mặc định
  if (u.search || u.hash) return null;
  if (isIpOrLocal(u.hostname)) return null;
  if (!ALLOWED_HOSTS.has(u.hostname.toLowerCase())) return null;
  return `${u.origin}${u.pathname.replace(/\/+$/, '')}`;
}

// ─── Chọn base URL / key / model ─────────────────────────────────
function serverBaseUrl(): string {
  return (process.env.AI_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');
}

function serverModel(): string {
  return process.env.AI_MODEL || DEFAULT_MODEL;
}

/**
 * Quyết định gọi LLM nào từ aiConfig do client gửi (không tin tưởng).
 * - Có apiKey của client: dùng key đó; baseUrl client (nếu có) phải qua allowlist.
 * - Không có apiKey của client: dùng khóa server + base URL server, bỏ qua baseUrl client.
 */
export function resolveUpstream(aiConfig: unknown): ResolveResult {
  const cfg = (aiConfig && typeof aiConfig === 'object' ? aiConfig : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const clientBase = str(cfg.baseUrl);
  const clientKey = str(cfg.apiKey);
  const clientModel = str(cfg.model);

  if (clientKey) {
    if (clientKey.length > 512) return { ok: false, error: 'API key không hợp lệ.' };
    let baseUrl = serverBaseUrl();
    if (clientBase) {
      const checked = validateClientBaseUrl(clientBase);
      if (!checked) {
        return {
          ok: false,
          error: 'Địa chỉ API (baseUrl) không được chấp nhận. Chỉ hỗ trợ https tới các nhà cung cấp có trong danh sách của ứng dụng.',
        };
      }
      baseUrl = checked;
    }
    const model = clientModel && clientModel.length <= 100 ? clientModel : serverModel();
    return { ok: true, value: { baseUrl, apiKey: clientKey, model, usingServerKey: false } };
  }

  const serverKey = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || '';
  if (!serverKey) {
    return {
      ok: false,
      error:
        '⚠️ Chưa cấu hình khóa AI. Bấm nút ⚙️ ở đầu trang để chọn nhà cung cấp, model và nhập API key (hoặc điền AI_API_KEY trong .env.local rồi khởi động lại dev server).',
    };
  }
  // Dùng khóa server: chỉ cho chọn model trong danh sách gợi ý của chính nhà cung cấp server,
  // tránh việc ép server trả tiền cho model đắt tiền tùy ý.
  const baseUrl = serverBaseUrl();
  const host = (() => {
    try {
      return new URL(baseUrl).hostname.toLowerCase();
    } catch {
      return '';
    }
  })();
  const provider = PROVIDERS.find(p => new URL(p.baseUrl).hostname.toLowerCase() === host);
  const model = provider && provider.models.includes(clientModel) ? clientModel : serverModel();
  return { ok: true, value: { baseUrl, apiKey: serverKey, model, usingServerKey: true } };
}

// ─── Trần max_tokens ─────────────────────────────────────────────
const MAX_TOKENS_CEILING = 16384;
export function getMaxTokens(): number {
  const n = Number(process.env.AI_MAX_TOKENS);
  const v = Number.isFinite(n) && n > 0 ? Math.floor(n) : MAX_TOKENS_CEILING;
  return Math.min(Math.max(v, 256), MAX_TOKENS_CEILING);
}

// ─── Làm sạch messages từ client ─────────────────────────────────
const MAX_MESSAGES = 40;
const MAX_TOTAL_CHARS = 60000;
export type ChatMsg = { role: 'user' | 'assistant'; content: string };

/** Chỉ nhận role user/assistant (chặn client chèn role system), giới hạn số lượng và độ dài. */
export function sanitizeMessages(raw: unknown): ChatMsg[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMsg[] = [];
  let total = 0;
  for (const m of raw.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== 'object') continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue;
    total += content.length;
    if (total > MAX_TOTAL_CHARS) break;
    out.push({ role, content });
  }
  return out;
}

// ─── Rate limit in-memory theo IP: 20 req / 10 phút ──────────────
// Lưu ý: bộ nhớ theo từng instance serverless nên chỉ là lớp chặn cơ bản, không thay thế
// rate limit tập trung (Redis, Vercel WAF...). IP lấy từ x-forwarded-for do hạ tầng (Vercel) gán.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_KEYS = 10000;
const hits = new Map<string, number[]>();

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim() || 'unknown';
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function checkRateLimit(req: Request): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const ip = clientIp(req);

  if (hits.size > RATE_LIMIT_MAX_KEYS) {
    for (const [k, ts] of hits) {
      if (!ts.length || now - ts[ts.length - 1] > RATE_LIMIT_WINDOW_MS) hits.delete(k);
    }
    if (hits.size > RATE_LIMIT_MAX_KEYS) hits.clear();
  }

  const recent = (hits.get(ip) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(ip, recent);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((recent[0] + RATE_LIMIT_WINDOW_MS - now) / 1000)) };
  }
  recent.push(now);
  hits.set(ip, recent);
  return { ok: true };
}
