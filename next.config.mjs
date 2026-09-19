/** @type {import('next').NextConfig} */
const nextConfig = {
  // The LMS serves this app through its /learning rewrite. Prefix Next's
  // JavaScript and CSS assets as well so a proxied lesson hydrates using the
  // engine bundle, not the LMS bundle at /_next.
  assetPrefix: '/learning',
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
