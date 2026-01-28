"use client";
import { useState, useEffect } from 'react';
import config, { buildApiUrl } from '../../../../config';
import './blogs.css';

export default function BlogsManagement() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', page: 1, limit: 20 });
  const [editingBlog, setEditingBlog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState(null);

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    fetchBlogs();
    fetchStats();
  }, [filters]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(buildApiUrl(`/api/admin/blogs?${queryParams}`));
      const data = await response.json();
      
      if (response.ok) {
        setBlogs(data.blogs || []);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/admin/blogs/stats/overview'));
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const blogData = {
        ...formData,
        metaKeywords: formData.metaKeywords.split(',').map(k => k.trim()).filter(k => k),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        readTime: parseInt(formData.readTime) || 5
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
        setShowModal(false);
        resetForm();
        fetchBlogs();
        fetchStats();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Error saving blog');
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
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
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      const response = await fetch(buildApiUrl(`/api/admin/blogs/${id}`), {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Blog deleted successfully!');
        fetchBlogs();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Error deleting blog');
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      const response = await fetch(buildApiUrl(`/api/admin/blogs/${id}/toggle-publish`), {
        method: 'PATCH'
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchBlogs();
        fetchStats();
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Error updating blog status');
    }
  };

  const resetForm = () => {
    setEditingBlog(null);
    setFormData({
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

  return (
    <div className="blogs-management">
      <div className="section-header">
        <h2>Blog Management</h2>
        <button 
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Create New Blog
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="blog-stats">
          <div className="stat-card">
            <h3>{stats.totalBlogs}</h3>
            <p>Total Blogs</p>
          </div>
          <div className="stat-card">
            <h3>{stats.publishedBlogs}</h3>
            <p>Published</p>
          </div>
          <div className="stat-card">
            <h3>{stats.draftBlogs}</h3>
            <p>Drafts</p>
          </div>
          <div className="stat-card">
            <h3>{stats.totalViews}</h3>
            <p>Total Views</p>
          </div>
          <div className="stat-card">
            <h3>{stats.totalLikes}</h3>
            <p>Total Likes</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <select 
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Blog List */}
      {loading ? (
        <p>Loading blogs...</p>
      ) : (
        <div className="blogs-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Views</th>
                <th>Likes</th>
                <th>Published Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map(blog => (
                <tr key={blog._id}>
                  <td>
                    <strong>{blog.title}</strong>
                    <br />
                    <small>{blog.excerpt.substring(0, 60)}...</small>
                  </td>
                  <td>{blog.category}</td>
                  <td>
                    <span className={`status-badge ${blog.isPublished ? 'published' : 'draft'}`}>
                      {blog.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{blog.views}</td>
                  <td>{blog.likes}</td>
                  <td>
                    {blog.publishedAt 
                      ? new Date(blog.publishedAt).toLocaleDateString()
                      : '-'
                    }
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(blog)}
                    >
                      Edit
                    </button>
                    <button 
                      className={`btn-toggle ${blog.isPublished ? 'unpublish' : 'publish'}`}
                      onClick={() => handleTogglePublish(blog._id)}
                    >
                      {blog.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(blog._id)}
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content blog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBlog ? 'Edit Blog' : 'Create New Blog'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="blog-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Slug *</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="auto-generated-from-title"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Excerpt * (Max 200 chars)</label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  maxLength="200"
                  rows="2"
                  required
                />
                <small>{formData.excerpt.length}/200</small>
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows="10"
                  required
                />
              </div>

              <div className="form-group">
                <label>Featured Image URL</label>
                <input
                  type="url"
                  name="featuredImage"
                  value={formData.featuredImage}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>

              <div className="form-section-title">SEO Settings</div>

              <div className="form-group">
                <label>Meta Title (Max 60 chars)</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  maxLength="60"
                  placeholder="Leave empty to use blog title"
                />
                <small>{formData.metaTitle.length}/60</small>
              </div>

              <div className="form-group">
                <label>Meta Description (Max 160 chars)</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  maxLength="160"
                  rows="2"
                  placeholder="Leave empty to use excerpt"
                />
                <small>{formData.metaDescription.length}/160</small>
              </div>

              <div className="form-group">
                <label>Meta Keywords (comma-separated)</label>
                <input
                  type="text"
                  name="metaKeywords"
                  value={formData.metaKeywords}
                  onChange={handleInputChange}
                  placeholder="food, recipe, healthy eating, delivery"
                />
              </div>

              <div className="form-section-title">Additional Info</div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="Food">Food</option>
                    <option value="Recipes">Recipes</option>
                    <option value="Healthy Living">Healthy Living</option>
                    <option value="Kitchen Tips">Kitchen Tips</option>
                    <option value="News">News</option>
                    <option value="Events">Events</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Read Time (minutes)</label>
                  <input
                    type="number"
                    name="readTime"
                    value={formData.readTime}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="healthy, vegan, quick meal"
                />
              </div>

              <div className="form-group">
                <label>Author</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleInputChange}
                  />
                  Publish immediately
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
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
