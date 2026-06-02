import client from './client';

export const getAccounts = async () => {
  const response = await client.get('/api/auth/accounts');
  return response.data;
};

export const createAccount = async (payload) => {
  const response = await client.post('/api/auth/accounts', payload);
  return response.data;
};

export const updateAccount = async (id, payload) => {
  const response = await client.put(`/api/auth/accounts/${id}`, payload);
  return response.data;
};
