import client from './client';

export const getInventory = async (warehouseId = '') => {
  const response = await client.get('/api/wms/inventory', {
    params: warehouseId ? { warehouseId } : undefined
  });
  return response.data;
};

export const receiveStock = async (receiveData) => {
  const response = await client.post('/api/wms/inventory/receive', receiveData);
  return response.data;
};

export const getLowStockInventory = async () => {
  const response = await client.get('/api/wms/inventory/low-stock');
  return response.data;
};

export const getDeliveries = async () => {
  const response = await client.get('/api/wms/deliveries');
  return response.data;
};

export const getDeliveryById = async (id) => {
  const response = await client.get(`/api/wms/deliveries/${id}`);
  return response.data;
};

export const assignVehicle = async (id, vehicleId) => {
  const response = await client.put(`/api/wms/deliveries/${id}/assign-vehicle`, { vehicleId });
  return response.data;
};

export const updateDeliveryStatus = async (id, status, failureReason = '') => {
  const response = await client.put(`/api/wms/deliveries/${id}/status`, {
    status,
    failureReason
  });
  return response.data;
};

export const getVehicles = async () => {
  const response = await client.get('/api/wms/vehicles');
  return response.data;
};

export const getWarehouses = async () => {
  const response = await client.get('/api/wms/warehouses');
  return response.data;
};

export const createWarehouse = async (data) => {
  const response = await client.post('/api/wms/warehouses', data);
  return response.data;
};

export const updateWarehouse = async (id, data) => {
  const response = await client.put(`/api/wms/warehouses/${id}`, data);
  return response.data;
};

export const deleteWarehouse = async (id) => {
  const response = await client.delete(`/api/wms/warehouses/${id}`);
  return response.data;
};
