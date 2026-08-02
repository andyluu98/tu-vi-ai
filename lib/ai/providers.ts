/**
 * lib/ai/providers —— Danh mục nhà cung cấp LLM (OpenAI-compatible).
 *
 * Dùng cho UI quản lý API key. Route /api/interpret nhận baseUrl+model+key
 * từ client nên chỉ cần đúng chuẩn OpenAI /chat/completions.
 *
 * LƯU Ý: ID model đổi liên tục. Danh sách `models` chỉ là GỢI Ý — ô nhập model
 * cho phép tự gõ ID chính xác lấy từ console của provider.
 */

export interface Provider {
  id: string;
  label: string;
  baseUrl: string;       // đã bao gồm /v1 (route sẽ nối /chat/completions)
  models: string[];      // gợi ý; có thể tự nhập ID khác
  defaultModel: string;
  keyUrl: string;        // link lấy API key
  keyHint: string;       // gợi ý dạng key
}

export const PROVIDERS: Provider[] = [
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    // V4 (2026): context 1M, output tối đa 384K. Không dùng alias cũ deepseek-chat/reasoner nữa.
    models: ['deepseek-v4-pro', 'deepseek-v4-flash'],
    defaultModel: 'deepseek-v4-pro',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    keyHint: 'sk-...',
  },
  {
    id: 'openai',
    label: 'OpenAI (GPT)',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.1', 'gpt-4.1'],
    defaultModel: 'gpt-5.6-terra',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyHint: 'sk-...',
  },
  {
    id: 'anthropic',
    label: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'],
    defaultModel: 'claude-sonnet-5',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyHint: 'sk-ant-...',
  },
  {
    id: 'gemini',
    label: 'Gemini (Google)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: ['gemini-3.6-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-2.5-pro'],
    defaultModel: 'gemini-3.6-flash',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyHint: 'AIza...',
  },
];

export const getProvider = (id: string): Provider =>
  PROVIDERS.find(p => p.id === id) ?? PROVIDERS[0];
