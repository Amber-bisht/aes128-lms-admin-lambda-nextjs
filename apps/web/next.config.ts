import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: '/admin/user',
        destination: '/admin/users',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
