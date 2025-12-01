import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Experimental features for better API route handling
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
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

  // Webpack configuration to handle jsdom and other server-side dependencies
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore canvas and jsdom CSS files during build
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'commonjs canvas',
      });
      
      // Ignore missing CSS files from jsdom
      config.resolve.alias = {
        ...config.resolve.alias,
        'jsdom/lib/jsdom/browser/default-stylesheet.css': false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
