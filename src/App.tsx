import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Loader2, 
  Send,
  Sparkles,
  History,
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
  AlertCircle
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

const TONE_ICONS = {
  polite: UserCheck,
  sarcastic: Flame,
  brutal: Skull
};

const TONE_COLORS = {
  polite: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  sarcastic: 'text-sky-700 bg-sky-50 border-sky-100',
  brutal: 'text-rose-700 bg-rose-50 border-rose-100'
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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Hãy phản biện sắc bén luận điệu sau theo đúng tính cách được giao:\n"${query}"` }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPTS[tone] }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300
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
    query: 'Thiếu gì cách phát triển du lịch, đâu cứ phải xây resort bê tông cốt thép? Đó là tư duy ăn xổi, tư duy đớp!',
    timestamp: Date.now() - 3000,
    responses: {
      polite: 'Du lịch homestay nhỏ lẻ chỉ hợp với khách phượt ngắn ngày, không thể scale-up để giải quyết việc làm cho hàng vạn lao động hay tạo nguồn thu ngân sách lớn. Các tổ hợp nghỉ dưỡng sinh thái cao cấp đòi hỏi vốn hàng trăm triệu USD mà chỉ các tập đoàn lớn mới đủ năng lực triển khai bài bản.',
      sarcastic: 'Vẽ ra lắm cách hay lắm nhưng hỏi cách cụ thể là gì thì ngậm tăm. Đòi làm du lịch mộc mạc không vốn, không hạ tầng thì định bắt dân nghèo quanh vùng bứt lá hái quả qua ngày qua tháng chắc?',
      brutal: 'Toàn lý thuyết suông kiểu ngồi phòng máy lạnh hít khí trời bàn chuyện quốc gia đại sự. Mấy cái cách "thơ mộng" của mấy ông chỉ đủ cho bản thân đi phượt dăm bữa nửa tháng, còn hàng vạn người dưới chân đèo lấy gì đút vào mồm nếu không có hạ tầng dịch vụ?'
    }
  }
];

// --- Copy Button Component ---
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl text-[10px] sm:text-xs font-bold border shadow-sm transition-all hover:scale-105 active:scale-95 ${copied ? 'border-emerald-200 text-emerald-600' : 'border-slate-200 text-slate-600'}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Đã chép!' : 'Sao chép'}
    </button>
  );
}

// --- History Card Component ---
const HistoryCard = ({ 
  item, 
  isExpanded, 
  onToggle 
}: { 
  item: HistoryItem, 
  isExpanded: boolean, 
  onToggle: () => void 
}) => {
  const availableTones = (['polite', 'sarcastic', 'brutal'] as const).filter(t => item.responses[t]);
  const [activeTab, setActiveTab] = useState<'polite' | 'sarcastic' | 'brutal'>(availableTones[0] || 'polite');

  useEffect(() => {
    if (!availableTones.includes(activeTab) && availableTones.length > 0) {
      setActiveTab(availableTones[0]);
    }
  }, [item.responses, activeTab, availableTones]);

  if (availableTones.length === 0) return null;
  const ActiveIcon = TONE_ICONS[activeTab];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-4 group overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
    >
      <div 
        onClick={onToggle}
        className="flex items-start gap-3 p-5 cursor-pointer relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="bg-amber-100 p-2.5 rounded-2xl shrink-0 mt-0.5">
          <MessageSquareWarning className="w-4 h-4 text-amber-600" />
        </div>
        
        <div className="flex-1 pr-4">
          <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
            "{item.query}"
          </p>
        </div>

        <motion.div 
          animate={{ rotate: isExpanded ? 180 : 0 }} 
          className="shrink-0 p-2 bg-slate-50 rounded-full"
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-slate-100">
              {/* Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl mb-4 w-full mt-3">
                {(['polite', 'sarcastic', 'brutal'] as const).map((tab) => {
                  if (!item.responses[tab]) return null;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="relative flex-1 py-2 text-xs font-bold rounded-xl transition-colors z-10 flex items-center justify-center gap-1.5"
                    >
                      {activeTab === tab && (
                        <motion.div 
                          layoutId={`tab-${item.id}`} 
                          className="absolute inset-0 bg-white shadow-sm rounded-xl -z-10" 
                        />
                      )}
                      <span className={activeTab === tab ? TONE_COLORS[tab].split(' ')[0] : 'text-slate-500'}>
                        {TONE_LABELS[tab]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 rounded-2xl border relative overflow-hidden ${TONE_COLORS[activeTab]}`}
                >
                  <ActiveIcon className={`w-12 h-12 absolute -top-2 -right-2 opacity-5 ${TONE_COLORS[activeTab].split(' ')[0]}`} />
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                      AI Phản biện
                    </span>
                    <CopyButton text={item.responses[activeTab]!} />
                  </div>
                  <p className="text-sm leading-relaxed font-medium relative z-10">
                    {item.responses[activeTab]}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'history'>('home');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Settings / API Key State
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  // Home State
  const [input, setInput] = useState('');
  const [tone, setTone] = useState<'polite' | 'sarcastic' | 'brutal'>('polite');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResultId, setCurrentResultId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // History State
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Load Init
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);

    const savedHistory = localStorage.getItem('ai_history_real');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history");
      }
    } else {
      setHistory(INITIAL_DATA);
      localStorage.setItem('ai_history_real', JSON.stringify(INITIAL_DATA));
    }
  }, []);

  const saveApiKey = () => {
    setApiKey(tempApiKey);
    localStorage.setItem('gemini_api_key', tempApiKey);
    setShowSettings(false);
  };

  const saveToHistory = (queryStr: string, selectedTone: 'polite' | 'sarcastic' | 'brutal', responseText: string) => {
    let updatedHistory = [...history];
    const existingIndex = updatedHistory.findIndex(
      h => h.query.trim().toLowerCase() === queryStr.trim().toLowerCase()
    );

    let resultId = '';

    if (existingIndex >= 0) {
      updatedHistory[existingIndex] = {
        ...updatedHistory[existingIndex],
        timestamp: Date.now(),
        responses: {
          ...updatedHistory[existingIndex].responses,
          [selectedTone]: responseText
        }
      };
      const [item] = updatedHistory.splice(existingIndex, 1);
      updatedHistory.unshift(item);
      resultId = item.id;
    } else {
      resultId = Date.now().toString();
      const newItem: HistoryItem = {
        id: resultId,
        query: queryStr.trim(),
        responses: {
          [selectedTone]: responseText
        },
        timestamp: Date.now()
      };
      updatedHistory.unshift(newItem);
    }

    setHistory(updatedHistory);
    localStorage.setItem('ai_history_real', JSON.stringify(updatedHistory));
    return resultId;
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    if (!apiKey) {
      setTempApiKey('');
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setCurrentResultId(null);
    setErrorMsg(null);
    
    try {
      // Gọi API thật
      const aiResponseText = await callGeminiAPI(input.trim(), tone, apiKey);
      const newId = saveToHistory(input, tone, aiResponseText);
      setCurrentResultId(newId);
    } catch (error: any) {
      setErrorMsg(error.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if(confirm('Bạn có chắc muốn xóa toàn bộ lịch sử? Các dữ liệu gốc cũng sẽ bị xóa.')) {
      setHistory([]);
      localStorage.removeItem('ai_history_real');
    }
  };

  const filteredHistory = history.filter(item => {
    const term = searchQuery.toLowerCase();
    const matchQuery = item.query.toLowerCase().includes(term);
    const matchResponses = Object.values(item.responses).some(res => res?.toLowerCase().includes(term));
    return matchQuery || matchResponses;
  });

  const currentResultItem = history.find(h => h.id === currentResultId);

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FC] text-slate-800 font-sans antialiased selection:bg-emerald-200 flex flex-col relative overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-lime-500 opacity-[0.03]"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-40 left-0 -ml-20 w-72 h-72 bg-lime-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-8 pb-32 relative z-10">
        
        {/* --- TAB: HOME --- */}
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex-1 text-center pl-8">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-xl px-4 py-1.5 rounded-full text-xs font-bold text-emerald-900 border border-white/50 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Trợ Thủ Phản Biện Sắc Bén</span>
                  </motion.div>
                </div>
                <button 
                  onClick={() => { setTempApiKey(apiKey); setShowSettings(true); }}
                  className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-slate-400 hover:text-emerald-600 border border-slate-200 transition-all active:scale-95"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit className="w-6 h-6 text-emerald-600" />
                  <h2 className="text-lg font-bold text-slate-800">Nhập câu luận điệu</h2>
                </div>
                
                <div className="space-y-5">
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Dán câu chửi, luận điệu của đối phương vào đây..."
                      className="w-full bg-white/80 border border-slate-200 rounded-2xl p-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[120px] resize-none shadow-inner leading-relaxed"
                    />
                  </div>
                  
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Chọn sắc thái phản biện</p>
                    <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-full">
                      {(['polite', 'sarcastic', 'brutal'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${tone === t ? 'text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          {tone === t && (
                            <motion.div layoutId="ai-tone" className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10" />
                          )}
                          <span className={tone === t ? (t === 'polite' ? 'text-emerald-700' : t === 'sarcastic' ? 'text-sky-700' : 'text-rose-700') : ''}>
                            {TONE_LABELS[t]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2 border border-red-100">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button 
                    onClick={handleGenerate}
                    disabled={!input.trim() || isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 rounded-2xl text-base font-bold shadow-lg shadow-emerald-200 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {isLoading ? 'Đang phân tích...' : 'Phản biện ngay'}
                  </button>
                </div>
              </div>

              {/* Result Area */}
              <AnimatePresence mode="wait">
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 p-5 bg-white/60 backdrop-blur-md rounded-3xl space-y-3 overflow-hidden border border-white"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BrainCircuit className="w-5 h-5 text-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest animate-pulse">AI đang suy nghĩ logic...</span>
                    </div>
                    <div className="h-4 bg-slate-200/60 rounded-full w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-slate-200/60 rounded-full w-full animate-pulse"></div>
                    <div className="h-4 bg-slate-200/60 rounded-full w-5/6 animate-pulse"></div>
                  </motion.div>
                )}

                {currentResultItem && !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <MessageSquare className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">Kết quả trả lời</h3>
                    </div>
                    <HistoryCard 
                      item={currentResultItem} 
                      isExpanded={true} 
                      onToggle={() => {}} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* --- TAB: HISTORY --- */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Lịch sử</h2>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa hết
                  </button>
                )}
              </div>

              <div className="relative mb-6">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm nội dung đã phản biện..."
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                />
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredHistory.map((item) => (
                    <HistoryCard 
                      key={item.id} 
                      item={item} 
                      isExpanded={expandedHistoryId === item.id}
                      onToggle={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                    />
                  ))}
                </AnimatePresence>
                
                {filteredHistory.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                  >
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">Không tìm thấy dữ liệu.</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- STICKY BOTTOM MENU (FULL WIDTH) --- */}
      <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
        <div className="w-full bg-white/90 backdrop-blur-2xl px-4 py-2 pb-safe border-t border-slate-200/60 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] pointer-events-auto flex items-center justify-around">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex-1 max-w-[120px] flex flex-col items-center justify-center py-2 rounded-2xl transition-all relative ${activeTab === 'home' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {activeTab === 'home' && (
              <motion.div layoutId="nav-pill" className="absolute inset-0 bg-emerald-50 rounded-2xl -z-10" />
            )}
            <Home className={`w-6 h-6 mb-1 ${activeTab === 'home' ? 'fill-emerald-100' : ''}`} />
            <span className="text-[11px] font-extrabold tracking-wide">Trang chủ</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 max-w-[120px] flex flex-col items-center justify-center py-2 rounded-2xl transition-all relative ${activeTab === 'history' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {activeTab === 'history' && (
              <motion.div layoutId="nav-pill" className="absolute inset-0 bg-emerald-50 rounded-2xl -z-10" />
            )}
            <History className={`w-6 h-6 mb-1 ${activeTab === 'history' ? 'fill-emerald-100' : ''}`} />
            <span className="text-[11px] font-extrabold tracking-wide">Lịch sử</span>
          </button>
        </div>
      </div>

      {/* --- SETTINGS MODAL --- */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative z-10"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Cấu hình AI</h3>
                  <p className="text-xs text-slate-500">Nhập Gemini API Key để kích hoạt AI thật.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Google Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    Lấy key miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">Google AI Studio</a>. Dữ liệu chỉ lưu trên máy bạn.
                  </p>
                </div>
                
                <button 
                  onClick={saveApiKey}
                  className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all"
                >
                  Lưu thiết lập
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
