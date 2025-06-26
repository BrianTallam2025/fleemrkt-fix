// frontend/src/App.jsx
// This is the main application component, setting up routing and authentication context.

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx'; // Import AuthProvider and useAuth

// Import your page components (you'll create these files in the next step)
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx'; // A simple 404 page

// --- PrivateRoute Component ---
// This component acts as a wrapper for routes that require authentication.
// It checks if the user is authenticated and, optionally, if they have required roles.
const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useAuth(); // Access auth state from context

  // Show a loading indicator while authentication status is being determined.
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-700">Loading authentication...</div>;
  }

  // If not authenticated, redirect to the login page.
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If roles are specified, check if the authenticated user has any of the required roles.
  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-red-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-red-700 mb-4">Access Denied!</h2>
          <p className="text-gray-800 mb-6">You do not have the required permissions to view this page.</p>
          <Navigate to="/dashboard" replace /> {/* Redirect non-admin users from admin page */}
        </div>
      </div>
    );
  }

  // If authenticated and has required role (or no roles specified), render the children components.
  return children;
};

// --- Main App Component ---
function App() {
  return (
    <Router> {/* BrowserRouter provides routing capabilities */}
      <AuthProvider> {/* AuthProvider makes authentication state available globally */}
        <Routes> {/* Routes defines the different paths in your application */}
          {/* Public Routes - Accessible to anyone */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes - Require authentication */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute roles={['user', 'admin']}> {/* Both users and admins can access dashboard */}
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute roles={['admin']}> {/* Only admins can access admin page */}
                <Admin />
              </PrivateRoute>
            } 
          />
          
          {/* Redirects */}
          {/* Redirect root ("/") to dashboard if authenticated, otherwise to login. */}
          {/* This requires a component that checks auth status, but a simple Navigate will do for now */}
          {/* A more robust check might be needed if / is directly accessed and auth state isn't immediately known. */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch-all route for any undefined paths (404 Not Found) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
