import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiBaseUrl = (configuredApiUrl || '/api').replace(/\/+$/, '');

const deploymentConfigMessage =
    'Frontend is not connected to the backend API. Set VITE_API_URL in Vercel to your Render backend URL ending with /api, then redeploy the frontend.';

const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const contentType = error.response?.headers?.['content-type'] || '';
        if (contentType.includes('text/html')) {
            error.userMessage = deploymentConfigMessage;
        } else if (!error.response && error.message === 'Network Error') {
            error.userMessage =
                'Cannot reach the backend API. Check VITE_API_URL in Vercel and FRONTEND_URL in Render.';
        }

        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
