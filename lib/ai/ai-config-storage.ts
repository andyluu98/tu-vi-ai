/**
 * lib/ai/ai-config-storage —— Đọc/ghi cấu hình AI ở localStorage (client only).
 *
 * Key API lưu RIÊNG theo provider để đổi qua lại không mất key. Cấu hình được
 * đính vào body request /api/interpret (same-origin) rồi route forward tới LLM.
 * Chỉ dùng cho bản chạy local/self-host — key nằm trong trình duyệt user.
 */
import { getProvider } from './providers';

const K_PROVIDER = 'ziwei.ai.provider';
const K_MODEL = 'ziwei.ai.model';
const keyFor = (provider: string) => `ziwei.ai.key.${provider}`;

export interface AiConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
}

/** Đọc cấu hình hiện tại (an toàn khi chạy SSR: trả mặc định). */
export function loadAiConfig(): AiConfig {
  if (typeof window === 'undefined') {
    const p = getProvider('deepseek');
    return { provider: p.id, model: p.defaultModel, apiKey: '', baseUrl: p.baseUrl };
  }
  const providerId = localStorage.getItem(K_PROVIDER) || 'deepseek';
  const p = getProvider(providerId);
  let model = localStorage.getItem(K_MODEL) || p.defaultModel;
  // Tự nâng cấp: cấu hình DeepSeek cũ (deepseek-chat/reasoner) -> v4-pro, không dùng model cũ nữa
  if (p.id === 'deepseek' && (model === 'deepseek-chat' || model === 'deepseek-reasoner')) {
    model = p.defaultModel;
    localStorage.setItem(K_MODEL, model);
  }
  return {
    provider: p.id,
    model,
    apiKey: localStorage.getItem(keyFor(p.id)) || '',
    baseUrl: p.baseUrl,
  };
}

/** Đọc key đã lưu cho 1 provider cụ thể (dùng khi đổi provider trong modal). */
export const loadKeyFor = (provider: string): string =>
  typeof window === 'undefined' ? '' : localStorage.getItem(keyFor(provider)) || '';

/** Lưu cấu hình. */
export function saveAiConfig(provider: string, model: string, apiKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(K_PROVIDER, provider);
  localStorage.setItem(K_MODEL, model);
  localStorage.setItem(keyFor(provider), apiKey);
}

/** Payload gửi kèm request (không gửi nếu chưa có key -> route dùng .env). */
export function aiConfigForRequest(): { baseUrl: string; model: string; apiKey: string } | undefined {
  const c = loadAiConfig();
  if (!c.apiKey) return undefined;
  return { baseUrl: c.baseUrl, model: c.model, apiKey: c.apiKey };
}
