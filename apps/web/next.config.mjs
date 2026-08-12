/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@asset-mgmt/shared"],
  output: "standalone"
};

export default nextConfig;
