import type { NextConfig } from "next";

const nextConfig = {
  devIndicators: {
    appIsrStatus: false,
  },
  // Silence Turbopack configurations error by declaring empty turbopack block
  turbopack: {},
  // Ignore the backend directory from webpack file watchers in development
  webpack: (config: any, { dev }: { dev: boolean }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.next/**",
          "**/backend/**"
        ],
      };
    }
    return config;
  },
} as any;

export default nextConfig;
