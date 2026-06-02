import client from './client';

export const getOrders = async () => {
  const response = await client.get('/api/sales/orders');
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await client.get(`/api/sales/orders/${id}`);
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await client.put(`/api/sales/orders/${id}/status`, { status });
  return response.data;
};

export const getCustomers = async () => {
  const response = await client.get('/api/sales/customers');
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await client.get('/api/sales/dashboard');
  return response.data;
};

export const getQuotations = async () => {
  const response = await client.get('/api/sales/quotations');
  return response.data;
};

export const approveQuotation = async (id) => {
  const response = await client.post(`/api/sales/quotations/${id}/approve`);
  return response.data;
};
