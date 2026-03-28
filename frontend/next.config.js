/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1:2026", "localhost:2026"],
  webpack: (webpackConfig, { dev }) => {
    if (dev) {
      const existingIgnored = Array.isArray(webpackConfig.watchOptions?.ignored)
        ? webpackConfig.watchOptions.ignored
        : webpackConfig.watchOptions?.ignored
          ? [webpackConfig.watchOptions.ignored]
          : [];
      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,
        ignored: [
          ...existingIgnored,
          "**/.next/**",
          "**/logs/**",
          "**/.run/**",
          "**/*.log",
        ],
      };
    }
    return webpackConfig;
  },
};

export default config;
