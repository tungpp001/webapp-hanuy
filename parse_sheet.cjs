const fs = require('fs');

const rawCsv = fs.readFileSync('src/data/raw_sheet.csv', 'utf8');

// Custom robust CSV parser to handle quoted strings with commas and newlines
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \r\n
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some(f => f !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

const rows = parseCSV(rawCsv);
console.log('Total parsed rows:', rows.length);

const flashcards = [];
let idCounter = 1;

for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  // Check if this row contains vocabulary data
  // Expected columns:
  // Col 0: Status/Từ còn lại
  // Col 1: Học lại
  // Col 2: Ngày ghi nhớ
  // Col 3: Câu chuyện (nếu có)
  // Col 4: Từ mới (Chữ Hán)
  // Col 5: Phiên âm (Pinyin)
  // Col 6: Giải thích (Nghĩa tiếng Việt)
  // Col 7: Ví dụ (chữ hán)
  // Col 8: Phiên âm ví dụ
  // Col 9: Dịch nghĩa ví dụ

  let hanzi = '';
  let pinyin = '';
  let meaning = '';
  let exampleHanzi = '';
  let examplePinyin = '';
  let exampleMeaning = '';

  // Look for columns by index or heuristic
  if (row.length >= 7) {
    // Check if row[4] is Chinese characters
    if (/[\u4e00-\u9fa5]/.test(row[4])) {
      hanzi = row[4];
      pinyin = row[5] || '';
      meaning = row[6] || '';
      exampleHanzi = row[7] || '';
      examplePinyin = row[8] || '';
      exampleMeaning = row[9] || '';
    } else {
      // Find the Chinese character column
      const hanziIdx = row.findIndex(col => /^[\u4e00-\u9fa5]{1,6}$/.test(col));
      if (hanziIdx !== -1) {
        hanzi = row[hanziIdx];
        pinyin = row[hanziIdx + 1] || '';
        meaning = row[hanziIdx + 2] || '';
        exampleHanzi = row[hanziIdx + 3] || '';
        examplePinyin = row[hanziIdx + 4] || '';
        exampleMeaning = row[hanziIdx + 5] || '';
      }
    }
  }

  if (hanzi && meaning && hanzi !== 'Từ mới') {
    flashcards.push({
      id: `fc-${idCounter++}`,
      hanzi: hanzi.trim(),
      pinyin: pinyin.trim(),
      meaning: meaning.trim(),
      exampleHanzi: exampleHanzi.trim(),
      examplePinyin: examplePinyin.trim(),
      exampleMeaning: exampleMeaning.trim(),
      category: determineCategory(meaning),
      level: 'HSK 1',
    });
  }
}

function determineCategory(meaning) {
  const m = meaning.toLowerCase();
  if (m.includes('ăn') || m.includes('uống') || m.includes('táo') || m.includes('trái cây') || m.includes('nước') || m.includes('cơm')) return 'Ẩm thực';
  if (m.includes('chào') || m.includes('cảm ơn') || m.includes('tạm biệt') || m.includes('xin lỗi') || m.includes('vui')) return 'Chào hỏi & Cảm xúc';
  if (m.includes('trường') || m.includes('học') || m.includes('sách') || m.includes('viết') || m.includes('bút') || m.includes('bạn học')) return 'Học tập';
  if (m.includes('bố') || m.includes('mẹ') || m.includes('con') || m.includes('bạn') || m.includes('ông') || m.includes('bà') || m.includes('anh') || m.includes('cô')) return 'Con người & Gia đình';
  if (m.includes('tiền') || m.includes('mua') || m.includes('bán') || m.includes('áo') || m.includes('quần') || m.includes('đắt') || m.includes('rẻ')) return 'Mua sắm';
  if (m.includes('nhà') || m.includes('bệnh viện') || m.includes('sân bay') || m.includes('khách sạn') || m.includes('đi') || m.includes('đến')) return 'Địa điểm & Di chuyển';
  if (m.includes('giờ') || m.includes('ngày') || m.includes('tháng') || m.includes('năm') || m.includes('hôm') || m.includes('sáng') || m.includes('chiều') || m.includes('tối')) return 'Thời gian';
  if (m.includes('chó') || m.includes('mèo') || m.includes('mưa') || m.includes('nóng') || m.includes('lạnh') || m.includes('thời tiết')) return 'Thiên nhiên & Động vật';
  return 'Giao tiếp hàng ngày';
}

console.log('Extracted flashcards count:', flashcards.length);
console.log('Sample 0:', flashcards[0]);
console.log('Sample 1:', flashcards[1]);
console.log('Sample 2:', flashcards[2]);

// Write to src/data/flashcardData.ts
const tsContent = `export interface FlashcardItem {
  id: string;
  hanzi: string;
  pinyin: string;
  sinoVietnamese?: string;
  meaning: string;
  exampleHanzi?: string;
  examplePinyin?: string;
  exampleMeaning?: string;
  category: string;
  level: string;
}

export const HSK1_SHEET_FLASHCARDS: FlashcardItem[] = ${JSON.stringify(flashcards, null, 2)};
`;

fs.writeFileSync('src/data/flashcardData.ts', tsContent, 'utf8');
console.log('Wrote src/data/flashcardData.ts successfully!');
