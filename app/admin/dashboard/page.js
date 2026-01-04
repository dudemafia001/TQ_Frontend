"use client";
import { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useRouter } from 'next/navigation';
import config, { buildApiUrl } from '../../../config';
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
  
  // Site status state
  const [siteStatus, setSiteStatus] = useState({ isOpen: true, closedMessage: '', reopenTime: null });
  const [tempMessage, setTempMessage] = useState('');
  const [tempReopenTime, setTempReopenTime] = useState('');

  // Products section state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    description: '',
    imageUrl: '',
    variants: [{ type: 'Half', price: '' }, { type: 'Full', price: '' }],
    inStock: true
  });

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
      fetchSiteStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Load queries when queries section is active
  useEffect(() => {
    if (isAuthenticated && activeSection === 'queries') {
      fetchQueries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeSection]);

  // Load products when products section is active
  useEffect(() => {
    if (isAuthenticated && activeSection === 'products') {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeSection]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, isAuthenticated]);

  const fetchAllOrdersInitial = async () => {
    try {
      // Fetch all orders without any filters
      const queryParams = new URLSearchParams({
        status: 'all',
        page: '1',
        limit: '50' // Show more orders initially
      });

      const response = await fetch(buildApiUrl(`${config.api.endpoints.admin.orders}?${queryParams}`));
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching initial orders:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...appliedFilters,
        page: appliedFilters.page.toString(),
        limit: appliedFilters.limit.toString()
      });

      const response = await fetch(buildApiUrl(`${config.api.endpoints.admin.orders}?${queryParams}`));
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

      const response = await fetch(buildApiUrl(`${config.api.endpoints.admin.analytics}?${queryParams}`));
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // URL encode the orderId to handle special characters like # in TQ1234#
      const encodedOrderId = encodeURIComponent(orderId);
      const response = await fetch(buildApiUrl(`${config.api.endpoints.admin.orders}/${encodedOrderId}/status`), {
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
      const response = await fetch(buildApiUrl(`${config.api.endpoints.admin.orders}/${encodedOrderId}`));
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

      const response = await fetch(buildApiUrl(`${config.api.endpoints.contact}?${queryParams}`));
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
      const response = await fetch(buildApiUrl(`${config.api.endpoints.contact}/${queryId}`));
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
      const response = await fetch(buildApiUrl(`${config.api.endpoints.contact}/${queryId}/status`), {
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

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await fetch(buildApiUrl(config.api.endpoints.products));
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleProductFormChange = (field, value) => {
    setProductForm({ ...productForm, [field]: value });
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...productForm.variants];
    updatedVariants[index][field] = value;
    setProductForm({ ...productForm, variants: updatedVariants });
  };

  const addVariant = () => {
    setProductForm({
      ...productForm,
      variants: [...productForm.variants, { type: '', price: '' }]
    });
  };

  const removeVariant = (index) => {
    const updatedVariants = productForm.variants.filter((_, i) => i !== index);
    setProductForm({ ...productForm, variants: updatedVariants });
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category,
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        variants: product.variants.length > 0 ? product.variants : [{ type: 'Half', price: '' }, { type: 'Full', price: '' }],
        inStock: product.inStock
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category: '',
        description: '',
        imageUrl: '',
        variants: [{ type: 'Half', price: '' }, { type: 'Full', price: '' }],
        inStock: true
      });
    }
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async () => {
    try {
      // Validate form
      if (!productForm.name || !productForm.category) {
        alert('Please fill in all required fields');
        return;
      }

      // Filter out empty variants
      const validVariants = productForm.variants.filter(v => v.type && v.price);

      const productData = {
        ...productForm,
        variants: validVariants
      };

      console.log('Sending product data:', productData); // Debug log

      const url = editingProduct 
        ? buildApiUrl(`${config.api.endpoints.products}/${editingProduct._id}`)
        : buildApiUrl(config.api.endpoints.products);
      
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (res.ok) {
        const savedProduct = await res.json();
        console.log('Saved product:', savedProduct); // Debug log
        alert(`Product ${editingProduct ? 'updated' : 'created'} successfully!`);
        closeProductModal();
        fetchProducts();
      } else {
        const error = await res.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const res = await fetch(buildApiUrl(`${config.api.endpoints.products}/${productId}`), {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('Product deleted successfully!');
        fetchProducts();
      } else {
        alert('Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  const fetchSiteStatus = async () => {
    try {
      const res = await fetch(buildApiUrl(config.api.endpoints.site.status));
      const data = await res.json();
      if (data.success) {
        setSiteStatus(data.data);
        setTempMessage(data.data.closedMessage);
        if (data.data.reopenTime) {
          const date = new Date(data.data.reopenTime);
          const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setTempReopenTime(localDateTime);
        }
      }
    } catch (err) {
      console.error('Error fetching site status:', err);
    }
  };

  const updateSiteStatus = async (isOpen) => {
    try {
      const payload = { 
        isOpen, 
        closedMessage: tempMessage,
        reopenTime: tempReopenTime ? new Date(tempReopenTime).toISOString() : null
      };
      const res = await fetch(buildApiUrl(config.api.endpoints.site.update), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSiteStatus(data.data);
        alert(data.message);
      }
    } catch (err) {
      console.error('Error updating site status:', err);
    }
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
          <div 
            className={`nav-item ${activeSection === 'products' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('products');
              closeMobileMenu();
            }}
          >
            <span className="nav-icon">🍽️</span>
            Products
          </div>
          <div 
            className={`nav-item ${activeSection === 'siteStatus' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('siteStatus');
              closeMobileMenu();
            }}
          >
            <span className="nav-icon">{siteStatus.isOpen ? '✅' : '🚫'}</span>
            Site Status
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

        {activeSection === 'products' && (
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Product Management</h2>
              <button 
                className="primary-button"
                onClick={() => openProductModal()}
                style={{ 
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#48bb78',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                + Add New Product
              </button>
            </div>

            {/* Category Filter */}
            <div className="filters-container" style={{ marginBottom: '1.5rem' }}>
              <div className="filters-grid">
                <div className="filter-group">
                  <label className="filter-label">Filter by Category</label>
                  <select
                    className="filter-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      minWidth: '200px'
                    }}
                  >
                    <option value="all">All Categories</option>
                    {[...new Set(products.map(p => p.category))].sort().map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                {selectedCategory !== 'all' && (
                  <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      className="filter-button clear-button"
                      onClick={() => setSelectedCategory('all')}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#e2e8f0',
                        color: '#2d3748',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Clear Filter
                    </button>
                  </div>
                )}
              </div>
            </div>

            {productsLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading products...</div>
            ) : products.filter(p => selectedCategory === 'all' || p.category === selectedCategory).length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
                {selectedCategory === 'all' 
                  ? 'No products found. Add your first product!'
                  : `No products found in "${selectedCategory}" category.`
                }
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Variants</th>
                      <th>Stock Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
                      .map((product) => (
                      <tr key={product._id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: '600' }}>{product.name}</div>
                            {product.description && (
                              <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                                {product.description}
                              </div>
                            )}
                            {product.imageUrl && (
                              <div style={{ fontSize: '0.75rem', color: '#4299e1', marginTop: '0.25rem' }}>
                                🖼️ Image: {product.imageUrl.substring(0, 40)}...
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{ 
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '12px',
                            fontSize: '0.875rem'
                          }}>
                            {product.category}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.875rem' }}>
                            {product.variants.length > 0 ? (
                              product.variants.map((v, i) => (
                                <div key={i}>
                                  {v.type}: ₹{v.price}
                                </div>
                              ))
                            ) : (
                              <span style={{ color: '#718096' }}>No variants</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: product.inStock ? '#c6f6d5' : '#fed7d7',
                            color: product.inStock ? '#22543d' : '#742a2a',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="action-button view-button"
                              onClick={() => openProductModal(product)}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#4299e1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              className="action-button delete-button"
                              onClick={() => handleDeleteProduct(product._id)}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#e53e3e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSection === 'siteStatus' && (
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Site Status Control</h2>
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '2rem' }}>{siteStatus.isOpen ? '✅' : '🚫'}</div>
                  <h3 style={{ margin: 0 }}>Status: {siteStatus.isOpen ? 'Open' : 'Closed'}</h3>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Message when closed:
                  </label>
                  <textarea
                    value={tempMessage}
                    onChange={(e) => setTempMessage(e.target.value)}
                    placeholder="Enter message to show when site is closed..."
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      minHeight: '100px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    ⏰ Reopen Date & Time (Optional):
                  </label>
                  <input
                    type="datetime-local"
                    value={tempReopenTime}
                    onChange={(e) => setTempReopenTime(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                  />
                  <small style={{ color: '#718096', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>
                    Set when the site will automatically reopen. Leave empty for no timer.
                  </small>
                  {tempReopenTime && (
                    <button
                      onClick={() => setTempReopenTime('')}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#e2e8f0',
                        color: '#2d3748',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Clear Timer
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => updateSiteStatus(false)}
                    disabled={!siteStatus.isOpen}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: !siteStatus.isOpen ? '#cbd5e0' : '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: siteStatus.isOpen ? 'pointer' : 'not-allowed'
                    }}
                  >
                    � Close Site
                  </button>
                  <button
                    onClick={() => updateSiteStatus(true)}
                    disabled={siteStatus.isOpen}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: siteStatus.isOpen ? '#cbd5e0' : '#48bb78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: !siteStatus.isOpen ? 'pointer' : 'not-allowed'
                    }}
                  >
                    ✅ Open Site
                  </button>
                </div>
              </div>
            </div>
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

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="modal-close" onClick={closeProductModal}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Product Name <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => handleProductFormChange('name', e.target.value)}
                    placeholder="e.g., Butter Chicken"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Category <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => handleProductFormChange('category', e.target.value)}
                    placeholder="e.g., Main Course, Starters, Desserts"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => handleProductFormChange('description', e.target.value)}
                    placeholder="Describe your dish..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      minHeight: '80px',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={productForm.imageUrl}
                    onChange={(e) => handleProductFormChange('imageUrl', e.target.value)}
                    placeholder="https://drive.google.com/..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                  <small style={{ color: '#718096', fontSize: '0.875rem' }}>
                    Use direct image URL or Google Drive share link
                  </small>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Variants (Sizes & Prices)
                  </label>
                  {productForm.variants.map((variant, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={variant.type}
                        onChange={(e) => handleVariantChange(index, 'type', e.target.value)}
                        placeholder="Type (e.g., Half, Full)"
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '1rem'
                        }}
                      />
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        placeholder="Price"
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '1rem'
                        }}
                      />
                      {productForm.variants.length > 1 && (
                        <button
                          onClick={() => removeVariant(index)}
                          style={{
                            padding: '0.75rem',
                            backgroundColor: '#e53e3e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addVariant}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#4299e1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    + Add Variant
                  </button>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={productForm.inStock}
                      onChange={(e) => handleProductFormChange('inStock', e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: '600' }}>In Stock</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    onClick={handleSaveProduct}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#48bb78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                  <button
                    onClick={closeProductModal}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#cbd5e0',
                      color: '#2d3748',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Cancel
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