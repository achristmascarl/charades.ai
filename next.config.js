/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})
const nextConfig = {
  publicRuntimeConfig: {
    NODE_ENV: "production"
  },
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      "s3.us-east-2.amazonaws.com",
    ],
    unoptimized: true,
  },
}

module.exports = withBundleAnalyzer(nextConfig);
