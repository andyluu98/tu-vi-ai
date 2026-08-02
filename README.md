# Tử Vi Đẩu Số + AI (bản tiếng Việt)

Ứng dụng lập **lá số Tử Vi Đẩu Số** và **luận giải bằng AI** theo hệ **Nghê Hải Hạ (Ni Haixia)**, giao diện tiếng Việt hoàn toàn.

**Demo:** https://tuviai-app.vercel.app

Nhập ngày giờ sinh, engine dựng lá số đầy đủ sao ngay lập tức; bấm vào cung, sao hoặc chọn tầng thời gian để AI luận sâu theo dữ liệu thật của lá số.

---

## Tính năng chính

### An sao (dựng lá số)
- **14 chính tinh** + lục cát lục sát + Lộc Tồn, Thiên Mã.
- **Tạp diệu** đầy đủ (Tam Thai, Bát Tọa, Long Trì, Phượng Các, Hồng Loan, Thiên Hỷ, Thiên Khốc, Thiên Hư, Cô Thần, Quả Tú, Hoa Cái, Hàm Trì...).
- **3 vòng thần sát**: vòng Trường Sinh, vòng Bác Sĩ, thần sát lưu niên (Tướng tiền + Tuế tiền).
- **Tuần / Triệt** kiểu Tử Vi Việt (an theo can-chi năm sinh, mỗi cái án 2 cung).
- **Tiểu hạn**, đại hạn, lưu niên; sinh niên tứ hóa; độ sáng đa cấp (miếu / vượng / đắc / lợi / bình / hãm).
- Tam phương tứ chính, mượn sao cung đối cho cung vô chính diệu.
- Hiệu chỉnh **giờ mặt trời thật** theo nơi sinh (tỉnh/thành Việt Nam).

### Luận giải AI
- Luận theo hệ **Nghê Hải Hạ**: trọng chính tinh, tứ hóa cố định, tam hợp, cung vị.
- **Nhận diện cách cục sẵn** (Sát Phá Lang, Cơ Nguyệt Đồng Lương, Tử Phủ Đồng Cung, Phủ Tướng Triều Viên...) rồi đưa vào prompt, kèm chip bấm để luận riêng từng cách cục.
- **Trích cổ tịch liên quan** (Cốt Tủy Phú, Tử Vi Đẩu Số Toàn Thư / Toàn Tập) để neo luận, hạn chế "chém".
- Luận theo **tầng thời gian**: Bản mệnh / Đại hạn / Lưu niên (mỗi tầng kèm tứ hóa của tầng đó).
- 6 chủ đề: Tổng quan, Tình cảm, Sự nghiệp, Tài vận, Sức khỏe, Tính cách. Chat hỏi đáp tự do.
- **Hợp lá số** (hợp hôn / hợp tác): đối chiếu cung Mệnh + Phu Thê + giao thoa tứ hóa của hai người.

### Giao diện
- Việt hóa toàn bộ, thuật ngữ Hán-Việt chuẩn.
- Bàn cờ 12 cung, tô sáng tam phương tứ chính, badge Mệnh/Thân/Tuần/Triệt/Tiểu hạn.
- Panel luận dạng thẻ dễ đọc, sáng/tối, responsive.
- Đọc cổ tịch nguyên văn + bách khoa 14 chính tinh, 12 cung.

---

## Công nghệ

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS**
- Engine an sao: **[iztro](https://github.com/SylarLong/iztro)** + `lunar-javascript`
- Animation: **Framer Motion**
- AI: chuẩn **OpenAI-compatible** (mặc định **DeepSeek**, đổi provider dễ dàng)

---

## Chạy local

```bash
# cài dependencies
npm install

# tạo file cấu hình
cp .env.example .env.local

# chạy dev
npm run dev
```

Mở http://localhost:3000

---

## Cấu hình AI

Có 2 cách nạp API key (chọn 1):

**Cách 1: qua giao diện (khuyên dùng, không lưu vào code)**
Bấm nút **⚙️ Cấu hình AI** trên web, chọn nhà cung cấp + model, dán API key. Key lưu trong trình duyệt của bạn.

**Cách 2: qua `.env.local`**

```
AI_PROVIDER=deepseek
AI_API_KEY=sk-...
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-v4-pro
AI_MAX_TOKENS=384000
```

Hỗ trợ mọi endpoint chuẩn OpenAI (DeepSeek, OpenAI, hoặc provider tương thích khác).

---

## Deploy (Vercel)

Import repo vào Vercel (Framework tự nhận Next.js), hoặc dùng CLI:

```bash
npx vercel --prod
```

App chạy được ngay cả khi không đặt API key trên server (người dùng tự nhập key qua nút ⚙️). Muốn có key chung sẵn thì thêm biến môi trường `AI_API_KEY`, `AI_MODEL`, `AI_MAX_TOKENS` trong Vercel.

---

## Cấu trúc thư mục

```
app/                Next.js App Router
  page.tsx          Trang chủ
  chart/            Lập lá số + luận
  heming/           Hợp lá số
  knowledge/        Bách khoa sao / cung
  library/          Đọc cổ tịch nguyên văn
  api/interpret/    API luận lá số (SSE stream)
  api/heming/       API hợp lá số
components/          Bàn cờ, panel luận, form nhập...
lib/ziwei/          Engine: an sao, tứ hóa, cách cục, Tuần/Triệt, tiểu hạn, chart-to-text, RAG
lib/classics/       Cổ tịch (Cốt Tủy Phú, Toàn Thư, Toàn Tập)
lib/nihai/          Kho tri thức hệ Nghê Hải Hạ (Thiên/Nhân/Địa Kỷ)
lib/ai/             Cấu hình provider AI
```

---

## Ghi công

Dự án này phát triển dựa trên engine mã nguồn mở **[ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu)** (tác giả: 王多鱼AI, giấy phép MIT). Phần Việt hóa toàn bộ, bổ sung Tuần/Triệt, tiểu hạn, nhận diện cách cục vào luận, RAG cổ tịch và giao diện là phần phát triển thêm.

Cổ tịch (Cốt Tủy Phú, Tử Vi Đẩu Số Toàn Thư / Toàn Tập) thuộc phạm vi công cộng (public domain).

## Giấy phép

Mã nguồn theo giấy phép [MIT](./LICENSE).

---

## Miễn trừ

Tử Vi Đẩu Số là tham khảo văn hóa truyền thống. Nội dung luận chỉ mang tính tham khảo, không thay thế cho quyết định y tế, tài chính hay pháp lý. Hãy giữ lý trí.
