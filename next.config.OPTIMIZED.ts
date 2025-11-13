import type { NextConfig } from "next";

/**
 * Hype-Connect Next.js Configuration
 * Optimized for Firebase App Hosting
 */
const nextConfig: NextConfig = {
  // Experimental features for optimization
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*", "lucide-react"],
  },

  // Build configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Output optimization for Firebase
  output: "standalone", // Self-contained deployment package
  outputFileTracing: [], // Reduce deployment size
  swcMinify: true, // Use SWC for minification (faster)

  // Image optimization
  images: {
    unoptimized: false, // Let Firebase handle optimization
    formats: ["image/webp", "image/avif"], // Modern formats
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        port: "/v1/create-qr-code/**",
      },
    ],
  },

  // Development configuration
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    // Cloud Workstations support
    "6000-firebase-studio-1762199227866.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev",
  ],

  // Security headers (will be applied by Firebase)
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  redirects: async () => {
    return [
      // Redirect HTTP to HTTPS (handled by Firebase)
      // Add your custom redirects here
    ];
  },

  // Rewrites for API routes
  rewrites: async () => {
    return {
      beforeFiles: [
        // Add custom rewrites here
      ],
      afterFiles: [
        // Fallback to 404 page
        {
          source: "/:path*",
          destination: "/404",
        },
      ],
    };
  },
};

export default nextConfig;
