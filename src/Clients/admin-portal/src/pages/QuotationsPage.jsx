import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, User, Phone, DollarSign, ArrowRight, Eye, RefreshCw, Sparkles, ShoppingBag } from 'lucide-react';
import { getQuotations, approveQuotation } from '../api/sales';
import toast from 'react-hot-toast';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, Draft, Approved
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getQuotations();
      setQuotations(data);
      // Select the first one by default if nothing is selected or if previously selected is not in the list
      if (data.length > 0) {
        if (!selectedQuotation || !data.some(q => q.id === selectedQuotation.id)) {
          setSelectedQuotation(data[0]);
        } else {
          // Update selected item with fresh data
          const freshSelected = data.find(q => q.id === selectedQuotation.id);
          setSelectedQuotation(freshSelected);
        }
      } else {
        setSelectedQuotation(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách báo giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn duyệt báo giá này và chuyển thành đơn hàng chính thức?')) {
      return;
    }
    setActionLoading(true);
    try {
      const order = await approveQuotation(id);
      toast.success(`Đã duyệt báo giá! Tạo thành công đơn hàng số: ${order.orderNumber}`);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt báo giá.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConfidenceBadgeColor = (score) => {
    if (score >= 0.8) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (score >= 0.5) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  };

  const getConfidenceLabel = (score) => {
    if (score >= 0.8) return `Cao (${Math.round(score * 100)}%)`;
    if (score >= 0.5) return `Trung bình (${Math.round(score * 100)}%)`;
    return `Thấp (${Math.round(score * 100)}%)`;
  };

  // Filter & Search
  const filteredQuotations = quotations.filter((q) => {
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    const matchesSearch = 
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerPhone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-orange-500" />
            AI Báo Giá Nháp
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Xem và phê duyệt các báo giá được bóc tách tự động từ tin nhắn/văn bản của khách hàng bằng AI.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {loading && quotations.length === 0 ? (
        <div className="flex items-center justify-center h-96 bg-zinc-50 border border-zinc-200 dark:bg-zinc-900/20 dark:border-zinc-800/80 rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
            <span className="text-zinc-500 dark:text-zinc-400 text-sm">Đang tải danh sách báo giá nháp...</span>
          </div>
        </div>
      ) : quotations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-zinc-50 border border-zinc-200 dark:bg-zinc-900/20 dark:border-zinc-800/80 rounded-2xl text-center p-6">
          <FileText className="h-12 w-12 text-zinc-400 dark:text-zinc-700 mb-3" />
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Không có báo giá nháp nào</h3>
          <p className="text-zinc-500 text-xs mt-1 max-w-sm">
            Hệ thống chưa nhận được yêu cầu báo giá tự động nào qua AI Chat hoặc API.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List panel */}
          <div className="lg:col-span-5 space-y-4">
            {/* Filter and Search Controls */}
            <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm shadow-zinc-100/50 dark:shadow-none">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên KH, số điện thoại..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-500"
              />
              <div className="flex gap-2">
                {['all', 'Draft', 'Approved'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex-1 text-xs py-1.5 rounded-lg border font-semibold transition-all ${
                      filterStatus === status
                        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  >
                    {status === 'all' ? 'Tất cả' : status === 'Draft' ? 'Bản nháp' : 'Đã duyệt'}
                  </button>
                ))}
              </div>
            </div>

            {/* List scroll container */}
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
              {filteredQuotations.map((q) => {
                const isSelected = selectedQuotation?.id === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuotation(q)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-orange-50/30 border-orange-500/50 dark:bg-zinc-900 dark:border-orange-500/50 shadow-md shadow-orange-500/5'
                        : 'bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-900/60 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:border-zinc-700 shadow-sm shadow-zinc-100/50 dark:shadow-none'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[180px]">
                          {q.customerName}
                        </h4>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">{formatDate(q.createdAt)}</span>
                      </div>
                      
                      {q.status === 'Approved' ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" /> Đã duyệt
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          <Clock className="h-3 w-3 animate-pulse" /> Bản nháp
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {q.customerPhone}
                      </span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(q.totalEstimated)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filteredQuotations.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  Không tìm thấy báo giá phù hợp.
                </div>
              )}
            </div>
          </div>

          {/* Details panel */}
          <div className="lg:col-span-7 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm shadow-zinc-100/50 dark:shadow-none">
            {selectedQuotation ? (
              <>
                {/* Detail Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-200 dark:border-zinc-800 pb-4 gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      Chi tiết báo giá nháp
                      {selectedQuotation.createdByAi && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                          <Sparkles className="h-3 w-3 text-amber-500" /> Trích xuất bởi AI
                        </span>
                      )}
                    </h2>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 block mt-0.5">ID: {selectedQuotation.id}</span>
                  </div>

                  {selectedQuotation.status === 'Draft' && (
                    <button
                      onClick={() => handleApprove(selectedQuotation.id)}
                      disabled={actionLoading}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Duyệt & Tạo đơn hàng
                    </button>
                  )}
                </div>

                {/* Customer Information Card */}
                <div className="bg-zinc-50 border border-zinc-200 dark:bg-zinc-900/40 dark:border-zinc-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <User className="h-4 w-4 text-orange-500" />
                      <div>
                        <span className="block text-[10px] uppercase text-zinc-400 dark:text-zinc-500 font-bold">Khách hàng</span>
                        <span className="font-semibold text-zinc-900 dark:text-white text-sm">{selectedQuotation.customerName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <Phone className="h-4 w-4 text-orange-500" />
                      <div>
                        <span className="block text-[10px] uppercase text-zinc-400 dark:text-zinc-500 font-bold">Số điện thoại</span>
                        <span className="font-semibold text-zinc-900 dark:text-white text-sm">{selectedQuotation.customerPhone}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <FileText className="h-4 w-4 text-orange-500 mt-0.5" />
                      <div>
                        <span className="block text-[10px] uppercase text-zinc-400 dark:text-zinc-500 font-bold">Thời gian yêu cầu</span>
                        <span className="font-semibold text-zinc-900 dark:text-white text-sm">{formatDate(selectedQuotation.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Raw text input */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Văn bản yêu cầu gốc từ khách hàng:</h3>
                  <div className="bg-zinc-50 border border-zinc-200 text-zinc-700 dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-zinc-300 rounded-xl p-4 text-xs font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed border-l-4 border-l-orange-500">
                    {selectedQuotation.sourceText}
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Sản phẩm trích xuất:</h3>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 font-bold">
                          <th className="p-3">Sản phẩm đối chiếu</th>
                          <th className="p-3">Yêu cầu gốc</th>
                          <th className="p-3 text-center">Số lượng</th>
                          <th className="p-3 text-right">Đơn giá</th>
                          <th className="p-3 text-center">Độ tin cậy AI</th>
                          <th className="p-3 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQuotation.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/40 transition-colors">
                            <td className="p-3 font-semibold text-zinc-900 dark:text-white">
                              {item.matchedProductId ? (
                                <span className="text-orange-600 dark:text-orange-400">{item.matchedProductName}</span>
                              ) : (
                                <span className="text-rose-500 flex items-center gap-1 font-semibold">
                                  <AlertTriangle className="h-3 w-3" /> Chưa khớp
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-zinc-500 dark:text-zinc-400 italic font-mono text-[11px]">
                              "{item.rawItemText}"
                            </td>
                            <td className="p-3 text-center text-zinc-800 dark:text-zinc-200">
                              {item.quantity} <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.2 rounded">{item.unit}</span>
                            </td>
                            <td className="p-3 text-right text-zinc-600 dark:text-zinc-300">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded border ${getConfidenceBadgeColor(item.confidenceScore)}`}>
                                {getConfidenceLabel(item.confidenceScore)}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-zinc-900 dark:text-white">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary calculation */}
                <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 dark:bg-zinc-900/40 dark:border-zinc-800 rounded-xl p-4">
                  <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-orange-500" /> Tổng tiền ước tính:
                  </span>
                  <span className="text-xl font-bold text-orange-500">
                    {formatCurrency(selectedQuotation.totalEstimated)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 text-zinc-500">
                <Eye className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-2" />
                <span>Vui lòng chọn một báo giá từ danh sách bên trái để xem chi tiết.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
