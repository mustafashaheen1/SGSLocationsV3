/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'd2tn1m6g7lc8t8.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'sgs-locations-images.s3.us-west-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'imagelocations-laravel.s3.us-west-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.s3.*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    unoptimized: false,
  },
};

module.exports = nextConfig;
