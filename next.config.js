/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
}

module.exports = nextConfig
