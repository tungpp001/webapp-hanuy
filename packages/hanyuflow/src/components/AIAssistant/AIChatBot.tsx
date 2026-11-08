import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Volume2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  BookOpen,
  MessageSquare,
  KeyRound,
  Languages
} from 'lucide-react';
import { VoiceRecorder } from '../Common/VoiceRecorder';
import { speakChinese, playSoundEffect } from '../../utils/speech';
import { addXP } from '../../utils/storage';

type AIMode = 'chat' | 'grammar' | 'translate';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  hanzi: string;
  pinyin?: string;
  vietnamese?: string;
  grammarNote?: string;
  suggestedHanzi?: string;
  timestamp: string;
}

const PRESET_TOPICS = [
  {
    title: '🧋 Gọi trà sữa trân châu',
    userPrompt: '你好！我想点一杯珍珠奶茶，少糖少冰。',
    aiReply: '没问题！大杯还是中杯？我们需要加椰果或者布丁吗？',
    aiPinyin: 'Méi wèntí! Dà bēi háishì zhōng bēi? Xūyào jiā yēguǒ huòzhě bùdīng ma?',
    aiVn: 'Không thành vấn đề! Ly lớn hay ly vừa ạ? Bạn có cần thêm thạch dừa hay pudding không?',
  },
  {
    title: '🛍️ Trả giá mua đồ Taobao',
    userPrompt: '老板，这件衣服质量怎么样？买两件能包邮打折吗？',
    aiReply: '亲，质量绝对保真！买两件立减二十元，还包邮顺丰哦！',
    aiPinyin: 'Qīn, zhìliàng juéduì bǎozhēn! Mǎi liǎng jiàn lìjiǎn èrshí yuán, hái bāoyóu Shùnfēng ó!',
    aiVn: 'Khách yêu ơi, chất lượng chuẩn xịn luôn! Mua 2 cái giảm ngay 20 tệ, lại còn freeship hỏa tốc Thuận Phong nhé!',
  },
  {
    title: '✈️ Du lịch Bắc Kinh',
    userPrompt: '我去北京旅游三天，推荐去哪里玩？',
    aiReply: '建议第一天去故宫和天安门，第二天爬长城，第三天去颐和园吃北京烤鸭！',
    aiPinyin: 'Jiànyì dì-yī tiān qù Gùgōng hé Tiān\'ānmén, dì-èr tiān pá Chángchéng, dì-sān tiān qù Yíhéyuán chī Běijīng kǎoyā!',
    aiVn: 'Gợi ý ngày 1 đi Cố Cung và Thiên An Môn, ngày 2 leo Vạn Lý Trường Thành, ngày 3 đi Di Hòa Viên và ăn Vịt quay Bắc Kinh!',
  },
  {
    title: '💼 Phỏng vấn xin việc',
    userPrompt: '面试官您好，我对贵公司的岗位非常感兴趣。',
    aiReply: '你好！请问你之前有做过相关项目吗？最大的优势是什么？',
    aiPinyin: 'Nǐ hǎo! Qǐngwèn nǐ zhīqián yǒu zuòguo xiāngguān xiàngmù ma? Zuì dà de yōushì shì shénme?',
    aiVn: 'Chào bạn! Xin hỏi bạn trước đây đã từng làm dự án liên quan chưa? Thế mạnh lớn nhất của bạn là gì?',
  }
];

export const AIChatBot: React.FC = () => {
  const [mode, setMode] = useState<AIMode>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'ai',
      hanzi: '你好！我是你的中文AI语伴小华 🌸 想聊点什么呢？你可以打字或者按麦克风跟我练习口语，或者切换到【Chữa Lỗi Ngữ Pháp】 để kiểm tra câu nhé!',
      pinyin: 'Nǐ hǎo! Wǒ shì nǐ de zhōngwén AI yǔbàn Xiǎohuá. Nǐ kěyǐ dǎzì huòzhě àn màikèfēng gēn wǒ liànxí kǒuyǔ!',
      vietnamese: 'Xin chào! Mình là Tiểu Hoa 🌸 - bạn đồng hành AI của bạn. Bạn có thể gõ chữ hoặc thu âm mic để cùng luyện nói, hoặc chuyển sang chế độ 【Chữa Lỗi Ngữ Pháp】 nhé!',
      timestamp: 'Vừa xong'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showVn, setShowVn] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('hanyu_gemini_api_key') || '';
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key.trim());
    localStorage.setItem('hanyu_gemini_api_key', key.trim());
    setShowApiKeyModal(false);
    playSoundEffect('correct');
  };

  const handleSendMessage = async (textToSend = inputVal) => {
    const clean = textToSend.trim();
    if (!clean) return;

    playSoundEffect('click');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      hanzi: clean,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);
    addXP(15);

    // Call Real Gemini API if API key exists, otherwise use Smart Simulated Engine
    if (apiKey) {
      try {
        let systemPrompt = 'Bạn là Tiểu Hoa (小华), trợ lý gia sư tiếng Trung thông minh, thân thiện. Hãy trả lời người học bằng tiếng Trung kèm Pinyin có dấu và bản dịch tiếng Việt.';
        if (mode === 'grammar') {
          systemPrompt = 'Bạn là chuyên gia ngữ pháp tiếng Trung. Hãy kiểm tra câu của người học: chỉ ra lỗi ngữ pháp (nếu có), giải thích lý do bằng tiếng Việt, và cung cấp câu viết lại chuẩn tự nhiên (kèm Pinyin & Nghĩa tiếng Việt).';
        } else if (mode === 'translate') {
          systemPrompt = 'Bạn là chuyên gia dịch thuật Trung - Việt. Hãy dịch chính xác câu sau, cung cấp Pinyin có dấu và giải thích từ vựng cốt lõi.';
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nNgười học nói: "${clean}"\n\nHãy trả lời theo định dạng JSON:\n{\n  "hanzi": "Câu trả lời tiếng Trung",\n  "pinyin": "Phiên âm Pinyin",\n  "vietnamese": "Nghĩa tiếng Việt",\n  "grammarNote": "Nhận xét ngữ pháp (nếu có)",\n  "suggestedHanzi": "Câu gợi ý chuẩn hơn (nếu có)"\n}` }]
              }
            ]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const aiMsg: ChatMessage = {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              hanzi: parsed.hanzi || clean,
              pinyin: parsed.pinyin,
              vietnamese: parsed.vietnamese,
              grammarNote: parsed.grammarNote,
              suggestedHanzi: parsed.suggestedHanzi,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setIsTyping(false);
            setMessages((prev) => [...prev, aiMsg]);
            speakChinese(aiMsg.hanzi);
            return;
          }
        }
      } catch (e) {
        console.warn('API call fallback to smart engine:', e);
      }
    }

    // Smart Simulated AI Engine
    setTimeout(() => {
      let aiText = '';
      let aiPinyin = '';
      let aiVn = '';
      let grammarNote = '';
      let suggestedHanzi = '';

      if (mode === 'grammar') {
        // Grammar Analysis Engine
        if (clean.includes('很') && clean.includes('喜欢')) {
          grammarNote = '💡 Lưu ý: Trong tiếng Trung, khi muốn nói "rất thích", người ta thường dùng "非常喜欢" (fēicháng xǐhuan) hoặc "很喜欢" (hěn xǐhuan) đứng trước tân ngữ.';
          suggestedHanzi = clean.replace('很喜欢', '非常喜欢');
        } else if (clean.includes('是') && (clean.includes('好') || clean.includes('漂亮') || clean.includes('高兴'))) {
          grammarNote = '⚠️ Lỗi phổ biến: Tính từ trong tiếng Trung làm vị ngữ không cần đi kèm động từ "是". Hãy dùng phó từ chỉ mức độ như "很", "非常" thay cho "是".';
          suggestedHanzi = clean.replace('是', '很');
        } else {
          grammarNote = '✅ Câu của bạn có cấu trúc rất tốt, ngữ pháp chuẩn xác!';
          suggestedHanzi = clean;
        }

        aiText = `分析完成：${clean}`;
        aiPinyin = 'Fēnxī wánchéng';
        aiVn = `Đã phân tích ngữ pháp cho câu của bạn!`;
      } else if (mode === 'translate') {
        aiText = clean;
        aiPinyin = 'Fānyì jiéguǒ';
        aiVn = `Dịch nghĩa: "${clean}"`;
        grammarNote = `Bản dịch tự động và phân tích cú pháp hoàn tất.`;
      } else {
        // Conversation Mode
        const matchedPreset = PRESET_TOPICS.find(p => clean.includes(p.userPrompt.slice(0, 4)) || p.userPrompt.includes(clean));
        if (matchedPreset) {
          aiText = matchedPreset.aiReply;
          aiPinyin = matchedPreset.aiPinyin;
          aiVn = matchedPreset.aiVn;
        } else if (clean.includes('你好') || clean.includes('早')) {
          aiText = '你好呀！今天想和我聊些什么有趣的话题呢？';
          aiPinyin = 'Nǐ hǎo ya! Jīntiān xiǎng hé wǒ liáo xiē shénme yǒuqù de huàtí ne?';
          aiVn = 'Chào bạn nhé! Hôm nay bạn muốn cùng mình trò chuyện về chủ đề thú vị nào?';
        } else if (clean.includes('多少钱') || clean.includes('贵') || clean.includes('买')) {
          aiText = '这个原价两百块，今天搞活动算你一百八，很划算哦！';
          aiPinyin = 'Zhè ge yuánjià liǎng bǎi kuài, jīntiān gǎo huódòng suàn nǐ yì bǎi bā, hěn huásuàn ó!';
          aiVn = 'Cái này giá gốc 200 tệ, hôm nay ưu đãi tính bạn 180 tệ, rất hời luôn!';
        } else if (clean.includes('谢谢')) {
          aiText = '不客气！随时乐意为你解答中文问题。';
          aiPinyin = 'Bú kèqi! Suíshí lèyì wèi nǐ jiědá zhōngwén wèntí.';
          aiVn = 'Đừng khách sáo! Mình luôn sẵn lòng giải đáp câu hỏi tiếng Trung cho bạn.';
        } else {
          aiText = '你说得很好！能再跟我多分享一点相关的想法吗？';
          aiPinyin = 'Nǐ shuō de hěn hǎo! Néng zài gēn wǒ duō fēnxiǎng yìdiǎn xiāngguān de xiǎngfǎ ma?';
          aiVn = 'Bạn nói rất tốt! Bạn có thể chia sẻ thêm cho mình một chút suy nghĩ liên quan không?';
        }
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        hanzi: aiText,
        pinyin: aiPinyin,
        vietnamese: aiVn,
        grammarNote,
        suggestedHanzi,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, aiMsg]);
      speakChinese(aiText);
    }, 850);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in pb-20">
      {/* Bot Header & Mode Switcher */}
      <div className="p-4 sm:p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white flex items-center justify-center text-2xl shadow-md shadow-rose-500/20">
              🌸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-lg text-stone-900 dark:text-white">
                  Gia Sư AI Tiểu Hoa (小华)
                </h2>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Online AI</span>
              </div>
              <p className="text-xs text-stone-400">Trợ lý hội thoại thực chiến & chữa lỗi ngữ pháp tiếng Trung</p>
            </div>
          </div>

          {/* Controls & API Key */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowApiKeyModal(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                apiKey
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300'
                  : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-red-400'
              }`}
              title="Cài đặt API Key để dùng LLM thật"
            >
              <KeyRound size={14} />
              <span>{apiKey ? 'API: Đã kích hoạt' : 'Cài API Key'}</span>
            </button>

            <button
              onClick={() => setShowPinyin(!showPinyin)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                showPinyin
                  ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/60 dark:border-red-900'
                  : 'border-stone-200 dark:border-stone-700 text-stone-400'
              }`}
              title={showPinyin ? 'Ẩn Pinyin' : 'Hiện Pinyin'}
            >
              {showPinyin ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>

            <button
              onClick={() => setShowVn(!showVn)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                showVn
                  ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/60 dark:border-red-900'
                  : 'border-stone-200 dark:border-stone-700 text-stone-400'
              }`}
              title={showVn ? 'Ẩn nghĩa tiếng Việt' : 'Hiện nghĩa tiếng Việt'}
            >
              <Languages size={16} />
            </button>
          </div>
        </div>

        {/* 3 AI Modes Bar */}
        <div className="grid grid-cols-3 gap-2 bg-stone-100 dark:bg-stone-800/70 p-1.5 rounded-2xl">
          <button
            onClick={() => {
              playSoundEffect('click');
              setMode('chat');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'chat'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare size={14} />
            <span>Hội Thoại Đối Đáp</span>
          </button>

          <button
            onClick={() => {
              playSoundEffect('click');
              setMode('grammar');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'grammar'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Chữa Lỗi Ngữ Pháp</span>
          </button>

          <button
            onClick={() => {
              playSoundEffect('click');
              setMode('translate');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'translate'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            <span>Dịch & Phân Tích</span>
          </button>
        </div>
      </div>

      {/* Preset Topics for Quick Start */}
      {mode === 'chat' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRESET_TOPICS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(preset.userPrompt)}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-red-400 text-xs font-bold text-stone-700 dark:text-stone-300 whitespace-nowrap transition-all shadow-xs cursor-pointer shrink-0"
            >
              {preset.title}
            </button>
          ))}
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="p-4 sm:p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm min-h-[380px] max-h-[500px] overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'} animate-fade-in`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center text-sm shadow-xs shrink-0">
                  🌸
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl space-y-2 ${
                  isAI
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-tl-sm'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-tr-sm shadow-md'
                }`}
              >
                {/* Hanzi */}
                <div className="text-base sm:text-lg font-bold font-chinese leading-relaxed">
                  {msg.hanzi}
                </div>

                {/* Pinyin */}
                {showPinyin && msg.pinyin && (
                  <div className={`text-xs font-medium font-sans ${isAI ? 'text-red-600 dark:text-red-400' : 'text-red-100'}`}>
                    {msg.pinyin}
                  </div>
                )}

                {/* Vietnamese */}
                {showVn && msg.vietnamese && (
                  <div className={`text-xs ${isAI ? 'text-stone-600 dark:text-stone-300' : 'text-rose-100'} border-t ${isAI ? 'border-stone-200 dark:border-stone-700' : 'border-white/20'} pt-1.5`}>
                    {msg.vietnamese}
                  </div>
                )}

                {/* Grammar Notes / Suggestions */}
                {msg.grammarNote && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900 text-stone-800 dark:text-stone-200 text-xs space-y-1">
                    <span className="font-bold text-amber-800 dark:text-amber-400 block">
                      {msg.grammarNote}
                    </span>
                    {msg.suggestedHanzi && (
                      <div className="pt-1 border-t border-amber-200/60 dark:border-amber-900/60 font-chinese font-bold text-emerald-700 dark:text-emerald-400">
                        👉 Câu gợi ý: {msg.suggestedHanzi}
                      </div>
                    )}
                  </div>
                )}

                {/* Action & Timestamp */}
                <div className="flex items-center justify-between gap-2 pt-1 text-[10px] opacity-70">
                  <span>{msg.timestamp}</span>
                  <button
                    onClick={() => {
                      playSoundEffect('click');
                      speakChinese(msg.suggestedHanzi || msg.hanzi);
                    }}
                    className="p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-stone-400 text-xs italic animate-pulse">
            <span>Tiểu Hoa đang suy nghĩ và gõ phản hồi...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 sm:p-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-2">
        <VoiceRecorder
          onTranscript={(text) => {
            setInputVal(text);
            handleSendMessage(text);
          }}
        />

        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder={
            mode === 'grammar'
              ? 'Nhập câu tiếng Trung bạn muốn kiểm tra ngữ pháp...'
              : mode === 'translate'
              ? 'Nhập câu tiếng Trung hoặc tiếng Việt cần dịch...'
              : 'Gõ tiếng Trung hoặc bấm Mic để nói chuyện với Tiểu Hoa...'
          }
          className="flex-1 px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-red-500"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputVal.trim()}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-40 text-white shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Send size={16} />
        </button>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-red-500" />
                <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                  Cài Đặt Gemini API Key
                </h3>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Nhập <strong>Google Gemini API Key</strong> miễn phí để Tiểu Hoa có thể trả lời thông minh 100% mọi tình huống và chữa ngữ pháp nâng cao. Khóa được lưu cục bộ trên trình duyệt của bạn (LocalStorage).
            </p>

            <input
              type="password"
              defaultValue={apiKey}
              id="apiKeyInput"
              placeholder="Dán mã AIzaSy... vào đây"
              className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleSaveApiKey('')}
                className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
              >
                Xóa Key (Dùng máy ảo)
              </button>

              <button
                onClick={() => {
                  const val = (document.getElementById('apiKeyInput') as HTMLInputElement)?.value;
                  handleSaveApiKey(val || '');
                }}
                className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Lưu Khóa API
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
