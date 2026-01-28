"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import config, { buildApiUrl } from '../../config/index';
import './blog.css';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  author: string;
  readTime: number;
  likes: number;
  views: number;
  publishedAt: string;
  isPublished: boolean;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 9,
    category: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    totalBlogs: 0
  });
  const [popularBlogs, setPopularBlogs] = useState<Blog[]>([]);

  // Convert Google Drive link to direct image URL
  const convertGoogleDriveLink = (url: string) => {
    if (!url) return url;
    
    // Check if it's a Google Drive link and extract the file ID
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      const fileId = driveMatch[1];
      // Try the uc endpoint which generally works better
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    
    // Check for id= parameter format
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
    }
    
    return url;
  };

  useEffect(() => {
    fetchBlogs();
    fetchPopularBlogs();
  }, [filters]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await fetch(buildApiUrl(`/api/blog/public?${queryParams}`));
      const data = await response.json();
      
      if (response.ok) {
        setBlogs(data.blogs || []);
        setPagination({
          totalPages: data.totalPages,
          currentPage: data.currentPage,
          totalBlogs: data.totalBlogs
        });
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularBlogs = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/blog/public/popular/top'));
      const data = await response.json();
      
      if (response.ok) {
        setPopularBlogs(data);
      }
    } catch (error) {
      console.error('Error fetching popular blogs:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="blog-page">
      {/* Hero Section */}
      <div className="blog-hero">
        <div className="blog-hero-content">
          <h1>The Quisine Blog</h1>
          <p>Discover delicious recipes, healthy eating tips, and culinary inspiration</p>
        </div>
      </div>

      <div className="blog-container">
        <div className="blog-main">
          {/* Blog Grid */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading blogs...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="no-blogs">
              <h3>No blogs found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <>
              <div className="blog-grid">
                {blogs.map(blog => (
                  <article key={blog._id} className="blog-card">
                    {blog.featuredImage && (
                      <div className="blog-image">
                        <img 
                          src={convertGoogleDriveLink(blog.featuredImage)} 
                          alt={blog.title}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="blog-content">
                      <div className="blog-meta">
                        <span className="blog-category">{blog.category}</span>
                        <span className="blog-date">
                          {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <h2>{blog.title}</h2>
                      <p>{blog.excerpt}</p>
                      <div className="blog-footer">
                        <div className="blog-stats">
                          <span>👁️ {blog.views}</span>
                          <span>❤️ {blog.likes}</span>
                          <span>⏱️ {blog.readTime} min read</span>
                        </div>
                        <Link href={`/blog/${blog.slug}`} className="read-more">
                          Read More →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                  >
                    Previous
                  </button>
                  
                  <div className="page-numbers">
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        className={filters.page === i + 1 ? 'active' : ''}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === pagination.totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="blog-sidebar">
          {/* Popular Posts */}
          {popularBlogs.length > 0 && (
            <div className="sidebar-section">
              <h3>Popular Posts</h3>
              <div className="popular-posts">
                {popularBlogs.map(blog => (
                  <Link 
                    key={blog._id} 
                    href={`/blog/${blog.slug}`}
                    className="popular-post"
                  >
                    {blog.featuredImage && (
                      <img 
                        src={convertGoogleDriveLink(blog.featuredImage)} 
                        alt={blog.title}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <h4>{blog.title}</h4>
                      <div className="popular-stats">
                        <span>❤️ {blog.likes}</span>
                        <span>👁️ {blog.views}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
