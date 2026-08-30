import type { GameVocabItem } from '../types/game';

export const GAME_VOCAB_POOL: GameVocabItem[] = [
  // HSK 1
  { id: 'gv-1', hanzi: '你好', pinyin: 'nǐ hǎo', sinoVietnamese: 'Nhĩ hảo', meaning: 'Xin chào', hskLevel: 'HSK 1' },
  { id: 'gv-2', hanzi: '谢谢', pinyin: 'xièxie', sinoVietnamese: 'Tạ tạ', meaning: 'Cảm ơn', hskLevel: 'HSK 1' },
  { id: 'gv-3', hanzi: '再见', pinyin: 'zàijiàn', sinoVietnamese: 'Tái kiến', meaning: 'Tạm biệt', hskLevel: 'HSK 1' },
  { id: 'gv-4', hanzi: '吃饭', pinyin: 'chīfàn', sinoVietnamese: 'Ngật phạn', meaning: 'Ăn cơm', hskLevel: 'HSK 1' },
  { id: 'gv-5', hanzi: '喝水', pinyin: 'hē shuǐ', sinoVietnamese: 'Hát thủy', meaning: 'Uống nước', hskLevel: 'HSK 1' },
  { id: 'gv-6', hanzi: '苹果', pinyin: 'píngguǒ', sinoVietnamese: 'Bình quả', meaning: 'Quả táo', hskLevel: 'HSK 1' },
  { id: 'gv-7', hanzi: '多少钱', pinyin: 'duōshao qián', sinoVietnamese: 'Đa thiểu tiền', meaning: 'Bao nhiêu tiền', hskLevel: 'HSK 1' },
  { id: 'gv-8', hanzi: '高兴', pinyin: 'gāoxìng', sinoVietnamese: 'Cao hứng', meaning: 'Vui vẻ', hskLevel: 'HSK 1' },
  { id: 'gv-9', hanzi: '朋友', pinyin: 'péngyou', sinoVietnamese: 'Bằng hữu', meaning: 'Bạn bè', hskLevel: 'HSK 1' },
  { id: 'gv-10', hanzi: '医院', pinyin: 'yīyuàn', sinoVietnamese: 'Y viện', meaning: 'Bệnh viện', hskLevel: 'HSK 1' },
  { id: 'gv-11', hanzi: '中国', pinyin: 'zhōngguó', sinoVietnamese: 'Trung Quốc', meaning: 'Trung Quốc', hskLevel: 'HSK 1' },
  { id: 'gv-12', hanzi: '漂亮', pinyin: 'piàoliang', sinoVietnamese: 'Phiêu lượng', meaning: 'Xinh đẹp', hskLevel: 'HSK 1' },

  // HSK 2
  { id: 'gv-13', hanzi: '便宜', pinyin: 'piányi', sinoVietnamese: 'Tiện nghi', meaning: 'Giá rẻ', hskLevel: 'HSK 2' },
  { id: 'gv-14', hanzi: '机场', pinyin: 'jīchǎng', sinoVietnamese: 'Cơ trường', meaning: 'Sân bay', hskLevel: 'HSK 2' },
  { id: 'gv-15', hanzi: '旅游', pinyin: 'lǚyóu', sinoVietnamese: 'Lữ du', meaning: 'Du lịch', hskLevel: 'HSK 2' },
  { id: 'gv-16', hanzi: '准备', pinyin: 'zhǔnbèi', sinoVietnamese: 'Chuẩn bị', meaning: 'Chuẩn bị', hskLevel: 'HSK 2' },
  { id: 'gv-17', hanzi: '运动', pinyin: 'yùndòng', sinoVietnamese: 'Vận động', meaning: 'Thể thao', hskLevel: 'HSK 2' },
  { id: 'gv-18', hanzi: '帮助', pinyin: 'bāngzhù', sinoVietnamese: 'Bang trợ', meaning: 'Giúp đỡ', hskLevel: 'HSK 2' },
  { id: 'gv-19', hanzi: '手表', pinyin: 'shǒubiǎo', sinoVietnamese: 'Thủ biểu', meaning: 'Đồng hồ đeo tay', hskLevel: 'HSK 2' },
  { id: 'gv-20', hanzi: '游泳', pinyin: 'yóuyǒng', sinoVietnamese: 'Du vịnh', meaning: 'Bơi lội', hskLevel: 'HSK 2' },

  // HSK 3
  { id: 'gv-21', hanzi: '热情', pinyin: 'rèqíng', sinoVietnamese: 'Nhiệt tình', meaning: 'Nhiệt tình', hskLevel: 'HSK 3' },
  { id: 'gv-22', hanzi: '照顾', pinyin: 'zhàogu', sinoVietnamese: 'Chiếu cố', meaning: 'Chăm sóc', hskLevel: 'HSK 3' },
  { id: 'gv-23', hanzi: '满意', pinyin: 'mǎnyì', sinoVietnamese: 'Mãn ý', meaning: 'Hài lòng', hskLevel: 'HSK 3' },
  { id: 'gv-24', hanzi: '环境', pinyin: 'huánjìng', sinoVietnamese: 'Hoàn cảnh', meaning: 'Môi trường', hskLevel: 'HSK 3' },
  { id: 'gv-25', hanzi: '遇到', pinyin: 'yùdào', sinoVietnamese: 'Ngộ đáo', meaning: 'Gặp phải', hskLevel: 'HSK 3' },
  { id: 'gv-26', hanzi: '解决', pinyin: 'jiějué', sinoVietnamese: 'Giải quyết', meaning: 'Giải quyết', hskLevel: 'HSK 3' },
  { id: 'gv-27', hanzi: '经理', pinyin: 'jīnglǐ', sinoVietnamese: 'Kinh lý', meaning: 'Giám đốc / Quản lý', hskLevel: 'HSK 3' },
  { id: 'gv-28', hanzi: '健康', pinyin: 'jiànkāng', sinoVietnamese: 'Kiện khang', meaning: 'Sức khỏe', hskLevel: 'HSK 3' },

  // HSK 4
  { id: 'gv-29', hanzi: '坚持', pinyin: 'jiānchí', sinoVietnamese: 'Kiên trì', meaning: 'Kiên trì', hskLevel: 'HSK 4' },
  { id: 'gv-30', hanzi: '幽默', pinyin: 'yōumò', sinoVietnamese: 'U mặc', meaning: 'Hài hước', hskLevel: 'HSK 4' },
  { id: 'gv-31', hanzi: '勇敢', pinyin: 'yǒnggǎn', sinoVietnamese: 'Dũng cảm', meaning: 'Dũng cảm', hskLevel: 'HSK 4' },
  { id: 'gv-32', hanzi: '精彩', pinyin: 'jīngcǎi', sinoVietnamese: 'Tinh thái', meaning: 'Đặc sắc / Tuyệt vời', hskLevel: 'HSK 4' },
];

export interface GameSentenceQuiz {
  id: string;
  vietnameseMeaning: string;
  hanziFull: string;
  pinyinFull: string;
  words: { id: string; hanzi: string; pinyin: string }[];
  correctOrder: string[];
}

export const GAME_SENTENCE_POOL: GameSentenceQuiz[] = [
  {
    id: 'gs-1',
    vietnameseMeaning: 'Tôi rất vui được làm quen với bạn.',
    hanziFull: '我很高兴认识你。',
    pinyinFull: 'Wǒ hěn gāoxìng rènshi nǐ.',
    words: [
      { id: 'w1', hanzi: '我', pinyin: 'wǒ' },
      { id: 'w2', hanzi: '很高兴', pinyin: 'hěn gāoxìng' },
      { id: 'w3', hanzi: '认识你', pinyin: 'rènshi nǐ' },
    ],
    correctOrder: ['w1', 'w2', 'w3']
  },
  {
    id: 'gs-2',
    vietnameseMeaning: 'Cái áo này bao nhiêu tiền một chiếc?',
    hanziFull: '这件衣服多少钱一件？',
    pinyinFull: 'Zhè jiàn yīfu duōshao qián yí jiàn?',
    words: [
      { id: 'w1', hanzi: '这件', pinyin: 'zhè jiàn' },
      { id: 'w2', hanzi: '衣服', pinyin: 'yīfu' },
      { id: 'w3', hanzi: '多少钱', pinyin: 'duōshao qián' },
      { id: 'w4', hanzi: '一件', pinyin: 'yí jiàn' },
    ],
    correctOrder: ['w1', 'w2', 'w3', 'w4']
  },
  {
    id: 'gs-3',
    vietnameseMeaning: 'Tôi muốn gọi một cốc trà sữa ít đường.',
    hanziFull: '我想点一杯微糖奶茶。',
    pinyinFull: 'Wǒ xiǎng diǎn yì bēi wēitáng nǎichá.',
    words: [
      { id: 'w1', hanzi: '我想', pinyin: 'wǒ xiǎng' },
      { id: 'w2', hanzi: '点一杯', pinyin: 'diǎn yì bēi' },
      { id: 'w3', hanzi: '微糖', pinyin: 'wēitáng' },
      { id: 'w4', hanzi: '奶茶', pinyin: 'nǎichá' },
    ],
    correctOrder: ['w1', 'w2', 'w3', 'w4']
  },
  {
    id: 'gs-4',
    vietnameseMeaning: 'Càng ngày tiếng Trung của anh ấy càng lưu loát.',
    hanziFull: '他的汉语说得越来越流利。',
    pinyinFull: 'Tā de hànyǔ shuō de yuè lái yuè liúlì.',
    words: [
      { id: 'w1', hanzi: '他的汉语', pinyin: 'tā de hànyǔ' },
      { id: 'w2', hanzi: '说得', pinyin: 'shuō de' },
      { id: 'w3', hanzi: '越来越', pinyin: 'yuè lái yuè' },
      { id: 'w4', hanzi: '流利', pinyin: 'liúlì' },
    ],
    correctOrder: ['w1', 'w2', 'w3', 'w4']
  },
  {
    id: 'gs-5',
    vietnameseMeaning: 'Xin bạn hãy nộp bài tập cho giáo viên.',
    hanziFull: '请你把作业交给老师。',
    pinyinFull: 'Qǐng nǐ bǎ zuòyè jiāo gěi lǎoshī.',
    words: [
      { id: 'w1', hanzi: '请你', pinyin: 'qǐng nǐ' },
      { id: 'w2', hanzi: '把', pinyin: 'bǎ' },
      { id: 'w3', hanzi: '作业', pinyin: 'zuòyè' },
      { id: 'w4', hanzi: '交给老师', pinyin: 'jiāo gěi lǎoshī' },
    ],
    correctOrder: ['w1', 'w2', 'w3', 'w4']
  }
];
