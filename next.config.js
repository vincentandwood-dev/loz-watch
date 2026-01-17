/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Optimize images if we add any
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Optimize bundle
  experimental: {
    optimizePackageImports: ['leaflet', 'react-leaflet'],
  },
  // Security: Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error and warn for production debugging
    } : false,
  },
}

module.exports = nextConfig

