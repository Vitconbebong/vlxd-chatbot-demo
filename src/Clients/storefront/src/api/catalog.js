import client from './client';

export const getProducts = async (params = {}) => {
  const response = await client.get('/api/catalog/products', { params });
  return response.data; // Returns PagedResult<ProductDto>
};

export const getProductById = async (id) => {
  const response = await client.get(`/api/catalog/products/${id}`);
  return response.data; // Returns ProductDto
};

export const searchProducts = async (query) => {
  const response = await client.get(`/api/catalog/products/search`, { params: { q: query } });
  return response.data; // Returns List<ProductDto>
};

export const getCategories = async () => {
  const response = await client.get('/api/catalog/categories');
  return response.data; // Returns hierarchical List<CategoryDto>
};
