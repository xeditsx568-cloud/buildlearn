import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

import "./src/env"; // Validate env vars when Next.js loads config (lint/build/dev)

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Avoid incorrect workspace root when a lockfile exists in a parent directory
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
