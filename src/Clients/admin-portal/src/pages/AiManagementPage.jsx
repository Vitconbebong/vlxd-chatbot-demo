import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  Trash2, 
  RefreshCw, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Database, 
  AlertTriangle,
  User,
  Trash,
  ChevronRight,
  Bot
} from 'lucide-react';
import { 
  getSessions, 
  deleteSession, 
  getSessionMessages, 
  deleteMessage, 
  clearEmbeddings, 
  rebuildEmbeddings 
} from '../api/ai';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import toast from 'react-hot-toast';

export default function AiManagementPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [memoryActionLoading, setMemoryActionLoading] = useState(false);

  // Load chat sessions
  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await getSessions();
      // Sort sessions: latest message first
      const sorted = (data || []).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      setSessions(sorted);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách phiên hội thoại AI.');
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Fetch messages for a selected session
  const selectSession = async (session) => {
    setActiveSession(session);
    setLoadingMessages(true);
    try {
      const msgs = await getSessionMessages(session.id);
      setMessages(msgs || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải tin nhắn của phiên này.');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Delete an entire session
  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiên hội thoại này và toàn bộ tin nhắn liên quan?')) {
      return;
    }

    try {
      await deleteSession(id);
      toast.success('Đã xóa phiên hội thoại thành công.');
      
      // If deleted session was active, reset active session
      if (activeSession && activeSession.id === id) {
        setActiveSession(null);
        setMessages([]);
      }
      
      loadSessions();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa phiên hội thoại.');
    }
  };

  // Delete a specific message
  const handleDeleteMessage = async (messageId) => {
    if (!activeSession) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này khỏi lịch sử hội thoại?')) {
      return;
    }

    try {
      await deleteMessage(activeSession.id, messageId);
      toast.success('Đã xóa tin nhắn thành công.');
      // Reload current session messages
      const msgs = await getSessionMessages(activeSession.id);
      setMessages(msgs || []);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa tin nhắn.');
    }
  };

  // Clear AI product embeddings memory
  const handleClearMemory = async () => {
    if (!window.confirm('CẢNH BÁO: Hành động này sẽ xóa toàn bộ vector embeddings sản phẩm trong cơ sở dữ liệu. AI sẽ không thể tìm kiếm sản phẩm cho đến khi bạn cấp lại bộ nhớ. Bạn có chắc chắn muốn xóa bộ nhớ?')) {
      return;
    }

    setMemoryActionLoading(true);
    try {
      await clearEmbeddings();
      toast.success('Đã xóa sạch bộ nhớ vector AI thành công.');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa bộ nhớ AI.');
    } finally {
      setMemoryActionLoading(false);
    }
  };

  // Rebuild AI product embeddings memory
  const handleRebuildMemory = async () => {
    setMemoryActionLoading(true);
    const toastId = toast.loading('Đang cấp lại bộ nhớ AI (Tạo mới vector embeddings cho danh mục sản phẩm)...');
    try {
      await rebuildEmbeddings();
      toast.success('Cấp lại bộ nhớ AI thành công! Tất cả sản phẩm đã được vector hóa.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cấp lại bộ nhớ AI.', { id: toastId });
    } finally {
      setMemoryActionLoading(false);
    }
  };

  // Formatting date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Translate sentiment level
  const renderSentiment = (sentiment) => {
    if (sentiment === null || sentiment === undefined) return null;
    
    // Map sentiment enum index (Negative = 0, Neutral = 1, Positive = 2) or string value
    const sStr = String(sentiment);
    if (sStr === '0' || sStr.toLowerCase() === 'negative') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Tiêu cực
        </span>
      );
    }
    if (sStr === '2' || sStr.toLowerCase() === 'positive') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Tích cực
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400">
        Trung lập
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Cpu className="h-6 w-6 text-orange-500" />
            <span>Quản lý Trợ lý ảo AI</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Quản lý tri thức vector, xóa bộ nhớ AI, cấu hình dữ liệu và kiểm duyệt nhật ký hội thoại.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 font-semibold"
          onClick={loadSessions}
          disabled={loadingSessions}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingSessions ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Grid of Control Panels (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Memory & Chat Sessions (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Memory Management Card */}
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40 p-5 flex flex-col justify-between space-y-4 shadow-sm shadow-zinc-100/50 dark:shadow-none">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-orange-500" />
                Bộ nhớ Tri thức AI
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                AI sử dụng vector embeddings để tìm kiếm ngữ nghĩa trên danh mục sản phẩm.
              </p>
              <div className="rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-500/10 p-3 flex gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-orange-600 dark:text-orange-500 shrink-0 mt-0.5" />
                <div className="text-[10px] text-orange-700 dark:text-orange-400">
                  Hãy <strong>Cấp lại bộ nhớ</strong> sau khi thay đổi sản phẩm để AI cập nhật tri thức mới nhất.
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center justify-center gap-2"
                onClick={handleRebuildMemory}
                disabled={memoryActionLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${memoryActionLoading ? 'animate-spin' : ''}`} />
                Cấp lại bộ nhớ AI
              </Button>
              <Button
                variant="outline"
                className="w-full text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/20 flex items-center justify-center gap-2"
                onClick={handleClearMemory}
                disabled={memoryActionLoading}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa sạch bộ nhớ AI
              </Button>
            </div>
          </div>

          {/* Sessions List Card */}
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40 p-5 space-y-4 shadow-sm shadow-zinc-100/50 dark:shadow-none">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-orange-500" />
              Phiên hội thoại ({sessions.length})
            </h3>

            <div className="overflow-y-auto max-h-[380px] space-y-2 pr-1 scrollbar-thin">
              {loadingSessions ? (
                <div className="text-center py-8 text-zinc-400">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto text-zinc-400" />
                  <span className="text-xs mt-2 block">Đang tải danh sách...</span>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-400 italic">
                  Không có phiên hội thoại nào.
                </div>
              ) : (
                sessions.map((sess) => {
                  const isSelected = activeSession && activeSession.id === sess.id;
                  return (
                    <div 
                      key={sess.id}
                      onClick={() => selectSession(sess)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex justify-between items-center group/item ${
                        isSelected 
                          ? 'bg-orange-500/5 border-orange-500/50 dark:bg-zinc-900 dark:border-orange-500/50 shadow-md shadow-orange-500/5 text-orange-600 dark:text-orange-400' 
                          : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 dark:bg-zinc-900/20 dark:border-zinc-800/80 dark:hover:bg-zinc-900/60 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold">
                            #{sess.id.substring(0, 8)}
                          </span>
                          <span className="inline-flex items-center rounded bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-600 dark:text-zinc-400 border border-zinc-300/40 dark:border-zinc-700/45">
                            {sess.channel || 'Web'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                          <Clock className="h-3 w-3 text-zinc-400" />
                          <span>{formatDate(sess.lastMessageAt)}</span>
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover/item:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteSession(e, sess.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Session Message Details (col-span-8) */}
        <div className="lg:col-span-8">
          {activeSession ? (
            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40 p-5 space-y-4 shadow-sm shadow-zinc-100/50 dark:shadow-none">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="h-4.5 w-4.5 text-orange-500" />
                    Nhật ký tin nhắn chi tiết
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-550 dark:text-zinc-450 mt-0.5">
                    Phiên ID: {activeSession.id} | Bắt đầu: {formatDate(activeSession.startedAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  className="text-[10px] border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20 h-7"
                  onClick={(e) => handleDeleteSession(e, activeSession.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Xóa toàn bộ phiên này
                </Button>
              </div>

              {/* Active messages list container */}
              <div className="space-y-4 max-h-[480px] overflow-y-auto p-3 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-lg border border-zinc-200/50 dark:border-zinc-800/40">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-xs">
                    <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                    <span className="mt-2 font-medium">Đang tải tin nhắn...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-400 italic">
                    Không tìm thấy tin nhắn nào trong phiên này.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAssistant = msg.role.toLowerCase() === 'assistant' || msg.role.toLowerCase() === 'system';
                    
                    return (
                      <div 
                        key={msg.id}
                        className={`flex items-start gap-3 group ${isAssistant ? 'justify-start' : 'justify-end'}`}
                      >
                        {/* Assistant Avatar */}
                        {isAssistant && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25 shrink-0">
                            <Bot className="h-4.5 w-4.5" />
                          </div>
                        )}

                        {/* Bubble Content */}
                        <div className="flex flex-col space-y-1 max-w-[80%]">
                          {/* Bubble Text */}
                          <div 
                            className={`rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed border transition-all ${
                              isAssistant
                                ? 'bg-white text-zinc-800 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-800/80 rounded-tl-none'
                                : 'bg-orange-500 text-white border-orange-600 rounded-tr-none'
                            }`}
                          >
                            {msg.content}
                          </div>

                          {/* Info & Action Row */}
                          <div className={`flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-550 ${!isAssistant ? 'justify-end' : ''}`}>
                            <span>{formatDate(msg.createdAt)}</span>
                            {!isAssistant && msg.sentiment !== undefined && (
                              <>
                                <span>•</span>
                                {renderSentiment(msg.sentiment)}
                              </>
                            )}
                            <span>•</span>
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-0.5"
                            >
                              <Trash className="h-2.5 w-2.5" />
                              Xóa
                            </button>
                          </div>
                        </div>

                        {/* User Avatar */}
                        {!isAssistant && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 shrink-0">
                            <User className="h-4.5 w-4.5" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10 py-24 text-center">
              <MessageSquare className="h-8 w-8 text-zinc-400 dark:text-zinc-600 mx-auto animate-bounce" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-3">Chọn một phiên hội thoại</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Chọn một hàng trong danh sách bên trái để xem chi tiết và kiểm duyệt tin nhắn.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
