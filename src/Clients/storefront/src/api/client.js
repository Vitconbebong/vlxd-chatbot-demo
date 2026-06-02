import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5076',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vlxd_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized states
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('vlxd_token');
      localStorage.removeItem('vlxd_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
