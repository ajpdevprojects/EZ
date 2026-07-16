import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ez/ui", "@ez/lib", "@ez/types"],
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
