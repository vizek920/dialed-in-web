// رابط الخادم: من متغير البيئة VITE_API_URL، وإلا الخادم المحلي.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
