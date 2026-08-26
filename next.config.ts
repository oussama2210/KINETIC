import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native-binary packages must NOT be bundled — @ffmpeg-installer/ffmpeg
  // resolves its platform binary via dynamic require() at runtime, which
  // webpack cannot statically trace.
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg", "fluent-ffmpeg"],

  // Remote patterns for video thumbnails, avatars, and cloud media
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "commondatastorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },

  // Headers for cross-origin video streaming and media playback
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With, Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
