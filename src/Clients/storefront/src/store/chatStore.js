import { create } from 'zustand';
import { sendChatMessage, getChatSessions, getSessionMessages } from '../api/ai';
import { useAuthStore } from './authStore';

export const useChatStore = create((set, get) => ({
  sessions: [],
  currentSessionId: localStorage.getItem('vlxd_chat_session_id') || null,
  messages: [],
  loading: false,
  sessionsLoading: false,
  error: null,

  // Loads all chat sessions for the authenticated user
  loadSessions: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

    set({ sessionsLoading: true, error: null });
    try {
      const sessions = await getChatSessions();
      set({ sessions, sessionsLoading: false });
    } catch (err) {
      console.error('Failed to load chat sessions', err);
      set({ sessionsLoading: false });
    }
  },

  // Selects an existing session and loads its messages
  selectSession: async (sessionId) => {
    set({ currentSessionId: sessionId, loading: true, error: null });
    localStorage.setItem('vlxd_chat_session_id', sessionId);

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      set({ loading: false });
      return;
    }

    try {
      const messages = await getSessionMessages(sessionId);
      set({ messages, loading: false });
    } catch (err) {
      console.error(`Failed to load messages for session ${sessionId}`, err);
      set({ loading: false, error: 'Could not load chat history.' });
    }
  },

  // Clears the active chat to start a fresh conversation
  startNewSession: () => {
    localStorage.removeItem('vlxd_chat_session_id');
    set({ currentSessionId: null, messages: [], error: null });
  },

  // Sends a message to the AI
  sendMessage: async (messageContent) => {
    if (!messageContent.trim()) return;

    const { currentSessionId, messages } = get();

    // 1. Add user message locally for immediate feedback
    const tempUserMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      createdAt: new Date().toISOString(),
    };

    set({ 
      messages: [...messages, tempUserMessage],
      loading: true,
      error: null
    });

    try {
      // 2. Post message to AI endpoint
      const response = await sendChatMessage(messageContent, currentSessionId);
      
      // response: { answer, sessionId, matchedProducts, sentimentLevel, sentimentIntensity }
      const newSessionId = response.sessionId;
      
      // If it's a new session, persist its ID
      if (!currentSessionId && newSessionId) {
        localStorage.setItem('vlxd_chat_session_id', newSessionId);
        set({ currentSessionId: newSessionId });
        // Reload list of sessions in background
        get().loadSessions();
      }

      // 3. Create the AI assistant response object
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        matchedProducts: response.matchedProducts || [],
        sentiment: response.sentimentLevel,
        createdAt: new Date().toISOString(),
      };

      // Replace temporary user message with real one if necessary (or just append AI response)
      // Since backend records user message, we can refresh or simply keep UI local state synchronized
      set((state) => ({
        messages: [...state.messages.filter(m => !m.id.startsWith('temp-')), {
          id: `user-${Date.now()}`,
          role: 'user',
          content: messageContent,
          createdAt: new Date().toISOString(),
        }, aiMessage],
        loading: false
      }));

    } catch (err) {
      console.error('AI chat request failed', err);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Xin lỗi, đã xảy ra lỗi khi kết nối với máy chủ AI. Vui lòng thử lại sau.',
        isError: true,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        loading: false,
        error: 'Không thể kết nối với dịch vụ AI.'
      }));
    }
  }
}));
