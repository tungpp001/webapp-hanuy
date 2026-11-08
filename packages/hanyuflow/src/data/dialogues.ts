import type { Dialogue } from '../types/chinese';

export const DIALOGUES: Dialogue[] = [
  {
    id: 'restaurant-1',
    title: 'Tại Nhà Hàng: Gọi Món & Hỏi Độ Cay',
    titleCn: '在餐厅点餐',
    pinyin: 'Zài cāntīng diǎncān',
    sinoVietnamese: 'Tại xán sảnh điểm xan',
    level: 'HSK 1',
    category: 'restaurant',
    categoryNameVn: 'Ăn Uống',
    icon: '🍜',
    description: 'Học cách gọi phục vụ, xem thực đơn, hỏi món ngon đặc sắc, yêu cầu không bỏ ớt cay và gọi thanh toán tiền.',
    durationMinutes: 5,
    roleplayGoal: {
      roleA: 'Phục vụ bàn (服务员 - Fúwùyuán)',
      roleB: 'Khách hàng (顾客 - Gùkè)',
      mission: 'Đóng vai khách hàng để gọi 1 đĩa mì xào, 1 cốc trà sữa ít đường và dặn dò đừng làm quá cay.'
    },
    grammarPoints: [
      {
        title: 'Cấu trúc "来 + số lượng + danh từ" (Dùng khi gọi món)',
        structure: '来 + [Số lượng / Lượng từ] + [Món ăn/Đồ uống]',
        explanation: 'Trong quán ăn, người Trung Quốc thường dùng động từ "来" (Lái) mang nghĩa "cho tôi / mang cho tôi" thay vì nói "我要" dài dòng.',
        examples: [
          { cn: '来一碗牛肉面。', pinyin: 'Lái yì wǎn niúròu miàn.', vn: 'Cho tôi một bát mì bò.' },
          { cn: '来两杯冰水。', pinyin: 'Lái liǎng bēi bīng shuǐ.', vn: 'Cho hai cốc nước đá.' }
        ]
      },
      {
        title: 'Phó từ phủ định "别" (Đừng / Không được)',
        structure: '别 + [Động từ / Tính từ] + (了)',
        explanation: 'Dùng để khuyên can hoặc yêu cầu người khác không làm gì.',
        examples: [
          { cn: '别放太多辣。', pinyin: 'Bié fàng tài duō là.', vn: 'Đừng cho quá nhiều ớt cay.' },
          { cn: '别客气。', pinyin: 'Bié kèqi.', vn: 'Đừng khách sáo.' }
        ]
      }
    ],
    lines: [
      {
        id: 'r1-1',
        speaker: {
          id: 'waiter',
          name: 'Phục vụ',
          nameCn: '服务员',
          role: 'A',
          avatar: '👨‍🍳',
          gender: 'male'
        },
        hanzi: '您好，几位？请问想吃点什么？',
        pinyin: 'Nín hǎo, jǐ wèi? Qǐngwèn xiǎng chī diǎn shénme?',
        sinoVietnamese: 'Nâm hảo, kỉ vị? Thỉnh vấn tưởng ngật điểm thập ma?',
        vietnamese: 'Xin chào, quý khách đi mấy người? Xin hỏi quý khách muốn ăn chút gì ạ?',
        words: [
          { hanzi: '您好', pinyin: 'nín hǎo', sinoVietnamese: 'Nâm hảo', meaning: 'Xin chào (kính ngữ)', pos: 'Thán từ' },
          { hanzi: '几位', pinyin: 'jǐ wèi', sinoVietnamese: 'Kỉ vị', meaning: 'Mấy vị / mấy người', pos: 'Đại từ + Lượng từ' },
          { hanzi: '请问', pinyin: 'qǐngwèn', sinoVietnamese: 'Thỉnh vấn', meaning: 'Xin hỏi', pos: 'Động từ' },
          { hanzi: '想', pinyin: 'xiǎng', sinoVietnamese: 'Tưởng', meaning: 'Muốn / nghĩ', pos: 'Trợ động từ' },
          { hanzi: '吃', pinyin: 'chī', sinoVietnamese: 'Ngật', meaning: 'Ăn', pos: 'Động từ' },
          { hanzi: '点', pinyin: 'diǎn', sinoVietnamese: 'Điểm', meaning: 'Một chút (trong ăn uống)', pos: 'Lượng từ' },
          { hanzi: '什么', pinyin: 'shénme', sinoVietnamese: 'Thập ma', meaning: 'Cái gì', pos: 'Đại từ' }
        ]
      },
      {
        id: 'r1-2',
        speaker: {
          id: 'customer',
          name: 'Bạn',
          nameCn: '顾客 (Bạn)',
          role: 'B',
          avatar: '🙋‍♂️',
          gender: 'male'
        },
        hanzi: '我们两位。请问有什么招牌菜推荐吗？',
        pinyin: 'Wǒmen liǎng wèi. Qǐngwèn yǒu shénme zhāopai cài tuījiàn ma?',
        sinoVietnamese: 'Ngã môn lưỡng vị. Thỉnh vấn hữu thập ma chiêu bài thái thôi tiến ma?',
        vietnamese: 'Chúng tôi có hai người. Xin hỏi có món ăn đặc sắc/tủ nào giới thiệu không ạ?',
        words: [
          { hanzi: '我们', pinyin: 'wǒmen', sinoVietnamese: 'Ngã môn', meaning: 'Chúng tôi / chúng ta', pos: 'Đại từ' },
          { hanzi: '两位', pinyin: 'liǎng wèi', sinoVietnamese: 'Lưỡng vị', meaning: 'Hai người (lịch sự)', pos: 'Số từ + Lượng từ' },
          { hanzi: '招牌菜', pinyin: 'zhāopái cài', sinoVietnamese: 'Chiêu bài thái', meaning: 'Món đặc sản / món tủ của quán', pos: 'Danh từ' },
          { hanzi: '推荐', pinyin: 'tuījiàn', sinoVietnamese: 'Thôi tiến', meaning: 'Giới thiệu / tiến cử', pos: 'Động từ' }
        ]
      },
      {
        id: 'r1-3',
        speaker: {
          id: 'waiter',
          name: 'Phục vụ',
          nameCn: '服务员',
          role: 'A',
          avatar: '👨‍🍳',
          gender: 'male'
        },
        hanzi: '我们店的宫保鸡丁和麻婆豆腐很有名，您要试试吗？',
        pinyin: 'Wǒmen diàn de gōngbǎo jīdīng hé mápó dòufu hěn yǒumíng, nín yào shìshi ma?',
        sinoVietnamese: 'Ngã môn điếm đích cung bảo kê đinh hòa ma bà đậu hũ ngận hữu danh, nâm yếu thí thí ma?',
        vietnamese: 'Món gà Cung Bảo và đậu phụ Ma Bà của quán chúng tôi rất nổi tiếng, quý khách muốn thử không ạ?',
        words: [
          { hanzi: '店', pinyin: 'diàn', sinoVietnamese: 'Điếm', meaning: 'Quán / cửa hàng', pos: 'Danh từ' },
          { hanzi: '宫保鸡丁', pinyin: 'gōngbǎo jīdīng', sinoVietnamese: 'Cung bảo kê đinh', meaning: 'Gà xào cay Cung Bảo (món Tứ Xuyên)', pos: 'Danh từ' },
          { hanzi: '麻婆豆腐', pinyin: 'mápó dòufu', sinoVietnamese: 'Ma bà đậu hũ', meaning: 'Đậu sốt cay Ma Bà', pos: 'Danh từ' },
          { hanzi: '有名', pinyin: 'yǒumíng', sinoVietnamese: 'Hữu danh', meaning: 'Nổi tiếng', pos: 'Tính từ' },
          { hanzi: '试试', pinyin: 'shìshi', sinoVietnamese: 'Thí thí', meaning: 'Thử xem (lặp động từ)', pos: 'Động từ' }
        ]
      },
      {
        id: 'r1-4',
        speaker: {
          id: 'customer',
          name: 'Bạn',
          nameCn: '顾客 (Bạn)',
          role: 'B',
          avatar: '🙋‍♂️',
          gender: 'male'
        },
        hanzi: '好的，来一份宫保鸡丁。请微辣，别放太辣。',
        pinyin: 'Hǎo de, lái yí fèn gōngbǎo jīdīng. Qǐng wēi là, bié fàng tài là.',
        sinoVietnamese: 'Hảo đích, lai nhất phần cung bảo kê đinh. Thỉnh vi lạt, biệt phóng thái lạt.',
        vietnamese: 'Được, cho một phần gà Cung Bảo nhé. Làm cay nhẹ thôi, đừng cho cay quá.',
        words: [
          { hanzi: '一份', pinyin: 'yí fèn', sinoVietnamese: 'Nhất phần', meaning: 'Một phần / một suất', pos: 'Lượng từ' },
          { hanzi: '微辣', pinyin: 'wēi là', sinoVietnamese: 'Vi lạt', meaning: 'Cay nhẹ / cay vừa', pos: 'Tính từ' },
          { hanzi: '别', pinyin: 'bié', sinoVietnamese: 'Biệt', meaning: 'Đừng', pos: 'Phó từ' },
          { hanzi: '放', pinyin: 'fàng', sinoVietnamese: 'Phóng', meaning: 'Bỏ vào / cho vào', pos: 'Động từ' },
          { hanzi: '太辣', pinyin: 'tài là', sinoVietnamese: 'Thái lạt', meaning: 'Quá cay', pos: 'Tính từ' }
        ]
      },
      {
        id: 'r1-5',
        speaker: {
          id: 'waiter',
          name: 'Phục vụ',
          nameCn: '服务员',
          role: 'A',
          avatar: '👨‍🍳',
          gender: 'male'
        },
        hanzi: '没问题！请问还要喝点什么饮料吗？',
        pinyin: 'Méi wèntí! Qǐngwèn hái yào hē diǎn shénme yǐnliào ma?',
        sinoVietnamese: 'Một vấn đề! Thỉnh vấn hoàn yếu hát điểm thập ma ẩm liệu ma?',
        vietnamese: 'Không vấn đề gì ạ! Xin hỏi quý khách còn muốn uống thêm đồ uống gì không?',
        words: [
          { hanzi: '没问题', pinyin: 'méi wèntí', sinoVietnamese: 'Một vấn đề', meaning: 'Không vấn đề gì / được ngay', pos: 'Cụm từ' },
          { hanzi: '还要', pinyin: 'hái yào', sinoVietnamese: 'Hoàn yếu', meaning: 'Còn muốn / vẫn muốn', pos: 'Phó từ + Động từ' },
          { hanzi: '喝', pinyin: 'hē', sinoVietnamese: 'Hát', meaning: 'Uống', pos: 'Động từ' },
          { hanzi: '饮料', pinyin: 'yǐnliào', sinoVietnamese: 'Ẩm liệu', meaning: 'Đồ uống / nước giải khát', pos: 'Danh từ' }
        ]
      },
      {
        id: 'r1-6',
        speaker: {
          id: 'customer',
          name: 'Bạn',
          nameCn: '顾客 (Bạn)',
          role: 'B',
          avatar: '🙋‍♂️',
          gender: 'male'
        },
        hanzi: '给我一杯冰奶茶，半糖少冰。服务员，买单！',
        pinyin: 'Gěi wǒ yì bēi bīng nǎichá, bàn táng shǎo bīng. Fúwùyuán, mǎidān!',
        sinoVietnamese: 'Cấp ngã nhất bôi băng nãi trà, bán đường thiểu băng. Phục vụ viên, mãi đơn!',
        vietnamese: 'Cho tôi một cốc trà sữa đá, 50% đường ít đá. Phục vụ ơi, tính tiền!',
        words: [
          { hanzi: '冰奶茶', pinyin: 'bīng nǎichá', sinoVietnamese: 'Băng nãi trà', meaning: 'Trà sữa đá', pos: 'Danh từ' },
          { hanzi: '半糖', pinyin: 'bàn táng', sinoVietnamese: 'Bán đường', meaning: 'Nửa đường (50% đường)', pos: 'Cụm từ' },
          { hanzi: '少冰', pinyin: 'shǎo bīng', sinoVietnamese: 'Thiểu băng', meaning: 'Ít đá', pos: 'Cụm từ' },
          { hanzi: '买单', pinyin: 'mǎidān', sinoVietnamese: 'Mãi đơn', meaning: 'Thanh toán tiền / tính tiền (cũng dùng 结账)', pos: 'Động từ' }
        ]
      }
    ]
  },
  {
    id: 'shopping-2',
    title: 'Mua Sắm & Trả Giá (Mặc Cả)',
    titleCn: '买衣服与讨价还价',
    pinyin: 'Mǎi yīfu yǔ tǎojià huánjià',
    sinoVietnamese: 'Mãi y phục dữ thảo giá hoàn giá',
    level: 'HSK 2',
    category: 'shopping',
    categoryNameVn: 'Mua Sắm',
    icon: '🛍️',
    description: 'Hỏi giá áo quần, xin thử size, mặc cả giảm giá và thanh toán quét mã WeChat/Alipay.',
    durationMinutes: 6,
    roleplayGoal: {
      roleA: 'Chủ tiệm (老板 - Lǎobǎn)',
      roleB: 'Người mua (买家 - Mǎijiā)',
      mission: 'Đóng vai người mua mặc cả chiếc áo khoác từ 200 tệ xuống 150 tệ và quét mã Alipay trả tiền.'
    },
    grammarPoints: [
      {
        title: 'Cấu trúc Mặc cả: "太...了，便宜点吧"',
        structure: '太 + [Tính từ] + 了，[便宜/少] + 一点吧',
        explanation: 'Câu cửa miệng khi mặc cả ở các khu chợ Trung Quốc.',
        examples: [
          { cn: '太贵了，便宜一点吧。', pinyin: 'Tài guì le, piányi yìdiǎn ba.', vn: 'Đắt quá, bớt chút đi.' },
          { cn: '一百块行不行？', pinyin: 'Yìbǎi kuài xíng bu xíng?', vn: '100 tệ được không?' }
        ]
      },
      {
        title: 'Hỏi phương thức thanh toán: "可以...吗"',
        structure: '可以 + [WeChat Pay / Alipay / Thẻ] + 吗？',
        explanation: 'Ở Trung Quốc gần như không dùng tiền mặt, thanh toán di động là phổ biến nhất.',
        examples: [
          { cn: '可以刷卡吗？', pinyin: 'Kěyǐ shuākǎ ma?', vn: 'Có quẹt thẻ được không?' },
          { cn: '我扫你微信。', pinyin: 'Wǒ sǎo nǐ wēixìn.', vn: 'Tôi quét mã WeChat của bạn nhé.' }
        ]
      }
    ],
    lines: [
      {
        id: 's2-1',
        speaker: {
          id: 'seller',
          name: 'Chủ tiệm',
          nameCn: '老板',
          role: 'A',
          avatar: '👩‍💼',
          gender: 'female'
        },
        hanzi: '帅哥，看看这件外套，今年最流行的款式！',
        pinyin: 'Shuàigē, kànkan zhè jiàn wàitào, jīnnián zuì liúxíng de kuǎnshì!',
        sinoVietnamese: 'Soái ca, khán khán giá kiện ngoại sáo, kim niên tối lưu hành đích khoản thức!',
        vietnamese: 'Soái ca ơi, xem chiếc áo khoác này đi, mẫu mốt thịnh hành nhất năm nay đấy!',
        words: [
          { hanzi: '帅哥', pinyin: 'shuàigē', sinoVietnamese: 'Soái ca', meaning: 'Anh bạn đẹp trai (cách xưng hô thân thiện)', pos: 'Danh từ' },
          { hanzi: '外套', pinyin: 'wàitào', sinoVietnamese: 'Ngoại sáo', meaning: 'Áo khoác ngoài', pos: 'Danh từ' },
          { hanzi: '流行', pinyin: 'liúxíng', sinoVietnamese: 'Lưu hành', meaning: 'Thịnh hành / hot trend', pos: 'Tính từ' },
          { hanzi: '款式', pinyin: 'kuǎnshì', sinoVietnamese: 'Khoản thức', meaning: 'Mẫu mã / kiểu dáng', pos: 'Danh từ' }
        ]
      },
      {
        id: 's2-2',
        speaker: {
          id: 'customer',
          name: 'Bạn',
          nameCn: '买家 (Bạn)',
          role: 'B',
          avatar: '🙋‍♂️',
          gender: 'male'
        },
        hanzi: '老板，这件衣服多少钱？我可以试穿一下吗？',
        pinyin: 'Lǎobǎn, zhè jiàn yīfu duōshao qián? Wǒ kěyǐ shìchuān yíxià ma?',
        sinoVietnamese: 'Lão bản, giá kiện y phục đa thiểu tiền? Ngã khả dĩ thí xuyên nhất hạ ma?',
        vietnamese: 'Bà chủ, bộ quần áo này bao nhiêu tiền? Tôi có thể mặc thử một chút được không?',
        words: [
          { hanzi: '老板', pinyin: 'lǎobǎn', sinoVietnamese: 'Lão bản', meaning: 'Ông chủ / bà chủ', pos: 'Danh từ' },
          { hanzi: '多少钱', pinyin: 'duōshao qián', sinoVietnamese: 'Đa thiểu tiền', meaning: 'Bao nhiêu tiền', pos: 'Cụm từ' },
          { hanzi: '试穿', pinyin: 'shìchuān', sinoVietnamese: 'Thí xuyên', meaning: 'Mặc thử', pos: 'Động từ' }
        ]
      },
      {
        id: 's2-3',
        speaker: {
          id: 'seller',
          name: 'Chủ tiệm',
          nameCn: '老板',
          role: 'A',
          avatar: '👩‍💼',
          gender: 'female'
        },
        hanzi: '试衣间在里面。这件原价两百八，算你两百块吧！',
        pinyin: 'Shìyījiān zài lǐmiàn. Zhè jiàn yuánjià liǎng bǎi bā, suàn nǐ liǎng bǎi kuài ba!',
        sinoVietnamese: 'Thí y gian tại lý diện. Giá kiện nguyên giá lưỡng bách bát, toán nỉ lưỡng bách khối ba!',
        vietnamese: 'Phòng thử đồ ở bên trong. Cái này giá gốc 280 tệ, tính bạn 200 tệ nhé!',
        words: [
          { hanzi: '试衣间', pinyin: 'shìyījiān', sinoVietnamese: 'Thí y gian', meaning: 'Phòng thử quần áo', pos: 'Danh từ' },
          { hanzi: '原价', pinyin: 'yuánjià', sinoVietnamese: 'Nguyên giá', meaning: 'Giá gốc', pos: 'Danh từ' },
          { hanzi: '算你', pinyin: 'suàn nǐ', sinoVietnamese: 'Toán nỉ', meaning: 'Tính cho bạn', pos: 'Cụm từ' },
          { hanzi: '块', pinyin: 'kuài', sinoVietnamese: 'Khối', meaning: 'Đồng / tệ (khẩu ngữ thay cho 元)', pos: 'Lượng từ tiền tệ' }
        ]
      },
      {
        id: 's2-4',
        speaker: {
          id: 'customer',
          name: 'Bạn',
          nameCn: '买家 (Bạn)',
          role: 'B',
          avatar: '🙋‍♂️',
          gender: 'male'
        },
        hanzi: '两百太贵了！一百五行不行？行的话我就拿一件。',
        pinyin: 'Liǎng bǎi tài guì le! Yì bǎi wǔ xíng bu xíng? Xíng dehuà wǒ jiù ná yí jiàn.',
        sinoVietnamese: 'Lưỡng bách thái quý liễu! Nhất bách ngũ hành bất hành? Hành đích thoại ngã tựu nã nhất kiện.',
        vietnamese: '200 đắt quá! 150 tệ được không? Nếu được thì tôi lấy một chiếc.',
        words: [
          { hanzi: '太贵了', pinyin: 'tài guì le', sinoVietnamese: 'Thái quý liễu', meaning: 'Đắt quá rồi', pos: 'Cụm từ' },
          { hanzi: '行不行', pinyin: 'xíng bu xíng', sinoVietnamese: 'Hành bất hành', meaning: 'Được không / ổn không', pos: 'Cụm từ' },
          { hanzi: '的话', pinyin: 'dehuà', sinoVietnamese: 'Đích thoại', meaning: 'Nếu như / trong trường hợp', pos: 'Trợ từ' },
          { hanzi: '拿', pinyin: 'ná', sinoVietnamese: 'Nã', meaning: 'Lấy / mua', pos: 'Động từ' }
        ]
      },
      {
        id: 's2-5',
        speaker: {
          id: 'seller',
          name: 'Chủ tiệm',
          nameCn: '老板',
          role: 'A',
          avatar: '👩‍💼',
          gender: 'female'
        },
        hanzi: '哎呀，亏本卖给你了！你用微信还是支付宝支付？',
        pinyin: 'Āiyā, kuīběn mài gěi nǐ le! Nǐ yòng wēixìn háishì zhìfùbǎo zhīfù?',
        sinoVietnamese: 'Ngải nha, khuy bản mại cấp nỉ liễu! Nỉ dụng vi tín hoàn thị chi phó bảo chi phó?',
        vietnamese: 'Ái chà, bán lỗ vốn cho bạn luôn đấy! Bạn dùng WeChat hay Alipay để thanh toán?',
        words: [
          { hanzi: '亏本', pinyin: 'kuīběn', sinoVietnamese: 'Khuy bản', meaning: 'Lỗ vốn', pos: 'Động từ' },
          { hanzi: '微信', pinyin: 'wēixìn', sinoVietnamese: 'Vi tín', meaning: 'WeChat', pos: 'Danh từ' },
          { hanzi: '还是', pinyin: 'háishì', sinoVietnamese: 'Hoàn thị', meaning: 'Hay là (trong câu hỏi lựa chọn)', pos: 'Liên từ' },
          { hanzi: '支付宝', pinyin: 'zhìfùbǎo', sinoVietnamese: 'Chi phó bảo', meaning: 'Alipay', pos: 'Danh từ' },
          { hanzi: '支付', pinyin: 'zhīfù', sinoVietnamese: 'Chi phó', meaning: 'Thanh toán', pos: 'Động từ' }
        ]
      },
      {
        id: 's2-6',
        speaker: {
          id: 'customer',
          name: 'Bạn',
          nameCn: '买家 (Bạn)',
          role: 'B',
          avatar: '🙋‍♂️',
          gender: 'male'
        },
        hanzi: '我扫您的支付宝二维码。谢谢老板！',
        pinyin: 'Wǒ sǎo nín de zhìfùbǎo èrwéimǎ. Xièxie lǎobǎn!',
        sinoVietnamese: 'Ngã tảo nâm đích chi phó bảo nhị duy mã. Tạ tạ lão bản!',
        vietnamese: 'Tôi quét mã QR Alipay của bạn nhé. Cảm ơn bà chủ!',
        words: [
          { hanzi: '扫', pinyin: 'sǎo', sinoVietnamese: 'Tảo', meaning: 'Quét (mã QR)', pos: 'Động từ' },
          { hanzi: '二维码', pinyin: 'èrwéimǎ', sinoVietnamese: 'Nhị duy mã', meaning: 'Mã QR (mã 2 chiều)', pos: 'Danh từ' }
        ]
      }
    ]
  },
  {
    id: 'travel-3',
    title: 'Hỏi Đường & Bắt Xe Đi Du Lịch',
    titleCn: '问路与打车',
    pinyin: 'Wènlù yǔ dǎchē',
    sinoVietnamese: 'Vấn lộ dữ đả xa',
    level: 'HSK 2',
    category: 'travel',
    categoryNameVn: 'Du Lịch',
    icon: '🚕',
    description: 'Học cách hỏi đường đến ga tàu điện ngầm, đi thẳng, rẽ trái, rẽ phải và bắt taxi.',
    durationMinutes: 5,
    roleplayGoal: {
      roleA: 'Người qua đường (路人 - Lùrén)',
      roleB: 'Khách du lịch (游客 - Yóukè)',
      mission: 'Đóng vai khách du lịch hỏi đường đến ga tàu điện ngầm gần nhất và ước tính thời gian đi bộ.'
    },
    grammarPoints: [
      {
        title: 'Cấu trúc Hỏi đường: "请问去...怎么走？"',
        structure: '请问 + 去 + [Địa điểm] + 怎么走？',
        explanation: 'Mẫu câu phổ biến nhất để hỏi phương hướng di chuyển.',
        examples: [
          { cn: '请问去地铁站怎么走？', pinyin: 'Qǐngwèn qù dìtiězhàn zěnme zǒu?', vn: 'Xin hỏi đi đến trạm tàu điện ngầm đi như thế nào?' },
          { cn: '离这里远不远？', pinyin: 'Lí zhèlǐ yuǎn bu yuǎn?', vn: 'Cách đây có xa không?' }
        ]
      },
      {
        title: 'Cấu trúc chỉ phương hướng: "往前走，往...拐"',
        structure: '一直往前走，往 [左/右] 拐',
        explanation: 'Dùng để hướng dẫn lộ trình: đi thẳng, rẽ trái, rẽ phải.',
        examples: [
          { cn: '一直往前走，到十字路口往右拐。', pinyin: 'Yìzhí wǎng qián zǒu, dào shízì lùkǒu wǎng yòu guǎi.', vn: 'Cứ đi thẳng về phía trước, đến ngã tư rẽ phải.' }
        ]
      }
    ],
    lines: [
      {
        id: 't3-1',
        speaker: {
          id: 'tourist',
          name: 'Bạn',
          nameCn: '游客 (Bạn)',
          role: 'B',
          avatar: '🎒',
          gender: 'male'
        },
        hanzi: '你好，打扰一下，请问去最近的地铁站怎么走？',
        pinyin: 'Nǐ hǎo, dǎrǎo yíxià, qǐngwèn qù zuì jìn de dìtiězhàn zěnme zǒu?',
        sinoVietnamese: 'Nỉ hảo, đả nhiễu nhất hạ, thỉnh vấn khứ tối cận đích địa thiết trạm chẩm ma tẩu?',
        vietnamese: 'Chào bạn, làm phiền một chút, xin hỏi đi đến ga tàu điện ngầm gần nhất như thế nào ạ?',
        words: [
          { hanzi: '打扰一下', pinyin: 'dǎrǎo yíxià', sinoVietnamese: 'Đả nhiễu nhất hạ', meaning: 'Làm phiền một chút (câu chào lịch sự)', pos: 'Cụm từ' },
          { hanzi: '最近', pinyin: 'zuì jìn', sinoVietnamese: 'Tối cận', meaning: 'Gần nhất', pos: 'Tính từ' },
          { hanzi: '地铁站', pinyin: 'dìtiězhàn', sinoVietnamese: 'Địa thiết trạm', meaning: 'Ga tàu điện ngầm', pos: 'Danh từ' },
          { hanzi: '怎么走', pinyin: 'zěnme zǒu', sinoVietnamese: 'Chẩm ma tẩu', meaning: 'Đi như thế nào', pos: 'Cụm từ' }
        ]
      },
      {
        id: 't3-2',
        speaker: {
          id: 'passerby',
          name: 'Người qua đường',
          nameCn: '路人',
          role: 'A',
          avatar: '🚶‍♂️',
          gender: 'male'
        },
        hanzi: '你一直往前走，大概两百米，到红绿灯往左拐就到了。',
        pinyin: 'Nǐ yìzhí wǎng qián zǒu, dàgài liǎng bǎi mǐ, dào hónglǜdēng wǎng zuǒ guǎi jiù dào le.',
        sinoVietnamese: 'Nỉ nhất trực vãng tiền tẩu, đại khái lưỡng bách mễ, đáo hồng lục đăng vãng tả quải tựu đáo liễu.',
        vietnamese: 'Bạn cứ đi thẳng về phía trước khoảng 200 mét, đến cột đèn giao thông rẽ trái là đến nơi rồi.',
        words: [
          { hanzi: '一直', pinyin: 'yìzhí', sinoVietnamese: 'Nhất trực', meaning: 'Cứ / luôn luôn / thẳng một mạch', pos: 'Phó từ' },
          { hanzi: '大概', pinyin: 'dàgài', sinoVietnamese: 'Đại khái', meaning: 'Khoảng / đại khái', pos: 'Phó từ' },
          { hanzi: '红绿灯', pinyin: 'hónglǜdēng', sinoVietnamese: 'Hồng lục đăng', meaning: 'Đèn giao thông (đèn đỏ - xanh)', pos: 'Danh từ' },
          { hanzi: '往左拐', pinyin: 'wǎng zuǒ guǎi', sinoVietnamese: 'Vãng tả quải', meaning: 'Rẽ về bên trái', pos: 'Cụm từ' }
        ]
      },
      {
        id: 't3-3',
        speaker: {
          id: 'tourist',
          name: 'Bạn',
          nameCn: '游客 (Bạn)',
          role: 'B',
          avatar: '🎒',
          gender: 'male'
        },
        hanzi: '走过去需要多长时间？坐出租车方便吗？',
        pinyin: 'Zǒu guòqu xūyào duō cháng shíjiān? Zuò chūzūchē fāngbiàn ma?',
        sinoVietnamese: 'Tẩu quá khứ nhu yếu đa trường thời gian? Tọa xuất tô xa phương tiện ma?',
        vietnamese: 'Đi bộ qua đó mất bao lâu thời gian? Đi taxi có tiện không?',
        words: [
          { hanzi: '需要', pinyin: 'xūyào', sinoVietnamese: 'Nhu yếu', meaning: 'Cần / mất (thời gian)', pos: 'Động từ' },
          { hanzi: '多长时间', pinyin: 'duō cháng shíjiān', sinoVietnamese: 'Đa trường thời gian', meaning: 'Bao lâu thời gian', pos: 'Cụm từ' },
          { hanzi: '出租车', pinyin: 'chūzūchē', sinoVietnamese: 'Xuất tô xa', meaning: 'Xe taxi', pos: 'Danh từ' },
          { hanzi: '方便', pinyin: 'fāngbiàn', sinoVietnamese: 'Phương tiện', meaning: 'Thuận tiện / tiện lợi', pos: 'Tính từ' }
        ]
      },
      {
        id: 't3-4',
        speaker: {
          id: 'passerby',
          name: 'Người qua đường',
          nameCn: '路人',
          role: 'A',
          avatar: '🚶‍♂️',
          gender: 'male'
        },
        hanzi: '很近的，走路五分钟就到，不用打车。',
        pinyin: 'Hěn jìn de, zǒulù wǔ fēnzhōng jiù dào, búyòng dǎchē.',
        sinoVietnamese: 'Ngận cận đích, tẩu lộ ngũ phân chung tựu đáo, bất dụng đả xa.',
        vietnamese: 'Rất gần, đi bộ 5 phút là tới rồi, không cần gọi taxi đâu.',
        words: [
          { hanzi: '走路', pinyin: 'zǒulù', sinoVietnamese: 'Tẩu lộ', meaning: 'Đi bộ', pos: 'Động từ' },
          { hanzi: '分钟', pinyin: 'fēnzhōng', sinoVietnamese: 'Phân chung', meaning: 'Phút', pos: 'Lượng từ' },
          { hanzi: '不用', pinyin: 'búyòng', sinoVietnamese: 'Bất dụng', meaning: 'Không cần', pos: 'Phó từ' },
          { hanzi: '打车', pinyin: 'dǎchē', sinoVietnamese: 'Đả xa', meaning: 'Bắt taxi', pos: 'Động từ' }
        ]
      }
    ]
  },
  {
    id: 'hotel-4',
    title: 'Đặt & Nhận Phòng Khách Sạn',
    titleCn: '酒店入住与退房',
    pinyin: 'Jiǔdiàn rùzhù yǔ tuìfáng',
    sinoVietnamese: 'Tửu điếm nhập trú dữ thoái phòng',
    level: 'HSK 3',
    category: 'hotel',
    categoryNameVn: 'Khách Sạn',
    icon: '🏨',
    description: 'Thủ tục nhận phòng (Check-in), hỏi mật khẩu Wi-Fi, đổi phòng yên tĩnh và trả phòng (Check-out).',
    durationMinutes: 6,
    roleplayGoal: {
      roleA: 'Lễ tân khách sạn (前台 - Qiántái)',
      roleB: 'Khách lưu trú (住客 - Zhùkè)',
      mission: 'Đóng vai khách xuất trình hộ chiếu nhận phòng đã đặt online và hỏi mật khẩu Wi-Fi & giờ ăn sáng.'
    },
    grammarPoints: [
      {
        title: 'Cấu trúc "在...网上预订了" (Đặt trước qua mạng)',
        structure: '我在 [App/Web] 预订了 + [Loại phòng]',
        explanation: 'Dùng khi đến khách sạn đã đặt trước qua Trip.com / Booking.',
        examples: [
          { cn: '我在网上预订了一间大床房。', pinyin: 'Wǒ zài wǎngshang yùdìng le yì jiān dàchuángfáng.', vn: 'Tôi đã đặt một phòng giường đơn lớn trên mạng.' }
        ]
      }
    ],
    lines: [
      {
        id: 'h4-1',
        speaker: {
          id: 'receptionist',
          name: 'Lễ tân',
          nameCn: '前台',
          role: 'A',
          avatar: '🏨',
          gender: 'female'
        },
        hanzi: '您好，欢迎光临！请问有预订吗？',
        pinyin: 'Nín hǎo, huānyíng guānglín! Qǐngwèn yǒu yùdìng ma?',
        sinoVietnamese: 'Nâm hảo, hoan nghênh quang lâm! Thỉnh vấn hữu dự đính ma?',
        vietnamese: 'Xin chào, hoan nghênh quý khách! Xin hỏi quý khách có đặt phòng trước không ạ?',
        words: [
          { hanzi: '欢迎光临', pinyin: 'huānyíng guānglín', sinoVietnamese: 'Hoan nghênh quang lâm', meaning: 'Kính chào quý khách', pos: 'Cụm từ' },
          { hanzi: '预订', pinyin: 'yùdìng', sinoVietnamese: 'Dự đính', meaning: 'Đặt trước (phòng, vé)', pos: 'Động từ' }
        ]
      },
      {
        id: 'h4-2',
        speaker: {
          id: 'guest',
          name: 'Bạn',
          nameCn: '住客 (Bạn)',
          role: 'B',
          avatar: '🧳',
          gender: 'male'
        },
        hanzi: '有的，我预订了一间大床房，住两晚。这是我的护照。',
        pinyin: 'Yǒu de, wǒ yùdìng le yì jiān dàchuángfáng, zhù liǎng wǎn. Zhè shì wǒ de hùzhào.',
        sinoVietnamese: 'Hữu đích, ngã dự đính liễu nhất gian đại sàng phòng, trú lưỡng vãn. Giá thị ngã đích hộ chiếu.',
        vietnamese: 'Có ạ, tôi đã đặt một phòng giường lớn, ở 2 đêm. Đây là hộ chiếu của tôi.',
        words: [
          { hanzi: '大床房', pinyin: 'dàchuángfáng', sinoVietnamese: 'Đại sàng phòng', meaning: 'Phòng 1 giường lớn (King/Queen bed)', pos: 'Danh từ' },
          { hanzi: '护照', pinyin: 'hùzhào', sinoVietnamese: 'Hộ chiếu', meaning: 'Hộ chiếu / Passport', pos: 'Danh từ' },
          { hanzi: '住', pinyin: 'zhù', sinoVietnamese: 'Trú', meaning: 'Ở / cư trú', pos: 'Động từ' }
        ]
      },
      {
        id: 'h4-3',
        speaker: {
          id: 'receptionist',
          name: 'Lễ tân',
          nameCn: '前台',
          role: 'A',
          avatar: '🏨',
          gender: 'female'
        },
        hanzi: '好的，已经帮您办好入住了。您的房间在808，这是房卡。',
        pinyin: 'Hǎo de, yǐjīng bāng nín bàn hǎo rùzhù le. Nín de fángjiān zài bā líng bā, zhè shì fángkǎ.',
        sinoVietnamese: 'Hảo đích, dĩ kinh bang nâm biện hảo nhập trú liễu. Nâm đích phòng gian tại bát linh bát, giá thị phòng tạp.',
        vietnamese: 'Được rồi ạ, đã làm xong thủ tục nhận phòng cho quý khách. Phòng của quý khách là phòng 808, đây là thẻ phòng ạ.',
        words: [
          { hanzi: '办好', pinyin: 'bàn hǎo', sinoVietnamese: 'Biện hảo', meaning: 'Làm xong / xử lý tốt', pos: 'Bổ ngữ kết quả' },
          { hanzi: '入住', pinyin: 'rùzhù', sinoVietnamese: 'Nhập trú', meaning: 'Nhận phòng / vào ở', pos: 'Động từ' },
          { hanzi: '房卡', pinyin: 'fángkǎ', sinoVietnamese: 'Phòng tạp', meaning: 'Thẻ phòng (mở khóa từ)', pos: 'Danh từ' }
        ]
      },
      {
        id: 'h4-4',
        speaker: {
          id: 'guest',
          name: 'Bạn',
          nameCn: '住客 (Bạn)',
          role: 'B',
          avatar: '🧳',
          gender: 'male'
        },
        hanzi: '请问房间Wi-Fi密码是多少？早餐几点开始？',
        pinyin: 'Qǐngwèn fángjiān Wi-Fi mìmǎ shì duōshao? Zǎocān jǐ diǎn kāishǐ?',
        sinoVietnamese: 'Thỉnh vấn phòng gian Wi-Fi mật mã thị đa thiểu? Tảo xan kỉ điểm khai thủy?',
        vietnamese: 'Xin hỏi mật khẩu Wi-Fi phòng là bao nhiêu? Bữa sáng mấy giờ bắt đầu vậy?',
        words: [
          { hanzi: '密码', pinyin: 'mìmǎ', sinoVietnamese: 'Mật mã', meaning: 'Mật khẩu / Password', pos: 'Danh từ' },
          { hanzi: '早餐', pinyin: 'zǎocān', sinoVietnamese: 'Tảo xan', meaning: 'Bữa ăn sáng', pos: 'Danh từ' },
          { hanzi: '开始', pinyin: 'kāishǐ', sinoVietnamese: 'Khai thủy', meaning: 'Bắt đầu', pos: 'Động từ' }
        ]
      }
    ]
  },
  {
    id: 'dating-5',
    title: 'Giao Lưu Kết Bạn & Giới Thiệu Bản Thân',
    titleCn: '结交新朋友与自我介绍',
    pinyin: 'Jiéjiāo xīn péngyou yǔ zìwǒ jièshào',
    sinoVietnamese: 'Kết giao tân bằng hữu dữ tự ngã giới thiệu',
    level: 'HSK 1',
    category: 'dating',
    categoryNameVn: 'Kết Bạn',
    icon: '☕',
    description: 'Hỏi tên, quê quán, nghề nghiệp, sở thích âm nhạc du lịch và xin phương thức liên lạc WeChat.',
    durationMinutes: 5,
    roleplayGoal: {
      roleA: 'Bạn Trung Quốc (李华 - Lǐ Huá)',
      roleB: 'Bạn học người Việt (阮明 - Ruǎn Míng)',
      mission: 'Đóng vai giới thiệu mình là người Việt Nam đang học tiếng Trung, trao đổi sở thích và quét WeChat kết bạn.'
    },
    grammarPoints: [
      {
        title: 'Giới thiệu bản thân: "我来自...，我的爱好是..."',
        structure: '我叫 [Tên], 来自 [Địa điểm]. 我的爱好是 [Sở thích].',
        explanation: 'Mẫu câu chuẩn nhất khi gặp gỡ người mới quen.',
        examples: [
          { cn: '我来自越南河内。', pinyin: 'Wǒ láizì Yuènán Hénèi.', vn: 'Tôi đến từ Hà Nội, Việt Nam.' },
          { cn: '很高兴认识你！', pinyin: 'Hěn gāoxìng rènshi nǐ!', vn: 'Rất vui được làm quen với bạn!' }
        ]
      }
    ],
    lines: [
      {
        id: 'd5-1',
        speaker: {
          id: 'lihua',
          name: 'Lý Hoa',
          nameCn: '李华',
          role: 'A',
          avatar: '👩',
          gender: 'female'
        },
        hanzi: '你好！我叫李华，来自北京。你也是新同学吗？',
        pinyin: 'Nǐ hǎo! Wǒ jiào Lǐ Huá, láizì Běijīng. Nǐ yě shì xīn tóngxué ma?',
        sinoVietnamese: 'Nỉ hảo! Ngã khiếu Lý Hoa, lai tự Bắc Kinh. Nỉ dã thị tân đồng học ma?',
        vietnamese: 'Chào bạn! Mình tên là Lý Hoa, đến từ Bắc Kinh. Bạn cũng là bạn học mới à?',
        words: [
          { hanzi: '来自', pinyin: 'láizì', sinoVietnamese: 'Lai tự', meaning: 'Đến từ', pos: 'Động từ' },
          { hanzi: '北京', pinyin: 'Běijīng', sinoVietnamese: 'Bắc Kinh', meaning: 'Bắc Kinh', pos: 'Danh từ riêng' },
          { hanzi: '同学', pinyin: 'tóngxué', sinoVietnamese: 'Đồng học', meaning: 'Bạn cùng lớp / bạn học', pos: 'Danh từ' }
        ]
      },
      {
        id: 'd5-2',
        speaker: {
          id: 'user',
          name: 'Bạn',
          nameCn: '阮明 (Bạn)',
          role: 'B',
          avatar: '🙋‍♂️',
          gender: 'male'
        },
        hanzi: '你好李华！我叫阮明，来自越南。很高兴认识你！',
        pinyin: 'Nǐ hǎo Lǐ Huá! Wǒ jiào Ruǎn Míng, láizì Yuènán. Hěn gāoxìng rènshi nǐ!',
        sinoVietnamese: 'Nỉ hảo Lý Hoa! Ngã khiếu Nguyễn Minh, lai tự Việt Nam. Ngận cao hứng nhận thức nỉ!',
        vietnamese: 'Chào Lý Hoa! Mình tên là Nguyễn Minh, đến từ Việt Nam. Rất vui được làm quen với bạn!',
        words: [
          { hanzi: '越南', pinyin: 'Yuènán', sinoVietnamese: 'Việt Nam', meaning: 'Việt Nam', pos: 'Danh từ riêng' },
          { hanzi: '很高兴', pinyin: 'hěn gāoxìng', sinoVietnamese: 'Ngận cao hứng', meaning: 'Rất vui mừng / hạnh phúc', pos: 'Tính từ' },
          { hanzi: '认识', pinyin: 'rènshi', sinoVietnamese: 'Nhận thức', meaning: 'Quen biết / làm quen', pos: 'Động từ' }
        ]
      },
      {
        id: 'd5-3',
        speaker: {
          id: 'lihua',
          name: 'Lý Hoa',
          nameCn: '李华',
          role: 'A',
          avatar: '👩',
          gender: 'female'
        },
        hanzi: '你的中文说得真棒！你平时有什么爱好？',
        pinyin: 'Nǐ de zhōngwén shuō de zhēn bàng! Nǐ píngshí yǒu shénme àihào?',
        sinoVietnamese: 'Nỉ đích trung văn thuyết đắc chân bổng! Nỉ bình thời hữu thập ma ái hảo?',
        vietnamese: 'Tiếng Trung của bạn nói giỏi thật đấy! Bình thường bạn có sở thích gì?',
        words: [
          { hanzi: '中文', pinyin: 'zhōngwén', sinoVietnamese: 'Trung văn', meaning: 'Tiếng Trung', pos: 'Danh từ' },
          { hanzi: '真棒', pinyin: 'zhēn bàng', sinoVietnamese: 'Chân bổng', meaning: 'Thật tuyệt / rất đỉnh', pos: 'Tính từ' },
          { hanzi: '平时', pinyin: 'píngshí', sinoVietnamese: 'Bình thời', meaning: 'Bình thường / ngày thường', pos: 'Danh từ thời gian' },
          { hanzi: '爱好', pinyin: 'àihào', sinoVietnamese: 'Ái hảo', meaning: 'Sở thích', pos: 'Danh từ' }
        ]
      },
      {
        id: 'd5-4',
        speaker: {
          id: 'user',
          name: 'Bạn',
          nameCn: '阮明 (Bạn)',
          role: 'B',
          avatar: '🙋‍♂️',
          gender: 'male'
        },
        hanzi: '我喜欢听中国流行歌和去旅游。加个微信吧，以后常联系！',
        pinyin: 'Wǒ xǐhuan tīng zhōngguó liúxíng gē hé qù lǚyóu. Jiā gè wēixìn ba, yǐhòu cháng liánxì!',
        sinoVietnamese: 'Ngã hỉ hoan thính Trung Quốc lưu hành ca hòa khứ lữ du. Gia cá vi tín ba, dĩ hậu thường liên hệ!',
        vietnamese: 'Mình thích nghe nhạc trẻ Trung Quốc và đi du lịch. Thêm WeChat đi, sau này thường xuyên liên lạc nhé!',
        words: [
          { hanzi: '喜欢', pinyin: 'xǐhuan', sinoVietnamese: 'Hỉ hoan', meaning: 'Thích', pos: 'Động từ' },
          { hanzi: '流行歌', pinyin: 'liúxíng gē', sinoVietnamese: 'Lưu hành ca', meaning: 'Bài hát nhạc trẻ / Pop music', pos: 'Danh từ' },
          { hanzi: '旅游', pinyin: 'lǚyóu', sinoVietnamese: 'Lữ du', meaning: 'Du lịch', pos: 'Động từ' },
          { hanzi: '加微信', pinyin: 'jiā wēixìn', sinoVietnamese: 'Gia vi tín', meaning: 'Kết bạn WeChat', pos: 'Cụm từ' },
          { hanzi: '常联系', pinyin: 'cháng liánxì', sinoVietnamese: 'Thường liên hệ', meaning: 'Thường xuyên liên lạc', pos: 'Cụm từ' }
        ]
      }
    ]
  },
  {
    id: 'work-6',
    title: 'Phỏng Vấn Xin Việc & Giao Tiếp Công Sở',
    titleCn: '面试与职场交流',
    pinyin: 'Miànshì yǔ zhíchǎng jiāoliú',
    sinoVietnamese: 'Diện thí dữ chức trường giao lưu',
    level: 'HSK 3',
    category: 'work',
    categoryNameVn: 'Công Sở',
    icon: '💼',
    description: 'Giới thiệu kinh nghiệm làm việc, trả lời câu hỏi phỏng vấn và chào hỏi đồng nghiệp mới.',
    durationMinutes: 7,
    roleplayGoal: {
      roleA: 'Người phỏng vấn (面试官 - Miànshìguān)',
      roleB: 'Ứng viên (应聘者 - Yìngpìnzhě)',
      mission: 'Đóng vai ứng viên giới thiệu 3 năm kinh nghiệm trong ngành và bày tỏ sự hào hứng với vị trí mới.'
    },
    grammarPoints: [
      {
        title: 'Giới thiệu kinh nghiệm: "有...年的工作经验"',
        structure: '我在 [Lĩnh vực] 有 [Số năm] 年的工作经验。',
        explanation: 'Mẫu câu chuyên nghiệp trong phỏng vấn.',
        examples: [
          { cn: '我有三年的软件开发经验。', pinyin: 'Wǒ yǒu sān nián de ruǎnjiàn kāifā jīngyàn.', vn: 'Tôi có 3 năm kinh nghiệm phát triển phần mềm.' }
        ]
      }
    ],
    lines: [
      {
        id: 'w6-1',
        speaker: {
          id: 'interviewer',
          name: 'Phỏng vấn viên',
          nameCn: '面试官',
          role: 'A',
          avatar: '👨‍💼',
          gender: 'male'
        },
        hanzi: '请先用一两分钟简单做一个自我介绍吧。',
        pinyin: 'Qǐng xiān yòng yì liǎng fēnzhōng jiǎndān zuò yí gè zìwǒ jièshào ba.',
        sinoVietnamese: 'Thỉnh tiên dụng nhất lưỡng phân chung giản đơn tác nhất cá tự ngã giới thiệu ba.',
        vietnamese: 'Xin mời bạn dùng 1-2 phút giới thiệu sơ lược về bản thân mình.',
        words: [
          { hanzi: '先', pinyin: 'xiān', sinoVietnamese: 'Tiên', meaning: 'Trước tiên / trước', pos: 'Phó từ' },
          { hanzi: '简单', pinyin: 'jiǎndān', sinoVietnamese: 'Giản đơn', meaning: 'Đơn giản / sơ lược', pos: 'Tính từ' },
          { hanzi: '自我介绍', pinyin: 'zìwǒ jièshào', sinoVietnamese: 'Tự ngã giới thiệu', meaning: 'Tự giới thiệu bản thân', pos: 'Danh từ' }
        ]
      },
      {
        id: 'w6-2',
        speaker: {
          id: 'applicant',
          name: 'Bạn',
          nameCn: '应聘者 (Bạn)',
          role: 'B',
          avatar: '👩‍💻',
          gender: 'female'
        },
        hanzi: '面试官好，我毕业于河内大学，有三年的外贸工作经验。',
        pinyin: 'Miànshìguān hǎo, wǒ bìyè yú Hénèi Dàxué, yǒu sān nián de wàimào gōngzuò jīngyàn.',
        sinoVietnamese: 'Diện thí quan hảo, ngã tất nghiệp vu Hà Nội Đại Học, hữu tam niên đích ngoại mậu công tác kinh nghiệm.',
        vietnamese: 'Chào anh phỏng vấn viên, tôi tốt nghiệp Đại học Hà Nội, có 3 năm kinh nghiệm làm việc ngoại thương.',
        words: [
          { hanzi: '毕业于', pinyin: 'bìyè yú', sinoVietnamese: 'Tất nghiệp vu', meaning: 'Tốt nghiệp từ trường...', pos: 'Cụm từ' },
          { hanzi: '外贸', pinyin: 'wàimào', sinoVietnamese: 'Ngoại mậu', meaning: 'Ngoại thương / thương mại quốc tế', pos: 'Danh từ' },
          { hanzi: '经验', pinyin: 'jīngyàn', sinoVietnamese: 'Kinh nghiệm', meaning: 'Kinh nghiệm', pos: 'Danh từ' }
        ]
      },
      {
        id: 'w6-3',
        speaker: {
          id: 'interviewer',
          name: 'Phỏng vấn viên',
          nameCn: '面试官',
          role: 'A',
          avatar: '👨‍💼',
          gender: 'male'
        },
        hanzi: '很好！如果录用的话，你最快什么时候可以入职？',
        pinyin: 'Hěn hǎo! Rúguǒ lùyòng dehuà, nǐ zuì kuài shénme shíhou kěyǐ rùzhí?',
        sinoVietnamese: 'Ngận hảo! Như quả lục dụng đích thoại, nỉ tối khoái thập ma thời hậu khả dĩ nhập chức?',
        vietnamese: 'Rất tốt! Nếu được tuyển dụng, bạn có thể nhận việc sớm nhất vào lúc nào?',
        words: [
          { hanzi: '如果', pinyin: 'rúguǒ', sinoVietnamese: 'Như quả', meaning: 'Nếu như', pos: 'Liên từ' },
          { hanzi: '录用', pinyin: 'lùyòng', sinoVietnamese: 'Lục dụng', meaning: 'Tuyển dụng / nhận vào làm', pos: 'Động từ' },
          { hanzi: '最快', pinyin: 'zuì kuài', sinoVietnamese: 'Tối khoái', meaning: 'Sớm nhất / nhanh nhất', pos: 'Phó từ' },
          { hanzi: '入职', pinyin: 'rùzhí', sinoVietnamese: 'Nhập chức', meaning: 'Nhận việc / đi làm chính thức', pos: 'Động từ' }
        ]
      },
      {
        id: 'w6-4',
        speaker: {
          id: 'applicant',
          name: 'Bạn',
          nameCn: '应聘者 (Bạn)',
          role: 'B',
          avatar: '👩‍💻',
          gender: 'female'
        },
        hanzi: '我随时都可以入职。非常期待能加入贵公司！',
        pinyin: 'Wǒ suíshí dōu kěyǐ rùzhí. Fēicháng qīdài néng jiārù guì gōngsī!',
        sinoVietnamese: 'Ngã tùy thời đô khả dĩ nhập chức. Phi thường kỳ đãi năng gia nhập quý công ty!',
        vietnamese: 'Tôi có thể đi làm bất cứ lúc nào ạ. Rất mong đợi được gia nhập quý công ty!',
        words: [
          { hanzi: '随时', pinyin: 'suíshí', sinoVietnamese: 'Tùy thời', meaning: 'Bất cứ lúc nào', pos: 'Phó từ' },
          { hanzi: '期待', pinyin: 'qīdài', sinoVietnamese: 'Kỳ đãi', meaning: 'Kỳ vọng / mong đợi', pos: 'Động từ' },
          { hanzi: '贵公司', pinyin: 'guì gōngsī', sinoVietnamese: 'Quý công ty', meaning: 'Quý công ty (lịch thiệp)', pos: 'Danh từ' }
        ]
      }
    ]
  },
  {
    id: 'hospital-7',
    title: 'Đi Khám Bệnh & Mua Thuốc',
    titleCn: '医院看病与买药',
    pinyin: 'Yīyuàn kànbìng yǔ mǎiyào',
    sinoVietnamese: 'Y viện khán bệnh dữ mãi dược',
    level: 'HSK 2',
    category: 'hospital',
    categoryNameVn: 'Y Tế',
    icon: '🏥',
    description: 'Diễn đạt các triệu chứng bị cảm sốt, đau đầu, ho và cách uống thuốc ngày mấy lần.',
    durationMinutes: 5,
    roleplayGoal: {
      roleA: 'Bác sĩ (医生 - Yīshēng)',
      roleB: 'Bệnh nhân (病人 - Bìngrén)',
      mission: 'Đóng vai bệnh nhân nói triệu chứng bị sốt, ho từ hôm qua và hỏi cách dùng thuốc.'
    },
    grammarPoints: [
      {
        title: 'Diễn đạt thời lượng và tần suất uống thuốc: "一天三次，一次两片"',
        structure: '一天 [Số lần] 次，一次 [Số lượng] 片/粒',
        explanation: 'Cách diễn đạt chuẩn khi dặn dò uống thuốc.',
        examples: [
          { cn: '饭后吃，一天三次，一次两片。', pinyin: 'Fàn hòu chī, yì tiān sān cì, yí cì liǎng piàn.', vn: 'Uống sau bữa ăn, ngày 3 lần, mỗi lần 2 viên.' }
        ]
      }
    ],
    lines: [
      {
        id: 'hp7-1',
        speaker: {
          id: 'doctor',
          name: 'Bác sĩ',
          nameCn: '医生',
          role: 'A',
          avatar: '👨‍⚕️',
          gender: 'male'
        },
        hanzi: '你哪里不舒服？发烧了吗？',
        pinyin: 'Nǐ nǎlǐ bù shūfu? Fāshāo le ma?',
        sinoVietnamese: 'Nỉ na lý bất thư phục? Phát thiêu liễu ma?',
        vietnamese: 'Bạn cảm thấy khó chịu ở chỗ nào? Có bị sốt không?',
        words: [
          { hanzi: '哪里', pinyin: 'nǎlǐ', sinoVietnamese: 'Na lý', meaning: 'Ở đâu / chỗ nào', pos: 'Đại từ' },
          { hanzi: '不舒服', pinyin: 'bù shūfu', sinoVietnamese: 'Bất thư phục', meaning: 'Không khỏe / khó chịu trong người', pos: 'Tính từ' },
          { hanzi: '发烧', pinyin: 'fāshāo', sinoVietnamese: 'Phát thiêu', meaning: 'Bị sốt', pos: 'Động từ' }
        ]
      },
      {
        id: 'hp7-2',
        speaker: {
          id: 'patient',
          name: 'Bạn',
          nameCn: '病人 (Bạn)',
          role: 'B',
          avatar: '🤒',
          gender: 'male'
        },
        hanzi: '医生，我从昨天开始头疼、咳嗽，还有点低烧。',
        pinyin: 'Yīshēng, wǒ cóng zuótiān kāishǐ tóuténg, késou, hái yǒudiǎn dīshāo.',
        sinoVietnamese: 'Y sinh, ngã tùng tạc thiên khai thủy đầu thống, khái thấu, hoàn hữu điểm đê thiêu.',
        vietnamese: 'Bác sĩ ơi, tôi bắt đầu đau đầu, ho từ hôm qua, lại còn bị sốt nhẹ nữa.',
        words: [
          { hanzi: '从...开始', pinyin: 'cóng... kāishǐ', sinoVietnamese: 'Tùng... khai thủy', meaning: 'Bắt đầu từ...', pos: 'Cấu trúc' },
          { hanzi: '头疼', pinyin: 'tóuténg', sinoVietnamese: 'Đầu thống', meaning: 'Đau đầu', pos: 'Tính từ' },
          { hanzi: '咳嗽', pinyin: 'késou', sinoVietnamese: 'Khái thấu', meaning: 'Ho', pos: 'Động từ' },
          { hanzi: '低烧', pinyin: 'dīshāo', sinoVietnamese: 'Đê thiêu', meaning: 'Sốt nhẹ', pos: 'Danh từ' }
        ]
      },
      {
        id: 'hp7-3',
        speaker: {
          id: 'doctor',
          name: 'Bác sĩ',
          nameCn: '医生',
          role: 'A',
          avatar: '👨‍⚕️',
          gender: 'male'
        },
        hanzi: '你这是感冒了。我给你开点感冒药，多喝热水，多休息。',
        pinyin: 'Nǐ zhè shì gǎnmào le. Wǒ gěi nǐ kāi diǎn gǎnmàoyào, duō hē rèshuǐ, duō xiūxi.',
        sinoVietnamese: 'Nỉ giá thị cảm mạo liễu. Ngã cấp nỉ khai điểm cảm mạo dược, đa hát nhiệt thủy, đa hưu tức.',
        vietnamese: 'Bạn bị cảm cúm rồi. Tôi kê cho bạn ít thuốc cảm, uống nhiều nước ấm và nghỉ ngơi nhiều nhé.',
        words: [
          { hanzi: '感冒', pinyin: 'gǎnmào', sinoVietnamese: 'Cảm mạo', meaning: 'Cảm cúm', pos: 'Động từ/Danh từ' },
          { hanzi: '开药', pinyin: 'kāi yào', sinoVietnamese: 'Khai dược', meaning: 'Kê đơn thuốc', pos: 'Cụm động từ' },
          { hanzi: '热水', pinyin: 'rèshuǐ', sinoVietnamese: 'Nhiệt thủy', meaning: 'Nước ấm / nước nóng', pos: 'Danh từ' },
          { hanzi: '休息', pinyin: 'xiūxi', sinoVietnamese: 'Hưu tức', meaning: 'Nghỉ ngơi', pos: 'Động từ' }
        ]
      },
      {
        id: 'hp7-4',
        speaker: {
          id: 'patient',
          name: 'Bạn',
          nameCn: '病人 (Bạn)',
          role: 'B',
          avatar: '🤒',
          gender: 'male'
        },
        hanzi: '好的，请问这个药怎么吃？饭前还是饭后？',
        pinyin: 'Hǎo de, qǐngwèn zhè ge yào zěnme chī? Fàn qián háishì fàn hòu?',
        sinoVietnamese: 'Hảo đích, thỉnh vấn giá cá dược chẩm ma ngật? Phạn tiền hoàn thị phạn hậu?',
        vietnamese: 'Vâng, xin hỏi thuốc này uống thế nào? Uống trước bữa ăn hay sau bữa ăn ạ?',
        words: [
          { hanzi: '饭前', pinyin: 'fàn qián', sinoVietnamese: 'Phạn tiền', meaning: 'Trước bữa ăn', pos: 'Danh từ thời gian' },
          { hanzi: '饭后', pinyin: 'fàn hòu', sinoVietnamese: 'Phạn hậu', meaning: 'Sau bữa ăn', pos: 'Danh từ thời gian' }
        ]
      }
    ]
  },
  {
    id: 'airport-8',
    title: 'Tại Sân Bay: Check-in & Thủ Tục Hải Quan',
    titleCn: '机场值机与海关',
    pinyin: 'Jīchǎng zhíjī yǔ hǎiguān',
    sinoVietnamese: 'Cơ trường trị cơ dữ hải quan',
    level: 'HSK 3',
    category: 'airport',
    categoryNameVn: 'Sân Bay',
    icon: '✈️',
    description: 'Thủ tục gửi hành lý, chọn chỗ ngồi cạnh cửa sổ và qua cửa an ninh.',
    durationMinutes: 6,
    roleplayGoal: {
      roleA: 'Nhân viên sân bay (地勤人员 - Dìqín rényuán)',
      roleB: 'Hành khách (乘客 - Chéngkè)',
      mission: 'Đóng vai hành khách làm thủ tục check-in chuyến bay đến Thượng Hải và xin chỗ ngồi sát cửa sổ.'
    },
    grammarPoints: [
      {
        title: 'Yêu cầu chỗ ngồi: "我想选...的座位"',
        structure: '我想选 [靠窗 / 靠走道] 的座位。',
        explanation: '靠窗 (kào chuāng) là cạnh cửa sổ, 靠走道 (kào zǒudào) là cạnh lối đi.',
        examples: [
          { cn: '请帮我选一个靠窗的座位。', pinyin: 'Qǐng bāng wǒ xuǎn yí gè kào chuāng de zuòwèi.', vn: 'Làm ơn chọn giúp tôi một chỗ ngồi sát cửa sổ.' }
        ]
      }
    ],
    lines: [
      {
        id: 'ap8-1',
        speaker: {
          id: 'staff',
          name: 'Nhân viên',
          nameCn: '地勤',
          role: 'A',
          avatar: '👮‍♀️',
          gender: 'female'
        },
        hanzi: '您好，请出示您的护照和机票。',
        pinyin: 'Nín hǎo, qǐng chūshì nín de hùzhào hé jīpiào.',
        sinoVietnamese: 'Nâm hảo, thỉnh xuất thị nâm đích hộ chiếu hòa cơ phiếu.',
        vietnamese: 'Xin chào quý khách, xin vui lòng xuất trình hộ chiếu và vé máy bay.',
        words: [
          { hanzi: '出示', pinyin: 'chūshì', sinoVietnamese: 'Xuất thị', meaning: 'Xuất trình / đưa ra xem', pos: 'Động từ' },
          { hanzi: '机票', pinyin: 'jīpiào', sinoVietnamese: 'Cơ phiếu', meaning: 'Vé máy bay', pos: 'Danh từ' }
        ]
      },
      {
        id: 'ap8-2',
        speaker: {
          id: 'passenger',
          name: 'Bạn',
          nameCn: '乘客 (Bạn)',
          role: 'B',
          avatar: '✈️',
          gender: 'male'
        },
        hanzi: '给您。我有一件行李需要托运。请问可以选靠窗的座位吗？',
        pinyin: 'Gěi nín. Wǒ yǒu yí jiàn xíngli xūyào tuōyùn. Qǐngwèn kěyǐ xuǎn kào chuāng de zuòwèi ma?',
        sinoVietnamese: 'Cấp nâm. Ngã hữu nhất kiện hành lý nhu yếu thác vận. Thỉnh vấn khả dĩ tuyển kháo song đích tọa vị ma?',
        vietnamese: 'Gửi bạn. Tôi có một kiện hành lý cần gửi ký gửi. Xin hỏi tôi có thể chọn chỗ ngồi cạnh cửa sổ không?',
        words: [
          { hanzi: '行李', pinyin: 'xíngli', sinoVietnamese: 'Hành lý', meaning: 'Hành lý', pos: 'Danh từ' },
          { hanzi: '托运', pinyin: 'tuōyùn', sinoVietnamese: 'Thác vận', meaning: 'Gửi ký gửi', pos: 'Động từ' },
          { hanzi: '靠窗', pinyin: 'kào chuāng', sinoVietnamese: 'Kháo song', meaning: 'Sát cạnh cửa sổ', pos: 'Tính từ' },
          { hanzi: '座位', pinyin: 'zuòwèi', sinoVietnamese: 'Tọa vị', meaning: 'Chỗ ngồi', pos: 'Danh từ' }
        ]
      },
      {
        id: 'ap8-3',
        speaker: {
          id: 'staff',
          name: 'Nhân viên',
          nameCn: '地勤',
          role: 'A',
          avatar: '👮‍♀️',
          gender: 'female'
        },
        hanzi: '没问题，已经为您安排了15A靠窗位。这是您的登机牌，请在12号登机口登机。',
        pinyin: 'Méi wèntí, yǐjīng wèi nín ānpái le shí wǔ A kào chuāng wèi. Zhè shì nín de dēngjīpái, qǐng zài shí èr hào dēngjīkǒu dēngjī.',
        sinoVietnamese: 'Một vấn đề, dĩ kinh vị nâm an bài liễu thập ngũ A kháo song vị. Giá thị nâm đích đăng cơ bài, thỉnh tại thập nhị hào đăng cơ khẩu đăng cơ.',
        vietnamese: 'Không thành vấn đề, đã sắp xếp ghế 15A sát cửa sổ cho quý khách. Đây là thẻ lên máy bay, xin hãy lên tàu bay tại cửa số 12.',
        words: [
          { hanzi: '安排', pinyin: 'ānpái', sinoVietnamese: 'An bài', meaning: 'Sắp xếp / bố trí', pos: 'Động từ' },
          { hanzi: '登机牌', pinyin: 'dēngjīpái', sinoVietnamese: 'Đăng cơ bài', meaning: 'Thẻ lên máy bay (Boarding Pass)', pos: 'Danh từ' },
          { hanzi: '登机口', pinyin: 'dēngjīkǒu', sinoVietnamese: 'Đăng cơ khẩu', meaning: 'Cổng lên máy bay (Gate)', pos: 'Danh từ' }
        ]
      }
    ]
  },
  {
    id: 'boba-9',
    title: 'Tại Quán Trà Sữa: Chọn Đường Đá & Topping',
    titleCn: '在奶茶店点单',
    pinyin: 'Zài nǎichádiàn diǎndān',
    sinoVietnamese: 'Tại nãi trà điếm điểm đơn',
    level: 'HSK 1',
    category: 'restaurant',
    categoryNameVn: 'Ăn Uống',
    icon: '🧋',
    description: 'Tự tin gọi trà sữa, yêu cầu tỉ lệ đường (30%, 50%, 70%), lượng đá và thêm các loại topping trân châu thạch dừa.',
    durationMinutes: 4,
    roleplayGoal: {
      roleA: 'Nhân viên quán trà sữa (店员 - Diànyuán)',
      roleB: 'Khách hàng (顾客 - Gùkè)',
      mission: 'Đóng vai khách gọi 1 ly trà sữa trân châu lớn, 30% đường, ít đá và thêm thạch dừa.'
    },
    grammarPoints: [
      {
        title: 'Quy tắc chọn độ ngọt và đá trong tiếng Trung',
        structure: '[Đường]: 全糖(100%), 少糖(70%), 半糖(50%), 微糖(30%), 无糖(0%) + [Đá]: 正常冰, 少冰, 去冰, 温/热',
        explanation: 'Khẩu ngữ gọi đồ uống cực kỳ phổ biến tại Trung Quốc và Đài Loan.',
        examples: [
          { cn: '我要一杯珍珠奶茶，微糖少冰。', pinyin: 'Wǒ yào yì bēi zhēnzhū nǎichá, wēi táng shǎo bīng.', vn: 'Cho tôi một cốc trà sữa trân châu, 30% đường ít đá.' }
        ]
      }
    ],
    lines: [
      {
        id: 'bb9-1',
        speaker: {
          id: 'staff',
          name: 'Nhân viên',
          nameCn: '店员',
          role: 'A',
          avatar: '🥤',
          gender: 'female'
        },
        hanzi: '您好，请问想喝什么？今天有第二杯半价活动哦！',
        pinyin: 'Nín hǎo, qǐngwèn xiǎng hē shénme? Jīntiān yǒu dì-èr bēi bànjià huódòng ó!',
        sinoVietnamese: 'Nâm hảo, thỉnh vấn tưởng hát thập ma? Kim thiên hữu đệ nhị bôi bán giá hoạt động nga!',
        vietnamese: 'Xin chào, xin hỏi quý khách muốn uống gì? Hôm nay có chương trình cốc thứ 2 giảm 50% giá đấy ạ!',
        words: [
          { hanzi: '第二杯', pinyin: 'dì-èr bēi', sinoVietnamese: 'Đệ nhị bôi', meaning: 'Cốc thứ hai', pos: 'Cụm số từ' },
          { hanzi: '半价', pinyin: 'bànjià', sinoVietnamese: 'Bán giá', meaning: 'Nửa giá (giảm 50%)', pos: 'Danh từ' },
          { hanzi: '活动', pinyin: 'huódòng', sinoVietnamese: 'Hoạt động', meaning: 'Chương trình khuyến mãi / hoạt động', pos: 'Danh từ' }
        ]
      },
      {
        id: 'bb9-2',
        speaker: {
          id: 'customer',
          name: 'Bạn',
          nameCn: '顾客 (Bạn)',
          role: 'B',
          avatar: '🙋‍♂️',
          gender: 'male'
        },
        hanzi: '我要一杯大杯珍珠奶茶，微糖、少冰，再加一份椰果。',
        pinyin: 'Wǒ yào yì bēi dà bēi zhēnzhū nǎichá, wēi táng, shǎo bīng, zài jiā yí fèn yēguǒ.',
        sinoVietnamese: 'Ngã yếu nhất bôi đại bôi trân châu nãi trà, vi đường, thiểu băng, tái gia nhất phần da quả.',
        vietnamese: 'Tôi muốn 1 cốc trà sữa trân châu size lớn, 30% đường, ít đá, và cho thêm một phần thạch dừa.',
        words: [
          { hanzi: '珍珠奶茶', pinyin: 'zhēnzhū nǎichá', sinoVietnamese: 'Trân châu nãi trà', meaning: 'Trà sữa trân châu', pos: 'Danh từ' },
          { hanzi: '微糖', pinyin: 'wēi táng', sinoVietnamese: 'Vi đường', meaning: '30% đường (ngọt nhẹ)', pos: 'Cụm từ' },
          { hanzi: '椰果', pinyin: 'yēguǒ', sinoVietnamese: 'Da quả', meaning: 'Thạch dừa (Nata de coco)', pos: 'Danh từ' }
        ]
      },
      {
        id: 'bb9-3',
        speaker: {
          id: 'staff',
          name: 'Nhân viên',
          nameCn: '店员',
          role: 'A',
          avatar: '🥤',
          gender: 'female'
        },
        hanzi: '好的，一共十八块。请拿好小票，凭号码取餐。',
        pinyin: 'Hǎo de, yígòng shíbā kuài. Qǐng ná hǎo xiǎopiào, píng hàomǎ qǔcān.',
        sinoVietnamese: 'Hảo đích, nhất cộng thập bát khối. Thỉnh nã hảo tiểu phiếu, bằng hiệu mã thủ xan.',
        vietnamese: 'Vâng, tổng cộng là 18 tệ. Xin cầm phiếu hóa đơn, đợi gọi số để nhận đồ nhé.',
        words: [
          { hanzi: '一共', pinyin: 'yígòng', sinoVietnamese: 'Nhất cộng', meaning: 'Tổng cộng', pos: 'Phó từ' },
          { hanzi: '小票', pinyin: 'xiǎopiào', sinoVietnamese: 'Tiểu phiếu', meaning: 'Hóa đơn / phiếu thanh toán nhỏ', pos: 'Danh từ' },
          { hanzi: '凭号码', pinyin: 'píng hàomǎ', sinoVietnamese: 'Bằng hiệu mã', meaning: 'Dựa theo số thứ tự', pos: 'Cụm từ' }
        ]
      }
    ]
  },
  {
    id: 'train-10',
    title: 'Mua Vé Tàu Cao Tốc (Ga Tàu Hỏa)',
    titleCn: '在高铁站买票',
    pinyin: 'Zài gāotiězhàn mǎipiào',
    sinoVietnamese: 'Tại cao thiết trạm mãi phiếu',
    level: 'HSK 2',
    category: 'travel',
    categoryNameVn: 'Du Lịch',
    icon: '🚄',
    description: 'Học cách mua vé tàu cao tốc đi Bắc Kinh/Thượng Hải, chọn vé hạng nhất, hạng nhì và đổi giờ khởi hành.',
    durationMinutes: 5,
    roleplayGoal: {
      roleA: 'Nhân viên bán vé (售票员 - Shòupiàoyuán)',
      roleB: 'Hành khách (乘客 - Chéngkè)',
      mission: 'Đóng vai mua 1 vé tàu cao tốc đến Thượng Hải chuyến sáng mai, chọn ghế hạng 2 cạnh cửa sổ.'
    },
    grammarPoints: [
      {
        title: 'Cấu trúc đặt vé: "买一张去...的票"',
        structure: '我想买 [Số lượng] 张去 [Địa điểm] 的 [G28次 / 高铁] 票',
        explanation: 'Mẫu câu chuẩn khi mua vé tại quầy ga đường sắt Trung Quốc.',
        examples: [
          { cn: '买两张去北京的二等座票。', pinyin: 'Mǎi liǎng zhāng qù Běijīng de èrděngzuò piào.', vn: 'Mua hai vé hạng nhì đi Bắc Kinh.' }
        ]
      }
    ],
    lines: [
      {
        id: 'tr10-1',
        speaker: {
          id: 'ticket_seller',
          name: 'Nhân viên vé',
          nameCn: '售票员',
          role: 'A',
          avatar: '🎫',
          gender: 'female'
        },
        hanzi: '您好，请问您要去哪里？买哪一天的车票？',
        pinyin: 'Nín hǎo, qǐngwèn nín yào qù nǎlǐ? Mǎi nǎ yì tiān de chēpiào?',
        sinoVietnamese: 'Nâm hảo, thỉnh vấn nâm yếu khứ na lý? Mãi na nhất thiên đích xa phiếu?',
        vietnamese: 'Xin chào, xin hỏi quý khách muốn đi đâu? Mua vé tàu ngày nào ạ?',
        words: [
          { hanzi: '车票', pinyin: 'chēpiào', sinoVietnamese: 'Xa phiếu', meaning: 'Vé xe / vé tàu', pos: 'Danh từ' },
          { hanzi: '哪一天', pinyin: 'nǎ yì tiān', sinoVietnamese: 'Na nhất thiên', meaning: 'Ngày nào', pos: 'Đại từ' }
        ]
      },
      {
        id: 'tr10-2',
        speaker: {
          id: 'passenger',
          name: 'Bạn',
          nameCn: '乘客 (Bạn)',
          role: 'B',
          avatar: '🚄',
          gender: 'male'
        },
        hanzi: '我想买一张明天上午去上海的高铁票，二等座。',
        pinyin: 'Wǒ xiǎng mǎi yì zhāng míngtiān shàngwǔ qù Shànghǎi de gāotiě piào, èrděngzuò.',
        sinoVietnamese: 'Ngã tưởng mãi nhất trương minh thiên thượng ngọ khứ Thượng Hải đích cao thiết phiếu, nhị đẳng tọa.',
        vietnamese: 'Tôi muốn mua 1 vé tàu cao tốc đi Thượng Hải vào sáng mai, ghế hạng nhì (khoang phổ thông).',
        words: [
          { hanzi: '明天上午', pinyin: 'míngtiān shàngwǔ', sinoVietnamese: 'Minh thiên thượng ngọ', meaning: 'Sáng mai', pos: 'Danh từ thời gian' },
          { hanzi: '高铁', pinyin: 'gāotiě', sinoVietnamese: 'Cao thiết', meaning: 'Tàu cao tốc (Bullet Train)', pos: 'Danh từ' },
          { hanzi: '二等座', pinyin: 'èrděngzuò', sinoVietnamese: 'Nhị đẳng tọa', meaning: 'Ghế hạng 2 (phổ thông)', pos: 'Danh từ' }
        ]
      },
      {
        id: 'tr10-3',
        speaker: {
          id: 'ticket_seller',
          name: 'Nhân viên vé',
          nameCn: '售票员',
          role: 'A',
          avatar: '🎫',
          gender: 'female'
        },
        hanzi: '早上九点半的G102次有票，全程四个小时，票价五百五十三元。',
        pinyin: 'Zǎoshang jiǔ diǎn bàn de G102 cì yǒu piào, quánchéng sì gè xiǎoshí, piàojià wǔbǎi wǔshí sān yuán.',
        sinoVietnamese: 'Tảo thượng cửu điểm bán đích G102 thứ hữu phiếu, toàn trình tứ cá tiểu thời, phiếu giá ngũ bách ngũ thập tam nguyên.',
        vietnamese: 'Chuyến tàu G102 lúc 9h30 sáng còn vé, toàn bộ hành trình mất 4 tiếng, giá vé là 553 tệ.',
        words: [
          { hanzi: '全程', pinyin: 'quánchéng', sinoVietnamese: 'Toàn trình', meaning: 'Toàn bộ hành trình / tuyến đường', pos: 'Danh từ' },
          { hanzi: '小时', pinyin: 'xiǎoshí', sinoVietnamese: 'Tiểu thời', meaning: 'Giờ / tiếng đồng hồ', pos: 'Lượng từ/Danh từ' },
          { hanzi: '票价', pinyin: 'piàojià', sinoVietnamese: 'Phiếu giá', meaning: 'Giá vé', pos: 'Danh từ' }
        ]
      }
    ]
  },
  {
    id: 'rent-11',
    title: 'Đi Thuê Nhà & Căn Hộ Tại Trung Quốc',
    titleCn: '租房子与签合同',
    pinyin: 'Zū fángzi yǔ qiān hétong',
    sinoVietnamese: 'Tô phòng tử dữ thiêm hợp đồng',
    level: 'HSK 3',
    category: 'daily',
    categoryNameVn: 'Đời Sống',
    icon: '🏠',
    description: 'Hỏi giá thuê, tiền cọc (áp nhất phó tam 押一付三), tiền điện nước, đồ gia dụng và ký hợp đồng thuê.',
    durationMinutes: 6,
    roleplayGoal: {
      roleA: 'Chủ nhà / Môi giới (房东 - Fángdōng)',
      roleB: 'Người thuê (租客 - Zūkè)',
      mission: 'Đóng vai người thuê nhà hỏi tiền thuê mỗi tháng, bao gồm tiền mạng hay không và hẹn xem phòng.'
    },
    grammarPoints: [
      {
        title: 'Khái niệm "押一付三" (Cọc 1 trả 3)',
        structure: '押一付三 (Cọc 1 tháng, thanh toán trước 3 tháng tiền nhà)',
        explanation: 'Quy tắc thanh toán thuê nhà tiêu chuẩn tại hầu hết các thành phố lớn ở Trung Quốc.',
        examples: [
          { cn: '房租一个月两千五，押一付三。', pinyin: 'Fángzū yí gè yuè liǎng qiān wǔ, yā yī fù sān.', vn: 'Tiền thuê nhà mỗi tháng 2500 tệ, cọc 1 tháng trả trước 3 tháng.' }
        ]
      }
    ],
    lines: [
      {
        id: 'rn11-1',
        speaker: {
          id: 'landlord',
          name: 'Chủ nhà',
          nameCn: '房东',
          role: 'A',
          avatar: '👨‍💼',
          gender: 'male'
        },
        hanzi: '你好，这套一室一厅带阳台，家具家电齐全，拎包入住。',
        pinyin: 'Nǐ hǎo, zhè tào yí shì yì tīng dài yángtái, jiājù jiādiàn qíquán, līngbāo rùzhù.',
        sinoVietnamese: 'Nỉ hảo, giá sáo nhất thất nhất thính đái dương đài, gia cụ gia điện tề toàn, linh bao nhập trú.',
        vietnamese: 'Chào bạn, căn hộ này 1 phòng ngủ 1 phòng khách có ban công, nội thất đồ điện đầy đủ, chỉ việc xách vali vào ở.',
        words: [
          { hanzi: '一室一厅', pinyin: 'yí shì yì tīng', sinoVietnamese: 'Nhất thất nhất thính', meaning: '1 phòng ngủ 1 phòng khách', pos: 'Cụm danh từ' },
          { hanzi: '阳台', pinyin: 'yángtái', sinoVietnamese: 'Dương đài', meaning: 'Ban công', pos: 'Danh từ' },
          { hanzi: '拎包入住', pinyin: 'līngbāo rùzhù', sinoVietnamese: 'Linh bao nhập trú', meaning: 'Xách vali vào ở ngay (đủ đồ)', pos: 'Thành ngữ' }
        ]
      },
      {
        id: 'rn11-2',
        speaker: {
          id: 'tenant',
          name: 'Bạn',
          nameCn: '租客 (Bạn)',
          role: 'B',
          avatar: '🏠',
          gender: 'male'
        },
        hanzi: '房东您好，请问每个月房租多少钱？包含物业费和网费吗？',
        pinyin: 'Fángdōng nín hǎo, qǐngwèn měi gè yuè fángzū duōshao qián? Bāohán wùyèfèi hé wǎngfèi ma?',
        sinoVietnamese: 'Phòng đông nâm hảo, thỉnh vấn mỗi cá nguyệt phòng tô đa thiểu tiền? Bao hàm vật nghiệp phí hòa võng phí ma?',
        vietnamese: 'Chào bác chủ nhà, xin hỏi tiền thuê mỗi tháng là bao nhiêu? Đã bao gồm phí quản lý tòa nhà và tiền mạng chưa ạ?',
        words: [
          { hanzi: '房东', pinyin: 'fángdōng', sinoVietnamese: 'Phòng đông', meaning: 'Chủ nhà cho thuê', pos: 'Danh từ' },
          { hanzi: '房租', pinyin: 'fángzū', sinoVietnamese: 'Phòng tô', meaning: 'Tiền thuê nhà', pos: 'Danh từ' },
          { hanzi: '物业费', pinyin: 'wùyèfèi', sinoVietnamese: 'Vật nghiệp phí', meaning: 'Phí dịch vụ tòa nhà / chung cư', pos: 'Danh từ' }
        ]
      },
      {
        id: 'rn11-3',
        speaker: {
          id: 'landlord',
          name: 'Chủ nhà',
          nameCn: '房东',
          role: 'A',
          avatar: '👨‍💼',
          gender: 'male'
        },
        hanzi: '月租三千，包网费和物业。水电费自己交。你今天下午方便来看房吗？',
        pinyin: 'Yuèzū sān qiān, bāo wǎngfèi hé wùyè. Shuǐdiànfèi zìjǐ jiāo. Nǐ jīntiān xiàwǔ fāngbiàn lái kàn fáng ma?',
        sinoVietnamese: 'Nguyệt tô tam thiên, bao võng phí hòa vật nghiệp. Thủy điện phí tự kỷ giao. Nỉ kim thiên hạ ngọ phương tiện lai khán phòng ma?',
        vietnamese: 'Tiền thuê 3000 tệ/tháng, bao gồm tiền mạng và phí quản lý. Tiền điện nước tự đóng. Chiều nay bạn có tiện qua xem phòng không?',
        words: [
          { hanzi: '水电费', pinyin: 'shuǐdiànfèi', sinoVietnamese: 'Thủy điện phí', meaning: 'Tiền điện nước', pos: 'Danh từ' },
          { hanzi: '看房', pinyin: 'kàn fáng', sinoVietnamese: 'Khán phòng', meaning: 'Đi xem nhà / xem phòng', pos: 'Cụm động từ' }
        ]
      }
    ]
  }
];

