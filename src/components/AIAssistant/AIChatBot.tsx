import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { AudioButton } from '../Common/AudioButton';
import { VoiceRecorder } from '../Common/VoiceRecorder';
import { speakChinese, playSoundEffect } from '../../utils/speech';
import { addXP } from '../../utils/storage';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  hanzi: string;
  pinyin?: string;
  vietnamese?: string;
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
    title: '✈️ Hỏi địa điểm du lịch Bắc Kinh',
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

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-0',
    sender: 'ai',
    hanzi: '你好！我是你的中文AI语伴小华 🌸 想聊点什么呢？你可以打字或者按麦克风跟我练习口语哦！',
    pinyin: 'Nǐ hǎo! Wǒ shì nǐ de zhōngwén AI yǔbàn Xiǎohuá. Xiǎng liáo diǎn shénme ne?',
    vietnamese: 'Xin chào! Mình là Tiểu Hoa 🌸 - bạn đồng hành luyện tiếng Trung AI của bạn. Hãy gõ chữ hoặc nhấn Mic để cùng luyện nói nhé!',
    timestamp: 'Vừa xong'
  }
];

export const AIChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showVn, setShowVn] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend = inputVal) => {
    const clean = textToSend.trim();
    if (!clean) return;

    playSoundEffect('click');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      hanzi: clean,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);
    addXP(10);

    // AI Simulation response
    setTimeout(() => {
      // Find intelligent matching response
      const matchedPreset = PRESET_TOPICS.find(p => clean.includes(p.userPrompt.slice(0, 4)) || p.userPrompt.includes(clean));
      
      let aiText = '你说得很好！能再跟我多说一点吗？ (Nǐ shuō de hěn hǎo! Néng zài gēn wǒ duō shuō yìdiǎn ma?)';
      let aiPinyin = 'Nǐ shuō de hěn hǎo! Néng zài gēn wǒ duō shuō yìdiǎn ma?';
      let aiVn = 'Bạn nói tốt lắm! Có thể chia sẻ thêm cho mình một chút được không?';

      if (matchedPreset) {
        aiText = matchedPreset.aiReply;
        aiPinyin = matchedPreset.aiPinyin;
        aiVn = matchedPreset.aiVn;
      } else if (clean.includes('你好') || clean.includes('早')) {
        aiText = '你好呀！今天过得怎么样？吃饭了吗？';
        aiPinyin = 'Nǐ hǎo ya! Jīntiān guò de zěnmeyàng? Chī fàn le ma?';
        aiVn = 'Chào bạn nhé! Hôm nay của bạn thế nào? Đã ăn cơm chưa?';
      } else if (clean.includes('多少钱') || clean.includes('贵') || clean.includes('买')) {
        aiText = '这个原价两百块，今天搞活动算你一百八，很划算哦！';
        aiPinyin = 'Zhè ge yuánjià liǎng bǎi kuài, jīntiān gǎo huódòng suàn nǐ yì bǎi bā, hěn huásuàn ó!';
        aiVn = 'Cái này giá gốc 200 tệ, hôm nay có ưu đãi tính bạn 180 tệ, rất hời luôn!';
      } else if (clean.includes('谢谢')) {
        aiText = '不客气！随时乐意为你解答中文问题。';
        aiPinyin = 'Bú kèqi! Suíshí lèyì wèi nǐ jiědá zhōngwén wèntí.';
        aiVn = 'Đừng khách sáo! Mình luôn sẵn lòng giải đáp các câu hỏi tiếng Trung cho bạn.';
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        hanzi: aiText,
        pinyin: aiPinyin,
        vietnamese: aiVn,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setIsTyping(false);
      setMessages(prev => [...prev, aiMsg]);
      speakChinese(aiText);
    }, 900);
  };

  const handleSelectPreset = (preset: typeof PRESET_TOPICS[0]) => {
    handleSendMessage(preset.userPrompt);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-20">
      {/* Bot Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-red-500 text-white flex items-center justify-center text-2xl shadow-md shadow-pink-500/20">
            🌸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-stone-900 dark:text-white">
                Tiểu Hoa (小华)
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs text-emerald-600 font-semibold">Online AI</span>
            </div>
            <p className="text-xs text-stone-400">Trợ lý luyện khẩu ngữ & phản xạ tiếng Trung</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowPinyin(!showPinyin)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              showPinyin 
                ? 'bg-red-50 dark:bg-red-950/60 text-red-600 border-red-200 dark:border-red-900' 
                : 'text-stone-400 border-stone-200 dark:border-stone-700'
            }`}
          >
            Pinyin
          </button>
          <button
            onClick={() => setShowVn(!showVn)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              showVn 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-200 dark:border-emerald-900' 
                : 'text-stone-400 border-stone-200 dark:border-stone-700'
            }`}
          >
            Dịch
          </button>
        </div>
      </div>

      {/* Preset Topics Quick Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PRESET_TOPICS.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(preset)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-red-400 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-red-600 whitespace-nowrap transition-colors shrink-0 flex items-center gap-1"
          >
            <Sparkles size={12} className="text-amber-500" />
            <span>{preset.title}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="h-[420px] sm:h-[480px] overflow-y-auto p-4 sm:p-5 rounded-3xl bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 space-y-4">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-950/60 flex items-center justify-center text-sm shrink-0 mt-1">
                  🌸
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 space-y-1.5 shadow-xs ${
                isAI 
                  ? 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white' 
                  : 'bg-gradient-to-r from-red-600 to-amber-600 text-white'
              }`}>
                {isAI && showPinyin && msg.pinyin && (
                  <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                    {msg.pinyin}
                  </div>
                )}

                <div className="text-base sm:text-lg font-bold font-chinese tracking-wide leading-relaxed">
                  {msg.hanzi}
                </div>

                {isAI && showVn && msg.vietnamese && (
                  <div className="text-xs text-stone-600 dark:text-stone-300 pt-1.5 border-t border-stone-100 dark:border-stone-700/60">
                    {msg.vietnamese}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[10px] ${isAI ? 'text-stone-400' : 'text-white/70'}`}>
                    {msg.timestamp}
                  </span>
                  {isAI && (
                    <AudioButton text={msg.hanzi} size="sm" variant="ghost" />
                  )}
                </div>
              </div>

              {!isAI && (
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                  Tôi
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-stone-400 italic">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            Tiểu Hoa đang suy nghĩ và gõ câu trả lời...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box & Microphone */}
      <div className="p-3 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-md flex items-center gap-2">
        {/* Live Voice Input for Chat */}
        <div className="shrink-0">
          <VoiceRecorder
            onTranscript={(text) => {
              setInputVal(text);
              handleSendMessage(text);
            }}
          />
        </div>

        <input
          type="text"
          placeholder="Nhập câu tiếng Trung hoặc nhấn Mic để nói..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          className="flex-1 px-3 py-2 text-sm font-medium bg-transparent text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputVal.trim()}
          className="p-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 text-white hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-sm"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
