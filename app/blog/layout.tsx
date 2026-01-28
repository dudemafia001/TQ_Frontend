import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog - The Quisine | Food Recipes, Kitchen Tips & Healthy Living',
  description: 'Discover delicious recipes, healthy eating tips, kitchen hacks, and culinary inspiration from The Quisine. Read our daily blog for food lovers and home cooks.',
  keywords: [
    'food blog',
    'recipe blog',
    'healthy eating',
    'kitchen tips',
    'cooking blog',
    'food delivery',
    'The Quisine blog',
    'culinary tips',
    'meal ideas',
    'nutrition advice'
  ],
  openGraph: {
    title: 'The Quisine Blog - Food Recipes & Kitchen Tips',
    description: 'Discover delicious recipes, healthy eating tips, and culinary inspiration',
    type: 'website',
    url: 'https://thequisine.com/blog',
    siteName: 'The Quisine',
    images: [
      {
        url: '/og-blog.jpg',
        width: 1200,
        height: 630,
        alt: 'The Quisine Blog'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Quisine Blog - Food Recipes & Kitchen Tips',
    description: 'Discover delicious recipes, healthy eating tips, and culinary inspiration',
    images: ['/og-blog.jpg']
  },
  alternates: {
    canonical: 'https://thequisine.com/blog'
  }
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
