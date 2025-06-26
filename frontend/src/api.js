// frontend/src/api.js
// This file sets up an Axios instance for making API requests.
// It dynamically determines the backend URL based on environment variables,
// and automatically attaches the JWT token for authenticated requests.

import axios from 'axios';
import { handleAPIError } from './utils/errorHandler.js'; // Ensure this file exists

// Dynamically set the base URL for API requests.
// During local development, it will fall back to 'http://localhost:5000/api'.
// In production (e.g., on Vercel), `import.meta.env.VITE_API_BASE_URL` will be
// read from the environment variable configured on Vercel (e.g.,
// https://your-backend-name.onrender.com/api).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // IMPORTANT: Allows cookies to be sent (though we use headers for JWT)
    timeout: 20000, // 20 seconds timeout for Render's free tier
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // Standard header for AJAX requests
    }
});

// Request interceptor to include the JWT token in the Authorization header.
// This runs before every request made with this Axios instance.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Retrieve token from local storage
        if (token) {
            // Add it to the Authorization header using the Bearer scheme.
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config; // Always return the config
    },
    (error) => {
        // Handle request errors (e.g., network issues before request is sent)
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh and common API errors.
api.interceptors.response.use(
    response => {
        // Store new tokens if present in response (e.g., after login)
        if (response.data?.access_token) {
            localStorage.setItem('token', response.data.access_token);
        }
        return response;
    },
    async error => {
        const originalRequest = error.config;
        
        // Handle token expiration/validation errors (401 Unauthorized, 422 Unprocessable Content)
        // and attempt to refresh the token if it's not a retry.
        if ((error.response?.status === 401 || error.response?.status === 422) && 
            error.response.data?.msg?.includes('token') && // Check if message indicates token issue
            !originalRequest._retry) { // Prevent infinite retry loops
            
            originalRequest._retry = true; // Mark request as retried
            
            try {
                // Attempt to refresh the token using the dedicated endpoint
                // We are calling authAPI.refreshToken() because it's defined in this same file
                // and should be handled by the interceptor for its own request.
                const { data } = await authAPI.refreshToken(); 
                localStorage.setItem('token', data.access_token); // Store the new token
                // Update the original request's header with the new token and retry it
                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                return api(originalRequest); // Retry the original request
            } catch (refreshError) {
                // If token refresh fails, remove old token and redirect to login
                console.error("Token refresh failed, forcing logout:", refreshError);
                localStorage.removeItem('token');
                localStorage.removeItem('user'); // Also clear user data
                // Use window.location.href to ensure full page reload and clean state
                window.location.href = '/login?session=expired'; 
                return Promise.reject(refreshError);
            }
        }
        
        // Pass other errors to a central error handler
        return Promise.reject(handleAPIError(error));
    }
);

// Helper function to set/clear the JWT token as a default for the Axios instance.
// This is called after login and during initial app load/logout from AuthContext.
export const setAuthToken = (token) => {
    if (token) {
        // Set the token as a common default header for all subsequent requests.
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        // If no token is provided (e.g., on logout), delete the Authorization header.
        delete api.defaults.headers.common['Authorization'];
    }
};

// --- Exported API functions, organized into groups ---
// This structure makes imports cleaner in components: e.g., `authAPI.login`
export const authAPI = {
    login: credentials => api.post('/login', credentials),
    logout: () => api.post('/logout'), 
    register: userData => api.post('/register', userData),
    refreshToken: () => api.post('/refresh-token'), // Assuming you have this endpoint
    getCurrentUser: () => api.get('/users/me'), // Example: get current logged-in user
    // Note: getAllUsers is typically an admin function, consider putting it in adminAPI
};

export const itemsAPI = {
    getAllItems: (params) => api.get('/items', { params }),
    createItem: (itemData) => api.post('/items', itemData),
    updateItem: (id, itemData) => api.patch(`/items/${id}`, itemData),
    deleteItem: (id) => api.delete(`/items/${id}`),
    getItemById: (id) => api.get(`/items/${id}`)
};

export const requestsAPI = {
    createRequest: (itemId) => api.post('/requests', { item_id: itemId }),
    getSentRequests: () => api.get('/requests/sent'),
    getReceivedRequests: () => api.get('/requests/received'),
    updateRequestStatus: (requestId, status) => api.put(`/requests/${requestId}/status`, { status })
};

export const adminAPI = {
    // Assuming adminGetUsers is needed by admin page. If authAPI.getAllUsers is admin-only, move it here.
    getAllUsers: () => api.get('/admin/users'), 
    createAdminUser: (userData) => api.post('/admin/create_admin_user', userData),
    adminGetAllRequests: () => api.get('/admin/requests'),
    adminDeleteRequest: (requestId) => api.delete(`/admin/requests/${requestId}`),
    adminDeleteUser: (userId) => api.delete(`/admin/users/${userId}`) // Assuming this is defined
};

// Export the configured Axios instance as default (less common if using named exports extensively)
export default api; 
