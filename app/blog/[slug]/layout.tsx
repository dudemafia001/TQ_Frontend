import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import config, { buildApiUrl } from '../../../config/index';

interface Props {
  params: Promise<{ slug: string }>;
}

// Generate dynamic metadata for each blog post
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const response = await fetch(buildApiUrl(`/api/blog/public/${slug}`), {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return {
        title: 'Blog Not Found - The Quisine'
      };
    }

    const blog = await response.json();

    return {
      title: blog.metaTitle || `${blog.title} - The Quisine Blog`,
      description: blog.metaDescription || blog.excerpt,
      keywords: blog.metaKeywords || [],
      authors: [{ name: blog.author }],
      openGraph: {
        title: blog.metaTitle || blog.title,
        description: blog.metaDescription || blog.excerpt,
        type: 'article',
        url: `https://thequisine.com/blog/${blog.slug}`,
        publishedTime: blog.publishedAt,
        authors: [blog.author],
        tags: blog.tags || [],
        images: blog.featuredImage ? [
          {
            url: blog.featuredImage,
            width: 1200,
            height: 630,
            alt: blog.title
          }
        ] : []
      },
      twitter: {
        card: 'summary_large_image',
        title: blog.metaTitle || blog.title,
        description: blog.metaDescription || blog.excerpt,
        images: blog.featuredImage ? [blog.featuredImage] : []
      },
      alternates: {
        canonical: `https://thequisine.com/blog/${blog.slug}`
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Blog - The Quisine'
    };
  }
}

export default function BlogDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
