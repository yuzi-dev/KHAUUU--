/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  images: {
    domains: ['localhost', 'your-production-domain.com'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  
  // Remove these unsafe settings for production:
  // eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true },
}

module.exports = nextConfig