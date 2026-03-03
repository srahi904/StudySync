/** @type {import('next').NextConfig} */
const nextConfig = {
  // ═══ PERFORMANCE ═══
  reactStrictMode: true,

  // Turbopack for dev (50% faster)
  turbopack: {},
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },

  // ═══ COMPILER OPTIMIZATIONS ═══
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },


  // ═══ IMAGES (Cloudinary + OAuth providers) ═══
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000, // 1 year
  },

  // ═══ SERVER EXTERNAL PACKAGES ═══
  serverExternalPackages: ['pdf-parse', 'mammoth'],

  // ═══ BUNDLE SIZE OPTIMIZATION ═══
  webpack: (config, { dev, isServer }) => {
    // Canvas alias for pdf-parse
    config.resolve.alias.canvas = false;

    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          react: {
            name: 'react',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            priority: 20,
          },
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
          },
        },
      };
    }
    return config;
  },

  // ═══ HEADERS FOR CACHING & SECURITY ═══
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=120' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
