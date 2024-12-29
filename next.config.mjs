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


import withNextConfig from '@netlify/plugin-nextjs';

const config = withNextConfig({
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
});

export default config;

