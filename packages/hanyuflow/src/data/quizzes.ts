import type { SentenceQuizItem, ListeningQuizItem } from '../types/chinese';

export const SENTENCE_BUILDER_QUIZZES: SentenceQuizItem[] = [
  {
    id: 'sb-1',
    vietnameseMeaning: 'Xin hỏi quý khách muốn ăn chút gì ạ?',
    hintPinyin: 'Qǐngwèn xiǎng chī diǎn shénme?',
    words: [
      { id: 'w1', hanzi: '请问', pinyin: 'qǐngwèn', sinoVietnamese: 'thỉnh vấn' },
      { id: 'w2', hanzi: '想', pinyin: 'xiǎng', sinoVietnamese: 'tưởng' },
      { id: 'w3', hanzi: '吃', pinyin: 'chī', sinoVietnamese: 'ngật' },
      { id: 'w4', hanzi: '点', pinyin: 'diǎn', sinoVietnamese: 'điểm' },
      { id: 'w5', hanzi: '什么？', pinyin: 'shénme?', sinoVietnamese: 'thập ma' },
    ],
    correctOrder: ['w1', 'w2', 'w3', 'w4', 'w5'],
    explanation: 'Cấu trúc câu hỏi lịch sự khi gọi món: 请问 (Xin hỏi) + 想 (muốn) + 吃 (ăn) + 点 (chút) + 什么 (gì)?'
  },
  {
    id: 'sb-2',
    vietnameseMeaning: 'Đắt quá rồi, bớt một chút đi!',
    hintPinyin: 'Tài guì le, piányi yìdiǎn ba!',
    words: [
      { id: 'w1', hanzi: '太贵了，', pinyin: 'tài guì le,', sinoVietnamese: 'thái quý liễu' },
      { id: 'w2', hanzi: '便宜', pinyin: 'piányi', sinoVietnamese: 'tiện nghi' },
      { id: 'w3', hanzi: '一点', pinyin: 'yìdiǎn', sinoVietnamese: 'nhất điểm' },
      { id: 'w4', hanzi: '吧！', pinyin: 'ba!', sinoVietnamese: 'ba' },
    ],
    correctOrder: ['w1', 'w2', 'w3', 'w4'],
    explanation: 'Cụm từ cửa miệng khi mặc cả: 太贵了 (đắt quá rồi) + 便宜 (rẻ/bớt) + 一点 (một chút) + 吧 (nhé/đi).'
  },
  {
    id: 'sb-3',
    vietnameseMeaning: 'Cứ đi thẳng về phía trước là tới rồi.',
    hintPinyin: 'Yìzhí wǎng qián zǒu jiù dào le.',
    words: [
      { id: 'w1', hanzi: '一直', pinyin: 'yìzhí', sinoVietnamese: 'nhất trực' },
      { id: 'w2', hanzi: '往前走', pinyin: 'wǎng qián zǒu', sinoVietnamese: 'vãng tiền tẩu' },
      { id: 'w3', hanzi: '就', pinyin: 'jiù', sinoVietnamese: 'tựu' },
      { id: 'w4', hanzi: '到了。', pinyin: 'dào le.', sinoVietnamese: 'đáo liễu' },
    ],
    correctOrder: ['w1', 'w2', 'w3', 'w4'],
    explanation: 'Cấu trúc chỉ đường: 一直 (cứ/luôn) + 往前走 (đi về phía trước) + 就到了 (là đến nơi rồi).'
  },
  {
    id: 'sb-4',
    vietnameseMeaning: 'Tôi có thể quét mã WeChat của bạn không?',
    hintPinyin: 'Wǒ kěyǐ sǎo nǐ de wēixìn ma?',
    words: [
      { id: 'w1', hanzi: '我', pinyin: 'wǒ', sinoVietnamese: 'ngã' },
      { id: 'w2', hanzi: '可以', pinyin: 'kěyǐ', sinoVietnamese: 'khả dĩ' },
      { id: 'w3', hanzi: '扫', pinyin: 'sǎo', sinoVietnamese: 'tảo' },
      { id: 'w4', hanzi: '你的', pinyin: 'nǐ de', sinoVietnamese: 'nỉ đích' },
      { id: 'w5', hanzi: '微信', pinyin: 'wēixìn', sinoVietnamese: 'vi tín' },
      { id: 'w6', hanzi: '吗？', pinyin: 'ma?', sinoVietnamese: 'ma' },
    ],
    correctOrder: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6'],
    explanation: 'Tôi (我) + có thể (可以) + quét (扫) + WeChat của bạn (你的微信) + không (吗)?'
  }
];

export const LISTENING_QUIZZES: ListeningQuizItem[] = [
  {
    id: 'lq-1',
    audioText: '服务员，我们要两碗牛肉面，请不要放香菜！',
    pinyin: 'Fúwùyuán, wǒmen yào liǎng wǎn niúròu miàn, qǐng búyào fàng xiāngcài!',
    question: 'Khách hàng trong đoạn hội thoại yêu cầu điều gì đặc biệt?',
    options: [
      { id: 'o1', text: 'Đừng cho quá nhiều ớt cay', isCorrect: false },
      { id: 'o2', text: 'Đừng cho rau mùi (ngò rí)', isCorrect: true },
      { id: 'o3', text: 'Lấy thêm hai đôi đũa', isCorrect: false },
      { id: 'o4', text: 'Mang thêm bát nước dùng', isCorrect: false },
    ],
    explanation: 'Từ "香菜" (xiāngcài) trong tiếng Trung có nghĩa là "rau mùi / ngò rí", "不要放" nghĩa là đừng bỏ vào.'
  },
  {
    id: 'lq-2',
    audioText: '去高铁站坐地铁三号线最快，大概只要十五分钟。',
    pinyin: 'Qù gāotiězhàn zuò dìtiě sān hào xiàn zuì kuài, dàgài zhǐ yào shí wǔ fēnzhōng.',
    question: 'Phương tiện nào đi tới ga đường sắt cao tốc nhanh nhất và mất bao lâu?',
    options: [
      { id: 'o1', text: 'Đi xe buýt tuyến 3, mất 50 phút', isCorrect: false },
      { id: 'o2', text: 'Đi taxi, mất 30 phút', isCorrect: false },
      { id: 'o3', text: 'Đi tàu điện ngầm tuyến số 3, mất khoảng 15 phút', isCorrect: true },
      { id: 'o4', text: 'Đi bộ, mất khoảng 15 phút', isCorrect: false },
    ],
    explanation: '"地铁三号线" là tàu điện ngầm tuyến số 3, "十五分钟" là 15 phút.'
  },
  {
    id: 'lq-3',
    audioText: '您好，您的房间在八楼806号房，早餐时间是早上七点到九点半。',
    pinyin: 'Nín hǎo, nín de fángjiān zài bā lóu bā líng liù hào fáng, zǎocān shíjiān shì zǎoshang qī diǎn dào jiǔ diǎn bàn.',
    question: 'Bữa sáng tại khách sạn phục vụ trong khoảng thời gian nào?',
    options: [
      { id: 'o1', text: '6:00 - 8:00 sáng', isCorrect: false },
      { id: 'o2', text: '7:00 - 9:30 sáng', isCorrect: true },
      { id: 'o3', text: '7:30 - 10:00 sáng', isCorrect: false },
      { id: 'o4', text: '8:00 - 9:00 sáng', isCorrect: false },
    ],
    explanation: '"七点到九点半" có nghĩa là từ 7 giờ đến 9 giờ 30.'
  }
];
