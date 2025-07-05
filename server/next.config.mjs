/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip API route analysis during build
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('firebase/app', 'firebase/firestore');
    }
    config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    return config;
  },
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
};

export default nextConfig;