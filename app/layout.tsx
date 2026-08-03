import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Domain chính; đổi qua env NEXT_PUBLIC_SITE_URL khi gắn tên miền riêng (vd https://tuvi.aithetech.com)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tuvi.aithetech.com';
const SITE_TITLE = 'Lá số Tử Vi · Tử Vi Đẩu Số hệ Nghê Hải Hạ';
const SITE_DESC = 'Lập lá số Tử Vi Đẩu Số theo hệ Nghê Hải Hạ, AI luận sâu cách cục, đại hạn lưu niên, tình cảm sự nghiệp tài lộc sức khỏe.';

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESC,
  keywords: 'Tử Vi Đẩu Số, Nghê Hải Hạ, lá số, tử vi, an sao, tứ hóa, 14 chính tinh, 12 cung',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    url: SITE_URL,
    siteName: 'Tử Vi Đẩu Số',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESC,
  },
  // 站长平台验证（拿到 verification code 后填入对应字段，重新部署即可）
  verification: {
    // Google Search Console: 在 https://search.google.com/search-console 添加站点后获取
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
    // Bing Webmaster Tools: 在 https://www.bing.com/webmasters 添加站点后获取
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '808FFC6023A2C359B375DD860FEDA856',
      // 百度站长（等执照下来后）
      'baidu-site-verification': process.env.NEXT_PUBLIC_BAIDU_VERIFICATION || '',
      // 360 站长（等执照下来后）
      '360-site-verification': process.env.NEXT_PUBLIC_360_VERIFICATION || '',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" translate="no" suppressHydrationWarning>
      <head>
        {/* Chặn trình duyệt tự động dịch (Chrome Translate) — tránh xung đột removeChild với React/framer-motion */}
        <meta name="google" content="notranslate" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ziwei-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
