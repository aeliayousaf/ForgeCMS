/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@forgecms/blocks", "@forgecms/shared"],
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    // Workspace packages use NodeNext-style ".js" specifiers that point at
    // TypeScript sources; teach webpack to resolve them.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
  async rewrites() {
    // In local dev (no nginx) proxy /api to the NestJS server directly.
    const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
