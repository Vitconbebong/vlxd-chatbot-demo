import client from './client';

export const placeOrder = async (orderData) => {
  const response = await client.post('/api/sales/orders', orderData);
  return response.data; // Returns OrderDto
};

export const getOrders = async () => {
  const response = await client.get('/api/sales/orders');
  return response.data; // Returns List<OrderDto>
};

export const getOrderById = async (id) => {
  const response = await client.get(`/api/sales/orders/${id}`);
  return response.data; // Returns OrderDto
};

export const getDeliveryByOrderId = async (orderId) => {
  const response = await client.get(`/api/wms/deliveries/order/${orderId}`);
  return response.data; // Returns DeliveryOrderDto
};
