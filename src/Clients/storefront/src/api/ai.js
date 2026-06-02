import client from "./client";
// Nhớ điều chỉnh lại đường dẫn import này cho khớp với cấu trúc thư mục của bạn
import { useAuthStore } from "../store/authStore";

//#region Helpers

/**
 * Automatically retrieves the latest token from Zustand store
 * and formats it for the Authorization header.
 */
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

//#endregion

//#region AI API Services

/**
 * Sends a chat message to the AI agent.
 * @param {string} message - The content of the user message.
 * @param {string|null} sessionId - The optional active chat session ID.
 * @returns {Promise<object>} Returns ChatOrchestratorResponse
 */
export const sendChatMessage = async (message, sessionId = null) => {
  const response = await client.post(
    "/api/ai/chat",
    { message, sessionId },
    { headers: getAuthHeaders() },
  );
  return response.data;
};

/**
 * Retrieves historical chat sessions of the current authenticated user.
 * @returns {Promise<Array>} List of chat sessions.
 */
export const getChatSessions = async () => {
  const response = await client.get("/api/ai/chat/sessions", {
    headers: getAuthHeaders(),
  });
  return response.data;
};

/**
 * Retrieves historical messages for a specific chat session.
 * @param {string} sessionId - The unique identifier of the chat session.
 * @returns {Promise<Array>} List of chat messages in chronologic order.
 */
export const getSessionMessages = async (sessionId) => {
  const response = await client.get(
    `/api/ai/chat/sessions/${sessionId}/messages`,
    { headers: getAuthHeaders() },
  );
  return response.data;
};

/**
 * Parses quotation request text and maps matched products to draft quotation orders.
 * @param {string} rawText - Vietnamese quotation inquiry.
 * @returns {Promise<object>} Contains { quotationId }
 */
export const extractQuotation = async (rawText) => {
  const response = await client.post(
    "/api/ai/extract-quotation",
    { rawText },
    { headers: getAuthHeaders() },
  );
  return response.data;
};

//#endregion
