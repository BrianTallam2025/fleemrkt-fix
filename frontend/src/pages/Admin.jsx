// frontend/src/pages/Admin.jsx
// This component provides an administrative dashboard for managing users and requests.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
// CORRECT: Import the API objects that Admin.jsx uses
import { adminAPI, authAPI, requestsAPI, itemsAPI } from '../api.js'; // Added requestsAPI, itemsAPI for completeness

function Admin() {
  const { user, isAuthenticated, logout } = useAuth(); // Access user info, auth status, logout function
  const navigate = useNavigate();
  const [users, setUsers] = useState([]); // State to store all users
  const [requests, setRequests] = useState([]); // State to store all requests
  const [error, setError] = useState(''); // Error state for API calls
  const [loading, setLoading] = useState(true); // Loading state for data fetches

  // State for creating new admin user form
  const [newAdminUser, setNewAdminUser] = useState({
    username: '',
    email: '',
    password: ''
  });

  // useEffect hook to fetch data when the component mounts or auth status changes
  useEffect(() => {
    // Redirect if not authenticated or if the user is not an admin
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login'); // Redirect to login
      // Optionally, you could show an access denied message then redirect after a delay
      return;
    }

    // Function to fetch all necessary admin data (users, requests)
    const fetchData = async () => {
      try {
        setError(''); // Clear previous errors
        // Fetch all users (from authAPI as per your api.js)
        const usersResponse = await adminAPI.getAllUsers(); // Assuming getAllUsers is in adminAPI
        setUsers(usersResponse.data);

        // Fetch all requests (from adminAPI as per your api.js)
        const requestsResponse = await adminAPI.adminGetAllRequests();
        setRequests(requestsResponse.data);

      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError(err.response?.data?.msg || 'Failed to load admin data. Access might be restricted or server error.');
        // If 401/403, force logout
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout(); 
        }
      } finally {
        setLoading(false); // Data fetching complete
      }
    };

    fetchData(); // Execute the fetch function
  }, [isAuthenticated, user, navigate, logout]); // Dependencies for useEffect

  // Handler for deleting a request (admin action)
  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
      return; // If user cancels, do nothing
    }
    try {
      setError(''); // Clear previous errors
      // CORRECT: Access adminDeleteRequest from adminAPI object
      await adminAPI.adminDeleteRequest(requestId); 
      // Update state to remove the deleted request from the UI
      setRequests(requests.filter(req => req.id !== requestId));
      alert('Request deleted successfully!'); // Simple alert for success
    } catch (err) {
      console.error('Error deleting request:', err);
      setError(err.response?.data?.msg || 'Failed to delete request.');
    }
  };

  // Handler for input changes in the new admin user form
  const handleNewAdminChange = (e) => {
    const { name, value } = e.target;
    setNewAdminUser(prev => ({ ...prev, [name]: value }));
  };

  // Handler for submitting the new admin user form
  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      // CORRECT: Access createAdminUser from adminAPI object
      await adminAPI.createAdminUser(newAdminUser); 
      setNewAdminUser({ username: '', email: '', password: '' }); // Reset form
      // Re-fetch users to update the list in the UI
      const usersResponse = await adminAPI.getAllUsers(); // Assuming getAllUsers is in adminAPI for admin usage
      setUsers(usersResponse.data);
      alert('Admin user created successfully!'); // Simple alert for success
    } catch (err) {
      console.error('Error creating admin user:', err);
      setError(err.response?.data?.msg || 'Failed to create admin user.');
    }
  };

  // Render loading state while fetching initial data
  if (loading) {
    return <div className="text-center p-4 text-gray-700 text-lg">Loading admin dashboard...</div>;
  }

  // Render access denied message if user is not an admin
  // This check is already in PrivateRoute, but a direct message can be useful
  if (user?.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center p-4 bg-red-50">
             <div className="text-center bg-white p-8 rounded-lg shadow-lg">
               <h2 className="text-3xl font-bold text-red-700 mb-4">Access Denied!</h2>
               <p className="text-gray-800">You do not have the required role to view this page.</p>
             </div>
           </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      {error && <p className="text-red-600 text-center mb-4">{error}</p>}

      {/* Create New Admin User Form Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Create New Admin User</h2>
        <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
          <div>
            <label htmlFor="adminUsername" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="adminUsername"
              name="username"
              value={newAdminUser.username}
              onChange={handleNewAdminChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="adminEmail"
              name="email"
              value={newAdminUser.email}
              onChange={handleNewAdminChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="adminPassword"
              name="password"
              value={newAdminUser.password}
              onChange={handleNewAdminChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
          >
            Create Admin
          </button>
        </form>
      </div>

      {/* All Users List Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Users</h2>
        {users.length === 0 ? (
          <p className="text-gray-600">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Requests List Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-600">No requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map(request => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.item_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.requester_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.owner_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(request.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        className="text-red-600 hover:text-red-900 ml-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
