import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,

    // CRITICAL: Creates standalone build with minimal dependencies
    output: 'standalone',
    
    // Compress responses
    compress: true,

    // Production optimizations
    productionBrowserSourceMaps: false, // Disable source maps in prod

    typescript: {
        ignoreBuildErrors: true,
    },

    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },

    poweredByHeader: false,
};

export default nextConfig;