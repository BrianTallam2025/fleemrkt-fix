// frontend/src/context/AuthContext.jsx
// This file sets up a React Context to manage authentication state across the application.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Import authAPI for login/logout and setAuthToken helper from api.js
import { authAPI, setAuthToken } from '../api.js'; 

// Create the AuthContext to provide authentication state to components.
const AuthContext = createContext(null);

// AuthProvider component wraps the application (or parts of it)
// to make authentication state and functions available.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores current user data (id, username, role)
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication status
  const [loading, setLoading] = useState(true); // Loading state for initial auth check
  const navigate = useNavigate(); // For programmatic navigation (e.g., after login/logout)

  // useEffect runs once on component mount to check for existing token/user data in localStorage.
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setAuthToken(token); // CRITICAL: Set token as default in Axios when app loads

        // Optional: Verify token validity by calling a protected endpoint.
        // If this fails, the Axios interceptor should handle it (e.g., refresh or logout).
        const verifyTokenOnLoad = async () => {
          try {
            await authAPI.getCurrentUser(); // Call a simple protected route (e.g., /users/me)
            console.log("Token verified successfully on app load.");
          } catch (error) {
            console.error("Token verification failed on app load, forcing logout:", error);
            clientSideLogout(); // Token is likely invalid/expired or backend is unreachable
          }
        };
        verifyTokenOnLoad();

      } catch (e) {
        // If stored user data is corrupted (not valid JSON), log out the user.
        console.error("Failed to parse stored user data from localStorage:", e);
        clientSideLogout();
      }
    }
    setLoading(false); // Initial authentication check completed
  }, []); // Empty dependency array ensures this runs only once on mount

  // Client-side logout logic: clears local storage and local state.
  const clientSideLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null); // CRITICAL: Clear token from Axios defaults on logout
    navigate('/login'); // Redirect to login page after logout
  };

  // Login function: handles API call, stores token/user, updates state.
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials); // Use authAPI.login from api.js
      const { access_token, user_id, username, role } = response.data; // Destructure response

      localStorage.setItem('token', access_token); // Store token in localStorage
      const userData = { id: user_id, username, role };
      localStorage.setItem('user', JSON.stringify(userData)); // Store user data

      setUser(userData); // Update React state
      setIsAuthenticated(true); // Update React state
      setAuthToken(access_token); // CRITICAL: Set token as default in Axios after successful login

      navigate('/dashboard'); // Navigate to dashboard after successful login
      return true; // Indicate successful login
    } catch (error) {
      console.error('Login failed:', error.response?.data?.msg || error.message);
      return false; // Indicate failed login
    }
  };

  // Logout function: calls backend logout endpoint and then client-side logout.
  const logout = async () => {
    try {
      await authAPI.logout(); // Use authAPI.logout from api.js
      console.log("Backend logout successful (token blacklisted).");
    } catch (error) {
      console.error("Error blacklisting token on backend during logout:", error.response?.data?.msg || error.message);
    } finally {
      clientSideLogout(); // Always log out client-side regardless of backend success/failure
    }
  };

  // The value provided by the context to consuming components.
  const authContextValue = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the AuthContext in functional components.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider'); // Enforce correct usage
  }
  return context;
};

export default AuthContext;
