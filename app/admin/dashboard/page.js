"use client";
import { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useRouter } from 'next/navigation';
import OrderDetailsModal from './OrderDetailsModal';
import './dashboard.css';

export default function AdminDashboard() {
  const { admin, logout, isAuthenticated, loading } = useAdmin();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });
  const [filterInputs, setFilterInputs] = useState({
    status: 'all',
    startDate: '',
    endDate: ''
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Queries section state
  const [queries, setQueries] = useState([]);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [queriesFilters, setQueriesFilters] = useState({
    status: 'all',
    page: 1,
    limit: 10
  });
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, loading, router]);

  // Initial load - fetch all orders
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllOrdersInitial();
      fetchAnalytics();
    }
  }, [isAuthenticated]);

  // Load queries when queries section is active
  useEffect(() => {
    if (isAuthenticated && activeSection === 'queries') {
      fetchQueries();
    }
  }, [isAuthenticated, activeSection, queriesFilters]);

  // Load orders when filters are applied
  useEffect(() => {
    if (isAuthenticated) {
      const hasActiveFilters = appliedFilters.status !== 'all' || appliedFilters.startDate || appliedFilters.endDate;
      if (hasActiveFilters) {
        fetchOrders();
      } else {
        // No filters applied, show all orders
        fetchAllOrdersInitial();
      }
      // Always refresh analytics when filters change
      fetchAnalytics();
    }
  }, [appliedFilters]);

  const fetchAllOrdersInitial = async () => {
    try {
      setIsLoadingData(true);
      // Fetch all orders without any filters
      const queryParams = new URLSearchParams({
        status: 'all',
        page: '1',
        limit: '50' // Show more orders initially
      });

      const response = await fetch(`http://localhost:5001/api/admin/orders?${queryParams}`);
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching initial orders:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...appliedFilters,
        page: appliedFilters.page.toString(),
        limit: appliedFilters.limit.toString()
      });

      const response = await fetch(`http://localhost:5001/api/admin/orders?${queryParams}`);
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (appliedFilters.startDate) queryParams.append('startDate', appliedFilters.startDate);
      if (appliedFilters.endDate) queryParams.append('endDate', appliedFilters.endDate);

      const response = await fetch(`http://localhost:5001/api/admin/analytics?${queryParams}`);
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // URL encode the orderId to handle special characters like # in TQ1234#
      const encodedOrderId = encodeURIComponent(orderId);
      const response = await fetch(`http://localhost:5001/api/admin/orders/${encodedOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
        fetchAnalytics(); // Refresh analytics
        console.log('Order status updated successfully:', orderId, newStatus);
      } else {
        console.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      console.log('Attempting to fetch order:', orderId);
      // URL encode the orderId to handle special characters like # in TQ1234#
      const encodedOrderId = encodeURIComponent(orderId);
      const response = await fetch(`http://localhost:5001/api/admin/orders/${encodedOrderId}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Order fetched successfully:', data);
        setSelectedOrder(data);
        setIsModalOpen(true);
      } else {
        console.error('Failed to fetch order:', data);
        alert('Failed to load order details: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Error loading order details. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Queries management functions
  const fetchQueries = async () => {
    try {
      setQueriesLoading(true);
      const { status, page, limit } = queriesFilters;
      const queryParams = new URLSearchParams({
        status: status !== 'all' ? status : '',
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await fetch(`http://localhost:5001/api/contact?${queryParams}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setQueries(data.data.messages);
      } else {
        console.error('Failed to fetch queries:', data.message);
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
    } finally {
      setQueriesLoading(false);
    }
  };

  const handleViewQuery = async (queryId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/contact/${queryId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setSelectedQuery(data.data);
        setIsQueryModalOpen(true);
      } else {
        console.error('Failed to fetch query details:', data.message);
        alert('Failed to load query details');
      }
    } catch (error) {
      console.error('Error fetching query details:', error);
      alert('Error loading query details. Please try again.');
    }
  };

  const updateQueryStatus = async (queryId, newStatus, adminNotes = '') => {
    try {
      const response = await fetch(`http://localhost:5001/api/contact/${queryId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, adminNotes }),
      });

      if (response.ok) {
        fetchQueries(); // Refresh queries
        if (selectedQuery && selectedQuery._id === queryId) {
          setSelectedQuery({ ...selectedQuery, status: newStatus, adminNotes });
        }
        console.log('Query status updated successfully:', queryId, newStatus);
      } else {
        console.error('Failed to update query status');
      }
    } catch (error) {
      console.error('Error updating query status:', error);
    }
  };

  const handleCloseQueryModal = () => {
    setIsQueryModalOpen(false);
    setSelectedQuery(null);
  };

  const formatQuerySubject = (subject) => {
    const subjects = {
      general: 'General Inquiry',
      order: 'Order Related',
      catering: 'Event Catering',
      bulk: 'Bulk Orders',
      feedback: 'Feedback',
      complaint: 'Complaint',
      other: 'Other'
    };
    return subjects[subject] || subject;
  };

  const getQueryStatusColor = (status) => {
    switch (status) {
      case 'new': return 'status-new';
      case 'in_progress': return 'status-progress';
      case 'resolved': return 'status-resolved';
      case 'closed': return 'status-closed';
      default: return '';
    }
  };

  const formatQueryStatus = (status) => {
    const statuses = {
      new: 'New',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed'
    };
    return statuses[status] || status;
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      ...filterInputs,
      page: 1,
      limit: appliedFilters.limit
    });
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      status: 'all',
      startDate: '',
      endDate: ''
    };
    setFilterInputs(defaultFilters);
    setAppliedFilters({
      ...defaultFilters,
      page: 1,
      limit: appliedFilters.limit
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/admin');
  };

  if (loading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    return `status-badge status-${status}`;
  };

  return (
    <div className="admin-dashboard">
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      />
      
      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">The Quisine</h2>
          <p className="sidebar-subtitle">Admin Dashboard</p>
        </div>
        
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('overview');
              closeMobileMenu();
            }}
          >
            <span className="nav-icon">📊</span>
            Overview
          </div>
          <div 
            className={`nav-item ${activeSection === 'orders' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('orders');
              closeMobileMenu();
            }}
          >
            <span className="nav-icon">🛍️</span>
            Orders
          </div>
          <div 
            className={`nav-item ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('analytics');
              closeMobileMenu();
            }}
          >
            <span className="nav-icon">📈</span>
            Analytics
          </div>
          <div 
            className={`nav-item ${activeSection === 'queries' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('queries');
              closeMobileMenu();
            }}
          >
            <span className="nav-icon">💬</span>
            Queries
          </div>
        </nav>
      </div>

      {/* Top Header with Logout */}
      <div className="header-top">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            className="mobile-menu-button"
            onClick={toggleMobileMenu}
          >
            ☰
          </button>
          <h2>Admin Dashboard - {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h2>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <div className="header-info">
            <h1>Welcome back, {admin?.username}!</h1>
            <p>Here's what's happening at your restaurant today.</p>
          </div>
        </div>

        {activeSection === 'overview' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Orders</h3>
                <p>{analytics?.totalOrders || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Total Revenue</h3>
                <p>{formatCurrency(analytics?.totalRevenue || 0)}</p>
              </div>
              <div className="stat-card">
                <h3>Average Order Value</h3>
                <p>{formatCurrency(analytics?.averageOrderValue || 0)}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Orders</h3>
                <p>{analytics?.ordersByStatus?.placed || 0}</p>
              </div>
            </div>

            <div className="content-section">
              <div className="section-header">
                <h2 className="section-title">Recent Orders</h2>
              </div>
              <div style={{ padding: '1rem 2rem' }}>
                {orders.slice(0, 5).map((order) => (
                  <div key={order._id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem 0',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <div>
                      <strong>#{order.orderId}</strong>
                      <p style={{ color: '#718096', fontSize: '0.875rem' }}>
                        {order.customerInfo.name} • {formatCurrency(order.pricing.finalTotal)}
                      </p>
                    </div>
                    <span className={getStatusBadgeClass(order.orderStatus)}>
                      {order.orderStatus.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeSection === 'orders' && (
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Order Management</h2>
            </div>
            
            <div className="filters-container">
              <div className="filters-grid">
                <div className="filter-group">
                  <label className="filter-label">Status</label>
                  <select 
                    className="filter-select"
                    value={filterInputs.status}
                    onChange={(e) => setFilterInputs({...filterInputs, status: e.target.value})}
                  >
                    <option value="all">All Orders</option>
                    <option value="placed">Placed</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label className="filter-label">Start Date</label>
                  <input 
                    type="date"
                    className="filter-input"
                    value={filterInputs.startDate}
                    onChange={(e) => setFilterInputs({...filterInputs, startDate: e.target.value})}
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">End Date</label>
                  <input 
                    type="date"
                    className="filter-input"
                    value={filterInputs.endDate}
                    onChange={(e) => setFilterInputs({...filterInputs, endDate: e.target.value})}
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Actions</label>
                  <div className="filter-buttons">
                    <button 
                      className="filter-button apply-button"
                      onClick={handleApplyFilters}
                    >
                      Apply Filters
                    </button>
                    <button 
                      className="filter-button clear-button"
                      onClick={handleClearFilters}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>#{order.orderId}</td>
                    <td>
                      <div>
                        <div>{order.customerInfo.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                          {order.customerInfo.phone}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>
                        {order.items.slice(0, 2).map(item => item.productName).join(', ')}
                        {order.items.length > 2 && ` +${order.items.length - 2} more`}
                      </div>
                    </td>
                    <td>{formatCurrency(order.pricing.finalTotal)}</td>
                    <td>
                      {order.orderStatus === 'delivered' || order.orderStatus === 'cancelled' ? (
                        <span className={getStatusBadgeClass(order.orderStatus)}>
                          {order.orderStatus.replace('_', ' ').toUpperCase()}
                        </span>
                      ) : (
                        <select 
                          className="filter-select"
                          value={order.orderStatus}
                          onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                        >
                          <option value="placed">Placed</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-button view-button"
                          onClick={() => handleViewOrder(order.orderId)}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'analytics' && (
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Analytics & Reports</h2>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Orders by Status</h3>
                  {analytics?.ordersByStatus && Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
                
                <div className="stat-card">
                  <h3>Top Selling Items</h3>
                  {analytics?.topItems?.slice(0, 5).map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span>{item._id}</span>
                      <span>{item.totalQuantity} sold</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'queries' && (
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Customer Queries</h2>
            </div>
            
            <div className="filters-container">
              <div className="filters-grid">
                <div className="filter-group">
                  <label className="filter-label">Status</label>
                  <select 
                    className="filter-select"
                    value={queriesFilters.status}
                    onChange={(e) => setQueriesFilters({ ...queriesFilters, status: e.target.value, page: 1 })}
                  >
                    <option value="all">All Queries</option>
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {queriesLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading queries...</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Name</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queries.length > 0 ? (
                      queries.map((query) => (
                        <tr key={query._id}>
                          <td>
                            <div className="query-date">
                              {new Date(query.createdAt).toLocaleDateString()}
                            </div>
                            <div className="query-time">
                              {new Date(query.createdAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td>
                            <div className="query-customer">
                              <div className="customer-name">{query.name}</div>
                              <div className="customer-email">{query.email}</div>
                            </div>
                          </td>
                          <td>
                            <div className="query-subject">
                              <span className="subject-badge">{formatQuerySubject(query.subject)}</span>
                            </div>
                          </td>
                          <td>
                            <select
                              className={`status-select ${getQueryStatusColor(query.status)}`}
                              value={query.status}
                              onChange={(e) => updateQueryStatus(query._id, e.target.value)}
                            >
                              <option value="new">New</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          </td>
                          <td>
                            <button 
                              className="action-button view-button"
                              onClick={() => handleViewQuery(query._id)}
                              title="View Query Details"
                            >
                              👁️ View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-data">
                          <div className="no-data-message">
                            <span className="no-data-icon">💬</span>
                            <h3>No queries found</h3>
                            <p>No customer queries match the current filters.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Query Details Modal */}
      {isQueryModalOpen && selectedQuery && (
        <div className="modal-overlay" onClick={handleCloseQueryModal}>
          <div className="modal-content query-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Query Details</h2>
              <button className="modal-close" onClick={handleCloseQueryModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="query-details">
                <div className="query-info-grid">
                  <div className="info-group">
                    <label>Customer Name:</label>
                    <span>{selectedQuery.name}</span>
                  </div>
                  <div className="info-group">
                    <label>Email:</label>
                    <span>{selectedQuery.email}</span>
                  </div>
                  <div className="info-group">
                    <label>Phone:</label>
                    <span>{selectedQuery.phone || 'Not provided'}</span>
                  </div>
                  <div className="info-group">
                    <label>Subject:</label>
                    <span className="subject-badge">{formatQuerySubject(selectedQuery.subject)}</span>
                  </div>
                  <div className="info-group">
                    <label>Status:</label>
                    <select
                      className={`status-select ${getQueryStatusColor(selectedQuery.status)}`}
                      value={selectedQuery.status}
                      onChange={(e) => updateQueryStatus(selectedQuery._id, e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="info-group">
                    <label>Date:</label>
                    <span>{new Date(selectedQuery.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="message-section">
                  <label>Message:</label>
                  <div className="message-content">{selectedQuery.message}</div>
                </div>
                
                <div className="admin-notes-section">
                  <label>Admin Notes:</label>
                  <textarea
                    className="admin-notes-input"
                    value={selectedQuery.adminNotes || ''}
                    onChange={(e) => setSelectedQuery({ ...selectedQuery, adminNotes: e.target.value })}
                    placeholder="Add notes about this query..."
                    rows={3}
                  />
                  <button
                    className="save-notes-btn"
                    onClick={() => updateQueryStatus(selectedQuery._id, selectedQuery.status, selectedQuery.adminNotes)}
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}