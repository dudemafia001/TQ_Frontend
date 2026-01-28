"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import config, { buildApiUrl } from '../../../config/index';
import './blogDetail.css';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category: string;
  tags?: string[];
  author: string;
  readTime: number;
  likes: number;
  views: number;
  publishedAt: string;
  updatedAt?: string;
  likedBy?: string[];
  metaKeywords?: string[];
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [userId, setUserId] = useState('');

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
    // Generate or retrieve user ID for like tracking
    let id = localStorage.getItem('blogUserId');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('blogUserId', id);
    }
    setUserId(id);

    if (slug) {
      fetchBlog();
      fetchRelatedBlogs();
    }
  }, [slug]);

  useEffect(() => {
    if (blog && userId) {
      setHasLiked(blog.likedBy?.includes(userId) || false);
    }
  }, [blog, userId]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`/api/blog/public/${slug}`));
      const data = await response.json();
      
      if (response.ok) {
        setBlog(data);
      } else {
        console.error('Blog not found');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/blog/public/${slug}/related`));
      const data = await response.json();
      
      if (response.ok) {
        setRelatedBlogs(data);
      }
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  };

  const handleLike = async () => {
    if (!userId) return;

    try {
      const response = await fetch(buildApiUrl(`/api/blog/public/${slug}/like`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (response.ok) {
        setBlog(prev => prev ? { ...prev, likes: data.likes } : null);
        setHasLiked(data.hasLiked);
      }
    } catch (error) {
      console.error('Error liking blog:', error);
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = blog?.title || '';

    const shareUrls: { [key: string]: string } = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
      instagram: `https://www.instagram.com/` // Instagram doesn't support direct sharing via URL
    };

    if (platform === 'instagram') {
      // For Instagram, open the app/profile
      window.open('https://www.instagram.com/', '_blank');
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="blog-detail-loading">
        <div className="spinner"></div>
        <p>Loading blog...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="blog-not-found">
        <h1>Blog Not Found</h1>
        <p>The blog post you're looking for doesn't exist or has been removed.</p>
        <Link href="/blog" className="back-button">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  // Structured Data for SEO (Schema.org)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "description": blog.excerpt,
    "image": blog.featuredImage || "",
    "datePublished": blog.publishedAt,
    "dateModified": blog.updatedAt || blog.publishedAt,
    "author": {
      "@type": "Person",
      "name": blog.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "The Quisine",
      "logo": {
        "@type": "ImageObject",
        "url": "https://thequisine.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://thequisine.com/blog/${blog.slug}`
    },
    "keywords": blog.metaKeywords?.join(', ') || "",
    "articleSection": blog.category,
    "wordCount": blog.content.split(' ').length,
    "timeRequired": `PT${blog.readTime}M`,
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": blog.likes
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ReadAction",
        "userInteractionCount": blog.views
      }
    ]
  };

  return (
    <>
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="blog-detail-page">
      <div className="blog-detail-container">
        {/* Back Button */}
        <Link href="/blog" className="back-link">
          ← Back to Blog
        </Link>

        {/* Article */}
        <article className="blog-article">
          {/* Header */}
          <header className="article-header">
            <div className="article-meta">
              <span className="article-category">{blog.category}</span>
              <span className="article-date">
                {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            
            <h1>{blog.title}</h1>
            
            <div className="article-info">
              <span>By {blog.author}</span>
              <span>•</span>
              <span>{blog.readTime} min read</span>
              <span>•</span>
              <span>👁️ {blog.views} views</span>
            </div>
          </header>

          {/* Featured Image */}
          {blog.featuredImage && (
            <div className="article-image">
              <img 
                src={convertGoogleDriveLink(blog.featuredImage)} 
                alt={blog.title}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="article-content">
            {blog.content.split('\n').map((paragraph, index) => (
              paragraph.trim() && <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="article-tags">
              <h3>Tags:</h3>
              <div className="tags-list">
                {blog.tags.map((tag, index) => (
                  <span key={index} className="tag">#{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="article-actions">
            <button 
              className={`like-button ${hasLiked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              {hasLiked ? '❤️' : '🤍'} {blog.likes} Likes
            </button>

            <div className="share-buttons">
              <span>Share:</span>
              <button onClick={() => handleShare('facebook')} title="Share on Facebook" className="share-facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button onClick={() => handleShare('whatsapp')} title="Share on WhatsApp" className="share-whatsapp">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>
              <button onClick={() => handleShare('instagram')} title="Share on Instagram" className="share-instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                </svg>
              </button>
            </div>
          </div>
        </article>

        {/* Related Blogs */}
        {relatedBlogs.length > 0 && (
          <section className="related-blogs">
            <h2>Related Articles</h2>
            <div className="related-grid">
              {relatedBlogs.map(relatedBlog => (
                <Link 
                  key={relatedBlog._id} 
                  href={`/blog/${relatedBlog.slug}`}
                  className="related-card"
                >
                  {relatedBlog.featuredImage && (
                    <img src={relatedBlog.featuredImage} alt={relatedBlog.title} />
                  )}
                  <div className="related-content">
                    <span className="related-category">{relatedBlog.category}</span>
                    <h3>{relatedBlog.title}</h3>
                    <p>{relatedBlog.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
    </>
  );
}
