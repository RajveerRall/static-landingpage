// /** @type {import('next').NextConfig} */
// const nextConfig = {
//    output: 'export',
//     eslint: {
//         // Warning: This allows production builds to successfully complete even if
//         // your project has ESLint errors.
//         ignoreDuringBuilds: true,
//       },
// };

// export default nextConfig;


const withNextConfig = require('@netlify/plugin-nextjs');

module.exports = withNextConfig({
  reactStrictMode: true,
  output: 'export',
  experimental: {
    appDir: true,
  },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
      },
});
