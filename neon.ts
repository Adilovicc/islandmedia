import { defineConfig } from "@neon/config/v1";

/**
 * Neon infrastructure as code.
 *
 * Object storage branches with the database, so a preview or test branch gets a
 * consistent snapshot of BOTH the rows and the files they reference — which
 * matters here because a JobProof row is meaningless without its photo.
 *
 * Both buckets are private. A contract document and a fitter's proof of posting
 * are tenant-scoped: they are served through a route handler that checks the
 * session's clientId first, never by handing out an anonymously readable URL.
 */
export default defineConfig({
  preview: {
    buckets: {
      // Generated contract .docx files. Written once at issue, then frozen.
      documents: { access: "private" },
      // Fitter photo and video proof of posting.
      proofs: { access: "private" },
    },
  },
});
