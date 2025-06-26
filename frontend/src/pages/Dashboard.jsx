// frontend/src/pages/Dashboard.jsx
// This component displays the user's dashboard, including posted items, requests, etc.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
// Import necessary API objects: itemsAPI for items, requestsAPI for requests
import { itemsAPI, requestsAPI } from '../api.js'; 

function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth(); // Access user info, auth status, logout function
  const navigate = useNavigate();
  const [items, setItems] = useState([]); // State to store fetched items
  const [sentRequests, setSentRequests] = useState([]); // State to store requests user has made
  const [receivedRequests, setReceivedRequests] = useState([]); // State to store requests for user's items
  const [loading, setLoading] = useState(true); // Loading state for all data fetches
  const [error, setError] = useState(''); // Error state for API calls

  // State for the new item creation form
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    image_url: '' 
  });

  // useEffect hook to fetch all necessary data when component mounts or auth status changes
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setError(''); // Clear previous errors
        setLoading(true); // Set loading to true for all fetches

        // 1. Fetch all items
        const itemsResponse = await itemsAPI.getAllItems(); 
        setItems(itemsResponse.data);

        // 2. Fetch requests sent by the current user
        const sentRequestsResponse = await requestsAPI.getSentRequests();
        setSentRequests(sentRequestsResponse.data);

        // 3. Fetch requests received for the current user's items
        const receivedRequestsResponse = await requestsAPI.getReceivedRequests();
        setReceivedRequests(receivedRequestsResponse.data);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.msg || 'Failed to load dashboard data. Please try again.');
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout(); 
        }
      } finally {
        setLoading(false); 
      }
    };

    fetchData(); 
  }, [isAuthenticated, navigate, logout]); 

  // Handler for input changes in the new item form
  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value })); 
  };

  // Handler for submitting the new item form
  const handleNewItemSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    try {
      console.log("Attempting to create item with data:", newItem);
      await itemsAPI.createItem(newItem); 
      setNewItem({ title: '', description: '', category: '', location: '', image_url: '' }); 
      // Re-fetch ALL data to update the lists
      const itemsResponse = await itemsAPI.getAllItems();
      setItems(itemsResponse.data);
      alert('Item posted successfully!'); 
    } catch (err) {
      console.error('Error creating item:', err);
      setError(err.response?.data?.msg || 'Failed to post item. Please try again.');
    }
  };

  // Handler for creating a new request for an item
  const handleCreateRequest = async (itemId) => {
    if (window.confirm("Are you sure you want to request this item?")) {
      try {
        setError('');
        await requestsAPI.createRequest(itemId);
        alert('Request sent successfully!');
        // Re-fetch sent requests to update the UI
        const sentRequestsResponse = await requestsAPI.getSentRequests();
        setSentRequests(sentRequestsResponse.data);
      } catch (err) {
        console.error('Error creating request:', err);
        setError(err.response?.data?.msg || 'Failed to send request. You might have a pending request already.');
      }
    }
  };

  // Handler for updating the status of a received request (accept/reject)
  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    if (window.confirm(`Are you sure you want to ${newStatus} this request?`)) {
      try {
        setError('');
        await requestsAPI.updateRequestStatus(requestId, newStatus);
        alert(`Request ${newStatus} successfully!`);
        // Re-fetch received requests to update the UI
        const receivedRequestsResponse = await requestsAPI.getReceivedRequests();
        setReceivedRequests(receivedRequestsResponse.data);
        // Optionally, re-fetch items if an accepted request changes item status
        // const itemsResponse = await itemsAPI.getAllItems();
        // setItems(itemsResponse.data);
      } catch (err) {
        console.error(`Error ${newStatus}ing request:`, err);
        setError(err.response?.data?.msg || `Failed to ${newStatus} request.`);
      }
    }
  };

  // Handler for logging out the user
  const handleLogout = async () => {
    await logout(); 
  };

  if (loading) {
    return <div className="text-center p-4 text-gray-700 text-lg">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition duration-150 ease-in-out"
        >
          Logout
        </button>
      </div>

      {user && (
        <p className="text-lg text-gray-700 mb-4">Welcome, {user.username} ({user.role})!</p>
      )}

      {error && <p className="text-red-600 text-center mb-4">{error}</p>}

      {/* New Item Form Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Post a New Item</h2>
        <form onSubmit={handleNewItemSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={newItem.title}
              onChange={handleNewItemChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              value={newItem.description}
              onChange={handleNewItemChange}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={newItem.category}
              onChange={handleNewItemChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={newItem.location}
              onChange={handleNewItemChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">Image URL</label>
            <input
              type="url" 
              id="image_url"
              name="image_url"
              value={newItem.image_url}
              onChange={handleNewItemChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., https://example.com/item.jpg"
              required
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            >
              Post Item
            </button>
          </div>
        </form>
      </div>

      {/* Available Items List Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Available Items</h2>
        {items.length === 0 ? (
          <p className="text-gray-600">No items available yet. Be the first to post one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col">
                <img 
                  src={item.image_url} 
                  alt={item.title} 
                  className="w-full h-48 object-cover rounded-md mb-3 flex-shrink-0" 
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x240/cccccc/000000?text=No+Image`; }}
                />
                <h3 className="text-xl font-bold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-gray-700 text-sm mb-2 flex-grow">{item.description}</p>
                <div className="text-sm text-gray-500 mt-auto">
                  <p><span className="font-medium">Category:</span> {item.category}</p>
                  <p><span className="font-medium">Location:</span> {item.location}</p>
                  <p><span className="font-medium">Posted by User ID:</span> {item.user_id}</p>
                  <p><span className="font-medium">Status:</span> {item.status}</p>
                  {/* Add Request Button if not the owner */}
                  {user && user.id !== item.user_id && item.status === 'available' && (
                    <button 
                      onClick={() => handleCreateRequest(item.id)}
                      className="mt-3 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-150 ease-in-out w-full"
                    >
                      Request Item
                    </button>
                  )}
                  {/* Show if item is not available, regardless of owner */}
                  {item.status !== 'available' && (
                    <p className="mt-3 text-center text-orange-600 font-semibold">Item {item.status}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Sent Requests Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Sent Requests</h2>
        {sentRequests.length === 0 ? (
          <p className="text-gray-600">You haven't sent any requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested On</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sentRequests.map(req => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.item_title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.owner_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(req.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My Received Requests Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Received Requests</h2>
        {receivedRequests.length === 0 ? (
          <p className="text-gray-600">No requests received for your items yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receivedRequests.map(req => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.item_title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.requester_username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {req.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateRequestStatus(req.id, 'accepted')}
                            className="text-green-600 hover:text-green-900 ml-2"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                            className="text-red-600 hover:text-red-900 ml-2"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {req.status !== 'pending' && (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${req.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                              req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`
                          }>
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                      )}
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

export default Dashboard;
