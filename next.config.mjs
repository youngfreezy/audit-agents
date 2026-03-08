/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/audit/*": ["./node_modules/@sparticuz/chromium/bin/**"],
    },
  },
};

export default nextConfig;
