import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/v1/create-qr-code/**',
      }
    ],
  },
  // The 'allowedDevOrigins' option has been moved out of 'experimental'
  // as of Next.js 14.2 and is now a top-level configuration.
  // This is necessary to allow cross-origin requests from the development
  // environment and prevent security errors in the browser.
  allowedDevOrigins: [
    '6000-firebase-studio-1762199227866.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev',
  ]
};

export default nextConfig;
