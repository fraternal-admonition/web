import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure allowed image domains for Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mlbhsippcnzeybheudhu.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Increase device sizes for better image optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
};

export default nextConfig;
