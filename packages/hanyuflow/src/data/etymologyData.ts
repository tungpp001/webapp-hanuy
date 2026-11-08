export interface CharacterRadical {
  radical: string;
  name: string;
  meaning: string;
  pinyin: string;
}

export interface CharacterEtymology {
  char: string;
  pinyin: string;
  sinoVietnamese: string;
  meaning: string;
  strokeCount: number;
  radicals: CharacterRadical[];
  mnemonic: string; // Mẹo nhớ chiết tự
  breakdown: string; // Phân tích cấu tạo
  words: { hanzi: string; pinyin: string; meaning: string }[];
}

export const ETYMOLOGY_DATABASE: Record<string, CharacterEtymology> = {
  '休': {
    char: '休',
    pinyin: 'xiū',
    sinoVietnamese: 'Hưu',
    meaning: 'Nghỉ ngơi, ngừng lại',
    strokeCount: 6,
    radicals: [
      { radical: '亻', name: 'Bộ Nhân đứng', meaning: 'Người', pinyin: 'rén' },
      { radical: '木', name: 'Bộ Mộc', meaning: 'Cây cối', pinyin: 'mù' }
    ],
    breakdown: '亻 (Người) + 木 (Cây)',
    mnemonic: 'Hình ảnh một người (亻) mệt mỏi tựa lưng vào gốc cây (木) để nghỉ ngơi (休).',
    words: [
      { hanzi: '休息', pinyin: 'xiūxi', meaning: 'Nghỉ ngơi' },
      { hanzi: '休假', pinyin: 'xiūjià', meaning: 'Nghỉ phép' },
      { hanzi: '退休', pinyin: 'tuìxiū', meaning: 'Nghỉ hưu' }
    ]
  },
  '明': {
    char: '明',
    pinyin: 'míng',
    sinoVietnamese: 'Minh',
    meaning: 'Sáng sủa, thông minh, ngày mai',
    strokeCount: 8,
    radicals: [
      { radical: '日', name: 'Bộ Nhật', meaning: 'Mặt trời, ngày', pinyin: 'rì' },
      { radical: '月', name: 'Bộ Nguyệt', meaning: 'Mặt trăng, tháng', pinyin: 'yuè' }
    ],
    breakdown: '日 (Mặt trời) + 月 (Mặt trăng)',
    mnemonic: 'Khi Mặt trời (日) và Mặt trăng (月) cùng chiếu rọi thì vạn vật đều bừng sáng (明).',
    words: [
      { hanzi: '明天', pinyin: 'míngtiān', meaning: 'Ngày mai' },
      { hanzi: '明白', pinyin: 'míngbai', meaning: 'Hiểu rõ' },
      { hanzi: '聪明', pinyin: 'cōngmíng', meaning: 'Thông minh' }
    ]
  },
  '好': {
    char: '好',
    pinyin: 'hǎo',
    sinoVietnamese: 'Hảo',
    meaning: 'Tốt, đẹp, thích',
    strokeCount: 6,
    radicals: [
      { radical: '女', name: 'Bộ Nữ', meaning: 'Người phụ nữ', pinyin: 'nǚ' },
      { radical: '子', name: 'Bộ Tử', meaning: 'Con cái, đứa trẻ', pinyin: 'zǐ' }
    ],
    breakdown: '女 (Phụ nữ, mẹ) + 子 (Con cái)',
    mnemonic: 'Người phụ nữ (女) có con cái (子) sum vầy là điều tốt đẹp, hạnh phúc viên mãn (好).',
    words: [
      { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'Xin chào' },
      { hanzi: '好朋友', pinyin: 'hǎo péngyou', meaning: 'Bạn tốt' },
      { hanzi: '爱好', pinyin: 'àihào', meaning: 'Sở thích' }
    ]
  },
  '学': {
    char: '学',
    pinyin: 'xué',
    sinoVietnamese: 'Học',
    meaning: 'Học tập, trường học',
    strokeCount: 8,
    radicals: [
      { radical: '冖', name: 'Bộ Mịch', meaning: 'Mái nhà che phủ', pinyin: 'mì' },
      { radical: '子', name: 'Bộ Tử', meaning: 'Đứa trẻ', pinyin: 'zǐ' }
    ],
    breakdown: '⺌ (Bút nghiên) + 冖 (Mái trường) + 子 (Đứa trẻ)',
    mnemonic: 'Đứa trẻ (子) ngồi dưới mái trường (冖) rèn luyện sách vở bút nghiên chính là Học (学).',
    words: [
      { hanzi: '学习', pinyin: 'xuéxí', meaning: 'Học tập' },
      { hanzi: '学校', pinyin: 'xuéxiào', meaning: 'Trường học' },
      { hanzi: '学生', pinyin: 'xuéshēng', meaning: 'Học sinh' }
    ]
  },
  '家': {
    char: '家',
    pinyin: 'jiā',
    sinoVietnamese: 'Gia',
    meaning: 'Nhà, gia đình',
    strokeCount: 10,
    radicals: [
      { radical: '宀', name: 'Bộ Miên', meaning: 'Mái nhà', pinyin: 'mián' },
      { radical: '豕', name: 'Bộ Thỉ', meaning: 'Con lợn/heo', pinyin: 'shǐ' }
    ],
    breakdown: '宀 (Mái nhà) + 豕 (Heo/lợn)',
    mnemonic: 'Thời xưa, dưới mái nhà (宀) nuôi gia súc (豕) thể hiện một mái ấm sung túc, no đủ (家).',
    words: [
      { hanzi: '大家', pinyin: 'dàjiā', meaning: 'Mọi người' },
      { hanzi: '国家', pinyin: 'guójiā', meaning: 'Quốc gia' },
      { hanzi: '回家', pinyin: 'huíjiā', meaning: 'Về nhà' }
    ]
  },
  '谢': {
    char: '谢',
    pinyin: 'xiè',
    sinoVietnamese: 'Tạ',
    meaning: 'Cảm ơn, tạ lỗi',
    strokeCount: 12,
    radicals: [
      { radical: '讠', name: 'Bộ Ngôn', meaning: 'Lời nói', pinyin: 'yán' },
      { radical: '身', name: 'Bộ Thân', meaning: 'Thân thể', pinyin: 'shēn' },
      { radical: '寸', name: 'Bộ Thốn', meaning: 'Tấc, tấc lòng', pinyin: 'cùn' }
    ],
    breakdown: '讠 (Lời nói) + 身 (Cả người) + 寸 (Tấc lòng)',
    mnemonic: 'Dùng lời nói (讠) cùng toàn thân (身) cúi chào với tấm lòng (寸) để bày tỏ lời cảm ơn (谢).',
    words: [
      { hanzi: '谢谢', pinyin: 'xièxie', meaning: 'Cảm ơn' },
      { hanzi: '感谢', pinyin: 'gǎnxiè', meaning: 'Cảm tạ' }
    ]
  },
  '看': {
    char: '看',
    pinyin: 'kàn',
    sinoVietnamese: 'Khán',
    meaning: 'Xem, nhìn, trông nom',
    strokeCount: 9,
    radicals: [
      { radical: '手', name: 'Bộ Thủ', meaning: 'Bàn tay', pinyin: 'shǒu' },
      { radical: '目', name: 'Bộ Mục', meaning: 'Mắt', pinyin: 'mù' }
    ],
    breakdown: '⺿ (Bàn tay biến thể) + 目 (Con mắt)',
    mnemonic: 'Đặt bàn tay (手) lên phía trên trán che bớt nắng cho mắt (目) để nhìn xa (看).',
    words: [
      { hanzi: '看见', pinyin: 'kànjiàn', meaning: 'Nhìn thấy' },
      { hanzi: '好看', pinyin: 'hǎokàn', meaning: 'Đẹp mắt' },
      { hanzi: '看书', pinyin: 'kànshū', meaning: 'Đọc sách' }
    ]
  },
  '听': {
    char: '听',
    pinyin: 'tīng',
    sinoVietnamese: 'Thính',
    meaning: 'Nghe, vâng lời',
    strokeCount: 7,
    radicals: [
      { radical: '口', name: 'Bộ Khẩu', meaning: 'Miệng', pinyin: 'kǒu' },
      { radical: '斤', name: 'Bộ Cân', meaning: 'Chiếc rìu, cân lượng', pinyin: 'jīn' }
    ],
    breakdown: '口 (Miệng) + 斤 (Đo lường)',
    mnemonic: 'Dùng tai nghe những lời từ miệng (口) nói ra và cân nhắc (斤) suy xét (听).',
    words: [
      { hanzi: '听力', pinyin: 'tīnglì', meaning: 'Kỹ năng nghe' },
      { hanzi: '听说', pinyin: 'tīngshuō', meaning: 'Nghe nói' },
      { hanzi: '好听', pinyin: 'hǎotīng', meaning: 'Hay (âm thanh)' }
    ]
  },
  '语': {
    char: '语',
    pinyin: 'yǔ',
    sinoVietnamese: 'Ngữ',
    meaning: 'Ngôn ngữ, lời nói',
    strokeCount: 9,
    radicals: [
      { radical: '讠', name: 'Bộ Ngôn', meaning: 'Lời nói', pinyin: 'yán' },
      { radical: '五', name: 'Số 5', meaning: 'Năm', pinyin: 'wǔ' },
      { radical: '口', name: 'Bộ Khẩu', meaning: 'Miệng', pinyin: 'kǒu' }
    ],
    breakdown: '讠 (Lời nói) + 吾 (Tôi, ta = 五 + 口)',
    mnemonic: 'Lời nói (讠) phát ra từ miệng chính bản thân ta (吾) chính là Ngôn ngữ (语).',
    words: [
      { hanzi: '汉语', pinyin: 'Hànyǔ', meaning: 'Hán ngữ, tiếng Trung' },
      { hanzi: '语言', pinyin: 'yǔyán', meaning: 'Ngôn ngữ' },
      { hanzi: '外语', pinyin: 'wàiyǔ', meaning: 'Ngoại ngữ' }
    ]
  },
  '想': {
    char: '想',
    pinyin: 'xiǎng',
    sinoVietnamese: 'Tưởng',
    meaning: 'Nghĩ, muốn, nhớ nhung',
    strokeCount: 13,
    radicals: [
      { radical: '木', name: 'Bộ Mộc', meaning: 'Cây', pinyin: 'mù' },
      { radical: '目', name: 'Bộ Mục', meaning: 'Mắt', pinyin: 'mù' },
      { radical: '心', name: 'Bộ Tâm', meaning: 'Trái tim', pinyin: 'xīn' }
    ],
    breakdown: '相 (Tương hỗ, ngắm nhìn) + 心 (Tấm lòng, trái tim)',
    mnemonic: 'Mắt nhìn về phương xa và trong tim (心) luôn hướng về ai đó chính là Tương tư, Nhớ nhung (想).',
    words: [
      { hanzi: '想法', pinyin: 'xiǎngfǎ', meaning: 'Suy nghĩ, ý tưởng' },
      { hanzi: '想要', pinyin: 'xiǎngyào', meaning: 'Muốn có' },
      { hanzi: '想念', pinyin: 'xiǎngniàn', meaning: 'Nhớ nhung' }
    ]
  }
};

/**
 * Get etymology info or generate intelligent fallback
 */
export const getCharacterEtymology = (char: string): CharacterEtymology => {
  if (ETYMOLOGY_DATABASE[char]) {
    return ETYMOLOGY_DATABASE[char];
  }

  // Fallback representation
  return {
    char,
    pinyin: '—',
    sinoVietnamese: '—',
    meaning: `Chữ Hán: ${char}`,
    strokeCount: char.length > 0 ? char.charCodeAt(0) % 15 + 3 : 6,
    radicals: [
      { radical: '🀄', name: 'Chữ Hán chuẩn', meaning: 'Cấu tạo khối vuông', pinyin: 'zì' }
    ],
    breakdown: `Chữ Hán đơn lập [${char}]`,
    mnemonic: `Chữ Hán "${char}" được tạo thành từ các nét bút truyền thống mang đậm văn hóa tượng hình phương Đông.`,
    words: [
      { hanzi: `${char}语`, pinyin: '', meaning: 'Từ vựng tiếng Trung liên quan' }
    ]
  };
};
