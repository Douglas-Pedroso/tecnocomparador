import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Funções de autenticação
export const authAPI = {
  register: (dados) => api.post('/api/auth/register', dados),
  login: (dados) => api.post('/api/auth/login', dados),
  me: () => api.get('/api/auth/me'),
  googleLogin: () => `${API_URL}/api/auth/google`,
  facebookLogin: () => `${API_URL}/api/auth/facebook`
};

// Funções de produtos
export const produtosAPI = {
  buscar: (termo, params = {}) => api.get('/api/produtos', { params: { busca: termo, ...params } }),
  buscarPorLojas: (termo) => api.post('/api/produtos/buscar-lojas', { termo }),
  salvarProdutos: (termo, produtos) => api.post('/api/produtos/salvar', { busca: termo, produtos }),
  detalhes: (id) => api.get(`/api/produtos/${id}`),
  historico: () => api.get('/api/produtos/usuario/historico')
};

// Funções de favoritos
export const favoritosAPI = {
  listar: () => api.get('/api/favoritos'),
  adicionar: (produto_id, produto) => api.post('/api/favoritos', { produto_id, produto }),
  remover: (id) => api.delete(`/api/favoritos/${id}`),
  removerPorProduto: (produto_id) => api.delete(`/api/favoritos/produto/${produto_id}`)
};

export default api;
