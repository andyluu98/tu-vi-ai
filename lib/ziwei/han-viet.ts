/**
 * lib/ziwei/han-viet —— Bảng ánh xạ Hán -> Hán-Việt cho LỚP HIỂN THỊ.
 *
 * Chỉ dùng để render ra tiếng Việt. KHÔNG đổi dữ liệu lá số gốc (thuật toán,
 * nhận diện cách cục, tứ hóa, và serialize gửi cho AI vẫn dùng tên chữ Hán).
 * Mọi hàm đều fallback về chuỗi gốc nếu không tìm thấy -> không bao giờ vỡ UI.
 */

// ─── Thiên can (index khớp constants.STEMS) ─────────────────────
export const STEMS_HV = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];

// ─── Địa chi (index khớp constants.BRANCHES) ────────────────────
export const BRANCHES_HV = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

export const hanVietStem = (i: number): string => STEMS_HV[i] ?? '?';
export const hanVietBranch = (i: number): string => BRANCHES_HV[i] ?? '?';

// Map theo KÝ TỰ can (khi dữ liệu là chữ '甲' thay vì index)
const STEM_CHAR_HV: Record<string, string> = {
  甲: 'Giáp', 乙: 'Ất', 丙: 'Bính', 丁: 'Đinh', 戊: 'Mậu',
  己: 'Kỷ', 庚: 'Canh', 辛: 'Tân', 壬: 'Nhâm', 癸: 'Quý',
};
export const hanVietStemName = (c: string): string => STEM_CHAR_HV[c] ?? c;

// ─── 12 cung ────────────────────────────────────────────────────
const PALACE_HV: Record<string, string> = {
  命宫: 'Mệnh', 兄弟: 'Huynh Đệ', 夫妻: 'Phu Thê', 子女: 'Tử Tức',
  财帛: 'Tài Bạch', 疾厄: 'Tật Ách', 迁移: 'Thiên Di', 仆役: 'Nô Bộc',
  官禄: 'Quan Lộc', 田宅: 'Điền Trạch', 福德: 'Phúc Đức', 父母: 'Phụ Mẫu',
  身宫: 'Thân',
};
export const hanVietPalace = (name: string): string => PALACE_HV[name] ?? name;

// ─── Tứ hóa ─────────────────────────────────────────────────────
const SIHUA_HV: Record<string, string> = { 禄: 'Lộc', 权: 'Quyền', 科: 'Khoa', 忌: 'Kỵ' };
export const hanVietSihua = (s: string): string => SIHUA_HV[s] ?? s;

// ─── Ngũ hành cục (火六局 -> Hỏa lục cục) ────────────────────────
const JU_HV: Record<string, string> = {
  水二局: 'Thủy nhị cục', 木三局: 'Mộc tam cục', 金四局: 'Kim tứ cục',
  土五局: 'Thổ ngũ cục', 火六局: 'Hỏa lục cục',
};
export const hanVietJu = (name: string): string => JU_HV[name] ?? name;

// ─── Độ sáng đa cấp (庙旺利陷 đầy đủ, khác brightness 3 mức bright/normal/dim) ──
const BRIGHTNESS_HV: Record<string, string> = {
  庙: 'miếu', 旺: 'vượng', 得: 'đắc địa', 利: 'lợi ích', 平: 'bình hòa',
  不: 'bất đắc', 陷: 'hãm địa', 地: 'đắc địa', 闲: 'nhàn cung',
};
export const hanVietBrightness = (c: string): string => BRIGHTNESS_HV[c] ?? '';

// ─── Cách cục (格局) ─────────────────────────────────────────────
const PATTERN_HV: Record<string, string> = {
  君臣庆会: 'Quân Thần Khánh Hội', 紫府同宫: 'Tử Phủ Đồng Cung', 府相朝垣: 'Phủ Tướng Triều Viên',
  阳梁昌禄: 'Dương Lương Xương Lộc', 武贪格: 'Vũ Tham Cách', 杀破狼: 'Sát Phá Lang',
  机月同梁: 'Cơ Nguyệt Đồng Lương', 廉贞天相格: 'Liêm Trinh Thiên Tướng Cách', 武曲七杀: 'Vũ Khúc Thất Sát',
  天同天梁格: 'Thiên Đồng Thiên Lương Cách', 日月同宫: 'Nhật Nguyệt Đồng Cung', 日月夹命: 'Nhật Nguyệt Giáp Mệnh',
  巨日同宫: 'Cự Nhật Đồng Cung', 石中隐玉: 'Thạch Trung Ẩn Ngọc', 明珠出海: 'Minh Châu Xuất Hải',
  紫微入命: 'Tử Vi Nhập Mệnh', 辅弼夹命: 'Phụ Bật Giáp Mệnh', 昌曲夹命: 'Xương Khúc Giáp Mệnh',
  魁钺夹命: 'Khôi Việt Giáp Mệnh', 双禄朝垣: 'Song Lộc Triều Viên', 三奇加会: 'Tam Kỳ Gia Hội',
  羊陀夹忌: 'Dương Đà Giáp Kỵ', 火铃夹命: 'Hỏa Linh Giáp Mệnh', 空劫夹命: 'Không Kiếp Giáp Mệnh',
  廉杀羊: 'Liêm Sát Dương', 巨火羊: 'Cự Hỏa Dương', 铃昌陀武: 'Linh Xương Đà Vũ', 马头带箭: 'Mã Đầu Đới Tiễn',
  化禄入财: 'Hóa Lộc Nhập Tài', 化权入官: 'Hóa Quyền Nhập Quan', 机月同梁三星会: 'Cơ Nguyệt Đồng Lương Tam Tinh Hội',
  辅弼同会: 'Phụ Bật Đồng Hội', 魁钺同会: 'Khôi Việt Đồng Hội', 科权双会: 'Khoa Quyền Song Hội',
  禄存守命: 'Lộc Tồn Thủ Mệnh', 禄存守身: 'Lộc Tồn Thủ Thân',
  天马入命: 'Thiên Mã Nhập Mệnh', 天马在迁: 'Thiên Mã Tại Thiên Di',
  化科入命: 'Hóa Khoa Nhập Mệnh', 化科入身: 'Hóa Khoa Nhập Thân',
};
// Hậu tố cách cục động {sao}+cụm (vd 天机化禄入命 → Thiên Cơ Hóa Lộc Nhập Mệnh)
const PATTERN_SUFFIX_HV: Record<string, string> = {
  化禄入命: 'Hóa Lộc Nhập Mệnh', 化忌入命: 'Hóa Kỵ Nhập Mệnh', 化忌入迁: 'Hóa Kỵ Nhập Thiên Di',
};
export const hanVietPattern = (name: string): string => {
  if (PATTERN_HV[name]) return PATTERN_HV[name];
  for (const suf in PATTERN_SUFFIX_HV) {
    if (name.endsWith(suf)) {
      const star = name.slice(0, name.length - suf.length);
      return `${hanVietStar(star)} ${PATTERN_SUFFIX_HV[suf]}`;
    }
  }
  return name;
};

// ─── Sao (chính tinh + phụ + cát + sát + tạp diệu) ──────────────
const STAR_HV: Record<string, string> = {
  // 14 chính tinh
  紫微: 'Tử Vi', 天机: 'Thiên Cơ', 太阳: 'Thái Dương', 武曲: 'Vũ Khúc',
  天同: 'Thiên Đồng', 廉贞: 'Liêm Trinh', 天府: 'Thiên Phủ', 太阴: 'Thái Âm',
  贪狼: 'Tham Lang', 巨门: 'Cự Môn', 天相: 'Thiên Tướng', 天梁: 'Thiên Lương',
  七杀: 'Thất Sát', 破军: 'Phá Quân',
  // Lục cát + phụ tá
  文昌: 'Văn Xương', 文曲: 'Văn Khúc', 左辅: 'Tả Phụ', 右弼: 'Hữu Bật',
  天魁: 'Thiên Khôi', 天钺: 'Thiên Việt', 禄存: 'Lộc Tồn', 天马: 'Thiên Mã',
  // Lục sát
  擎羊: 'Kình Dương', 陀罗: 'Đà La', 火星: 'Hỏa Tinh', 铃星: 'Linh Tinh',
  地空: 'Địa Không', 地劫: 'Địa Kiếp',
  // Tạp diệu
  天官: 'Thiên Quan', 天福: 'Thiên Phúc', 天厨: 'Thiên Trù', 天刑: 'Thiên Hình',
  天姚: 'Thiên Diêu', 解神: 'Giải Thần', 天巫: 'Thiên Vu', 天月: 'Thiên Nguyệt',
  阴煞: 'Âm Sát', 台辅: 'Đài Phụ', 封诰: 'Phong Cáo', 天空: 'Thiên Không',
  旬空: 'Tuần Không', 截空: 'Tiệt Không', 截路: 'Tiệt Lộ', 天哭: 'Thiên Khốc',
  天虚: 'Thiên Hư', 龙池: 'Long Trì', 凤阁: 'Phượng Các', 红鸾: 'Hồng Loan',
  天喜: 'Thiên Hỷ', 孤辰: 'Cô Thần', 寡宿: 'Quả Tú', 蜚廉: 'Phỉ Liêm',
  破碎: 'Phá Toái', 华盖: 'Hoa Cái', 咸池: 'Hàm Trì', 天德: 'Thiên Đức',
  月德: 'Nguyệt Đức', 天才: 'Thiên Tài', 天寿: 'Thiên Thọ', 三台: 'Tam Thai',
  八座: 'Bát Tọa', 恩光: 'Ân Quang', 天贵: 'Thiên Quý', 天伤: 'Thiên Thương',
  天使: 'Thiên Sứ', 大耗: 'Đại Hao', 龙德: 'Long Đức',
  // Vòng Trường Sinh (长生12)
  长生: 'Trường Sinh', 沐浴: 'Mộc Dục', 冠带: 'Quan Đới', 临官: 'Lâm Quan',
  帝旺: 'Đế Vượng', 衰: 'Suy', 病: 'Bệnh', 死: 'Tử', 墓: 'Mộ', 绝: 'Tuyệt',
  胎: 'Thai', 养: 'Dưỡng',
  // Vòng Bác Sĩ (博士12)
  博士: 'Bác Sĩ', 力士: 'Lực Sĩ', 青龙: 'Thanh Long', 小耗: 'Tiểu Hao',
  将军: 'Tướng Quân', 奏书: 'Tấu Thư', 飞廉: 'Phi Liêm', 喜神: 'Hỷ Thần',
  病符: 'Bệnh Phù', 伏兵: 'Phục Binh', 官府: 'Quan Phủ',
  // Thần sát Tướng tiền + Tuế tiền (将前12 / 岁前12)
  将星: 'Tướng Tinh', 攀鞍: 'Phàn Yên', 岁驿: 'Tuế Dịch', 息神: 'Tức Thần',
  劫煞: 'Kiếp Sát', 灾煞: 'Tai Sát', 天煞: 'Thiên Sát', 指背: 'Chỉ Bối',
  月煞: 'Nguyệt Sát', 亡神: 'Vong Thần',
  岁建: 'Tuế Kiến', 晦气: 'Hối Khí', 丧门: 'Tang Môn', 贯索: 'Quán Sách',
  官符: 'Quan Phù', 岁破: 'Tuế Phá', 白虎: 'Bạch Hổ', 吊客: 'Điếu Khách',
  空亡: 'Không Vong', 年解: 'Niên Giải',
};
export const hanVietStar = (name: string): string => STAR_HV[name] ?? name;
