import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, RotateCcw, MessageSquare, ShoppingCart, Loader2, Sparkles, Smile, Frown, Meh } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

// Simple text formatter to handle line breaks and simple lists/bolding from LLM
const formatMessageContent = (text) => {
  if (!text) return '';
  
  // Replace newlines with <br />
  let formatted = text.split('\n').map((line, idx) => {
    // Detect bold syntax **text**
    let lineContent = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-orange-600 dark:text-orange-400">$1</strong>');
    
    // Detect list items beginning with - or *
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return (
        <li key={idx} className="ml-4 list-disc text-zinc-650 dark:text-zinc-300 my-1" dangerouslySetInnerHTML={{ __html: lineContent.substring(2) }} />
      );
    }
    
    return (
      <p key={idx} className="my-1 text-zinc-800 dark:text-zinc-200" dangerouslySetInnerHTML={{ __html: lineContent }} />
    );
  });

  // Group list items
  const result = [];
  let currentList = [];

  formatted.forEach((item, index) => {
    if (item.type === 'li') {
      currentList.push(item);
    } else {
      if (currentList.length > 0) {
        result.push(<ul key={`list-${index}`} className="my-2">{[...currentList]}</ul>);
        currentList = [];
      }
      result.push(item);
    }
  });

  if (currentList.length > 0) {
    result.push(<ul key={`list-end`} className="my-2">{currentList}</ul>);
  }

  return result;
};

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  
  const { 
    messages, 
    loading, 
    sendMessage, 
    startNewSession, 
    currentSessionId,
    selectSession
  } = useChatStore();

  const { addItem, getItemPrice } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const customerTier = user?.customerTier || 'Retail';

  // Scroll to bottom on new messages or open chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // If there's an active session on mount, load it (only for authenticated users)
  useEffect(() => {
    const savedSessionId = localStorage.getItem('vlxd_chat_session_id');
    if (isAuthenticated && savedSessionId && messages.length === 0) {
      selectSession(savedSessionId);
    }
  }, [isAuthenticated]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleQuickPrompt = async (prompt) => {
    if (loading) return;
    await sendMessage(prompt);
  };

  const handleAddToCart = (product) => {
    addItem(product, 1);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  const handleResetChat = () => {
    if (window.confirm('Bạn có chắc chắn muốn làm mới cuộc trò chuyện?')) {
      startNewSession();
      toast.success('Đã bắt đầu cuộc trò chuyện mới!');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const renderSentimentIcon = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return <Smile className="h-4 w-4 text-emerald-400" title="Tích cực" />;
      case 'negative':
        return <Frown className="h-4 w-4 text-rose-400" title="Tiêu cực - Đang xử lý ưu tiên" />;
      case 'neutral':
      default:
        return null;
    }
  };

  const quickPrompts = [
    "Tôi muốn lát sân vườn 35m², tư vấn loại gạch và số lượng cần mua?",
    "Cát bê tông bao nhiêu một khối? Có giảm giá cho nhà thầu không?",
    "Đơn hàng gần nhất của tôi thế nào rồi?",
    "Tư vấn xi măng làm móng nhà bền nhất"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 flex flex-col h-[550px] w-[380px] md:w-[420px] max-h-[80vh] max-w-[calc(100vw-2rem)] rounded-2xl glass-card glow-orange shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-zinc-100 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 shadow-md">
                <Bot className="h-5 w-5 text-white" />
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  Trợ lý ảo VLXD
                  <Sparkles className="h-3.5 w-3.5 text-orange-500 dark:text-amber-400" />
                </h3>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Tư vấn & Tính vật tư 24/7
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleResetChat}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                title="Làm mới trò chuyện"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                title="Đóng chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-full space-y-4 px-2">
                <div className="rounded-full bg-orange-500/10 p-3 border border-orange-500/20">
                  <Bot className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-200">Chào bạn! Tôi có thể giúp gì cho công trình của bạn?</h4>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 max-w-[280px]">
                    Hãy đặt câu hỏi tư vấn vật tư, tính toán diện tích gạch lát, xi măng, cát đá hoặc kiểm tra vận chuyển đơn hàng.
                  </p>
                </div>
                
                <div className="w-full space-y-2 pt-2">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block text-left px-1">Gợi ý nhanh:</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickPrompt(prompt)}
                        className="text-left text-xs bg-zinc-50 hover:bg-zinc-100 text-zinc-750 border border-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 transition-all hover:border-orange-500/30"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    {/* Message Bubble */}
                    <div 
                      className={`relative px-4 py-2.5 rounded-2xl text-sm ${
                        isUser 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-tr-none shadow-md shadow-orange-500/10' 
                          : 'bg-white border border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 rounded-tl-none shadow-sm shadow-zinc-100/50 dark:shadow-none'
                      } max-w-[85%]`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="space-y-2">
                          {formatMessageContent(msg.content)}
                        </div>
                      )}
                      
                      {/* Sentiment flag if any */}
                      {!isUser && msg.sentiment && (
                        <div className="absolute -bottom-2 -right-1 bg-zinc-100 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-full p-0.5 flex items-center justify-center">
                          {renderSentimentIcon(msg.sentiment)}
                        </div>
                      )}
                    </div>

                    {/* Matched Products Panel */}
                    {!isUser && msg.matchedProducts && msg.matchedProducts.length > 0 && (
                      <div className="w-full max-w-[90%] pl-2 pt-2 space-y-2">
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block">
                          Sản phẩm đề xuất:
                        </span>
                        <div className="flex flex-col gap-2">
                          {msg.matchedProducts.map((prod) => {
                            const tieredPrice = getItemPrice(prod, customerTier);
                            return (
                              <div 
                                key={prod.id} 
                                className="flex items-center justify-between bg-white border border-zinc-200 dark:bg-zinc-900/60 dark:border-zinc-800/80 rounded-xl p-2.5 hover:border-zinc-350 dark:hover:border-zinc-700 transition-colors shadow-sm shadow-zinc-100/50 dark:shadow-none"
                              >
                                <div className="flex-1 min-w-0 pr-2">
                                  <a 
                                    href={`/products/${prod.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-zinc-900 hover:text-orange-655 dark:text-white dark:hover:text-orange-400 truncate block transition-colors"
                                  >
                                    {prod.name}
                                  </a>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">SKU: {prod.sku}</span>
                                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.2 rounded text-zinc-650 dark:text-zinc-300">
                                      {prod.unitOfMeasure}
                                    </span>
                                  </div>
                                  <div className="mt-1">
                                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                                      {formatCurrency(tieredPrice)}
                                    </span>
                                    {customerTier !== 'Retail' && (
                                      <span className="text-[9px] text-zinc-400 line-through ml-1.5">
                                        {formatCurrency(prod.basePrice)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAddToCart(prod)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow transition-all hover:scale-105"
                                  title="Thêm vào giỏ"
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Waiting for response indicator */}
            {loading && (
              <div className="flex flex-col items-start space-y-1">
                <div className="bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 px-4 py-3 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm shadow-zinc-100/50 dark:shadow-none">
                  <div className="flex items-center gap-1 text-zinc-550 dark:text-zinc-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-600 dark:text-orange-500" />
                    <span className="text-xs italic">Trợ lý đang tính toán...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form 
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 px-4 py-3"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập câu hỏi tại đây..."
              disabled={loading}
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 transition-colors shadow-md shadow-orange-600/20"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-[0_8px_30px_rgb(249,115,22,0.3)] transition-all hover:scale-110 active:scale-95 duration-200 animate-pulse hover:animate-none"
        title="Trợ lý tư vấn AI"
      >
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 opacity-30 group-hover:opacity-100 transition-opacity blur animate-pulse" />
        {isOpen ? (
          <X className="relative h-6 w-6" />
        ) : (
          <Bot className="relative h-7 w-7" />
        )}
        
        {!isOpen && (
          <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow">
            AI
          </span>
        )}
      </button>
    </div>
  );
}
