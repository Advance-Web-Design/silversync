/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for functions
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('firebase/app', 'firebase/firestore');
    }
    config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    return config;
  },
};

export default nextConfig;
