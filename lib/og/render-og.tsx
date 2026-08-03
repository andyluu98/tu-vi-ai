/**
 * lib/og/render-og —— Sinh ảnh Open Graph (share preview) bằng next/og.
 *
 * Dùng chung cho app/opengraph-image.tsx (Facebook/Zalo/Messenger) và
 * app/twitter-image.tsx (X/Twitter). Khớp thương hiệu: nền kem, tiêu đề
 * "Lá Số Tử Vi" đổ gradient vàng, phụ đề hệ Nghê Hải Hạ.
 *
 * Font: nạp subset từ Google Fonts theo đúng text cần vẽ (Playfair Display cho
 * tiêu đề serif, Be Vietnam Pro cho phần chữ Việt). Nếu nạp lỗi thì vẫn vẽ được
 * bằng font mặc định của satori (chấp nhận xuống cấp, không để 500).
 */
import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';
export const OG_ALT = 'Lá Số Tử Vi · Tử Vi Đẩu Số hệ Nghê Hải Hạ';

// ─── Nội dung chữ ───────────────────────────────────────────────
const LABEL = 'TỬ VI ĐẤU SỐ · HỆ PHÁI NGHÊ HẢI HẠ';
const TITLE = 'Lá Số Tử Vi';
const SUBTITLE = 'Tử Vi là cửa · Thiên Địa Nhân là đường · Nghê Hải Hạ là thầy';
const TAGLINE = 'Lập lá số tức thì · AI luận sâu cách cục, đại hạn, lưu niên';

// ─── Nạp font subset từ Google Fonts theo text ──────────────────
async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const src = css.match(/src:\s*url\((.+?)\)\s*format\(['"]?(?:truetype|opentype|woff)['"]?\)/);
    if (!src) return null;
    const res = await fetch(src[1]);
    if (res.status !== 200) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function renderOgImage(): Promise<ImageResponse> {
  const bodyText = LABEL + SUBTITLE + TAGLINE;
  const [titleFont, bodyFont] = await Promise.all([
    loadGoogleFont('Playfair Display', 700, TITLE),
    loadGoogleFont('Be Vietnam Pro', 600, bodyText),
  ]);

  const fonts: { name: string; data: ArrayBuffer; weight: 600 | 700; style: 'normal' }[] = [];
  if (titleFont) fonts.push({ name: 'TitleSerif', data: titleFont, weight: 700, style: 'normal' });
  if (bodyFont) fonts.push({ name: 'BodyViet', data: bodyFont, weight: 600, style: 'normal' });

  const titleFamily = titleFont ? 'TitleSerif' : 'BodyViet';
  const bodyFamily = bodyFont ? 'BodyViet' : 'TitleSerif';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          backgroundColor: '#f4ecd9',
          backgroundImage:
            'radial-gradient(circle at 50% 34%, #fbf6ea 0%, #f1e7d0 58%, #e9dabc 100%)',
          fontFamily: bodyFamily,
          padding: '0 90px',
        }}
      >
        {/* Khung viền vàng trang trí */}
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            width: '1152px',
            height: '582px',
            border: '1px solid rgba(176,132,46,0.32)',
            borderRadius: '20px',
          }}
        />

        {/* Nhãn trên */}
        <div
          style={{
            display: 'flex',
            fontSize: '22px',
            letterSpacing: '8px',
            color: '#a97e2f',
            marginBottom: '28px',
          }}
        >
          {LABEL}
        </div>

        {/* Tiêu đề gradient vàng */}
        <div
          style={{
            display: 'flex',
            fontFamily: titleFamily,
            fontSize: '138px',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '2px',
            backgroundImage: 'linear-gradient(135deg, #d3a63c 0%, #9c6613 55%, #6d420e 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {TITLE}
        </div>

        {/* Phụ đề */}
        <div
          style={{
            display: 'flex',
            fontSize: '30px',
            fontWeight: 600,
            color: '#6a5836',
            marginTop: '36px',
            textAlign: 'center',
          }}
        >
          {SUBTITLE}
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: '24px',
            color: '#93815c',
            marginTop: '14px',
          }}
        >
          {TAGLINE}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}
