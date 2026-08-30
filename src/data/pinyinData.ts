import type { PinyinInitial, PinyinFinal, ToneQuizItem } from '../types/chinese';

export const PINYIN_INITIALS: PinyinInitial[] = [
  { letter: 'b', pinyin: 'b (bo)', vietnameseApproximation: 'Đọc giống "p" nhẹ tiếng Việt (không bật hơi)', exampleWord: '爸爸', examplePinyin: 'bàba', exampleMeaning: 'bố, ba', type: 'Âm môi' },
  { letter: 'p', pinyin: 'p (po)', vietnameseApproximation: 'Đọc giống "p" nhưng BẬT HƠI thật mạnh', exampleWord: '朋友', examplePinyin: 'péngyou', exampleMeaning: 'bạn bè', type: 'Âm môi' },
  { letter: 'm', pinyin: 'm (mo)', vietnameseApproximation: 'Đọc giống "m" tiếng Việt', exampleWord: '妈妈', examplePinyin: 'māma', exampleMeaning: 'mẹ', type: 'Âm môi' },
  { letter: 'f', pinyin: 'f (fo)', vietnameseApproximation: 'Đọc giống "ph" tiếng Việt', exampleWord: '服务员', examplePinyin: 'fúwùyuán', exampleMeaning: 'phục vụ', type: 'Âm môi' },
  { letter: 'd', pinyin: 'd (de)', vietnameseApproximation: 'Đọc giống "t" tiếng Việt (không bật hơi)', exampleWord: '大', examplePinyin: 'dà', exampleMeaning: 'to, lớn', type: 'Âm đầu lưỡi' },
  { letter: 't', pinyin: 't (te)', vietnameseApproximation: 'Đọc giống "th" tiếng Việt (BẬT HƠI)', exampleWord: '天气', examplePinyin: 'tiānqì', exampleMeaning: 'thời tiết', type: 'Âm đầu lưỡi' },
  { letter: 'n', pinyin: 'n (ne)', vietnameseApproximation: 'Đọc giống "n" tiếng Việt', exampleWord: '你好', examplePinyin: 'nǐ hǎo', exampleMeaning: 'xin chào', type: 'Âm đầu lưỡi' },
  { letter: 'l', pinyin: 'l (le)', vietnameseApproximation: 'Đọc giống "l" tiếng Việt', exampleWord: '老师', examplePinyin: 'lǎoshī', exampleMeaning: 'thầy cô giáo', type: 'Âm đầu lưỡi' },
  { letter: 'g', pinyin: 'g (ge)', vietnameseApproximation: 'Đọc giống "c/k" tiếng Việt (không bật hơi)', exampleWord: '哥哥', examplePinyin: 'gēge', exampleMeaning: 'anh trai', type: 'Âm cuống lưỡi' },
  { letter: 'k', pinyin: 'k (ke)', vietnameseApproximation: 'Đọc giống "kh" tiếng Việt (BẬT HƠI)', exampleWord: '看', examplePinyin: 'kàn', exampleMeaning: 'nhìn, xem', type: 'Âm cuống lưỡi' },
  { letter: 'h', pinyin: 'h (he)', vietnameseApproximation: 'Đọc giữa âm "h" và "kh" nhẹ tiếng Việt', exampleWord: '喝茶', examplePinyin: 'hē chá', exampleMeaning: 'uống trà', type: 'Âm cuống lưỡi' },
  { letter: 'j', pinyin: 'j (ji)', vietnameseApproximation: 'Đọc giống "ch" tiếng Việt (mép môi bẹt)', exampleWord: '机场', examplePinyin: 'jīchǎng', exampleMeaning: 'sân bay', type: 'Âm mặt lưỡi' },
  { letter: 'q', pinyin: 'q (qi)', vietnameseApproximation: 'Đọc giống "ch" nhưng BẬT HƠI thật mạnh', exampleWord: '请问', examplePinyin: 'qǐngwèn', exampleMeaning: 'xin hỏi', type: 'Âm mặt lưỡi' },
  { letter: 'x', pinyin: 'x (xi)', vietnameseApproximation: 'Đọc giống "x" tiếng Việt (mép bẹt nhẹ)', exampleWord: '谢谢', examplePinyin: 'xièxie', exampleMeaning: 'cảm ơn', type: 'Âm mặt lưỡi' },
  { letter: 'zh', pinyin: 'zh (zhi)', vietnameseApproximation: 'Uốn cong đầu lưỡi chạm vòm họng, đọc giống "tr" (không bật hơi)', exampleWord: '中国', examplePinyin: 'Zhōngguó', exampleMeaning: 'Trung Quốc', type: 'Âm uốn lưỡi' },
  { letter: 'ch', pinyin: 'ch (chi)', vietnameseApproximation: 'Uốn cong đầu lưỡi, đọc giống "tr" BẬT HƠI mạnh', exampleWord: '吃饭', examplePinyin: 'chī fàn', exampleMeaning: 'ăn cơm', type: 'Âm uốn lưỡi' },
  { letter: 'sh', pinyin: 'sh (shi)', vietnameseApproximation: 'Uốn cong đầu lưỡi, đọc giống "s" nặng tiếng Việt', exampleWord: '什么是', examplePinyin: 'shénme shì', exampleMeaning: 'là cái gì', type: 'Âm uốn lưỡi' },
  { letter: 'r', pinyin: 'r (ri)', vietnameseApproximation: 'Uốn cong đầu lưỡi, đọc giống "r" miền Nam nhẹ', exampleWord: '热', examplePinyin: 'rè', exampleMeaning: 'nóng', type: 'Âm uốn lưỡi' },
  { letter: 'z', pinyin: 'z (zi)', vietnameseApproximation: 'Đầu lưỡi thẳng chạm răng, đọc giống "ch" nhẹ lướt', exampleWord: '在', examplePinyin: 'zài', exampleMeaning: 'ở, tại', type: 'Âm răng trước' },
  { letter: 'c', pinyin: 'c (ci)', vietnameseApproximation: 'Đầu lưỡi thẳng, đọc bật hơi "x-th" sắc nét', exampleWord: '菜', examplePinyin: 'cài', exampleMeaning: 'món ăn, rau', type: 'Âm răng trước' },
  { letter: 's', pinyin: 's (si)', vietnameseApproximation: 'Đầu lưỡi thẳng, đọc giống "x" nhẹ tiếng Việt', exampleWord: '四', examplePinyin: 'sì', exampleMeaning: 'số 4', type: 'Âm răng trước' },
];

export const PINYIN_FINALS: PinyinFinal[] = [
  { letter: 'a', pinyin: 'a', vietnameseApproximation: 'Đọc giống "a" tiếng Việt', exampleWord: '爸', examplePinyin: 'bà', exampleMeaning: 'ba', type: 'Vận mẫu đơn' },
  { letter: 'o', pinyin: 'o', vietnameseApproximation: 'Đọc tròn môi giống "ô/ua" nhẹ', exampleWord: '波', examplePinyin: 'bō', exampleMeaning: 'sóng', type: 'Vận mẫu đơn' },
  { letter: 'e', pinyin: 'e', vietnameseApproximation: 'Đọc giống âm "ưa/ơ" tiếng Việt', exampleWord: '喝', examplePinyin: 'hē', exampleMeaning: 'uống', type: 'Vận mẫu đơn' },
  { letter: 'i', pinyin: 'i', vietnameseApproximation: 'Đọc giống "i" (khi đi với z,c,s,zh,ch,sh đọc là "ư")', exampleWord: '你', examplePinyin: 'nǐ', exampleMeaning: 'bạn', type: 'Vận mẫu đơn' },
  { letter: 'u', pinyin: 'u', vietnameseApproximation: 'Đọc giống "u" tiếng Việt tròn môi', exampleWord: '五', examplePinyin: 'wǔ', exampleMeaning: 'số 5', type: 'Vận mẫu đơn' },
  { letter: 'ü', pinyin: 'ü', vietnameseApproximation: 'Khẩu hình chữ "u" nhưng phát âm ra "uy"', exampleWord: '绿', examplePinyin: 'lǜ', exampleMeaning: 'màu xanh lá', type: 'Vận mẫu đơn' },
  { letter: 'ai', pinyin: 'ai', vietnameseApproximation: 'Đọc giống "ai" tiếng Việt', exampleWord: '爱', examplePinyin: 'ài', exampleMeaning: 'yêu', type: 'Vận mẫu kép' },
  { letter: 'ei', pinyin: 'ei', vietnameseApproximation: 'Đọc giống "ây" tiếng Việt', exampleWord: '杯', examplePinyin: 'bēi', exampleMeaning: 'cốc, ly', type: 'Vận mẫu kép' },
  { letter: 'ao', pinyin: 'ao', vietnameseApproximation: 'Đọc giống "ao" tiếng Việt', exampleWord: '高', examplePinyin: 'gāo', exampleMeaning: 'cao', type: 'Vận mẫu kép' },
  { letter: 'ou', pinyin: 'ou', vietnameseApproximation: 'Đọc giống "âu" tiếng Việt', exampleWord: '狗', examplePinyin: 'gǒu', exampleMeaning: 'chó', type: 'Vận mẫu kép' },
  { letter: 'an', pinyin: 'an', vietnameseApproximation: 'Đọc giống "an" tiếng Việt', exampleWord: '看', examplePinyin: 'kàn', exampleMeaning: 'nhìn, xem', type: 'Vận mẫu mũi' },
  { letter: 'en', pinyin: 'en', vietnameseApproximation: 'Đọc giống "ân" tiếng Việt', exampleWord: '很', examplePinyin: 'hěn', exampleMeaning: 'rất', type: 'Vận mẫu mũi' },
  { letter: 'ang', pinyin: 'ang', vietnameseApproximation: 'Đọc giống "ang" mở rộng vòm miệng', exampleWord: '忙', examplePinyin: 'máng', exampleMeaning: 'bận', type: 'Vận mẫu mũi' },
  { letter: 'eng', pinyin: 'eng', vietnameseApproximation: 'Đọc giống "âng" tiếng Việt', exampleWord: '能', examplePinyin: 'néng', exampleMeaning: 'có thể', type: 'Vận mẫu mũi' },
  { letter: 'ong', pinyin: 'ong', vietnameseApproximation: 'Đọc giống "ung" tiếng Việt tròn môi', exampleWord: '红', examplePinyin: 'hóng', exampleMeaning: 'màu đỏ', type: 'Vận mẫu mũi' },
];

export const TONES_GUIDE = [
  {
    toneNumber: 1,
    name: 'Thanh 1 (Âm Bình - 阴平)',
    mark: '¯ (mā)',
    pitch: '5-5 (Cao & Bằng phẳng)',
    description: 'Cao độ 5-5. Đọc giọng cao, ngân đều và phẳng, giữ âm lượng ổn định từ đầu đến cuối như tiếng ngân nốt nhạc.',
    example: '妈 (mā - Mẹ)',
    vietnameseAnalogy: 'Tương đương thanh Ngang trong tiếng Việt nhưng đọc CAO và DÀI hơn.'
  },
  {
    toneNumber: 2,
    name: 'Thanh 2 (Dương Bình - 阳平)',
    mark: 'ˊ (má)',
    pitch: '3-5 (Vút lên cao)',
    description: 'Bắt đầu từ cao độ 3 vút thẳng lên cao độ 5. Giống giọng ngạc nhiên hỏi: "Hả?", "Gì cơ?".',
    example: '麻 (má - Cây gai/Tê dại)',
    vietnameseAnalogy: 'Tương đương dấu Sắc trong tiếng Việt nhưng vút lên thanh thoát hơn.'
  },
  {
    toneNumber: 3,
    name: 'Thanh 3 (Thượng Thanh - 上声)',
    mark: 'ˇ (mǎ)',
    pitch: '2-1-4 (Trầm xuống rồi lên)',
    description: 'Bắt đầu ở mức 2, hạ thấp xuống đáy 1 rồi hơi vút lên 4. Khi đứng trước thanh khác, chỉ cần đọc nửa đầu (2-1).',
    example: '马 (mǎ - Con ngựa)',
    vietnameseAnalogy: 'Gần giống dấu Hỏi tiếng Việt nhưng kéo dài hơn và có đoạn nhấn trầm sâu.'
  },
  {
    toneNumber: 4,
    name: 'Thanh 4 (Khứ Thanh - 去声)',
    mark: 'ˋ (mà)',
    pitch: '5-1 (Rơi mạnh dứt khoát)',
    description: 'Từ đỉnh cao độ 5 rơi thật nhanh và dứt khoát xuống đáy 1. Giọng mạnh mẽ, dứt khoát như ra lệnh!',
    example: '骂 (mà - Mắng, chửi)',
    vietnameseAnalogy: 'Giống dấu Huyền nhưng đọc DỨT KHOÁT, MẠNH MẼ như đang giậm chân.'
  }
];

export const TONE_QUIZ_ITEMS: ToneQuizItem[] = [
  { id: 'tq1', character: '妈', pinyinWithTone: 'mā', pinyinWithoutTone: 'ma', correctTone: 1, sinoVietnamese: 'Mã', meaning: 'Mẹ', tip: 'Thanh 1 đọc cao và giữ phẳng: mā' },
  { id: 'tq2', character: '麻', pinyinWithTone: 'má', pinyinWithoutTone: 'ma', correctTone: 2, sinoVietnamese: 'Ma', meaning: 'Tê dại / Vải gai', tip: 'Thanh 2 vút lên như dấu sắc: má' },
  { id: 'tq3', character: '马', pinyinWithTone: 'mǎ', pinyinWithoutTone: 'ma', correctTone: 3, sinoVietnamese: 'Mã', meaning: 'Con ngựa', tip: 'Thanh 3 trầm xuống rồi bật lên: mǎ' },
  { id: 'tq4', character: '骂', pinyinWithTone: 'mà', pinyinWithoutTone: 'ma', correctTone: 4, sinoVietnamese: 'Mạ', meaning: 'Mắng / chửi', tip: 'Thanh 4 rơi dứt khoát từ cao xuống thấp: mà' },
  { id: 'tq5', character: '好', pinyinWithTone: 'hǎo', pinyinWithoutTone: 'hao', correctTone: 3, sinoVietnamese: 'Hảo', meaning: 'Tốt / Đẹp', tip: 'hǎo là thanh 3' },
  { id: 'tq6', character: '去', pinyinWithTone: 'qù', pinyinWithoutTone: 'qu', correctTone: 4, sinoVietnamese: 'Khứ', meaning: 'Đi', tip: 'qù rơi dứt khoát thanh 4' },
  { id: 'tq7', character: '国', pinyinWithTone: 'guó', pinyinWithoutTone: 'guo', correctTone: 2, sinoVietnamese: 'Quốc', meaning: 'Đất nước', tip: 'guó vút lên thanh 2' },
  { id: 'tq8', character: '天', pinyinWithTone: 'tiān', pinyinWithoutTone: 'tian', correctTone: 1, sinoVietnamese: 'Thiên', meaning: 'Trời / Ngày', tip: 'tiān cao phẳng thanh 1' },
  { id: 'tq9', character: '吃', pinyinWithTone: 'chī', pinyinWithoutTone: 'chi', correctTone: 1, sinoVietnamese: 'Ngật', meaning: 'Ăn', tip: 'chī cao phẳng thanh 1' },
  { id: 'tq10', character: '谢', pinyinWithTone: 'xiè', pinyinWithoutTone: 'xie', correctTone: 4, sinoVietnamese: 'Tạ', meaning: 'Cảm ơn', tip: 'xiè rơi nhanh thanh 4' },
];
