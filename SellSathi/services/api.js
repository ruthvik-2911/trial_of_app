import axios from 'axios';

const BASE_URL = 'https://sellsathibackend.onrender.com/api';

export const api = axios.create({ baseURL: BASE_URL });

export const getProducts  = () => api.get('/products');
export const getProduct   = (id) => api.get(`/products/${id}`);
export const login        = (data) => api.post('/auth/login', data);
export const register     = (data) => api.post('/auth/register', data);
export const getOrders    = () => api.get('/orders');
export const getCart      = () => api.get('/cart');
export const addToCart    = (data) => api.post('/cart', data);
