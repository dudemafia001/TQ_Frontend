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
  const [siteStatus, setSiteStatus] = useState({ 
    isOpen: true, 
    closedMessage: '', 
    reopenTime: null,
    operatingHoursEnabled: false, // Changed to false - disabled by default
    operatingHours: { start: '12:00', end: '23:00' },
    outsideHoursMessage: ''
  });
  const [tempMessage, setTempMessage] = useState('');
  const [tempReopenTime, setTempReopenTime] = useState('');
  const [tempOperatingHours, setTempOperatingHours] = useState({ start: '12:00', end: '23:00' });
  const [tempOutsideHoursMessage, setTempOutsideHoursMessage] = useState('');
  const [operatingHoursEnabled, setOperatingHoursEnabled] = useState(false); // Changed to false - disabled by default

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

  // Blogs section state
  const [blogs, setBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogFilters, setBlogFilters] = useState({ status: 'all', page: 1, limit: 20 });
  const [editingBlog, setEditingBlog] = useState(null);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [blogStats, setBlogStats] = useState(null);
  const [blogFormData, setBlogFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    category: 'Food',
    tags: '',
    author: 'The Quisine Team',
    readTime: 5,
    isPublished: false
  });
  const [uploadingImage, setUploadingImage] = useState(false);

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

  // Load blogs when blogs section is active
  useEffect(() => {
    if (isAuthenticated && activeSection === 'blogs') {
      fetchBlogs();
      fetchBlogStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeSection, blogFilters]);

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
        console.log('Orders fetched:', data.orders);
        // Log first order to check structure
        if (data.orders && data.orders.length > 0) {
          console.log('Sample order structure:', data.orders[0]);
          console.log('Sample order deliveryAddress:', data.orders[0].deliveryAddress);
        }
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
        const data = await response.json();
        console.log('Order status updated successfully:', data);
        fetchOrders(); // Refresh orders
        fetchAnalytics(); // Refresh analytics
        alert(`Order ${orderId} status updated to ${newStatus}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to update order status:', errorData);
        alert(`Failed to update order status: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(`Error updating order status: ${error.message}`);
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
        setTempOutsideHoursMessage(data.data.outsideHoursMessage || '');
        setOperatingHoursEnabled(data.data.operatingHoursEnabled !== false);
        setTempOperatingHours(data.data.operatingHours || { start: '12:00', end: '23:00' });
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
        reopenTime: tempReopenTime ? new Date(tempReopenTime).toISOString() : null,
        operatingHoursEnabled: operatingHoursEnabled,
        operatingHours: tempOperatingHours,
        outsideHoursMessage: tempOutsideHoursMessage
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

  // Blog management functions
  const fetchBlogs = async () => {
    try {
      setBlogsLoading(true);
      const queryParams = new URLSearchParams(blogFilters);
      const response = await fetch(buildApiUrl(`/api/admin/blogs?${queryParams}`));
      const data = await response.json();
      
      if (response.ok) {
        setBlogs(data.blogs || []);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setBlogsLoading(false);
    }
  };

  const fetchBlogStats = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/admin/blogs/stats/overview'));
      const data = await response.json();
      
      if (response.ok) {
        setBlogStats(data);
      }
    } catch (error) {
      console.error('Error fetching blog stats:', error);
    }
  };

  const handleBlogInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBlogFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(buildApiUrl('/api/upload/blog-image'), {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setBlogFormData(prev => ({
          ...prev,
          featuredImage: data.imageUrl
        }));
        alert('Image uploaded successfully!');
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const blogData = {
        ...blogFormData,
        metaKeywords: blogFormData.metaKeywords.split(',').map(k => k.trim()).filter(k => k),
        tags: blogFormData.tags.split(',').map(t => t.trim()).filter(t => t),
        readTime: parseInt(blogFormData.readTime) || 5
      };

      const url = editingBlog 
        ? buildApiUrl(`/api/admin/blogs/${editingBlog._id}`)
        : buildApiUrl('/api/admin/blogs');
      
      const method = editingBlog ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogData)
      });

      const data = await response.json();

      if (response.ok) {
        alert(editingBlog ? 'Blog updated successfully!' : 'Blog created successfully!');
        setShowBlogModal(false);
        resetBlogForm();
        fetchBlogs();
        fetchBlogStats();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Error saving blog');
    }
  };

  const handleEditBlog = (blog) => {
    setEditingBlog(blog);
    setBlogFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      featuredImage: blog.featuredImage || '',
      metaTitle: blog.metaTitle || '',
      metaDescription: blog.metaDescription || '',
      metaKeywords: (blog.metaKeywords || []).join(', '),
      category: blog.category,
      tags: (blog.tags || []).join(', '),
      author: blog.author,
      readTime: blog.readTime,
      isPublished: blog.isPublished
    });
    setShowBlogModal(true);
  };

  const handleDeleteBlog = async (id) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      const response = await fetch(buildApiUrl(`/api/admin/blogs/${id}`), {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Blog deleted successfully!');
        fetchBlogs();
        fetchBlogStats();
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Error deleting blog');
    }
  };

  const handleTogglePublishBlog = async (id) => {
    try {
      const response = await fetch(buildApiUrl(`/api/admin/blogs/${id}/toggle-publish`), {
        method: 'PATCH'
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchBlogs();
        fetchBlogStats();
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Error updating blog status');
    }
  };

  const resetBlogForm = () => {
    setEditingBlog(null);
    setBlogFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      category: 'Food',
      tags: '',
      author: 'The Quisine Team',
      readTime: 5,
      isPublished: false
    });
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

  if (loading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

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
            className={`nav-item ${activeSection === 'blogs' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('blogs');
              closeMobileMenu();
            }}
          >
            <span className="nav-icon">📝</span>
            Blogs
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
                  <th>Special Instructions</th>
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
                    <td>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        maxWidth: '250px'
                      }}>
                        {order.deliveryAddress?.specialRequest ? (
                          <span 
                            style={{ 
                              display: 'inline-block',
                              padding: '6px 10px', 
                              backgroundColor: '#fff3cd', 
                              borderRadius: '4px',
                              color: '#856404',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              maxWidth: '100%',
                              wordWrap: 'break-word',
                              whiteSpace: 'normal',
                              lineHeight: '1.4'
                            }}
                            title={order.deliveryAddress.specialRequest}
                          >
                            📝 {order.deliveryAddress.specialRequest}
                          </span>
                        ) : (
                          <span style={{ color: '#a0aec0', fontSize: '0.85rem' }}>No instructions</span>
                        )}
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

        {activeSection === 'blogs' && (
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Blog Management</h2>
              <button 
                className="primary-button"
                onClick={() => {
                  resetBlogForm();
                  setShowBlogModal(true);
                }}
                style={{ 
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f97316',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                + Create New Blog
              </button>
            </div>

            {/* Blog Stats */}
            {blogStats && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
                marginBottom: '30px',
                padding: '0 2rem'
              }}>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <h3 style={{ fontSize: '32px', margin: '0 0 10px 0', color: '#f97316' }}>{blogStats.totalBlogs}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Total Blogs</p>
                </div>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <h3 style={{ fontSize: '32px', margin: '0 0 10px 0', color: '#f97316' }}>{blogStats.publishedBlogs}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Published</p>
                </div>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <h3 style={{ fontSize: '32px', margin: '0 0 10px 0', color: '#f97316' }}>{blogStats.draftBlogs}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Drafts</p>
                </div>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <h3 style={{ fontSize: '32px', margin: '0 0 10px 0', color: '#f97316' }}>{blogStats.totalViews}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Total Views</p>
                </div>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <h3 style={{ fontSize: '32px', margin: '0 0 10px 0', color: '#f97316' }}>{blogStats.totalLikes}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Total Likes</p>
                </div>
              </div>
            )}

            {/* Filters */}
            <div style={{ padding: '0 2rem 20px', display: 'flex', gap: '10px' }}>
              <select 
                value={blogFilters.status}
                onChange={(e) => setBlogFilters({ ...blogFilters, status: e.target.value, page: 1 })}
                style={{
                  padding: '10px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            {/* Blog List */}
            {blogsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>Loading blogs...</p>
              </div>
            ) : (
              <div style={{ padding: '0 2rem' }}>
                <table className="admin-table" style={{ width: '100%', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Title</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Category</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '15px', textAlign: 'center' }}>Views</th>
                      <th style={{ padding: '15px', textAlign: 'center' }}>Likes</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Published Date</th>
                      <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogs.map(blog => (
                      <tr key={blog._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '15px' }}>
                          <strong>{blog.title}</strong>
                          <br />
                          <small style={{ color: '#666' }}>{blog.excerpt.substring(0, 60)}...</small>
                        </td>
                        <td style={{ padding: '15px' }}>{blog.category}</td>
                        <td style={{ padding: '15px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: blog.isPublished ? '#d4edda' : '#fff3cd',
                            color: blog.isPublished ? '#155724' : '#856404'
                          }}>
                            {blog.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>{blog.views}</td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>{blog.likes}</td>
                        <td style={{ padding: '15px' }}>
                          {blog.publishedAt 
                            ? new Date(blog.publishedAt).toLocaleDateString()
                            : '-'
                          }
                        </td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button 
                              onClick={() => handleEditBlog(blog)}
                              style={{
                                padding: '6px 12px',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500'
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleTogglePublishBlog(blog._id)}
                              style={{
                                padding: '6px 12px',
                                background: blog.isPublished ? '#ffc107' : '#28a745',
                                color: blog.isPublished ? '#333' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500'
                              }}
                            >
                              {blog.isPublished ? 'Unpublish' : 'Publish'}
                            </button>
                            <button 
                              onClick={() => handleDeleteBlog(blog._id)}
                              style={{
                                padding: '6px 12px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500'
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
            <div style={{ padding: '2rem', maxWidth: '800px' }}>
              
              {/* Full Day Closure Section */}
              <div style={{ 
                background: 'linear-gradient(135deg, #fff5e6 0%, #ffe8cc 100%)',
                padding: '2rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                border: '2px solid #ffa500',
                boxShadow: '0 2px 8px rgba(255, 165, 0, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem' }}>{siteStatus.isOpen ? '✅' : '🚫'}</div>
                  <div>
                    <h3 style={{ margin: 0, color: '#d97706', fontSize: '1.5rem' }}>Full Day Closure</h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#92400e', fontSize: '0.9rem' }}>
                      For special occasions (holidays, maintenance, etc.)
                    </p>
                  </div>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#92400e' }}>
                    Closure Message:
                  </label>
                  <textarea
                    value={tempMessage}
                    onChange={(e) => setTempMessage(e.target.value)}
                    placeholder="Example: We are closed for a special occasion. We'll be back soon!"
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '2px solid #fbbf24',
                      borderRadius: '8px',
                      minHeight: '100px',
                      fontFamily: 'inherit',
                      fontSize: '1rem',
                      backgroundColor: 'white'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => updateSiteStatus(false)}
                    disabled={!siteStatus.isOpen}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      backgroundColor: !siteStatus.isOpen ? '#d1d5db' : '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: siteStatus.isOpen ? 'pointer' : 'not-allowed',
                      fontSize: '1rem',
                      boxShadow: siteStatus.isOpen ? '0 2px 4px rgba(220, 38, 38, 0.3)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    🚫 Close Site
                  </button>
                  <button
                    onClick={() => updateSiteStatus(true)}
                    disabled={siteStatus.isOpen}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      backgroundColor: siteStatus.isOpen ? '#d1d5db' : '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: !siteStatus.isOpen ? 'pointer' : 'not-allowed',
                      fontSize: '1rem',
                      boxShadow: !siteStatus.isOpen ? '0 2px 4px rgba(22, 163, 74, 0.3)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    ✅ Open Site
                  </button>
                </div>
              </div>
              
              {/* Daily Operating Hours Section */}
              <div style={{ 
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                padding: '2rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                border: '2px solid #10b981',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem' }}>⏰</div>
                  <div>
                    <h3 style={{ margin: 0, color: '#047857', fontSize: '1.5rem' }}>Daily Operating Hours</h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#065f46', fontSize: '0.9rem' }}>
                      Set your regular business hours
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    padding: '1rem',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: '2px solid #6ee7b7'
                  }}>
                    <input
                      type="checkbox"
                      checked={operatingHoursEnabled}
                      onChange={(e) => setOperatingHoursEnabled(e.target.checked)}
                      style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#10b981' }}
                    />
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: '#065f46' }}>
                      Enable Time Restrictions
                    </span>
                  </label>
                </div>

                {operatingHoursEnabled && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#065f46' }}>
                          Start Time:
                        </label>
                        <input
                          type="time"
                          value={tempOperatingHours.start}
                          onChange={(e) => setTempOperatingHours({ ...tempOperatingHours, start: e.target.value })}
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            border: '2px solid #6ee7b7',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            backgroundColor: 'white'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#065f46' }}>
                          End Time:
                        </label>
                        <input
                          type="time"
                          value={tempOperatingHours.end}
                          onChange={(e) => setTempOperatingHours({ ...tempOperatingHours, end: e.target.value })}
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            border: '2px solid #6ee7b7',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            backgroundColor: 'white'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#065f46' }}>
                        Outside Hours Message:
                      </label>
                      <textarea
                        value={tempOutsideHoursMessage}
                        onChange={(e) => setTempOutsideHoursMessage(e.target.value)}
                        placeholder="Example: We accept orders only between 12:00 PM to 11:00 PM. Please visit us during our operating hours!"
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '2px solid #6ee7b7',
                          borderRadius: '8px',
                          minHeight: '100px',
                          fontFamily: 'inherit',
                          fontSize: '1rem',
                          backgroundColor: 'white'
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={() => updateSiteStatus(siteStatus.isOpen)}
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 6px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                💾 Save All Settings
              </button>
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

      {/* Blog Modal */}
      {showBlogModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowBlogModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '10px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #dee2e6'
            }}>
              <h2 style={{ margin: 0 }}>{editingBlog ? 'Edit Blog' : 'Create New Blog'}</h2>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '32px',
                  cursor: 'pointer',
                  color: '#999'
                }}
                onClick={() => setShowBlogModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleBlogSubmit} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={blogFormData.title}
                    onChange={handleBlogInputChange}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Slug</label>
                  <input
                    type="text"
                    name="slug"
                    value={blogFormData.slug}
                    onChange={handleBlogInputChange}
                    placeholder="auto-generated-from-title"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Excerpt * (Max 200 chars)</label>
                <textarea
                  name="excerpt"
                  value={blogFormData.excerpt}
                  onChange={handleBlogInputChange}
                  maxLength={200}
                  rows={2}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', resize: 'vertical' }}
                />
                <small style={{ color: '#666' }}>{blogFormData.excerpt.length}/200</small>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Content *</label>
                <textarea
                  name="content"
                  value={blogFormData.content}
                  onChange={handleBlogInputChange}
                  rows={15}
                  required
                  placeholder="Write your blog content here..."
                  style={{ 
                    width: '100%', 
                    padding: '15px', 
                    border: '1px solid #ddd', 
                    borderRadius: '5px', 
                    resize: 'vertical',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Featured Image</label>
                
                {/* File Upload Input */}
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      border: '1px solid #ddd', 
                      borderRadius: '5px',
                      cursor: uploadingImage ? 'not-allowed' : 'pointer'
                    }}
                  />
                  {uploadingImage && (
                    <div style={{ marginTop: '8px', color: '#123f31', fontSize: '14px' }}>
                      ⏳ Uploading image...
                    </div>
                  )}
                </div>

                {/* Preview and Current Image */}
                {blogFormData.featuredImage && (
                  <div style={{ marginTop: '10px' }}>
                    <img 
                      src={blogFormData.featuredImage} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '150px', 
                        border: '2px solid #ddd', 
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }} 
                    />
                    <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                      Current: {blogFormData.featuredImage}
                    </div>
                  </div>
                )}
                
                <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                  📤 Upload an image (JPG, PNG, GIF, WebP) - Max 5MB
                </small>
              </div>

              <div style={{ fontSize: '18px', fontWeight: '600', margin: '25px 0 15px 0', paddingBottom: '10px', borderBottom: '2px solid #f97316' }}>
                SEO Settings
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Meta Title (Max 60 chars)</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={blogFormData.metaTitle}
                  onChange={handleBlogInputChange}
                  maxLength={60}
                  placeholder="Leave empty to use blog title"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
                <small style={{ color: '#666' }}>{blogFormData.metaTitle.length}/60</small>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Meta Description (Max 160 chars)</label>
                <textarea
                  name="metaDescription"
                  value={blogFormData.metaDescription}
                  onChange={handleBlogInputChange}
                  maxLength={160}
                  rows={2}
                  placeholder="Leave empty to use excerpt"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', resize: 'vertical' }}
                />
                <small style={{ color: '#666' }}>{blogFormData.metaDescription.length}/160</small>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Meta Keywords (comma-separated)</label>
                <input
                  type="text"
                  name="metaKeywords"
                  value={blogFormData.metaKeywords}
                  onChange={handleBlogInputChange}
                  placeholder="food, recipe, healthy eating, delivery"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>

              <div style={{ fontSize: '18px', fontWeight: '600', margin: '25px 0 15px 0', paddingBottom: '10px', borderBottom: '2px solid #f97316' }}>
                Additional Info
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Category</label>
                  <select
                    name="category"
                    value={blogFormData.category}
                    onChange={handleBlogInputChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                  >
                    <option value="bulk food">Bulk Food</option>
                    <option value="catering">Catering</option>
                    <option value="Food">Food</option>
                    <option value="Thali">Thali</option>
                    <option value="snack box">Snack Box</option>
                    <option value="meals">Meals</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Read Time (minutes)</label>
                  <input
                    type="number"
                    name="readTime"
                    value={blogFormData.readTime}
                    onChange={handleBlogInputChange}
                    min="1"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={blogFormData.tags}
                  onChange={handleBlogInputChange}
                  placeholder="healthy, vegan, quick meal"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Author</label>
                <input
                  type="text"
                  name="author"
                  value={blogFormData.author}
                  onChange={handleBlogInputChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={blogFormData.isPublished}
                    onChange={handleBlogInputChange}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: '600' }}>Publish immediately</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px 0', borderTop: '1px solid #dee2e6' }}>
                <button 
                  type="button" 
                  onClick={() => setShowBlogModal(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ddd',
                    background: 'white',
                    color: '#333',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    background: '#f97316',
                    color: 'white',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {editingBlog ? 'Update Blog' : 'Create Blog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}