/** @type {import('next').NextConfig} */
const nextConfig = {
   output: 'export',
   experimental: {
    appDir: true, // if using the app directory
  },
   basePath: '/static-landingpage', // Replace with your GitHub repository name
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
      },
};

export default nextConfig;
