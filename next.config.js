/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    config.externals.push({
      '@zetachain/toolkit': 'commonjs @zetachain/toolkit',
      '@ton-api/client': 'commonjs @ton-api/client',
      '@tonconnect/sdk': 'commonjs @tonconnect/sdk',
      '@ton/core': 'commonjs @ton/core',
    });
    return config;
  },
};

module.exports = nextConfig;