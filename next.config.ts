import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The contract template is a .docx read at runtime with fs from
   * process.cwd(). Nothing imports it, so Next's dependency tracing cannot see
   * it and would not deploy it — the classic "works in dev, ENOENT in
   * production" failure, because dev has the whole repo on disk.
   *
   * Naming it here ships it alongside every server function that might read it.
   * Keeping it out of /public matters: the template is an internal artefact,
   * not a public asset, and should not be downloadable by URL.
   */
  outputFileTracingIncludes: {
    "/*": ["src/templates/**/*"],
  },
};

export default nextConfig;
