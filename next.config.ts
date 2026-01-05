import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export but handle admin pages specially
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        pathname: '/uc/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Skip pre-rendering for admin pages that need dynamic behavior
  experimental: {
    // This helps with client-side routing in static exports
  }
};

export default nextConfig;
