/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@deployx/shared', '@deployx/ui'],
  reactStrictMode: true,
};

export default nextConfig;
