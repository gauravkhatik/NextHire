import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude Clerk from Server Actions processing
  serverExternalPackages: ['@clerk/nextjs'],
};

export default nextConfig;
