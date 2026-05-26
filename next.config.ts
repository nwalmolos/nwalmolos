import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages 部署需要静态导出
  output: "export",

  // basePath 动态切换：
  //   GitHub Pages: 设环境变量 NEXT_BASE_PATH=/nwalmolos
  //   Vercel / 本地预览: 不设该变量，默认为空（根路径部署）
  basePath: process.env.NEXT_BASE_PATH || "",

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
