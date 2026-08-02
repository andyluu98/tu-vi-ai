/**
 * lib/ziwei/cities —— Tỉnh/thành Việt Nam + kinh độ (dùng hiệu chỉnh giờ mặt trời thật).
 *
 * Kinh tuyến chuẩn giờ VN là 105°E (UTC+7). Chênh lệch kinh độ giữa các tỉnh
 * chỉ ~102°–110°E nên giờ mặt trời thật lệch giờ đồng hồ tối đa khoảng ±10 phút.
 * Kinh độ lấy theo thành phố tỉnh lỵ (đủ chính xác cho hiệu chỉnh giờ sinh).
 */
export interface CityInfo {
  name: string;
  longitude: number; // độ Đông
}

export interface ProvinceInfo {
  name: string;
  cities: CityInfo[];
}

export const PROVINCES: ProvinceInfo[] = [
  // ─── Thành phố trực thuộc trung ương ───────────────────
  { name: 'Hà Nội', cities: [{ name: 'Hà Nội', longitude: 105.85 }] },
  { name: 'TP Hồ Chí Minh', cities: [{ name: 'TP Hồ Chí Minh', longitude: 106.70 }] },
  { name: 'Hải Phòng', cities: [{ name: 'Hải Phòng', longitude: 106.68 }] },
  { name: 'Đà Nẵng', cities: [{ name: 'Đà Nẵng', longitude: 108.22 }] },
  { name: 'Cần Thơ', cities: [{ name: 'Cần Thơ', longitude: 105.78 }] },

  // ─── Miền Bắc ──────────────────────────────────────────
  { name: 'Hà Giang', cities: [{ name: 'Hà Giang', longitude: 104.98 }] },
  { name: 'Cao Bằng', cities: [{ name: 'Cao Bằng', longitude: 106.25 }] },
  { name: 'Bắc Kạn', cities: [{ name: 'Bắc Kạn', longitude: 105.83 }] },
  { name: 'Tuyên Quang', cities: [{ name: 'Tuyên Quang', longitude: 105.22 }] },
  { name: 'Lào Cai', cities: [{ name: 'Lào Cai', longitude: 103.97 }] },
  { name: 'Điện Biên', cities: [{ name: 'Điện Biên Phủ', longitude: 103.02 }] },
  { name: 'Lai Châu', cities: [{ name: 'Lai Châu', longitude: 103.45 }] },
  { name: 'Sơn La', cities: [{ name: 'Sơn La', longitude: 103.92 }] },
  { name: 'Yên Bái', cities: [{ name: 'Yên Bái', longitude: 104.87 }] },
  { name: 'Hòa Bình', cities: [{ name: 'Hòa Bình', longitude: 105.34 }] },
  { name: 'Thái Nguyên', cities: [{ name: 'Thái Nguyên', longitude: 105.83 }] },
  { name: 'Lạng Sơn', cities: [{ name: 'Lạng Sơn', longitude: 106.76 }] },
  { name: 'Quảng Ninh', cities: [{ name: 'Hạ Long', longitude: 107.08 }] },
  { name: 'Bắc Giang', cities: [{ name: 'Bắc Giang', longitude: 106.20 }] },
  { name: 'Phú Thọ', cities: [{ name: 'Việt Trì', longitude: 105.40 }] },
  { name: 'Vĩnh Phúc', cities: [{ name: 'Vĩnh Yên', longitude: 105.60 }] },
  { name: 'Bắc Ninh', cities: [{ name: 'Bắc Ninh', longitude: 106.08 }] },
  { name: 'Hải Dương', cities: [{ name: 'Hải Dương', longitude: 106.33 }] },
  { name: 'Hưng Yên', cities: [{ name: 'Hưng Yên', longitude: 106.05 }] },
  { name: 'Thái Bình', cities: [{ name: 'Thái Bình', longitude: 106.34 }] },
  { name: 'Hà Nam', cities: [{ name: 'Phủ Lý', longitude: 105.91 }] },
  { name: 'Nam Định', cities: [{ name: 'Nam Định', longitude: 106.18 }] },
  { name: 'Ninh Bình', cities: [{ name: 'Ninh Bình', longitude: 105.97 }] },

  // ─── Miền Trung ────────────────────────────────────────
  { name: 'Thanh Hóa', cities: [{ name: 'Thanh Hóa', longitude: 105.78 }] },
  { name: 'Nghệ An', cities: [{ name: 'Vinh', longitude: 105.68 }] },
  { name: 'Hà Tĩnh', cities: [{ name: 'Hà Tĩnh', longitude: 105.90 }] },
  { name: 'Quảng Bình', cities: [{ name: 'Đồng Hới', longitude: 106.60 }] },
  { name: 'Quảng Trị', cities: [{ name: 'Đông Hà', longitude: 107.10 }] },
  { name: 'Thừa Thiên Huế', cities: [{ name: 'Huế', longitude: 107.60 }] },
  { name: 'Quảng Nam', cities: [{ name: 'Tam Kỳ', longitude: 108.48 }] },
  { name: 'Quảng Ngãi', cities: [{ name: 'Quảng Ngãi', longitude: 108.80 }] },
  { name: 'Bình Định', cities: [{ name: 'Quy Nhơn', longitude: 109.22 }] },
  { name: 'Phú Yên', cities: [{ name: 'Tuy Hòa', longitude: 109.30 }] },
  { name: 'Khánh Hòa', cities: [{ name: 'Nha Trang', longitude: 109.19 }] },
  { name: 'Ninh Thuận', cities: [{ name: 'Phan Rang', longitude: 108.99 }] },
  { name: 'Bình Thuận', cities: [{ name: 'Phan Thiết', longitude: 108.10 }] },

  // ─── Tây Nguyên ────────────────────────────────────────
  { name: 'Kon Tum', cities: [{ name: 'Kon Tum', longitude: 108.00 }] },
  { name: 'Gia Lai', cities: [{ name: 'Pleiku', longitude: 108.00 }] },
  { name: 'Đắk Lắk', cities: [{ name: 'Buôn Ma Thuột', longitude: 108.05 }] },
  { name: 'Đắk Nông', cities: [{ name: 'Gia Nghĩa', longitude: 107.69 }] },
  { name: 'Lâm Đồng', cities: [{ name: 'Đà Lạt', longitude: 108.44 }] },

  // ─── Miền Nam ──────────────────────────────────────────
  { name: 'Bình Phước', cities: [{ name: 'Đồng Xoài', longitude: 106.90 }] },
  { name: 'Tây Ninh', cities: [{ name: 'Tây Ninh', longitude: 106.11 }] },
  { name: 'Bình Dương', cities: [{ name: 'Thủ Dầu Một', longitude: 106.65 }] },
  { name: 'Đồng Nai', cities: [{ name: 'Biên Hòa', longitude: 106.82 }] },
  { name: 'Bà Rịa - Vũng Tàu', cities: [{ name: 'Vũng Tàu', longitude: 107.08 }] },
  { name: 'Long An', cities: [{ name: 'Tân An', longitude: 106.41 }] },
  { name: 'Tiền Giang', cities: [{ name: 'Mỹ Tho', longitude: 106.36 }] },
  { name: 'Bến Tre', cities: [{ name: 'Bến Tre', longitude: 106.38 }] },
  { name: 'Trà Vinh', cities: [{ name: 'Trà Vinh', longitude: 106.34 }] },
  { name: 'Vĩnh Long', cities: [{ name: 'Vĩnh Long', longitude: 105.97 }] },
  { name: 'Đồng Tháp', cities: [{ name: 'Cao Lãnh', longitude: 105.63 }] },
  { name: 'An Giang', cities: [{ name: 'Long Xuyên', longitude: 105.44 }] },
  { name: 'Kiên Giang', cities: [{ name: 'Rạch Giá', longitude: 105.08 }] },
  { name: 'Hậu Giang', cities: [{ name: 'Vị Thanh', longitude: 105.47 }] },
  { name: 'Sóc Trăng', cities: [{ name: 'Sóc Trăng', longitude: 105.97 }] },
  { name: 'Bạc Liêu', cities: [{ name: 'Bạc Liêu', longitude: 105.72 }] },
  { name: 'Cà Mau', cities: [{ name: 'Cà Mau', longitude: 105.15 }] },
];
