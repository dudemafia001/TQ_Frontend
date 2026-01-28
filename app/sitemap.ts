import { MetadataRoute } from 'next';
import config, { buildApiUrl } from '../config/index';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://thequisine.com';

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7
    },
    {
      url: `${baseUrl}/healthy`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }
  ];

  // Fetch blog posts for dynamic sitemap
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const response = await fetch(buildApiUrl('/api/blog/public?limit=1000'), {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      blogPages = data.blogs.map((blog: any) => ({
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: new Date(blog.updatedAt || blog.publishedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7
      }));
    }
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error);
  }

  return [...staticPages, ...blogPages];
}
