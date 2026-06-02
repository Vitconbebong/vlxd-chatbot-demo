import client from './client';

export const getProducts = async (params = {}) => {
  const response = await client.get('/api/catalog/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await client.get(`/api/catalog/products/${id}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await client.post('/api/catalog/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await client.put(`/api/catalog/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await client.delete(`/api/catalog/products/${id}`);
  return response.data;
};

export const getCategories = async () => {
  const response = await client.get('/api/catalog/categories');
  return response.data;
};

export const createCategory = async (data) => {
  const response = await client.post('/api/catalog/categories', data);
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await client.put(`/api/catalog/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await client.delete(`/api/catalog/categories/${id}`);
  return response.data;
};
