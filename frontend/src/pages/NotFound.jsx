// frontend/src/pages/NotFound.jsx
// A simple component for displaying a 404 Not Found page.

import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 text-center">
      <h1 className="text-9xl font-extrabold text-gray-800 mb-4">404</h1>
      <p className="text-2xl md:text-3xl font-light text-gray-600 mb-8">Page Not Found</p>
      <p className="text-lg text-gray-700 mb-8">
        The page you are looking for does not exist or an error occurred.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out text-lg font-semibold"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

export default NotFound;
