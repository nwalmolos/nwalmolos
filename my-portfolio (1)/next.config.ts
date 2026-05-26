import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages 部署需要静态导出
  output: "export",

  // 如果你的 GitHub 仓库名不是 username.github.io，
  // 需要设置 basePath 为你的仓库名，例如：
  // basePath: "/my-portfolio",
  // 同时取消注释下面的 trailingSlash
  // trailingSlash: true,

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
