import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages 部署需要静态导出
  output: "export",

  // 仓库名 nwalmolos → basePath 必须设为 /nwalmolos
  // 这样所有静态资源路径才会正确（CSS/JS/图片等）
  basePath: "/nwalmolos",
  trailingSlash: true,

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // 图片优化在静态导出时不可用，需要禁用
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
