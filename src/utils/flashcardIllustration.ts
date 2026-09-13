import type { FlashcardItem } from '../types/flashcard';

export interface IllustrationInfo {
  imageUrl?: string;
  emoji: string;
  bgGradient: string;
  badgeColor: string;
  theme: string;
}

// Curated high quality illustrations / photos for common vocabulary
const WORD_ILLUSTRATION_MAP: Record<string, { imageUrl?: string; emoji: string; bgGradient: string }> = {
  // HSK 1 Core
  '苹果': {
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80',
    emoji: '🍎',
    bgGradient: 'from-rose-500 to-red-600'
  },
  '飞机': {
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&auto=format&fit=crop&q=80',
    emoji: '✈️',
    bgGradient: 'from-sky-500 to-blue-600'
  },
  '出租车': {
    imageUrl: 'https://images.unsplash.com/photo-1556122071-e404eaedb77f?w=400&auto=format&fit=crop&q=80',
    emoji: '🚕',
    bgGradient: 'from-amber-400 to-orange-500'
  },
  '书': {
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    emoji: '📚',
    bgGradient: 'from-amber-600 to-amber-800'
  },
  '茶': {
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
    emoji: '🍵',
    bgGradient: 'from-emerald-500 to-teal-700'
  },
  '猫': {
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80',
    emoji: '🐱',
    bgGradient: 'from-amber-400 to-orange-400'
  },
  '狗': {
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80',
    emoji: '🐶',
    bgGradient: 'from-stone-500 to-stone-700'
  },
  '衣服': {
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&auto=format&fit=crop&q=80',
    emoji: '👗',
    bgGradient: 'from-indigo-500 to-purple-600'
  },
  '医院': {
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&auto=format&fit=crop&q=80',
    emoji: '🏥',
    bgGradient: 'from-cyan-500 to-blue-600'
  },
  '火车站': {
    imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&auto=format&fit=crop&q=80',
    emoji: '🚉',
    bgGradient: 'from-slate-600 to-slate-800'
  },
  '学校': {
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&auto=format&fit=crop&q=80',
    emoji: '🏫',
    bgGradient: 'from-blue-500 to-indigo-600'
  },
  '老师': {
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&auto=format&fit=crop&q=80',
    emoji: '👩‍🏫',
    bgGradient: 'from-teal-500 to-emerald-600'
  },
  '学生': {
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&auto=format&fit=crop&q=80',
    emoji: '👨‍🎓',
    bgGradient: 'from-sky-500 to-indigo-500'
  },
  '下雨': {
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400&auto=format&fit=crop&q=80',
    emoji: '🌧️',
    bgGradient: 'from-blue-600 to-slate-700'
  },
  '水': {
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&auto=format&fit=crop&q=80',
    emoji: '💧',
    bgGradient: 'from-sky-400 to-cyan-600'
  },
  '米饭': {
    imageUrl: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&auto=format&fit=crop&q=80',
    emoji: '🍚',
    bgGradient: 'from-amber-400 to-orange-500'
  },
  '看书': {
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
    emoji: '📖',
    bgGradient: 'from-amber-600 to-stone-700'
  },
  '电脑': {
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&auto=format&fit=crop&q=80',
    emoji: '💻',
    bgGradient: 'from-slate-700 to-slate-900'
  },
  '电影': {
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80',
    emoji: '🎬',
    bgGradient: 'from-rose-600 to-purple-800'
  },
  '听音乐': {
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    emoji: '🎧',
    bgGradient: 'from-violet-500 to-indigo-700'
  },

  // HSK 2 Core
  '便宜': {
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&auto=format&fit=crop&q=80',
    emoji: '🏷️',
    bgGradient: 'from-emerald-500 to-teal-600'
  },
  '机场': {
    imageUrl: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=400&auto=format&fit=crop&q=80',
    emoji: '🛫',
    bgGradient: 'from-sky-500 to-blue-700'
  },
  '旅游': {
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&auto=format&fit=crop&q=80',
    emoji: '🧳',
    bgGradient: 'from-amber-500 to-rose-500'
  },
  '手表': {
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&auto=format&fit=crop&q=80',
    emoji: '⌚',
    bgGradient: 'from-stone-600 to-stone-800'
  },
  '游泳': {
    imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&auto=format&fit=crop&q=80',
    emoji: '🏊',
    bgGradient: 'from-cyan-500 to-blue-600'
  },
  '唱歌': {
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
    emoji: '🎤',
    bgGradient: 'from-rose-500 to-purple-600'
  },
  '跳舞': {
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    emoji: '💃',
    bgGradient: 'from-pink-500 to-rose-600'
  },
  '生病': {
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop&q=80',
    emoji: '🤒',
    bgGradient: 'from-amber-500 to-red-500'
  },
  '药': {
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
    emoji: '💊',
    bgGradient: 'from-emerald-500 to-teal-600'
  },
  '宾馆': {
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=80',
    emoji: '🏨',
    bgGradient: 'from-amber-600 to-stone-800'
  },

  // HSK 3 - 6 Essential Concepts
  '环境': {
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&auto=format&fit=crop&q=80',
    emoji: '🌿',
    bgGradient: 'from-emerald-600 to-teal-700'
  },
  '努力': {
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&auto=format&fit=crop&q=80',
    emoji: '💪',
    bgGradient: 'from-orange-500 to-amber-600'
  },
  '发现': {
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=400&auto=format&fit=crop&q=80',
    emoji: '🔍',
    bgGradient: 'from-blue-500 to-indigo-600'
  },
  '竞争': {
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=80',
    emoji: '🏆',
    bgGradient: 'from-red-500 to-amber-600'
  },
  '交流': {
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop&q=80',
    emoji: '💬',
    bgGradient: 'from-cyan-500 to-blue-600'
  },
  '保护': {
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80',
    emoji: '🛡️',
    bgGradient: 'from-teal-500 to-emerald-700'
  },
  '潜移默化': {
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&auto=format&fit=crop&q=80',
    emoji: '🌱',
    bgGradient: 'from-indigo-600 to-purple-800'
  },
  '举世闻名': {
    imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&auto=format&fit=crop&q=80',
    emoji: '🏯',
    bgGradient: 'from-red-600 to-amber-700'
  },
  '同舟共济': {
    imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&auto=format&fit=crop&q=80',
    emoji: '🤝',
    bgGradient: 'from-sky-600 to-indigo-700'
  }
};

// Fallback category visual themes
const CATEGORY_THEMES: Record<string, { emoji: string; bgGradient: string; badgeColor: string }> = {
  'Đồ ăn & Thức uống': { emoji: '🍜', bgGradient: 'from-amber-500 to-orange-600', badgeColor: 'bg-amber-100 text-amber-800' },
  'Ẩm thực': { emoji: '🥢', bgGradient: 'from-amber-500 to-orange-600', badgeColor: 'bg-amber-100 text-amber-800' },
  'Gia đình & Xưng hô': { emoji: '👨‍👩‍👧', bgGradient: 'from-rose-400 to-pink-600', badgeColor: 'bg-rose-100 text-rose-800' },
  'Gia đình': { emoji: '🏠', bgGradient: 'from-rose-400 to-pink-600', badgeColor: 'bg-rose-100 text-rose-800' },
  'Động vật': { emoji: '🐾', bgGradient: 'from-emerald-500 to-green-600', badgeColor: 'bg-emerald-100 text-emerald-800' },
  'Địa điểm & Phương hướng': { emoji: '📍', bgGradient: 'from-sky-500 to-blue-600', badgeColor: 'bg-sky-100 text-sky-800' },
  'Địa điểm & Di chuyển': { emoji: '🚆', bgGradient: 'from-sky-500 to-blue-600', badgeColor: 'bg-sky-100 text-sky-800' },
  'Thời gian': { emoji: '⏰', bgGradient: 'from-indigo-500 to-purple-600', badgeColor: 'bg-indigo-100 text-indigo-800' },
  'Thời gian & Ngày tháng': { emoji: '📅', bgGradient: 'from-indigo-500 to-purple-600', badgeColor: 'bg-indigo-100 text-indigo-800' },
  'Học tập & Trường lớp': { emoji: '🎓', bgGradient: 'from-blue-600 to-cyan-600', badgeColor: 'bg-blue-100 text-blue-800' },
  'Học tập & Công việc': { emoji: '💼', bgGradient: 'from-blue-600 to-cyan-600', badgeColor: 'bg-blue-100 text-blue-800' },
  'Công sở & Quản lý': { emoji: '📊', bgGradient: 'from-blue-600 to-slate-700', badgeColor: 'bg-blue-100 text-blue-800' },
  'Sức khỏe & Y tế': { emoji: '🩺', bgGradient: 'from-red-500 to-rose-600', badgeColor: 'bg-red-100 text-red-800' },
  'Sức khỏe & Thể thao': { emoji: '⚽', bgGradient: 'from-emerald-500 to-teal-600', badgeColor: 'bg-emerald-100 text-emerald-800' },
  'Du lịch & Giải trí': { emoji: '🏖️', bgGradient: 'from-teal-400 to-sky-600', badgeColor: 'bg-teal-100 text-teal-800' },
  'Nghệ thuật & Giải trí': { emoji: '🎨', bgGradient: 'from-purple-500 to-pink-600', badgeColor: 'bg-purple-100 text-purple-800' },
  'Thời tiết & Thiên nhiên': { emoji: '⛅', bgGradient: 'from-sky-400 to-indigo-500', badgeColor: 'bg-sky-100 text-sky-800' },
  'Mua sắm & Tiền bạc': { emoji: '💳', bgGradient: 'from-amber-500 to-emerald-600', badgeColor: 'bg-amber-100 text-amber-800' },
  'Thành ngữ & Triết lý': { emoji: '📜', bgGradient: 'from-rose-700 to-red-900', badgeColor: 'bg-rose-100 text-rose-900' },
  'Thành ngữ & Giáo dục': { emoji: '📖', bgGradient: 'from-purple-700 to-indigo-900', badgeColor: 'bg-purple-100 text-purple-900' },
  'Kinh tế & Xã hội': { emoji: '📈', bgGradient: 'from-cyan-600 to-blue-800', badgeColor: 'bg-cyan-100 text-cyan-800' },
  'Tâm lý & Cảm xúc': { emoji: '💖', bgGradient: 'from-pink-500 to-rose-600', badgeColor: 'bg-pink-100 text-pink-800' },
  'Giao tiếp hàng ngày': { emoji: '🗣️', bgGradient: 'from-teal-500 to-blue-600', badgeColor: 'bg-teal-100 text-teal-800' }
};

export const getFlashcardIllustration = (card: FlashcardItem): IllustrationInfo => {
  // 1. Direct custom image or mapped image
  if (card.imageUrl) {
    return {
      imageUrl: card.imageUrl,
      emoji: '🖼️',
      bgGradient: 'from-red-500 to-amber-600',
      badgeColor: 'bg-red-100 text-red-800',
      theme: card.category
    };
  }

  // 2. Exact word match
  const exactMatch = WORD_ILLUSTRATION_MAP[card.hanzi];
  if (exactMatch) {
    const theme = CATEGORY_THEMES[card.category] || {
      emoji: '🀄',
      bgGradient: exactMatch.bgGradient,
      badgeColor: 'bg-red-100 text-red-800'
    };
    return {
      imageUrl: exactMatch.imageUrl,
      emoji: exactMatch.emoji,
      bgGradient: exactMatch.bgGradient,
      badgeColor: theme.badgeColor,
      theme: card.category
    };
  }

  // 3. Category match
  const catTheme = CATEGORY_THEMES[card.category];
  if (catTheme) {
    return {
      emoji: catTheme.emoji,
      bgGradient: catTheme.bgGradient,
      badgeColor: catTheme.badgeColor,
      theme: card.category
    };
  }

  // 4. Fallback HSK themed gradient
  return {
    emoji: '🀄',
    bgGradient: 'from-red-600 to-amber-600',
    badgeColor: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
    theme: card.level || 'HSK'
  };
};
