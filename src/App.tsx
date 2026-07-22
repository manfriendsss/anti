import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Loader2, 
  Sparkles, 
  History as HistoryIcon, 
  Home, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  MessageSquareWarning, 
  MessageSquare,
  UserCheck, 
  Flame, 
  Skull, 
  ChevronDown, 
  Settings, 
  Key, 
  X, 
  AlertCircle,
  Volume2,
  VolumeX,
  ShieldAlert
} from 'lucide-react';

interface Responses {
  polite?: string;
  sarcastic?: string;
  brutal?: string;
}

interface HistoryItem {
  id: string;
  query: string;
  responses: Responses;
  timestamp: number;
}

const TONE_LABELS = {
  polite: 'Lịch sự',
  sarcastic: 'Mỉa mai',
  brutal: 'Cùn'
};

const TONE_SUBTITLES = {
  polite: 'Phân tích logic & Khách quan',
  sarcastic: 'Châm biếm & Đá xoáy',
  brutal: 'Thực dụng & Vỗ mặt'
};

const TONE_ICONS = {
  polite: UserCheck,
  sarcastic: Flame,
  brutal: Skull
};



const SYSTEM_PROMPTS = {
  polite: `Bạn là một chuyên gia tranh luận và phản biện sắc sảo. 
Nhiệm vụ của bạn là bẻ gãy luận điểm mà người dùng cung cấp một cách CỰC KỲ LOGIC, LỊCH SỰ, và KHÁCH QUAN.
Yêu cầu bắt buộc:
1. Bám sát 100% vào nội dung câu nói của họ để tìm ra lỗ hổng tư duy.
2. Phân tích dựa trên thực tế, kinh tế, xã hội hoặc quy luật vận hành, cung cấp góc nhìn đa chiều.
3. Trả lời ngắn gọn, súc tích, đi thẳng vào vấn đề (khoảng 3-4 câu).
4. Không xưng hô "tôi/bạn" một cách quá máy móc. Trực tiếp đưa ra nhận định.`,

  sarcastic: `Bạn là một bậc thầy châm biếm và mỉa mai sâu cay.
Nhiệm vụ của bạn là phản bác câu nói của người dùng bằng sự MỈA MAI, CHÂM BIẾM.
Yêu cầu bắt buộc:
1. Bám sát từng chữ họ nói để "đá xoáy". Dùng chính logic của họ để đập lại họ.
2. Dùng phép so sánh ngầm hoặc ẩn dụ để chỉ ra sự vô lý, ngây ngô hoặc tiêu chuẩn kép trong tư duy của họ.
3. Giọng văn: Cay nghiệt tinh tế, buồn cười, thông minh.
4. Trả lời ngắn gọn, súc tích, cực kỳ thâm thúy (khoảng 3-4 câu).`,

  brutal: `Bạn là một người phản biện thẳng thắn, gay gắt, thực dụng và KHÔNG NỂ NANG.
Nhiệm vụ của bạn là "vỗ mặt" luận điểm của người dùng bằng sự thật trần trụi.
Yêu cầu bắt buộc:
1. Bám sát chặt chẽ câu nói của họ để phản pháo trực diện, không khoan nhượng. 
2. Bẻ gãy luận điểm bằng logic thực dụng (tiền bạc, lợi ích, quy luật sinh tồn). Phá vỡ những tư duy "màu hồng", đạo lý suông.
3. Giọng văn: Cùn, đanh đá, gai góc, hơi "chợ búa" nhưng cực kỳ thực tế và chính xác.
4. Trả lời cực kỳ ngắn gọn, súc tích (khoảng 2-3 câu dội bom).`
};

const callGeminiAPI = async (query: string, tone: 'polite' | 'sarcastic' | 'brutal', apiKey: string) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Hãy phản biện sắc bén luận điệu sau theo đúng tính cách được giao:\n"${query}"` }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPTS[tone] }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000
      }
    })
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Lỗi kết nối API. Vui lòng kiểm tra lại API Key.');
  }
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Không nhận được câu trả lời từ AI.');
  
  return text.trim();
};

const INITIAL_DATA: HistoryItem[] = [
  {
    id: 'init_1',
    query: 'Đất đai, cảnh quan hoang sơ là của chung, sao lại đem bê tông hóa cho doanh nghiệp tư nhân phân lô bán nền?',
    timestamp: Date.now() - 4000,
    responses: {
      polite: 'Doanh nghiệp không "cướp" đất công hay chiếm đoạt tài nguyên, mà nhà nước giao đất/cho thuê theo quy hoạch phát triển kinh tế - xã hội. Tài nguyên nằm ngủ quên không tạo ra giá trị thì nhà nước thất thu thuế, người dân bản địa cũng mất cơ hội việc làm. Dự án hợp pháp biến tài sản chết thành động lực phát triển.',
      sarcastic: 'Đất nhà nước giao theo quy hoạch đàng hoàng chứ có phải đất hoang sau vườn nhà bạn đâu mà đòi giữ. Cứ bắt nó ngủ quên để các bạn thỉnh thoảng xách xe qua check-in hít không khí miễn phí, còn dân bản địa đói kém thì mặc kệ nhỉ?',
      brutal: 'Bớt bốc phét lại đi mấy thánh. Giữ cho mấy ông đến chụp ảnh sống ảo chắc nuôi được kinh tế địa phương hay gì? Đất người ta quy hoạch tỷ đô để phát triển kinh tế, nộp ngân sách, tạo việc làm chứ không phải chỗ để mấy con giời ôm mộng hoang sơ hít khí trời.'
    }
  },
  {
    id: 'init_2',
    query: 'Làm thuê lương 10 triệu/tháng thì bao giờ mới mua được nhà ở Hà Nội?',
    timestamp: Date.now() - 8000,
    responses: {
      polite: 'Mức lương 10 triệu/tháng chỉ đủ chi trả mức sống cơ bản tại thành phố lớn. Để tích lũy mua tài sản lớn như bất động sản, đòi hỏi phải nâng cao năng lực để tăng thu nhập, đầu tư bản thân hoặc chuyển hướng sang các thị trường vùng ven có mức giá phù hợp hơn.',
      sarcastic: 'Nếu chỉ biết đi làm 8 tiếng rồi về lướt TikTok với mức lương 10 triệu thì câu trả lời là... kiếp sau nhé. Muốn mua nhà bằng thu nhập đó mà không tăng năng lực hay tìm cách kinh doanh thêm thì đúng là ảo tưởng sức mạnh.',
      brutal: 'Lương 10 triệu còn đòi mua nhà thủ đô? Bớt nằm mơ giữa ban ngày lại! Đi cày nâng trình hoặc tìm cách kinh doanh đi, chứ ngồi đó thắc mắc thì cả đời chỉ có nước ở trọ mà thôi.'
    }
  }
];

const obfuscateKey = (key: string) => {
  try {
    return btoa(encodeURIComponent(key));
  } catch {
    return key;
  }
};

const deobfuscateKey = (stored: string) => {
  try {
    return decodeURIComponent(atob(stored));
  } catch {
    return stored;
  }
};

const maskKeyDisplay = (key: string) => {
  if (!key) return '';
  if (key.length <= 10) return '••••••••••••';
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'history'>('home');
  const [query, setQuery] = useState('');
  const [selectedTone, setSelectedTone] = useState<'polite' | 'sarcastic' | 'brutal'>('sarcastic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCardTone, setActiveCardTone] = useState<Record<string, 'polite' | 'sarcastic' | 'brutal'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Settings & API Key Modal State
  const [apiKey, setApiKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio Speech state
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('ai_history_real');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.length > 0 ? parsed : INITIAL_DATA);
        if (parsed.length > 0) setExpandedId(parsed[0].id);
      } catch (e) {
        console.error(e);
        setHistory(INITIAL_DATA);
        setExpandedId(INITIAL_DATA[0].id);
      }
    } else {
      setHistory(INITIAL_DATA);
      setExpandedId(INITIAL_DATA[0].id);
    }

    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      const realKey = deobfuscateKey(savedKey);
      setApiKey(realKey);
    }
  }, []);

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('ai_history_real', JSON.stringify(newHistory));
  };

  const handleSaveKey = () => {
    const trimmed = inputKey.trim();
    if (trimmed) {
      setApiKey(trimmed);
      localStorage.setItem('gemini_api_key', obfuscateKey(trimmed));
    }
    setInputKey('');
    setIsSettingsOpen(false);
  };

  const handleRemoveKey = () => {
    setApiKey('');
    setInputKey('');
    localStorage.removeItem('gemini_api_key');
  };

  const handleGenerate = async () => {
    if (!query.trim()) return;

    if (!apiKey) {
      setIsSettingsOpen(true);
      setErrorMsg('Vui lòng nhập Gemini API Key của bạn để bắt đầu sử dụng AI thật.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const responseText = await callGeminiAPI(query, selectedTone, apiKey);

      const existingIndex = history.findIndex(
        h => h.query.toLowerCase().trim() === query.toLowerCase().trim()
      );

      let newHistory: HistoryItem[];
      let targetId: string;

      if (existingIndex !== -1) {
        targetId = history[existingIndex].id;
        newHistory = [...history];
        newHistory[existingIndex] = {
          ...newHistory[existingIndex],
          responses: {
            ...newHistory[existingIndex].responses,
            [selectedTone]: responseText
          }
        };
      } else {
        targetId = Date.now().toString();
        const newItem: HistoryItem = {
          id: targetId,
          query: query.trim(),
          responses: {
            [selectedTone]: responseText
          },
          timestamp: Date.now()
        };
        newHistory = [newItem, ...history];
      }

      saveHistory(newHistory);
      setExpandedId(targetId);
      setActiveCardTone(prev => ({ ...prev, [targetId]: selectedTone }));
      setQuery('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi gọi AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    saveHistory(updated);
    if (expandedId === id) {
      setExpandedId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, id: string) => {
    if ('speechSynthesis' in window) {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredHistory = history.filter(item => 
    item.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Object.values(item.responses).some(r => r?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col relative pb-32 overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-emerald-600/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed -bottom-32 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#080C14]/80 backdrop-blur-md border-b border-slate-800/60 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-[1px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-400 bg-clip-text text-transparent tracking-tight">
                AntiDebate
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Gemini 3.6 Engine
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex items-center gap-2 group"
            title="Cấu hình API Key"
          >
            <Settings className="w-4 h-4 transition-transform group-hover:rotate-45" />
            <span className="text-xs font-semibold hidden sm:inline">
              {apiKey ? 'Đã kết nối API' : 'Cấu hình API'}
            </span>
            {!apiKey && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-6">
        {/* Banner Alert if No API Key */}
        {!apiKey && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                Chưa cài đặt Gemini API Key. Nhấn nút cài đặt để kết nối và bắt đầu phản biện thực tế.
              </p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold whitespace-nowrap hover:bg-amber-400 transition"
            >
              Cài ngay
            </button>
          </motion.div>
        )}

        {/* Global Error Notice */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-200">Lỗi thực thi</p>
              <p className="mt-0.5 opacity-90">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {activeTab === 'home' ? (
          <div className="space-y-6">
            {/* Input Card */}
            <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4 text-emerald-400 text-xs font-semibold tracking-wider uppercase">
                <MessageSquareWarning className="w-4 h-4" />
                <span>Nhập câu luận điệu cần bóc phốt</span>
              </div>

              <div className="relative mb-5">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ví dụ: 'Thế mày đi du lịch thích đi tham quan thắng cảnh hay chui vào resort hơn?'"
                  rows={4}
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Tone Selection Pills */}
              <div className="mb-6">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Chọn sắc thái phản biện
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/60 relative">
                  {(['polite', 'sarcastic', 'brutal'] as const).map((tone) => {
                    const Icon = TONE_ICONS[tone];
                    const isSelected = selectedTone === tone;
                    return (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setSelectedTone(tone)}
                        className={`relative z-10 py-3 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                          isSelected ? 'text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="tonePill"
                            className="absolute inset-0 bg-slate-800/90 border border-emerald-500/30 rounded-xl shadow-lg shadow-emerald-950/50 -z-10"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'opacity-70'}`} />
                        <span>{TONE_LABELS[tone]}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 text-center italic">
                  {TONE_SUBTITLES[selectedTone]}
                </p>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !query.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-all active:scale-[0.99]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI đang vò đầu bẻ luận điểm...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 fill-slate-950" />
                    <span>Phản Biện Sắc Bén ngay</span>
                  </>
                )}
              </button>
            </div>

            {/* Current Result Display (Accordion format if available) */}
            {history.length > 0 && expandedId === history[0].id && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-3xl p-5 border-l-4 border-l-emerald-500 shadow-2xl relative"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Kết quả vừa phản biện
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-200 mb-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 leading-relaxed italic">
                  "{history[0].query}"
                </p>

                {/* Tone Switcher Tabs for Current Card */}
                <div className="flex border-b border-slate-800/80 mb-4 overflow-x-auto no-scrollbar gap-1">
                  {(['polite', 'sarcastic', 'brutal'] as const).map((t) => {
                    const hasResponse = !!history[0].responses[t];
                    const curTone = activeCardTone[history[0].id] || selectedTone;
                    const isActive = curTone === t;
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          if (!hasResponse && apiKey && !isGenerating) {
                            setSelectedTone(t);
                            setQuery(history[0].query);
                          } else {
                            setActiveCardTone(prev => ({ ...prev, [history[0].id]: t }));
                          }
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                          isActive 
                            ? 'border-emerald-400 text-emerald-300 bg-emerald-500/5' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{TONE_LABELS[t]}</span>
                        {!hasResponse && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Tạo mới</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Response Text */}
                {(() => {
                  const curTone = activeCardTone[history[0].id] || selectedTone;
                  const responseText = history[0].responses[curTone];
                  return responseText ? (
                    <div className="relative group bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                      <p className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                        {responseText}
                      </p>
                      
                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800/50">
                        <button
                          onClick={() => handleSpeak(responseText, `home_${curTone}`)}
                          className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                            speakingId === `home_${curTone}` 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {speakingId === `home_${curTone}` ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          <span>{speakingId === `home_${curTone}` ? 'Dừng đọc' : 'Đọc câu này'}</span>
                        </button>

                        <button
                          onClick={() => handleCopy(responseText, `home_${curTone}`)}
                          className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition"
                        >
                          {copiedId === `home_${curTone}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === `home_${curTone}` ? 'Đã sao chép' : 'Sao chép'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-xs italic">
                      Chưa có phản biện ở sắc thái này. Nhấn tab trên để yêu cầu AI tạo mới.
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </div>
        ) : (
          /* History View */
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm lịch sử phản biện..."
                className="w-full bg-slate-900/80 border border-slate-800/80 rounded-2xl pl-11 pr-4 py-3.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Accordion History List */}
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm glass-card rounded-3xl">
                Không tìm thấy câu phản biện nào phù hợp.
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isExpanded = expandedId === item.id;
                const curTone = activeCardTone[item.id] || 'sarcastic';
                const currentResponse = item.responses[curTone] || Object.values(item.responses)[0];

                return (
                  <motion.div
                    key={item.id}
                    layout
                    className={`glass-card rounded-2xl overflow-hidden border transition-all ${
                      isExpanded ? 'border-emerald-500/30 shadow-xl' : 'border-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    {/* Header Bar */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-4 cursor-pointer flex items-center justify-between gap-3 select-none hover:bg-slate-900/40 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-200 truncate">
                          {item.query}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-emerald-400' : ''}`} />
                      </div>
                    </div>

                    {/* Accordion Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-800/60 p-4 bg-slate-950/40"
                        >
                          {/* Tone Switcher Tabs */}
                          <div className="flex border-b border-slate-800/80 mb-4 overflow-x-auto no-scrollbar gap-1">
                            {(['polite', 'sarcastic', 'brutal'] as const).map((t) => {
                              const hasResp = !!item.responses[t];
                              const isActive = curTone === t;
                              return (
                                <button
                                  key={t}
                                  onClick={() => {
                                    if (hasResp) {
                                      setActiveCardTone(prev => ({ ...prev, [item.id]: t }));
                                    } else if (apiKey && !isGenerating) {
                                      setSelectedTone(t);
                                      setQuery(item.query);
                                      setActiveTab('home');
                                    }
                                  }}
                                  className={`py-2 px-3 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                                    isActive 
                                      ? 'border-emerald-400 text-emerald-300 bg-emerald-500/5' 
                                      : 'border-transparent text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <span>{TONE_LABELS[t]}</span>
                                  {!hasResp && (
                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Tạo mới</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Active Response Text */}
                          {currentResponse ? (
                            <div className="relative group bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                              <p className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                                {currentResponse}
                              </p>
                              
                              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800/50">
                                <button
                                  onClick={() => handleSpeak(currentResponse, `${item.id}_${curTone}`)}
                                  className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                                    speakingId === `${item.id}_${curTone}` 
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                                  }`}
                                >
                                  {speakingId === `${item.id}_${curTone}` ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                  <span>{speakingId === `${item.id}_${curTone}` ? 'Dừng đọc' : 'Đọc câu này'}</span>
                                </button>

                                <button
                                  onClick={() => handleCopy(currentResponse, `${item.id}_${curTone}`)}
                                  className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition"
                                >
                                  {copiedId === `${item.id}_${curTone}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedId === `${item.id}_${curTone}` ? 'Đã sao chép' : 'Sao chép'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-slate-500 text-xs italic">
                              Chưa có phản biện ở sắc thái này. Nhấp vào tab để sang trang tạo mới.
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Dock Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 rounded-full p-2 shadow-2xl shadow-black/80 flex items-center justify-around relative">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-3 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all relative z-10 ${
              activeTab === 'home' ? 'text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeTab === 'home' && (
              <motion.div
                layoutId="dockPill"
                className="absolute inset-0 bg-emerald-500/15 border border-emerald-500/30 rounded-full -z-10 shadow-lg shadow-emerald-500/10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-emerald-400' : ''}`} />
            <span>Phản Biện</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all relative z-10 ${
              activeTab === 'history' ? 'text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeTab === 'history' && (
              <motion.div
                layoutId="dockPill"
                className="absolute inset-0 bg-emerald-500/15 border border-emerald-500/30 rounded-full -z-10 shadow-lg shadow-emerald-500/10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <HistoryIcon className={`w-4 h-4 ${activeTab === 'history' ? 'text-emerald-400' : ''}`} />
            <span>Lịch Sử</span>
          </button>
        </div>
      </nav>

      {/* Settings Modal (Gemini API Key) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">Cấu hình API Key</h3>
                    <p className="text-xs text-slate-400">Kết nối Google Gemini AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {apiKey ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Đã kết nối API Key</p>
                      <p className="text-xs font-mono text-slate-300 truncate mt-0.5">{maskKeyDisplay(apiKey)}</p>
                    </div>
                    <button
                      onClick={handleRemoveKey}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold whitespace-nowrap transition"
                    >
                      Xóa Key
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                    Chưa cài đặt API Key. Hãy nhập Gemini API Key để khởi chạy AI.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {apiKey ? 'Cập nhật API Key mới:' : 'Gemini API Key của bạn:'}
                  </label>
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder={apiKey ? "Dán API Key mới vào đây để thay đổi..." : "AIzaSy..."}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Khóa API của bạn được lưu trữ và bảo mật cục bộ trên trình duyệt (LocalStorage).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveKey}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
                >
                  Lưu cấu hình
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
