import client from './client';

/**
 * Retrieves the list of support tickets escalated from negative customer chats.
 * @returns {Promise<Array>} List of Support Tickets sorted by priority and date.
 */
export const getTickets = async () => {
  const response = await client.get('/api/ai/tickets');
  return response.data;
};

/**
 * Updates support ticket resolution state or operational assignment.
 * @param {string} id - Support ticket unique ID.
 * @param {object} updates - Contains { status, assignedTo }
 * @returns {Promise<object>} Updated Support Ticket entity.
 */
export const updateTicket = async (id, updates) => {
  const response = await client.put(`/api/ai/tickets/${id}`, updates);
  return response.data;
};

/**
 * Commands the backend to rebuild rich product vector representations in batch.
 * @returns {Promise<object>} Returns { message }
 */
export const rebuildEmbeddings = async () => {
  const response = await client.post('/api/ai/embeddings/rebuild');
  return response.data;
};

/**
 * Retrieves historical messages for a specific chat session.
 * @param {string} sessionId - The unique identifier of the chat session.
 * @returns {Promise<Array>} List of chat messages in chronological order.
 */
export const getSessionMessages = async (sessionId) => {
  const response = await client.get(`/api/ai/chat/sessions/${sessionId}/messages`);
  return response.data;
};

/**
 * Retrieves all chat sessions.
 * @returns {Promise<Array>} List of chat sessions.
 */
export const getSessions = async () => {
  const response = await client.get('/api/ai/chat/sessions');
  return response.data;
};

/**
 * Deletes a chat session and all its messages.
 * @param {string} id - The chat session unique ID.
 * @returns {Promise<object>} Deletion status.
 */
export const deleteSession = async (id) => {
  const response = await client.delete(`/api/ai/chat/sessions/${id}`);
  return response.data;
};

/**
 * Deletes a specific message from a session.
 * @param {string} sessionId - The chat session unique ID.
 * @param {string} messageId - The message unique ID.
 * @returns {Promise<object>} Deletion status.
 */
export const deleteMessage = async (sessionId, messageId) => {
  const response = await client.delete(`/api/ai/chat/sessions/${sessionId}/messages/${messageId}`);
  return response.data;
};

/**
 * Clears all product vector embeddings from database memory.
 * @returns {Promise<object>} Action status.
 */
export const clearEmbeddings = async () => {
  const response = await client.delete('/api/ai/embeddings');
  return response.data;
};
