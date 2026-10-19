import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Paperclip, 
  Clock, 
  CheckCircle2, 
  FileText, 
  AlertTriangle, 
  Building2, 
  ArrowRight,
  ShieldCheck,
  SendHorizontal,
  FileCheck
} from 'lucide-react';
import { ChatMessage, Task } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';

interface AssistantViewProps {
  initialPrompt?: string;
  onNavigateToTask: (taskId: string) => void;
  onNavigateToApprovals: () => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  initialPrompt,
  onNavigateToTask,
  onNavigateToApprovals,
}) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Xin kính chào ${currentUser?.displayName || 'Thầy/Cô'}! Tôi là **Trợ lý Điều hành OneSchool AI** của **Trường Tiểu học Nguyễn Trãi** (UBND phường Hà Đông).\n\nTôi được kết nối trực tiếp với cơ sở dữ liệu nhân sự chính thức (**112 CBGVNV**), kế hoạch và phân công công tác của **Trường chính** và **Phân hiệu**.\n\nMọi câu trả lời của tôi đều được **xác thực và trích xuất từ dữ liệu thực tế** của nhà trường (không suy diễn hay bịa đặt, tuân thủ nghiêm ngặt bảo mật thông tin liên lạc).\n\nThầy/Cô có thể hỏi tôi về BGH, giáo viên phân hiệu, phân công chuyên môn, hoặc rà soát các hồ sơ đang chờ xác minh.`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputQuery, setInputQuery] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [draftSubmitted, setDraftSubmitted] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      handleSendQuery(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await api.askAssistant(textToSend);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        citations: response.citations,
        suggestedActions: response.suggestedActions,
        generatedDraft: response.generatedDraft,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Đã xảy ra lỗi khi truy vấn: ${err.message || 'Không thể kết nối đến dịch vụ AI'}. Vui lòng thử lại.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendDraftToApproval = async (draft: { title: string; content: string }) => {
    try {
      await api.createApproval({
        entityType: 'announcement',
        entityId: `draft-${Date.now()}`,
        entityTitle: draft.title,
        campusName: 'Toàn trường',
        summary: draft.content.slice(0, 150) + '...',
        version: 1,
        approvalStatus: 'pending',
      });
      setDraftSubmitted(draft.title);
      setTimeout(() => setDraftSubmitted(null), 3000);
    } catch (err: any) {
      alert('Lỗi gửi duyệt: ' + err.message);
    }
  };

  const samplePrompts = [
    'Ai là Hiệu trưởng và danh sách Phó Hiệu trưởng gồm những ai?',
    'Những giáo viên nào được phân công tại phân hiệu?',
    'Nhân viên nào phụ trách thủ quỹ, kế toán, văn thư, y tế?',
    'Có những bản ghi nào đang chờ BGH xác minh?',
    'Trong trường có những trường hợp nào trùng họ tên nhau?',
    'Thống kê số lượng nhân sự biên chế và hợp đồng toàn trường',
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
      {/* Top Assistant Title Banner */}
      <div className="p-4 border-b border-[#E2E8F0] bg-gradient-to-r from-teal-50/50 via-white to-blue-50/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#14b8a6] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <span>Trợ lý BGH OneSchool AI</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Cơ sở dữ liệu đã xác minh
              </span>
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Truy vấn thông tin chính xác theo nguyên tắc Zero Hallucination • Trích dẫn nguồn tài liệu cụ thể
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                msg.sender === 'user'
                  ? 'bg-[#12366B] text-white rounded-br-xs shadow-xs'
                  : 'bg-[#F5F7FB] text-[#172B4D] border border-[#E2E8F0] rounded-bl-xs'
              }`}
            >
              <div className="whitespace-pre-wrap font-normal">
                {msg.text}
              </div>

              {/* Citations Box */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <p className="text-[11px] font-bold text-[#12366B] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#0D9488]" />
                    Nguồn căn cứ trích xuất từ hệ thống ({msg.citations.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => c.recordType === 'task' ? onNavigateToTask(c.recordId) : null}
                        className="text-[10px] bg-white border border-slate-200 hover:border-[#0D9488] text-slate-700 px-2 py-1 rounded-md flex items-center gap-1 transition-colors text-left"
                      >
                        <span className="font-bold text-[#0D9488]">[{c.recordType.toUpperCase()}]</span>
                        <span className="truncate max-w-[200px]">{c.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Draft Box with Action */}
              {msg.generatedDraft && (
                <div className="p-3 bg-white rounded-xl border border-teal-300 text-xs text-[#172B4D] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0D9488] flex items-center gap-1">
                      <FileCheck className="w-4 h-4" />
                      {msg.generatedDraft.title}
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                      Dự thảo AI
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    BGH có thể gửi dự thảo này vào Trung tâm Phê duyệt để xem xét trước khi phát hành chính thức:
                  </p>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSendDraftToApproval(msg.generatedDraft!)}
                      className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0f766e] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <SendHorizontal className="w-3.5 h-3.5" />
                      <span>Gửi vào Trung tâm Phê duyệt</span>
                    </button>
                  </div>
                </div>
              )}

              <p className={`text-[10px] text-right ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}

        {draftSubmitted && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đã gửi dự thảo "{draftSubmitted}" vào Trung tâm Phê duyệt thành công!
            </span>
            <button
              onClick={onNavigateToApprovals}
              className="text-xs text-[#12366B] underline font-semibold"
            >
              Mở Phê duyệt →
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl max-w-sm text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-[#0D9488] animate-spin" />
            <span>OneSchool AI đang tra cứu dữ liệu & tổng hợp câu trả lời...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 shrink-0">Gợi ý:</span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuery(p)}
            className="shrink-0 px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-[#0D9488] hover:border-[#0D9488]/40 border border-slate-200 rounded-full text-slate-600 text-[11px] transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="p-4 bg-white border-t border-[#E2E8F0]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Hỏi về lịch công tác, nhiệm vụ, giáo viên phụ trách, xung đột, hoặc soạn văn bản..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-[#F5F7FB] border border-[#E2E8F0] focus:border-[#12366B] rounded-xl text-xs outline-none"
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="p-2.5 bg-[#12366B] hover:bg-[#0B2145] text-white rounded-xl transition-colors disabled:opacity-40 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
