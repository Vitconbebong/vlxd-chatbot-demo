import React, { useState, useEffect } from 'react';
import { 
  Ticket, AlertOctagon, CheckCircle2, User, Clock, Shield, 
  MessageSquare, RefreshCw, Send, Lock, UserCheck, Eye, Trash2,
  AlertCircle, Smile, Frown, Meh
} from 'lucide-react';
import { getTickets, updateTicket, getSessionMessages } from '../api/ai';
import { getAccounts } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { user } = useAuthStore();
  const [employees, setEmployees] = useState([]);

  const loadEmployees = async () => {
    try {
      const accountsData = await getAccounts();
      const internalStaff = accountsData.filter(acc => 
        acc.roles?.some(role => role.toLowerCase() === 'admin' || role.toLowerCase() === 'employee')
      );
      setEmployees(internalStaff);
    } catch (err) {
      console.error('Không thể tải danh sách nhân viên.', err);
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await getTickets();
      setTickets(data);
      if (data.length > 0) {
        if (!selectedTicket || !data.some(t => t.id === selectedTicket.id)) {
          handleSelectTicket(data[0]);
        } else {
          // Update selected ticket data in place
          const updatedSelected = data.find(t => t.id === selectedTicket.id);
          setSelectedTicket(updatedSelected);
        }
      } else {
        setSelectedTicket(null);
        setChatHistory([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách ticket hỗ trợ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    loadEmployees();
  }, []);

  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setChatLoading(true);
    setChatHistory([]);
    try {
      const messages = await getSessionMessages(ticket.sessionId);
      setChatHistory(messages);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải lịch sử cuộc trò chuyện gốc.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId, status) => {
    setActionLoading(true);
    try {
      await updateTicket(ticketId, { status });
      toast.success(`Đã cập nhật trạng thái ticket thành: ${status}`);
      await loadTickets();
    } catch (err) {
      console.error(err);
      toast.error('Cập nhật trạng thái thất bại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTicket = async (ticketId, employeeId) => {
    setActionLoading(true);
    try {
      await updateTicket(ticketId, { assignedTo: employeeId });
      toast.success('Đã phân công xử lý ticket!');
      await loadTickets();
    } catch (err) {
      console.error(err);
      toast.error('Phân công xử lý thất bại.');
    } finally {
      setActionLoading(false);
    }
  };

  const normalizePriority = (p) => {
    if (typeof p === 'number') {
      if (p === 0) return 'Low';
      if (p === 1) return 'Medium';
      if (p === 2) return 'High';
      if (p === 3) return 'Urgent';
    }
    if (typeof p === 'string') {
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    }
    return 'Low';
  };

  const getPriorityBadgeColor = (priority) => {
    const p = normalizePriority(priority);
    switch (p) {
      case 'Urgent':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 shadow-[0_0_15px_rgba(244,63,94,0.1)] animate-pulse';
      case 'High':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Low':
      default:
        return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'Assigned':
      case 'InProgress':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Closed':
      default:
        return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-800';
    }
  };

  const getPriorityText = (priority) => {
    const p = normalizePriority(priority);
    if (p === 'Urgent') return 'Khẩn cấp';
    if (p === 'High') return 'Cao';
    if (p === 'Medium') return 'Trung bình';
    return 'Thấp';
  };

  const getStatusText = (status) => {
    if (status === 'Open') return 'Mới nhận';
    if (status === 'Assigned' || status === 'InProgress') return 'Đang xử lý';
    if (status === 'Resolved') return 'Đã giải quyết';
    return 'Đã đóng';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderSentimentIcon = (sentiment) => {
    const s = String(sentiment ?? '').toLowerCase();
    switch (s) {
      case '0':
      case 'positive':
        return <Smile className="h-4 w-4 text-emerald-400 inline" />;
      case '2':
      case 'negative':
        return <Frown className="h-4 w-4 text-rose-400 inline" />;
      case '1':
      case 'neutral':
      default:
        return <Meh className="h-4 w-4 text-zinc-500 inline" />;
    }
  };

  // Filter & Search
  const filteredTickets = tickets.filter((t) => {
    const pStr = normalizePriority(t.priority);
    const matchesPriority = filterPriority === 'all' || pStr === filterPriority;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <AlertOctagon className="h-6 w-6 text-rose-500" />
            Yêu cầu hỗ trợ (AI Support Tickets)
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Theo dõi các cuộc trò chuyện bị leo thang do khách hàng giận dữ hoặc có khiếu nại vận chuyển.
          </p>
        </div>
        <button
          onClick={loadTickets}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {loading && tickets.length === 0 ? (
        <div className="flex items-center justify-center h-96 bg-zinc-50 border border-zinc-200 dark:bg-zinc-900/20 dark:border-zinc-800/80 rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
            <span className="text-zinc-500 dark:text-zinc-400 text-sm">Đang tải danh sách ticket...</span>
          </div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-zinc-50 border border-zinc-200 dark:bg-zinc-900/20 dark:border-zinc-800/80 rounded-2xl text-center p-6">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Không có khiếu nại nào</h3>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1 max-w-sm">
            Tất cả khách hàng đều đang hài lòng, không có chat session nào bị AI phát hiện tiêu cực.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel - Tickets list */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Filter group */}
            <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm shadow-zinc-100/50 dark:shadow-none">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block mb-1">Mức độ ưu tiên</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'Urgent', label: 'Khẩn' },
                    { id: 'High', label: 'Cao' },
                    { id: 'Medium', label: 'Vừa' },
                    { id: 'Low', label: 'Thấp' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setFilterPriority(p.id)}
                      className={`text-[10px] px-2 py-1 rounded border font-semibold transition-all ${
                        filterPriority === p.id
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-650 dark:text-zinc-300 hover:text-zinc-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block mb-1">Trạng thái</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'Open', label: 'Mới' },
                    { id: 'InProgress', label: 'Đang xử lý' },
                    { id: 'Resolved', label: 'Đã giải quyết' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFilterStatus(s.id)}
                      className={`text-[10px] px-2 py-1 rounded border font-semibold transition-all ${
                        filterStatus === s.id
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-650 dark:text-zinc-300 hover:text-zinc-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
              {filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTicket(t)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-50/30 border-rose-500/50 dark:bg-zinc-900 dark:border-rose-500/50 shadow-md shadow-rose-500/5'
                        : 'bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-900/60 dark:border-zinc-800/80 dark:hover:bg-zinc-900 dark:hover:border-zinc-700 shadow-sm shadow-zinc-100/50 dark:shadow-none'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getPriorityBadgeColor(t.priority)}`}>
                        {getPriorityText(t.priority)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getStatusBadgeColor(t.status)}`}>
                        {getStatusText(t.status)}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-800 dark:text-zinc-200 line-clamp-2 font-medium mb-3">
                      {t.summary}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/60 pt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatDate(t.createdAt)}
                      </span>
                      {t.assignedTo && (
                        <span className="flex items-center gap-1 text-purple-400">
                          <UserCheck className="h-3 w-3" /> Đã phân công
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredTickets.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  Không tìm thấy ticket phù hợp.
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Ticket Detail & Chat Transcript */}
          <div className="lg:col-span-8 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm shadow-zinc-100/50 dark:shadow-none">
            {selectedTicket ? (
              <>
                {/* Details Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-200 dark:border-zinc-800 pb-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Yêu cầu hỗ trợ khẩn cấp</h2>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getPriorityBadgeColor(selectedTicket.priority)}`}>
                        {getPriorityText(selectedTicket.priority)}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-450 dark:text-zinc-500 block mt-0.5">Ticket ID: {selectedTicket.id}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved')}
                        disabled={actionLoading}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Giải quyết
                      </button>
                    )}
                    {selectedTicket.status !== 'Closed' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'Closed')}
                        disabled={actionLoading}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors disabled:opacity-50"
                      >
                        <Lock className="h-4 w-4" /> Đóng Ticket
                      </button>
                    )}
                  </div>
                </div>

                {/* Operations & Assignment section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 border border-zinc-200 dark:bg-zinc-950/60 dark:border-zinc-800 rounded-xl p-4">
                  <div className="space-y-1.5">
                    <span className="block text-[10px] uppercase text-zinc-500 font-bold">Phân công xử lý</span>
                    <select
                      value={selectedTicket.assignedTo || ''}
                      onChange={(e) => handleAssignTicket(selectedTicket.id, e.target.value || null)}
                      disabled={actionLoading}
                      className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
                    >
                      <option value="" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">-- Chưa phân công --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                          {emp.fullName} ({emp.roles && emp.roles[0]?.toLowerCase() === 'admin' ? 'Quản trị viên' : 'Nhân viên'})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="block text-[10px] uppercase text-zinc-500 font-bold">Thời gian nhận</span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white block">{new Date(selectedTicket.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>

                {/* Complaint Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-rose-500" /> Tóm tắt khiếu nại:
                  </h3>
                  <div className="bg-rose-50 border border-rose-100 text-xs font-medium text-rose-700 border-l-4 border-l-rose-500 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-350 p-3 rounded">
                    {selectedTicket.summary}
                  </div>
                </div>

                {/* Chat Log transcript */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-orange-500" /> Cuộc hội thoại gốc với AI:
                  </h3>
                  
                  <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl flex flex-col h-[280px]">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                      {chatLoading ? (
                        <div className="flex items-center justify-center h-full gap-2">
                          <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />
                          <span className="text-zinc-500 text-xs">Đang tải lịch sử cuộc trò chuyện...</span>
                        </div>
                      ) : chatHistory.length === 0 ? (
                        <div className="text-zinc-500 dark:text-zinc-400 text-xs text-center py-12">Không có tin nhắn nào trong hội thoại này.</div>
                      ) : (
                        chatHistory.map((msg) => {
                          const isUser = msg.role === 'user';
                          return (
                            <div 
                              key={msg.id} 
                              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-0.5`}
                            >
                              <span className="text-[9px] text-zinc-500 font-bold px-1 uppercase">
                                {isUser ? 'Khách hàng' : 'Trợ lý AI'}
                              </span>
                              <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] ${
                                isUser 
                                  ? 'bg-zinc-200/85 border border-zinc-300 text-zinc-800 rounded-tr-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200' 
                                  : 'bg-white border border-zinc-200 text-zinc-700 rounded-tl-none dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-zinc-300'
                              }`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                
                                {isUser && msg.sentiment !== undefined && msg.sentiment !== null && (
                                  <div className="flex items-center gap-1 mt-1 text-[9px] text-zinc-500 font-semibold border-t border-zinc-200 dark:border-zinc-800 pt-1">
                                    <span>Cảm xúc: {renderSentimentIcon(msg.sentiment)} {
                                      String(msg.sentiment).toLowerCase() === '0' || String(msg.sentiment).toLowerCase() === 'positive' ? 'Tích cực' :
                                      String(msg.sentiment).toLowerCase() === '2' || String(msg.sentiment).toLowerCase() === 'negative' ? 'Tiêu cực' : 'Bình thường'
                                    }</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 text-zinc-500">
                <Eye className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-2" />
                <span>Vui lòng chọn một Ticket hỗ trợ ở danh sách bên trái để xem chi tiết.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
