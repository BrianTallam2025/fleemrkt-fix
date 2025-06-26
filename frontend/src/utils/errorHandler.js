// frontend/src/utils/errorHandler.js
// Centralized error handling for Axios responses.

export const handleAPIError = (error) => {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx (e.g., 400, 401, 404, 500)
        console.error('API Error Response:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        // Return a structured error object that can be used in components
        return {
            message: error.response.data.msg || `Server Error: ${error.response.status}`,
            status: error.response.status,
            data: error.response.data
        };
    } else if (error.request) {
        // The request was made but no response was received (e.g., network down, CORS issue)
        console.error('API Error Request:', error.request);
        return {
            message: 'Network Error: No response received from server. Check your internet connection or server status.',
            status: 0, // Custom status to indicate network error
            data: null
        };
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error('API Error Message:', error.message);
        return {
            message: `Error: ${error.message}`,
            status: -1, // Custom status for general client-side error
            data: null
        };
    }
};
